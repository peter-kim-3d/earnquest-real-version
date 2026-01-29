import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api/error-handler';
import { authenticateAndGetFamily, errors } from '@/lib/api/responses';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Authenticate and get family
    const authResult = await authenticateAndGetFamily(supabase);
    if ('error' in authResult) return authResult.error;
    const { familyId } = authResult;

    const body = await request.json();
    const {
      name,
      description,
      category,
      points_cost,
      screen_minutes,
      weekly_limit,
      icon,
      image_url,
      is_active,
      real_value_cents,
    } = body;

    // Validate required fields
    if (!name || !category || !points_cost) {
      return errors.missingFields(['name', 'category', 'points_cost']);
    }

    // Create reward
    const { data: reward, error: createError } = await supabase
      .from('rewards')
      .insert({
        family_id: familyId,
        name,
        description: description || null,
        category,
        points_cost,
        screen_minutes: screen_minutes || null,
        weekly_limit: weekly_limit || null,
        icon: icon || 'redeem',
        image_url: image_url || null,
        is_active: is_active !== undefined ? is_active : true,
        real_value_cents: real_value_cents || null,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating reward:', createError);
      return errors.internalError('Failed to create reward');
    }

    return NextResponse.json({
      success: true,
      reward,
      message: 'Reward created successfully!',
    });
  } catch (error: unknown) {
    console.error('Error in reward creation:', error);
    return errors.internalError(getErrorMessage(error));
  }
}
