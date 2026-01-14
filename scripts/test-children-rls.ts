/**
 * Test children RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testChildrenRLS() {
  console.log('🧪 Testing children table RLS...\n');

  const familyId = '6c50c120-c299-4e73-892c-e3ef1eb6dc84'; // From earlier test

  // Test with Service Role
  console.log('Test 1: Service Role Key');
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  const { data: children1, error: error1 } = await serviceClient
    .from('children')
    .select('id, name, age_group, avatar_url')
    .eq('family_id', familyId)
    .order('created_at');

  if (error1) {
    console.log(`❌ Error: ${error1.message}`);
  } else {
    console.log(`✅ Found ${children1?.length || 0} children`);
    children1?.forEach(child => console.log(`   - ${child.name} (${child.age_group})`));
  }

  // Test with Anon Key
  console.log('\nTest 2: Anon Key (API uses this)');
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: children2, error: error2 } = await anonClient
    .from('children')
    .select('id, name, age_group, avatar_url')
    .eq('family_id', familyId)
    .order('created_at');

  if (error2) {
    console.log(`❌ Error: ${error2.message}`);
    console.log(`   Code: ${error2.code}`);
    console.log(`   This is the problem! Children table needs RLS policy.`);
  } else {
    console.log(`✅ Found ${children2?.length || 0} children`);
    children2?.forEach(child => console.log(`   - ${child.name} (${child.age_group})`));
  }
}

testChildrenRLS().catch(console.error);
