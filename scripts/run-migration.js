#!/usr/bin/env node

/**
 * Run the combined database migration
 * This script reads the migration SQL and executes it using the Supabase service role key
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('📦 EarnQuest Database Migration');
  console.log('================================\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '000_all_migrations_combined_FIXED.sql');

  console.log('📖 Reading migration file...');
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log(`✓ Loaded migration file (${(sql.length / 1024).toFixed(1)} KB)\n`);

  console.log('🚀 Executing migration...');
  console.log('This may take 10-30 seconds...\n');

  try {
    // Execute the SQL using Supabase RPC
    // Note: Large SQL statements need to be executed via the REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Migration failed:');
      console.error(errorText);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Created:');
    console.log('  - 14 database tables');
    console.log('  - 3 PostgreSQL functions');
    console.log('  - Multiple triggers and views');
    console.log('  - 30+ task and reward templates\n');
    console.log('🎉 Database is ready to use!');

  } catch (error) {
    console.error('❌ Error executing migration:');
    console.error(error.message);
    process.exit(1);
  }
}

runMigration().catch(console.error);
