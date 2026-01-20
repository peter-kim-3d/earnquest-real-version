'use client';

import {
    Broom,
    Trash,
    Bed,
    Dog, // Pets alias
    BookOpen, // School alias
    Student,
    Barbell,
    Palette,
    GameController,
    Checks,
    Gift,
    Star,
    Trophy,
    Medal,
    Heart,
    House,
    Lightning,
    Confetti,
    Pizza,
    Monitor,
    TShirt,
    Flower,
    Footprints, // Walking alias
    MusicNotes,
    PaintBrush,
    Sparkle,
    // Additional icons for migration
    TrendUp,
    GridFour,
    Television,
    PiggyBank,
    ArrowRight,
    Handshake,
    Sun,
    SealCheck,
    Microphone,
    Smiley,
    CheckCircle,
} from '@phosphor-icons/react/dist/ssr';
import type { IconProps } from '@phosphor-icons/react';

const ICON_MAP: Record<string, React.ComponentType<IconProps>> = {
    // Chores / Household
    'cleaning_services': Broom,
    'delete': Trash,
    'bed': Bed,
    'pets': Dog,
    'home': House,
    'living': House,
    'laundry': TShirt,
    'plants': Flower,

    // Learning / School
    'school': Student,
    'book': BookOpen,
    'menu_book': BookOpen,
    'calculate': BookOpen,

    // Health / Exercise
    'fitness_center': Barbell,
    'directions_walk': Footprints,
    'heart': Heart,

    // Creativity / Hobbies
    'palette': Palette,
    'brush': PaintBrush,
    'music_note': MusicNotes,
    'piano': MusicNotes,

    // Fun / Rewards
    'sports_esports': GameController,
    'redeem': Gift,
    'card_giftcard': Gift,
    'star': Star,
    'emoji_events': Trophy,
    'military_tech': Medal,
    'celebration': Confetti,
    'local_pizza': Pizza,
    'monitor': Monitor,

    // Generic / System
    'task_alt': Checks,
    'bolt': Lightning,
    'task': Checks,
    'dentistry': Sparkle, // Fallback for dentistry
    'backpack': BookOpen, // Fallback for backpack if Backpack not imported
    'restaurant': Pizza, // Fallback for restaurant
    'fastfood': Pizza,
    'lunch_dining': Pizza,
    'local_dining': Pizza,

    // Additional mappings for Material Icons migration
    'trending_up': TrendUp,
    'grid_view': GridFour,
    'tv': Television,
    'savings': PiggyBank,
    'arrow_forward': ArrowRight,
    'handshake': Handshake,
    'wb_sunny': Sun,
    'verified': SealCheck,
    'record_voice_over': Microphone,
    'face': Smiley,
    'check_circle': CheckCircle,
};

interface AppIconProps extends Omit<IconProps, 'name' | 'ref'> {
    name: string | null | undefined;
}

export function AppIcon({ name, ...props }: AppIconProps) {
    if (!name) return <Checks {...props} />;

    const IconComponent = ICON_MAP[name] || Checks; // Default to Checks if not found

    return <IconComponent {...props} />;
}
