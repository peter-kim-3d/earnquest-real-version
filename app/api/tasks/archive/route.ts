import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
    const { taskId, archive } = body;

    if (!taskId || typeof archive !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing taskId or archive parameter' },
        { status: 400 }
      );
    }

    // Verify user owns this task (via family)
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('family_id')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.family_id !== task.family_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Call the appropriate database function
    const functionName = archive ? 'archive_task' : 'unarchive_task';
    const { data, error: rpcError } = await supabase.rpc(functionName, {
      p_task_id: taskId,
    });

    if (rpcError) {
      console.error(`Error calling ${functionName}:`, rpcError);
      return NextResponse.json(
        { error: `Failed to ${archive ? 'archive' : 'unarchive'} task` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      archived: archive,
      message: `Task ${archive ? 'archived' : 'unarchived'} successfully`,
    });
  } catch (error) {
    console.error('Error in archive/unarchive:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
