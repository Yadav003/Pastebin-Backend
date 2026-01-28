-- PostgreSQL schema for Pastebin-Lite


CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create pastes table
CREATE TABLE IF NOT EXISTS pastes (
    -- Primary key: UUID for unique identification
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Content of the paste (required, non-empty)
    content TEXT NOT NULL CHECK (content <> ''),
    
    -- Timestamp when paste was created
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Optional expiration timestamp (NULL = no time-based expiry)
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Optional maximum view count (NULL = unlimited views)
    max_views INTEGER CHECK (max_views IS NULL OR max_views >= 1),
    
    -- Current view count (never negative)
    views_used INTEGER NOT NULL DEFAULT 0 CHECK (views_used >= 0),
    
    -- Constraint: views_used cannot exceed max_views when max_views is set
    CONSTRAINT views_not_exceeded CHECK (
        max_views IS NULL OR views_used <= max_views
    )
);

-- Index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_pastes_expires_at ON pastes (expires_at) 
    WHERE expires_at IS NOT NULL;

-- Index for efficient view-limited paste queries
CREATE INDEX IF NOT EXISTS idx_pastes_max_views ON pastes (max_views, views_used) 
    WHERE max_views IS NOT NULL;

-- Index for created_at for sorting/querying recent pastes
CREATE INDEX IF NOT EXISTS idx_pastes_created_at ON pastes (created_at DESC);

-- Comments for documentation
COMMENT ON TABLE pastes IS 'Stores paste content with optional expiration (TTL) and view limits';
COMMENT ON COLUMN pastes.id IS 'Unique identifier for the paste (UUID)';
COMMENT ON COLUMN pastes.content IS 'The actual paste content (required, non-empty)';
COMMENT ON COLUMN pastes.created_at IS 'When the paste was created';
COMMENT ON COLUMN pastes.expires_at IS 'When the paste expires (NULL = never expires by time)';
COMMENT ON COLUMN pastes.max_views IS 'Maximum allowed views (NULL = unlimited views)';
COMMENT ON COLUMN pastes.views_used IS 'Number of times paste has been viewed';
