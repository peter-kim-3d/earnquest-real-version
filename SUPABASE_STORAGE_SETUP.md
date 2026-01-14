# Supabase Storage Setup for Avatars

Follow these steps to enable avatar uploads in your EarnQuest app.

---

## 📦 Create Storage Bucket

1. **Go to Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar
   - Click "+ New bucket"

3. **Create "avatars" bucket**
   - **Name:** `avatars`
   - **Public bucket:** ✅ Check this (allows public read access)
   - **File size limit:** 5MB
   - **Allowed MIME types:** `image/*`
   - Click "Create bucket"

---

## 🔐 Set Up Storage Policies

After creating the bucket, set up RLS policies:

### Policy 1: Allow Public Read

```sql
-- Allow anyone to view avatar images
CREATE POLICY "Public avatars are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
```

### Policy 2: Allow Authenticated Upload

```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'avatars'
    AND auth.uid()::text = (storage.filename(name)::text).split('-')[1]
  );
```

### Policy 3: Allow Users to Update Their Own Avatars

```sql
-- Allow users to update their own avatar files
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = substring(name from 'avatars/([^-]+)')
  );
```

### Policy 4: Allow Users to Delete Their Own Avatars

```sql
-- Allow users to delete their own avatar files
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = substring(name from 'avatars/([^-]+)')
  );
```

---

## 📋 How to Apply Policies

### Method 1: Via Dashboard (Recommended)

1. In Supabase Dashboard, go to **Storage**
2. Click on the **"avatars"** bucket
3. Click **"Policies"** tab
4. Click **"New policy"**
5. Choose **"Custom policy"**
6. Copy and paste each SQL policy above
7. Click **"Review"** then **"Save policy"**

### Method 2: Via SQL Editor

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"+ New query"**
3. Copy and paste all 4 policies at once
4. Click **"Run"**

---

## ✅ Verify Setup

Test that everything works:

```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE name = 'avatars';

-- Check policies are active
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%avatar%';
```

Expected results:
- ✅ 1 bucket named "avatars"
- ✅ 4 policies related to avatars

---

## 🧪 Test Upload Flow

After setup, test the upload:

1. **Go to Profile page:** `http://localhost:3001/en-US/profile`
2. **Click the edit pencil** on avatar
3. **Go to "Upload" tab**
4. **Click "Take Photo" or "Upload Image"**
5. **Select an image** (under 5MB)
6. **Verify it uploads** and displays correctly

---

## 🔧 Troubleshooting

### Error: "new row violates row-level security policy"

**Solution:** Make sure you ran ALL 4 storage policies above.

### Error: "Bucket not found"

**Solution:**
1. Check bucket name is exactly `avatars` (lowercase)
2. Verify bucket is marked as "Public"

### Error: "File size too large"

**Solution:** Image must be under 5MB. Compress the image first.

### Avatar doesn't display after upload

**Solution:**
1. Check the public URL is correct
2. Verify bucket is marked as "Public"
3. Hard refresh the page (Cmd+Shift+R)

---

## 📁 File Structure

Uploaded avatars will be stored as:
```
avatars/
  ├── [user-id]-[timestamp].jpg
  ├── [user-id]-[timestamp].png
  └── [user-id]-[timestamp].gif
```

Example:
```
avatars/a1b2c3d4-1234567890.jpg
```

---

## 🎨 Optional: Image Optimization

To optimize uploaded images, you can add Supabase Image Transformations:

```typescript
// Get optimized avatar URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(filePath, {
    transform: {
      width: 512,
      height: 512,
      resize: 'cover',
      quality: 80,
    },
  });
```

---

## ✅ Success!

Once setup is complete:
- ✅ Users can upload custom avatars
- ✅ Users can choose preset avatars
- ✅ Avatars display correctly across the app
- ✅ Old avatars are kept in storage (for history)

---

**Need help?** Check Supabase Storage docs: https://supabase.com/docs/guides/storage
