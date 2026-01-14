import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

console.log('--- Environment Check ---');
console.log(`URL Present: ${!!url}`);
console.log(`Service Key Present: ${!!key}`);
if (key) {
    console.log(`Service Key Length: ${key.length}`);
    console.log(`Service Key Start: ${key.substring(0, 5)}...`);
} else {
    console.error('CRITICAL: Service Key is MISSING!');
}
console.log('-------------------------');
