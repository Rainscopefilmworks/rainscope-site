#!/usr/bin/env node

/**
 * Simple Cloudflare R2 Upload Script
 * 
 * Usage:
 *   node r2-upload.js <file-path> [destination-path]
 * 
 * Example:
 *   node r2-upload.js assets/videos/work/work-1.mp4 videos/work/work-1.mp4
 *   node r2-upload.js assets/images/posters/poster-1.jpg images/posters/poster-1.jpg
 */

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Load configuration
let config;
try {
    config = require('./r2-config.json');
} catch (error) {
    console.error('❌ Error: r2-config.json not found!');
    console.error('Please create r2-config.json with your R2 credentials.');
    console.error('\nExample r2-config.json:');
    console.error(JSON.stringify({
        accountId: 'your-account-id',
        accessKeyId: 'your-access-key-id',
        secretAccessKey: 'your-secret-access-key',
        bucketName: 'your-bucket-name',
        publicUrl: 'https://your-bucket.r2.dev' // or your custom domain
    }, null, 2));
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

async function uploadFile(filePath, destinationPath) {
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Error: File not found: ${filePath}`);
            process.exit(1);
        }

        // Read file
        const fileContent = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);
        
        // Use destination path or default to same structure
        const key = destinationPath || filePath.replace(/^assets\//, '');
        
        // Determine content type
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
            '.mp4': 'video/mp4',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
        };
        const contentType = contentTypes[ext] || 'application/octet-stream';

        console.log(`📤 Uploading ${fileName}...`);
        console.log(`   From: ${filePath}`);
        console.log(`   To: ${key}`);

        // Upload to R2
        const command = new PutObjectCommand({
            Bucket: config.bucketName,
            Key: key,
            Body: fileContent,
            ContentType: contentType,
            // Make file publicly accessible
            ACL: 'public-read',
        });

        await s3Client.send(command);

        // Construct public URL
        const publicUrl = config.publicUrl.endsWith('/') 
            ? `${config.publicUrl}${key}`
            : `${config.publicUrl}/${key}`;

        console.log(`✅ Upload successful!`);
        console.log(`   Public URL: ${publicUrl}`);
        console.log(`\n💡 Use this URL in your HTML:`);
        console.log(`   <source src="${publicUrl}" type="${contentType}">`);
        console.log(`   or`);
        console.log(`   <img src="${publicUrl}" alt="...">`);

    } catch (error) {
        console.error('❌ Upload failed:', error.message);
        if (error.$metadata) {
            console.error('   Status:', error.$metadata.httpStatusCode);
        }
        process.exit(1);
    }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('📦 Cloudflare R2 Upload Script');
    console.log('\nUsage:');
    console.log('  node r2-upload.js <file-path> [destination-path]');
    console.log('\nExamples:');
    console.log('  node r2-upload.js assets/videos/work/work-1.mp4');
    console.log('  node r2-upload.js assets/images/posters/poster-1.jpg images/posters/poster-1.jpg');
    process.exit(0);
}

const [filePath, destinationPath] = args;
uploadFile(filePath, destinationPath);

