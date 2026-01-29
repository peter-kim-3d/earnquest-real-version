/**
 * Script to apply the fix for missing children columns
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

async function applyFix() {
    console.log('🚀 Applying missing columns fix migration...\n');

    try {
        const migrationPath = path.join(__dirname, '../supabase/migrations/023_fix_missing_children_columns.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        console.log('📄 SQL being applied:');
        console.log(migrationSQL);

        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseServiceKey!,
                'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ query: migrationSQL }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', errorText);
            console.log('\n📝 Please apply manually via Supabase SQL Editor if API call failed.');
            process.exit(1);
        }

        console.log('\n✅ Migration applied successfully!');
    } catch (err: unknown) {
        console.error('❌ Error:', err instanceof Error ? err.message : String(err));
        process.exit(1);
    }
}

applyFix();
