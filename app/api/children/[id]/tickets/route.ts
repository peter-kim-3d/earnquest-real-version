import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch all tickets for the child with reward details
    const { data: tickets, error } = await supabase
      .from('reward_purchases')
      .select(
        `
        *,
        reward:rewards (
          id,
          name,
          description,
          category,
          icon,
          image_url,
          screen_minutes
        )
      `
      )
      .eq('child_id', id)
      .in('status', ['active', 'use_requested', 'used'])
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('Fetch tickets error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch tickets' },
        { status: 500 }
      );
    }

    // Group tickets by status
    const grouped = {
      active: tickets?.filter((t) => t.status === 'active') || [],
      use_requested: tickets?.filter((t) => t.status === 'use_requested') || [],
      used: tickets?.filter((t) => t.status === 'used') || [],
    };

    return NextResponse.json(grouped);
  } catch (error: any) {
    console.error('Fetch tickets error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
