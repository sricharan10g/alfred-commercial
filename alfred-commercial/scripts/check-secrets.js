const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
// Forbidden keys that should NEVER appear in client bundles or client code
const FORBIDDEN_KEYS = [
    'APPWRITE_API_KEY',
    'AI_PROVIDER_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'GEMINI_API_KEY', // Old variable name
    'API_KEY'         // Generic old variable name
];

function checkFile(filePath) {
    // Skip server config file
    if (filePath.endsWith('server/config.ts')) return;

    const content = fs.readFileSync(filePath, 'utf8');

    // Skip files with "use server" directive
    if (content.match(/^['"]use server['"]/m)) {
        return;
    }

    for (const key of FORBIDDEN_KEYS) {
        if (content.includes(key)) {
            // Allow creating the config object in config.ts (if we were putting them there, but we aren't)
            // But here we are strict. Only server/config.ts can have them.
            console.error(`❌ Rule Violation: Secret key name "${key}" found in ${filePath}`);
            console.error('   Secrets must strictly be in src/server/config.ts only.');
            process.exit(1);
        }
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

console.log('🔍 Checking for secrets in client code...');
if (fs.existsSync(SRC_DIR)) {
    walkDir(SRC_DIR);
}
console.log('✅ Secrets check passed.');
