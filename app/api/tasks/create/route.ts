/**
 * POST /api/tasks/create
 *
 * Creates a new task with Task System v2 fields
 * Uses Supabase Admin Client to bypass RLS for family_id lookup
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { CreateTaskSchema, formatZodError } from '@/lib/validation/task';

export const dynamic = 'force-dynamic';

/**
 * Initialize Supabase Admin Client
 * Returns null if environment variables are missing
 */
function initializeAdminClient() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      console.error('Create Task: Missing environment variables', {
        hasUrl: !!url,
        hasKey: !!key,
      });
      return null;
    }

    const adminClient = createAdminClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    return adminClient;
  } catch (error: any) {
    console.error('Create Task: Admin client initialization error', {
      error: error.message,
      stack: error.stack,
    });
    return null;
  }
}

export async function POST(request: Request) {
  console.log('=== Create Task: START ===');

  try {
    // =========================================================================
    // STEP 1: Authentication Check
    // =========================================================================
    console.log('Create Task: Step 1 - Authentication');

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('Create Task: Authentication failed', {
        error: authError?.message,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: authError?.message || 'You must be logged in to create tasks',
        },
        { status: 401 }
      );
    }

    console.log('Create Task: User authenticated', { userId: user.id });

    // =========================================================================
    // STEP 2: Parse Request Body
    // =========================================================================
    console.log('Create Task: Step 2 - Parsing request body');

    let body: unknown;
    try {
      body = await request.json();
      console.log('Create Task: Body parsed successfully');
    } catch (parseError: any) {
      console.error('Create Task: JSON parsing failed', {
        error: parseError.message,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Request',
          message: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }

    // =========================================================================
    // STEP 3: Validate Request Body with Zod
    // =========================================================================
    console.log('Create Task: Step 3 - Validation');

    let validatedData: unknown;
    try {
      const validationResult = CreateTaskSchema.safeParse(body);

      if (!validationResult.success) {
        const formattedError = formatZodError(validationResult.error);
        console.warn('Create Task: Validation failed', {
          message: formattedError.message,
          fields: formattedError.fields,
        });
        return NextResponse.json(
          {
            success: false,
            error: 'Validation Error',
            message: formattedError.message,
            fields: formattedError.fields,
          },
          { status: 400 }
        );
      }

      validatedData = validationResult.data;
      console.log('Create Task: Validation successful', {
        name: validationResult.data.name,
        category: validationResult.data.category,
        approvalType: validationResult.data.approval_type,
      });
    } catch (validationError: any) {
      console.error('Create Task: Validation threw exception', {
        error: validationError.message,
        stack: validationError.stack,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'An unexpected error occurred during validation',
          details: validationError.message,
        },
        { status: 500 }
      );
    }

    // Type assertion after successful validation
    const taskData = validatedData as {
      name: string;
      description?: string;
      category: 'learning' | 'household' | 'health';
      time_context?: 'morning' | 'after_school' | 'evening' | 'anytime';
      points: number;
      frequency: 'daily' | 'weekly' | 'monthly' | 'one_time';
      approval_type: 'parent' | 'auto' | 'timer' | 'checklist';
      timer_minutes?: number;
      checklist?: string[];
      photo_required: boolean;
      metadata: Record<string, any>;
      auto_assign: boolean;
      days_of_week?: number[];
      monthly_mode?: 'any_day' | 'specific_day' | 'first_day' | 'last_day';
      monthly_day?: number;
      child_id?: string | null;
      icon?: string;
      image_url?: string | null;
      is_active: boolean;
      excluded_child_ids?: string[];
    };

    // =========================================================================
    // STEP 4: Initialize Admin Client
    // =========================================================================
    console.log('Create Task: Step 4 - Initializing admin client');

    const supabaseAdmin = initializeAdminClient();
    if (!supabaseAdmin) {
      console.error('Create Task: Admin client initialization failed');
      return NextResponse.json(
        {
          success: false,
          error: 'Server Configuration Error',
          message: 'Database admin client could not be initialized',
        },
        { status: 500 }
      );
    }

    console.log('Create Task: Admin client initialized');

    // =========================================================================
    // STEP 5: Fetch User Profile (family_id)
    // =========================================================================
    console.log('Create Task: Step 5 - Fetching user profile');

    let userProfile: { family_id: string } | null = null;
    try {
      const { data, error: profileError } = await supabaseAdmin
        .from('users')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Create Task: Profile query error', {
          error: profileError.message,
          code: profileError.code,
        });
        return NextResponse.json(
          {
            success: false,
            error: 'User Profile Error',
            message: 'Could not fetch user profile',
            details: profileError.message,
          },
          { status: 404 }
        );
      }

      if (!data || !data.family_id) {
        console.error('Create Task: No family_id found', { data });
        return NextResponse.json(
          {
            success: false,
            error: 'User Profile Error',
            message: 'User is not associated with a family',
          },
          { status: 400 }
        );
      }

      userProfile = data;
      console.log('Create Task: Profile fetched', { familyId: data.family_id });
    } catch (profileException: any) {
      console.error('Create Task: Profile fetch threw exception', {
        error: profileException.message,
        stack: profileException.stack,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Database Error',
          message: 'An error occurred while fetching user profile',
          details: profileException.message,
        },
        { status: 500 }
      );
    }

    // =========================================================================
    // STEP 6: Insert Task into Database
    // =========================================================================
    console.log('Create Task: Step 6 - Inserting task');

    try {
      const { data: task, error: insertError } = await supabaseAdmin
        .from('tasks')
        .insert({
          // Required fields
          family_id: userProfile.family_id,
          name: taskData.name,
          category: taskData.category,
          points: taskData.points,
          frequency: taskData.frequency,
          approval_type: taskData.approval_type,

          // Optional fields
          description: taskData.description || null,
          child_id: taskData.child_id || null,
          time_context: taskData.time_context || null,

          // Task v2 specific fields
          timer_minutes: taskData.timer_minutes || null,
          checklist: taskData.checklist || null,
          photo_required: taskData.photo_required,
          metadata: taskData.metadata,

          // Scheduling fields
          auto_assign: taskData.auto_assign,
          days_of_week: taskData.days_of_week || null,
          monthly_mode: taskData.monthly_mode || null,
          monthly_day: taskData.monthly_day || null,

          // Other fields
          icon: taskData.icon || 'star',
          image_url: taskData.image_url || null,
          is_active: taskData.is_active,

          // Note: created_by column does NOT exist in the tasks table
          // The created_at timestamp is automatically set by the database
        })
        .select()
        .single();

      if (insertError) {
        console.error('Create Task: Insert error', {
          error: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
        });
        return NextResponse.json(
          {
            success: false,
            error: 'Database Error',
            message: 'Failed to create task',
            details: insertError.message,
          },
          { status: 500 }
        );
      }

      if (!task) {
        console.error('Create Task: No task returned after insert');
        return NextResponse.json(
          {
            success: false,
            error: 'Database Error',
            message: 'Task was not created (no data returned)',
          },
          { status: 500 }
        );
      }

      console.log('Create Task: Success!', {
        taskId: task.id,
        taskName: task.name,
      });

      // =========================================================================
      // STEP 7: Handle Child Exclusions (if any)
      // =========================================================================
      if (taskData.excluded_child_ids !== undefined) {
        console.log('Create Task: Step 7 - Handling child exclusions', {
          excludedCount: taskData.excluded_child_ids.length,
          excludedIds: taskData.excluded_child_ids,
        });

        if (taskData.excluded_child_ids.length > 0) {
          console.log('Create Task: Creating overrides');
          try {
            const overrides = taskData.excluded_child_ids.map((childId) => ({
              task_id: task.id,
              child_id: childId,
              is_enabled: false,
            }));

            const { error: overrideError } = await supabaseAdmin
              .from('child_task_overrides')
              .insert(overrides);

            if (overrideError) {
              console.error('Create Task: Override insert error (non-fatal)', {
                error: overrideError.message,
                code: overrideError.code,
              });
              // Don't fail the request, task was created successfully
              // The overrides are a secondary operation
            } else {
              console.log('Create Task: Overrides created successfully');
            }
          } catch (overrideException: any) {
            console.error('Create Task: Override exception (non-fatal)', {
              error: overrideException.message,
            });
            // Don't fail the request
          }
        } else {
          console.log('Create Task: No overrides needed (all children selected)');
        }
      }

      return NextResponse.json(
        {
          success: true,
          task,
          message: 'Task created successfully!',
        },
        { status: 201 }
      );
    } catch (insertException: any) {
      console.error('Create Task: Insert threw exception', {
        error: insertException.message,
        stack: insertException.stack,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Database Error',
          message: 'An error occurred while creating the task',
          details: insertException.message,
        },
        { status: 500 }
      );
    }
  } catch (topLevelError: any) {
    // =========================================================================
    // TOP-LEVEL ERROR HANDLER
    // This should catch any unexpected errors not caught by inner try/catch
    // =========================================================================
    console.error('Create Task: TOP LEVEL ERROR', {
      error: topLevelError.message,
      stack: topLevelError.stack,
      name: topLevelError.name,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        details: topLevelError.message,
      },
      { status: 500 }
    );
  } finally {
    console.log('=== Create Task: END ===');
  }
}
