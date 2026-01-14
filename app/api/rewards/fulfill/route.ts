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
    const { purchaseId } = body;

    if (!purchaseId) {
      return NextResponse.json(
        { error: 'Missing purchaseId' },
        { status: 400 }
      );
    }

    // Get the purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('reward_purchases')
      .select('*')
      .eq('id', purchaseId)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Check if already fulfilled
    if (purchase.status === 'fulfilled') {
      return NextResponse.json(
        { error: 'Reward already fulfilled' },
        { status: 400 }
      );
    }

    // Update purchase status
    const { error: updateError } = await supabase
      .from('reward_purchases')
      .update({
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString(),
        fulfilled_by: user.id,
      })
      .eq('id', purchaseId);

    if (updateError) {
      console.error('Error fulfilling reward:', updateError);
      return NextResponse.json(
        { error: 'Failed to fulfill reward' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reward fulfilled successfully!',
    });
  } catch (error) {
    console.error('Error in reward fulfillment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
