import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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

    // Get preset ID
    const { presetId } = await request.json();

    if (!presetId) {
      return NextResponse.json({ error: 'Preset ID required' }, { status: 400 });
    }

    // Update user profile with preset
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: `preset:${presetId}` })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      avatarUrl: `preset:${presetId}`,
    });
  } catch (error: any) {
    console.error('Preset update error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
