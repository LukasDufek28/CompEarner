const { handleCors, requireAuth } = require('./lib/auth');
const { initDB, getUser, setUser, isUsernameTaken } = require('./lib/db');

async function handler(req, res) {
    await initDB();

    // GET /api/user?userId=xxx or /api/user (authenticated)
    if (req.method === 'GET') {
        try {
            const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
            const userId = urlParams.get('userId') || req.user?.userId;

            if (!userId) {
                return res.status(400).json({ error: 'User ID required' });
            }

            const user = await getUser(userId);
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Return public profile data
            return res.status(200).json({
                success: true,
                user: {
                    userId: user.userId,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    balance: user.balance,
                    wins: user.wins,
                    losses: user.losses,
                    totalWagered: user.totalWagered || 0,
                    totalWon: user.totalWon || 0,
                    memberSince: user.createdAt,
                    winRate: user.wins + user.losses > 0 
                        ? ((user.wins / (user.wins + user.losses)) * 100).toFixed(1)
                        : 0,
                    clashRoyaleTag: user.clashRoyaleTag || null,
                    clashRoyaleName: user.clashRoyaleName || null
                }
            });
        } catch (error) {
            console.error('Error fetching user:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // PUT /api/user - Update profile (requires auth)
    if (req.method === 'PUT') {
        // Require authentication for updates
        const authResult = await new Promise((resolve) => {
            requireAuth(async (authReq, authRes) => {
                resolve({ req: authReq, res: authRes, authorized: true });
            })(req, res);
        });

        if (!authResult.authorized) {
            return; // Auth middleware already sent response
        }

        try {
            const { username, clashRoyaleTag } = req.body;

            if (!username || username.length < 3 || username.length > 20) {
                return res.status(400).json({ error: 'Username must be 3-20 characters' });
            }

            // Check if username is taken
            const taken = await isUsernameTaken(username, req.user.userId);
            if (taken) {
                return res.status(400).json({ error: 'Username already taken' });
            }

            // Get current user
            const user = await getUser(req.user.userId);
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }


            // Update username
            user.username = username;
            // Optionally update Clash Royale tag
            if (typeof clashRoyaleTag === 'string') {
                user.clashRoyaleTag = clashRoyaleTag.trim();
            }
            await setUser(user.userId, user);

            return res.status(200).json({
                success: true,
                user: {
                    userId: user.userId,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    clashRoyaleTag: user.clashRoyaleTag || null,
                    clashRoyaleName: user.clashRoyaleName || null
                }
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

module.exports = handleCors(handler);
