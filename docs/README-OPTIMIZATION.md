# File Optimization Script

This script helps optimize images and videos to reduce file sizes and improve website performance.

## Installation

1. Install Node.js dependencies:
```bash
npm install
```

2. Install ffmpeg (required for video optimization):
```bash
brew install ffmpeg
```

## Usage

### Optimize all files (images and videos):
```bash
npm run optimize
```

### Optimize only images:
```bash
npm run optimize:images
```

### Optimize only videos:
```bash
npm run optimize:videos
```

### Run directly:
```bash
node optimize.js --all
node optimize.js --images
node optimize.js --videos
```

## Features

### Image Optimization
- **JPEG**: Compressed using mozjpeg with 85% quality
- **PNG**: Compressed using pngquant with optimized settings
- Automatically creates backups before optimization
- Restores original if optimization fails

### Video Optimization
- **MP4**: Compressed using H.264 codec with CRF 28
- Only optimizes files larger than 50MB (GitHub's recommended limit)
- Automatically creates backups before optimization
- Restores original if optimization fails or doesn't improve file size

## Configuration

Edit `optimize.js` to adjust optimization settings:

```javascript
const CONFIG = {
    images: {
        jpeg: {
            quality: 85,        // JPEG quality (0-100)
            progressive: true   // Progressive JPEG
        },
        png: {
            quality: [0.7, 0.9] // PNG quality range
        }
    },
    videos: {
        mp4: {
            crf: 28,            // Video quality (lower = better quality, larger file)
            preset: 'medium',   // Encoding speed
            maxSize: 50 * 1024 * 1024 // Only optimize files larger than 50MB
        }
    }
};
```

## Notes

- Backups are automatically created with `.backup` extension
- Backups are removed after successful optimization
- Original files are restored if optimization fails
- Large video files (>50MB) are prioritized for optimization

## GitHub Large File Storage

For files that remain large after optimization, consider using Git LFS:
```bash
git lfs install
git lfs track "*.mp4"
git lfs track "assets/videos/**/*.mp4"
```

