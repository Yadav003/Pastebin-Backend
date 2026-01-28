const { Pool } = require('pg');
const config = require('../config');

let pool = null;

function getPool() {
  if (!pool) {
    if (!config.database.connectionString) {
      throw new Error(
        'DATABASE_URL is required (cloud Postgres). Set DATABASE_URL in your environment.'
      );
    }

    const poolConfig = {
      connectionString: config.database.connectionString,
      ssl: config.database.ssl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    pool = new Pool(poolConfig);
    pool.on('error', (err) => {
      console.error('Pool error:', err.message);
    });
  }
  return pool;
}

async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}

async function checkConnection() {
  try {
    const result = await query('SELECT 1 as connected');
    return result.rows[0]?.connected === 1;
  } catch {
    return false;
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { query, getPool, checkConnection, closePool };
