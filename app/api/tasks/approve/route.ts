import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api/error-handler';

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
    const { completionId } = body;

    if (!completionId) {
      return NextResponse.json(
        { error: 'Missing completionId' },
        { status: 400 }
      );
    }

    // Get the completion
    const { data: completion, error: completionError } = await supabase
      .from('task_completions')
      .select('*, tasks(*)')
      .eq('id', completionId)
      .single();

    if (completionError || !completion) {
      return NextResponse.json(
        { error: 'Completion not found' },
        { status: 404 }
      );
    }

    // Check if already approved
    if (completion.status === 'approved' || completion.status === 'auto_approved') {
      return NextResponse.json(
        { error: 'Task already approved' },
        { status: 400 }
      );
    }

    // Update completion status
    const { error: updateError } = await supabase
      .from('task_completions')
      .update({
        status: 'approved',
        points_awarded: completion.tasks.points,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('id', completionId);

    if (updateError) {
      console.error('Error updating completion:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve task' },
        { status: 500 }
      );
    }

    // Add points to child using the RPC function
    const { error: pointsError } = await supabase.rpc('add_points', {
      p_child_id: completion.child_id,
      p_amount: completion.tasks.points,
      p_type: 'task_completion',
      p_reference_type: 'task_completion',
      p_reference_id: completionId,
      p_description: `${completion.tasks.name} completed`,
    });

    if (pointsError) {
      console.error('Error adding points:', pointsError);
      // Don't fail the approval if points fail - log it for manual fix
    }

    return NextResponse.json({
      success: true,
      message: 'Task approved successfully',
      pointsAwarded: completion.tasks.points,
    });
  } catch (error: unknown) {
    console.error('Error in task approval:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
