import express from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Mock data for shifts (in-memory for WebContainer)
let mockShifts: any[] = [
  {
    id: 'shift1',
    branch_id: '1',
    name: 'وردية صباحية',
    type: 'morning',
    start_time: '08:00',
    end_time: '16:00',
    days_of_week: [1, 2, 3, 4, 5], // Mon-Fri
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'shift2',
    branch_id: '1',
    name: 'وردية مسائية',
    type: 'evening',
    start_time: '16:00',
    end_time: '00:00',
    days_of_week: [1, 2, 3, 4, 5], // Mon-Fri
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'shift3',
    branch_id: '1',
    name: 'وردية نهاية الأسبوع',
    type: 'full',
    start_time: '10:00',
    end_time: '18:00',
    days_of_week: [0, 6], // Sun, Sat
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Get all shifts for user's branch (or all for admin)
router.get('/', authenticateToken, requireRole(['admin', 'manager']), (req: AuthRequest, res) => {
  try {
    const branchId = req.user?.role === 'admin' ? req.query.branch_id || req.user.branch_id : req.user?.branch_id;
    const filteredShifts = mockShifts.filter(shift => shift.branch_id === branchId);
    res.json(filteredShifts);
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single shift
router.get('/:id', authenticateToken, requireRole(['admin', 'manager']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const shift = mockShifts.find(s => s.id === id);

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    if (req.user?.role !== 'admin' && req.user?.branch_id !== shift.branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(shift);
  } catch (error) {
    console.error('Get shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create shift
router.post('/', authenticateToken, requireRole(['admin', 'manager']), (req: AuthRequest, res) => {
  try {
    const { name, type, start_time, end_time, days_of_week, is_active, branch_id } = req.body;

    if (!name || !type || !start_time || !end_time || !days_of_week) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const targetBranchId = req.user?.role === 'admin' ? (branch_id || req.user.branch_id) : req.user?.branch_id;

    const newShift = {
      id: Date.now().toString(),
      branch_id: targetBranchId,
      name,
      type,
      start_time,
      end_time,
      days_of_week,
      is_active: is_active !== undefined ? is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockShifts.push(newShift);
    res.status(201).json(newShift);
  } catch (error) {
    console.error('Create shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update shift
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, type, start_time, end_time, days_of_week, is_active } = req.body;

    let shiftIndex = mockShifts.findIndex(s => s.id === id);
    if (shiftIndex === -1) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    if (req.user?.role !== 'admin' && req.user?.branch_id !== mockShifts[shiftIndex].branch_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    mockShifts[shiftIndex] = {
      ...mockShifts[shiftIndex],
      name: name || mockShifts[shiftIndex].name,
      type: type || mockShifts[shiftIndex].type,
      start_time: start_time || mockShifts[shiftIndex].start_time,
      end_time: end_time || mockShifts[shiftIndex].end_time,
      days_of_week: days_of_week || mockShifts[shiftIndex].days_of_week,
      is_active: is_active !== undefined ? is_active : mockShifts[shiftIndex].is_active,
      updated_at: new Date().toISOString()
    };

    res.json(mockShifts[shiftIndex]);
  } catch (error) {
    console.error('Update shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete shift
router.delete('/:id', authenticateToken, requireRole(['admin', 'manager']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const initialLength = mockShifts.length;
    mockShifts = mockShifts.filter(s => s.id !== id);

    if (mockShifts.length === initialLength) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    res.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Delete shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;