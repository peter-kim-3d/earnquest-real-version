import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { PIN_REGEX } from '@/lib/api/validation';
import { getErrorMessage } from '@/lib/api/error-handler';

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
    const { childId, passcode } = body;

    if (!childId || !passcode) {
      return NextResponse.json(
        { error: 'Child ID and passcode are required' },
        { status: 400 }
      );
    }

    // Validate passcode format
    if (!PIN_REGEX.test(passcode)) {
      return NextResponse.json(
        { error: 'Passcode must be exactly 4 digits' },
        { status: 400 }
      );
    }

    // Verify child belongs to user's family
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('family_id', userProfile.family_id)
      .single();

    if (childError || !child) {
      return NextResponse.json(
        { error: 'Child not found or access denied' },
        { status: 404 }
      );
    }

    // Update passcode
    const { error: updateError } = await supabase
      .from('children')
      .update({ pin_code: passcode })
      .eq('id', childId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(
      { success: true, message: 'Passcode updated successfully' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error updating passcode:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
