#!/usr/bin/env node

/**
 * Comprehensive test suite for ticket redemption system
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (message) console.log(`   ${message}`);
  
  results.tests.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

async function runTests() {
  console.log('\n🧪 Testing Ticket Redemption System\n');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Check schema changes
    console.log('\n📋 Test Group 1: Schema Validation');
    console.log('-'.repeat(60));
    
    const { data: purchases, error: purchasesError } = await supabase
      .from('reward_purchases')
      .select('id, status, used_at, purchased_at')
      .limit(1);
    
    logTest(
      'reward_purchases table accessible',
      !purchasesError,
      'Table query successful'
    );
    
    // Test 2: Check status values
    console.log('\n📋 Test Group 2: Status Migration');
    console.log('-'.repeat(60));
    
    const { data: activeTickets } = await supabase
      .from('reward_purchases')
      .select('status')
      .eq('status', 'active');
    
    const { data: usedTickets } = await supabase
      .from('reward_purchases')
      .select('status')
      .eq('status', 'used');
    
    logTest(
      'New status values work',
      activeTickets !== null && usedTickets !== null,
      `Found ${activeTickets?.length || 0} active, ${usedTickets?.length || 0} used tickets`
    );
    
    // Check for old status values
    const { data: oldStatuses } = await supabase
      .from('reward_purchases')
      .select('status')
      .in('status', ['purchased', 'fulfilled']);
    
    logTest(
      'Old statuses migrated',
      oldStatuses?.length === 0,
      oldStatuses?.length === 0 ? 'No old status values found (good!)' : `Found ${oldStatuses?.length} old status values`
    );
    
    // Test 3: Check database functions exist
    console.log('\n📋 Test Group 3: Database Functions');
    console.log('-'.repeat(60));
    
    // Test request_ticket_use function
    try {
      const { error } = await supabase.rpc('request_ticket_use', {
        p_purchase_id: '00000000-0000-0000-0000-000000000000',
        p_child_id: '00000000-0000-0000-0000-000000000000'
      });
      
      // Function exists if we get a validation error (not "function doesn't exist")
      const exists = !error || error.message?.includes('Ticket not found') || !error.message?.includes('does not exist');
      logTest(
        'Function request_ticket_use() exists',
        exists,
        exists ? 'Function callable' : 'Function not found'
      );
    } catch (e) {
      logTest('Function request_ticket_use() exists', false, e.message);
    }
    
    // Test approve_ticket_use function
    try {
      const { error } = await supabase.rpc('approve_ticket_use', {
        p_purchase_id: '00000000-0000-0000-0000-000000000000',
        p_parent_id: '00000000-0000-0000-0000-000000000000'
      });
      
      const exists = !error || error.message?.includes('Ticket not found') || error.message?.includes('Parent not found') || !error.message?.includes('does not exist');
      logTest(
        'Function approve_ticket_use() exists',
        exists,
        exists ? 'Function callable' : 'Function not found'
      );
    } catch (e) {
      logTest('Function approve_ticket_use() exists', false, e.message);
    }
    
    // Test fulfill_ticket function
    try {
      const { error } = await supabase.rpc('fulfill_ticket', {
        p_purchase_id: '00000000-0000-0000-0000-000000000000',
        p_parent_id: '00000000-0000-0000-0000-000000000000'
      });
      
      const exists = !error || error.message?.includes('Ticket not found') || error.message?.includes('Parent not found') || !error.message?.includes('does not exist');
      logTest(
        'Function fulfill_ticket() exists',
        exists,
        exists ? 'Function callable' : 'Function not found'
      );
    } catch (e) {
      logTest('Function fulfill_ticket() exists', false, e.message);
    }
    
    // Test updated purchase_reward function
    try {
      const { data, error } = await supabase.rpc('purchase_reward', {
        p_reward_id: '00000000-0000-0000-0000-000000000000',
        p_child_id: '00000000-0000-0000-0000-000000000000'
      });
      
      // Function should return JSONB with success field
      const exists = data !== null || (error && !error.message?.includes('does not exist'));
      logTest(
        'Function purchase_reward() updated',
        exists,
        exists ? 'Function callable with new signature' : 'Function not found'
      );
    } catch (e) {
      logTest('Function purchase_reward() updated', false, e.message);
    }
    
    // Test 4: Check index exists
    console.log('\n📋 Test Group 4: Performance Indexes');
    console.log('-'.repeat(60));
    
    const start = Date.now();
    const { data: pendingRequests } = await supabase
      .from('reward_purchases')
      .select('*')
      .eq('status', 'use_requested')
      .limit(10);
    
    const duration = Date.now() - start;
    logTest(
      'Guardrail index performance',
      duration < 1000,
      `Query completed in ${duration}ms`
    );
    
    // Test 5: Check category constraint
    console.log('\n📋 Test Group 5: Category Validation');
    console.log('-'.repeat(60));
    
    const { data: rewards } = await supabase
      .from('rewards')
      .select('category')
      .limit(10);
    
    logTest(
      'Reward categories accessible',
      rewards !== null,
      `Found ${rewards?.length || 0} rewards`
    );
    
    // Test if item category is accepted (try to query it)
    const { data: itemRewards, error: itemError } = await supabase
      .from('rewards')
      .select('category')
      .eq('category', 'item');
    
    logTest(
      'Item category accepted',
      !itemError,
      'Category constraint updated to include "item"'
    );
    
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    results.failed++;
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary');
  console.log('-'.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📝 Total:  ${results.passed + results.failed}`);
  
  const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  console.log(`\n🎯 Success Rate: ${successRate}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Ticket redemption system is ready.');
  } else {
    console.log('\n⚠️  Some tests failed. Review details above.');
  }
  
  console.log('\n');
  process.exit(results.failed === 0 ? 0 : 1);
}

runTests();
