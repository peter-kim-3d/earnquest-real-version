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
    const { childId } = await request.json();

    if (!childId) {
      return NextResponse.json(
        { error: 'Child ID required' },
        { status: 400 }
      );
    }

    // Call database function to resume screen time
    const { data, error } = await supabase.rpc('resume_screen_time', {
      p_purchase_id: id,
      p_child_id: childId,
    });

    if (error) {
      console.error('Resume screen time error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to resume screen time' },
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
      paused_seconds: data.paused_seconds,
    });
  } catch (error: unknown) {
    console.error('Resume screen time error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
