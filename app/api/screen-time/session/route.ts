import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/screen-time/session
 * Start or end a screen time session
 */
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
    const { childId, action, sessionId, minutesUsed } = body;

    if (!childId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: childId, action' },
        { status: 400 }
      );
    }

    if (!['start', 'end'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "start" or "end"' },
        { status: 400 }
      );
    }

    // Get user's family
    const { data: userProfile } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userProfile?.family_id) {
      return NextResponse.json({ error: 'No family found' }, { status: 404 });
    }

    // Verify child belongs to this family
    const { data: child } = await supabase
      .from('children')
      .select('id, family_id')
      .eq('id', childId)
      .eq('family_id', userProfile.family_id)
      .single();

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found in your family' },
        { status: 404 }
      );
    }

    if (action === 'start') {
      // Start a new session
      const { data: result, error } = await supabase.rpc(
        'start_screen_time_session',
        {
          p_child_id: childId,
          p_family_id: userProfile.family_id,
        }
      );

      if (error) {
        console.error('Error starting screen session:', error);
        return NextResponse.json(
          { error: 'Failed to start screen time session' },
          { status: 500 }
        );
      }

      const sessionResult = result as {
        success: boolean;
        error?: string;
        session_id?: string;
        remaining_today?: number;
        remaining_week?: number;
      };

      if (!sessionResult.success) {
        return NextResponse.json(
          { error: sessionResult.error || 'Cannot start session' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        sessionId: sessionResult.session_id,
        remainingToday: sessionResult.remaining_today,
        remainingWeek: sessionResult.remaining_week,
      });
    } else {
      // End an existing session
      if (!sessionId) {
        return NextResponse.json(
          { error: 'sessionId is required to end a session' },
          { status: 400 }
        );
      }

      const { data: result, error } = await supabase.rpc(
        'end_screen_time_session',
        {
          p_session_id: sessionId,
          p_minutes_used: minutesUsed || 0,
        }
      );

      if (error) {
        console.error('Error ending screen session:', error);
        return NextResponse.json(
          { error: 'Failed to end screen time session' },
          { status: 500 }
        );
      }

      const sessionResult = result as {
        success: boolean;
        error?: string;
        total_used_today?: number;
        remaining_week?: number;
      };

      if (!sessionResult.success) {
        return NextResponse.json(
          { error: sessionResult.error || 'Cannot end session' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        totalUsedToday: sessionResult.total_used_today,
        remainingWeek: sessionResult.remaining_week,
      });
    }
  } catch (error) {
    console.error('Screen time session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/screen-time/session
 * Get active session for a child
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json(
        { error: 'Missing childId parameter' },
        { status: 400 }
      );
    }

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's family
    const { data: userProfile } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userProfile?.family_id) {
      return NextResponse.json({ error: 'No family found' }, { status: 404 });
    }

    // Verify child belongs to this family
    const { data: child } = await supabase
      .from('children')
      .select('id, family_id')
      .eq('id', childId)
      .eq('family_id', userProfile.family_id)
      .single();

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found in your family' },
        { status: 404 }
      );
    }

    // Get active session
    const { data: session, error } = await supabase
      .from('screen_time_sessions')
      .select('*')
      .eq('child_id', childId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error getting active session:', error);
      return NextResponse.json(
        { error: 'Failed to get active session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Screen time session GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
