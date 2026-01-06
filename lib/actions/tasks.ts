'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function approveTask(approvalId: string) {
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

    // Get the task completion details
    const { data: completion, error: completionError } = await supabase
      .from('task_completions')
      .select('*, tasks(points)')
      .eq('id', approvalId)
      .single();

    if (completionError || !completion) {
      return { success: false, error: 'Task completion not found' };
    }

    // Verify user has access to this family
    const { data: userData } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userData || userData.family_id !== completion.family_id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update task completion status
    const { error: updateError } = await supabase
      .from('task_completions')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        completed_at: new Date().toISOString(),
      })
      .eq('id', approvalId);

    if (updateError) {
      console.error('Error updating task completion:', updateError);
      return { success: false, error: 'Failed to approve task' };
    }

    // Award points using the database function
    const points = completion.tasks?.points || 0;
    const { error: pointsError } = await supabase.rpc('add_points', {
      p_child_id: completion.child_id,
      p_amount: points,
      p_type: 'task_completion',
      p_reference_type: 'task_completion',
      p_reference_id: approvalId,
      p_description: `Approved: ${completion.task_id}`,
    });

    if (pointsError) {
      console.error('Error awarding points:', pointsError);
      // Don't fail the approval, just log the error
    }

    // Revalidate the dashboard to show updated data
    revalidatePath('/[locale]/dashboard', 'page');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error approving task:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function rejectTask(approvalId: string, message?: string) {
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

    // Get the task completion details
    const { data: completion, error: completionError } = await supabase
      .from('task_completions')
      .select('*')
      .eq('id', approvalId)
      .single();

    if (completionError || !completion) {
      return { success: false, error: 'Task completion not found' };
    }

    // Verify user has access to this family
    const { data: userData } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userData || userData.family_id !== completion.family_id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update task completion to fix_requested
    const { error: updateError } = await supabase
      .from('task_completions')
      .update({
        status: 'fix_requested',
        fix_request_count: (completion.fix_request_count || 0) + 1,
        fix_request_message: message || 'Please try again',
      })
      .eq('id', approvalId);

    if (updateError) {
      console.error('Error rejecting task:', updateError);
      return { success: false, error: 'Failed to reject task' };
    }

    // Revalidate the dashboard
    revalidatePath('/[locale]/dashboard', 'page');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error rejecting task:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteTaskCompletion(approvalId: string) {
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

    // Get the task completion details
    const { data: completion, error: completionError } = await supabase
      .from('task_completions')
      .select('*')
      .eq('id', approvalId)
      .single();

    if (completionError || !completion) {
      return { success: false, error: 'Task completion not found' };
    }

    // Verify user has access to this family
    const { data: userData } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userData || userData.family_id !== completion.family_id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Delete the task completion
    const { error: deleteError } = await supabase
      .from('task_completions')
      .delete()
      .eq('id', approvalId);

    if (deleteError) {
      console.error('Error deleting task completion:', deleteError);
      return { success: false, error: 'Failed to delete task' };
    }

    // Revalidate the dashboard
    revalidatePath('/[locale]/dashboard', 'page');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting task:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
