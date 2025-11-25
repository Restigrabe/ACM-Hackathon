const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Build client bundle
esbuild.build({
    entryPoints: ['src/map.ts'],
    bundle: true,
    outfile: 'dist/bundle.js',
    format: 'iife',
    target: 'es2020',
    loader: {
        '.css': 'css'
    },
    minify: process.argv.includes('--minify'),
    sourcemap: true
}).then(() => {
    console.log('Client bundle built successfully');
}).catch(() => process.exit(1));

// Build server
esbuild.build({
    entryPoints: ['src/server.ts'],
    bundle: true,
    outfile: 'dist/server.js',
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    sourcemap: true
}).then(() => {
    console.log('Server built successfully');
}).catch(() => process.exit(1));

// Copy index.html to dist
fs.copyFileSync('index.html', 'dist/index.html');
console.log('index.html copied to dist/');
