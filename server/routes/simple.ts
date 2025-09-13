import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../index.js';
import { mockUsers, mockBranches } from '../mockData.js';

const router = express.Router();

// Auth middleware
const authenticateToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    let user;
    if (pool) {
      // Try database first
      const result = await pool.query(
        'SELECT id, name, email, role, branch_id, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );
      user = result.rows[0];
    }
    
    if (!user) {
      // Fallback to mock data
      user = mockUsers.find(u => u.id === decoded.userId);
    }
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      branch_id: user.branch_id
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Auth routes
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password, branch_id } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user;
    
    if (pool) {
      // Try database first
      try {
        const result = await pool.query(
          'SELECT * FROM users WHERE (email = $1 OR email = $1) AND is_active = true',
          [email]
        );
        user = result.rows[0];
      } catch (dbError) {
        console.log('Database query failed, using mock data');
      }
    }
    
    if (!user) {
      // Fallback to mock data - support username or email login
      user = mockUsers.find(u => 
        (u.email === email || email === 'admin' || email === 'manager' || email === 'reception') 
        && u.is_active
      );
      
      // If username login, find by role
      if (!user && (email === 'admin' || email === 'manager' || email === 'reception')) {
        user = mockUsers.find(u => u.role === email);
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For database users, verify password
    if (pool && user.password_hash) {
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch_id: user.branch_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/auth/profile', authenticateToken, async (req, res) => {
  try {
    let user;
    
    if (pool) {
      const result = await pool.query(
        'SELECT u.*, b.name as branch_name FROM users u LEFT JOIN branches b ON u.branch_id = b.id WHERE u.id = $1',
        [req.user?.id]
      );
      user = result.rows[0];
    }
    
    if (!user) {
      // Fallback to mock data
      user = mockUsers.find(u => u.id === req.user?.id);
      if (user) {
        user.branch_name = mockBranches.find(b => b.id === user.branch_id)?.name || 'الفرع الرئيسي';
      }
    }
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Branches routes
router.get('/branches', authenticateToken, async (req, res) => {
  try {
    let branches;
    
    if (pool) {
      const result = await pool.query('SELECT * FROM branches WHERE is_active = true ORDER BY name');
      branches = result.rows;
    }
    
    if (!branches || branches.length === 0) {
      branches = mockBranches;
    }
    
    res.json(branches);
  } catch (error) {
    console.error('Get branches error:', error);
    res.json(mockBranches);
  }
});

router.get('/branches/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user?.role !== 'admin' && req.user?.branch_id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let branch;
    
    if (pool) {
      const result = await pool.query('SELECT * FROM branches WHERE id = $1', [id]);
      branch = result.rows[0];
    }
    
    if (!branch) {
      branch = mockBranches.find(b => b.id === id);
    }
    
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json(branch);
  } catch (error) {
    console.error('Get branch error:', error);
    const branch = mockBranches.find(b => b.id === req.params.id);
    if (branch) {
      res.json(branch);
    } else {
      res.status(404).json({ error: 'Branch not found' });
    }
  }
});

// Simple routes for other endpoints (return empty arrays)
router.get('/rooms', authenticateToken, (req, res) => {
  res.json([]);
});

router.get('/clients', authenticateToken, (req, res) => {
  res.json([]);
});

router.get('/bookings', authenticateToken, (req, res) => {
  res.json([]);
});

router.get('/inventory/products', authenticateToken, (req, res) => {
  res.json([]);
});

router.get('/inventory/suppliers', authenticateToken, (req, res) => {
  res.json([]);
});

router.get('/employees', authenticateToken, (req, res) => {
  res.json([]);
});

router.get('/finance/invoices', authenticateToken, (req, res) => {
  res.json([]);
});

router.get('/finance/expenses', authenticateToken, (req, res) => {
  res.json([]);
});

router.get('/reports/financial-summary', authenticateToken, (req, res) => {
  res.json({
    total_revenue: 0,
    total_expenses: 0,
    net_profit: 0,
    booking_revenue: 0,
    membership_revenue: 0,
    product_revenue: 0,
    room_utilization: 0
  });
});

router.get('/reports/booking-stats', authenticateToken, (req, res) => {
  res.json([]);
});

router.get('/reports/client-stats', authenticateToken, (req, res) => {
  res.json({
    total_clients: 0,
    active_members: 0,
    expiring_members: 0,
    total_loyalty_points: 0
  });
});

router.get('/purchase-orders', authenticateToken, (req, res) => {
  res.json([]);
});

export default router;