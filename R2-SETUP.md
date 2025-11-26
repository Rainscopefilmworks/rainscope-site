# Cloudflare R2 Setup Guide

This guide will help you set up Cloudflare R2 for storing your media files (videos and images).

## Step 1: Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** in the sidebar
3. Click **Create bucket**
4. Name your bucket (e.g., `rainscope-media`)
5. Click **Create bucket**

## Step 2: Get Your Account ID

1. In the Cloudflare Dashboard, go to any page
2. Your **Account ID** is shown in the right sidebar
3. Copy it (you'll need it for the config)

## Step 3: Create API Token

1. In R2, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Set permissions:
   - **Object Read & Write** (or just **Object Write** if you only need upload)
4. Set TTL (or leave as "Never expire" for development)
5. Click **Create API Token**
6. **IMPORTANT**: Copy the **Access Key ID** and **Secret Access Key** immediately (you won't see the secret again!)

## Step 4: Set Up Public Access

⚠️ **Important**: Don't use your root domain (`rainscopefilmworks.com`) - use a subdomain or the default R2.dev URL.

You have two options:

### Option A: Use Default R2.dev URL (Easiest - Recommended for now)

1. Go to your R2 bucket
2. Click **Settings**
3. Under **Public Access**, enable it
4. Copy the default R2.dev URL (e.g., `https://pub-xxxxx.r2.dev`)
   - ✅ No DNS changes needed!
   - ✅ Works immediately
   - ✅ No conflicts with your site
5. Use this URL in your `r2-config.json`: 
   ```json
   "publicUrl": "https://pub-xxxxx.r2.dev"
   ```

### Option B: Use a Custom Subdomain (Cleaner URLs, Optional)

If you want cleaner URLs later, use a **subdomain** (NOT the root domain):

1. Go to your R2 bucket → **Settings** → **Public Access**
2. Click **Connect Domain** or **Custom Domain**
3. Enter a **subdomain**, for example:
   - ✅ `media.rainscopefilmworks.com`
   - ✅ `cdn.rainscopefilmworks.com`
   - ✅ `assets.rainscopefilmworks.com`
   - ❌ **NOT** `rainscopefilmworks.com` (this will conflict!)
4. Cloudflare will add a CNAME DNS record automatically
5. Wait a few minutes for DNS to propagate
6. Update your `r2-config.json` with the new URL

**Why use a subdomain?**
- Root domain (`rainscopefilmworks.com`) = conflicts with your main site ❌
- Subdomain (`media.rainscopefilmworks.com`) = separate, no conflicts ✅

## Step 5: Configure the Upload Script

1. Copy `r2-config.json.example` to `r2-config.json`:
   ```bash
   cp r2-config.json.example r2-config.json
   ```

2. Edit `r2-config.json` with your credentials:
   ```json
   {
     "accountId": "your-account-id-here",
     "accessKeyId": "your-access-key-id-here",
     "secretAccessKey": "your-secret-access-key-here",
     "bucketName": "rainscope-media",
     "publicUrl": "https://your-bucket.r2.dev"
   }
   ```

3. **IMPORTANT**: Add `r2-config.json` to `.gitignore` to keep your credentials safe!

## Step 6: Install Dependencies

```bash
npm install @aws-sdk/client-s3
```

## Step 7: Upload Files

### Upload a single file:
```bash
node r2-upload.js assets/videos/work/work-1.mp4
```

### Upload with custom destination path:
```bash
node r2-upload.js assets/images/posters/poster-1.jpg images/posters/poster-1.jpg
```

The script will output the public URL you can use in your HTML.

## Step 8: Update Your HTML

Replace local file paths with R2 URLs:

**Before:**
```html
<source src="assets/videos/work/work-1.mp4" type="video/mp4">
```

**After:**
```html
<source src="https://your-bucket.r2.dev/videos/work/work-1.mp4" type="video/mp4">
```

## Tips

- **Batch Upload**: You can create a simple script to upload multiple files at once
- **Custom Domain**: Set up a custom domain in R2 settings for cleaner URLs
- **Organization**: Keep the same folder structure in R2 as in your local `assets/` folder
- **Backup**: R2 is your backup - you can delete local files after uploading if you want

## Security Note

⚠️ **Never commit `r2-config.json` to Git!** It contains your secret keys.

Make sure it's in `.gitignore`:
```
r2-config.json
```

