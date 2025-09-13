// server/mock-server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// تحقق من الـ env
if (!JWT_SECRET) {
  console.error('❌ Missing JWT_SECRET. ضيف JWT_SECRET في ملف .env');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ ok: true, port });
});

// 🟢 Login endpoint
app.post('/auth/login', (req, res) => {
  const { email, password, branch_id } = req.body || {};

  console.log('🔑 Login attempt:', { email, branch_id });

  // تحقق موك: أي ايميل+باسورد شغّال (غير في الشروط حسب احتياجك)
  if (email && password) {
    const user = {
      id: 1,
      email,
      branch_id,
      name: "Test User"
    };

    return res.json({
      token: "mock.jwt.token",
      user
    });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

// أي API تانية للتجربة
app.get('/api/example', (_req, res) => {
  res.json({ data: "example" });
});

// Run server
app.listen(port, () => {
  console.log(`✅ Mock server listening on http://localhost:${port}`);
});
