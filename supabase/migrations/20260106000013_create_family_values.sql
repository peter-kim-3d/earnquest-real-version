-- Create family_values table (No-Point Zone)
CREATE TABLE family_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Content
  value_key VARCHAR(100),
  value_text VARCHAR(200) NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_family_values_family_id ON family_values(family_id);

-- Enable RLS
ALTER TABLE family_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family values"
  ON family_values FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own family values"
  ON family_values FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));
