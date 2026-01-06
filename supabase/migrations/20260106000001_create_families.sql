-- Create families table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,

  -- Settings (JSONB for flexibility)
  settings JSONB DEFAULT '{
    "timezone": "America/New_York",
    "language": "en",
    "weekStartsOn": "sunday",
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

-- Enable RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own family"
  ON families FOR SELECT
  USING (id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own family"
  ON families FOR UPDATE
  USING (id = (SELECT family_id FROM users WHERE id = auth.uid()));
