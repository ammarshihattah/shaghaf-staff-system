import express from 'express';
import { pool } from '../index';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all purchase orders for user's branch
router.get('/', authenticateToken, requireRole(['admin', 'manager', 'employee']), async (req: AuthRequest, res) => {
  try {
    if (pool) {
      try {
        const branchId = req.user?.role === 'admin' ? req.query.branch_id || req.user.branch_id : req.user?.branch_id;
        
        const result = await pool.query(
          `SELECT po.*, s.name as supplier_name, s.contact_person, u.name as created_by_name
           FROM purchase_orders po
           LEFT JOIN suppliers s ON po.supplier_id = s.id
           LEFT JOIN users u ON po.created_by = u.id
           WHERE po.branch_id = $1
           ORDER BY po.created_at DESC`,
          [branchId]
        );

        // Fetch items for each purchase order
        const ordersWithItems = await Promise.all(
          result.rows.map(async (order) => {
            const itemsResult = await pool.query(
              `SELECT poi.*, p.name as product_name, p.category as product_category
               FROM purchase_order_items poi
               LEFT JOIN products p ON poi.product_id = p.id
               WHERE poi.purchase_order_id = $1`,
              [order.id]
            );
            return { ...order, items: itemsResult.rows };
          })
        );

        res.json(ordersWithItems);
      } catch (dbError) {
        console.warn('Database query failed, returning empty array:', dbError.message);
        res.json([]);
      }
    } else {
      // No database available, return empty array
      res.json([]);
    }
  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.json([]);
  }
});

// Get single purchase order
router.get('/:id', authenticateToken, requireRole(['admin', 'manager', 'employee']), async (req: AuthRequest, res) => {
  try {
    if (pool) {
      try {
        const { id } = req.params;
        
        const orderResult = await pool.query(
          `SELECT po.*, s.name as supplier_name, s.contact_person, s.phone as supplier_phone, s.email as supplier_email
           FROM purchase_orders po
           LEFT JOIN suppliers s ON po.supplier_id = s.id
           WHERE po.id = $1`,
          [id]
        );

        if (orderResult.rows.length === 0) {
          return res.status(404).json({ error: 'Purchase order not found' });
        }

        const order = orderResult.rows[0];
        
        // Check access permissions
        if (req.user?.role !== 'admin' && req.user?.branch_id !== order.branch_id) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Fetch items for this purchase order
        const itemsResult = await pool.query(
          `SELECT poi.*, p.name as product_name, p.category as product_category
           FROM purchase_order_items poi
           LEFT JOIN products p ON poi.product_id = p.id
           WHERE poi.purchase_order_id = $1`,
          [id]
        );

        res.json({ ...order, items: itemsResult.rows });
      } catch (dbError) {
        console.warn('Database query failed:', dbError.message);
        res.status(404).json({ error: 'Purchase order not found' });
      }
    } else {
      res.status(404).json({ error: 'Purchase order not found' });
    }
  } catch (error) {
    console.error('Get purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create purchase order
router.post('/', authenticateToken, requireRole(['admin', 'manager', 'employee']), async (req: AuthRequest, res) => {
  try {
    if (pool) {
      try {
        const { supplier_id, expected_delivery_date, notes, items } = req.body;

        if (!supplier_id) {
          return res.status(400).json({ error: 'Supplier ID is required' });
        }

        const branchId = req.user?.role === 'admin' ? req.body.branch_id || req.user.branch_id : req.user?.branch_id;

        // Generate order number
        const orderNumber = `PO-${Date.now()}`;
        
        // Calculate total amount from items
        const totalAmount = Array.isArray(items) ? items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_cost), 0) : 0;

        const result = await pool.query(
          `INSERT INTO purchase_orders (branch_id, supplier_id, order_number, status, total_amount, expected_delivery_date, notes, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [branchId, supplier_id, orderNumber, 'draft', totalAmount, expected_delivery_date, notes, req.user?.id]
        );

        const newOrder = result.rows[0];

        // Insert purchase order items if provided
        if (Array.isArray(items) && items.length > 0) {
          for (const item of items) {
            await pool.query(
              `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost, total_cost)
               VALUES ($1, $2, $3, $4, $5)`,
              [newOrder.id, item.product_id, item.quantity, item.unit_cost, item.quantity * item.unit_cost]
            );
          }
        }

        res.status(201).json(newOrder);
      } catch (dbError) {
        console.error('Database operation failed:', dbError.message);
        res.status(500).json({ error: 'Database operation failed' });
      }
    } else {
      // Mock response when no database
      const newOrder = {
        id: Date.now().toString(),
        branch_id: req.user?.branch_id,
        order_number: `PO-${Date.now()}`,
        status: 'draft',
        total_amount: 0,
        created_by: req.user?.id,
        created_at: new Date().toISOString()
      };
      res.status(201).json(newOrder);
    }
  } catch (error) {
    console.error('Create purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update purchase order
router.put('/:id', authenticateToken, requireRole(['admin', 'manager', 'employee']), async (req: AuthRequest, res) => {
  try {
    if (pool) {
      try {
        const { id } = req.params;
        const { supplier_id, expected_delivery_date, actual_delivery_date, notes, items } = req.body;

        // Check if purchase order exists and user has permission
        const orderCheck = await pool.query('SELECT branch_id FROM purchase_orders WHERE id = $1', [id]);
        if (orderCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Purchase order not found' });
        }

        if (req.user?.role !== 'admin' && req.user?.branch_id !== orderCheck.rows[0].branch_id) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Calculate total amount from items
        const totalAmount = Array.isArray(items) ? items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_cost), 0) : 0;

        const result = await pool.query(
          `UPDATE purchase_orders 
           SET supplier_id = $1, expected_delivery_date = $2, actual_delivery_date = $3, notes = $4, total_amount = $5
           WHERE id = $6 RETURNING *`,
          [supplier_id, expected_delivery_date, actual_delivery_date, notes, totalAmount, id]
        );

        // Update purchase order items if provided
        if (Array.isArray(items) && items.length > 0) {
          // Delete existing items
          await pool.query('DELETE FROM purchase_order_items WHERE purchase_order_id = $1', [id]);
          
          // Insert new items
          for (const item of items) {
            await pool.query(
              `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost, total_cost)
               VALUES ($1, $2, $3, $4, $5)`,
              [id, item.product_id, item.quantity, item.unit_cost, item.quantity * item.unit_cost]
            );
          }
        }

        res.json(result.rows[0]);
      } catch (dbError) {
        console.error('Database operation failed:', dbError.message);
        res.status(500).json({ error: 'Database operation failed' });
      }
    } else {
      res.json({ message: 'Purchase order updated successfully' });
    }
  } catch (error) {
    console.error('Update purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete purchase order
router.delete('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    if (pool) {
      try {
        const { id } = req.params;

        // Check if purchase order exists and user has permission
        const orderCheck = await pool.query('SELECT branch_id FROM purchase_orders WHERE id = $1', [id]);
        if (orderCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Purchase order not found' });
        }

        if (req.user?.role !== 'admin' && req.user?.branch_id !== orderCheck.rows[0].branch_id) {
          return res.status(403).json({ error: 'Access denied' });
        }

        await pool.query('DELETE FROM purchase_orders WHERE id = $1', [id]);
        res.json({ message: 'Purchase order deleted successfully' });
      } catch (dbError) {
        console.error('Database operation failed:', dbError.message);
        res.status(500).json({ error: 'Database operation failed' });
      }
    } else {
      res.json({ message: 'Purchase order deleted successfully' });
    }
  } catch (error) {
    console.error('Delete purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update purchase order status
router.put('/:id/status', authenticateToken, requireRole(['admin', 'manager', 'employee']), async (req: AuthRequest, res) => {
  try {
    if (pool) {
      try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['draft', 'sent', 'confirmed', 'delivered', 'cancelled'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }

        // Check if purchase order exists and user has permission
        const orderCheck = await pool.query('SELECT branch_id FROM purchase_orders WHERE id = $1', [id]);
        if (orderCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Purchase order not found' });
        }

        if (req.user?.role !== 'admin' && req.user?.branch_id !== orderCheck.rows[0].branch_id) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const actual_delivery_date = status === 'delivered' ? new Date().toISOString() : null;

        const result = await pool.query(
          'UPDATE purchase_orders SET status = $1, actual_delivery_date = $2 WHERE id = $3 RETURNING *',
          [status, actual_delivery_date, id]
        );

        res.json(result.rows[0]);
      } catch (dbError) {
        console.error('Database operation failed:', dbError.message);
        res.status(500).json({ error: 'Database operation failed' });
      }
    } else {
      res.json({ message: 'Purchase order status updated successfully' });
    }
  } catch (error) {
    console.error('Update purchase order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;