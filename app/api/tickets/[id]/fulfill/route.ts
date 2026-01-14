import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated parent user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call database function to fulfill ticket (mark as given)
    const { data, error } = await supabase.rpc('fulfill_ticket', {
      p_purchase_id: id,
      p_parent_id: user.id,
    });

    if (error) {
      console.error('Fulfill ticket error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fulfill ticket' },
        { status: 500 }
      );
    }

    if (!data.success) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      purchase_id: data.purchase_id,
      status: data.status,
    });
  } catch (error: any) {
    console.error('Fulfill ticket error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
