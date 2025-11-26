#!/usr/bin/env node

/**
 * File Optimization Script for Rainscope Filmworks
 * Optimizes images and videos to reduce file sizes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const { glob } = require('glob');

// Configuration
const CONFIG = {
    images: {
        jpeg: {
            quality: 85,
            progressive: true,
            mozjpeg: true,
            qualityLarge: 75, // More aggressive for large files
            maxSize: 25 * 1024 * 1024 // 25MB
        },
        png: {
            quality: [0.7, 0.9],
            speed: 4,
            qualityLarge: [0.6, 0.8], // More aggressive for large files
            maxSize: 25 * 1024 * 1024 // 25MB
        },
        webp: {
            quality: 85
        }
    },
    videos: {
        mp4: {
            crf: 28,
            crfLarge: 32, // More aggressive compression for large files
            preset: 'medium',
            maxSize: 25 * 1024 * 1024 // 25MB - Cloudflare Pages limit
        }
    }
};

// Check if required tools are available
function checkDependencies() {
    const dependencies = {
        sharp: false,
        ffmpeg: false
    };

    try {
        require('sharp');
        dependencies.sharp = true;
    } catch (e) {
        console.log(chalk.yellow('Warning: sharp not installed. Install with: npm install'));
    }

    try {
        execSync('which ffmpeg', { stdio: 'ignore' });
        dependencies.ffmpeg = true;
    } catch (e) {
        console.log(chalk.yellow('Warning: ffmpeg not found. Install with: brew install ffmpeg'));
    }

    return dependencies;
}

// Get file size in MB
function getFileSize(filePath) {
    const stats = fs.statSync(filePath);
    return (stats.size / (1024 * 1024)).toFixed(2);
}

// Optimize JPEG images
async function optimizeJPEG(inputPath, outputPath) {
    try {
        const sharp = require('sharp');
        const imagemin = require('imagemin');
        const imageminMozjpeg = require('imagemin-mozjpeg');

        const originalSize = getFileSize(inputPath);
        const originalSizeMB = parseFloat(originalSize);
        const dir = path.dirname(inputPath);
        const fileName = path.basename(inputPath);
        const tempPath = path.join(dir, `.${fileName}.tmp`);
        
        // Use more aggressive compression for large files (>25MB)
        const isLarge = originalSizeMB > 25;
        let quality = isLarge ? CONFIG.images.jpeg.qualityLarge : CONFIG.images.jpeg.quality;

        // Try using sharp first (simpler and more reliable)
        try {
            // For large files, try aggressive compression until under 25MB
            let attempts = 0;
            let finalPath = tempPath;
            let bestSize = originalSizeMB;
            let bestQuality = quality;
            
            while (attempts < 3 && bestSize > 25) {
                await sharp(inputPath)
                    .jpeg({ 
                        quality: bestQuality,
                        progressive: CONFIG.images.jpeg.progressive,
                        mozjpeg: CONFIG.images.jpeg.mozjpeg
                    })
                    .toFile(finalPath);

                const tempSizeMB = parseFloat(getFileSize(finalPath));
                
                if (tempSizeMB < bestSize) {
                    bestSize = tempSizeMB;
                    if (tempSizeMB <= 25) {
                        break; // Successfully optimized under 25MB
                    }
                    // Try more aggressive compression
                    bestQuality = Math.max(60, bestQuality - 5);
                    attempts++;
                    if (attempts < 3 && bestSize > 25) {
                        fs.unlinkSync(finalPath);
                    }
                } else {
                    break; // Can't optimize further
                }
            }

            // Check if we got a better result
            if (bestSize < originalSizeMB) {
                // Replace original with optimized version - preserve filename
                if (fs.existsSync(inputPath)) {
                    fs.unlinkSync(inputPath);
                }
                if (fs.existsSync(finalPath)) {
                    fs.renameSync(finalPath, outputPath);
                }
                
                const optimizedSize = getFileSize(outputPath);
                const savings = ((originalSizeMB - parseFloat(optimizedSize)) / originalSizeMB * 100).toFixed(1);
                
                return {
                    success: true,
                    originalSize,
                    optimizedSize,
                    savings: `${savings}%`,
                    warning: parseFloat(optimizedSize) > 25 ? 'Still over 25MB but optimized' : null
                };
            } else {
                // Optimization didn't help - remove temp file and keep original
                if (fs.existsSync(finalPath)) {
                    fs.unlinkSync(finalPath);
                }
                
                return {
                    success: true,
                    originalSize,
                    optimizedSize: originalSize,
                    savings: '0%',
                    skipped: true
                };
            }
        } catch (sharpError) {
            // Fallback to imagemin if sharp fails
            const files = await imagemin([inputPath], {
                destination: dir,
                plugins: [
                    imageminMozjpeg({
                        quality: CONFIG.images.jpeg.quality,
                        progressive: CONFIG.images.jpeg.progressive
                    })
                ]
            });

            // imagemin creates the file with the same name in the destination
            // Check if it's actually smaller
            if (files && files.length > 0) {
                const outputFile = path.join(dir, fileName);
                if (fs.existsSync(outputFile)) {
                    const outputSize = getFileSize(outputFile);
                    if (parseFloat(outputSize) < parseFloat(originalSize)) {
                        // It's smaller - good!
                        const savings = ((originalSize - outputSize) / originalSize * 100).toFixed(1);
                        return {
                            success: true,
                            originalSize,
                            optimizedSize: outputSize,
                            savings: `${savings}%`
                        };
                    } else {
                        // Not smaller - imagemin might have overwritten, restore from input
                        // Since inputPath was the original, we need to check if it still exists
                        if (!fs.existsSync(inputPath)) {
                            throw new Error('Original file was removed but optimization failed');
                        }
                        return {
                            success: true,
                            originalSize,
                            optimizedSize: originalSize,
                            savings: '0%',
                            skipped: true
                        };
                    }
                }
            }
            throw new Error('No output file created');
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Optimize PNG images
async function optimizePNG(inputPath, outputPath) {
    try {
        const sharp = require('sharp');
        const imagemin = require('imagemin');
        const imageminPngquant = require('imagemin-pngquant');

        const originalSize = getFileSize(inputPath);
        const dir = path.dirname(inputPath);
        const fileName = path.basename(inputPath);
        const tempPath = path.join(dir, `.${fileName}.tmp`);

        // Try using sharp first (simpler and more reliable)
        try {
            await sharp(inputPath)
                .png({ 
                    quality: Math.round(CONFIG.images.png.quality[1] * 100),
                    compressionLevel: 9,
                    adaptiveFiltering: true
                })
                .toFile(tempPath);

            // Check if optimized file is smaller before replacing
            const tempSize = getFileSize(tempPath);
            if (parseFloat(tempSize) < parseFloat(originalSize)) {
                // Replace original with optimized version - preserve filename
                fs.unlinkSync(inputPath);
                fs.renameSync(tempPath, outputPath);
                
                const optimizedSize = getFileSize(outputPath);
                const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
                
                return {
                    success: true,
                    originalSize,
                    optimizedSize,
                    savings: `${savings}%`
                };
            } else {
                // Optimization didn't help - remove temp file and keep original
                fs.unlinkSync(tempPath);
                
                return {
                    success: true,
                    originalSize,
                    optimizedSize: originalSize,
                    savings: '0%',
                    skipped: true
                };
            }
        } catch (sharpError) {
            // Fallback to imagemin if sharp fails
            const files = await imagemin([inputPath], {
                destination: dir,
                plugins: [
                    imageminPngquant({
                        quality: CONFIG.images.png.quality,
                        speed: CONFIG.images.png.speed
                    })
                ]
            });

            // imagemin creates the file with the same name in the destination
            // Check if it's actually smaller
            if (files && files.length > 0) {
                const outputFile = path.join(dir, fileName);
                if (fs.existsSync(outputFile)) {
                    const outputSize = getFileSize(outputFile);
                    if (parseFloat(outputSize) < parseFloat(originalSize)) {
                        // It's smaller - good!
                        const savings = ((originalSize - outputSize) / originalSize * 100).toFixed(1);
                        return {
                            success: true,
                            originalSize,
                            optimizedSize: outputSize,
                            savings: `${savings}%`
                        };
                    } else {
                        // Not smaller - imagemin might have overwritten, restore from input
                        // Since inputPath was the original, we need to check if it still exists
                        if (!fs.existsSync(inputPath)) {
                            throw new Error('Original file was removed but optimization failed');
                        }
                        return {
                            success: true,
                            originalSize,
                            optimizedSize: originalSize,
                            savings: '0%',
                            skipped: true
                        };
                    }
                }
            }
            throw new Error('No output file created');
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Optimize images
async function optimizeImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    const dir = path.dirname(filePath);
    const backupPath = path.join(dir, `.${fileName}.backup`);

    console.log(chalk.blue(`Optimizing: ${fileName}`));

    // Create backup first
    fs.copyFileSync(filePath, backupPath);

    try {
        let result;
        if (ext === '.jpg' || ext === '.jpeg') {
            result = await optimizeJPEG(filePath, filePath);
        } else if (ext === '.png') {
            result = await optimizePNG(filePath, filePath);
        } else {
            console.log(chalk.yellow(`  ⊘ Skipping ${fileName} - unsupported format`));
            fs.unlinkSync(backupPath);
            return;
        }

        if (result.success) {
            // Verify the output file exists and has the same name
            if (fs.existsSync(filePath)) {
                if (result.skipped) {
                    // Optimization didn't help - restore original from backup
                    fs.copyFileSync(backupPath, filePath);
                    console.log(chalk.yellow(`  ⊘ Skipped ${fileName} (${result.originalSize}MB - optimization didn't reduce size)`));
                } else {
                    const sizeMB = parseFloat(result.optimizedSize);
                    if (sizeMB > 25) {
                        console.log(chalk.yellow(`  ⚠ Reduced from ${result.originalSize}MB to ${result.optimizedSize}MB (${result.savings} savings) - WARNING: Still over 25MB!`));
                    } else {
                        console.log(chalk.green(`  ✓ Reduced from ${result.originalSize}MB to ${result.optimizedSize}MB (${result.savings} savings)`));
                    }
                }
                // Remove backup if optimization was successful or skipped
                fs.unlinkSync(backupPath);
            } else {
                throw new Error('Optimized file not found');
            }
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.log(chalk.red(`  ✗ Failed: ${error.message}`));
        // Restore backup - ensure original file name is preserved
        if (fs.existsSync(backupPath)) {
            fs.copyFileSync(backupPath, filePath);
            fs.unlinkSync(backupPath);
        }
    }
}

// Optimize MP4 videos
async function optimizeMP4(inputPath, outputPath) {
    try {
        const originalSize = getFileSize(inputPath);
        const originalSizeMB = parseFloat(originalSize);
        
        // Optimize files over 10MB (including hero video which is 17MB)
        // Skip only if file is already well optimized (<10MB)
        if (originalSizeMB < 10) {
            return {
                success: true,
                originalSize,
                optimizedSize: originalSize,
                savings: '0%',
                skipped: true
            };
        }

        // Create temporary output path in same directory with same extension
        const dir = path.dirname(inputPath);
        const ext = path.extname(inputPath);
        const baseName = path.basename(inputPath, ext);
        const tempPath = path.join(dir, `${baseName}.tmp${ext}`);

        // Use more aggressive compression for large files (>25MB)
        // For hero videos (10-25MB), use slightly more compression for faster loading
        const isLarge = originalSizeMB > 25;
        const isHeroVideo = originalSizeMB >= 10 && originalSizeMB <= 25;
        const crf = isLarge ? CONFIG.videos.mp4.crfLarge : (isHeroVideo ? 30 : CONFIG.videos.mp4.crf);

        // Use ffmpeg to compress video - preserve original filename
        // For hero videos, optimize for web: lower bitrate, faster preset, faststart for streaming
        const audioBitrate = isHeroVideo ? '96k' : '128k';
        const preset = isHeroVideo ? 'fast' : CONFIG.videos.mp4.preset;
        const command = `ffmpeg -i "${inputPath}" -c:v libx264 -crf ${crf} -preset ${preset} -c:a aac -b:a ${audioBitrate} -movflags +faststart -pix_fmt yuv420p "${tempPath}" -y`;

        execSync(command, { stdio: 'ignore' });

        // Check if optimized file exists and is smaller
        if (!fs.existsSync(tempPath)) {
            throw new Error('Optimized file was not created');
        }

        const optimizedSize = getFileSize(tempPath);
        const optimizedSizeMB = parseFloat(optimizedSize);
        
        // For large files, keep optimizing until under 25MB
        if (isLarge && optimizedSizeMB > 25 && optimizedSizeMB < originalSizeMB) {
            // File is still too large - try even more aggressive compression
            fs.unlinkSync(tempPath);
            const aggressiveCrf = Math.min(35, crf + 5);
            const aggressiveCommand = `ffmpeg -i "${inputPath}" -c:v libx264 -crf ${aggressiveCrf} -preset ${CONFIG.videos.mp4.preset} -c:a aac -b:a 96k -movflags +faststart "${tempPath}" -y`;
            execSync(aggressiveCommand, { stdio: 'ignore' });
            
            const aggressiveSize = getFileSize(tempPath);
            const aggressiveSizeMB = parseFloat(aggressiveSize);
            
            if (aggressiveSizeMB < originalSizeMB) {
                fs.unlinkSync(inputPath);
                fs.renameSync(tempPath, outputPath);
                const savings = ((originalSizeMB - aggressiveSizeMB) / originalSizeMB * 100).toFixed(1);
                return {
                    success: true,
                    originalSize,
                    optimizedSize: aggressiveSize,
                    savings: `${savings}%`,
                    warning: aggressiveSizeMB > 25 ? 'Still over 25MB but optimized' : null
                };
            }
        }
        
        if (optimizedSizeMB < originalSizeMB) {
            // Replace original with optimized - preserve original filename
            fs.unlinkSync(inputPath); // Remove original
            fs.renameSync(tempPath, outputPath); // Rename temp to original name
            const savings = ((originalSizeMB - optimizedSizeMB) / originalSizeMB * 100).toFixed(1);
            
            return {
                success: true,
                originalSize,
                optimizedSize,
                savings: `${savings}%`,
                warning: optimizedSizeMB > 25 ? 'Still over 25MB but optimized' : null
            };
        } else {
            // Keep original if optimization didn't help
            fs.unlinkSync(tempPath);
            return {
                success: true,
                originalSize,
                optimizedSize: originalSize,
                savings: '0%',
                skipped: true
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Optimize videos
async function optimizeVideo(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    const dir = path.dirname(filePath);
    const backupPath = path.join(dir, `.${fileName}.backup`);

    console.log(chalk.blue(`Optimizing: ${fileName}`));

    // Create backup first
    fs.copyFileSync(filePath, backupPath);

    try {
        let result;
        if (ext === '.mp4') {
            result = await optimizeMP4(filePath, filePath);
        } else {
            console.log(chalk.yellow(`  ⊘ Skipping ${fileName} - unsupported format`));
            fs.unlinkSync(backupPath);
            return;
        }

        if (result.success) {
            // Verify the output file exists and has the same name
            if (fs.existsSync(filePath)) {
                if (result.skipped) {
                    console.log(chalk.yellow(`  ⊘ Skipped (${result.originalSize}MB - already optimized or optimization didn't help)`));
                } else {
                    const sizeMB = parseFloat(result.optimizedSize);
                    if (sizeMB > 25) {
                        console.log(chalk.yellow(`  ⚠ Reduced from ${result.originalSize}MB to ${result.optimizedSize}MB (${result.savings} savings) - WARNING: Still over 25MB!`));
                    } else {
                        console.log(chalk.green(`  ✓ Reduced from ${result.originalSize}MB to ${result.optimizedSize}MB (${result.savings} savings)`));
                    }
                }
                // Remove backup if optimization was successful
                fs.unlinkSync(backupPath);
            } else {
                throw new Error('Optimized file not found');
            }
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.log(chalk.red(`  ✗ Failed: ${error.message}`));
        // Restore backup - ensure original file name is preserved
        if (fs.existsSync(backupPath)) {
            fs.copyFileSync(backupPath, filePath);
            fs.unlinkSync(backupPath);
        }
    }
}

// Find all image files
async function findImages() {
    const patterns = [
        'assets/images/**/*.jpg',
        'assets/images/**/*.jpeg',
        'assets/images/**/*.png'
    ];
    
    const files = [];
    for (const pattern of patterns) {
        const matches = await glob(pattern);
        files.push(...matches);
    }
    
    return files;
}

// Find all video files
async function findVideos() {
    const patterns = [
        'assets/videos/**/*.mp4',
        'assets/images/**/*.mp4'
    ];
    
    const files = [];
    for (const pattern of patterns) {
        const matches = await glob(pattern);
        files.push(...matches);
    }
    
    return files;
}

// Main function
async function main() {
    const args = process.argv.slice(2);
    const optimizeImages = args.includes('--images') || args.includes('--all') || args.length === 0;
    const optimizeVideos = args.includes('--videos') || args.includes('--all') || args.length === 0;

    console.log(chalk.cyan('🚀 Starting file optimization...\n'));

    // Check dependencies
    const deps = checkDependencies();
    
    if (optimizeImages && !deps.sharp) {
        console.log(chalk.red('Error: sharp is required for image optimization. Run: npm install'));
        process.exit(1);
    }

    if (optimizeVideos && !deps.ffmpeg) {
        console.log(chalk.red('Error: ffmpeg is required for video optimization. Install with: brew install ffmpeg'));
        process.exit(1);
    }

    // Optimize images
    if (optimizeImages) {
        console.log(chalk.cyan('📸 Optimizing images...\n'));
        const images = await findImages();
        
        if (images.length === 0) {
            console.log(chalk.yellow('No images found to optimize.'));
        } else {
            console.log(chalk.gray(`Found ${images.length} image(s) to optimize.\n`));
            
            for (const image of images) {
                await optimizeImage(image);
            }
            
            console.log(chalk.green(`\n✓ Optimized ${images.length} image(s).\n`));
        }
    }

    // Optimize videos
    if (optimizeVideos) {
        console.log(chalk.cyan('🎥 Optimizing videos...\n'));
        const videos = await findVideos();
        
        if (videos.length === 0) {
            console.log(chalk.yellow('No videos found to optimize.'));
        } else {
            console.log(chalk.gray(`Found ${videos.length} video(s) to optimize.\n`));
            
            for (const video of videos) {
                await optimizeVideo(video);
            }
            
            console.log(chalk.green(`\n✓ Optimized ${videos.length} video(s).\n`));
        }
    }

    console.log(chalk.cyan('✨ Optimization complete!'));
}

// Run the script
main().catch(error => {
    console.error(chalk.red('Error:'), error);
    process.exit(1);
});

