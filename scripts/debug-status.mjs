import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabase() {
  // Check reward_purchases table
  const { data: purchases, error: purchasesError } = await supabase
    .from('reward_purchases')
    .select('id, status, used_at, purchased_at')
    .limit(5);
  
  console.log('📋 reward_purchases table check:');
  console.log('Error:', purchasesError);
  console.log('Has error:', !!purchasesError);
  console.log('!purchasesError (test passes if true):', !purchasesError);
  console.log('Data count:', purchases?.length || 0);
  console.log();
  
  // Check for old statuses
  const { data: oldStatuses } = await supabase
    .from('reward_purchases')
    .select('id, status')
    .in('status', ['purchased', 'fulfilled']);
  
  console.log('📋 Old status values check:');
  console.log('Count:', oldStatuses?.length || 0);
  console.log('Test should pass if count === 0');
  if (oldStatuses && oldStatuses.length > 0) {
    console.log('Found records:', oldStatuses);
  }
  console.log();
  
  // Check all statuses
  const { data: allPurchases } = await supabase
    .from('reward_purchases')
    .select('status');
  
  const statusCounts = {};
  allPurchases?.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });
  
  console.log('📊 All status distribution:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
}

checkDatabase();
