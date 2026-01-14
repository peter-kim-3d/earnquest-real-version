import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatuses() {
  console.log('🔍 Checking reward_purchases status values...\n');

  // Check old statuses
  const { data: oldStatuses } = await supabase
    .from('reward_purchases')
    .select('id, status, purchased_at')
    .in('status', ['purchased', 'fulfilled'])
    .order('purchased_at', { ascending: false });

  if (oldStatuses && oldStatuses.length > 0) {
    console.log(`❌ Found ${oldStatuses.length} records with old status values:\n`);
    oldStatuses.forEach(p => {
      console.log(`  - ID: ${p.id.substring(0, 8)}... | Status: ${p.status} | Date: ${p.purchased_at}`);
    });
    console.log('\n📝 Migrating these records now...');

    // Migrate them
    for (const record of oldStatuses) {
      if (record.status === 'purchased') {
        await supabase
          .from('reward_purchases')
          .update({ status: 'active' })
          .eq('id', record.id);
        console.log(`  ✓ Migrated ${record.id.substring(0, 8)}... purchased → active`);
      } else if (record.status === 'fulfilled') {
        await supabase
          .from('reward_purchases')
          .update({
            status: 'used',
            used_at: new Date().toISOString()
          })
          .eq('id', record.id);
        console.log(`  ✓ Migrated ${record.id.substring(0, 8)}... fulfilled → used`);
      }
    }
    console.log('\n✅ Migration complete!');
  } else {
    console.log('✅ No old status values found!\n');
  }

  // Check new statuses
  const { data: newStatuses } = await supabase
    .from('reward_purchases')
    .select('status')
    .in('status', ['active', 'use_requested', 'used', 'cancelled']);

  const statusCounts = {};
  newStatuses?.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });

  console.log('\n📊 Current status distribution:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  - ${status}: ${count}`);
  });
}

checkStatuses();
