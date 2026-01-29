/**
 * Direct script to add birthdate column to children table
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addBirthdateColumn() {
  console.log('🔧 Adding birthdate column to children table...\n');

  try {
    // First, check if column already exists
    const { data: testData, error: testError } = await supabase
      .from('children')
      .select('birthdate')
      .limit(1);

    if (!testError) {
      console.log('✅ Column already exists! No migration needed.\n');
      return;
    }

    console.log('Column does not exist yet. Attempting to add...\n');

    // Try to execute the ALTER TABLE using a postgres function
    // Note: This requires creating a helper function in Supabase
    const { error } = await supabase.rpc('exec', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='children' AND column_name='birthdate'
          ) THEN
            ALTER TABLE children ADD COLUMN birthdate DATE;
            COMMENT ON COLUMN children.birthdate IS 'Child''s exact birthdate for age calculation and Artales integration';
          END IF;
        END $$;
      `
    });

    if (error) {
      throw error;
    }

    console.log('✅ Successfully added birthdate column!\n');

  } catch (error: unknown) {
    console.error('❌ Could not add column automatically:', error instanceof Error ? error.message : String(error));
    console.log('\n📋 Please add the column manually:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/blstphkvdrrhtdxrllvx/sql');
    console.log('2. Click "+ New query"');
    console.log('3. Paste and run this SQL:\n');
    console.log('─'.repeat(60));
    console.log(`
ALTER TABLE children
ADD COLUMN IF NOT EXISTS birthdate DATE;

COMMENT ON COLUMN children.birthdate IS 'Child''s exact birthdate for age calculation and Artales integration';
    `);
    console.log('─'.repeat(60));
    console.log('\n4. Click "Run"\n');
  }
}

addBirthdateColumn();
