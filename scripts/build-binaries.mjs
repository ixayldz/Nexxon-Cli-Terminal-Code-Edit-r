#!/usr/bin/env node
/**
 * Build single-binary executables for Nexxon CLI using pkg
 * PRD Section 9: Distribution & Installation
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';

const execAsync = promisify(exec);

const TARGETS = [
    'node18-linux-x64',
    'node18-linux-arm64',
    'node18-macos-x64',
    'node18-macos-arm64',
    'node18-win-x64'
];

const OUTPUT_DIR = 'dist-binaries';

async function build() {
    console.log('🔨 Building Nexxon CLI binaries...');

    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Build TypeScript first
    console.log('📦 Building TypeScript packages...');
    await execAsync('npm run build');

    // Check if pkg is installed
    try {
        await execAsync('npx pkg --version');
    } catch {
        console.log('📥 Installing pkg...');
        await execAsync('npm install -g pkg');
    }

    // Build binaries for each target
    for (const target of TARGETS) {
        console.log(`🎯 Building for ${target}...`);
        const [, platform, arch] = target.match(/node\d+-(.*)-(.*)/) || [];
        const ext = platform === 'win' ? '.exe' : '';
        const outputName = `nexxon-${platform}-${arch}${ext}`;
        const outputPath = path.join(OUTPUT_DIR, outputName);

        try {
            await execAsync(
                `npx pkg packages/cli/dist/main.js --target ${target} --output ${outputPath}`
            );
            console.log(`✅ Built: ${outputName}`);
        } catch (error) {
            console.error(`❌ Failed to build ${target}:`, error.message);
        }
    }

    console.log(`\\n🎉 Build complete! Binaries available in ${OUTPUT_DIR}/`);
}

build().catch((err) => {
    console.error('❌ Build failed:', err);
    process.exit(1);
});
