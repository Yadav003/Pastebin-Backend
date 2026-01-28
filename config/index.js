require('dotenv').config();

// Auto-detect Vercel deployment URL
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
const isProduction = process.env.NODE_ENV === 'production';

const databaseUrl = process.env.DATABASE_URL;
const sslFromUrl = typeof databaseUrl === 'string'
  ? /(^|[?&])sslmode=require([&#]|$)/i.test(databaseUrl) || /(^|[?&])ssl=(true|1)([&#]|$)/i.test(databaseUrl)
  : false;
const sslEnabled = isProduction || sslFromUrl || process.env.DB_SSL === 'true';

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    connectionString: databaseUrl,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  },
  testMode: process.env.TEST_MODE === '1',
  // Dynamic URLs: prioritize env vars, fallback to Vercel auto-detection, then localhost
  frontendUrl: process.env.FRONTEND_URL || vercelUrl || 'http://localhost:5173',
  baseUrl: process.env.BASE_URL || vercelUrl || 'http://localhost:3000',
};

module.exports = config;
