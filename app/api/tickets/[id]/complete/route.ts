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

    // Call database function to complete screen time
    const { data, error } = await supabase.rpc('complete_screen_time', {
      p_purchase_id: id,
      p_child_id: childId,
    });

    if (error) {
      console.error('Complete screen time error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to complete screen time' },
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
      status: data.status,
    });
  } catch (error: unknown) {
    console.error('Complete screen time error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
