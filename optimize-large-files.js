#!/usr/bin/env node

/**
 * Aggressive Optimization Script for Large Files
 * Targets files >5MB for aggressive compression
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Configuration for aggressive optimization
const CONFIG = {
    images: {
        jpeg: {
            quality: 70, // Aggressive compression
            maxWidth: 1920, // Limit width
            maxHeight: 1080
        },
        png: {
            quality: [0.5, 0.7], // Very aggressive
            maxWidth: 1920,
            maxHeight: 1080
        }
    },
    videos: {
        mp4: {
            crf: 35, // Very aggressive (higher = smaller file)
            preset: 'fast',
            maxWidth: 1920,
            maxHeight: 1080,
            bitrate: '2M' // Limit bitrate
        }
    },
    gifs: {
        // Convert GIFs to MP4 for much better compression
        crf: 32,
        preset: 'fast',
        fps: 15 // Reduce FPS for smaller files
    }
};

function getFileSize(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size / (1024 * 1024); // MB
}

async function optimizeLargeImage(inputPath) {
    try {
        const sharp = require('sharp');
        const fileSize = getFileSize(inputPath);
        
        if (fileSize < 5) {
            console.log(chalk.gray(`Skipping ${path.basename(inputPath)} (${fileSize.toFixed(2)}MB - already optimized)`));
            return;
        }

        console.log(chalk.yellow(`Optimizing ${path.basename(inputPath)} (${fileSize.toFixed(2)}MB)...`));
        
        const ext = path.extname(inputPath).toLowerCase();
        const tempPath = inputPath + '.tmp';
        
        if (ext === '.jpg' || ext === '.jpeg') {
            await sharp(inputPath)
                .resize(CONFIG.images.jpeg.maxWidth, CONFIG.images.jpeg.maxHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ 
                    quality: CONFIG.images.jpeg.quality,
                    progressive: true,
                    mozjpeg: true
                })
                .toFile(tempPath);
        } else if (ext === '.png') {
            await sharp(inputPath)
                .resize(CONFIG.images.png.maxWidth, CONFIG.images.png.maxHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .png({ 
                    quality: CONFIG.images.png.quality[0] * 100,
                    compressionLevel: 9
                })
                .toFile(tempPath);
        }

        const newSize = getFileSize(tempPath);
        const saved = ((fileSize - newSize) / fileSize * 100).toFixed(1);
        
        if (newSize < fileSize) {
            fs.renameSync(tempPath, inputPath);
            console.log(chalk.green(`✓ ${path.basename(inputPath)}: ${fileSize.toFixed(2)}MB → ${newSize.toFixed(2)}MB (${saved}% saved)`));
        } else {
            fs.unlinkSync(tempPath);
            console.log(chalk.gray(`  No improvement for ${path.basename(inputPath)}`));
        }
    } catch (error) {
        console.error(chalk.red(`Error optimizing ${inputPath}: ${error.message}`));
    }
}

function convertGifToMp4(gifPath) {
    try {
        const fileSize = getFileSize(gifPath);
        const mp4Path = gifPath.replace(/\.gif$/i, '.mp4');
        
        console.log(chalk.yellow(`Converting ${path.basename(gifPath)} (${fileSize.toFixed(2)}MB) to MP4...`));
        
        // Convert GIF to MP4 (much smaller)
        execSync(`ffmpeg -i "${gifPath}" -vf "fps=${CONFIG.gifs.fps},scale=1920:-1:flags=lanczos" -c:v libx264 -crf ${CONFIG.gifs.crf} -preset ${CONFIG.gifs.preset} -pix_fmt yuv420p -movflags +faststart "${mp4Path}"`, {
            stdio: 'inherit'
        });
        
        const newSize = getFileSize(mp4Path);
        const saved = ((fileSize - newSize) / fileSize * 100).toFixed(1);
        
        console.log(chalk.green(`✓ ${path.basename(gifPath)} → ${path.basename(mp4Path)}: ${fileSize.toFixed(2)}MB → ${newSize.toFixed(2)}MB (${saved}% saved)`));
        
        return mp4Path;
    } catch (error) {
        console.error(chalk.red(`Error converting ${gifPath}: ${error.message}`));
        return null;
    }
}

async function optimizeLargeVideo(videoPath) {
    try {
        const fileSize = getFileSize(videoPath);
        
        if (fileSize < 5) {
            console.log(chalk.gray(`Skipping ${path.basename(videoPath)} (${fileSize.toFixed(2)}MB)`));
            return;
        }

        console.log(chalk.yellow(`Optimizing ${path.basename(videoPath)} (${fileSize.toFixed(2)}MB)...`));
        
        const tempPath = videoPath + '.tmp';
        
        execSync(`ffmpeg -i "${videoPath}" -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" -c:v libx264 -crf ${CONFIG.videos.mp4.crf} -preset ${CONFIG.videos.mp4.preset} -b:v ${CONFIG.videos.mp4.bitrate} -maxrate ${CONFIG.videos.mp4.bitrate} -bufsize ${CONFIG.videos.mp4.bitrate} -c:a aac -b:a 96k -movflags +faststart -f mp4 "${tempPath}"`, {
            stdio: 'inherit'
        });
        
        const newSize = getFileSize(tempPath);
        const saved = ((fileSize - newSize) / fileSize * 100).toFixed(1);
        
        if (newSize < fileSize) {
            fs.renameSync(tempPath, videoPath);
            console.log(chalk.green(`✓ ${path.basename(videoPath)}: ${fileSize.toFixed(2)}MB → ${newSize.toFixed(2)}MB (${saved}% saved)`));
        } else {
            fs.unlinkSync(tempPath);
            console.log(chalk.gray(`  No improvement for ${path.basename(videoPath)}`));
        }
    } catch (error) {
        console.error(chalk.red(`Error optimizing ${videoPath}: ${error.message}`));
    }
}

async function main() {
    console.log(chalk.blue.bold('\n🚀 Aggressive Large File Optimization\n'));
    
    const { glob } = require('glob');
    
    // Find large images
    const largeImages = await glob('assets/images/**/*.{jpg,jpeg,png}', { 
        ignore: ['**/favicon*.png', '**/android-chrome*.png', '**/apple-touch-icon.png']
    });
    
    console.log(chalk.cyan('\n📸 Optimizing Large Images...\n'));
    for (const img of largeImages) {
        if (getFileSize(img) >= 2) { // Only optimize files >2MB
            await optimizeLargeImage(img);
        }
    }
    
    // Find and convert large GIFs
    const largeGifs = await glob('assets/images/**/*.gif');
    
    console.log(chalk.cyan('\n🎬 Converting Large GIFs to MP4...\n'));
    for (const gif of largeGifs) {
        if (getFileSize(gif) >= 5) { // Only convert files >5MB
            convertGifToMp4(gif);
        }
    }
    
    // Find large videos (except already optimized ones)
    const largeVideos = await glob('assets/videos/**/*.mp4');
    
    console.log(chalk.cyan('\n🎥 Optimizing Large Videos...\n'));
    for (const vid of largeVideos) {
        if (getFileSize(vid) >= 5) {
            await optimizeLargeVideo(vid);
        }
    }
    
    console.log(chalk.green.bold('\n✅ Optimization Complete!\n'));
}

main().catch(console.error);

