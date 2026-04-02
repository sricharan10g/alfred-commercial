const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Simple check for localhost:PORT or http://localhost
    if (content.match(/localhost:\d+/) || content.includes('http://localhost') || content.includes('127.0.0.1')) {
        // Ignore this script itself if it were in src (it's not)
        console.error(`❌ Rule Violation: "localhost" or "127.0.0.1" found in ${filePath}`);
        process.exit(1);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
            checkFile(filePath);
        }
    }
}

console.log('🔍 Checking for localhost hardcoding...');
if (fs.existsSync(SRC_DIR)) {
    walkDir(SRC_DIR);
}
console.log('✅ Localhost check passed.');
