import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecentTicket() {
  // Get the most recent used ticket (the one that just completed)
  const { data: ticket } = await supabase
    .from('reward_purchases')
    .select('*')
    .eq('status', 'used')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  
  if (!ticket) {
    console.log('No used tickets found');
    return;
  }
  
  console.log('📋 Most recently used ticket:');
  console.log('  ID:', ticket.id);
  console.log('  Status:', ticket.status);
  console.log('  Purchased at:', ticket.purchased_at);
  console.log('  Started at:', ticket.started_at);
  console.log('  Fulfilled at:', ticket.fulfilled_at);
  console.log('  Used at:', ticket.used_at);
  console.log('  Updated at:', ticket.updated_at);
  
  // Check if it has started_at (which means timer was used)
  if (ticket.started_at) {
    console.log('\n✅ Timer was used (has started_at)');
    const startTime = new Date(ticket.started_at);
    const endTime = ticket.used_at ? new Date(ticket.used_at) : new Date();
    const duration = Math.round((endTime - startTime) / 1000 / 60);
    console.log(`  Duration: ${duration} minutes`);
  } else {
    console.log('\n❌ No timer (started_at is null)');
  }
}

checkRecentTicket();
