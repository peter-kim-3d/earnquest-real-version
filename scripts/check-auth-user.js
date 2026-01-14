// Check if OAuth user was created in Supabase Auth
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

async function checkAuthUsers() {
  console.log('🔍 Checking authenticated users...\n');

  // List users in auth.users table
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error fetching auth users:', authError.message);
    return;
  }

  console.log(`✅ Found ${authUsers.users.length} user(s) in auth.users:\n`);

  authUsers.users.forEach((user, i) => {
    console.log(`User ${i + 1}:`);
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Provider: ${user.app_metadata.provider}`);
    console.log(`  - Created: ${new Date(user.created_at).toLocaleString()}`);
    console.log('');
  });

  // Check if user exists in our users table
  console.log('🔍 Checking users table...\n');
  const { data: dbUsers, error: dbError } = await supabase
    .from('users')
    .select('*');

  if (dbError) {
    console.error('❌ Error fetching users table:', dbError.message);
    return;
  }

  console.log(`${dbUsers.length > 0 ? '✅' : '⚠️'} Found ${dbUsers.length} user(s) in users table\n`);

  if (dbUsers.length === 0) {
    console.log('⚠️  User authenticated but not in users table yet');
    console.log('💡 We need to create a user profile after OAuth signup\n');
  } else {
    dbUsers.forEach((user, i) => {
      console.log(`DB User ${i + 1}:`);
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Name: ${user.full_name || 'Not set'}`);
      console.log(`  - Family ID: ${user.family_id || 'Not set'}`);
      console.log('');
    });
  }
}

checkAuthUsers().catch(console.error);
