import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getErrorMessage } from '@/lib/api/error-handler';

const INSIGHTS_LOOKBACK_DAYS = 30;

interface TaskBreakdown {
  taskId: string;
  taskName: string;
  frequency: string;
  completionRate: number;
  completions: number;
  expected: number;
}

interface InsightsResponse {
  summary: {
    totalTasks: number;
    completionRate: number;
    totalCompletions: number;
    expectedCompletions: number;
  };
  bestTask: {
    id: string;
    name: string;
    completionRate: number;
    completions: number;
  } | null;
  needsAttentionTask: {
    id: string;
    name: string;
    completionRate: number;
    completions: number;
    expected: number;
  } | null;
  taskBreakdown: TaskBreakdown[];
}

/**
 * Calculate expected completions based on task frequency
 */
function calculateExpectedCompletions(frequency: string): number {
  switch (frequency) {
    case 'daily':
      return INSIGHTS_LOOKBACK_DAYS; // 30 times
    case 'weekly':
      return Math.floor(INSIGHTS_LOOKBACK_DAYS / 7); // ~4 times
    case 'monthly':
      return 1;
    case 'one_time':
      return 1;
    default:
      return 1;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: childId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this family
    const { data: userProfile } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Verify child belongs to user's family
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, family_id')
      .eq('id', childId)
      .eq('family_id', userProfile.family_id)
      .single();

    if (childError || !child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Get the date 30 days ago
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - INSIGHTS_LOOKBACK_DAYS);

    // Fetch tasks assigned to this child (active only)
    // Tasks can be assigned via child_id = childId or child_id IS NULL (global tasks)
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, name, frequency')
      .eq('family_id', userProfile.family_id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .or(`child_id.eq.${childId},child_id.is.null`);

    if (tasksError) {
      console.error('Fetch tasks error:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    // Get task overrides to exclude disabled tasks
    const { data: overrides } = await supabase
      .from('child_task_overrides')
      .select('task_id, is_enabled')
      .eq('child_id', childId);

    const disabledTaskIds = new Set(
      (overrides || [])
        .filter(o => !o.is_enabled)
        .map(o => o.task_id)
    );

    // Filter out disabled tasks
    const activeTasks = (tasks || []).filter(t => !disabledTaskIds.has(t.id));

    if (activeTasks.length === 0) {
      const emptyResponse: InsightsResponse = {
        summary: {
          totalTasks: 0,
          completionRate: 0,
          totalCompletions: 0,
          expectedCompletions: 0,
        },
        bestTask: null,
        needsAttentionTask: null,
        taskBreakdown: [],
      };
      return NextResponse.json(emptyResponse);
    }

    // Get completions for this child in the past 30 days
    const { data: completions, error: completionsError } = await supabase
      .from('task_completions')
      .select('task_id')
      .eq('child_id', childId)
      .in('status', ['approved', 'auto_approved'])
      .gte('completed_at', lookbackDate.toISOString());

    if (completionsError) {
      console.error('Fetch completions error:', completionsError);
      return NextResponse.json({ error: 'Failed to fetch completions' }, { status: 500 });
    }

    // Count completions per task
    const completionCounts = new Map<string, number>();
    (completions || []).forEach(c => {
      const count = completionCounts.get(c.task_id) || 0;
      completionCounts.set(c.task_id, count + 1);
    });

    // Calculate task breakdown
    const taskBreakdown: TaskBreakdown[] = activeTasks.map(task => {
      const expected = calculateExpectedCompletions(task.frequency);
      const actual = completionCounts.get(task.id) || 0;
      // Cap completion rate at 100%
      const completionRate = Math.min(100, Math.round((actual / expected) * 100));

      return {
        taskId: task.id,
        taskName: task.name,
        frequency: task.frequency,
        completionRate,
        completions: actual,
        expected,
      };
    });

    // Sort by completion rate for finding best/worst
    const sortedByRate = [...taskBreakdown].sort((a, b) => b.completionRate - a.completionRate);

    // Find best task (highest completion rate, at least 1 completion)
    const bestTask = sortedByRate.find(t => t.completions > 0);

    // Find needs attention task (lowest completion rate, below 50%)
    const needsAttentionTask = sortedByRate
      .filter(t => t.completionRate < 50)
      .pop(); // Get lowest

    // Calculate summary
    const totalExpected = taskBreakdown.reduce((sum, t) => sum + t.expected, 0);
    const totalActual = taskBreakdown.reduce((sum, t) => sum + t.completions, 0);
    const overallRate = totalExpected > 0 ? Math.min(100, Math.round((totalActual / totalExpected) * 100)) : 0;

    const response: InsightsResponse = {
      summary: {
        totalTasks: activeTasks.length,
        completionRate: overallRate,
        totalCompletions: totalActual,
        expectedCompletions: totalExpected,
      },
      bestTask: bestTask
        ? {
            id: bestTask.taskId,
            name: bestTask.taskName,
            completionRate: bestTask.completionRate,
            completions: bestTask.completions,
          }
        : null,
      needsAttentionTask: needsAttentionTask
        ? {
            id: needsAttentionTask.taskId,
            name: needsAttentionTask.taskName,
            completionRate: needsAttentionTask.completionRate,
            completions: needsAttentionTask.completions,
            expected: needsAttentionTask.expected,
          }
        : null,
      taskBreakdown: taskBreakdown.sort((a, b) => a.taskName.localeCompare(b.taskName)),
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Get insights error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
