import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api/error-handler';
import { authenticateAndGetFamily, errors } from '@/lib/api/responses';

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    // Authenticate and get family_id
    const authResult = await authenticateAndGetFamily(supabase);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { familyId } = authResult;

    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return errors.missingFields(['taskId']);
    }

    // Verify task belongs to user's family
    const { data: existingTask } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .eq('family_id', familyId)
      .single();

    if (!existingTask) {
      return errors.notFound('Task');
    }

    // Soft delete: set deleted_at timestamp
    const { error: deleteError } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', taskId);

    if (deleteError) {
      console.error('Error deleting task:', deleteError);
      return errors.internalError('Failed to delete task');
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully!',
    });
  } catch (error: unknown) {
    console.error('Error in task deletion:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
