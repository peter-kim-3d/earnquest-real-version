import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: families, error } = await supabase
    .from('families')
    .select('id, name, join_code, settings')
    .not('join_code', 'is', null)
    .limit(5);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('Families with join codes:');
  if (families) {
    for (const f of families) {
      const settings = f.settings as Record<string, unknown> | null;
      const requirePin = settings?.requireChildPin ?? true;
      console.log(`- ${f.name}: ${f.join_code} (requireChildPin: ${requirePin})`);
    }

    // Also get children for first family
    if (families.length > 0) {
      const { data: children } = await supabase
        .from('children')
        .select('id, name, pin_code')
        .eq('family_id', families[0].id);

      console.log(`\nChildren in "${families[0].name}" family:`);
      if (children) {
        for (const c of children) {
          console.log(`- ${c.name} (PIN: ${c.pin_code || '0000'})`);
        }
      }
    }
  }
}

main();
