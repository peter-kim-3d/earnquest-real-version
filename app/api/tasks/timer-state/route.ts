import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api/error-handler';

// GET: Fetch timer state for a task/child combination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const childId = searchParams.get('childId');

    if (!taskId || !childId) {
      return NextResponse.json(
        { error: 'taskId and childId are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_task_timer_state', {
      p_task_id: taskId,
      p_child_id: childId,
    });

    if (error) {
      console.error('Get timer state error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      timerState: data,
    });
  } catch (error: unknown) {
    console.error('Get timer state error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// POST: Save timer state for a task/child combination
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { taskId, childId, remainingSeconds, totalSeconds } = await request.json();

    if (!taskId || !childId) {
      return NextResponse.json(
        { error: 'taskId and childId are required' },
        { status: 400 }
      );
    }

    if (typeof remainingSeconds !== 'number' || typeof totalSeconds !== 'number') {
      return NextResponse.json(
        { error: 'remainingSeconds and totalSeconds must be numbers' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc('save_task_timer_state', {
      p_task_id: taskId,
      p_child_id: childId,
      p_remaining_seconds: Math.floor(remainingSeconds),
      p_total_seconds: Math.floor(totalSeconds),
    });

    if (error) {
      console.error('Save timer state error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      timerState: data.timer_state,
    });
  } catch (error: unknown) {
    console.error('Save timer state error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
