-- Create app_integrations table
CREATE TABLE app_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- App info
  app_name VARCHAR(100) NOT NULL,
  app_display_name VARCHAR(100) NOT NULL,

  -- Integration settings
  is_enabled BOOLEAN DEFAULT true,
  points_per_completion INT NOT NULL,
  daily_limit INT,

  -- Credentials (encrypted)
  credentials JSONB,

  -- Metadata
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_app_integrations_family_id ON app_integrations(family_id);
CREATE INDEX idx_app_integrations_app_name ON app_integrations(app_name);

-- Enable RLS
ALTER TABLE app_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family app integrations"
  ON app_integrations FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own family app integrations"
  ON app_integrations FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- Create app_integration_events table
CREATE TABLE app_integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES app_integrations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Event info
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  external_event_id VARCHAR(255),

  -- Points
  points_awarded INT NOT NULL,

  -- Metadata
  event_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_app_events_child_id ON app_integration_events(child_id);
CREATE INDEX idx_app_events_integration_id ON app_integration_events(integration_id);
CREATE INDEX idx_app_events_external_id ON app_integration_events(external_event_id);

-- Enable RLS
ALTER TABLE app_integration_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family app integration events"
  ON app_integration_events FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));
