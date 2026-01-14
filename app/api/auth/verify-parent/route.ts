import { createClient } from '@/lib/supabase/server';
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

    let body;
    try {
      const text = await request.text();
      if (!text) {
        return NextResponse.json(
          { error: 'Request body is empty' },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

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
        { error: 'Passcode must be 4 digits' },
        { status: 400 }
      );
    }

    // Get user's passcode from database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('passcode')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if passcode is set
    if (!userProfile.passcode) {
      return NextResponse.json(
        { error: 'Passcode not set. Please set up your passcode first.', needsSetup: true },
        { status: 403 }
      );
    }

    // Verify passcode
    if (userProfile.passcode !== passcode) {
      return NextResponse.json(
        { error: 'Invalid passcode' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Passcode verified successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error verifying parent passcode:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify passcode' },
      { status: 500 }
    );
  }
}
