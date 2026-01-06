# PWA Icons

This directory should contain the following icons for the Progressive Web App:

- `icon-192.png` - 192x192px PNG icon
- `icon-512.png` - 512x512px PNG icon
- `icon-maskable-512.png` - 512x512px PNG icon with maskable safe zone

## Creating Icons

Convert the EarnQuest logo from `assets/earnquest-icon.svg` to PNG format at the required sizes.

You can use tools like:
- https://realfavicongenerator.net/
- ImageMagick: `convert earnquest-icon.svg -resize 192x192 icon-192.png`
- Online converters

## Maskable Icon

For the maskable icon, ensure the logo has adequate padding (safe zone) around it to prevent clipping on different device shapes. The safe zone should be approximately 40% of the icon size.

Reference: https://web.dev/maskable-icon/
