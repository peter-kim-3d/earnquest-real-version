import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    // Get request body
    const body = await request.json();
    const { familyId, fromUserId, fromChildId, toChildId, message, theme } = body;

    // Validate required fields
    if (!familyId || !toChildId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate sender (either fromUserId or fromChildId, not both)
    if (!fromUserId && !fromChildId) {
      return NextResponse.json(
        { error: 'Must specify sender (fromUserId or fromChildId)' },
        { status: 400 }
      );
    }

    if (fromUserId && fromChildId) {
      return NextResponse.json(
        { error: 'Cannot specify both fromUserId and fromChildId' },
        { status: 400 }
      );
    }

    // Validate theme
    const validThemes = ['cosmic', 'nature', 'super_hero', 'love'];
    if (theme && !validThemes.includes(theme)) {
      return NextResponse.json(
        { error: 'Invalid theme' },
        { status: 400 }
      );
    }

    // Verify the user has access to this family
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

    // Insert kindness card
    const { data: card, error: insertError } = await supabase
      .from('kindness_cards')
      .insert({
        family_id: familyId,
        from_user_id: fromUserId || null,
        from_child_id: fromChildId || null,
        to_child_id: toChildId,
        message: message.trim(),
        theme: theme || 'cosmic',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert kindness card error:', insertError);
      return NextResponse.json(
        { error: 'Failed to send gratitude card' },
        { status: 500 }
      );
    }

    // The trigger will auto-create badges if needed

    return NextResponse.json({
      success: true,
      card,
    });
  } catch (error: unknown) {
    console.error('Send gratitude error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
