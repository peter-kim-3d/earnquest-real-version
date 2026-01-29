import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api/error-handler';

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
      .in('status', ['active', 'use_requested', 'in_use', 'used'])
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('Fetch tickets error:', error);
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }

    // Group tickets by status
    const grouped = {
      active: tickets?.filter((t) => t.status === 'active') || [],
      use_requested: tickets?.filter((t) => t.status === 'use_requested') || [],
      in_use: tickets?.filter((t) => t.status === 'in_use') || [],
      used: tickets?.filter((t) => t.status === 'used') || [],
    };

    return NextResponse.json(grouped);
  } catch (error: unknown) {
    console.error('Fetch tickets error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
