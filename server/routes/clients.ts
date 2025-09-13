import express from 'express';
import { pool } from '../index';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all clients for user's branch
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (pool) {
      try {
        const branchId = req.user?.role === 'admin' ? req.query.branch_id || req.user.branch_id : req.user?.branch_id;
        
        const result = await pool.query(
          `SELECT c.*, 
                  m.membership_type, m.start_date as membership_start, m.end_date as membership_end,
                  COALESCE(SUM(lp.points), 0) as loyalty_points
           FROM clients c
           LEFT JOIN memberships m ON c.id = m.client_id AND m.is_active = true
           LEFT JOIN loyalty_points lp ON c.id = lp.client_id
           WHERE c.branch_id = $1 AND c.is_active = true
           GROUP BY c.id, m.membership_type, m.start_date, m.end_date
           ORDER BY c.created_at DESC`,
          [branchId]
        );
        res.json(result.rows);
      } catch (dbError) {
        console.warn('Database query failed, returning empty array:', dbError.message);
        res.json([]);
      }
    } else {
      // No database available, return empty array
      res.json([]);
    }
  } catch (error) {
    console.error('Get clients error:', error);
    res.json([]);
  }
});

// Get single client
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT c.*, 
              m.membership_type, m.start_date as membership_start, m.end_date as membership_end,
              COALESCE(SUM(lp.points), 0) as loyalty_points
       FROM clients c
       LEFT JOIN memberships m ON c.id = m.client_id AND m.is_active = true
       LEFT JOIN loyalty_points lp ON c.id = lp.client_id
       WHERE c.id = $1
       GROUP BY c.id, m.membership_type, m.start_date, m.end_date`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = result.rows[0];
    
    // Check access permissions
    if (req.user?.role !== 'admin' && req.user?.branch_id !== client.branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create client
router.post('/', authenticateToken, requireRole(['admin', 'manager', 'reception']), async (req: AuthRequest, res) => {
  try {
    const { 
      name, email, phone, id_number, address, date_of_birth, branch_id,
      membership_type, membership_start, membership_end, membership_price 
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    // Determine branch_id
    const targetBranchId = req.user?.role === 'admin' ? (branch_id || req.user.branch_id) : req.user?.branch_id;

    const client = await pool.query('BEGIN');
    
    try {
      // Create client
      const clientResult = await pool.query(
        'INSERT INTO clients (branch_id, name, email, phone, id_number, address, date_of_birth) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [targetBranchId, name, email, phone, id_number, address, date_of_birth]
      );

      const newClient = clientResult.rows[0];

      // Create membership if provided
      if (membership_type && membership_start && membership_end) {
        await pool.query(
          'INSERT INTO memberships (client_id, membership_type, start_date, end_date, price) VALUES ($1, $2, $3, $4, $5)',
          [newClient.id, membership_type, membership_start, membership_end, membership_price || 0]
        );
      }

      await pool.query('COMMIT');
      res.status(201).json(newClient);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update client
router.put('/:id', authenticateToken, requireRole(['admin', 'manager', 'reception']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, id_number, address, date_of_birth, is_active } = req.body;

    // Check if client exists and user has permission
    const clientCheck = await pool.query('SELECT branch_id FROM clients WHERE id = $1', [id]);
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (req.user?.role !== 'admin' && req.user?.branch_id !== clientCheck.rows[0].branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'UPDATE clients SET name = $1, email = $2, phone = $3, id_number = $4, address = $5, date_of_birth = $6, is_active = $7 WHERE id = $8 RETURNING *',
      [name, email, phone, id_number, address, date_of_birth, is_active, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete client
router.delete('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if client exists and user has permission
    const clientCheck = await pool.query('SELECT branch_id FROM clients WHERE id = $1', [id]);
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (req.user?.role !== 'admin' && req.user?.branch_id !== clientCheck.rows[0].branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query('DELETE FROM clients WHERE id = $1', [id]);
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add loyalty points
router.post('/:id/loyalty-points', authenticateToken, requireRole(['admin', 'manager', 'reception']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { points, description } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({ error: 'Points must be a positive number' });
    }

    // Check if client exists and user has permission
    const clientCheck = await pool.query('SELECT branch_id FROM clients WHERE id = $1', [id]);
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (req.user?.role !== 'admin' && req.user?.branch_id !== clientCheck.rows[0].branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'INSERT INTO loyalty_points (client_id, points, transaction_type, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, points, 'earned', description || 'Manual points addition']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add loyalty points error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get client's loyalty points history
router.get('/:id/loyalty-points', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Check if client exists and user has permission
    const clientCheck = await pool.query('SELECT branch_id FROM clients WHERE id = $1', [id]);
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (req.user?.role !== 'admin' && req.user?.branch_id !== clientCheck.rows[0].branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT * FROM loyalty_points WHERE client_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get loyalty points error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;