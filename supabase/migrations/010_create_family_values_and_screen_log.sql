-- Create family_values table
CREATE TABLE IF NOT EXISTS family_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  value_id TEXT NOT NULL, -- 'gratitude', 'greetings', 'honesty', 'respect', 'clean_spaces', etc.
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Material Symbol icon name
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(family_id, value_id)
);

-- Create screen_usage_log table
CREATE TABLE IF NOT EXISTS screen_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  reward_purchase_id UUID REFERENCES reward_purchases(id) ON DELETE SET NULL,
  minutes_used INTEGER NOT NULL,

  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT positive_minutes CHECK (minutes_used > 0)
);

-- Indexes
CREATE INDEX idx_family_values_family_id ON family_values(family_id);
CREATE INDEX idx_family_values_active ON family_values(is_active);

CREATE INDEX idx_screen_usage_child_id ON screen_usage_log(child_id);
CREATE INDEX idx_screen_usage_family_id ON screen_usage_log(family_id);
CREATE INDEX idx_screen_usage_created_at ON screen_usage_log(created_at DESC);
CREATE INDEX idx_screen_usage_started_at ON screen_usage_log(started_at);

-- RLS Policies
ALTER TABLE family_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family's values"
  ON family_values FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Parents can manage their family's values"
  ON family_values FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view their family's screen usage"
  ON screen_usage_log FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Parents can manage screen usage"
  ON screen_usage_log FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

-- Trigger for family_values updated_at
CREATE TRIGGER update_family_values_updated_at
  BEFORE UPDATE ON family_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE family_values IS 'Non-negotiable values for each family (no points for these)';
COMMENT ON TABLE screen_usage_log IS 'Log of screen time usage by children';
COMMENT ON COLUMN screen_usage_log.reward_purchase_id IS 'Link to the reward purchase that granted this screen time';
