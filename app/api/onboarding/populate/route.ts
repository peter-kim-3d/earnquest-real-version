import { createClient } from '@/lib/supabase/server';
import { populateTasksAndRewards } from '@/lib/services/onboarding';
import { PresetKey, ModuleKey, AgeGroup } from '@/lib/types/task';
import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api/error-handler';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's family_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const body = await request.json();

    // v2.1: Support both new (presetKey, enabledModules) and legacy (style, conditionalAnswers) params
    const presetKey: PresetKey = body.presetKey || body.style || 'balanced';
    const childId: string = body.childId;
    const ageGroup: AgeGroup = body.ageGroup || '8-11';
    const enabledModules: ModuleKey[] = body.enabledModules || [];
    const locale: string = body.locale || 'en-US';

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // Validate presetKey
    const validPresets: PresetKey[] = ['starter', 'balanced', 'learning_focus'];
    if (!validPresets.includes(presetKey)) {
      return NextResponse.json(
        { error: `Invalid preset. Must be one of: ${validPresets.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate enabledModules
    const validModules: ModuleKey[] = ['hygiene', 'fitness', 'hobby'];
    for (const mod of enabledModules) {
      if (!validModules.includes(mod)) {
        return NextResponse.json(
          { error: `Invalid module: ${mod}. Must be one of: ${validModules.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // v2.1: Populate tasks and rewards from templates with modules
    const result = await populateTasksAndRewards(
      userProfile.family_id,
      childId,
      presetKey,
      ageGroup,
      enabledModules,
      locale
    );

    return NextResponse.json(
      {
        success: true,
        presetKey,
        enabledModules,
        tasksCount: result.tasks.length,
        rewardsCount: result.rewards.length,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error populating tasks/rewards:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
