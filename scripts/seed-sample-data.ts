/**
 * Seed Sample Data Script
 * Run with: npx tsx scripts/seed-sample-data.ts
 *
 * This script adds sample tasks and rewards to the database for testing.
 * It uses the first family found in the database.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample Tasks Data
const sampleTasks = [
  // Hygiene (5 tasks)
  {
    name: 'Brush Teeth (Morning)',
    description: 'Brush your teeth for 2 minutes after breakfast',
    category: 'hygiene',
    points: 30,
    frequency: 'daily',
    approval_type: 'auto',
    icon: 'tooth',
  },
  {
    name: 'Brush Teeth (Night)',
    description: 'Brush your teeth before bed',
    category: 'hygiene',
    points: 30,
    frequency: 'daily',
    approval_type: 'auto',
    icon: 'tooth',
  },
  {
    name: 'Take a Shower',
    description: 'Take a proper shower and wash your hair',
    category: 'hygiene',
    points: 50,
    frequency: 'daily',
    approval_type: 'manual',
    icon: 'shower',
  },
  {
    name: 'Wash Hands Before Meals',
    description: 'Wash your hands with soap before eating',
    category: 'hygiene',
    points: 20,
    frequency: 'daily',
    approval_type: 'auto',
    icon: 'wash',
  },
  {
    name: 'Clean Your Room',
    description: 'Organize and tidy up your bedroom',
    category: 'hygiene',
    points: 100,
    frequency: 'weekly',
    approval_type: 'manual',
    icon: 'cleaning',
  },

  // Chores (6 tasks)
  {
    name: 'Make Your Bed',
    description: 'Make your bed neatly every morning',
    category: 'chores',
    points: 40,
    frequency: 'daily',
    approval_type: 'manual',
    icon: 'bed',
  },
  {
    name: 'Do the Dishes',
    description: 'Wash and dry all the dishes after dinner',
    category: 'chores',
    points: 80,
    frequency: 'daily',
    approval_type: 'manual',
    icon: 'kitchen',
  },
  {
    name: 'Take Out the Trash',
    description: 'Take the garbage bins out to the curb',
    category: 'chores',
    points: 60,
    frequency: 'weekly',
    approval_type: 'manual',
    icon: 'delete',
  },
  {
    name: 'Feed the Pet',
    description: 'Give food and water to your pet',
    category: 'chores',
    points: 40,
    frequency: 'daily',
    approval_type: 'manual',
    icon: 'pets',
  },
  {
    name: 'Set the Table',
    description: 'Set the table for dinner with plates and utensils',
    category: 'chores',
    points: 30,
    frequency: 'daily',
    approval_type: 'manual',
    icon: 'restaurant',
  },
  {
    name: 'Water the Plants',
    description: 'Water all the indoor plants',
    category: 'chores',
    points: 50,
    frequency: 'weekly',
    approval_type: 'manual',
    icon: 'local_florist',
  },

  // Learning (5 tasks)
  {
    name: 'Complete Homework',
    description: 'Finish all homework assignments before dinner',
    category: 'learning',
    points: 100,
    frequency: 'daily',
    approval_type: 'manual',
    icon: 'school',
  },
  {
    name: 'Read for 30 Minutes',
    description: 'Read a book or educational material',
    category: 'learning',
    points: 80,
    frequency: 'daily',
    approval_type: 'manual',
    icon: 'book',
  },
  {
    name: 'Practice Math Problems',
    description: 'Complete 10 math practice problems',
    category: 'learning',
    points: 70,
    frequency: 'daily',
    approval_type: 'manual',
    icon: 'calculate',
  },
  {
    name: 'Learn New Vocabulary',
    description: 'Learn 5 new words and their meanings',
    category: 'learning',
    points: 60,
    frequency: 'weekly',
    approval_type: 'manual',
    icon: 'translate',
  },
  {
    name: 'Watch Educational Video',
    description: 'Watch and summarize an educational video',
    category: 'learning',
    points: 50,
    frequency: 'weekly',
    approval_type: 'manual',
    icon: 'smart_display',
  },

  // Other/Exercise (4 tasks) - using 'other' category
  {
    name: 'Morning Exercise',
    description: 'Do 15 minutes of exercise in the morning',
    category: 'other',
    points: 70,
    frequency: 'daily',
    approval_type: 'manual',
    icon: 'fitness_center',
  },
  {
    name: 'Go for a Walk',
    description: 'Walk outside for at least 20 minutes',
    category: 'other',
    points: 60,
    frequency: 'daily',
    approval_type: 'manual',
    icon: 'directions_walk',
  },
  {
    name: 'Play Sports',
    description: 'Play soccer, basketball, or other sports for 30 min',
    category: 'other',
    points: 90,
    frequency: 'weekly',
    approval_type: 'manual',
    icon: 'sports_soccer',
  },
  {
    name: 'Bike Ride',
    description: 'Go for a bike ride around the neighborhood',
    category: 'other',
    points: 80,
    frequency: 'weekly',
    approval_type: 'manual',
    icon: 'directions_bike',
  },

  // Creativity (3 tasks) - using 'other' category
  {
    name: 'Draw or Paint',
    description: 'Create an artwork for at least 20 minutes',
    category: 'other',
    points: 60,
    frequency: 'weekly',
    approval_type: 'manual',
    icon: 'palette',
  },
  {
    name: 'Play Musical Instrument',
    description: 'Practice your instrument for 30 minutes',
    category: 'other',
    points: 80,
    frequency: 'weekly',
    approval_type: 'manual',
    icon: 'piano',
  },
  {
    name: 'Build Something',
    description: 'Build with LEGO, crafts, or other creative materials',
    category: 'other',
    points: 70,
    frequency: 'weekly',
    approval_type: 'manual',
    icon: 'construction',
  },
];

// Sample Rewards Data
const sampleRewards = [
  // Screen Time (6 rewards)
  {
    name: '15 Minutes TV Time',
    description: 'Watch your favorite show for 15 minutes',
    category: 'screen',
    points_cost: 50,
    screen_minutes: 15,
    weekly_limit: 5,
    icon: 'tv',
  },
  {
    name: '30 Minutes Gaming',
    description: 'Play video games for 30 minutes',
    category: 'screen',
    points_cost: 100,
    screen_minutes: 30,
    weekly_limit: 4,
    icon: 'sports_esports',
  },
  {
    name: '1 Hour Movie Night',
    description: 'Watch a movie of your choice',
    category: 'screen',
    points_cost: 200,
    screen_minutes: 60,
    weekly_limit: 2,
    icon: 'movie',
  },
  {
    name: '20 Minutes YouTube',
    description: 'Watch YouTube videos you like',
    category: 'screen',
    points_cost: 60,
    screen_minutes: 20,
    weekly_limit: 5,
    icon: 'play_circle',
  },
  {
    name: '45 Minutes Tablet Time',
    description: 'Use tablet for games or apps',
    category: 'screen',
    points_cost: 150,
    screen_minutes: 45,
    weekly_limit: 3,
    icon: 'tablet',
  },
  {
    name: 'Weekend Gaming Session',
    description: '2 hours of gaming on the weekend',
    category: 'screen',
    points_cost: 400,
    screen_minutes: 120,
    weekly_limit: 1,
    icon: 'gamepad',
  },

  // Power Ups (Autonomy) (5 rewards)
  {
    name: 'Stay Up 30 Min Late',
    description: 'Extend bedtime by 30 minutes',
    category: 'autonomy',
    points_cost: 120,
    screen_minutes: null,
    weekly_limit: 2,
    icon: 'bedtime',
  },
  {
    name: 'Choose Dinner Menu',
    description: 'Pick what the family eats for dinner',
    category: 'autonomy',
    points_cost: 150,
    screen_minutes: null,
    weekly_limit: 2,
    icon: 'restaurant_menu',
  },
  {
    name: 'Skip One Chore',
    description: 'Skip your least favorite chore for the day',
    category: 'autonomy',
    points_cost: 100,
    screen_minutes: null,
    weekly_limit: 3,
    icon: 'do_not_disturb',
  },
  {
    name: 'Friend Sleepover',
    description: 'Invite a friend for a sleepover',
    category: 'autonomy',
    points_cost: 500,
    screen_minutes: null,
    weekly_limit: 1,
    icon: 'hotel',
  },
  {
    name: 'Pick Weekend Activity',
    description: 'Choose a fun family activity for the weekend',
    category: 'autonomy',
    points_cost: 200,
    screen_minutes: null,
    weekly_limit: 1,
    icon: 'calendar_today',
  },

  // Fun Stuff (Experience) (6 rewards)
  {
    name: 'Ice Cream Trip',
    description: 'Go get your favorite ice cream',
    category: 'experience',
    points_cost: 150,
    screen_minutes: null,
    weekly_limit: 2,
    icon: 'icecream',
  },
  {
    name: 'Park Playground Visit',
    description: 'Spend an afternoon at the playground',
    category: 'experience',
    points_cost: 100,
    screen_minutes: null,
    weekly_limit: 3,
    icon: 'park',
  },
  {
    name: 'Movie Theater',
    description: 'See a new movie in theaters',
    category: 'experience',
    points_cost: 600,
    screen_minutes: null,
    weekly_limit: 1,
    icon: 'theaters',
  },
  {
    name: 'Pizza Party',
    description: 'Order pizza for dinner',
    category: 'experience',
    points_cost: 250,
    screen_minutes: null,
    weekly_limit: 1,
    icon: 'local_pizza',
  },
  {
    name: 'New Book',
    description: 'Get a new book of your choice',
    category: 'experience',
    points_cost: 300,
    screen_minutes: null,
    weekly_limit: 2,
    icon: 'menu_book',
  },
  {
    name: 'Trampoline Park',
    description: 'Visit the trampoline park for 2 hours',
    category: 'experience',
    points_cost: 800,
    screen_minutes: null,
    weekly_limit: 1,
    icon: 'sports_gymnastics',
  },

  // Savings (4 rewards)
  {
    name: 'Save $5',
    description: 'Add $5 to your savings account',
    category: 'savings',
    points_cost: 250,
    screen_minutes: null,
    weekly_limit: null,
    icon: 'savings',
  },
  {
    name: 'Save $10',
    description: 'Add $10 to your savings account',
    category: 'savings',
    points_cost: 500,
    screen_minutes: null,
    weekly_limit: null,
    icon: 'account_balance',
  },
  {
    name: 'Save $20',
    description: 'Add $20 to your savings account',
    category: 'savings',
    points_cost: 1000,
    screen_minutes: null,
    weekly_limit: null,
    icon: 'attach_money',
  },
  {
    name: 'Donate $5 to Charity',
    description: 'Donate $5 to a charity of your choice',
    category: 'savings',
    points_cost: 300,
    screen_minutes: null,
    weekly_limit: 2,
    icon: 'volunteer_activism',
  },
];

async function seedSampleData() {
  console.log('🌱 Starting to seed sample data...\n');

  try {
    // 1. Get the first family
    console.log('📋 Fetching family...');
    const { data: families, error: familyError } = await supabase
      .from('families')
      .select('id, name')
      .limit(1);

    if (familyError) {
      throw new Error(`Failed to fetch families: ${familyError.message}`);
    }

    if (!families || families.length === 0) {
      throw new Error('No families found! Please complete onboarding first.');
    }

    const family = families[0];
    console.log(`✅ Found family: ${family.name} (${family.id})\n`);

    // 2. Check existing tasks and rewards
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('family_id', family.id)
      .is('deleted_at', null);

    const { data: existingRewards } = await supabase
      .from('rewards')
      .select('id')
      .eq('family_id', family.id)
      .is('deleted_at', null);

    console.log(`📊 Current state:`);
    console.log(`   - Existing tasks: ${existingTasks?.length || 0}`);
    console.log(`   - Existing rewards: ${existingRewards?.length || 0}\n`);

    // 3. Insert sample tasks
    console.log('📝 Inserting sample tasks...');
    const tasksToInsert = sampleTasks.map(task => ({
      ...task,
      family_id: family.id,
      is_active: true,
    }));

    const { data: insertedTasks, error: tasksError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (tasksError) {
      console.error('❌ Error inserting tasks:', tasksError);
    } else {
      console.log(`✅ Inserted ${insertedTasks?.length || 0} tasks`);

      // Count by category
      const tasksByCategory = insertedTasks?.reduce((acc: any, task: any) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {});

      console.log('   By category:');
      Object.entries(tasksByCategory || {}).forEach(([category, count]) => {
        console.log(`   - ${category}: ${count}`);
      });
    }

    // 4. Insert sample rewards
    console.log('\n🎁 Inserting sample rewards...');
    const rewardsToInsert = sampleRewards.map(reward => ({
      ...reward,
      family_id: family.id,
      is_active: true,
    }));

    const { data: insertedRewards, error: rewardsError } = await supabase
      .from('rewards')
      .insert(rewardsToInsert)
      .select();

    if (rewardsError) {
      console.error('❌ Error inserting rewards:', rewardsError);
    } else {
      console.log(`✅ Inserted ${insertedRewards?.length || 0} rewards`);

      // Count by category
      const rewardsByCategory = insertedRewards?.reduce((acc: any, reward: any) => {
        acc[reward.category] = (acc[reward.category] || 0) + 1;
        return acc;
      }, {});

      console.log('   By category:');
      Object.entries(rewardsByCategory || {}).forEach(([category, count]) => {
        console.log(`   - ${category}: ${count}`);
      });
    }

    // 5. Summary
    console.log('\n✨ Sample data seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Total tasks: ${(existingTasks?.length || 0) + (insertedTasks?.length || 0)}`);
    console.log(`   - Total rewards: ${(existingRewards?.length || 0) + (insertedRewards?.length || 0)}`);
    console.log('\n🚀 You can now test the complete flow at http://localhost:3001\n');

  } catch (error: unknown) {
    console.error('\n❌ Error seeding data:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the seed function
seedSampleData();
