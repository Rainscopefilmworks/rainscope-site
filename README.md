# Rainscope Filmworks Website

A modern, responsive website for Rainscope Filmworks - A Creative Production Company Shaped by the Pacific Northwest.

## Project Structure

```
rainscope-site/
├── index.html              # Main HTML file
├── rentals.html            # Rentals page with catalog integration
├── our-work.html           # Our work page
├── our-team.html           # Our team page
├── contact.html            # Contact page
├── serve.py                # Local development server script
├── optimize.js             # Image and video optimization script
├── optimize-hero-video.sh  # Hero video preview generator
├── generate-favicons.js    # Favicon generator script
├── _headers                # Cloudflare Pages headers configuration
├── _redirects              # Cloudflare Pages redirects configuration
├── .gitignore              # Git ignore rules
├── README.md               # This file
├── README-OPTIMIZATION.md  # Optimization guide
├── SECURITY-AUDIT.md       # Security documentation
├── assets/
│   ├── css/
│   │   └── styles.css      # Main stylesheet
│   ├── js/
│   │   ├── script.js       # Main JavaScript functionality
│   │   └── our-work.js     # Our work page scripts
│   ├── images/
│   │   ├── testimonials/   # Testimonial images
│   │   ├── posters/        # Poster images
│   │   ├── work/           # Work showcase images/gifs
│   │   ├── team/           # Team member photos
│   │   ├── contact/        # Contact page images
│   │   └── logo.png        # Company logo
│   └── videos/
│       ├── hero-video.mp4  # Hero section video
│       ├── hero-video-preview.mp4  # Optimized preview version
│       └── work/           # Work showcase videos
```

## Setup

1. Clone the repository
2. Add your media files:
   - Place hero video in `assets/videos/hero-video.mp4`
   - Place testimonial images in `assets/images/testimonials/`:
     - `testimonial-1.jpg` (Noemi Lopez)
     - `testimonial-2.jpg` (Anton Hing)
     - `testimonial-3.jpg` (Danny Astefan)
   - Or update image paths in `index.html` to match your naming convention

## Local Development

**Important**: The rentals page requires a web server due to CORS restrictions. Opening HTML files directly (`file://`) will not work for the rentals API.

### Option 1: Use the included server script

```bash
python3 serve.py
```

This will automatically open `http://localhost:8000/rentals.html` in your browser.

### Option 2: Use Python's built-in server

```bash
# Using Python 3
python3 -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000
```

Then visit `http://localhost:8000`

### Option 3: Using Node.js (if you have http-server installed)

```bash
npx http-server
```

**Note**: The rentals API (`https://rainscope-square-proxy.sweet-queen-15c3.workers.dev`) is configured to only accept requests from `https://rainscopefw.squarespace.com`. When testing locally, you may see CORS errors. The rentals page will work correctly when deployed to your production domain.

## Deployment to Cloudflare Pages

### Option 1: Git Integration (Recommended)

1. Push your code to GitHub, GitLab, or Bitbucket
2. Go to Cloudflare Dashboard → Pages
3. Click "Create a project"
4. Connect your Git repository
5. Configure build settings:
   - **Framework preset**: None (or Static)
   - **Build command**: (leave empty for static site)
   - **Build output directory**: `/` (root)
   - **Root directory**: `/` (root)
6. Deploy!

The `_headers` and `_redirects` files will be automatically used by Cloudflare Pages for:
- Custom HTTP headers (security, caching)
- URL redirects and rewrites

### Option 2: Direct Upload

1. Go to Cloudflare Dashboard → Pages
2. Click "Create a project" → "Upload assets"
3. Upload all files (excluding `.gitignore` and `README.md` if desired)
4. Deploy!

## Media Files

### Required Media Files

1. **Hero Video**: `assets/videos/hero-video.mp4`
   - Recommended: MP4 format, H.264 codec
   - Recommended resolution: 1920x1080 or higher
   - Keep file size optimized for web

2. **Testimonial Images**: Place in `assets/images/testimonials/`
   - Update paths in `index.html` accordingly

### Optimizing Media

- **Videos**: Use tools like HandBrake or FFmpeg to compress
- **Images**: Optimize with tools like ImageOptim, TinyPNG, or Squoosh
- Consider using WebP format for images (with fallbacks)

## Features

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Hero section with video background
- ✅ Auto-rotating testimonials carousel
- ✅ Expandable services accordion
- ✅ Interactive footer with map
- ✅ Social media links
- ✅ Rentals catalog page with Square API integration
- ✅ Mobile-responsive navigation with hamburger menu
- ✅ Contact form integration (Tally.so)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- The Google Maps embed requires an API key for production use (currently using a basic embed)
- Video autoplay may be restricted on some browsers (especially mobile)
- Consider adding a video fallback image for better loading experience

