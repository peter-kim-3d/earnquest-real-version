// Test direct API access to Supabase
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing direct Supabase REST API access...\n');
console.log('URL:', url);
console.log('Service key (first 20 chars):', serviceKey?.substring(0, 20) + '...\n');

async function testAPI() {
  try {
    // Test families table
    console.log('Testing families table...');
    const response = await fetch(`${url}/rest/v1/families?select=*&limit=1`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text);
    console.log('');

    // Test task_templates
    console.log('Testing task_templates table...');
    const response2 = await fetch(`${url}/rest/v1/task_templates?select=name&limit=3`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
