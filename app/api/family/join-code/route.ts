/**
 * Family Join Code Management API
 *
 * GET /api/family/join-code
 * Returns current family's join code (parent auth required)
 *
 * POST /api/family/join-code
 * Regenerates family's join code (parent auth required)
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { JOIN_CODE_CHARS, JOIN_CODE_LENGTH, JOIN_CODE_MAX_ATTEMPTS } from '@/lib/constants';

/**
 * GET: Retrieve current family's join code
 */
export async function GET() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's family
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.family_id) {
    return NextResponse.json({ error: 'No family found' }, { status: 404 });
  }

  // Get family join code
  const { data: family, error: familyError } = await supabase
    .from('families')
    .select('join_code')
    .eq('id', userData.family_id)
    .single();

  if (familyError || !family) {
    return NextResponse.json({ error: 'Family not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    joinCode: family.join_code,
  });
}

/**
 * POST: Regenerate family's join code
 */
export async function POST() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's family
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.family_id) {
    return NextResponse.json({ error: 'No family found' }, { status: 404 });
  }

  // Generate new unique code
  // Using uppercase alphanumeric excluding confusing characters (I, O, L, 0, 1)
  let newCode: string;
  let attempts = 0;

  while (attempts < JOIN_CODE_MAX_ATTEMPTS) {
    // Generate random code
    newCode = Array.from({ length: JOIN_CODE_LENGTH }, () =>
      JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)]
    ).join('');

    // Check if code already exists
    const { data: existing } = await supabase
      .from('families')
      .select('id')
      .eq('join_code', newCode)
      .single();

    if (!existing) {
      // Unique code found, update family
      const { error: updateError } = await supabase
        .from('families')
        .update({ join_code: newCode })
        .eq('id', userData.family_id);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update code' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        joinCode: newCode,
      });
    }

    attempts++;
  }

  // Failed to generate unique code after max attempts
  return NextResponse.json(
    { error: 'Failed to generate unique code. Please try again.' },
    { status: 500 }
  );
}
