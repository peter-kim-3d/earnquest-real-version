import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const { name, ageGroup, familyId, pinCode, birthdate } = body;

    if (!name || !ageGroup || !familyId) {
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

    if (userProfile?.family_id !== familyId) {
      return NextResponse.json(
        { error: 'Unauthorized - family mismatch' },
        { status: 403 }
      );
    }

    // Create child
    const { data: child, error } = await supabase
      .from('children')
      .insert({
        family_id: familyId,
        name,
        age_group: ageGroup,
        points_balance: 0,
        ...(pinCode && { pin_code: pinCode }),
        ...(birthdate && { birthdate }),
      })
      .select()
      .single();

    if (error) {
      console.error('Create child error:', error);
      return NextResponse.json(
        { error: 'Failed to create child' },
        { status: 500 }
      );
    }

    return NextResponse.json({ child });
  } catch (error: any) {
    console.error('Create child error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
