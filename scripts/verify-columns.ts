
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyColumns() {
  console.log('🔍 Checking columns of table "children"...\n');

  try {
    // We can't directly list columns with Supabase JS client easily without SQL,
    // but we can try to select them and see if they fail.
    
    const columnsToTest = ['id', 'name', 'pin_code', 'birthdate', 'age_group'];
    
    for (const column of columnsToTest) {
      const { error } = await supabase
        .from('children')
        .select(column)
        .limit(1);
        
      if (error) {
        console.log(`❌ Column "${column}": MISSING or error (${error.message})`);
      } else {
        console.log(`✅ Column "${column}": EXISTS`);
      }
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  }
}

verifyColumns();
