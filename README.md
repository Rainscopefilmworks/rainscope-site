# Rainscope Filmworks Website

A modern, responsive website for Rainscope Filmworks - A Creative Production Company Shaped by the Pacific Northwest.

## Project Structure

```
rainscope-site/
├── index.html              # Main HTML file (outputs clean URL)
├── rentals.html            # Rentals page with catalog integration (outputs clean URL)
├── shop.html               # E-commerce shop page (outputs clean URL)
├── our-work.html           # Our work page with infinite carousel (outputs clean URL)
├── our-team.html           # Our team page (outputs clean URL)
├── contact.html            # Contact page (outputs clean URL)
├── serve.py                # Local development server script
├── optimize.js             # Image and video optimization script
├── _headers                # Cloudflare Pages headers (security, caching, CSP)
├── _redirects              # Cloudflare Pages redirects configuration
├── robots.txt              # SEO robots configuration
├── sitemap.xml             # SEO sitemap
├── video-sitemap.xml       # Video sitemap for SEO
├── package.json            # Node.js dependencies and scripts
├── r2-config.json          # Cloudflare R2 configuration (ignored by git)
├── docs/                   # Documentation folder
│   ├── FAVICON-SETUP.md
│   ├── R2-SETUP.md
│   ├── README-OPTIMIZATION.md
│   ├── SECURITY-AUDIT.md
│   └── SQUARE-PAYMENT-SETUP.md
├── scripts/                # Utility scripts folder
│   ├── generate-favicons.js    # Favicon generator
│   ├── optimize-hero-video.sh  # Hero video optimization
│   ├── optimize-large-files.js # Aggressive file optimization
│   ├── r2-upload.js            # Single file R2 upload
│   └── r2-batch-upload.js      # Batch R2 upload
└── assets/
    ├── css/
    │   └── styles.css      # Main stylesheet (optimized, animated)
    ├── js/
    │   ├── script.js       # Main JavaScript (animations, scroll effects)
    │   └── our-work.js     # Our work page scripts (infinite carousel)
    ├── images/
    │   ├── testimonials/   # Testimonial images
    │   ├── posters/        # Poster images
    │   ├── work/           # Work showcase images (legacy)
    │   ├── team/           # Team member photos
    │   ├── contact/        # Contact page images
    │   ├── logo.png        # Company logo
    │   └── Favicon.png     # Source image for favicons
    └── videos/
        ├── hero-video.mp4  # Hero section video
        └── work/           # Work showcase videos (MP4 format)
```

## Features

### Core Features
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dynamic homepage with scroll animations
- ✅ Hero section with video background and typewriter effect
- ✅ Auto-rotating testimonials carousel
- ✅ Count-up animations for trust indicators
- ✅ Infinite auto-scrolling poster carousel on work page
- ✅ Expandable services accordion
- ✅ Interactive footer with map
- ✅ Social media links
- ✅ Rentals catalog page with Square API integration
- ✅ E-commerce shop page with Square payment processing
- ✅ Mobile-responsive navigation with hamburger menu
- ✅ Contact form integration (Tally.so)

### Performance Optimizations
- ✅ Optimized video loading (lazy loading, preload metadata)
- ✅ Image optimization with aggressive compression
- ✅ GIF to MP4 conversion for smaller file sizes
- ✅ Critical CSS inlining for faster LCP
- ✅ Deferred JavaScript loading
- ✅ CDN-hosted media via Cloudflare R2
- ✅ Cache-busting with versioned URLs

### Security
- ✅ Content Security Policy (CSP) headers
- ✅ XSS protection
- ✅ Input validation and sanitization
- ✅ Secure payment processing (Square)
- ✅ HSTS headers

### SEO
- ✅ Structured data (Schema.org)
- ✅ Optimized meta tags
- ✅ Sitemap.xml and video-sitemap.xml
- ✅ Canonical URLs
- ✅ Open Graph and Twitter Card tags

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Cloudflare R2 (optional, for media hosting):
   - See `docs/R2-SETUP.md` for detailed instructions
   - Copy `r2-config.json.example` to `r2-config.json` and add your credentials
   - Upload media files using the scripts:
     ```bash
     npm run r2:batch assets/images
     npm run r2:batch assets/videos
     ```

4. Generate favicons:
   ```bash
   npm run favicons assets/images/Favicon.png
   ```

## Local Development

**Important**: The rentals and shop pages require a web server due to CORS restrictions. Opening HTML files directly (`file://`) will not work.

### Option 1: Use the included server script

```bash
python3 serve.py
```

This will automatically open `http://localhost:8000/rentals/` in your browser.

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

### Git Integration (Recommended)

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
- Custom HTTP headers (security, caching, CSP)
- URL redirects and rewrites

## Media Files & Cloudflare R2

Media files (images and videos) are now hosted on Cloudflare R2 for better performance and reduced git repository size.

### Setup R2 Storage

1. See `docs/R2-SETUP.md` for detailed setup instructions
2. Configure `r2-config.json` with your R2 credentials
3. Upload media files:
   ```bash
   # Upload all images
   npm run r2:batch assets/images
   
   # Upload all videos
   npm run r2:batch assets/videos
   
   # Upload single file
   npm run r2:upload assets/videos/hero-video.mp4
   ```

### Required Media Files

1. **Hero Video**: `assets/videos/hero-video.mp4`
   - Recommended: MP4 format, H.264 codec
   - Recommended resolution: 1920x1080 or higher
   - Keep file size optimized for web

2. **Work Videos**: Place in `assets/videos/work/`
   - Converted from GIFs to MP4 for better compression
   - Named: `work-1.mp4`, `work-2.mp4`, etc.

3. **Images**: Place in appropriate `assets/images/` subdirectories
   - Testimonials, posters, team photos, etc.

## Optimization Scripts

The project includes several optimization scripts:

```bash
# Optimize all images and videos
npm run optimize

# Optimize only images
npm run optimize:images

# Optimize only videos
npm run optimize:videos

# Aggressive optimization for large files (>5MB)
npm run optimize:large

# Optimize CSS
npm run optimize:css

# Generate favicons from source image
npm run favicons assets/images/Favicon.png
```

See `docs/README-OPTIMIZATION.md` for detailed optimization guidelines.

## Documentation

Additional documentation is available in the `docs/` folder:

- **FAVICON-SETUP.md**: How to generate and configure favicons
- **R2-SETUP.md**: Cloudflare R2 storage setup guide
- **README-OPTIMIZATION.md**: Performance optimization guide
- **SECURITY-AUDIT.md**: Security audit report and recommendations
- **SQUARE-PAYMENT-SETUP.md**: Square payment integration setup

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

The site has been optimized for:
- ✅ Fast initial load time
- ✅ Low Largest Contentful Paint (LCP)
- ✅ Optimized Core Web Vitals
- ✅ Efficient caching strategies
- ✅ Lazy loading for non-critical resources

## Security

The site implements comprehensive security measures:
- ✅ Content Security Policy (CSP)
- ✅ XSS protection headers
- ✅ Input validation and sanitization
- ✅ Secure payment processing via Square
- ✅ HSTS headers for HTTPS enforcement

See `docs/SECURITY-AUDIT.md` for detailed security information.

## Notes

- Media assets are hosted on Cloudflare R2 and are not tracked in git
- The Google Maps embed requires an API key for production use (currently using a basic embed)
- Video autoplay may be restricted on some browsers (especially mobile)
- Square payment integration requires configuration in the Square Dashboard

## License

Private project - All rights reserved.
