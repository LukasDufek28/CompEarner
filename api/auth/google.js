const { handleCors, generateToken } = require('../lib/auth');
const { initDB, getUser, setUser } = require('../lib/db');

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await initDB();

        const { credential, token } = req.body;
        const googleToken = credential || token;

        if (!googleToken) {
            return res.status(400).json({ error: 'Google token required' });
        }

        // Verify Google token
        const googleUser = await verifyGoogleToken(googleToken);
        
        if (!googleUser) {
            return res.status(401).json({ error: 'Invalid Google token' });
        }

        // Check if user exists
        let user = await getUser(googleUser.sub);

        if (!user) {
            // Create new user
            user = {
                userId: googleUser.sub,
                email: googleUser.email,
                username: googleUser.name || googleUser.email.split('@')[0],
                avatar: googleUser.picture,
                balance: 250.00, // Starting balance
                wins: 0,
                losses: 0,
                totalWagered: 0,
                totalWon: 0,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                provider: 'google'
            };

            await setUser(user.userId, user);
        } else {
            // Update last login
            user.lastLogin = new Date().toISOString();
            await setUser(user.userId, user);
        }

        // Generate JWT token
        const jwtToken = generateToken({
            userId: user.userId,
            email: user.email,
            username: user.username
        });

        return res.status(200).json({
            success: true,
            token: jwtToken,
            user: {
                userId: user.userId,
                email: user.email,
                username: user.username,
                avatar: user.avatar,
                balance: user.balance,
                wins: user.wins,
                losses: user.losses,
                totalWagered: user.totalWagered,
                totalWon: user.totalWon
            }
        });

    } catch (error) {
        console.error('Google auth error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
}

async function verifyGoogleToken(token) {
    try {
        // Verify with Google's tokeninfo endpoint
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        
        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        
        // Verify the token is for your app
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (clientId && data.aud !== clientId) {
            return null;
        }

        return data;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

module.exports = handleCors(handler);
