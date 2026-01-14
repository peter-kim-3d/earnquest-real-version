import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { childId } = await request.json();

        if (!childId) {
            return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
        }

        // 1. Verify Parent Auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Verify Child belongs to Parent's Family
        // First get parent's family_id
        const { data: parentProfile } = await supabase
            .from('users')
            .select('family_id')
            .eq('id', user.id)
            .single() as { data: { family_id: string } | null };

        if (!parentProfile?.family_id) {
            return NextResponse.json({ error: 'Family not found' }, { status: 404 });
        }

        // Check if child exists in this family
        const { data: child } = await supabase
            .from('children')
            .select('id')
            .eq('id', childId)
            .eq('family_id', parentProfile.family_id)
            .single() as { data: { id: string } | null };

        if (!child) {
            return NextResponse.json({ error: 'Child not found or unauthorized' }, { status: 403 });
        }

        // 3. Set Child Session Cookie
        const cookieStore = await cookies();

        // Calculate expiration (e.g., 24 hours) - matches login duration
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        cookieStore.set('child_session', JSON.stringify({
            childId: child.id,
            familyId: parentProfile.family_id
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            expires
        });

        // 4. Set Impersonation Flag (consumed by ChildNav/Layout)
        cookieStore.set('parent_view', 'true', {
            httpOnly: false, // Allow client JS to read if needed, though we verify via Supabase session usually
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            expires
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Impersonation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
