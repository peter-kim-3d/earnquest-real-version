-- Migration 051: Make invited_email nullable for link-based invitations
-- Previously email was required, now invitations can be link-only

ALTER TABLE family_invitations ALTER COLUMN invited_email DROP NOT NULL;

COMMENT ON COLUMN family_invitations.invited_email IS 'Email of invited person (nullable - link-based invitations do not require email)';
