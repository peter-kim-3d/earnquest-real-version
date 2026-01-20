import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { UpdateTaskSchema, formatZodError } from '@/lib/validation/task';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const body = await request.json();

    // v2: Validate with Zod schema
    const validationResult = UpdateTaskSchema.safeParse(body);

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

    const { taskId, ...taskData } = validationResult.data;

    // Verify task belongs to user's family
    const { data: existingTask } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .eq('family_id', userProfile.family_id)
      .single();

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updates: any = {};

    if (taskData.name !== undefined) updates.name = taskData.name;
    if (taskData.description !== undefined) updates.description = taskData.description;
    if (taskData.category !== undefined) updates.category = taskData.category;
    if (taskData.time_context !== undefined) updates.time_context = taskData.time_context;
    if (taskData.points !== undefined) updates.points = taskData.points;
    if (taskData.frequency !== undefined) updates.frequency = taskData.frequency;
    if (taskData.approval_type !== undefined) updates.approval_type = taskData.approval_type;

    // v2: Timer/checklist fields
    if (taskData.timer_minutes !== undefined) updates.timer_minutes = taskData.timer_minutes;
    if (taskData.checklist !== undefined) updates.checklist = taskData.checklist;
    if (taskData.photo_required !== undefined) updates.photo_required = taskData.photo_required;

    // v2: Metadata
    if (taskData.metadata !== undefined) updates.metadata = taskData.metadata;

    // Scheduling
    if (taskData.auto_assign !== undefined) updates.auto_assign = taskData.auto_assign;
    if (taskData.days_of_week !== undefined) updates.days_of_week = taskData.days_of_week;
    if (taskData.monthly_mode !== undefined) updates.monthly_mode = taskData.monthly_mode;
    if (taskData.monthly_day !== undefined) updates.monthly_day = taskData.monthly_day;

    // Other fields
    if (taskData.child_id !== undefined) updates.child_id = taskData.child_id;
    if (taskData.icon !== undefined) updates.icon = taskData.icon;
    if (taskData.image_url !== undefined) updates.image_url = taskData.image_url;
    if (taskData.is_active !== undefined) updates.is_active = taskData.is_active;

    // Always update updated_at
    updates.updated_at = new Date().toISOString();

    // Update task
    const { data: task, error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json(
        { error: 'Failed to update task', details: updateError.message },
        { status: 500 }
      );
    }

    // Handle child exclusions (if provided)
    if (taskData.excluded_child_ids !== undefined) {
      console.log('Update Task: Handling child exclusions', {
        excludedCount: taskData.excluded_child_ids.length,
        excludedIds: taskData.excluded_child_ids,
      });

      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (url && key) {
          const supabaseAdmin = createAdminClient(url, key, {
            auth: { autoRefreshToken: false, persistSession: false },
          });

          // Delete existing overrides for this task
          console.log('Update Task: Deleting existing overrides');
          const { error: deleteError } = await supabaseAdmin
            .from('child_task_overrides')
            .delete()
            .eq('task_id', taskId);

          if (deleteError) {
            console.error('Update Task: Error deleting overrides', deleteError);
          }

          // Insert new overrides (if any)
          if (taskData.excluded_child_ids.length > 0) {
            console.log('Update Task: Inserting new overrides');
            const overrides = taskData.excluded_child_ids.map((childId: string) => ({
              task_id: taskId,
              child_id: childId,
              is_enabled: false,
            }));

            const { error: insertError } = await supabaseAdmin
              .from('child_task_overrides')
              .insert(overrides);

            if (insertError) {
              console.error('Update Task: Error inserting overrides', insertError);
            } else {
              console.log('Update Task: Overrides inserted successfully');
            }
          } else {
            console.log('Update Task: No overrides to insert (all children selected)');
          }
        }
      } catch (overrideError) {
        console.error('Error updating overrides (non-fatal):', overrideError);
        // Don't fail the request if override update fails
      }
    }

    return NextResponse.json({
      success: true,
      task,
      message: 'Task updated successfully!',
    });
  } catch (error) {
    console.error('Error in task update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
