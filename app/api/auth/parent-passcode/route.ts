import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Check if passcode is set
export async function GET() {
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

    // Get user's passcode
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('passcode')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasPasscode: !!userProfile?.passcode,
    });
  } catch (error: any) {
    console.error('Error checking passcode:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Set or update passcode
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

    const body = await request.json();
    const { passcode } = body;

    if (!passcode) {
      return NextResponse.json(
        { error: 'Passcode is required' },
        { status: 400 }
      );
    }

    // Validate passcode format (4 digits)
    if (!/^\d{4}$/.test(passcode)) {
      return NextResponse.json(
        { error: 'Passcode must be exactly 4 digits' },
        { status: 400 }
      );
    }

    // Update user passcode
    const { error: updateError } = await supabase
      .from('users')
      .update({ passcode })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating passcode:', updateError);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Passcode set successfully',
    });
  } catch (error: any) {
    console.error('Error setting passcode:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set passcode' },
      { status: 500 }
    );
  }
}
