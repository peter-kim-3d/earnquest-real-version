/**
 * Script to display migration SQL for manual application
 * These migrations add authentication features: birthdate and family invitations
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  EarnQuest Authentication Migrations                        ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('📝 Please apply these 2 migrations in your Supabase Dashboard:\n');
console.log('   https://supabase.com/dashboard/project/blstphkvdrrhtdxrllvx/sql\n');
console.log('═'.repeat(64));

// Migration 1: Birthdate
console.log('\n\n📋 MIGRATION 1: Add Birthdate to Children\n');
console.log('─'.repeat(64));

const migration1 = `
ALTER TABLE children
ADD COLUMN IF NOT EXISTS birthdate DATE;

COMMENT ON COLUMN children.birthdate IS 'Child''s exact birthdate for age calculation and Artales integration';
`;

console.log(migration1);
console.log('─'.repeat(64));

// Migration 2: Family Invitations
console.log('\n\n📋 MIGRATION 2: Create Family Invitations Table\n');
console.log('─'.repeat(64));

const migration2Path = path.join(__dirname, '../supabase/migrations/017_create_family_invitations.sql');
const migration2 = fs.readFileSync(migration2Path, 'utf-8');

console.log(migration2);
console.log('─'.repeat(64));

console.log('\n\n✅ After applying these migrations, you can test:\n');
console.log('   1. Landing page with Parent/Kid selection');
console.log('   2. Child PIN login');
console.log('   3. Parent invite system');
console.log('   4. Complete onboarding with birthdate\n');
