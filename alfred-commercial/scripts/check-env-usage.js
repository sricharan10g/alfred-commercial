const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const ALLOWED_FILES = ['config.ts', 'server/config.ts'].map(f => path.join(SRC_DIR, f));

function checkFile(filePath) {
    if (ALLOWED_FILES.some(allowed => filePath === allowed || filePath.startsWith(allowed))) {
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('process.env')) {
        console.error(`❌ Rule Violation: process.env used in ${filePath}`);
        console.error('   Please use src/config.ts or src/server/config.ts instead.');
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

console.log('🔍 Checking for direct process.env usage...');
if (fs.existsSync(SRC_DIR)) {
    walkDir(SRC_DIR);
}
console.log('✅ process.env check passed.');
