import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { CompleteTaskSchema, formatZodError } from '@/lib/validation/task';
import { checkParentOrChildAuth, verifyChildIdMatch } from '@/lib/api/child-auth';
import { getErrorMessage } from '@/lib/api/error-handler';
import { POINTS_PER_MINUTE } from '@/lib/constants';

/**
 * Calculate the start of "today" in the given timezone, returned as UTC ISO string.
 * This ensures date comparisons work correctly across timezones.
 */
function getTodayStartInTimezone(timezone: string): string {
  const now = new Date();
  // Format current time in the target timezone to get local date components
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const localDateStr = formatter.format(now); // "YYYY-MM-DD"
  // Create a date object for midnight in that timezone
  // Parse as ISO and adjust for timezone offset
  const midnightLocal = new Date(`${localDateStr}T00:00:00`);
  // Get the offset for this timezone at this date
  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  });
  const parts = tzFormatter.formatToParts(midnightLocal);
  const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value || '+00:00';
  // Parse offset (e.g., "GMT-5" or "UTC+9")
  const offsetMatch = offsetPart.match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
  let offsetMinutes = 0;
  if (offsetMatch) {
    const sign = offsetMatch[1] === '-' ? -1 : 1;
    const hours = parseInt(offsetMatch[2], 10);
    const mins = parseInt(offsetMatch[3] || '0', 10);
    offsetMinutes = sign * (hours * 60 + mins);
  }
  // Midnight in target timezone converted to UTC
  const utcMidnight = new Date(midnightLocal.getTime() - offsetMinutes * 60 * 1000);
  return utcMidnight.toISOString();
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check for parent auth OR child session
    const authResult = await checkParentOrChildAuth(supabase);
    if (!authResult.success) {
      return authResult.error;
    }

    const { isChildSession, childSessionData, dbClient } = authResult.result;

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
    const mismatchError = verifyChildIdMatch(childId, childSessionData, isChildSession);
    if (mismatchError) return mismatchError;

    // Get the task
    const { data: task, error: taskError } = await dbClient
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get child's family_id and family timezone
    const { data: child } = await dbClient
      .from('children')
      .select('family_id')
      .eq('id', childId)
      .single();

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Get family timezone setting for "today" calculation
    const { data: family } = await dbClient
      .from('families')
      .select('settings')
      .eq('id', child.family_id)
      .single();

    const familyTimezone = family?.settings?.timezone || 'UTC';

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
    // Use family timezone to determine "today" boundaries
    const todayStart = getTodayStartInTimezone(familyTimezone);

    // Check for fix_requested completion first (re-submission case)
    // Use maybeSingle() to avoid errors when no rows found
    const { data: fixRequestedCompletion, error: fixCheckError } = await dbClient
      .from('task_completions')
      .select('*')
      .eq('task_id', taskId)
      .eq('child_id', childId)
      .gte('requested_at', todayStart)
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
        .gte('requested_at', todayStart)
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

    // Calculate bonus points for timer tasks with "Do More" feature
    let bonusPoints = 0;
    if (task.approval_type === 'timer' && evidence?.bonusMinutes && evidence.bonusMinutes > 0) {
      bonusPoints = Math.round(evidence.bonusMinutes * POINTS_PER_MINUTE);
    }

    // Auto-approve for: auto, timer (completed), checklist (all checked)
    if (
      task.approval_type === 'auto' ||
      task.approval_type === 'timer' ||
      task.approval_type === 'checklist'
    ) {
      initialStatus = 'auto_approved';
      pointsAwarded = task.points + bonusPoints;
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
      const totalPoints = task.points + bonusPoints;
      const description = bonusPoints > 0
        ? `${task.name} completed (+${bonusPoints} bonus for extra time)`
        : `${task.name} completed`;

      const { error: pointsError } = await dbClient.rpc('add_points', {
        p_child_id: childId,
        p_amount: totalPoints,
        p_type: 'task_completion',
        p_reference_type: 'task_completion',
        p_reference_id: completion.id,
        p_description: description,
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
  } catch (error: unknown) {
    console.error('Error in task completion:', error);
    const errorMessage = getErrorMessage(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
