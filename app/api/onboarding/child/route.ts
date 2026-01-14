import { createClient } from '@/lib/supabase/server';
import { createChild } from '@/lib/services/child';
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
    let { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    // If user profile doesn't exist, create it
    if (profileError || !userProfile) {
      console.log('User profile not found, creating one...');
      const { getOrCreateUserProfile } = await import('@/lib/services/user');
      userProfile = await getOrCreateUserProfile(user);

      if (!userProfile || !userProfile.family_id) {
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }
    }

    const body = await request.json();
    const { name, ageGroup, birthdate, birthYear, avatarUrl, weeklyGoal, passcode } = body;

    if (!name || !ageGroup) {
      return NextResponse.json(
        { error: 'Name and age group are required' },
        { status: 400 }
      );
    }

    // Passcode is now optional (backward compatibility)
    // Validate format if provided
    if (passcode && !/^\d{4}$/.test(passcode)) {
      return NextResponse.json(
        { error: 'Passcode must be exactly 4 digits' },
        { status: 400 }
      );
    }

    // Create child
    const child = await createChild({
      familyId: userProfile.family_id,
      name,
      ageGroup,
      birthdate,
      birthYear,
      avatarUrl,
      weeklyGoal,
      pinCode: passcode,
    });

    return NextResponse.json({ child }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating child:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create child' },
      { status: 500 }
    );
  }
}
