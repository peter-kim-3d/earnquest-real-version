import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getErrorMessage } from '@/lib/api/error-handler';

/**
 * POST /api/cron/auto-refunds
 *
 * Processes expired approval requests and auto-refunds points.
 * Called by Vercel Cron every hour.
 *
 * Security: Requires CRON_SECRET header to prevent unauthorized access.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret in production
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization');
      const cronSecret = process.env.CRON_SECRET;

      if (!cronSecret) {
        console.error('CRON_SECRET not configured');
        return NextResponse.json(
          { error: 'Server configuration error' },
          { status: 500 }
        );
      }

      if (authHeader !== `Bearer ${cronSecret}`) {
        console.warn('Unauthorized cron request attempted');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Use service role for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Call the process_expired_approvals function
    const { data, error } = await supabase.rpc('process_expired_approvals');

    if (error) {
      console.error('Error processing auto-refunds:', error);
      return NextResponse.json(
        { error: 'Failed to process auto-refunds', details: error.message },
        { status: 500 }
      );
    }

    const refundCount = data as number;

    console.log(`Auto-refund cron completed: ${refundCount} refunds processed`);

    return NextResponse.json({
      success: true,
      refundsProcessed: refundCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Auto-refund cron error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing in development
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'GET method not allowed in production' },
      { status: 405 }
    );
  }

  // In development, redirect to POST handler
  return POST(request);
}
