import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api/error-handler';
import { authenticateAndGetFamily, errors } from '@/lib/api/responses';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Authenticate and get family_id
    const authResult = await authenticateAndGetFamily(supabase);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { familyId } = authResult;

    const body = await request.json();
    const { taskId, archive } = body;

    if (!taskId || typeof archive !== 'boolean') {
      return errors.badRequest('Missing taskId or archive parameter');
    }

    // Verify task belongs to user's family
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('family_id')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return errors.notFound('Task');
    }

    if (task.family_id !== familyId) {
      return errors.forbidden();
    }

    // Call the appropriate database function
    const functionName = archive ? 'archive_task' : 'unarchive_task';
    const { error: rpcError } = await supabase.rpc(functionName, {
      p_task_id: taskId,
    });

    if (rpcError) {
      console.error(`Error calling ${functionName}:`, rpcError);
      return errors.internalError(`Failed to ${archive ? 'archive' : 'unarchive'} task`);
    }

    return NextResponse.json({
      success: true,
      archived: archive,
      message: `Task ${archive ? 'archived' : 'unarchived'} successfully`,
    });
  } catch (error: unknown) {
    console.error('Error in archive/unarchive:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
