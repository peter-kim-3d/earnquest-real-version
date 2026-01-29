import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  requireAuth,
  isAuthError,
  success,
  errors,
  isValidPin,
  validateRequired,
} from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check with family ID
    const auth = await requireAuth(supabase);
    if (isAuthError(auth)) return auth.response;
    const { familyId } = auth;

    const body = await request.json();
    const { name, ageGroup, familyId: requestFamilyId, pinCode, birthdate } = body;

    // Validate required fields
    const missing = validateRequired(body, ['name', 'ageGroup', 'familyId']);
    if (missing.length > 0) {
      return errors.missingFields(missing);
    }

    // Validate PIN format if provided
    if (pinCode && !isValidPin(pinCode)) {
      return errors.badRequest('PIN must be exactly 4 digits');
    }

    // Verify family access
    if (familyId !== requestFamilyId) {
      return errors.forbidden();
    }

    // Create child
    const { data: child, error } = await supabase
      .from('children')
      .insert({
        family_id: familyId,
        name,
        age_group: ageGroup,
        points_balance: 0,
        ...(pinCode && { pin_code: pinCode }),
        ...(birthdate && { birthdate }),
      })
      .select()
      .single();

    if (error) {
      console.error('Create child error:', error);
      return errors.internalError('Failed to create child');
    }

    return success({ child }, 'Child created successfully');
  } catch (error: unknown) {
    console.error('Create child error:', error);
    return errors.internalError();
  }
}
