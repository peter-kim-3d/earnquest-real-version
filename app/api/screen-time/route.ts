import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/screen-time
 * Get screen time budget for a child
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json(
        { error: 'Missing childId parameter' },
        { status: 400 }
      );
    }

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's family
    const { data: userProfile } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userProfile?.family_id) {
      return NextResponse.json({ error: 'No family found' }, { status: 404 });
    }

    // Verify child belongs to this family
    const { data: child } = await supabase
      .from('children')
      .select('id, family_id')
      .eq('id', childId)
      .eq('family_id', userProfile.family_id)
      .single();

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found in your family' },
        { status: 404 }
      );
    }

    // Get current week's budget using RPC
    const { data: budget, error } = await supabase.rpc(
      'get_or_create_screen_budget',
      {
        p_child_id: childId,
        p_family_id: userProfile.family_id,
      }
    );

    if (error) {
      console.error('Error getting screen budget:', error);
      return NextResponse.json(
        { error: 'Failed to get screen time budget' },
        { status: 500 }
      );
    }

    return NextResponse.json({ budget });
  } catch (error) {
    console.error('Screen time GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/screen-time
 * Update screen time budget settings (parent only)
 */
export async function PATCH(request: NextRequest) {
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
    const { childId, baseMinutes, dailyLimitMinutes, cooldownMinutes } = body;

    if (!childId) {
      return NextResponse.json(
        { error: 'Missing childId' },
        { status: 400 }
      );
    }

    // Get user's family and verify parent role
    const { data: userProfile } = await supabase
      .from('users')
      .select('family_id, role')
      .eq('id', user.id)
      .single();

    if (!userProfile?.family_id) {
      return NextResponse.json({ error: 'No family found' }, { status: 404 });
    }

    if (userProfile.role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parents can update screen time settings' },
        { status: 403 }
      );
    }

    // Verify child belongs to this family
    const { data: child } = await supabase
      .from('children')
      .select('id, family_id')
      .eq('id', childId)
      .eq('family_id', userProfile.family_id)
      .single();

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found in your family' },
        { status: 404 }
      );
    }

    // Get current week start
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    const weekStartDate = weekStart.toISOString().split('T')[0];

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (baseMinutes !== undefined) {
      if (baseMinutes < 0) {
        return NextResponse.json(
          { error: 'Base minutes cannot be negative' },
          { status: 400 }
        );
      }
      updates.base_minutes = baseMinutes;
    }

    if (dailyLimitMinutes !== undefined) {
      if (dailyLimitMinutes < 0) {
        return NextResponse.json(
          { error: 'Daily limit cannot be negative' },
          { status: 400 }
        );
      }
      updates.daily_limit_minutes = dailyLimitMinutes;
    }

    if (cooldownMinutes !== undefined) {
      if (cooldownMinutes < 0) {
        return NextResponse.json(
          { error: 'Cooldown minutes cannot be negative' },
          { status: 400 }
        );
      }
      updates.cooldown_minutes = cooldownMinutes;
    }

    // Update budget
    const { data: budget, error } = await supabase
      .from('screen_time_budgets')
      .update(updates)
      .eq('child_id', childId)
      .eq('week_start_date', weekStartDate)
      .select()
      .single();

    if (error) {
      console.error('Error updating screen budget:', error);
      return NextResponse.json(
        { error: 'Failed to update screen time budget' },
        { status: 500 }
      );
    }

    return NextResponse.json({ budget });
  } catch (error) {
    console.error('Screen time PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
