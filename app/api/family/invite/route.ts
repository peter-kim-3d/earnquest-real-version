import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

/**
 * POST /api/family/invite
 * Create an invitation for a co-parent to join the family
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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get user's family
    const { data: userProfile } = await supabase
      .from('users')
      .select('family_id, full_name')
      .eq('id', user.id)
      .single();

    if (!userProfile || !userProfile.family_id) {
      return NextResponse.json(
        { error: 'User profile or family not found' },
        { status: 404 }
      );
    }

    // Check if email is already a member of this family
    const { data: existingMember } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('family_id', userProfile.family_id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'This email is already a member of your family' },
        { status: 400 }
      );
    }

    // Check for pending invitation
    const { data: pendingInvite } = await supabase
      .from('family_invitations')
      .select('id')
      .eq('family_id', userProfile.family_id)
      .eq('invited_email', email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (pendingInvite) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = randomBytes(32).toString('hex');

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('family_invitations')
      .insert({
        family_id: userProfile.family_id,
        invited_by: user.id,
        invited_email: email,
        invite_token: token,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Create invitation error:', error);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Generate invite URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const inviteUrl = `${baseUrl}/en-US/invite/${token}`;

    // TODO: Send email with invite link (implement email service later)
    // For now, just return the link

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.invited_email,
        inviteUrl,
        expiresAt: invitation.expires_at,
      },
    });
  } catch (error: any) {
    console.error('Invite error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/family/invite
 * Get all pending invitations for the current user's family
 */
export async function GET() {
  try {
    const supabase = await createClient();

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

    if (!userProfile || !userProfile.family_id) {
      return NextResponse.json(
        { error: 'User profile or family not found' },
        { status: 404 }
      );
    }

    // Get all invitations for this family
    const { data: invitations, error } = await supabase
      .from('family_invitations')
      .select('id, invited_email, status, created_at, expires_at')
      .eq('family_id', userProfile.family_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get invitations error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ invitations: invitations || [] });
  } catch (error: any) {
    console.error('Get invitations error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
