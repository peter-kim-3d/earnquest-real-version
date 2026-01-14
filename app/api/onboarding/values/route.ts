import { createClient } from '@/lib/supabase/server';
import { saveFamilyValues } from '@/lib/services/onboarding';
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
    const { values } = body;

    if (!values || !Array.isArray(values)) {
      return NextResponse.json(
        { error: 'Values array is required' },
        { status: 400 }
      );
    }

    // Save family values
    const savedValues = await saveFamilyValues(userProfile.family_id, values);

    return NextResponse.json({
      success: true,
      count: savedValues.length,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error saving family values:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save family values' },
      { status: 500 }
    );
  }
}
