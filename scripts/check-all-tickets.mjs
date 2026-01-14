import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllTickets() {
  const { data: tickets } = await supabase
    .from('reward_purchases')
    .select('id, status, child_id, reward_id, purchased_at')
    .order('purchased_at', { ascending: false })
    .limit(10);

  console.log('📋 All recent tickets:\n');

  if (!tickets || tickets.length === 0) {
    console.log('No tickets found');
    return;
  }

  for (const ticket of tickets) {
    const statusPadded = ticket.status.padEnd(15, ' ');
    const idShort = ticket.id.substring(0, 8);
    console.log(`${statusPadded} | ${idShort}... | ${ticket.purchased_at}`);
  }

  // Count by status
  const { data: allTickets } = await supabase
    .from('reward_purchases')
    .select('status');

  const counts = {};
  allTickets?.forEach(t => {
    counts[t.status] = (counts[t.status] || 0) + 1;
  });

  console.log('\n📊 Status distribution:');
  Object.entries(counts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
}

checkAllTickets();
