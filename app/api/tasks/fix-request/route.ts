import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { FixRequestSchema, formatZodError } from '@/lib/validation/task';

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

    // v2: Validate with Zod schema
    const validationResult = FixRequestSchema.safeParse(body);

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

    const { completionId, items, message } = validationResult.data;

    // Get the completion to verify it exists and belongs to user's family
    const { data: completion, error: fetchError } = await supabase
      .from('task_completions')
      .select('id, family_id, status, fix_request_count')
      .eq('id', completionId)
      .single();

    if (fetchError || !completion) {
      return NextResponse.json(
        { error: 'Task completion not found' },
        { status: 404 }
      );
    }

    // Verify user belongs to the same family
    const { data: userProfile } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.family_id !== completion.family_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Only allow fix requests on pending completions
    if (completion.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only request fixes on pending completions' },
        { status: 400 }
      );
    }

    // v2: Update completion with fix request including metadata
    const { data: updatedCompletion, error: updateError } = await supabase
      .from('task_completions')
      .update({
        status: 'fix_requested',
        fix_request: {
          items,
          message: message || null,
          requestedAt: new Date().toISOString(),
          requestedBy: user.id,
        },
        fix_request_count: (completion.fix_request_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', completionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating completion with fix request:', updateError);
      return NextResponse.json(
        { error: 'Failed to create fix request', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      completion: updatedCompletion,
      message: 'Fix request sent successfully!',
    });
  } catch (error) {
    console.error('Error in fix request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
