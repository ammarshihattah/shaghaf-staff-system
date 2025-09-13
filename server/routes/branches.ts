import express from 'express';
import { pool } from '../index';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Mock data for when database is not available
const mockBranches = [
  {
    id: '1',
    name: 'الفرع الرئيسي',
    address: 'شارع التحرير، وسط البلد، القاهرة',
    phone: '+20101234567',
    email: 'main@shaghaf.eg',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'فرع الإسكندرية',
    address: 'شارع الكورنيش، الإسكندرية',
    phone: '+20102345678',
    email: 'alexandria@shaghaf.eg',
    is_active: true,
    created_at: '2024-02-01T00:00:00Z'
  }
];

// Get all branches (admin/manager only)
router.get('/', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    if (pool) {
      const result = await pool.query(
        'SELECT id, name, address, phone, email, is_active, created_at FROM branches ORDER BY created_at DESC'
      );
      res.json(result.rows);
    } else {
      // Fallback to mock data
      res.json(mockBranches);
    }
  } catch (error) {
    console.error('Get branches error:', error);
    // Fallback to mock data on error
    res.json(mockBranches);
  }
});

// Get single branch
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Users can only access their own branch unless they're admin
    if (req.user?.role !== 'admin' && req.user?.branch_id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (pool) {
      const result = await pool.query(
        'SELECT id, name, address, phone, email, is_active, created_at FROM branches WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Branch not found' });
      }

      res.json(result.rows[0]);
    } else {
      // Fallback to mock data
      const branch = mockBranches.find(b => b.id === id);
      if (!branch) {
        return res.status(404).json({ error: 'Branch not found' });
      }
      res.json(branch);
    }
  } catch (error) {
    console.error('Get branch error:', error);
    // Fallback to mock data
    const branch = mockBranches.find(b => b.id === req.params.id);
    if (branch) {
      res.json(branch);
    } else {
      res.status(404).json({ error: 'Branch not found' });
    }
  }
});

// Create branch (admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { name, address, phone, email } = req.body;

    if (!name || !address || !phone || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const result = await pool.query(
      'INSERT INTO branches (name, address, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, address, phone, email]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create branch error:', error);
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update branch (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, is_active } = req.body;

    const result = await pool.query(
      'UPDATE branches SET name = $1, address = $2, phone = $3, email = $4, is_active = $5 WHERE id = $6 RETURNING *',
      [name, address, phone, email, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete branch (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM branches WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get branch statistics
router.get('/:id/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Users can only access their own branch stats unless they're admin
    if (req.user?.role !== 'admin' && req.user?.branch_id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [rooms, clients, bookings, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM rooms WHERE branch_id = $1 AND is_active = true', [id]),
      pool.query('SELECT COUNT(*) FROM clients WHERE branch_id = $1 AND is_active = true', [id]),
      pool.query('SELECT COUNT(*) FROM bookings WHERE branch_id = $1 AND status = $2', [id, 'confirmed']),
      pool.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE branch_id = $1 AND status = $2', [id, 'completed'])
    ]);

    res.json({
      total_rooms: parseInt(rooms.rows[0].count),
      total_clients: parseInt(clients.rows[0].count),
      active_bookings: parseInt(bookings.rows[0].count),
      total_revenue: parseFloat(revenue.rows[0].total)
    });
  } catch (error) {
    console.error('Get branch stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;