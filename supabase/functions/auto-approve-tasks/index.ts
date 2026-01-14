// Edge Function: Auto-Approve Tasks
// Automatically approves pending task completions after 24 hours
// Runs every 15 minutes via pg_cron or Vercel Cron

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const now = new Date().toISOString()

    console.log(`Running auto-approve-tasks at ${now}`)

    // Get all pending completions past auto_approve_at time
    const { data: pendingCompletions, error: fetchError } = await supabaseClient
      .from('task_completions')
      .select('id, task_id, child_id, points_awarded')
      .eq('status', 'pending')
      .not('auto_approve_at', 'is', null)
      .lte('auto_approve_at', now)

    if (fetchError) {
      console.error('Error fetching pending completions:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch completions', details: fetchError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${pendingCompletions?.length || 0} completions ready for auto-approval`)

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const completion of pendingCompletions || []) {
      try {
        // Use the existing approve_task_completion RPC function
        const { data, error: approveError } = await supabaseClient
          .rpc('approve_task_completion', {
            p_completion_id: completion.id,
            p_approved_by: null // null = auto-approved (no specific parent)
          })

        if (approveError) {
          console.error(`Failed to approve completion ${completion.id}:`, approveError)
          results.push({
            completion_id: completion.id,
            success: false,
            error: approveError.message
          })
          errorCount++
        } else {
          console.log(`Successfully auto-approved completion ${completion.id}`)
          results.push({
            completion_id: completion.id,
            success: true
          })
          successCount++
        }
      } catch (error) {
        console.error(`Exception approving completion ${completion.id}:`, error)
        results.push({
          completion_id: completion.id,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
        errorCount++
      }
    }

    console.log(`Auto-approval complete: ${successCount} succeeded, ${errorCount} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingCompletions?.length || 0,
        approved: successCount,
        failed: errorCount,
        timestamp: now,
        results: results
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
