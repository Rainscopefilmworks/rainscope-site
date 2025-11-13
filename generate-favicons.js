const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const SIZES = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 }
];

async function generateFavicons(sourceImage, outputDir = 'assets/images') {
    try {
        if (!fs.existsSync(sourceImage)) {
            console.error(chalk.red(`Error: Source image not found: ${sourceImage}`));
            console.log(chalk.yellow(`\nPlease provide the path to your logomark image.`));
            console.log(chalk.yellow(`Example: node generate-favicons.js path/to/your/logo.png`));
            process.exit(1);
        }

        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        console.log(chalk.blue(`\nGenerating favicon files from: ${sourceImage}`));
        console.log(chalk.blue(`Output directory: ${outputDir}\n`));

        // Generate each favicon size
        for (const { name, size } of SIZES) {
            const outputPath = path.join(outputDir, name);
            
            try {
                await sharp(sourceImage)
                    .resize(size, size, {
                        fit: 'contain',
                        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
                    })
                    .png()
                    .toFile(outputPath);
                
                const stats = fs.statSync(outputPath);
                const fileSizeKB = (stats.size / 1024).toFixed(2);
                console.log(chalk.green(`  ✓ Created ${name} (${size}x${size}, ${fileSizeKB}KB)`));
            } catch (error) {
                console.error(chalk.red(`  ✗ Failed to create ${name}: ${error.message}`));
            }
        }

        console.log(chalk.green(`\n✅ Favicon generation complete!`));
        console.log(chalk.blue(`\nFavicon files have been generated in: ${outputDir}`));
        console.log(chalk.blue(`The HTML code is already in place in index.html.\n`));
        
    } catch (error) {
        console.error(chalk.red(`\nError: ${error.message}`));
        process.exit(1);
    }
}

// Get source image path from command line argument
const sourceImage = process.argv[2];

if (!sourceImage) {
    console.log(chalk.yellow('\nUsage: node generate-favicons.js <path-to-source-image>'));
    console.log(chalk.yellow('\nExample:'));
    console.log(chalk.yellow('  node generate-favicons.js assets/images/logo.png'));
    console.log(chalk.yellow('  node generate-favicons.js path/to/your/logomark.png\n'));
    process.exit(1);
}

generateFavicons(sourceImage);

