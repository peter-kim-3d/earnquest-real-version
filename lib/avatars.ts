// Avatar presets for parents
// Add image files to /public/avatars/ and they will replace the placeholder emojis
export const PARENT_AVATARS = [
  { id: 'avatar-1', color: 'from-blue-400 to-blue-600', icon: '👤', image: '/avatars/avatar-1.png' },
  { id: 'avatar-2', color: 'from-green-400 to-green-600', icon: '🌟', image: '/avatars/avatar-2.png' },
  { id: 'avatar-3', color: 'from-purple-400 to-purple-600', icon: '🎯', image: '/avatars/avatar-3.png' },
  { id: 'avatar-4', color: 'from-pink-400 to-pink-600', icon: '💎', image: '/avatars/avatar-4.png' },
  { id: 'avatar-5', color: 'from-orange-400 to-orange-600', icon: '🔥', image: '/avatars/avatar-5.png' },
  { id: 'avatar-6', color: 'from-red-400 to-red-600', icon: '⚡', image: '/avatars/avatar-6.png' },
  { id: 'avatar-7', color: 'from-yellow-400 to-yellow-600', icon: '✨', image: '/avatars/avatar-7.png' },
  { id: 'avatar-8', color: 'from-indigo-400 to-indigo-600', icon: '🚀', image: '/avatars/avatar-8.png' },
  { id: 'avatar-9', color: 'from-teal-400 to-teal-600', icon: '🎨', image: '/avatars/avatar-9.png' },
  { id: 'avatar-10', color: 'from-cyan-400 to-cyan-600', icon: '🌈', image: '/avatars/avatar-10.png' },
  { id: 'avatar-11', color: 'from-blue-400 to-blue-600', icon: '👨🏿', image: '/avatars/avatar-11.png' },
  { id: 'avatar-12', color: 'from-green-400 to-green-600', icon: '👩', image: '/avatars/avatar-12.png' },
  { id: 'avatar-13', color: 'from-purple-400 to-purple-600', icon: '👨🏻', image: '/avatars/avatar-13.png' },
  { id: 'avatar-14', color: 'from-pink-400 to-pink-600', icon: '👩🏽', image: '/avatars/avatar-14.png' },
  { id: 'avatar-15', color: 'from-orange-400 to-orange-600', icon: '👨🏼', image: '/avatars/avatar-15.png' },
  { id: 'avatar-16', color: 'from-red-400 to-red-600', icon: '👩🏿', image: '/avatars/avatar-16.png' },
  { id: 'avatar-17', color: 'from-yellow-400 to-yellow-600', icon: '👨🏾', image: '/avatars/avatar-17.png' },
  { id: 'avatar-18', color: 'from-indigo-400 to-indigo-600', icon: '🧕', image: '/avatars/avatar-18.png' },
  { id: 'avatar-19', color: 'from-teal-400 to-teal-600', icon: '👨', image: '/avatars/avatar-19.png' },
  { id: 'avatar-20', color: 'from-cyan-400 to-cyan-600', icon: '👩', image: '/avatars/avatar-20.png' },
];

// Avatar presets for children - fun, playful characters
// Placeholder emojis - will be replaced with Anti-Gravity generated images
// Add image files to /public/avatars/ and they will replace the placeholder emojis
export const CHILD_AVATARS = [
  { id: 'child-avatar-1', color: 'from-pink-300 to-pink-500', icon: '🐰', image: '/avatars/child-avatar-1.png' }, // Bunny
  { id: 'child-avatar-2', color: 'from-blue-300 to-blue-500', icon: '🐻', image: '/avatars/child-avatar-2.png' }, // Bear
  { id: 'child-avatar-3', color: 'from-yellow-300 to-yellow-500', icon: '🦁', image: '/avatars/child-avatar-3.png' }, // Lion
  { id: 'child-avatar-4', color: 'from-green-300 to-green-500', icon: '🐸', image: '/avatars/child-avatar-4.png' }, // Frog
  { id: 'child-avatar-5', color: 'from-purple-300 to-purple-500', icon: '🦄', image: '/avatars/child-avatar-5.png' }, // Unicorn
  { id: 'child-avatar-6', color: 'from-red-300 to-red-500', icon: '🦊', image: '/avatars/child-avatar-6.png' }, // Fox
  { id: 'child-avatar-7', color: 'from-orange-300 to-orange-500', icon: '🐯', image: '/avatars/child-avatar-7.png' }, // Tiger
  { id: 'child-avatar-8', color: 'from-teal-300 to-teal-500', icon: '🐬', image: '/avatars/child-avatar-8.png' }, // Dolphin
  { id: 'child-avatar-9', color: 'from-indigo-300 to-indigo-500', icon: '🦋', image: '/avatars/child-avatar-9.png' }, // Butterfly
  { id: 'child-avatar-10', color: 'from-cyan-300 to-cyan-500', icon: '🐙', image: '/avatars/child-avatar-10.png' }, // Octopus
];

// Combined lookup for easy access
export const ALL_AVATARS: Record<string, { color: string; icon: string; image?: string }> = {
  ...Object.fromEntries(PARENT_AVATARS.map(a => [a.id, a])),
  ...Object.fromEntries(CHILD_AVATARS.map(a => [a.id, a])),
};

export function getAvatarById(id: string) {
  return ALL_AVATARS[id] || null;
}

export function isChildAvatar(id: string) {
  return id.startsWith('child-avatar-');
}

export function isParentAvatar(id: string) {
  return id.startsWith('avatar-') && !id.startsWith('child-avatar-');
}
