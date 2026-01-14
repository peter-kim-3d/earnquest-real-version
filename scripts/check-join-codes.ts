/**
 * Check join codes in database
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJoinCodes() {
  console.log('🔍 Checking join codes in database...\n');

  // Get all families
  const { data: families, error } = await supabase
    .from('families')
    .select('id, name, join_code, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching families:', error);
    return;
  }

  if (!families || families.length === 0) {
    console.log('⚠️  No families found in database');
    return;
  }

  console.log(`✅ Found ${families.length} familie(s):\n`);

  for (const family of families) {
    console.log(`Family: ${family.name}`);
    console.log(`  ID: ${family.id}`);
    console.log(`  Join Code: ${family.join_code || '(none)'}`);
    console.log(`  Created: ${new Date(family.created_at).toLocaleString()}`);
    console.log('');
  }

  // Test specific code from screenshot
  const testCode = 'W5HXFC';
  console.log(`\n🧪 Testing specific code: ${testCode}`);

  const { data: testFamily, error: testError } = await supabase
    .from('families')
    .select('id, name, join_code')
    .eq('join_code', testCode)
    .single();

  if (testError) {
    console.log(`❌ Error: ${testError.message}`);
    console.log(`   Code: ${testError.code}`);
  } else if (testFamily) {
    console.log(`✅ Found family: ${testFamily.name}`);
  } else {
    console.log(`❌ No family found with code: ${testCode}`);
  }
}

checkJoinCodes().catch(console.error);
