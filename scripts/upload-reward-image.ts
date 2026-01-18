/**
 * Upload reward image to Supabase Storage
 * Usage: tsx scripts/upload-reward-image.ts <image-filename>
 * Example: tsx scripts/upload-reward-image.ts gift_card.png
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadImage(filename: string) {
  const imagePath = path.join(process.cwd(), 'public', 'images', 'rewards', filename);

  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    console.error(`❌ File not found: ${imagePath}`);
    process.exit(1);
  }

  console.log(`📤 Uploading ${filename} to Supabase Storage...`);

  // Read file
  const fileBuffer = fs.readFileSync(imagePath);

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('reward-images')
    .upload(`defaults/${filename}`, fileBuffer, {
      contentType: 'image/png',
      upsert: true, // Overwrite if exists
    });

  if (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }

  console.log('✅ Upload successful!');
  console.log(`📍 Storage path: ${data.path}`);

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('reward-images')
    .getPublicUrl(`defaults/${filename}`);

  console.log(`🔗 Public URL: ${publicUrl}`);
}

// Get filename from command line argument
const filename = process.argv[2];

if (!filename) {
  console.error('❌ Please provide a filename');
  console.error('Usage: tsx scripts/upload-reward-image.ts <image-filename>');
  console.error('Example: tsx scripts/upload-reward-image.ts gift_card.png');
  process.exit(1);
}

uploadImage(filename).catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
