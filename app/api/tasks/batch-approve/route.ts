import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { BatchApproveSchema, formatZodError } from '@/lib/validation/task';

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
    const validCompletionIds = completions.map((c) => c.id);

    // Approve each completion individually and add points
    let approvedCount = 0;
    let pointsAddedCount = 0;

    for (const completion of completions) {
      const task = (completion.tasks as unknown) as { points: number; name: string } | null;
      const taskPoints = task?.points;
      if (!taskPoints) {
        console.warn(`No points found for task ${completion.task_id}`);
        continue;
      }

      // Approve the completion
      const { error: updateError } = await supabase
        .from('task_completions')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: now,
          completed_at: now,
          points_awarded: taskPoints,
          updated_at: now,
        })
        .eq('id', completion.id);

      if (updateError) {
        console.error('Error approving completion:', updateError);
        // Continue with other completions
        continue;
      }

      approvedCount++;

      // Add points
      const { error: pointsError } = await supabase.rpc('add_points', {
        p_child_id: completion.child_id,
        p_amount: taskPoints,
        p_type: 'task_completion',
        p_reference_type: 'task_completion',
        p_reference_id: completion.id,
        p_description: `${task?.name || 'Task'} completed`,
      });

      if (pointsError) {
        console.error('Error adding points:', pointsError);
        // Don't fail the entire batch - continue with other completions
      } else {
        pointsAddedCount++;
      }
    }

    if (approvedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to approve any completions' },
        { status: 500 }
      );
    }

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
  } catch (error) {
    console.error('Error in batch approve:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
