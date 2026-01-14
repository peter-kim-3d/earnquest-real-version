import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Get user's family
  const { data: userRecord } = await supabase
    .from('users')
    .select('family_id')
    .eq('auth_id', user.id)
    .single();

  if (!userRecord?.family_id) {
    return NextResponse.json({ error: 'No family found' }, { status: 404 });
  }

  // Get all tasks with important fields
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, name, child_id, auto_assign, approval_type, frequency')
    .eq('family_id', userRecord.family_id)
    .is('deleted_at', null);

  // Get task instances
  const { data: instances } = await supabase
    .from('task_instances')
    .select('*')
    .limit(10);

  return NextResponse.json({
    tasks,
    instances,
    hasInstancesTable: instances !== null,
  });
}
