/**
 * Test API logic directly to debug
 */

import { createServerClient } from '@supabase/ssr';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testDirectly() {
  console.log('🧪 Testing API logic directly...\n');

  const testCode = 'W5HXFC';

  // Test 1: Service Role Client (like our script)
  console.log('Test 1: Using Service Role Key');
  const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

  const { data: family1, error: error1 } = await serviceClient
    .from('families')
    .select('id, name, join_code')
    .eq('join_code', testCode)
    .single();

  if (error1) {
    console.log(`❌ Error: ${error1.message}`);
  } else {
    console.log(`✅ Found: ${family1?.name} (${family1?.join_code})`);
  }

  // Test 2: Anon Key Client (like API might use)
  console.log('\nTest 2: Using Anon Key');
  const anonClient = createServiceClient(supabaseUrl, supabaseAnonKey);

  const { data: family2, error: error2 } = await anonClient
    .from('families')
    .select('id, name, join_code')
    .eq('join_code', testCode)
    .single();

  if (error2) {
    console.log(`❌ Error: ${error2.message}`);
    console.log(`   Code: ${error2.code}`);
    console.log(`   Details: ${error2.details}`);
    console.log(`   Hint: ${error2.hint}`);
  } else {
    console.log(`✅ Found: ${family2?.name} (${family2?.join_code})`);
  }

  // Test 3: Check RLS policies
  console.log('\nTest 3: Checking families table structure');
  const { data: columns, error: columnsError } = await serviceClient
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_name', 'families')
    .eq('table_schema', 'public');

  if (!columnsError && columns) {
    console.log('Columns in families table:');
    columns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
  }
}

testDirectly().catch(console.error);
