'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function completeTask(childId: string, taskId: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get user's family
    const { data: userData } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userData?.family_id) {
      return { success: false, error: 'Family not found' };
    }

    // Verify child belongs to user's family
    const { data: child } = await supabase
      .from('children')
      .select('id, family_id')
      .eq('id', childId)
      .eq('family_id', userData.family_id)
      .single();

    if (!child) {
      return { success: false, error: 'Child not found or unauthorized' };
    }

    // Verify task belongs to family and is active
    const { data: task } = await supabase
      .from('tasks')
      .select('id, family_id, is_active, approval_type, points')
      .eq('id', taskId)
      .eq('family_id', userData.family_id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (!task) {
      return { success: false, error: 'Task not found or is no longer active' };
    }

    // Check if child already has a pending completion for this task
    const { data: existingCompletion } = await supabase
      .from('task_completions')
      .select('id')
      .eq('task_id', taskId)
      .eq('child_id', childId)
      .eq('status', 'pending')
      .single();

    if (existingCompletion) {
      return { success: false, error: 'You already submitted this task! Wait for approval.' };
    }

    // Create task completion
    const completionData: any = {
      task_id: taskId,
      child_id: childId,
      family_id: userData.family_id,
      status: task.approval_type === 'auto' ? 'approved' : 'pending',
      requested_at: new Date().toISOString(),
    };

    // If auto-approve, set completion time immediately
    if (task.approval_type === 'auto') {
      completionData.completed_at = new Date().toISOString();
      completionData.approved_at = new Date().toISOString();
    }

    const { data: completion, error: completionError } = await supabase
      .from('task_completions')
      .insert(completionData)
      .select()
      .single();

    if (completionError) {
      console.error('Error creating task completion:', completionError);
      return { success: false, error: 'Failed to submit task completion' };
    }

    // If auto-approve, award points immediately
    if (task.approval_type === 'auto') {
      const { error: pointsError } = await supabase.rpc('add_points', {
        p_child_id: childId,
        p_amount: task.points,
        p_type: 'task_completion',
        p_reference_type: 'task_completion',
        p_reference_id: completion.id,
        p_description: `Completed: ${taskId}`,
      });

      if (pointsError) {
        console.error('Error awarding points:', pointsError);
        // Don't fail the completion, just log the error
      }
    }

    // Revalidate child dashboard and parent dashboard
    revalidatePath('/[locale]/child/[childId]', 'page');
    revalidatePath('/[locale]/dashboard', 'page');

    return {
      success: true,
      autoApproved: task.approval_type === 'auto',
    };
  } catch (error) {
    console.error('Unexpected error completing task:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
