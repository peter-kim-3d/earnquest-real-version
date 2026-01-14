// Edge Function: Daily Task Generator
// Creates task instances for auto-assigned tasks every day
// Runs at midnight UTC via pg_cron or Vercel Cron

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

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD
    const dayOfWeek = today.getDay() // 0=Sunday, 6=Saturday
    const dayOfMonth = today.getDate()

    console.log(`Running daily-task-generator for ${todayStr}`)
    console.log(`Day of week: ${dayOfWeek}, Day of month: ${dayOfMonth}`)

    // Get all active auto-assign tasks
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('auto_assign', true)
      .eq('is_active', true)
      .is('deleted_at', null)
      .is('archived_at', null)

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tasks', details: tasksError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${tasks?.length || 0} auto-assign tasks`)

    const instancesToCreate = []

    for (const task of tasks || []) {
      let shouldCreate = false

      // Determine if task should appear today based on frequency
      if (task.frequency === 'daily') {
        shouldCreate = true
      } else if (task.frequency === 'weekly') {
        const allowedDays = task.days_of_week || [0, 1, 2, 3, 4, 5, 6]
        shouldCreate = allowedDays.includes(dayOfWeek)
      } else if (task.frequency === 'monthly') {
        if (task.monthly_mode === 'any_day') {
          // Create on 1st of month for "any_day" mode
          shouldCreate = dayOfMonth === 1
        } else if (task.monthly_mode === 'specific_day') {
          shouldCreate = dayOfMonth === task.monthly_day
        } else if (task.monthly_mode === 'first_day') {
          shouldCreate = dayOfMonth === 1
        } else if (task.monthly_mode === 'last_day') {
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
          shouldCreate = dayOfMonth === lastDay
        }
      }

      if (!shouldCreate) {
        console.log(`Skipping task ${task.id} (${task.name}) - not scheduled for today`)
        continue
      }

      console.log(`Task ${task.id} (${task.name}) should be created today`)

      // Get children for this task
      let children = []
      if (task.child_id) {
        // Task for specific child
        const { data: child, error: childError } = await supabaseClient
          .from('children')
          .select('id, family_id')
          .eq('id', task.child_id)
          .is('deleted_at', null)
          .single()

        if (childError) {
          console.error(`Error fetching child ${task.child_id}:`, childError)
        } else if (child) {
          children = [child]
        }
      } else {
        // Task for all children in family
        const { data: familyChildren, error: childrenError } = await supabaseClient
          .from('children')
          .select('id, family_id')
          .eq('family_id', task.family_id)
          .is('deleted_at', null)

        if (childrenError) {
          console.error(`Error fetching children for family ${task.family_id}:`, childrenError)
        } else {
          children = familyChildren || []
        }
      }

      console.log(`Creating instances for ${children.length} children`)

      // Create instances for each child
      for (const child of children) {
        instancesToCreate.push({
          task_id: task.id,
          child_id: child.id,
          family_id: child.family_id,
          scheduled_date: todayStr,
          status: 'pending'
        })
      }
    }

    console.log(`Total instances to create: ${instancesToCreate.length}`)

    // Bulk insert (with ON CONFLICT DO NOTHING to handle duplicates)
    if (instancesToCreate.length > 0) {
      const { data: insertedData, error: insertError } = await supabaseClient
        .from('task_instances')
        .upsert(instancesToCreate, {
          onConflict: 'task_id,child_id,scheduled_date',
          ignoreDuplicates: true
        })
        .select()

      if (insertError) {
        console.error('Error inserting instances:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to create instances', details: insertError }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Successfully created ${insertedData?.length || 0} instances`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        instancesCreated: instancesToCreate.length,
        date: todayStr,
        tasksProcessed: tasks?.length || 0
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
