import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { BatchApproveSchema, formatZodError } from '@/lib/validation/task';
import { getErrorMessage } from '@/lib/api/error-handler';

/** Type for task completion with joined task data from Supabase */
interface CompletionWithTask {
  id: string;
  task_id: string;
  child_id: string;
  family_id: string;
  tasks: { points: number; name: string } | { points: number; name: string }[] | null;
}

/** Normalized completion with single task object */
interface NormalizedCompletion {
  id: string;
  task_id: string;
  child_id: string;
  family_id: string;
  task: { points: number; name: string };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // v2: Validate with Zod schema
    const validationResult = BatchApproveSchema.safeParse(body);

    if (!validationResult.success) {
      const formattedError = formatZodError(validationResult.error);
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: formattedError.message,
          fields: formattedError.fields,
        },
        { status: 400 }
      );
    }

    const { completionIds } = validationResult.data;

    // Get user's family
    const { data: userProfile } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get all pending completions that belong to user's family
    const { data: completions, error: fetchError } = await supabase
      .from('task_completions')
      .select('id, task_id, child_id, family_id, tasks(points, name)')
      .in('id', completionIds)
      .eq('family_id', userProfile.family_id)
      .eq('status', 'pending');

    if (fetchError) {
      console.error('Error fetching completions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch completions', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!completions || completions.length === 0) {
      return NextResponse.json(
        { error: 'No pending completions found to approve' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    // Helper to extract task from completion (handles both single object and array from Supabase)
    function getTaskFromCompletion(
      completion: CompletionWithTask
    ): { points: number; name: string } | null {
      if (!completion.tasks) return null;
      // Supabase returns array for foreign table joins
      if (Array.isArray(completion.tasks)) {
        return completion.tasks[0] || null;
      }
      return completion.tasks;
    }

    // Type cast and normalize completions
    const typedCompletions = completions as CompletionWithTask[];

    // Filter and normalize completions
    const normalizedCompletions: NormalizedCompletion[] = [];
    for (const completion of typedCompletions) {
      const task = getTaskFromCompletion(completion);
      if (!task?.points) {
        console.warn(`No points found for task ${completion.task_id}`);
        continue;
      }
      normalizedCompletions.push({
        id: completion.id,
        task_id: completion.task_id,
        child_id: completion.child_id,
        family_id: completion.family_id,
        task,
      });
    }

    if (normalizedCompletions.length === 0) {
      return NextResponse.json(
        { error: 'No completions with valid points found' },
        { status: 400 }
      );
    }

    const validCompletionIds = normalizedCompletions.map((c) => c.id);

    // Batch update all completions at once
    const { error: updateError } = await supabase
      .from('task_completions')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: now,
        completed_at: now,
        updated_at: now,
      })
      .in('id', validCompletionIds);

    if (updateError) {
      console.error('Error batch approving completions:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve completions', details: updateError.message },
        { status: 500 }
      );
    }

    // Update points_awarded for each completion (requires individual updates due to different values)
    // Use Promise.all for parallel execution
    const pointsUpdatePromises = normalizedCompletions.map((completion) =>
      supabase
        .from('task_completions')
        .update({ points_awarded: completion.task.points })
        .eq('id', completion.id)
    );
    await Promise.all(pointsUpdatePromises);

    // Add points for each child - using Promise.all for parallel RPC calls
    const pointsResults = await Promise.all(
      normalizedCompletions.map((completion) =>
        supabase.rpc('add_points', {
          p_child_id: completion.child_id,
          p_amount: completion.task.points,
          p_type: 'task_completion',
          p_reference_type: 'task_completion',
          p_reference_id: completion.id,
          p_description: `${completion.task.name || 'Task'} completed`,
        })
      )
    );

    // Count successful points additions
    const pointsAddedCount = pointsResults.filter((result) => !result.error).length;
    const pointsErrors = pointsResults.filter((result) => result.error);

    if (pointsErrors.length > 0) {
      console.error(
        'Some points additions failed:',
        pointsErrors.map((r) => r.error)
      );
    }

    const approvedCount = normalizedCompletions.length;

    // Update task instances if any of these were auto-assigned tasks
    const { error: instanceError } = await supabase
      .from('task_instances')
      .update({
        status: 'completed',
        updated_at: now,
      })
      .in('completion_id', validCompletionIds)
      .eq('status', 'submitted');

    if (instanceError) {
      console.warn('Error updating task instances:', instanceError);
      // Don't fail the request - instances are secondary
    }

    return NextResponse.json({
      success: true,
      approvedCount: approvedCount,
      pointsAwarded: pointsAddedCount,
      message: `Successfully approved ${approvedCount} task${approvedCount === 1 ? '' : 's'}!`,
    });
  } catch (error: unknown) {
    console.error('Error in batch approve:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
