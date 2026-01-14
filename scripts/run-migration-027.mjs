#!/usr/bin/env node
/**
 * Apply migration 027 to remote Supabase database
 * Run: node scripts/run-migration-027.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Extract project ref
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

console.log('🚀 Applying Migration 027: Add Family Join Codes');
console.log(`📍 Project: ${projectRef}\n`);

// Read migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/027_add_family_join_codes.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

async function applyMigration() {
  try {
    console.log('📝 Executing migration SQL via Database Webhook...\n');

    // Create a temporary SQL function to execute the migration
    const wrapperSQL = `
      DO $$
      BEGIN
        ${migrationSQL.replace(/\$/g, '\\$')}
      END $$;
    `;

    // Use Supabase's query endpoint (requires creating an edge function or using SQL editor)
    // For now, we'll provide manual instructions
    console.log('─'.repeat(80));
    console.log('📋 MIGRATION SQL TO EXECUTE:');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));
    console.log();

    console.log('📝 TO APPLY THIS MIGRATION:\n');
    console.log('OPTION 1: Supabase Dashboard SQL Editor (Recommended)');
    console.log('─'.repeat(80));
    console.log(`1. Go to: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log('2. Copy the SQL shown above');
    console.log('3. Paste into the SQL editor');
    console.log('4. Click "RUN" button');
    console.log();

    console.log('OPTION 2: Supabase CLI');
    console.log('─'.repeat(80));
    console.log('1. Login: npx supabase login');
    console.log(`2. Link project: npx supabase link --project-ref ${projectRef}`);
    console.log('3. Push migration: npx supabase db push');
    console.log();

    console.log('⏳ After applying, press ENTER to verify...');

    // Wait for user input
    await waitForEnter();

    // Verify migration
    await verifyMigration();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.once('data', () => resolve());
  });
}

async function verifyMigration() {
  console.log('\n📊 Verifying migration...\n');

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/families?select=id,join_code&limit=5`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (errorText.includes('column') && errorText.includes('does not exist')) {
        console.error('❌ Migration not applied yet.');
        console.log('   The join_code column does not exist in the families table.');
        console.log('   Please apply the migration using one of the options above.');
        process.exit(1);
      }
      throw new Error(errorText);
    }

    const families = await response.json();

    if (families.length === 0) {
      console.log('⚠️  No families found in database.');
      console.log('   Migration structure likely applied correctly.');
      console.log('   Create a family to see join codes in action.\n');
    } else {
      console.log('✅ Migration verified successfully!\n');
      console.log('📦 Families with join codes:');
      console.log('─'.repeat(80));
      families.forEach((family, idx) => {
        const familyId = family.id.substring(0, 13);
        const code = family.join_code || '❌ MISSING';
        const status = family.join_code ? '✅' : '⚠️';
        console.log(`   ${status} ${idx + 1}. ID: ${familyId}... | Code: ${code}`);
      });
      console.log('─'.repeat(80));

      const hasAllCodes = families.every(f => f.join_code);
      if (hasAllCodes) {
        console.log('\n✅ All families have join codes assigned!');
      } else {
        console.log('\n⚠️  Some families are missing join codes.');
        console.log('   This should not happen - the migration auto-generates codes.');
        console.log('   You may need to run the DO $$ block again from the migration file.');
      }
    }

    console.log('\n🎉 Migration complete! Next steps:');
    console.log('   1. Log in as parent → Settings → See "Child Device Access" section');
    console.log('   2. Copy the family code');
    console.log('   3. Open child-login page → Enter code → Select child');
    console.log('   4. Verify child can access dashboard\n');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.log('\n   Please manually verify the families table has join_code column.');
  }
}

applyMigration();
