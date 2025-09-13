import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockUsers = [
  {
    id: '1',
    name: 'مدير النظام',
    email: 'admin@shaghaf.eg',
    role: 'admin',
    branch_id: '1'
  }
];

const mockBranches = [
  {
    id: '1',
    name: 'الفرع الرئيسي',
    address: 'شارع التحرير، وسط البلد، القاهرة',
    phone: '+20101234567',
    email: 'main@shaghaf.eg',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  }
];

// Simple auth middleware
const auth = (req, res, next) => {
  req.user = mockUsers[0];
  next();
};

// Routes
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  const user = mockUsers.find(u => u.email === email) || mockUsers[0];
  
  res.json({
    token: 'mock-token-' + Date.now(),
    user
  });
});

app.get('/api/auth/profile', auth, (req, res) => {
  res.json(req.user);
});

app.get('/api/branches', auth, (req, res) => {
  res.json(mockBranches);
});

app.get('/api/branches/:id', auth, (req, res) => {
  const branch = mockBranches.find(b => b.id === req.params.id);
  if (branch) {
    res.json(branch);
  } else {
    res.status(404).json({ error: 'Branch not found' });
  }
});

// Empty responses for other endpoints
app.get('/api/rooms', auth, (req, res) => res.json([]));
app.get('/api/clients', auth, (req, res) => res.json([]));
app.get('/api/bookings', auth, (req, res) => res.json([]));
app.get('/api/inventory/products', auth, (req, res) => {
  // Mock products with pricing fields
  res.json([
    {
      id: '1',
      branch_id: '1',
      name: 'قهوة عربية',
      category: 'مشروبات',
      price: 15,
      staff_price: 10,
      order_price: 12,
      cost: 8,
      stock_quantity: 45,
      min_stock_level: 50,
      max_stock_level: 200,
      unit: 'كوب',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      branch_id: '1',
      name: 'شاي بالنعناع',
      category: 'مشروبات',
      price: 12,
      staff_price: 8,
      order_price: 10,
      cost: 6,
      stock_quantity: 8,
      min_stock_level: 30,
      max_stock_level: 150,
      unit: 'كوب',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z'
    }
  ]);
});
app.get('/api/inventory/suppliers', auth, (req, res) => res.json([]));
app.get('/api/employees', auth, (req, res) => res.json([]));
app.get('/api/finance/invoices', auth, (req, res) => res.json([]));
app.get('/api/finance/expenses', auth, (req, res) => res.json([]));

app.get('/api/reports/financial-summary', auth, (req, res) => {
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

app.get('/api/reports/booking-stats', auth, (req, res) => res.json([]));
app.get('/api/reports/client-stats', auth, (req, res) => {
  res.json({
    total_clients: 0,
    active_members: 0,
    expiring_members: 0,
    total_loyalty_points: 0
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
});