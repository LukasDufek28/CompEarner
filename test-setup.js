#!/usr/bin/env node

console.log('\n🧪 CompEarner Test Suite\n');
console.log('This will help you test your deployment locally.\n');

const tests = [
    {
        name: 'Dependencies Installed',
        check: () => {
            try {
                require('@vercel/kv');
                require('bcryptjs');
                require('jsonwebtoken');
                require('uuid');
                return true;
            } catch (e) {
                return false;
            }
        }
    },
    {
        name: 'Environment Variables Set',
        check: () => {
            const fs = require('fs');
            return fs.existsSync('.env.local');
        }
    },
    {
        name: 'Required Files Exist',
        check: () => {
            const fs = require('fs');
            return fs.existsSync('index.html') &&
                   fs.existsSync('admin.html') &&
                   fs.existsSync('styles.css') &&
                   fs.existsSync('script.js');
        }
    },
    {
        name: 'API Files Exist',
        check: () => {
            const fs = require('fs');
            return fs.existsSync('api/matches.js') &&
                   fs.existsSync('api/admin/login.js') &&
                   fs.existsSync('api/admin/finalize-match.js');
        }
    },
    {
        name: 'Vercel Config Valid',
        check: () => {
            try {
                const fs = require('fs');
                const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
                return config.version === 2;
            } catch (e) {
                return false;
            }
        }
    }
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
    const result = test.check();
    if (result) {
        console.log(`✅ ${test.name}`);
        passed++;
    } else {
        console.log(`❌ ${test.name}`);
        failed++;
    }
});

console.log('\n' + '─'.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('─'.repeat(50) + '\n');

if (failed === 0) {
    console.log('🎉 All tests passed! You\'re ready to deploy.');
    console.log('\nNext steps:');
    console.log('1. npm run setup     # Generate credentials');
    console.log('2. vercel --prod     # Deploy to production');
} else {
    console.log('⚠️  Some tests failed. Please fix the issues above.');
    
    if (!tests[0].check()) {
        console.log('\n📦 Run: npm install');
    }
    
    if (!tests[1].check()) {
        console.log('\n🔑 Run: npm run setup');
        console.log('   Then save output to .env.local');
    }
}

console.log('\n');
