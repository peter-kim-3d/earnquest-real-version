import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getErrorMessage } from '@/lib/api/error-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this family
    const { data: userProfile } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get child and verify it belongs to user's family
    const { data: child, error } = await supabase
      .from('children')
      .select('*')
      .eq('id', id)
      .eq('family_id', userProfile.family_id)
      .single();

    if (error || !child) {
      console.error('Get child error:', error);
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ child });
  } catch (error: unknown) {
    console.error('Get child error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
