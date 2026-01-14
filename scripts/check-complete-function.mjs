import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFunction() {
  console.log('🔍 Testing complete_screen_time function...\n');
  
  // Get an in_use ticket
  const { data: ticket } = await supabase
    .from('reward_purchases')
    .select('*')
    .eq('status', 'in_use')
    .single();
  
  if (!ticket) {
    console.log('No in_use tickets found');
    
    // Check if function exists by trying to call it
    const { data, error } = await supabase.rpc('complete_screen_time', {
      p_purchase_id: '00000000-0000-0000-0000-000000000000',
      p_child_id: '00000000-0000-0000-0000-000000000000',
    });
    
    console.log('\nFunction test result:');
    console.log('Data:', data);
    console.log('Error:', error);
    
    if (error && error.message.includes('does not exist')) {
      console.log('\n❌ Function complete_screen_time does NOT exist!');
      console.log('Please apply migration 031_add_screen_time_timer.sql');
    } else {
      console.log('\n✅ Function exists (got validation error as expected)');
    }
    return;
  }
  
  console.log('Found in_use ticket:');
  console.log('  ID:', ticket.id);
  console.log('  Status:', ticket.status);
  console.log('  Child ID:', ticket.child_id);
  console.log('  Started at:', ticket.started_at);
  
  // Try to call the function
  console.log('\n🔧 Testing complete_screen_time...');
  const { data, error } = await supabase.rpc('complete_screen_time', {
    p_purchase_id: ticket.id,
    p_child_id: ticket.child_id,
  });
  
  console.log('Result:', data);
  console.log('Error:', error);
}

checkFunction();
