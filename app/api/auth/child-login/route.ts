import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { childId, pinCode } = body;

    if (!childId) {
      return NextResponse.json(
        { error: 'Child ID is required' },
        { status: 400 }
      );
    }

    // Get child with PIN
    const { data: childData, error } = await supabase
      .from('children')
      .select('id, name, age_group, family_id, pin_code')
      .eq('id', childId)
      .is('deleted_at', null)
      .single();

    const child = childData as {
      id: string;
      name: string;
      age_group: string;
      family_id: string;
      pin_code: string | null;
    } | null;

    if (error || !child) {
      console.error('Get child error:', error);
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    // Verify PIN
    // If child has a PIN set, require it.
    // If no PIN is set (legacy), allow login or enforce setting one?
    // For now, if PIN is set in DB, check it. If not set, allow (or require empty?).
    // Implementation plan says "Require PIN entry". So we expect a matched PIN.
    const storedPin = child.pin_code || '0000'; // Default to 0000 if not set
    const providedPin = pinCode || '';

    if (storedPin !== providedPin) {
      return NextResponse.json(
        { error: 'Invalid PIN code' },
        { status: 401 }
      );
    }

    // Create session by setting cookie
    const cookieStore = await cookies();
    cookieStore.set('child_session', JSON.stringify({
      childId: child.id,
      familyId: child.family_id,
      name: child.name,
      ageGroup: child.age_group,
      loginAt: new Date().toISOString(),
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      child: {
        id: child.id,
        name: child.name,
        ageGroup: child.age_group,
      },
    });
  } catch (error: any) {
    console.error('Child login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
