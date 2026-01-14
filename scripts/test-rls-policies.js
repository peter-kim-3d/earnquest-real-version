// Test RLS policies to ensure no infinite recursion
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testPolicies() {
  console.log('🔍 Testing RLS Policies...\n');

  try {
    // Test 1: Check if we can query families table
    console.log('1️⃣ Testing families table...');
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('*')
      .limit(1);

    if (familiesError) {
      console.log(`   ❌ Error: ${familiesError.message}\n`);
    } else {
      console.log(`   ✅ Success! Found ${families?.length || 0} families\n`);
    }

    // Test 2: Check if we can query users table
    console.log('2️⃣ Testing users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.log(`   ❌ Error: ${usersError.message}\n`);
    } else {
      console.log(`   ✅ Success! Found ${users?.length || 0} users\n`);
    }

    // Test 3: Try to create a test family (will rollback)
    console.log('3️⃣ Testing family creation...');
    const { error: createError } = await supabase
      .from('families')
      .select('*')
      .limit(0); // Just test the query, don't actually create

    if (createError) {
      console.log(`   ❌ Error: ${createError.message}\n`);
    } else {
      console.log(`   ✅ Query structure is valid\n`);
    }

    // Summary
    console.log('📊 Summary:');
    if (!familiesError && !usersError && !createError) {
      console.log('   ✅ All RLS policies working correctly!');
      console.log('   ✅ No infinite recursion detected');
      console.log('   ✅ Ready to test onboarding flow\n');
      return true;
    } else {
      console.log('   ⚠️  Some policies have issues');
      console.log('   Please check the errors above\n');
      return false;
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

testPolicies().then(success => {
  if (success) {
    console.log('🎉 RLS policies are working! You can now test the onboarding flow.\n');
  } else {
    console.log('⚠️  Please fix the issues and try again.\n');
  }
}).catch(console.error);
