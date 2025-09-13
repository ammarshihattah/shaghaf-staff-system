import express from 'express';
import { pool } from '../index';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all rooms for user's branch
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (pool) {
      try {
        const branchId = req.user?.role === 'admin' ? req.query.branch_id || req.user.branch_id : req.user?.branch_id;
        
        const result = await pool.query(
          'SELECT * FROM rooms WHERE branch_id = $1 ORDER BY created_at DESC',
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
    console.error('Get rooms error:', error);
    res.json([]);
  }
});

// Get single room
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM rooms WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = result.rows[0];
    
    // Check access permissions
    if (req.user?.role !== 'admin' && req.user?.branch_id !== room.branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create room
router.post('/', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const { name, capacity, hourly_rate, features, branch_id, type } = req.body;

    if (!name || !capacity || !hourly_rate) {
      return res.status(400).json({ error: 'Name, capacity, and hourly rate are required' });
    }

    // التحقق من أن type هو مصفوفة وليس فارغاً
    if (!type || !Array.isArray(type) || type.length === 0) {
      return res.status(400).json({ error: 'Room type must be an array with at least one value' });
    }

    // Determine branch_id
    const targetBranchId = req.user?.role === 'admin' ? (branch_id || req.user.branch_id) : req.user?.branch_id;

    const result = await pool.query(
      'INSERT INTO rooms (branch_id, name, capacity, hourly_rate, features, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [targetBranchId, name, capacity, hourly_rate, features || [], type || ['private']]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create room error:', error);
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Room name already exists in this branch' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update room
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, hourly_rate, features, is_active, type } = req.body;

    // Check if room exists and user has permission
    const roomCheck = await pool.query('SELECT branch_id FROM rooms WHERE id = $1', [id]);
    if (roomCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (req.user?.role !== 'admin' && req.user?.branch_id !== roomCheck.rows[0].branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'UPDATE rooms SET name = $1, capacity = $2, hourly_rate = $3, features = $4, is_active = $5, type = $6 WHERE id = $7 RETURNING *',
      [name, capacity, hourly_rate, features || [], is_active, type || ['private'], id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete room
router.delete('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if room exists and user has permission
    const roomCheck = await pool.query('SELECT branch_id FROM rooms WHERE id = $1', [id]);
    if (roomCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (req.user?.role !== 'admin' && req.user?.branch_id !== roomCheck.rows[0].branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if room has active bookings
    const bookingCheck = await pool.query(
      'SELECT COUNT(*) FROM bookings WHERE room_id = $1 AND status = $2',
      [id, 'confirmed']
    );

    if (parseInt(bookingCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete room with active bookings' });
    }

    await pool.query('DELETE FROM rooms WHERE id = $1', [id]);
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check room availability
router.post('/:id/check-availability', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time } = req.body;

    if (!start_time || !end_time) {
      return res.status(400).json({ error: 'Start time and end time are required' });
    }

    const result = await pool.query(
      `SELECT COUNT(*) FROM bookings 
       WHERE room_id = $1 AND status = 'confirmed'
       AND (
         ($2 >= start_time AND $2 < end_time) OR
         ($3 > start_time AND $3 <= end_time) OR
         ($2 <= start_time AND $3 >= end_time)
       )`,
      [id, start_time, end_time]
    );

    const isAvailable = parseInt(result.rows[0].count) === 0;
    res.json({ available: isAvailable });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;