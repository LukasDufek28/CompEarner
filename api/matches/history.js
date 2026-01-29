const { handleCors } = require('../lib/auth');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
        const tag = urlParams.get('tag');
        if (!tag) {
            return res.status(400).json({ error: 'Missing tag parameter' });
        }
        const cleanTag = tag.replace(/^#/, '').toUpperCase();
        const response = await fetch(`https://royaleapi.com/player/${cleanTag}/battles`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (!response.ok) {
            return res.status(500).json({ error: `Failed to fetch battles: ${response.status}` });
        }
        const html = await response.text();
        const $ = cheerio.load(html);
        const battles = [];

        // Minimal battle outcome extraction (win/loss/draw only)
        const allElements = $('*');
        const battleContainers = [];
        allElements.each((i, elem) => {
            const $elem = $(elem);
            const text = $elem.text();
            if (text.includes('Defeat') || text.includes('Victory') || text.includes('Draw')) {
                battleContainers.push($elem);
            }
        });

        // Only push unique matches per opponent (first found per scrape)
        const seenOpponent = new Set();
        let uniqueCount = 0;
        for (let i = 0; i < battleContainers.length && uniqueCount < 3; i++) {
            const $container = battleContainers[i];
            const containerText = $container.text();

            // Find opponent name and tag by searching up and down from the result container
            let opponentName = 'Unknown';
            let opponentTag = '#???';
            let found = false;
            $container.find('a.player_name_header').each((j, link) => {
                const $link = $(link);
                const opponentHref = $link.attr('href') || '';
                const opponentTagMatch = opponentHref.match(/\/player\/([A-Z0-9]+)/);
                if (opponentTagMatch && opponentTagMatch[1] !== cleanTag) {
                    opponentName = $link.text().trim();
                    opponentTag = `#${opponentTagMatch[1]}`;
                    found = true;
                    return false;
                }
            });
            if (!found) {
                $container.parents().find('a.player_name_header').each((j, link) => {
                    const $link = $(link);
                    const opponentHref = $link.attr('href') || '';
                    const opponentTagMatch = opponentHref.match(/\/player\/([A-Z0-9]+)/);
                    if (opponentTagMatch && opponentTagMatch[1] !== cleanTag) {
                        opponentName = $link.text().trim();
                        opponentTag = `#${opponentTagMatch[1]}`;
                        found = true;
                        return false;
                    }
                });
            }

            // Only allow one match per opponent per scrape
            const opponentKey = `${opponentTag}|${opponentName}`;
            if (seenOpponent.has(opponentKey)) continue;
            seenOpponent.add(opponentKey);

            // Extract crown scores - look for pattern "X - Y"
            let crowns = 0;
            let opponentCrowns = 0;
            const crownMatch = containerText.match(/(\d+)\s*[-–—]\s*(\d+)/);
            if (crownMatch) {
                crowns = parseInt(crownMatch[1]) || 0;
                opponentCrowns = parseInt(crownMatch[2]) || 0;
            }

            // Determine win/loss/draw only
            let outcome = 'draw';
            if (crowns > opponentCrowns) {
                outcome = 'win';
            } else if (opponentCrowns > crowns) {
                outcome = 'loss';
            }

            // Extract UTC date from .battle-timestamp-popup
            let utcString = null;
            // Look for the closest .battle-timestamp-popup element inside or near the container
            let $timestamp = $container.find('.battle-timestamp-popup').first();
            if (!$timestamp.length) {
                $timestamp = $container.parents().find('.battle-timestamp-popup').first();
            }
            if ($timestamp.length) {
                utcString = $timestamp.attr('data-content') || null;
            }

            battles.push({
                playerTag: `#${cleanTag}`,
                playerName: 'You',
                opponentTag,
                opponentName,
                outcome,
                utcString // <-- add UTC string for frontend parsing
            });
            uniqueCount++;
        }

        return res.status(200).json({
            success: true,
            battles: battles.length > 0 ? battles : [{
                playerTag: `#${cleanTag}`,
                playerName: 'You',
                opponentTag: '#???',
                opponentName: 'No recent battles',
                outcome: 'unknown'
            }]
        });
    } catch (error) {
        console.error('Error fetching battle history:', error);
        return res.status(500).json({ error: 'Failed to fetch battle history: ' + error.message });
    }
}

module.exports = handleCors(handler);
