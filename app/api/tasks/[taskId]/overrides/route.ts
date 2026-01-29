/**
 * GET /api/tasks/[taskId]/overrides
 *
 * Fetches child_task_overrides for a specific task
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api/error-handler';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch overrides for this task
    const { data: overrides, error: overridesError } = await supabase
      .from('child_task_overrides')
      .select('*')
      .eq('task_id', taskId);

    if (overridesError) {
      console.error('Failed to fetch task overrides:', overridesError);
      return NextResponse.json(
        { error: 'Failed to fetch task overrides', details: overridesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      overrides: overrides || [],
    });
  } catch (error: unknown) {
    console.error('Error fetching task overrides:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
