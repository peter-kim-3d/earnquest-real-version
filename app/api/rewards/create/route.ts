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

    // Get user's family
    const { data: userProfile } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      points_cost,
      screen_minutes,
      weekly_limit,
      icon,
      is_active,
    } = body;

    // Validate required fields
    if (!name || !category || !points_cost) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create reward
    const { data: reward, error: createError } = await supabase
      .from('rewards')
      .insert({
        family_id: userProfile.family_id,
        name,
        description: description || null,
        category,
        points_cost,
        screen_minutes: screen_minutes || null,
        weekly_limit: weekly_limit || null,
        icon: icon || 'redeem',
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating reward:', createError);
      return NextResponse.json(
        { error: 'Failed to create reward' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reward,
      message: 'Reward created successfully!',
    });
  } catch (error) {
    console.error('Error in reward creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
