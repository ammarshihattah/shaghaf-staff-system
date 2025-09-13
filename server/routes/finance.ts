import express from 'express';
import { pool } from '../index';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all invoices for user's branch
router.get('/invoices', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const branchId = req.user?.role === 'admin' ? req.query.branch_id || req.user.branch_id : req.user?.branch_id;
    
    const result = await pool.query(
      `SELECT i.*, c.name as client_name
       FROM invoices i
       LEFT JOIN clients c ON i.client_id = c.id
       WHERE i.branch_id = $1
       ORDER BY i.created_at DESC`,
      [branchId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create invoice
router.post('/invoices', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const { client_id, booking_id, amount, tax_amount, due_date, notes, items, payment_status, remaining_balance_action } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;
    const total_amount = amount + (tax_amount || 0);

    const result = await pool.query(
      `INSERT INTO invoices (branch_id, client_id, booking_id, invoice_number, amount, tax_amount, total_amount, due_date, notes, created_by, payment_status, remaining_balance_action) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [req.user?.branch_id, client_id, booking_id, invoiceNumber, amount, tax_amount || 0, total_amount, due_date, notes, req.user?.id, payment_status || 'pending', remaining_balance_action || 'none']
    );

    const newInvoice = result.rows[0];

    // Insert invoice items if provided
    if (items && items.length > 0) {
      const itemValues = items.map((item: any) => `('${newInvoice.id}', '${item.item_type}', ${item.related_id ? `'${item.related_id}'` : 'NULL'}, ${item.quantity}, ${item.unit_price}, ${item.total_price}, ${item.individual_name ? `'${item.individual_name}'` : 'NULL'}, ${item.is_split || false})`).join(',');
      await pool.query(
        `INSERT INTO invoice_items (invoice_id, item_type, related_id, quantity, unit_price, total_price, individual_name, is_split)
         VALUES ${itemValues}`
      );
    }

    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update invoice status
router.put('/invoices/:id/status', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if invoice exists and user has permission
    const invoiceCheck = await pool.query('SELECT branch_id FROM invoices WHERE id = $1', [id]);
    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (req.user?.role !== 'admin' && req.user?.branch_id !== invoiceCheck.rows[0].branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const paid_date = status === 'paid' ? new Date() : null;

    const result = await pool.query(
      'UPDATE invoices SET status = $1, paid_date = $2 WHERE id = $3 RETURNING *',
      [status, paid_date, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add item to invoice
router.post('/invoices/:id/items', authenticateToken, requireRole(['admin', 'manager', 'reception']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { item_type, related_id, quantity, unit_price, individual_name } = req.body;

    if (!item_type || !quantity || !unit_price) {
      return res.status(400).json({ error: 'Item type, quantity, and unit price are required' });
    }

    const invoiceCheck = await pool.query('SELECT branch_id FROM invoices WHERE id = $1', [id]);
    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (req.user?.role !== 'admin' && req.user?.branch_id !== invoiceCheck.rows[0].branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const total_price = quantity * unit_price;

    const result = await pool.query(
      `INSERT INTO invoice_items (invoice_id, item_type, related_id, quantity, unit_price, total_price, individual_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, item_type, related_id, quantity, unit_price, total_price, individual_name]
    );

    // Update invoice total amount
    await pool.query(
      'UPDATE invoices SET amount = amount + $1, total_amount = total_amount + $1 WHERE id = $2',
      [total_price, id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add item to invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Split item from invoice to a new invoice
router.post('/invoices/:invoiceId/items/:itemId/split', authenticateToken, requireRole(['admin', 'manager', 'reception']), async (req: AuthRequest, res) => {
  try {
    const { invoiceId, itemId } = req.params;

    const invoiceItemResult = await pool.query('SELECT * FROM invoice_items WHERE id = $1 AND invoice_id = $2', [itemId, invoiceId]);
    if (invoiceItemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice item not found in this invoice' });
    }
    const itemToSplit = invoiceItemResult.rows[0];

    const originalInvoiceResult = await pool.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
    if (originalInvoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Original invoice not found' });
    }
    const originalInvoice = originalInvoiceResult.rows[0];

    if (req.user?.role !== 'admin' && req.user?.branch_id !== originalInvoice.branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create new invoice for the split item
    const newInvoiceNumber = `INV-${Date.now()}-SPLIT`;
    const newInvoiceResult = await pool.query(
      `INSERT INTO invoices (branch_id, client_id, invoice_number, amount, tax_amount, total_amount, due_date, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [originalInvoice.branch_id, originalInvoice.client_id, newInvoiceNumber, itemToSplit.total_price, 0, itemToSplit.total_price, originalInvoice.due_date, `Split from invoice ${originalInvoice.invoice_number}`, req.user?.id]
    );
    const newInvoice = newInvoiceResult.rows[0];

    // Update the original invoice item to point to the new invoice and mark as split
    await pool.query(
      'UPDATE invoice_items SET invoice_id = $1, is_split = TRUE WHERE id = $2',
      [newInvoice.id, itemId]
    );

    // Recalculate original invoice total
    await pool.query('UPDATE invoices SET amount = amount - $1, total_amount = total_amount - $1 WHERE id = $2', [itemToSplit.total_price, invoiceId]);

    res.status(201).json({ message: 'Item split successfully', newInvoice });
  } catch (error) {
    console.error('Split item from invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all expenses for user's branch
router.get('/expenses', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const branchId = req.user?.role === 'admin' ? req.query.branch_id || req.user.branch_id : req.user?.branch_id;
    
    const result = await pool.query(
      `SELECT e.*, u.name as created_by_name, a.name as approved_by_name
       FROM expenses e
       JOIN users u ON e.created_by = u.id
       LEFT JOIN users a ON e.approved_by = a.id
       WHERE e.branch_id = $1
       ORDER BY e.expense_date DESC`,
      [branchId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create expense
router.post('/expenses', authenticateToken, requireRole(['admin', 'manager', 'employee']), async (req: AuthRequest, res) => {
  try {
    const { category, description, amount, expense_date, receipt_url } = req.body;

    if (!category || !description || !amount || !expense_date) {
      return res.status(400).json({ error: 'Category, description, amount, and expense date are required' });
    }

    const result = await pool.query(
      'INSERT INTO expenses (branch_id, category, description, amount, expense_date, receipt_url, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user?.branch_id, category, description, amount, expense_date, receipt_url, req.user?.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve expense
router.put('/expenses/:id/approve', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if expense exists and user has permission
    const expenseCheck = await pool.query('SELECT branch_id FROM expenses WHERE id = $1', [id]);
    if (expenseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (req.user?.role !== 'admin' && req.user?.branch_id !== expenseCheck.rows[0].branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'UPDATE expenses SET approved_by = $1 WHERE id = $2 RETURNING *',
      [req.user?.id, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;