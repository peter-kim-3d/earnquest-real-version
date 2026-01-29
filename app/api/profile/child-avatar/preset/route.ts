import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api/error-handler';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication - can be parent or child
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { presetId, childId } = await request.json();

    if (!presetId || !childId) {
      return NextResponse.json({ error: 'Preset ID and Child ID required' }, { status: 400 });
    }

    // Verify child belongs to user's family
    const { data: child } = await supabase
      .from('children')
      .select('id, family_id')
      .eq('id', childId)
      .single();

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Check if user belongs to same family
    const { data: userProfile } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (userProfile?.family_id !== child.family_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update child profile with preset
    const { error: updateError } = await supabase
      .from('children')
      .update({ avatar_url: `preset:${presetId}` })
      .eq('id', childId);

    if (updateError) {
      console.error('Preset update error:', updateError);
      return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      avatarUrl: `preset:${presetId}`,
    });
  } catch (error: unknown) {
    console.error('Child avatar preset error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
