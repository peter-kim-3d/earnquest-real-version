-- Migration 025: Fix Permissions on child_task_overrides
-- Issue: Table was created but likely missing GRANTs, causing "permission denied" even for service_role.

GRANT ALL ON TABLE child_task_overrides TO postgres;
GRANT ALL ON TABLE child_task_overrides TO service_role;
GRANT ALL ON TABLE child_task_overrides TO authenticated;
GRANT ALL ON TABLE child_task_overrides TO anon;

-- Also ensure future tables? No, just this one.
