
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyTaskTemplatesColumns() {
    console.log('🔍 Checking columns of table "task_templates"...\n');

    try {
        const columnsToTest = ['id', 'name', 'template_key', 'metadata', 'timer_minutes', 'checklist', 'approval_type'];

        for (const column of columnsToTest) {
            const { error } = await supabase
                .from('task_templates')
                .select(column)
                .limit(1);

            if (error) {
                console.log(`❌ Column "${column}": MISSING or error (${error.message})`);
            } else {
                console.log(`✅ Column "${column}": EXISTS`);
            }
        }

    } catch (error: unknown) {
        console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    }
}

verifyTaskTemplatesColumns();
