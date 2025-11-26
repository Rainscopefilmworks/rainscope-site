#!/usr/bin/env node

/**
 * Batch Upload Script for Cloudflare R2
 * 
 * Uploads multiple files to R2, maintaining folder structure
 * 
 * Usage:
 *   node r2-batch-upload.js <directory>
 * 
 * Example:
 *   node r2-batch-upload.js assets/videos/work
 *   node r2-batch-upload.js assets/images/posters
 */

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Load configuration (look in parent directory since scripts are in scripts/ folder)
let config;
try {
    config = require('../r2-config.json');
} catch (error) {
    console.error('❌ Error: r2-config.json not found!');
    console.error('Please create r2-config.json in the project root with your R2 credentials.');
    process.exit(1);
}

// Initialize S3 client for R2
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
    },
});

// Content type mapping
const contentTypes = {
    '.mp4': 'video/mp4',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
};

async function uploadFile(filePath, baseDir) {
    const fileContent = fs.readFileSync(filePath);
    let relativePath = path.relative(baseDir, filePath);
    
    // Maintain images/ or videos/ prefix in R2 structure
    // If uploading from assets/images, prefix should be images/
    // If uploading from assets/videos, prefix should be videos/
    if (baseDir.includes('assets/images')) {
        relativePath = path.join('images', relativePath);
    } else if (baseDir.includes('assets/videos')) {
        relativePath = path.join('videos', relativePath);
    }
    
    const key = relativePath.replace(/\\/g, '/'); // Normalize path separators
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = contentTypes[ext] || 'application/octet-stream';

    try {
        const command = new PutObjectCommand({
            Bucket: config.bucketName,
            Key: key,
            Body: fileContent,
            ContentType: contentType,
            ACL: 'public-read',
        });

        await s3Client.send(command);
        const publicUrl = config.publicUrl.endsWith('/') 
            ? `${config.publicUrl}${key}`
            : `${config.publicUrl}/${key}`;
        
        return { success: true, key, url: publicUrl };
    } catch (error) {
        return { success: false, key, error: error.message };
    }
}

function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            getAllFiles(filePath, fileList);
        } else {
            // Only include media files
            const ext = path.extname(file).toLowerCase();
            if (['.mp4', '.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                fileList.push(filePath);
            }
        }
    });
    
    return fileList;
}

async function batchUpload(directory) {
    if (!fs.existsSync(directory)) {
        console.error(`❌ Error: Directory not found: ${directory}`);
        process.exit(1);
    }

    const files = getAllFiles(directory);
    
    if (files.length === 0) {
        console.log('ℹ️  No media files found in directory');
        process.exit(0);
    }

    console.log(`📦 Found ${files.length} file(s) to upload\n`);

    const results = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = path.basename(file);
        process.stdout.write(`[${i + 1}/${files.length}] Uploading ${fileName}... `);
        
        const result = await uploadFile(file, directory);
        results.push(result);
        
        if (result.success) {
            console.log('✅');
        } else {
            console.log(`❌ Error: ${result.error}`);
        }
    }

    console.log('\n📊 Upload Summary:');
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`   ✅ Successful: ${successful.length}`);
    console.log(`   ❌ Failed: ${failed.length}`);

    if (successful.length > 0) {
        console.log('\n📋 Public URLs:');
        successful.forEach(result => {
            console.log(`   ${result.url}`);
        });
    }

    if (failed.length > 0) {
        console.log('\n❌ Failed uploads:');
        failed.forEach(result => {
            console.log(`   ${result.key}: ${result.error}`);
        });
        process.exit(1);
    }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('📦 Cloudflare R2 Batch Upload Script');
    console.log('\nUsage:');
    console.log('  node r2-batch-upload.js <directory>');
    console.log('\nExamples:');
    console.log('  node r2-batch-upload.js assets/videos/work');
    console.log('  node r2-batch-upload.js assets/images/posters');
    process.exit(0);
}

batchUpload(args[0]);

