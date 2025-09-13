import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Fallback mock users for when database is not available
const mockUsers = [
  {
    id: '1',
    name: 'مدير النظام',
    email: 'admin@shaghaf.eg',
    username: 'admin',
    password_hash: '$2a$10$dummy.hash.for.development',
    role: 'admin',
    branch_id: '1',
    is_active: true
  },
  {
    id: '2',
    name: 'مدير الفرع',
    email: 'manager@shaghaf.eg',
    username: 'manager',
    password_hash: '$2a$10$dummy.hash.for.development',
    role: 'manager',
    branch_id: '1',
    is_active: true
  },
  {
    id: '3',
    name: 'موظف الاستقبال',
    email: 'reception@shaghaf.eg',
    username: 'reception',
    password_hash: '$2a$10$dummy.hash.for.development',
    role: 'reception',
    branch_id: '1',
    is_active: true
  }
];

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, username, password, branch_id } = req.body;

    if ((!email && !username) || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    let user = null;
    
    if (pool) {
      try {
        // Try to find user by email or username in database
        const result = await pool.query(
          'SELECT id, name, email, username, password_hash, role, branch_id, is_active FROM users WHERE (email = $1 OR username = $1) AND is_active = true',
          [email || username]
        );
        
        if (result.rows.length > 0) {
          user = result.rows[0];
          
          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password_hash);
          if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
          }
        }
      } catch (dbError) {
        console.warn('Database query failed, using mock data:', dbError.message);
        user = mockUsers.find(u => u.email === (email || username) || u.username === (username || email));
      }
    } else {
      // Use mock data when no database
      user = mockUsers.find(u => u.email === (email || username) || u.username === (username || email));
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // For mock data (when no database), accept any password
    if (!pool) {
      console.log('Mock mode: accepting any password for demo');
    }

    // Check if user has access to the requested branch
    if (branch_id && user.branch_id !== branch_id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this branch' });
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

// Register (admin only)
router.post('/register', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create users' });
    }

    const { name, email, username, password, role, branch_id, phone, salary, hire_date, employee_code, department, position } = req.body;

    if (!name || (!email && !username) || !password || !role || !branch_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userEmail = email || `${username}@shaghaf.local`;
    
    if (pool) {
      try {
        // Check for duplicate username/email in database
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE email = $1 OR username = $2',
          [userEmail, username || email]
        );
        
        if (existingUser.rows.length > 0) {
          return res.status(400).json({ error: 'Username/email already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert new user
        const result = await pool.query(
          `INSERT INTO users (name, email, username, password_hash, role, branch_id, phone, salary, hire_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, name, email, username, role, branch_id, phone, salary, hire_date, is_active, created_at`,
          [name, userEmail, username || email, passwordHash, role, branch_id, phone, salary, hire_date]
        );

        res.status(201).json({
          message: 'User created successfully',
          user: result.rows[0]
        });
      } catch (dbError) {
        console.error('Database operation failed:', dbError.message);
        if (dbError.code === '23505') { // Unique violation
          res.status(400).json({ error: 'Username/email already exists' });
        } else {
          res.status(500).json({ error: 'Database operation failed' });
        }
      }
    } else {
      // Mock mode: simulate user creation
      const existingUser = mockUsers.find(u => u.email === userEmail);
      if (existingUser) {
        return res.status(400).json({ error: 'Username/email already exists' });
      }

      const newUser = {
        id: Date.now().toString(),
        name,
        email: userEmail,
        username: username || email,
        password_hash: 'mock-hashed-password',
        role,
        branch_id,
        phone,
        salary,
        hire_date,
        is_active: true,
        created_at: new Date().toISOString()
      };

      // Add to mock users for login capability
      mockUsers.push(newUser as any);
      
      res.status(201).json({
        message: 'User created successfully',
        user: newUser
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (pool) {
      try {
        const result = await pool.query(
          `SELECT u.id, u.name, u.email, u.username, u.role, u.branch_id, u.phone, u.salary, u.hire_date, u.is_active, u.created_at, b.name as branch_name
           FROM users u
           LEFT JOIN branches b ON u.branch_id = b.id
           WHERE u.id = $1`,
          [req.user?.id]
        );
        
        if (result.rows.length > 0) {
          res.json(result.rows[0]);
        } else {
          res.status(404).json({ error: 'User not found' });
        }
      } catch (dbError) {
        console.warn('Database query failed, using mock data:', dbError.message);
        const user = mockUsers.find(u => u.id === req.user?.id);
        if (user) {
          res.json({ ...user, branch_name: 'الفرع الرئيسي' });
        } else {
          res.status(404).json({ error: 'User not found' });
        }
      }
    } else {
      // Use mock data
      const user = mockUsers.find(u => u.id === req.user?.id);
      if (user) {
        res.json({ ...user, branch_name: 'الفرع الرئيسي' });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    }
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, phone } = req.body;
    
    if (pool) {
      try {
        const result = await pool.query(
          'UPDATE users SET name = $1, phone = $2 WHERE id = $3 RETURNING id, name, email, phone',
          [name, phone, req.user?.id]
        );
        
        if (result.rows.length > 0) {
          res.json(result.rows[0]);
        } else {
          res.status(404).json({ error: 'User not found' });
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError.message);
        res.status(500).json({ error: 'Database operation failed' });
      }
    } else {
      // Mock mode: simulate profile update
      res.json({
        id: req.user?.id,
        name,
        email: req.user?.email,
        phone
      });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (pool) {
      try {
        // Get current password hash
        const userResult = await pool.query(
          'SELECT password_hash FROM users WHERE id = $1',
          [req.user?.id]
        );
        
        if (userResult.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
        if (!isValidPassword) {
          return res.status(400).json({ error: 'Current password is incorrect' });
        }
        
        // Hash new password and update
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await pool.query(
          'UPDATE users SET password_hash = $1 WHERE id = $2',
          [newPasswordHash, req.user?.id]
        );
        
        res.json({ message: 'Password updated successfully' });
      } catch (dbError) {
        console.error('Database operation failed:', dbError.message);
        res.status(500).json({ error: 'Database operation failed' });
      }
    } else {
      // Mock mode: simulate password change
      console.log('Password change simulated for user:', req.user?.id);
      res.json({ message: 'Password updated successfully' });
    }
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;