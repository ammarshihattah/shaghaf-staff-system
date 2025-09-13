import express from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Mock data for employee shifts (in-memory for WebContainer)
let mockEmployeeShifts: any[] = [
  {
    id: 'empShift1',
    employee_id: '1', // Admin
    shift_id: 'shift1',
    assignment_date: '2025-08-25',
    notes: 'Admin morning shift',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'empShift2',
    employee_id: '2', // Manager
    shift_id: 'shift2',
    assignment_date: '2025-08-25',
    notes: 'Manager evening shift',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'empShift3',
    employee_id: '3', // Reception
    shift_id: 'shift1',
    assignment_date: '2025-08-26',
    notes: 'Reception morning shift',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Get all employee shifts for user's branch (or all for admin)
router.get('/', authenticateToken, requireRole(['admin', 'manager']), (req: AuthRequest, res) => {
  try {
    const branchId = req.user?.role === 'admin' ? req.query.branch_id || req.user.branch_id : req.user?.branch_id;
    
    // Filter employee shifts by branch (assuming employee_id links to user with branch_id)
    // This is a simplified mock, in real DB you'd join with users table
    const filteredEmployeeShifts = mockEmployeeShifts.filter(es => {
      // For mock, we'll assume employee_id '1', '2', '3' are in branch '1'
      // In a real app, you'd fetch user details to get their branch_id
      const employeeBranchId = (es.employee_id === '1' || es.employee_id === '2' || es.employee_id === '3') ? '1' : 'unknown';
      return employeeBranchId === branchId;
    });
    res.json(filteredEmployeeShifts);
  } catch (error) {
    console.error('Get employee shifts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single employee shift
router.get('/:id', authenticateToken, requireRole(['admin', 'manager']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const employeeShift = mockEmployeeShifts.find(es => es.id === id);

    if (!employeeShift) {
      return res.status(404).json({ error: 'Employee shift not found' });
    }

    // Simplified branch check for mock data
    const employeeBranchId = (employeeShift.employee_id === '1' || employeeShift.employee_id === '2' || employeeShift.employee_id === '3') ? '1' : 'unknown';
    if (req.user?.role !== 'admin' && req.user?.branch_id !== employeeBranchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(employeeShift);
  } catch (error) {
    console.error('Get employee shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create employee shift
router.post('/', authenticateToken, requireRole(['admin', 'manager']), (req: AuthRequest, res) => {
  try {
    const { employee_id, shift_id, assignment_date, notes } = req.body;

    if (!employee_id || !shift_id || !assignment_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for unique constraint (employee can only have one shift per day)
    const existingShift = mockEmployeeShifts.find(es => 
      es.employee_id === employee_id && es.assignment_date === assignment_date
    );
    if (existingShift) {
      return res.status(400).json({ error: 'Employee already has a shift assigned for this date' });
    }

    const newEmployeeShift = {
      id: Date.now().toString(),
      employee_id,
      shift_id,
      assignment_date,
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockEmployeeShifts.push(newEmployeeShift);
    res.status(201).json(newEmployeeShift);
  } catch (error) {
    console.error('Create employee shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update employee shift
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { employee_id, shift_id, assignment_date, notes } = req.body;

    let employeeShiftIndex = mockEmployeeShifts.findIndex(es => es.id === id);
    if (employeeShiftIndex === -1) {
      return res.status(404).json({ error: 'Employee shift not found' });
    }

    // Simplified branch check for mock data
    const employeeBranchId = (mockEmployeeShifts[employeeShiftIndex].employee_id === '1' || mockEmployeeShifts[employeeShiftIndex].employee_id === '2' || mockEmployeeShifts[employeeShiftIndex].employee_id === '3') ? '1' : 'unknown';
    if (req.user?.role !== 'admin' && req.user?.branch_id !== employeeBranchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check for unique constraint if employee_id or assignment_date is changed
    if ((employee_id && employee_id !== mockEmployeeShifts[employeeShiftIndex].employee_id) || 
        (assignment_date && assignment_date !== mockEmployeeShifts[employeeShiftIndex].assignment_date)) {
      const existingShift = mockEmployeeShifts.find(es => 
        es.employee_id === (employee_id || mockEmployeeShifts[employeeShiftIndex].employee_id) && 
        es.assignment_date === (assignment_date || mockEmployeeShifts[employeeShiftIndex].assignment_date) &&
        es.id !== id
      );
      if (existingShift) {
        return res.status(400).json({ error: 'Employee already has a shift assigned for this date' });
      }
    }

    mockEmployeeShifts[employeeShiftIndex] = {
      ...mockEmployeeShifts[employeeShiftIndex],
      employee_id: employee_id || mockEmployeeShifts[employeeShiftIndex].employee_id,
      shift_id: shift_id || mockEmployeeShifts[employeeShiftIndex].shift_id,
      assignment_date: assignment_date || mockEmployeeShifts[employeeShiftIndex].assignment_date,
      notes: notes || mockEmployeeShifts[employeeShiftIndex].notes,
      updated_at: new Date().toISOString()
    };

    res.json(mockEmployeeShifts[employeeShiftIndex]);
  } catch (error) {
    console.error('Update employee shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete employee shift
router.delete('/:id', authenticateToken, requireRole(['admin', 'manager']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const initialLength = mockEmployeeShifts.length;
    mockEmployeeShifts = mockEmployeeShifts.filter(es => es.id !== id);

    if (mockEmployeeShifts.length === initialLength) {
      return res.status(404).json({ error: 'Employee shift not found' });
    }

    res.json({ message: 'Employee shift deleted successfully' });
  } catch (error) {
    console.error('Delete employee shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;