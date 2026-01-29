import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api/error-handler';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { purchaseId } = await request.json();

    if (!purchaseId) {
      return NextResponse.json({ error: 'Purchase ID required' }, { status: 400 });
    }

    // Get purchase details
    const { data: purchase, error: purchaseError } = await supabase
      .from('reward_purchases')
      .select('*, children(id, points_balance)')
      .eq('id', purchaseId)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Only allow canceling if status is 'purchased' or 'active' (not used/fulfilled)
    const cancellableStatuses = ['purchased', 'active'];
    if (!cancellableStatuses.includes(purchase.status)) {
      return NextResponse.json(
        { error: 'Cannot cancel a used or fulfilled reward' },
        { status: 400 }
      );
    }

    // Refund points to child
    const refundPoints = purchase.points_spent;
    const newBalance = (purchase.children?.points_balance || 0) + refundPoints;

    const { error: updateError } = await supabase
      .from('children')
      .update({ points_balance: newBalance })
      .eq('id', purchase.child_id);

    if (updateError) {
      throw new Error('Failed to refund points');
    }

    // Mark purchase as cancelled (preserve record for audit trail)
    const { error: cancelError } = await supabase
      .from('reward_purchases')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchaseId);

    if (cancelError) {
      throw new Error('Failed to cancel purchase');
    }

    return NextResponse.json({
      success: true,
      refundedPoints: refundPoints,
      newBalance,
    });
  } catch (error: unknown) {
    console.error('Cancel purchase error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
