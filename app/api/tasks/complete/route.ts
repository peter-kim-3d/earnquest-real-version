import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CompleteTaskSchema, formatZodError } from '@/lib/validation/task';

// Create admin client for child session (bypasses RLS)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check for parent auth OR child session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If no parent auth, check for child session cookie
    let isChildSession = false;
    let childSessionData: { childId: string; familyId: string } | null = null;

    if (!user) {
      const cookieStore = await cookies();
      const childSessionCookie = cookieStore.get('child_session');

      if (childSessionCookie) {
        try {
          childSessionData = JSON.parse(childSessionCookie.value);
          if (childSessionData?.childId && childSessionData?.familyId) {
            isChildSession = true;
          }
        } catch {
          // Invalid cookie
        }
      }

      if (!isChildSession) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Use admin client for child session (bypasses RLS)
    const dbClient = isChildSession ? (getAdminClient() || supabase) : supabase;

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

    // If child session, verify childId matches session
    if (isChildSession && childSessionData && childId !== childSessionData.childId) {
      return NextResponse.json(
        { error: 'Unauthorized: childId mismatch' },
        { status: 403 }
      );
    }

    // Get the task
    const { data: task, error: taskError } = await dbClient
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get child's family_id
    const { data: child } = await dbClient
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

    // Handle auto-assigned tasks with instance (if instanceId provided)
    if (task.auto_assign && instanceId) {
      // Validate instance exists and is pending
      const { data: instance, error: instanceError } = await dbClient
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
    }

    // For all tasks: check for existing completions today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for fix_requested completion first (re-submission case)
    // Use maybeSingle() to avoid errors when no rows found
    const { data: fixRequestedCompletion, error: fixCheckError } = await dbClient
      .from('task_completions')
      .select('*')
      .eq('task_id', taskId)
      .eq('child_id', childId)
      .gte('requested_at', today.toISOString())
      .eq('status', 'fix_requested')
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fixCheckError) {
      console.error('Error checking fix_requested:', fixCheckError);
    }

    // If there's a fix_requested completion, update it instead of creating new
    if (fixRequestedCompletion) {
      // Determine new status based on approval_type
      let newStatus = 'pending';
      let pointsAwarded = null;
      let approvedAt = null;
      let completedAt = null;

      if (
        task.approval_type === 'auto' ||
        task.approval_type === 'timer' ||
        task.approval_type === 'checklist'
      ) {
        newStatus = 'auto_approved';
        pointsAwarded = task.points;
        approvedAt = new Date().toISOString();
        completedAt = new Date().toISOString();
      }

      // Update the existing completion
      const { data: updatedCompletion, error: updateError } = await dbClient
        .from('task_completions')
        .update({
          status: newStatus,
          timer_completed: evidence?.timerCompleted || false,
          checklist_state: evidence?.checklistState || null,
          fix_request: null, // Clear the fix request
          fix_request_count: (fixRequestedCompletion.fix_request_count || 0) + 1,
          requested_at: new Date().toISOString(),
          approved_at: approvedAt,
          completed_at: completedAt,
          points_awarded: pointsAwarded,
          proof_image_url: evidence?.photos?.[0] || null,
          note: evidence?.note || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', fixRequestedCompletion.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating fix_requested completion:', updateError);
        return NextResponse.json(
          { error: 'Failed to resubmit task', details: updateError.message },
          { status: 500 }
        );
      }

      // If auto-approved, add points
      if (newStatus === 'auto_approved') {
        const { error: pointsError } = await dbClient.rpc('add_points', {
          p_child_id: childId,
          p_amount: task.points,
          p_type: 'task_completion',
          p_reference_type: 'task_completion',
          p_reference_id: updatedCompletion.id,
          p_description: `${task.name} completed (resubmit)`,
        });

        if (pointsError) {
          console.error('Error adding points:', pointsError);
        }
      }

      return NextResponse.json({
        success: true,
        completion: updatedCompletion,
        autoApproved: newStatus === 'auto_approved',
        resubmitted: true,
      });
    }

    // Check for already completed/pending today (including fix_requested to prevent duplicates)
    if (!task.auto_assign || !instanceId) {
      const { data: existingCompletion } = await dbClient
        .from('task_completions')
        .select('*')
        .eq('task_id', taskId)
        .eq('child_id', childId)
        .gte('requested_at', today.toISOString())
        .in('status', ['pending', 'approved', 'auto_approved', 'fix_requested'])
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingCompletion) {
        // If it's fix_requested, this shouldn't happen (caught above), but handle gracefully
        if (existingCompletion.status === 'fix_requested') {
          return NextResponse.json(
            { error: 'Task needs to be resubmitted via fix request flow' },
            { status: 400 }
          );
        }
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
    const { data: completion, error: completionError } = await dbClient
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
      const { error: pointsError } = await dbClient.rpc('add_points', {
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

      const { error: instanceUpdateError } = await dbClient
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
      const { error: deactivateError } = await dbClient
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
