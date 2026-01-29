import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api/error-handler';

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
  } catch (error: unknown) {
    console.error('Preset update error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
