const { handleCors, requireAuth } = require('../lib/auth');
const { initDB, getUser, setUser } = require('../lib/db');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function handler(req, res) {
    await initDB();
    
    // POST /api/user/link-clashroyale - Link Clash Royale account (requires auth)
    if (req.method === 'POST') {
        // Require authentication for linking
        const authResult = await new Promise((resolve) => {
            requireAuth(async (authReq, authRes) => {
                resolve({ req: authReq, res: authRes, authorized: true });
            })(req, res);
        });
        
        if (!authResult.authorized) {
            return;
        }
        
        try {
            const { clashRoyaleTag } = req.body;
            const user = await getUser(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            // If tag is empty string, unlink
            if (clashRoyaleTag === '') {
                user.clashRoyaleTag = undefined;
                user.clashRoyaleName = undefined;
                await setUser(user.userId, user);
                return res.status(200).json({ success: true, unlinked: true });
            }
            if (!clashRoyaleTag || typeof clashRoyaleTag !== 'string' || !clashRoyaleTag.trim()) {
                return res.status(400).json({ error: 'Clash Royale tag required' });
            }
            
            // Scrape player name from RoyaleAPI website
            let playerName = null;
            let clashApiError = null;
            try {
                const cleanTag = clashRoyaleTag.trim().replace(/^#/, '').toUpperCase();
                const response = await fetch(`https://royaleapi.com/player/${cleanTag}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                
                if (response.ok) {
                    const html = await response.text();
                    const $ = cheerio.load(html);
                    
                    // Try multiple selectors to find player name
                    playerName = $('h1.ui.header').first().text().trim() ||
                                 $('.player__name').first().text().trim() ||
                                 $('meta[property="og:title"]').attr('content')?.split(' - ')[0]?.trim();
                    
                    if (!playerName) {
                        clashApiError = 'Could not find player name on page';
                    }
                } else {
                    clashApiError = `Player not found (status: ${response.status})`;
                }
            } catch (err) {
                clashApiError = err.message;
                console.log('Error scraping player name:', err.message);
            }
            
            user.clashRoyaleTag = clashRoyaleTag.trim();
            user.clashRoyaleName = playerName;
            await setUser(user.userId, user);
            
            if (clashApiError) {
                return res.status(400).json({
                    error: 'Could not fetch player data',
                    message: clashApiError
                });
            }
            return res.status(200).json({ 
                success: true, 
                clashRoyaleTag: user.clashRoyaleTag,
                clashRoyaleName: user.clashRoyaleName 
            });
        } catch (error) {
            console.error('Error linking Clash Royale tag:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}

module.exports = handleCors(handler);
