import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../index';
import { mockUsers } from '../mockData.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    branch_id: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    let user;
    
    if (pool) {
      try {
        // Verify user still exists and is active
        const result = await pool.query(
          'SELECT id, email, role, branch_id, is_active FROM users WHERE id = $1',
          [decoded.userId]
        );

        if (result.rows.length === 0 || !result.rows[0].is_active) {
          return res.status(401).json({ error: 'Invalid token' });
        }

        user = result.rows[0];
      } catch (dbError) {
        console.warn('Database query failed, using mock data:', dbError.message);
        user = mockUsers.find(u => u.id === decoded.userId);
      }
    } else {
      // Use mock data
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

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};