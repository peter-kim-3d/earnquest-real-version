import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTicketDetail() {
  // Get the use_requested ticket
  const { data: ticket } = await supabase
    .from('reward_purchases')
    .select(`
      *,
      reward:rewards(name, category, screen_minutes)
    `)
    .eq('status', 'use_requested')
    .single();
  
  if (!ticket) {
    console.log('No use_requested ticket found');
    return;
  }
  
  console.log('🎫 Ticket details:');
  console.log('  ID:', ticket.id);
  console.log('  Status:', ticket.status);
  console.log('  Reward:', ticket.reward.name);
  console.log('  Category:', ticket.reward.category);
  console.log('  Screen minutes:', ticket.reward.screen_minutes);
  console.log('  Purchased at:', ticket.purchased_at);
}

getTicketDetail();
