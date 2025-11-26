#!/bin/bash
# Create a smaller preview version of hero video for faster initial load
# This creates a 5-second preview at lower quality for faster LCP

VIDEO="assets/videos/hero-video.mp4"
PREVIEW="assets/videos/hero-video-preview.mp4"

if [ -f "$VIDEO" ]; then
    echo "Creating optimized preview version of hero video..."
    ffmpeg -i "$VIDEO" -t 5 -c:v libx264 -crf 32 -preset fast -vf "scale=1280:720" -c:a aac -b:a 64k -movflags +faststart "$PREVIEW" -y
    echo "Preview created: $PREVIEW"
    ls -lh "$PREVIEW"
else
    echo "Hero video not found: $VIDEO"
fi
