import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTierForPoints } from '@/lib/utils/tiers';
import { getErrorMessage } from '@/lib/api/error-handler';
import { authenticateAndGetFamily, errors } from '@/lib/api/responses';

/**
 * GET /api/goals
 * Get goals for a child (query param: childId)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    // Authenticate and get family
    const authResult = await authenticateAndGetFamily(supabase);
    if ('error' in authResult) return authResult.error;
    const { familyId } = authResult;

    // Build query
    let query = supabase
      .from('goals')
      .select('*')
      .eq('family_id', familyId)
      .is('deleted_at', null)
      .order('is_completed', { ascending: true })
      .order('created_at', { ascending: false });

    if (childId) {
      query = query.eq('child_id', childId);
    }

    const { data: goals, error } = await query;

    if (error) {
      console.error('Error fetching goals:', error);
      return errors.internalError('Failed to fetch goals');
    }

    return NextResponse.json({ goals });
  } catch (error: unknown) {
    console.error('Goals GET error:', error);
    return errors.internalError(getErrorMessage(error));
  }
}

/**
 * POST /api/goals
 * Create a new goal
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate and get family
    const authResult = await authenticateAndGetFamily(supabase);
    if ('error' in authResult) return authResult.error;
    const { familyId } = authResult;

    const body = await request.json();
    const { childId, name, description, targetPoints, icon, realValueCents, milestoneBonuses } = body;

    // Validate required fields
    if (!childId || !name || !targetPoints) {
      return errors.missingFields(['childId', 'name', 'targetPoints']);
    }

    if (targetPoints <= 0) {
      return errors.badRequest('Target points must be positive');
    }

    // Verify child belongs to this family
    const { data: child } = await supabase
      .from('children')
      .select('id, family_id')
      .eq('id', childId)
      .eq('family_id', familyId)
      .single();

    if (!child) {
      return errors.notFound('Child in your family');
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
        family_id: familyId,
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
      return errors.internalError('Failed to create goal');
    }

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error: unknown) {
    console.error('Goals POST error:', error);
    return errors.internalError(getErrorMessage(error));
  }
}

/**
 * PATCH /api/goals
 * Update a goal
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate and get family
    const authResult = await authenticateAndGetFamily(supabase);
    if ('error' in authResult) return authResult.error;
    const { familyId } = authResult;

    const body = await request.json();
    const { goalId, name, description, targetPoints, reason } = body;

    if (!goalId) {
      return errors.missingFields(['goalId']);
    }

    // Get existing goal
    const { data: existingGoal } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('family_id', familyId)
      .single();

    if (!existingGoal) {
      return errors.notFound('Goal');
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
        return errors.badRequest('Reason is required when changing target points');
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
      return errors.internalError('Failed to update goal');
    }

    return NextResponse.json({ goal });
  } catch (error: unknown) {
    console.error('Goals PATCH error:', error);
    return errors.internalError(getErrorMessage(error));
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
      return errors.missingFields(['goalId']);
    }

    // Authenticate and get family
    const authResult = await authenticateAndGetFamily(supabase);
    if ('error' in authResult) return authResult.error;
    const { familyId } = authResult;

    // Soft delete
    const { error } = await supabase
      .from('goals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', goalId)
      .eq('family_id', familyId);

    if (error) {
      console.error('Error deleting goal:', error);
      return errors.internalError('Failed to delete goal');
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Goals DELETE error:', error);
    return errors.internalError(getErrorMessage(error));
  }
}
