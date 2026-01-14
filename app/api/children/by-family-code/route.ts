/**
 * Get Children by Family Code API
 *
 * POST /api/children/by-family-code
 * Returns list of children for a validated family code
 *
 * Rate limited: Shares bucket with validate-code (5 attempts per 15 minutes per IP)
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ChildrenByFamilyCodeSchema } from '@/lib/validation/family';
import { checkRateLimit } from '@/lib/security/rate-limiter';

export async function POST(request: NextRequest) {
  // Extract client IP for rate limiting
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Check rate limit (5 attempts per 15 minutes)
  const rateLimit = checkRateLimit(ip, 5, 15 * 60 * 1000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'TOO_MANY_ATTEMPTS',
        message: `Too many attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': rateLimit.retryAfterSeconds!.toString(),
        },
      }
    );
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'INVALID_JSON', message: 'Invalid request body' },
      { status: 400 }
    );
  }

  const validation = ChildrenByFamilyCodeSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'INVALID_FORMAT',
        message: 'Invalid code format',
        details: validation.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { familyCode } = validation.data;

  // Verify family code exists
  const supabase = await createClient();
  const { data: family, error: familyError } = await supabase
    .from('families')
    .select('id, name')
    .eq('join_code', familyCode)
    .single();

  if (familyError || !family) {
    return NextResponse.json(
      {
        error: 'INVALID_CODE',
        message: 'Family code not found',
      },
      { status: 404 }
    );
  }

  // Get children for this family
  const { data: children, error: childrenError } = await supabase
    .from('children')
    .select('id, name, age_group, avatar_url')
    .eq('family_id', family.id)
    .order('created_at');

  if (childrenError) {
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Failed to retrieve children',
      },
      { status: 500 }
    );
  }

  // Return success with family and children data
  return NextResponse.json({
    success: true,
    familyName: family.name,
    children: children || [],
  });
}
