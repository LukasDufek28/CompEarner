const { handleCors } = require('./lib/auth');
const { initDB, getAllMatches, getAllUsers } = require('./lib/db');

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        await initDB();
        const matches = await getAllMatches();
        const users = await getAllUsers();
        const totalPaidOut = matches.filter(m => m.status === 'completed').reduce((sum, m) => sum + m.prizePool, 0);
        return res.status(200).json({
            totalPlayers: users.length,
            totalPaidOut
        });
    } catch (error) {
        console.error('Error fetching public stats:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = handleCors(handler);
