import express from 'express';
import { pool, mockUsers } from '../index';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all employees for user's branch
router.get('/', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const branchId = req.user?.role === 'admin' ? req.query.branch_id || req.user.branch_id : req.user?.branch_id;
    
    const result = await pool.query(
      'SELECT id, name, email, phone, role, salary, hire_date, is_active, created_at FROM users WHERE branch_id = $1 ORDER BY created_at DESC',
      [branchId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users for role management (admin only)
router.get('/users', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const branchId = req.query.branch_id || req.user?.branch_id;
    
    if (pool) {
      try {
        const result = await pool.query(
          'SELECT id, name, email, username, role, branch_id, phone, salary, hire_date, is_active, created_at FROM users WHERE branch_id = $1 ORDER BY created_at DESC',
          [branchId]
        );
        res.json(result.rows);
      } catch (dbError) {
        console.warn('Database query failed, using mock data:', dbError.message);
        const filteredUsers = mockUsers.filter(user => user.branch_id === branchId);
        res.json(filteredUsers);
      }
    } else {
      // Use mock data
      const filteredUsers = mockUsers.filter(user => user.branch_id === branchId);
      res.json(filteredUsers);
    }
  } catch (error) {
    console.error('Get users error:', error);
    // Fallback to mock data
    const branchId = req.query.branch_id || req.user?.branch_id;
    const filteredUsers = mockUsers.filter(user => user.branch_id === branchId);
    res.json(filteredUsers);
  }
});

// Update user role (admin only)
router.put('/:id/role', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'manager', 'reception', 'employee'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Prevent user from changing their own role
    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    if (pool) {
      try {
        const result = await pool.query(
          'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, username, role, branch_id, is_active',
          [role, id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json({ 
          message: 'User role updated successfully', 
          user: result.rows[0] 
        });
      } catch (dbError) {
        console.warn('Database update failed, updating mock data:', dbError.message);
        // Update mock data
        const userIndex = mockUsers.findIndex(user => user.id === id);
        if (userIndex === -1) {
          return res.status(404).json({ error: 'User not found' });
        }

        mockUsers[userIndex] = { ...mockUsers[userIndex], role };
        res.json({ 
          message: 'User role updated successfully', 
          user: mockUsers[userIndex] 
        });
      }
    } else {
      // Update mock data directly
      const userIndex = mockUsers.findIndex(user => user.id === id);
      if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
      }

      mockUsers[userIndex] = { ...mockUsers[userIndex], role };
      res.json({ 
        message: 'User role updated successfully', 
        user: mockUsers[userIndex] 
      });
    }
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tasks for current user
router.get('/tasks', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name as assigned_by_name
       FROM tasks t
       JOIN users u ON t.assigned_by = u.id
       WHERE t.assigned_to = $1
       ORDER BY t.created_at DESC`,
      [req.user?.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create task
router.post('/tasks', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const { assigned_to, title, description, priority, due_date } = req.body;

    if (!assigned_to || !title) {
      return res.status(400).json({ error: 'Assigned to and title are required' });
    }

    const result = await pool.query(
      'INSERT INTO tasks (branch_id, assigned_to, assigned_by, title, description, priority, due_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user?.branch_id, assigned_to, req.user?.id, title, description, priority || 'medium', due_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task status
router.put('/tasks/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if task exists and user has permission
    const taskCheck = await pool.query('SELECT assigned_to, assigned_by FROM tasks WHERE id = $1', [id]);
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskCheck.rows[0];
    if (task.assigned_to !== req.user?.id && task.assigned_by !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const completed_at = status === 'completed' ? new Date() : null;

    const result = await pool.query(
      'UPDATE tasks SET status = $1, completed_at = $2 WHERE id = $3 RETURNING *',
      [status, completed_at, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check in/out attendance
router.post('/attendance/checkin', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    const existingAttendance = await pool.query(
      'SELECT id FROM attendance WHERE user_id = $1 AND DATE(check_in) = $2',
      [req.user?.id, today]
    );

    if (existingAttendance.rows.length > 0) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const result = await pool.query(
      'INSERT INTO attendance (user_id, branch_id, check_in) VALUES ($1, $2, $3) RETURNING *',
      [req.user?.id, req.user?.branch_id, new Date()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/attendance/checkout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { break_duration, notes } = req.body;
    
    // Find today's attendance record
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(
      'UPDATE attendance SET check_out = $1, break_duration = $2, notes = $3 WHERE user_id = $4 AND DATE(check_in) = $5 AND check_out IS NULL RETURNING *',
      [new Date(), break_duration || 0, notes, req.user?.id, today]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No active check-in found for today' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Check out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;