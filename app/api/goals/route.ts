import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTierForPoints } from '@/lib/utils/tiers';

/**
 * GET /api/goals
 * Get goals for a child (query param: childId)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

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

    // Build query
    let query = supabase
      .from('goals')
      .select('*')
      .eq('family_id', userProfile.family_id)
      .is('deleted_at', null)
      .order('is_completed', { ascending: true })
      .order('created_at', { ascending: false });

    if (childId) {
      query = query.eq('child_id', childId);
    }

    const { data: goals, error } = await query;

    if (error) {
      console.error('Error fetching goals:', error);
      return NextResponse.json(
        { error: 'Failed to fetch goals' },
        { status: 500 }
      );
    }

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Goals GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/goals
 * Create a new goal
 */
export async function POST(request: NextRequest) {
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
    const { childId, name, description, targetPoints, icon, realValueCents, milestoneBonuses } = body;

    // Validate required fields
    if (!childId || !name || !targetPoints) {
      return NextResponse.json(
        { error: 'Missing required fields: childId, name, targetPoints' },
        { status: 400 }
      );
    }

    if (targetPoints <= 0) {
      return NextResponse.json(
        { error: 'Target points must be positive' },
        { status: 400 }
      );
    }

    // Get user's family and verify child belongs to family
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

    // Calculate tier
    const tier = getTierForPoints(targetPoints);

    // Validate milestone bonuses if provided
    let validatedMilestones: Record<string, number> | null = null;
    if (milestoneBonuses && typeof milestoneBonuses === 'object') {
      const tempMilestones: Record<string, number> = {};
      for (const key of ['25', '50', '75']) {
        const value = milestoneBonuses[key];
        if (typeof value === 'number' && value > 0) {
          tempMilestones[key] = value;
        }
      }
      if (Object.keys(tempMilestones).length > 0) {
        validatedMilestones = tempMilestones;
      }
    }

    // Create goal
    const { data: goal, error } = await supabase
      .from('goals')
      .insert({
        child_id: childId,
        family_id: userProfile.family_id,
        name,
        description: description || null,
        icon: icon || 'target',
        target_points: targetPoints,
        current_points: 0,
        tier,
        original_target: targetPoints,
        is_completed: false,
        real_value_cents: typeof realValueCents === 'number' ? realValueCents : null,
        milestone_bonuses: validatedMilestones,
        milestones_completed: [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating goal:', error);
      return NextResponse.json(
        { error: 'Failed to create goal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error('Goals POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/goals
 * Update a goal
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
    const { goalId, name, description, targetPoints, reason } = body;

    if (!goalId) {
      return NextResponse.json(
        { error: 'Missing goalId' },
        { status: 400 }
      );
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

    // Get existing goal
    const { data: existingGoal } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('family_id', userProfile.family_id)
      .single();

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    // If target is changing, require reason and update tier
    if (targetPoints !== undefined && targetPoints !== existingGoal.target_points) {
      if (!reason) {
        return NextResponse.json(
          { error: 'Reason is required when changing target points' },
          { status: 400 }
        );
      }

      updates.target_points = targetPoints;
      updates.tier = getTierForPoints(targetPoints);

      // Add to change log
      const changeLog = existingGoal.change_log || [];
      changeLog.push({
        action: 'target_change',
        old_target: existingGoal.target_points,
        new_target: targetPoints,
        reason,
        timestamp: new Date().toISOString(),
      });
      updates.change_log = changeLog;

      // Check if now completed
      if (existingGoal.current_points >= targetPoints) {
        updates.is_completed = true;
        updates.completed_at = new Date().toISOString();
      }
    }

    const { data: goal, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) {
      console.error('Error updating goal:', error);
      return NextResponse.json(
        { error: 'Failed to update goal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Goals PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/goals
 * Soft delete a goal
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goalId');

    if (!goalId) {
      return NextResponse.json(
        { error: 'Missing goalId' },
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

    // Soft delete
    const { error } = await supabase
      .from('goals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', goalId)
      .eq('family_id', userProfile.family_id);

    if (error) {
      console.error('Error deleting goal:', error);
      return NextResponse.json(
        { error: 'Failed to delete goal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Goals DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
