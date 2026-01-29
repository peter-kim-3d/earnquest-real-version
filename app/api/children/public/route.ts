import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getErrorMessage } from '@/lib/api/error-handler';

/**
 * Public endpoint to get all children profiles (without sensitive data)
 * Used for child login page to show child selection
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get all children (only basic info, no PIN codes)
    const { data: children, error } = await supabase
      .from('children')
      .select('id, name, age_group, avatar_url')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Get children error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch children' },
        { status: 500 }
      );
    }

    return NextResponse.json({ children: children || [] });
  } catch (error: unknown) {
    console.error('Get children error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
