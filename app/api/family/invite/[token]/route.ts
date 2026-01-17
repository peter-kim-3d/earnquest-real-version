import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/family/invite/[token]
 * Get invitation details by token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    // Get invitation using admin client to bypass RLS for public invite links
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: invitation, error } = await adminClient
      .from('family_invitations')
      .select(`
        id,
        invited_email,
        status,
        expires_at,
        family_id,
        families (
          id,
          name
        ),
        invited_by_user:users!family_invitations_invited_by_fkey (
          full_name
        )
      `)
      .eq('invite_token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (now > expiresAt) {
      // Mark as expired
      await adminClient
        .from('family_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    // Check if already accepted
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'Invitation has already been accepted' },
        { status: 410 }
      );
    }

    // Check if cancelled
    if (invitation.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Invitation has been cancelled' },
        { status: 410 }
      );
    }

    const family = (invitation.families as unknown) as { id: string; name: string } | null;
    const invitedByUser = (invitation.invited_by_user as unknown) as { full_name: string } | null;

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.invited_email,
        familyName: family?.name || 'Family',
        invitedBy: invitedByUser?.full_name || 'A family member',
        expiresAt: invitation.expires_at,
      },
    });
  } catch (error: any) {
    console.error('Get invitation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/family/invite/[token]/accept
 * Accept an invitation and join the family
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get invitation
    const { data: invitation, error: inviteError } = await adminClient
      .from('family_invitations')
      .select('*')
      .eq('invite_token', token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (now > expiresAt) {
      await adminClient
        .from('family_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    // Check if already accepted
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation is no longer valid' },
        { status: 410 }
      );
    }

    // Verify email matches
    if (user.email?.toLowerCase() !== invitation.invited_email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      );
    }

    // Check if user already belongs to a family
    const { data: userProfile } = await adminClient
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (userProfile?.family_id) {
      // Check if their current family has any children
      const { count: childrenCount } = await adminClient
        .from('children')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', userProfile.family_id);

      if (childrenCount && childrenCount > 0) {
        // Has children - cannot switch families
        return NextResponse.json(
          { error: 'You already belong to a family with children. Please contact support to switch families.' },
          { status: 400 }
        );
      }

      // No children - delete the empty family before joining new one
      const oldFamilyId = userProfile.family_id;

      // Delete any tasks/rewards in the old family
      await adminClient.from('tasks').delete().eq('family_id', oldFamilyId);
      await adminClient.from('rewards').delete().eq('family_id', oldFamilyId);
      await adminClient.from('goals').delete().eq('family_id', oldFamilyId);
      await adminClient.from('family_values').delete().eq('family_id', oldFamilyId);
      await adminClient.from('family_invitations').delete().eq('family_id', oldFamilyId);

      // Delete the empty family
      await adminClient.from('families').delete().eq('id', oldFamilyId);
    }

    // Update user's family_id
    const { error: updateError } = await adminClient
      .from('users')
      .update({ family_id: invitation.family_id })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update user family error:', updateError);
      return NextResponse.json(
        { error: 'Failed to join family' },
        { status: 500 }
      );
    }

    // Mark invitation as accepted
    await adminClient
      .from('family_invitations')
      .update({
        status: 'accepted',
        accepted_by: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the family!',
    });
  } catch (error: any) {
    console.error('Accept invitation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
