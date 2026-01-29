/**
 * Script to apply the birthdate migration to the children table
 * This adds a birthdate column to support exact birthdate storage
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function applyMigration() {
  console.log('🚀 Applying birthdate migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/016_add_birthdate_to_children.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration SQL:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    console.log('\n');

    // Use Supabase REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey!,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: migrationSQL }),
    });

    if (!response.ok) {
      console.log('ℹ️  Direct API execution not available\n');
      console.log('📝 Please apply this migration manually:\n');
      console.log('1. Go to: https://supabase.com/dashboard/project/blstphkvdrrhtdxrllvx/sql');
      console.log('2. Click "+ New query"');
      console.log('3. Copy and paste the SQL above');
      console.log('4. Click "Run"\n');
      console.log('Alternative: Use Supabase CLI after linking:');
      console.log('  npx supabase login');
      console.log('  npx supabase link --project-ref blstphkvdrrhtdxrllvx');
      console.log('  npx supabase db push\n');
      process.exit(0);
    }

    console.log('✅ Migration applied successfully!');
    console.log('✅ The children table now has a birthdate column\n');

  } catch (err: unknown) {
    console.error('❌ Error:', err instanceof Error ? err.message : String(err));
    console.log('\n📝 Please apply this migration manually:');
    console.log('1. Go to: Supabase Dashboard → SQL Editor');
    console.log('2. Run the SQL from: supabase/migrations/016_add_birthdate_to_children.sql\n');
    process.exit(0);
  }
}

applyMigration();
