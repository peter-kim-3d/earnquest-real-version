# Migration Scripts

This folder contains helper scripts for EarnQuest Task System v2 migration.

## 📁 Files

### `run-migration.sh`
Interactive migration runner script.

**Usage:**
```bash
./scripts/run-migration.sh
```

**Features:**
- Pre-flight safety checks
- Multiple migration methods (CLI, Manual SQL, Show files)
- Step-by-step guidance
- Color-coded output

### `verify-migration.sql`
SQL verification script to check migration success.

**Usage:**
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/blstphkvdrrhtdxrllvx/sql
2. Copy/paste content from this file
3. Run query
4. Review results

**Checks:**
- Schema changes applied
- Data migrated correctly
- Templates inserted (13 total)
- Constraints working
- No invalid data

## 🚀 Quick Start

**Recommended Flow:**

1. **Backup database first!**
   - Go to Supabase Dashboard → Settings → Backups
   - Download latest backup

2. **Run migration:**
   ```bash
   ./scripts/run-migration.sh
   ```

3. **Verify migration:**
   - Copy `verify-migration.sql` into Supabase SQL Editor
   - Run it
   - Check all metrics

4. **Test application:**
   - Follow `TESTING_CHECKLIST.md`
   - Create test family
   - Test all features

## 📖 Documentation

- **Full Guide:** `../MIGRATION_GUIDE.md`
- **Testing:** `../TESTING_CHECKLIST.md`
- **Plan:** `../.claude/plans/sparkling-meandering-hippo.md`

## 🆘 Help

If migrations fail:
1. Check error message
2. See troubleshooting in `MIGRATION_GUIDE.md`
3. Restore from backup if needed
4. Run rollback: `supabase/migrations/020_rollback_task_system_v2_enums.sql`
