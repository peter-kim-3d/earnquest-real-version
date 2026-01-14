# Avatar Integration Guide for Anti-Gravity

**Goal:** Replace placeholder emoji avatars with your generated avatar images in the EarnQuest app

---

## 📦 Step 1: Prepare Your Avatar Files

### Parent Avatars (10 files)
You should have created 10 parent avatar images. Rename them to match this exact naming:

```
avatar-1.png
avatar-2.png
avatar-3.png
avatar-4.png
avatar-5.png
avatar-6.png
avatar-7.png
avatar-8.png
avatar-9.png
avatar-10.png
```

**File Requirements:**
- Format: PNG with transparent background
- Size: 512x512px
- Optimized: Under 100KB each

---

## 📁 Step 2: Upload Files to Project

Place all 10 avatar images in this folder:

```
/public/avatars/
```

**Full path example:**
```
/public/avatars/avatar-1.png
/public/avatars/avatar-2.png
/public/avatars/avatar-3.png
... (and so on)
```

If the `/public/avatars/` folder doesn't exist, create it.

---

## 💻 Step 3: Update Code

You need to update **ONE file**: `lib/avatars.ts`

### Current Code (with placeholder emojis):

```typescript
// lib/avatars.ts
export const PARENT_AVATARS = [
  { id: 'avatar-1', color: 'from-blue-400 to-blue-600', icon: '👤' },
  { id: 'avatar-2', color: 'from-green-400 to-green-600', icon: '🌟' },
  { id: 'avatar-3', color: 'from-purple-400 to-purple-600', icon: '🎯' },
  { id: 'avatar-4', color: 'from-pink-400 to-pink-600', icon: '💎' },
  { id: 'avatar-5', color: 'from-orange-400 to-orange-600', icon: '🔥' },
  { id: 'avatar-6', color: 'from-red-400 to-red-600', icon: '⚡' },
  { id: 'avatar-7', color: 'from-yellow-400 to-yellow-600', icon: '✨' },
  { id: 'avatar-8', color: 'from-indigo-400 to-indigo-600', icon: '🚀' },
  { id: 'avatar-9', color: 'from-teal-400 to-teal-600', icon: '🎨' },
  { id: 'avatar-10', color: 'from-cyan-400 to-cyan-600', icon: '🌈' },
];
```

### New Code (with your images):

```typescript
// lib/avatars.ts
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
];
```

**What changed?**
- Added `image: '/avatars/avatar-X.png'` to each avatar object
- Keep the `icon` (emoji) as fallback
- Keep the `color` for gradient backgrounds

---

## 💻 Step 4: Update Avatar Display Component

Update `components/profile/AvatarEditModal.tsx` to show images instead of emojis.

### Find this section (around line 150-170):

```typescript
{PRESET_AVATARS.map((avatar) => (
  <button
    key={avatar.id}
    onClick={() => handlePresetSelect(avatar.id)}
    className={`
      relative aspect-square rounded-full bg-gradient-to-br ${avatar.color} hover:scale-110 transition-transform flex items-center justify-center text-3xl ${
        selectedPreset === avatar.id ? 'ring-4 ring-primary' : ''
      }
    `}
  >
    {avatar.icon}
    {selectedPreset === avatar.id && (
      <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
        <Check className="h-8 w-8 text-white" />
      </div>
    )}
  </button>
))}
```

### Replace with:

```typescript
{PRESET_AVATARS.map((avatar) => (
  <button
    key={avatar.id}
    onClick={() => handlePresetSelect(avatar.id)}
    className={`
      relative aspect-square rounded-full bg-gradient-to-br ${avatar.color} hover:scale-110 transition-transform flex items-center justify-center overflow-hidden ${
        selectedPreset === avatar.id ? 'ring-4 ring-primary' : ''
      }
    `}
  >
    {avatar.image ? (
      <img
        src={avatar.image}
        alt={avatar.id}
        className="w-full h-full object-cover"
      />
    ) : (
      <span className="text-3xl">{avatar.icon}</span>
    )}
    {selectedPreset === avatar.id && (
      <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
        <Check className="h-8 w-8 text-white" />
      </div>
    )}
  </button>
))}
```

**What changed?**
- Added conditional: if `avatar.image` exists, show `<img>`, else show emoji
- Added `overflow-hidden` to clip image to circle
- Image uses `object-cover` to fill the space

---

## 💻 Step 5: Update Avatar Display Component (Part 2)

Update `components/profile/AvatarDisplay.tsx` to display preset images.

### Find this section (around line 77-85):

```typescript
{currentAvatar && !isPreset && (currentAvatar.startsWith('http://') || currentAvatar.startsWith('https://')) ? (
  // Uploaded image
  <Image
    src={currentAvatar}
    alt={userName}
    width={96}
    height={96}
    className="w-full h-full object-cover"
  />
) : preset ? (
  // Preset emoji
  <span className={sizeClasses.icon}>{preset.icon}</span>
) : (
  // Default: First letter
  <span className={`${sizeClasses.text} font-bold text-primary`}>
    {userName[0]?.toUpperCase() || '?'}
  </span>
)}
```

### Replace with:

```typescript
{currentAvatar && !isPreset && (currentAvatar.startsWith('http://') || currentAvatar.startsWith('https://')) ? (
  // Uploaded image
  <Image
    src={currentAvatar}
    alt={userName}
    width={96}
    height={96}
    className="w-full h-full object-cover"
  />
) : preset?.image ? (
  // Preset image
  <img
    src={preset.image}
    alt={userName}
    className="w-full h-full object-cover"
  />
) : preset ? (
  // Preset emoji (fallback)
  <span className={sizeClasses.icon}>{preset.icon}</span>
) : (
  // Default: First letter
  <span className={`${sizeClasses.text} font-bold text-primary`}>
    {userName[0]?.toUpperCase() || '?'}
  </span>
)}
```

**What changed?**
- Added new condition: `preset?.image` to show preset image
- Kept emoji as fallback if no image
- Image uses same styling as uploaded images

---

## 🧪 Step 6: Test Your Changes

### Testing Checklist:

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Test parent avatar selection:**
   - Go to: `http://localhost:3001/en-US/profile`
   - Click avatar edit button (pencil icon)
   - Click "Gallery" tab
   - **Expected:** You should see your 10 avatar images instead of emojis
   - Click on an avatar to select it
   - **Expected:** Avatar updates successfully

3. **Test avatar display in navigation:**
   - Go to dashboard: `http://localhost:3001/en-US/dashboard`
   - Look at top-right navigation
   - **Expected:** Selected avatar displays correctly

4. **Test different sizes:**
   - Profile page (large): `http://localhost:3001/en-US/profile`
   - Navigation bar (small): Top-right corner of any page
   - Settings page (medium): `http://localhost:3001/en-US/settings/children`

---

## 🐛 Troubleshooting

### Problem: Images don't show up (showing emojis instead)

**Solution 1:** Check file paths
- Make sure files are in `/public/avatars/`
- File names must be exactly: `avatar-1.png`, `avatar-2.png`, etc.
- File names are case-sensitive

**Solution 2:** Clear browser cache
- Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)

**Solution 3:** Check Next.js public folder
- The path `/avatars/avatar-1.png` in code maps to `/public/avatars/avatar-1.png` in the file system
- Make sure you didn't accidentally put files in a different location

### Problem: Images are too large or not centered

**Solution:** Check image dimensions
- All images should be exactly 512x512px (square)
- If images are not square, they may look distorted

### Problem: Images have white background

**Solution:** Re-export with transparency
- Images must have transparent background (PNG with alpha channel)
- Re-save from your design tool with transparency enabled

---

## 📋 Summary Checklist

- [ ] Renamed 10 avatar files to `avatar-1.png` through `avatar-10.png`
- [ ] Placed files in `/public/avatars/` folder
- [ ] Updated `lib/avatars.ts` - added `image` property to all PARENT_AVATARS
- [ ] Updated `components/profile/AvatarEditModal.tsx` - gallery display logic
- [ ] Updated `components/profile/AvatarDisplay.tsx` - avatar display logic
- [ ] Restarted dev server (`npm run dev`)
- [ ] Tested avatar selection in profile page
- [ ] Tested avatar display in navigation
- [ ] Tested avatar display in settings page

---

## 🎉 Success!

When done correctly:
- ✅ Gallery shows beautiful avatar images instead of emojis
- ✅ Selected avatars display correctly throughout the app
- ✅ Avatars work at all sizes (small, medium, large)
- ✅ Avatars maintain circular shape
- ✅ Fallback to emojis if images fail to load

---

## 🔮 Next Steps (Child Avatars)

After parent avatars are working, repeat the same process for child avatars:

1. Create 10 child avatar images following `CHILD_AVATAR_PROMPTS_FOR_ANTI_GRAVITY.md`
2. Name them: `child-avatar-1.png` through `child-avatar-10.png`
3. Place in `/public/avatars/` folder
4. Update `CHILD_AVATARS` in `lib/avatars.ts` the same way
5. Test in child views

---

**Need help?** Check that all file paths and names match exactly. Case matters!
