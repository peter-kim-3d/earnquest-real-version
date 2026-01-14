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

  // Get all children
  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', userRecord.family_id)
    .is('deleted_at', null);

  // Get all tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('family_id', userRecord.family_id)
    .is('deleted_at', null);

  // Get all overrides
  const { data: overrides } = await supabase
    .from('child_task_overrides')
    .select('*');

  // Get v_child_today_tasks for each child
  const viewResults: any = {};
  if (children) {
    for (const child of children) {
      const { data: viewTasks } = await supabase
        .from('v_child_today_tasks')
        .select('*')
        .eq('child_id', child.id);
      viewResults[child.name] = viewTasks;
    }
  }

  return NextResponse.json({
    children,
    tasks,
    overrides,
    viewResults,
  });
}
