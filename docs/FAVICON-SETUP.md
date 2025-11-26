# Favicon Setup Guide

## Files Needed

Once you attach your logomark, you'll need to create the following favicon files and place them in the `assets/images/` directory:

1. **favicon-16x16.png** - 16x16 pixels (for browser tabs)
2. **favicon-32x32.png** - 32x32 pixels (for browser tabs and bookmarks)
3. **apple-touch-icon.png** - 180x180 pixels (for iOS home screen)
4. **android-chrome-192x192.png** - 192x192 pixels (for Android devices)
5. **android-chrome-512x512.png** - 512x512 pixels (for Android splash screen)

## How to Create Favicon Files

### Option 1: Online Favicon Generator
1. Visit https://realfavicongenerator.net/ or https://favicon.io/
2. Upload your logomark
3. Generate all sizes
4. Download and extract files
5. Place files in `assets/images/` directory

### Option 2: Manual Creation
Use image editing software (Photoshop, GIMP, etc.) or command line tools:
- Resize your logomark to each required size
- Save as PNG files with the exact names listed above
- Place in `assets/images/` directory

## Verification

After adding the files, the favicon links are already in place in `index.html`. The favicons should appear automatically once the files are uploaded.

## Note

The favicon HTML code has been added to `index.html` in the `<head>` section. You just need to add the actual image files!

