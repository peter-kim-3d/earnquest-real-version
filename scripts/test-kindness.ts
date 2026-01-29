/**
 * Test Kindness System
 * Sends gratitude cards and verifies badge creation
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testKindnessSystem() {
  console.log('🧡 Testing Kindness System...\n');

  try {
    // Get family and users
    const { data: family } = await supabase
      .from('families')
      .select('id, name')
      .limit(1)
      .single();

    if (!family) {
      console.error('❌ No family found');
      return;
    }

    console.log(`✅ Using family: ${family.name}`);

    // Get parent user
    const { data: parent } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('family_id', family.id)
      .limit(1)
      .single();

    if (!parent) {
      console.error('❌ No parent user found');
      return;
    }

    console.log(`✅ Parent: ${parent.full_name}`);

    // Get children
    const { data: children } = await supabase
      .from('children')
      .select('id, name')
      .eq('family_id', family.id)
      .order('name', { ascending: true });

    if (!children || children.length === 0) {
      console.error('❌ No children found');
      return;
    }

    console.log(`✅ Children: ${children.map(c => c.name).join(', ')}\n`);

    // Target child (first child)
    const targetChild = children[0];

    // Check existing cards for this child
    const { data: existingCards } = await supabase
      .from('kindness_cards')
      .select('id')
      .eq('to_child_id', targetChild.id);

    const currentCardCount = existingCards?.length || 0;
    console.log(`📊 Current cards for ${targetChild.name}: ${currentCardCount}\n`);

    // Send gratitude cards
    const themes = ['cosmic', 'nature', 'super_hero', 'love'];
    const messages = [
      'Thank you for helping with dishes tonight! 💪',
      "You're so thoughtful and kind! 🌟",
      'Great job on your homework today! 🎉',
      'You made my day better with your smile! 😊',
      'I appreciate how you helped your sibling! ❤️',
    ];

    console.log('📧 Sending gratitude cards...\n');

    for (let i = 0; i < 5; i++) {
      const { data: card, error } = await supabase
        .from('kindness_cards')
        .insert({
          family_id: family.id,
          from_user_id: parent.id,
          to_child_id: targetChild.id,
          message: messages[i],
          theme: themes[i % themes.length],
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error sending card ${i + 1}:`, error.message);
      } else {
        console.log(`✅ Card ${i + 1} sent: ${messages[i]} (${themes[i % themes.length]})`);
      }

      // Small delay to ensure trigger fires
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Check total cards now
    const { data: allCards } = await supabase
      .from('kindness_cards')
      .select('id, message, theme, created_at')
      .eq('to_child_id', targetChild.id)
      .order('created_at', { ascending: false });

    const totalCards = allCards?.length || 0;

    console.log(`\n📊 Total cards for ${targetChild.name}: ${totalCards}`);

    // Check badges
    const { data: badges } = await supabase
      .from('kindness_badges')
      .select('*')
      .eq('child_id', targetChild.id)
      .order('level', { ascending: true });

    console.log(`\n🏆 Badges earned: ${badges?.length || 0}`);

    if (badges && badges.length > 0) {
      badges.forEach((badge) => {
        const levelNames = { 1: 'Bronze 🥉', 2: 'Silver 🥈', 3: 'Gold 🥇' };
        console.log(
          `   - ${levelNames[badge.level as 1 | 2 | 3]} (${badge.cards_required} cards) - Earned ${new Date(
            badge.earned_at
          ).toLocaleDateString()}`
        );
      });
    }

    // Calculate next badge
    let nextBadge = '';
    if (totalCards < 5) {
      nextBadge = `Bronze badge in ${5 - totalCards} more card(s)`;
    } else if (totalCards < 10) {
      nextBadge = `Silver badge in ${10 - totalCards} more card(s)`;
    } else if (totalCards < 20) {
      nextBadge = `Gold badge in ${20 - totalCards} more card(s)`;
    } else {
      nextBadge = '🎉 Maximum level achieved!';
    }

    console.log(`\n🎯 Progress: ${nextBadge}`);

    // Recent cards preview
    console.log(`\n💌 Recent cards (last 3):`);
    if (allCards && allCards.length > 0) {
      allCards.slice(0, 3).forEach((card, index) => {
        const themeIcons = {
          cosmic: '✨',
          nature: '🌿',
          super_hero: '⚡',
          love: '❤️',
        };
        const icon = themeIcons[card.theme as keyof typeof themeIcons] || '💌';
        console.log(`   ${icon} "${card.message}"`);
      });
    }

    console.log('\n✨ Kindness system test complete!\n');
    console.log('🎯 Next steps:');
    console.log('   1. Open http://localhost:3001/en-US/kindness/send');
    console.log('   2. Open http://localhost:3001/en-US/child/badges');
    console.log('   3. Follow KINDNESS_TESTING.md for full flow\n');
  } catch (error: unknown) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

testKindnessSystem();
