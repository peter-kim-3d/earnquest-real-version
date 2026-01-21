import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Create admin client for child session (bypasses RLS)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check for parent auth OR child session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If no parent auth, check for child session cookie
    let isChildSession = false;
    let childSessionData: { childId: string; familyId: string } | null = null;

    if (!user) {
      const cookieStore = await cookies();
      const childSessionCookie = cookieStore.get('child_session');

      if (childSessionCookie) {
        try {
          childSessionData = JSON.parse(childSessionCookie.value);
          if (childSessionData?.childId && childSessionData?.familyId) {
            isChildSession = true;
          }
        } catch {
          // Invalid cookie
        }
      }

      if (!isChildSession) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Use admin client for child session (bypasses RLS)
    const dbClient = isChildSession ? (getAdminClient() || supabase) : supabase;

    const body = await request.json();
    const { rewardId, childId } = body;

    if (!rewardId || !childId) {
      return NextResponse.json(
        { error: 'Missing rewardId or childId' },
        { status: 400 }
      );
    }

    // If child session, verify childId matches session
    if (isChildSession && childSessionData && childId !== childSessionData.childId) {
      return NextResponse.json(
        { error: 'Unauthorized: childId mismatch' },
        { status: 403 }
      );
    }

    // Use the database RPC function to handle the purchase
    const { data, error } = await dbClient.rpc('purchase_reward', {
      p_reward_id: rewardId,
      p_child_id: childId,
    });

    if (error) {
      console.error('Purchase error:', error);

      // Handle specific error cases
      if (error.message.includes('Insufficient points')) {
        return NextResponse.json(
          { error: 'You need more Quest Points to purchase this reward!' },
          { status: 400 }
        );
      }

      if (error.message.includes('Weekly limit reached')) {
        return NextResponse.json(
          { error: 'You\'ve already purchased this reward the maximum times this week!' },
          { status: 400 }
        );
      }

      if (error.message.includes('Screen budget exceeded')) {
        return NextResponse.json(
          { error: 'You\'ve used all your screen time this week. Try other rewards!' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to purchase reward' },
        { status: 500 }
      );
    }

    // Check if purchase was successful
    if (!data || !data.success) {
      return NextResponse.json(
        { error: data?.error || 'Purchase failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reward purchased successfully!',
      newBalance: data.new_balance,
      purchaseId: data.purchase_id,
    });
  } catch (error) {
    console.error('Error in reward purchase:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
