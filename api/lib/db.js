// Database helper using Vercel KV
// If KV is not available, falls back to in-memory storage

let kv;
let inMemoryDB = {
    users: new Map(),
    matches: new Map(),
    transactions: []
};

async function initDB() {
    try {
        const { kv: kvStore } = await import('@vercel/kv');
        kv = kvStore;
        console.log('Using Vercel KV storage');
    } catch (error) {
        console.log('Vercel KV not available, using in-memory storage');
        kv = null;
    }
}

// User operations
async function getUser(userId) {
    if (kv) {
        return await kv.get(`user:${userId}`);
    }
    return inMemoryDB.users.get(userId);
}

async function setUser(userId, userData) {
    if (kv) {
        await kv.set(`user:${userId}`, userData);
    } else {
        inMemoryDB.users.set(userId, userData);
    }
}

async function getAllUsers() {
    if (kv) {
        const keys = await kv.keys('user:*');
        const users = await Promise.all(keys.map(key => kv.get(key)));
        return users.filter(u => u !== null);
    }
    return Array.from(inMemoryDB.users.values());
}

// Check if username is taken
async function isUsernameTaken(username, excludeUserId = null) {
    const users = await getAllUsers();
    return users.some(u => u.username.toLowerCase() === username.toLowerCase() && u.userId !== excludeUserId);
}

// Get user by email
async function getUserByEmail(email) {
    const users = await getAllUsers();
    return users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
}

// Match operations
async function getMatch(matchId) {
    if (kv) {
        return await kv.get(`match:${matchId}`);
    }
    return inMemoryDB.matches.get(matchId);
}

async function setMatch(matchId, matchData) {
    if (kv) {
        await kv.set(`match:${matchId}`, matchData);
    } else {
        inMemoryDB.matches.set(matchId, matchData);
    }
}

async function getAllMatches() {
    if (kv) {
        const keys = await kv.keys('match:*');
        const matches = await Promise.all(keys.map(key => kv.get(key)));
        return matches.filter(m => m !== null);
    }
    return Array.from(inMemoryDB.matches.values());
}

async function deleteMatch(matchId) {
    if (kv) {
        await kv.del(`match:${matchId}`);
    } else {
        inMemoryDB.matches.delete(matchId);
    }
}

// Transaction log
async function logTransaction(transaction) {
    if (kv) {
        const txId = `tx:${Date.now()}:${Math.random()}`;
        await kv.set(txId, transaction);
        await kv.expire(txId, 60 * 60 * 24 * 90); // Keep for 90 days
    } else {
        inMemoryDB.transactions.push(transaction);
    }
}

// Initialize seed data for development
async function initializeSeedData() {
    const users = await getAllUsers();
    if (users.length === 0) {
        // Create sample users
        const sampleUsers = [
            { userId: 'user1', username: 'xShadowKing', balance: 500, wins: 15, losses: 3 },
            { userId: 'user2', username: 'PhoenixRising', balance: 350, wins: 10, losses: 5 },
            { userId: 'user3', username: 'AceSniper', balance: 700, wins: 20, losses: 2 },
            { userId: 'user4', username: 'GhostReaper', balance: 250, wins: 8, losses: 7 }
        ];

        for (const user of sampleUsers) {
            await setUser(user.userId, user);
        }
    }
}

module.exports = {
    initDB,
    getUser,
    setUser,
    getAllUsers,
    isUsernameTaken,
    getUserByEmail,
    getMatch,
    setMatch,
    getAllMatches,
    deleteMatch,
    logTransaction,
    initializeSeedData
};
