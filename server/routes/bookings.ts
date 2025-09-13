import express from 'express';
import { pool } from '../index';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all bookings for user's branch
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (pool) {
      try {
        const branchId = req.user?.role === 'admin' ? req.query.branch_id || req.user.branch_id : req.user?.branch_id;
        
        const result = await pool.query(
          `SELECT b.*, r.name as room_name, c.name as client_name, c.phone as client_phone
           FROM bookings b
           JOIN rooms r ON b.room_id = r.id
           JOIN clients c ON b.client_id = c.id
           WHERE b.branch_id = $1
           ORDER BY b.start_time DESC`,
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
    console.error('Get bookings error:', error);
    res.json([]);
  }
});

// Get single booking
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT b.*, r.name as room_name, c.name as client_name, c.phone as client_phone
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       JOIN clients c ON b.client_id = c.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = result.rows[0];
    
    // Check access permissions
    if (req.user?.role !== 'admin' && req.user?.branch_id !== booking.branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create booking
router.post('/', authenticateToken, requireRole(['admin', 'manager', 'reception']), async (req: AuthRequest, res) => {
  try {
    const { room_id, client_id, start_time, end_time, notes } = req.body;

    if (!room_id || !client_id || !start_time || !end_time) {
      return res.status(400).json({ error: 'Room, client, start time, and end time are required' });
    }

    // Get room details and calculate amount
    const roomResult = await pool.query('SELECT branch_id, hourly_rate FROM rooms WHERE id = $1', [room_id]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = roomResult.rows[0];
    
    // Check if user has permission for this branch
    if (req.user?.role !== 'admin' && req.user?.branch_id !== room.branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate total amount
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const total_amount = hours * room.hourly_rate;

    const result = await pool.query(
      'INSERT INTO bookings (branch_id, room_id, client_id, start_time, end_time, total_amount, notes, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [room.branch_id, room_id, client_id, start_time, end_time, total_amount, notes, req.user?.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Create booking error:', error);
    if (error.message.includes('already booked')) {
      res.status(400).json({ error: 'Room is already booked for this time period' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update booking
router.put('/:id', authenticateToken, requireRole(['admin', 'manager', 'reception']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, status, notes } = req.body;

    // Check if booking exists and user has permission
    const bookingCheck = await pool.query('SELECT branch_id, room_id FROM bookings WHERE id = $1', [id]);
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user?.role !== 'admin' && req.user?.branch_id !== bookingCheck.rows[0].branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // If updating time, recalculate amount
    let total_amount;
    if (start_time && end_time) {
      const roomResult = await pool.query('SELECT hourly_rate FROM rooms WHERE id = $1', [bookingCheck.rows[0].room_id]);
      const startDate = new Date(start_time);
      const endDate = new Date(end_time);
      const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      total_amount = hours * roomResult.rows[0].hourly_rate;
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (start_time) {
      updateFields.push(`start_time = $${paramCount++}`);
      updateValues.push(start_time);
    }
    if (end_time) {
      updateFields.push(`end_time = $${paramCount++}`);
      updateValues.push(end_time);
    }
    if (total_amount) {
      updateFields.push(`total_amount = $${paramCount++}`);
      updateValues.push(total_amount);
    }
    if (status) {
      updateFields.push(`status = $${paramCount++}`);
      updateValues.push(status);
    }
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount++}`);
      updateValues.push(notes);
    }

    updateValues.push(id);

    const result = await pool.query(
      `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      updateValues
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update booking error:', error);
    if (error.message.includes('already booked')) {
      res.status(400).json({ error: 'Room is already booked for this time period' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Cancel booking
router.put('/:id/cancel', authenticateToken, requireRole(['admin', 'manager', 'reception']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if booking exists and user has permission
    const bookingCheck = await pool.query('SELECT branch_id FROM bookings WHERE id = $1', [id]);
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user?.role !== 'admin' && req.user?.branch_id !== bookingCheck.rows[0].branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      ['cancelled', id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get bookings by date range
router.get('/date-range/:start/:end', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { start, end } = req.params;
    const branchId = req.user?.role === 'admin' ? req.query.branch_id || req.user.branch_id : req.user?.branch_id;
    
    const result = await pool.query(
      `SELECT b.*, r.name as room_name, c.name as client_name
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       JOIN clients c ON b.client_id = c.id
       WHERE b.branch_id = $1 AND b.start_time >= $2 AND b.end_time <= $3
       ORDER BY b.start_time ASC`,
      [branchId, start, end]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get bookings by date range error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;