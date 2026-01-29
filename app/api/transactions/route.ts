import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getErrorMessage } from '@/lib/api/error-handler';

/**
 * GET /api/transactions
 * Get point transactions for a child or family
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

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

    if (!userProfile?.family_id) {
      return NextResponse.json({ error: 'No family found' }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from('point_transactions')
      .select(`
        *,
        children:child_id (
          id,
          name
        )
      `)
      .eq('family_id', userProfile.family_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (childId) {
      // Verify child belongs to family
      const { data: child } = await supabase
        .from('children')
        .select('id')
        .eq('id', childId)
        .eq('family_id', userProfile.family_id)
        .single();

      if (!child) {
        return NextResponse.json(
          { error: 'Child not found in your family' },
          { status: 404 }
        );
      }

      query = query.eq('child_id', childId);
    }

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transactions,
      total: count,
      limit,
      offset,
    });
  } catch (error: unknown) {
    console.error('Transactions GET error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
