import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

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

    // Generate unique token
    const token = randomBytes(32).toString('hex');

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation using admin client to bypass RLS
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const insertData = {
      family_id: userProfile.family_id,
      invited_by: user.id,
      invited_email: null, // Email not required - anyone with link can join
      invite_token: token,
      expires_at: expiresAt.toISOString(),
      status: 'pending',
    };

    const { data: invitation, error } = await adminClient
      .from('family_invitations')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Create invitation error:', error);
      return NextResponse.json(
        { error: 'Failed to create invitation', details: error.message },
        { status: 500 }
      );
    }

    // Generate invite URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en-US';
    const inviteUrl = `${baseUrl}/${locale}/invite/${token}`;

    // TODO: Send email with invite link (implement email service later)
    // For now, just return the link

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
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
