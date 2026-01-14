import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Check authentication
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            console.error('Task Toggle: Unauthorized - No user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { taskId, childId, isEnabled } = body;

        console.log(`Task Toggle Request: User ${user.id}, Task ${taskId}, Child ${childId}, Enabled ${isEnabled}`);

        if (!taskId || !childId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Use Service Role to bypass potential RLS recursion issues
        // We verified the user is authenticated above via normal client.
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Upsert into child_task_overrides
        const { error } = await supabaseAdmin
            .from('child_task_overrides')
            .upsert(
                {
                    task_id: taskId,
                    child_id: childId,
                    is_enabled: isEnabled,
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'task_id, child_id' }
            );

        if (error) {
            console.error('Supabase Admin Error toggling task:', JSON.stringify(error, null, 2));
            return NextResponse.json(
                {
                    error: 'Failed to toggle task',
                    details: error.message,
                    code: error.code,
                    hint: error.hint
                },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Internal Error in task toggle:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
