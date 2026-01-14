import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { CompleteTaskSchema, formatZodError } from '@/lib/validation/task';

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
    const validationResult = CompleteTaskSchema.safeParse(body);

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

    const { taskId, childId, instanceId, evidence } = validationResult.data;

    // Get the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get child's family_id
    const { data: child } = await supabase
      .from('children')
      .select('family_id')
      .eq('id', childId)
      .single();

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // v2: Validate timer completion
    if (task.approval_type === 'timer') {
      if (!evidence?.timerCompleted) {
        return NextResponse.json(
          { error: 'Timer must be completed for timer-based tasks' },
          { status: 400 }
        );
      }
    }

    // v2: Validate checklist completion
    if (task.approval_type === 'checklist') {
      if (!evidence?.checklistState || evidence.checklistState.some((item) => !item)) {
        return NextResponse.json(
          { error: 'All checklist items must be completed' },
          { status: 400 }
        );
      }
    }

    // Handle auto-assigned tasks (require instance)
    if (task.auto_assign) {
      if (!instanceId) {
        return NextResponse.json(
          { error: 'Instance ID required for auto-assigned tasks' },
          { status: 400 }
        );
      }

      // Validate instance exists and is pending
      const { data: instance, error: instanceError } = await supabase
        .from('task_instances')
        .select('*')
        .eq('id', instanceId)
        .eq('task_id', taskId)
        .eq('child_id', childId)
        .eq('status', 'pending')
        .single();

      if (instanceError || !instance) {
        return NextResponse.json(
          { error: 'Invalid or already completed task instance' },
          { status: 400 }
        );
      }
    } else {
      // Manual tasks: check if already completed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: existingCompletion } = await supabase
        .from('task_completions')
        .select('*')
        .eq('task_id', taskId)
        .eq('child_id', childId)
        .gte('requested_at', today.toISOString())
        .in('status', ['pending', 'approved', 'auto_approved'])
        .single();

      if (existingCompletion) {
        return NextResponse.json(
          { error: 'Task already submitted today' },
          { status: 400 }
        );
      }
    }

    // v2: Determine status based on approval_type
    let initialStatus = 'pending';
    let pointsAwarded = null;
    let approvedAt = null;
    let completedAt = null;
    let autoApproveAt = null;

    // Auto-approve for: auto, timer (completed), checklist (all checked)
    if (
      task.approval_type === 'auto' ||
      task.approval_type === 'timer' ||
      task.approval_type === 'checklist'
    ) {
      initialStatus = 'auto_approved';
      pointsAwarded = task.points;
      approvedAt = new Date().toISOString();
      completedAt = new Date().toISOString();
      autoApproveAt = null;
    } else {
      // Parent approval needed - set 24h auto-approve
      initialStatus = 'pending';
      const autoApprove = new Date();
      autoApprove.setHours(autoApprove.getHours() + 24);
      autoApproveAt = autoApprove.toISOString();
    }

    // Create task completion with v2 fields
    const { data: completion, error: completionError } = await supabase
      .from('task_completions')
      .insert({
        task_id: taskId,
        child_id: childId,
        family_id: child.family_id,
        status: initialStatus,

        // v2: Timer/checklist evidence
        timer_completed: evidence?.timerCompleted || false,
        checklist_state: evidence?.checklistState || null,

        // Timestamps
        requested_at: new Date().toISOString(),
        auto_approve_at: autoApproveAt,
        approved_at: approvedAt,
        completed_at: completedAt,

        // Points
        points_awarded: pointsAwarded,

        // Optional proof
        proof_image_url: evidence?.photos?.[0] || null,
        note: evidence?.note || null,
      })
      .select()
      .single();

    if (completionError) {
      console.error('Error creating completion:', completionError);
      return NextResponse.json(
        { error: 'Failed to create completion', details: completionError.message },
        { status: 500 }
      );
    }

    // If auto-approved, add points immediately
    if (initialStatus === 'auto_approved') {
      const { error: pointsError } = await supabase.rpc('add_points', {
        p_child_id: childId,
        p_amount: task.points,
        p_type: 'task_completion',
        p_reference_type: 'task_completion',
        p_reference_id: completion.id,
        p_description: `${task.name} completed`,
      });

      if (pointsError) {
        console.error('Error adding points:', pointsError);
        // Don't fail the request - completion is already created
      }
    }

    // Update instance status if this is an auto-assigned task
    if (task.auto_assign && instanceId) {
      // v2: Auto-approved tasks (auto/timer/checklist) mark instance as 'completed'
      const newInstanceStatus = initialStatus === 'auto_approved' ? 'completed' : 'submitted';

      const { error: instanceUpdateError } = await supabase
        .from('task_instances')
        .update({
          status: newInstanceStatus,
          completion_id: completion.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', instanceId);

      if (instanceUpdateError) {
        console.error('Error updating instance:', instanceUpdateError);
        // Don't fail the request - completion is already created
      }
    }

    // v2: If task is "one_time" and status is approved/pending, deactivate it
    if (task.frequency === 'one_time') {
      // Perform the update
      const { error: deactivateError } = await supabase
        .from('tasks')
        .update({ is_active: false })
        .eq('id', taskId);

      if (deactivateError) {
        console.error('Failed to deactivate one-time task:', deactivateError);
      }
    }

    return NextResponse.json({
      success: true,
      completion,
      autoApproved: initialStatus === 'auto_approved',
      instanceUpdated: task.auto_assign && !!instanceId,
    });
  } catch (error) {
    console.error('Error in task completion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
