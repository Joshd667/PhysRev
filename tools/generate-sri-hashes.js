#!/usr/bin/env node
/**
 * Generate SRI Hashes for CDN Dependencies
 *
 * This script generates Subresource Integrity (SRI) hashes for all CDN dependencies
 * used in the Physics Audit Tool. Run this script whenever you update CDN versions.
 *
 * Usage:
 *   node tools/generate-sri-hashes.js
 *
 * Requirements:
 *   - Node.js installed
 *   - Internet connection to fetch CDN resources
 *
 * What is SRI?
 *   Subresource Integrity (SRI) is a security feature that enables browsers to verify
 *   that files they fetch from CDNs haven't been tampered with. It works by comparing
 *   a cryptographic hash of the downloaded file with a known hash embedded in the HTML.
 *
 * Why is this important?
 *   - Protects against CDN compromises
 *   - Ensures exact version integrity
 *   - Prevents supply chain attacks
 *   - Industry security best practice
 */

const crypto = require('crypto');
const https = require('https');

// CDN dependencies to generate hashes for
const DEPENDENCIES = [
    {
        name: 'Alpine.js',
        url: 'https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/module.esm.js',
        version: '3.13.3'
    },
    {
        name: 'DOMPurify',
        url: 'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js',
        version: '3.0.6'
    },
    {
        name: 'Chart.js',
        url: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
        version: '4.4.1',
        note: 'Note: Currently loaded without version. Consider pinning to 4.4.1'
    },
    {
        name: 'Lucide Icons',
        url: 'https://unpkg.com/lucide@0.546.0/dist/umd/lucide.min.js',
        version: '0.546.0'
    }
];

/**
 * Fetch a URL and return its content
 */
function fetchURL(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: { 'User-Agent': 'SRI-Generator/1.0' },
            followRedirect: true
        }, (res) => {
            // Follow redirects
            if (res.statusCode === 301 || res.statusCode === 302) {
                return fetchURL(res.headers.location).then(resolve).catch(reject);
            }

            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                return;
            }

            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Generate SRI hash for content
 */
function generateSRIHash(content, algorithm = 'sha384') {
    const hash = crypto.createHash(algorithm).update(content).digest('base64');
    return `${algorithm}-${hash}`;
}

/**
 * Main function
 */
async function main() {
    console.log('🔒 Generating SRI Hashes for CDN Dependencies\n');
    console.log('=' .repeat(70));

    const results = [];

    for (const dep of DEPENDENCIES) {
        try {
            console.log(`\n📦 ${dep.name} v${dep.version}`);
            console.log(`   URL: ${dep.url}`);
            console.log('   Fetching...');

            const content = await fetchURL(dep.url);
            const sriHash = generateSRIHash(content);

            console.log(`   ✅ Hash: ${sriHash}`);
            if (dep.note) {
                console.log(`   ℹ️  ${dep.note}`);
            }

            results.push({
                ...dep,
                sriHash,
                fileSize: (content.length / 1024).toFixed(2) + ' KB'
            });

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            results.push({
                ...dep,
                error: error.message
            });
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📋 SUMMARY - Copy these to index.html:\n');

    results.forEach(result => {
        if (result.sriHash) {
            console.log(`<!-- ${result.name} v${result.version} (${result.fileSize}) -->`);
            console.log(`integrity="${result.sriHash}" crossorigin="anonymous"\n`);
        }
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Done! Copy the integrity attributes to your script tags in index.html');
    console.log('\n💡 TIP: Re-run this script whenever you update CDN dependency versions');
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { generateSRIHash, fetchURL };
