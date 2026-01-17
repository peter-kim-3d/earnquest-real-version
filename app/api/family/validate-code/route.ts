/**
 * Validate Family Code API
 *
 * POST /api/family/validate-code
 * Validates a 6-character family join code and returns basic family info
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ValidateFamilyCodeSchema } from '@/lib/validation/family';

export async function POST(request: NextRequest) {
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

  const validation = ValidateFamilyCodeSchema.safeParse(body);

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

  const { code } = validation.data;

  // Look up family by join code
  const supabase = await createClient();
  const { data: family, error: familyError } = await supabase
    .from('families')
    .select('id, name')
    .eq('join_code', code)
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

  // Get child count for this family
  const { count, error: countError } = await supabase
    .from('children')
    .select('id', { count: 'exact', head: true })
    .eq('family_id', family.id);

  if (countError) {
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Failed to retrieve family information',
      },
      { status: 500 }
    );
  }

  // Return success with family info
  return NextResponse.json({
    success: true,
    family: {
      id: family.id,
      name: family.name,
      childCount: count || 0,
    },
  });
}
