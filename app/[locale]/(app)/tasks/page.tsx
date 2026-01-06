import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TaskList } from '@/components/tasks/TaskList';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function TasksPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/en-US/login');
  }

  // Get user's family info
  const { data: userData } = await supabase
    .from('users')
    .select('family_id, name')
    .eq('id', user.id)
    .single();

  if (!userData?.family_id) {
    redirect('/en-US/onboarding');
  }

  // Get all tasks for the family
  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      *,
      template:task_templates(name_default, icon)
    `)
    .eq('family_id', userData.family_id)
    .is('deleted_at', null)
    .order('category')
    .order('name');

  // Get children for task assignment
  const { data: familyChildren } = await supabase
    .from('children')
    .select('id, name, avatar_url')
    .eq('family_id', userData.family_id)
    .is('deleted_at', null)
    .order('name');

  // Get task templates for quick creation
  const { data: templates } = await supabase
    .from('task_templates')
    .select('*')
    .eq('age_group', '8-11')
    .eq('is_active', true)
    .order('category')
    .order('sort_order');

  const activeCount = tasks?.filter((t) => t.is_active).length || 0;
  const inactiveCount = tasks?.filter((t) => !t.is_active).length || 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tasks</h1>
          <p className="text-gray-600">Manage tasks for your family</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-growth-green/10 text-growth-green">
            {activeCount} active
          </Badge>
          {inactiveCount > 0 && (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
              {inactiveCount} inactive
            </Badge>
          )}
        </div>
      </div>

      {/* Task List Component */}
      <TaskList tasks={tasks || []} familyChildren={familyChildren || []} templates={templates || []} />
    </div>
  );
}
