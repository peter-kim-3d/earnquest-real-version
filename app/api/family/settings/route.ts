import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface FamilySettings {
  timezone?: string;
  language?: string;
  autoApprovalHours?: number;
  screenBudgetWeeklyMinutes?: number;
  requireChildPin?: boolean;
}

// GET - Get family settings
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's family
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.family_id) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      );
    }

    // Get family settings
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('settings')
      .eq('id', userProfile.family_id)
      .single();

    if (familyError) {
      console.error('Error fetching family settings:', familyError);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    // Return settings with defaults
    const settings: FamilySettings = {
      timezone: 'America/New_York',
      language: 'en-US',
      autoApprovalHours: 24,
      screenBudgetWeeklyMinutes: 300,
      requireChildPin: true,
      ...family?.settings,
    };

    return NextResponse.json({ settings });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error getting family settings:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PATCH - Update family settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's family
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.family_id) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const updates: Partial<FamilySettings> = {};

    // Validate and extract allowed settings
    if (typeof body.requireChildPin === 'boolean') {
      updates.requireChildPin = body.requireChildPin;
    }
    if (typeof body.timezone === 'string') {
      updates.timezone = body.timezone;
    }
    if (typeof body.language === 'string') {
      updates.language = body.language;
    }
    if (typeof body.autoApprovalHours === 'number') {
      updates.autoApprovalHours = body.autoApprovalHours;
    }
    if (typeof body.screenBudgetWeeklyMinutes === 'number') {
      updates.screenBudgetWeeklyMinutes = body.screenBudgetWeeklyMinutes;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid settings to update' },
        { status: 400 }
      );
    }

    // Get current settings
    const { data: currentFamily } = await supabase
      .from('families')
      .select('settings')
      .eq('id', userProfile.family_id)
      .single();

    // Merge updates with current settings
    const newSettings = {
      ...currentFamily?.settings,
      ...updates,
    };

    // Update family settings
    const { error: updateError } = await supabase
      .from('families')
      .update({ settings: newSettings })
      .eq('id', userProfile.family_id);

    if (updateError) {
      console.error('Error updating family settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: newSettings,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error updating family settings:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
