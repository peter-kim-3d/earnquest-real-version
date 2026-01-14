import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const { childId, name, ageGroup, familyId, pinCode, birthdate } = body;

    if (!childId || !name || !ageGroup) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate PIN if provided
    if (pinCode && !/^\d{4}$/.test(pinCode)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      );
    }

    // Verify user has access to this family
    const { data: userProfile } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (familyId && userProfile?.family_id !== familyId) {
      return NextResponse.json(
        { error: 'Unauthorized - family mismatch' },
        { status: 403 }
      );
    }

    // Verify child belongs to user's family
    const { data: existingChild } = await supabase
      .from('children')
      .select('family_id')
      .eq('id', childId)
      .single();

    if (existingChild?.family_id !== userProfile?.family_id) {
      return NextResponse.json(
        { error: 'Unauthorized - child not in your family' },
        { status: 403 }
      );
    }

    // Update child
    const updateData: any = {
      name,
      age_group: ageGroup,
      ...(birthdate && { birthdate }),
    };

    // Only update PIN if provided
    if (pinCode) {
      updateData.pin_code = pinCode;
    }

    const { data: child, error } = await supabase
      .from('children')
      .update(updateData)
      .eq('id', childId)
      .select()
      .single();

    if (error) {
      console.error('Update child error:', error);
      return NextResponse.json(
        { error: 'Failed to update child' },
        { status: 500 }
      );
    }

    return NextResponse.json({ child });
  } catch (error: any) {
    console.error('Update child error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
