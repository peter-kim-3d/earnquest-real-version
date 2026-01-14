import { createClient } from '@/lib/supabase/server';
import { populateTasksAndRewards } from '@/lib/services/onboarding';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's family_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { style, childId, ageGroup, conditionalAnswers } = body;

    if (!style || !childId || !ageGroup) {
      return NextResponse.json(
        { error: 'Style, child ID, and age group are required' },
        { status: 400 }
      );
    }

    // v2: Populate tasks and rewards from templates with conditional answers
    const result = await populateTasksAndRewards(
      userProfile.family_id,
      childId,
      style,
      ageGroup,
      conditionalAnswers
    );

    return NextResponse.json({
      success: true,
      tasksCount: result.tasks.length,
      rewardsCount: result.rewards.length,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error populating tasks/rewards:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to populate tasks and rewards' },
      { status: 500 }
    );
  }
}
