import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get family
  const { data: family } = await supabase
    .from('families')
    .select('id, name, settings')
    .eq('join_code', 'TNPGV8')
    .single();

  if (!family) {
    console.error('Family not found');
    return;
  }

  console.log('Current settings:', family.settings);

  // Disable PIN requirement
  const newSettings = { ...family.settings as object, requireChildPin: false };
  const { error: updateError } = await supabase
    .from('families')
    .update({ settings: newSettings })
    .eq('id', family.id);

  if (updateError) {
    console.error('Failed to update settings:', updateError.message);
    return;
  }

  console.log('\n✅ PIN requirement DISABLED');
  console.log('New settings:', newSettings);

  // Get children
  const { data: children } = await supabase
    .from('children')
    .select('id, name')
    .eq('family_id', family.id)
    .limit(1);

  if (children && children.length > 0) {
    const child = children[0];
    console.log(`\n📋 Test child login for: ${child.name}`);

    // Test the child login API without PIN
    const baseUrl = 'http://localhost:3001';

    // Step 1: Validate code
    console.log('\n1. Validating family code...');
    const validateRes = await fetch(`${baseUrl}/api/family/validate-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'TNPGV8' }),
    });
    console.log('   Status:', validateRes.status, validateRes.ok ? '✅' : '❌');

    // Step 2: Get children (check requireChildPin)
    console.log('\n2. Getting children list...');
    const childrenRes = await fetch(`${baseUrl}/api/children/by-family-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ familyCode: 'TNPGV8' }),
    });
    const childrenData = await childrenRes.json();
    console.log('   Status:', childrenRes.status, childrenRes.ok ? '✅' : '❌');
    console.log('   requireChildPin:', childrenData.requireChildPin);

    // Step 3: Login without PIN
    console.log('\n3. Logging in WITHOUT PIN...');
    const loginRes = await fetch(`${baseUrl}/api/auth/child-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId: child.id, pinCode: '' }),
    });
    const loginData = await loginRes.json();
    console.log('   Status:', loginRes.status, loginRes.ok ? '✅' : '❌');
    console.log('   Response:', loginData);
  }

  // Re-enable PIN for security
  console.log('\n\n🔒 Re-enabling PIN requirement...');
  const reEnableSettings = { ...family.settings as object, requireChildPin: true };
  await supabase
    .from('families')
    .update({ settings: reEnableSettings })
    .eq('id', family.id);
  console.log('✅ PIN requirement restored');
}

main().catch(console.error);
