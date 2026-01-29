#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n🎮 CompEarner Setup Script\n');
console.log('This script will help you generate secure credentials for your admin account.\n');

rl.question('Enter admin username (default: admin): ', (username) => {
    const adminUsername = username.trim() || 'admin';
    
    rl.question('Enter admin password: ', (password) => {
        if (!password || password.length < 8) {
            console.error('\n❌ Password must be at least 8 characters long!');
            rl.close();
            process.exit(1);
        }
        
        // Generate password hash
        const passwordHash = bcrypt.hashSync(password, 10);
        
        // Generate JWT secret
        const jwtSecret = require('crypto').randomBytes(32).toString('base64');
        
        console.log('\n✅ Credentials generated successfully!\n');
        console.log('Add these environment variables to Vercel:\n');
        console.log('─'.repeat(60));
        console.log(`JWT_SECRET=${jwtSecret}`);
        console.log(`ADMIN_USERNAME=${adminUsername}`);
        console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
        console.log('─'.repeat(60));
        console.log('\nFor local development, create a .env.local file with:');
        console.log('─'.repeat(60));
        console.log(`JWT_SECRET="${jwtSecret}"`);
        console.log(`ADMIN_USERNAME="${adminUsername}"`);
        console.log(`ADMIN_PASSWORD_HASH="${passwordHash}"`);
        console.log('─'.repeat(60));
        console.log('\n📝 Save these credentials securely!\n');
        
        rl.close();
    });
});
