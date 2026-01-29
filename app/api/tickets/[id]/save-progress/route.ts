import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api/error-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { childId, elapsedSeconds } = await request.json();

    if (!childId) {
      return NextResponse.json(
        { error: 'Child ID required' },
        { status: 400 }
      );
    }

    if (typeof elapsedSeconds !== 'number' || elapsedSeconds < 0) {
      return NextResponse.json(
        { error: 'Valid elapsed seconds required' },
        { status: 400 }
      );
    }

    // Call database function to update elapsed time
    const { data, error } = await supabase.rpc('update_screen_time_elapsed', {
      p_purchase_id: id,
      p_child_id: childId,
      p_elapsed_seconds: Math.floor(elapsedSeconds),
    });

    if (error) {
      console.error('Save progress error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to save progress' },
        { status: 500 }
      );
    }

    if (!data.success) {
      return NextResponse.json(
        { error: data.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      purchase_id: data.purchase_id,
      elapsed_seconds: data.elapsed_seconds,
    });
  } catch (error: unknown) {
    console.error('Save progress error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
