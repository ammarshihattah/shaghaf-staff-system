// server.js (ESM)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { mockUsers, mockBranches } from './mockData.js';
import simpleRoutes from './routes/simple.js'; // <-- تأكد إنه .js فعلاً أو مبني لـ dist

dotenv.config();

const { Pool } = pkg;

// Check for required environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ Missing JWT_SECRET in environment variables');
  console.error('💡 Please make sure .env file exists with JWT_SECRET defined');
  console.error('📄 Expected: JWT_SECRET=your-secret-key');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

DATABASE_URL:postgresql://postgres:7QKZMe9rmVye4FKy@db.jcksfsyrwbkzllxwzorw.supabase.co:5432/postgres
let pool = null;
async function initializeDatabase() {
  try {
    if (process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        // لو بتستخدم sslmode=require في URL مش لازم تحدد ssl هنا
        // ssl: { rejectUnauthorized: false },
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
        allowExitOnIdle: false,
      });
      const client = await pool.connect();
      console.log('✅ Database connected successfully');
      client.release();
    } else {
      console.warn('⚠️  No DATABASE_URL found. Running with mock data only.');
    }
  } catch (err) {
    console.error('❌ Database connection failed:', err?.message || err);
    console.warn('⚠️  Falling back to mock data mode');
    pool = null;
  }
}

// Helmet (CSP ميسّر للإنتاج)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        FRONTEND_URL,
        "http://localhost:*",
        "https://localhost:*",
        // سمح بدومين الـ API نفسه لو مختلف
        process.env.API_ORIGIN || "'self'"
      ].filter(Boolean),
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
}));

// CORS (قائمة مسموحة)
const allowed = [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowed.includes(origin)),
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','Accept'],
}));

app.set('trust proxy', 1); // خلف بروكسي/كلاود
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: pool ? 'connected' : 'mock_mode',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api', simpleRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('💥 Server Error:', err?.stack || err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err?.message || 'Error'),
  });
});

// 404
app.use('*', (req, res) => res.status(404).json({ error: 'Route not found' }));

// Start + graceful shutdown
const server = app.listen(PORT, '0.0.0.0', async () => {
  await initializeDatabase();
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎯 Database: ${pool ? 'PostgreSQL connected' : 'Mock data mode'}`);
  console.log(`🌐 CORS: ${allowed.join(', ')}`);
});

async function shutdown(kind) {
  console.log(`🛑 ${kind} received. Shutting down...`);
  try { if (pool) await pool.end(); } catch {}
  server.close(() => process.exit(0));
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export { app, pool };
