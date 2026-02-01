const db = require('./lib/db');

module.exports = async function handler(req, res) {
    if (req.method === 'POST') {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'Missing userId' });
        await db.removeUserWallet(userId);
        return res.json({ success: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
};
