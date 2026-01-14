-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,

  -- Settings (JSONB for flexibility)
  settings JSONB DEFAULT '{
    "timezone": "Asia/Seoul",
    "language": "en-US",
    "weekStartsOn": "monday",
    "autoApprovalHours": 24,
    "screenBudgetWeeklyMinutes": 300
  }'::jsonb,

  -- Subscription info
  subscription_tier VARCHAR(20) DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_families_deleted_at ON families(deleted_at) WHERE deleted_at IS NULL;

-- Enable Row Level Security
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own family"
  ON families FOR SELECT
  USING (id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own family"
  ON families FOR UPDATE
  USING (id IN (SELECT family_id FROM users WHERE id = auth.uid()));

-- Comments
COMMENT ON TABLE families IS 'Family accounts that group users and children';
COMMENT ON COLUMN families.settings IS 'Family-wide settings and preferences';
COMMENT ON COLUMN families.subscription_tier IS 'Subscription level: free or premium';
