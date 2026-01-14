-- Create users table (links to auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,

  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'parent',
  avatar_url TEXT,

  -- Settings
  settings JSONB DEFAULT '{
    "notifications": {
      "taskCompletion": true,
      "weeklyReport": true,
      "rewardPurchase": true
    }
  }'::jsonb,

  -- Metadata
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_users_email ON users(email);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own family members"
  ON users FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Comments
COMMENT ON TABLE users IS 'Parent users linked to Supabase Auth';
COMMENT ON COLUMN users.role IS 'User role: parent or admin';
COMMENT ON COLUMN users.settings IS 'User-specific settings and notification preferences';
