// clash-royale-api.js
// Utility for checking recent matches between two Clash Royale tags
const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Checks if two Clash Royale players have played a match against each other in the last 24 hours.
 * Scrapes battle history from RoyaleAPI website.
 * @param {string} tag1 - Player 1 tag (with or without #)
 * @param {string} tag2 - Player 2 tag (with or without #)
 * @param {string} apiKey - Not used for scraping, kept for compatibility
 * @returns {Promise<{found: boolean, result?: {winner: string, loser: string, draw: boolean, battleTime: string, battleType: string, raw: object}}>} 
 */
async function checkRecentBattle(tag1, tag2, apiKey) {
    const cleanTag = t => t.replace(/^#/, '').toUpperCase();
    tag1 = cleanTag(tag1);
    tag2 = cleanTag(tag2);
    
    try {
        // Scrape battle history from RoyaleAPI
        const response = await fetch(`https://royaleapi.com/player/${tag1}/battles`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            return { found: false, error: `Failed to fetch battles: ${response.status}` };
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Look for battles in the HTML
        // RoyaleAPI typically shows battles in a table or list format
        const battles = [];
        const now = Date.now();
        
        // Try to find battle cards or rows
        $('.battle_card, .battle__row, tr[data-battle]').each((i, elem) => {
            const $elem = $(elem);
            const battleText = $elem.text().toLowerCase();
            const battleHtml = $elem.html().toLowerCase();
            
            // Check if opponent tag is present
            if (battleHtml.includes(tag2.toLowerCase()) || battleText.includes(`#${tag2.toLowerCase()}`)) {
                // Try to extract battle time
                const timeText = $elem.find('.battle__time, .time, [data-time]').first().text();
                
                // Try to determine winner from crowns or result indicators
                const crownsText = $elem.text();
                const hasWin = battleHtml.includes('victory') || battleHtml.includes('win') || crownsText.includes('👑');
                const hasLoss = battleHtml.includes('defeat') || battleHtml.includes('loss');
                const hasDraw = battleHtml.includes('draw') || battleHtml.includes('tie');
                
                battles.push({
                    timeText,
                    hasWin,
                    hasLoss,
                    hasDraw,
                    html: $elem.html()
                });
            }
        });
        
        // If we found a recent battle against tag2
        if (battles.length > 0) {
            const battle = battles[0]; // Most recent
            
            let winner = null, loser = null, draw = false;
            
            if (battle.hasDraw) {
                draw = true;
            } else if (battle.hasWin) {
                winner = tag1;
                loser = tag2;
            } else if (battle.hasLoss) {
                winner = tag2;
                loser = tag1;
            } else {
                // Try to parse crowns from HTML
                const crownMatches = battle.html.match(/(\d+)\s*[-:vs]\s*(\d+)/);
                if (crownMatches) {
                    const crowns1 = parseInt(crownMatches[1]);
                    const crowns2 = parseInt(crownMatches[2]);
                    if (crowns1 > crowns2) {
                        winner = tag1;
                        loser = tag2;
                    } else if (crowns2 > crowns1) {
                        winner = tag2;
                        loser = tag1;
                    } else {
                        draw = true;
                    }
                }
            }
            
            return {
                found: true,
                result: {
                    winner,
                    loser,
                    draw,
                    battleTime: new Date().toISOString(),
                    battleType: 'PvP',
                    raw: battle
                }
            };
        }
        
        return { found: false, error: 'No recent battle found between these players' };
    } catch (err) {
        console.error('Error scraping battles:', err);
        return { found: false, error: err.message };
    }
}

module.exports = { checkRecentBattle };