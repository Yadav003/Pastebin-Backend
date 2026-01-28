const { query } = require('./index');

async function initializeDatabase() {
  try {
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await query(`
      CREATE TABLE IF NOT EXISTS pastes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        content TEXT NOT NULL CHECK (content <> ''),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        max_views INTEGER CHECK (max_views IS NULL OR max_views >= 1),
        views_used INTEGER NOT NULL DEFAULT 0 CHECK (views_used >= 0),
        CONSTRAINT views_not_exceeded CHECK (max_views IS NULL OR views_used <= max_views)
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_pastes_expires_at ON pastes (expires_at) 
      WHERE expires_at IS NOT NULL
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_pastes_max_views ON pastes (max_views, views_used) 
      WHERE max_views IS NOT NULL
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_pastes_created_at ON pastes (created_at DESC)
    `);

    console.log('Database initialized');
    return true;
  } catch (error) {
    console.error('Database init failed:', error.message);
    return false;
  }
}

module.exports = { initializeDatabase };
