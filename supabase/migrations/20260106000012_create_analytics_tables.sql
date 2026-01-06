-- Create weekly_summaries table
CREATE TABLE weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  -- Period
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,

  -- Statistics
  stats JSONB NOT NULL,
  /*
  Example stats structure:
  {
    "tasksCompleted": 15,
    "pointsEarned": 520,
    "pointsSpent": 300,
    "screenMinutesUsed": 180,
    "topTask": "Complete homework",
    "kindnessCardsReceived": 3,
    "trustLevelChange": 0,
    "streakDays": 5
  }
  */

  -- Weekly kindness bonus
  kindness_bonus_card_id UUID REFERENCES kindness_cards(id),
  kindness_bonus_points INT,

  -- Parent note
  parent_note TEXT,

  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_weekly_summaries_child_id ON weekly_summaries(child_id);
CREATE INDEX idx_weekly_summaries_week ON weekly_summaries(week_start);

-- Unique constraint
ALTER TABLE weekly_summaries ADD CONSTRAINT unique_child_week
  UNIQUE (child_id, week_start);

-- Enable RLS
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family weekly summaries"
  ON weekly_summaries FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own family weekly summaries"
  ON weekly_summaries FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- Create point_transactions table (audit trail)
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Transaction type
  type VARCHAR(30) NOT NULL,

  -- Amount (positive = earned, negative = spent)
  amount INT NOT NULL,
  balance_after INT NOT NULL,

  -- Reference
  reference_type VARCHAR(30),
  reference_id UUID,

  -- Description
  description TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_point_transactions_child_id ON point_transactions(child_id);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at);
CREATE INDEX idx_point_transactions_type ON point_transactions(type);

-- Enable RLS
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family point transactions"
  ON point_transactions FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));
