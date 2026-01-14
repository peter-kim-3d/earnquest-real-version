-- Create family_invitations table for co-parent invites
-- Allows first parent to invite second parent to join the family

CREATE TABLE IF NOT EXISTS family_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Invite details
  invited_email VARCHAR(255) NOT NULL,
  invite_token VARCHAR(64) NOT NULL UNIQUE,

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES users(id),

  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- Indexes
CREATE INDEX idx_family_invitations_token ON family_invitations(invite_token);
CREATE INDEX idx_family_invitations_email ON family_invitations(invited_email);
CREATE INDEX idx_family_invitations_family ON family_invitations(family_id);
CREATE INDEX idx_family_invitations_status ON family_invitations(status);

-- Enable Row Level Security
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Parents can view invitations for their family
CREATE POLICY "Family members can view invitations"
  ON family_invitations FOR SELECT
  USING (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
  );

-- Parents can create invitations for their family
CREATE POLICY "Family members can create invitations"
  ON family_invitations FOR INSERT
  WITH CHECK (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
  );

-- Parents can cancel their own invitations
CREATE POLICY "Inviter can cancel invitations"
  ON family_invitations FOR UPDATE
  USING (invited_by = auth.uid());

-- Comments
COMMENT ON TABLE family_invitations IS 'Invitations for co-parents to join a family';
COMMENT ON COLUMN family_invitations.invite_token IS 'Unique token used in invite URL';
COMMENT ON COLUMN family_invitations.status IS 'pending, accepted, expired, or cancelled';
COMMENT ON COLUMN family_invitations.expires_at IS 'Invite expires after 7 days by default';
