import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    console.log('--- Database Check ---');
    console.log('Checking child_task_overrides...');
    const { data, error } = await supabase
        .from('child_task_overrides')
        .select('count')
        .limit(1);

    if (error) {
        console.error('❌ Error accessing table:', error.message);
        if (error.code === '42P01') {
            console.error('👉 Table "child_task_overrides" does not exist. Migration 023 failed?');
        }
    } else {
        console.log('✅ Table access successful.');
    }
    console.log('----------------------');
}

check();
