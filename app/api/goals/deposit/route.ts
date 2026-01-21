import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
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

/**
 * POST /api/goals/deposit
 * Deposit points to a goal
 */
export async function POST(request: NextRequest) {
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
    const { goalId, childId, amount } = body;

    // Validate required fields
    if (!goalId || !childId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: goalId, childId, amount' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
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

    // Verify child exists
    const { data: child } = await dbClient
      .from('children')
      .select('id, family_id, points_balance')
      .eq('id', childId)
      .single();

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    // For parent auth, verify child belongs to their family
    if (user && !isChildSession) {
      const { data: userProfile } = await dbClient
        .from('users')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (!userProfile?.family_id || userProfile.family_id !== child.family_id) {
        return NextResponse.json(
          { error: 'Child not found in your family' },
          { status: 404 }
        );
      }
    }

    // Call the deposit_to_goal RPC function
    const { data: result, error } = await dbClient.rpc('deposit_to_goal', {
      p_goal_id: goalId,
      p_child_id: childId,
      p_amount: amount,
    });

    if (error) {
      console.error('Error depositing to goal:', error);
      return NextResponse.json(
        { error: 'Failed to deposit to goal' },
        { status: 500 }
      );
    }

    // Handle result from RPC
    const depositResult = result as {
      success: boolean;
      error?: string;
      new_balance?: number;
      goal_progress?: number;
      goal_target?: number;
      is_completed?: boolean;
      milestone_reached?: number | null;
      milestone_bonus?: number;
    };

    if (!depositResult.success) {
      return NextResponse.json(
        { error: depositResult.error || 'Deposit failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      newBalance: depositResult.new_balance,
      goalProgress: depositResult.goal_progress,
      goalTarget: depositResult.goal_target,
      isCompleted: depositResult.is_completed,
      milestoneReached: depositResult.milestone_reached ?? null,
      milestoneBonus: depositResult.milestone_bonus ?? 0,
    });
  } catch (error) {
    console.error('Goal deposit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
