import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugTicket() {
  // Get all active tickets
  const { data: tickets } = await supabase
    .from('reward_purchases')
    .select('*')
    .eq('status', 'active')
    .limit(5);
  
  console.log('📋 Active tickets:', tickets?.length);
  
  if (tickets && tickets.length > 0) {
    const ticket = tickets[0];
    console.log('\n🎫 First ticket:');
    console.log('  ID:', ticket.id);
    console.log('  Status:', ticket.status);
    console.log('  Child ID:', ticket.child_id);
    console.log('  Reward ID:', ticket.reward_id);
    
    // Get reward details
    const { data: reward } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', ticket.reward_id)
      .single();
    
    console.log('\n🎁 Reward:');
    console.log('  Name:', reward?.name);
    console.log('  Category:', reward?.category);
    console.log('  Screen minutes:', reward?.screen_minutes);
    
    // Try to call request_ticket_use
    console.log('\n🔧 Testing request_ticket_use...');
    const { data, error } = await supabase.rpc('request_ticket_use', {
      p_purchase_id: ticket.id,
      p_child_id: ticket.child_id,
    });
    
    console.log('Result:', data);
    console.log('Error:', error);
  }
}

debugTicket();
