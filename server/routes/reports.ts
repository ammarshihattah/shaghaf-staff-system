import express from 'express';
import { pool } from '../index';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get financial summary
router.get('/financial-summary', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    // Handle branch filtering - admin can see all branches or specific branch, manager only their branch
    let branchId;
    if (req.user?.role === 'admin') {
      // Admin can view all branches (if no branch_id specified) or a specific branch
      branchId = req.query.branch_id === 'all' ? null : (req.query.branch_id || req.user.branch_id);
    } else {
      // Manager can only view their own branch
      branchId = req.user?.branch_id;
    }
    
    const { start_datetime, end_datetime } = req.query;
    
    // For admin users, if no branch_id specified, get data for all branches
    const getAllBranches = req.user?.role === 'admin' && !branchId;

    let branchFilter = '';
    let dateFilter = '';
    let params: any[] = [];
    let paramIndex = 1;

    // Build branch filter
    if (!getAllBranches) {
      branchFilter = `WHERE branch_id = $${paramIndex}`;
      params.push(branchId);
      paramIndex++;
    } else {
      branchFilter = 'WHERE 1=1'; // No branch filter for all branches
    }

    // Build date filter
    if (start_datetime && end_datetime) {
      dateFilter = `AND created_at >= $${paramIndex}::timestamp AND created_at <= $${paramIndex + 1}::timestamp`;
      params.push(start_datetime, end_datetime);
      paramIndex += 2;
    }

    const whereClause = branchFilter + ' ' + dateFilter;

    try {
      // Get revenue from completed bookings
      const revenueResult = await pool.query(
        `SELECT COALESCE(SUM(total_amount), 0) as total_revenue
         FROM bookings 
         ${whereClause.replace('WHERE 1=1', 'WHERE status = \'completed\'')} ${getAllBranches ? 'AND status = \'completed\'' : ''}`,
        params
      );

      // Get expenses
      const expensesResult = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total_expenses
         FROM expenses 
         ${whereClause} ${whereClause ? 'AND' : 'WHERE'} approved_by IS NOT NULL`,
        params
      );

      // Get booking revenue breakdown
      const bookingRevenueResult = await pool.query(
        `SELECT COALESCE(SUM(total_amount), 0) as booking_revenue
         FROM bookings 
         ${whereClause} ${whereClause ? 'AND' : 'WHERE'} status = 'completed'`,
        params
      );

      // Get membership revenue (from invoices)
      const membershipRevenueResult = await pool.query(
        \`SELECT COALESCE(SUM(total_amount), 0) as members\hip_revenue
         FROM invoices 
         ${whereClause} ${whereClause ? 'AND' : 'WHERE'} status = 'paid' AND booking_id IS NULL`,
        params
      );

      // Calculate room utilization
      let utilizationResult;
      if (branchId) {
        utilizationResult = await pool.query(
          \`SELECT 
             COUNT(*) as total_bookings,
             COUNT(DISTINCT room_id) as rooms_used,
             (SELECT COUNT(*) FROM rooms WHERE branch_id = $${params.length + 1} AND is_active = true) as total_rooms
           FROM bookings 
           ${whereClause} ${whereClause ? 'AND' : 'WHERE'} status IN ('confirmed', 'completed')`,
          [...params, branchId]
        );
      } else {
        utilizationResult = await pool.query(
          \`SELECT 
             COUNT(*) as total_bookings,
             COUNT(DISTINCT room_id) as rooms_used,
             (SELECT COUNT(*) FROM rooms WHERE is_active = true) as total_rooms
           FROM bookings 
           ${whereClause} ${whereClause ? 'AND' : 'WHERE'} status IN ('confirmed', 'completed')`,
          params
        );
      }

      const totalRevenue = parseFloat(revenueResult.rows[0]?.total_revenue || '0') || 0;
      const totalExpenses = parseFloat(expensesResult.rows[0]?.total_expenses || '0') || 0;
      const bookingRevenue = parseFloat(bookingRevenueResult.rows[0]?.booking_revenue || '0') || 0;
      const membershipRevenue = parseFloat(membershipRevenueResult.rows[0]?.membership_revenue || '0') || 0;
      
      const utilization = utilizationResult.rows[0] || {};
      const totalRooms = parseInt(utilization.total_rooms || '0') || 0;
      const roomsUsed = parseInt(utilization.rooms_used || '0') || 0;
      const roomUtilization = totalRooms > 0 ? 
        (roomsUsed / totalRooms) * 100 : 0;

      res.json({
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_profit: totalRevenue - totalExpenses,
        booking_revenue: bookingRevenue,
        membership_revenue: membershipRevenue,
        product_revenue: 0, // TODO: Implement product sales
        room_utilization: Math.round(roomUtilization * 100) / 100
      });
    } catch (dbError) {
      console.error('Database query error in financial-summary:', dbError);
      // Return default values if database queries fail
      res.json({
        total_revenue: 0,
        total_expenses: 0,
        net_profit: 0,
        booking_revenue: 0,
        membership_revenue: 0,
        product_revenue: 0,
        room_utilization: 0
      });
    }
  } catch (error) {
    console.error('Get financial summary error:', error);
    res.json({
      total_revenue: 0,
      total_expenses: 0,
      net_profit: 0,
      booking_revenue: 0,
      membership_revenue: 0,
      product_revenue: 0,
      room_utilization: 0
    });
  }
});

// Get booking statistics
router.get('/booking-stats', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const branchId = req.user?.role === 'admin' ? req.query.branch_id || req.user.branch_id : req.user?.branch_id;
    const { period = 'month', start_datetime, end_datetime } = req.query;
    
    // If no database connection, return mock data
    if (!pool) {
      return res.json({
        total_revenue: 15750,
        total_expenses: 5250,
        net_profit: 10500,
        booking_revenue: 12000,
        membership_revenue: 3000,
        product_revenue: 750,
        room_utilization: 78
      });
    }

    let dateFormat, dateInterval;
    switch (period) {
      case 'week':
        dateFormat = 'YYYY-MM-DD';
        dateInterval = '7 days';
        break;
      case 'year':
        dateFormat = 'YYYY-MM';
        dateInterval = '12 months';
        break;
      default: // month
        dateFormat = 'YYYY-MM-DD';
        dateInterval = '30 days';
        break;
    }
    // Build dynamic query conditions
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // Branch filter - if branchId is null (admin viewing all branches), don't filter by branch
    if (branchId) {
      conditions.push(\`branch_id = $${paramIndex}`);
      params.push(branchId);
      paramIndex++;
    }

    // DateTime range filter
    if (start_datetime) {
      conditions.push(\`created_at >= $${paramIndex}::timestamp`);
      params.push(start_datetime);
      paramIndex++;
    }
    if (end_datetime) {
      conditions.push(\`created_at <= $${paramIndex}::timestamp`);
      params.push(end_datetime);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? \`WHERE ${conditions.join(' AND ')}` : '';

    try {
      const result = await pool.query(
        \`SELECT 
           TO_CHAR(created_at, $${paramIndex}) as period,
           COUNT(*) as bookings,
           COALESCE(SUM(total_amount), 0) as revenue,
           COUNT(DISTINCT client_id) as unique_clients
         FROM bookings 
         ${whereClause} ${whereClause ? 'AND' : 'WHERE'} status = 'completed'
         GROUP BY TO_CHAR(created_at, $${paramIndex})
         ORDER BY period`,
        [...params, dateFormat]
      );

      // Ensure all values are properly parsed
      const processedResults = result.rows.map(row => ({
        period: row.period || '',
        bookings: parseInt(row.bookings || '0') || 0,
        revenue: parseFloat(row.revenue || '0') || 0,
        unique_clients: parseInt(row.unique_clients || '0') || 0
      }));

      res.json(processedResults);
    } catch (dbError) {
      console.error('Database query error in booking-stats:', dbError);
      // Return empty array if database query fails
      res.json([]);
    }

  } catch (error) {
    console.error('Get booking stats error:', error);
    // Return empty array for any other errors
    res.json([]);
  }
});

// Get client statistics
router.get('/client-stats', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const branchId = req.user?.role === 'admin' ? req.query.branch_id || req.user.branch_id : req.user?.branch_id;
    
    const [totalClients, activeMembers, expiringMembers, loyaltyStats] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM clients WHERE branch_id = $1 AND is_active = true', [branchId]),
      pool.query(
        'SELECT COUNT(*) FROM memberships m JOIN clients c ON m.client_id = c.id WHERE c.branch_id = $1 AND m.is_active = true AND m.end_date > CURRENT_DATE',
        [branchId]
      ),
      pool.query(
        'SELECT COUNT(*) FROM memberships m JOIN clients c ON m.client_id = c.id WHERE c.branch_id = $1 AND m.is_active = true AND m.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL \'7 days\'',
        [branchId]
      ),
      pool.query(
        'SELECT COALESCE(SUM(points), 0) as total_points FROM loyalty_points lp JOIN clients c ON lp.client_id = c.id WHERE c.branch_id = $1',
        [branchId]
      )
    ]);

    res.json({
      total_clients: parseInt(totalClients.rows[0].count) || 0,
      active_members: parseInt(activeMembers.rows[0].count) || 0,
      expiring_members: parseInt(expiringMembers.rows[0].count) || 0,
      total_loyalty_points: parseInt(loyaltyStats.rows[0].total_points) || 0
    });
  } catch (error) {
    console.error('Get client stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory alerts
router.get('/inventory-alerts', authenticateToken, requireRole(['admin', 'manager', 'employee']), async (req: AuthRequest, res) => {
  try {
    const branchId = req.user?.role === 'admin' ? req.query.branch_id || req.user.branch_id : req.user?.branch_id;
    
    const [lowStock, expiring] = await Promise.all([
      pool.query(
        'SELECT * FROM products WHERE branch_id = $1 AND stock_quantity <= min_stock_level AND is_active = true',
        [branchId]
      ),
      pool.query(
        'SELECT * FROM products WHERE branch_id = $1 AND expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL \'30 days\' AND is_active = true',
        [branchId]
      )
    ]);

    res.json({
      low_stock: lowStock.rows,
      expiring_soon: expiring.rows
    });
  } catch (error) {
    console.error('Get inventory alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;