const bcrypt = require('bcryptjs');
const { handleCors, requireAuth, generateToken } = require('./lib/auth');
const { initDB, getMatch, setMatch, getUser, setUser, logTransaction, getAllMatches, getAllUsers } = require('./lib/db');

async function handler(req, res) {
    // POST /api/admin?action=login - Admin login
    // PATCH /api/admin?action=set-balance - Set user balance
    if (req.method === 'PATCH') {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const action = url.searchParams.get('action');

        // Only allow authenticated admin
        return requireAuth(async (authReq, authRes) => {
            await initDB();
            if (action === 'set-balance') {
                try {
                    const { userId, newBalance } = req.body;
                    if (!userId || typeof newBalance !== 'number') {
                        return res.status(400).json({ error: 'userId and newBalance (number) required' });
                    }
                    const user = await getUser(userId);
                    if (!user) {
                        return res.status(404).json({ error: 'User not found' });
                    }
                    user.balance = newBalance;
                    await setUser(userId, user);
                    await logTransaction({
                        type: 'admin_balance_set',
                        userId,
                        newBalance,
                        admin: authReq.user?.username || 'admin',
                        timestamp: new Date().toISOString()
                    });
                    return res.status(200).json({ success: true, userId, newBalance });
                } catch (error) {
                    console.error('Error setting balance:', error);
                    return res.status(500).json({ error: 'Internal server error' });
                }
            }
            return res.status(400).json({ error: 'Invalid action for PATCH. Use ?action=set-balance' });
        })(req, res);
    }

    if (req.method === 'POST') {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const action = url.searchParams.get('action');

        if (action === 'login') {
            try {
                const { username, password } = req.body;

                if (!username || !password) {
                    return res.status(400).json({ error: 'Missing credentials' });
                }

                const adminUsername = process.env.ADMIN_USERNAME || 'admin';
                const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '$2a$10$YourHashHere';

                if (username !== adminUsername) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                const isValidPassword = await bcrypt.compare(password, adminPasswordHash);
                
                if (!isValidPassword) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                const token = generateToken({ 
                    username,
                    role: 'admin',
                    loginAt: new Date().toISOString()
                });

                return res.status(200).json({ 
                    success: true,
                    token,
                    username
                });
            } catch (error) {
                console.error('Login error:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }

        // All other POST actions require authentication
        return requireAuth(async (authReq, authRes) => {
            await initDB();

            if (action === 'finalize') {
                try {
                    const { matchId, winnerId } = req.body;

                    if (!matchId || !winnerId) {
                        return res.status(400).json({ error: 'Missing required fields' });
                    }

                    const match = await getMatch(matchId);
                    if (!match) {
                        return res.status(404).json({ error: 'Match not found' });
                    }

                    if (match.status !== 'in-progress') {
                        return res.status(400).json({ error: 'Match must be in-progress to finalize' });
                    }

                    if (!match.player2) {
                        return res.status(400).json({ error: 'Match needs two players' });
                    }

                    if (winnerId !== match.player1.userId && winnerId !== match.player2.userId) {
                        return res.status(400).json({ error: 'Winner must be one of the match players' });
                    }

                    const isPlayer1Winner = winnerId === match.player1.userId;
                    const winnerUserId = winnerId;
                    const loserUserId = isPlayer1Winner ? match.player2.userId : match.player1.userId;

                    const winner = await getUser(winnerUserId);
                    const loser = await getUser(loserUserId);

                    if (!winner || !loser) {
                        return res.status(404).json({ error: 'Player not found' });
                    }

                    winner.balance += match.prizePool;
                    winner.wins += 1;
                    winner.totalWon = (winner.totalWon || 0) + match.prizePool;
                    await setUser(winnerUserId, winner);

                    loser.losses += 1;
                    await setUser(loserUserId, loser);

                    match.status = 'completed';
                    match.winner = winnerUserId;
                    match.finalizedAt = new Date().toISOString();
                    await setMatch(matchId, match);

                    await logTransaction({
                        type: 'match_finalized',
                        matchId,
                        winnerId: winnerUserId,
                        loserId: loserUserId,
                        prizeAmount: match.prizePool,
                        timestamp: new Date().toISOString()
                    });

                    await logTransaction({
                        type: 'payout',
                        matchId,
                        userId: winnerUserId,
                        amount: match.prizePool,
                        timestamp: new Date().toISOString()
                    });

                    return res.status(200).json({ 
                        success: true,
                        match,
                        winner: {
                            userId: winner.userId,
                            username: winner.username,
                            newBalance: winner.balance,
                            wins: winner.wins
                        },
                        loser: {
                            userId: loser.userId,
                            username: loser.username,
                            losses: loser.losses
                        }
                    });
                } catch (error) {
                    console.error('Error finalizing match:', error);
                    return res.status(500).json({ error: 'Internal server error' });
                }
            }

            if (action === 'cancel') {
                try {
                    const { matchId, reason } = req.body;

                    if (!matchId) {
                        return res.status(400).json({ error: 'Missing matchId' });
                    }

                    const match = await getMatch(matchId);
                    if (!match) {
                        return res.status(404).json({ error: 'Match not found' });
                    }

                    if (match.status === 'completed') {
                        return res.status(400).json({ error: 'Cannot cancel completed match' });
                    }

                    const player1 = await getUser(match.player1.userId);
                    if (player1) {
                        player1.balance += match.entryFee;
                        await setUser(match.player1.userId, player1);
                        
                        await logTransaction({
                            type: 'refund',
                            matchId,
                            userId: match.player1.userId,
                            amount: match.entryFee,
                            reason: reason || 'Match cancelled',
                            timestamp: new Date().toISOString()
                        });
                    }

                    if (match.player2) {
                        const player2 = await getUser(match.player2.userId);
                        if (player2) {
                            player2.balance += match.entryFee;
                            await setUser(match.player2.userId, player2);
                            
                            await logTransaction({
                                type: 'refund',
                                matchId,
                                userId: match.player2.userId,
                                amount: match.entryFee,
                                reason: reason || 'Match cancelled',
                                timestamp: new Date().toISOString()
                            });
                        }
                    }

                    match.status = 'cancelled';
                    match.cancelledAt = new Date().toISOString();
                    match.cancelReason = reason || 'Cancelled by admin';
                    await setMatch(matchId, match);

                    return res.status(200).json({ 
                        success: true,
                        message: 'Match cancelled and players refunded',
                        match
                    });
                } catch (error) {
                    console.error('Error cancelling match:', error);
                    return res.status(500).json({ error: 'Internal server error' });
                }
            }

            return res.status(400).json({ error: 'Invalid action. Use ?action=login, ?action=finalize, or ?action=cancel' });
        })(req, res);
    }

    // GET /api/admin?action=stats - Get platform statistics
    if (req.method === 'GET') {
        return requireAuth(async (authReq, authRes) => {
            try {
                await initDB();

                const matches = await getAllMatches();
                const users = await getAllUsers();

                const stats = {
                    totalMatches: matches.length,
                    openMatches: matches.filter(m => m.status === 'open').length,
                    inProgressMatches: matches.filter(m => m.status === 'in-progress').length,
                    completedMatches: matches.filter(m => m.status === 'completed').length,
                    cancelledMatches: matches.filter(m => m.status === 'cancelled').length,
                    totalUsers: users.length,
                    totalPrizePool: matches
                        .filter(m => m.status === 'in-progress' || m.status === 'open')
                        .reduce((sum, m) => sum + m.prizePool, 0),
                    totalPlatformFees: matches
                        .filter(m => m.status === 'completed')
                        .reduce((sum, m) => sum + (m.entryFee * 2 * 0.05), 0),
                    totalPaidOut: matches
                        .filter(m => m.status === 'completed')
                        .reduce((sum, m) => sum + m.prizePool, 0),
                    users: users.map(u => ({
                        userId: u.userId,
                        username: u.username,
                        walletAddress: u.walletAddress || null,
                        email: u.email,
                        balance: u.balance,
                        wins: u.wins,
                        losses: u.losses,
                        createdAt: u.createdAt
                    }))
                };

                return res.status(200).json({ stats });
            } catch (error) {
                console.error('Error fetching stats:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }
        })(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

module.exports = handleCors(handler);
