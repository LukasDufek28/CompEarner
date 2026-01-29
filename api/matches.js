const { handleCors } = require('./lib/auth');
const { initDB, getAllMatches, initializeSeedData, getUser, setUser, getMatch, setMatch, logTransaction } = require('./lib/db');
const { v4: uuidv4 } = require('uuid');
const { checkRecentBattle } = require('./clash-royale-api');

async function handler(req, res) {
        // POST /api/matches?action=verify-clashroyale - Verify Clash Royale match result (using RoyaleAPI scraping)
        if (req.method === 'POST' && req.url.includes('action=verify-clashroyale')) {
            try {
                const { matchId } = req.body;
                if (!matchId) {
                    return res.status(400).json({ error: 'Missing matchId' });
                }
                const match = await getMatch(matchId);
                if (!match || !match.player1 || !match.player2) {
                    return res.status(404).json({ error: 'Match or players not found' });
                }
                // Get user profiles for tags
                const user1 = await getUser(match.player1.userId);
                const user2 = await getUser(match.player2.userId);
                if (!user1?.clashRoyaleTag || !user2?.clashRoyaleTag) {
                    return res.status(400).json({ error: 'Both players must link Clash Royale tag' });
                }
                // Fetch last 3 battles for both users using the same logic as /matches/history
                const fetch = require('node-fetch');
                const cheerio = require('cheerio');
                async function fetchBattles(tag) {
                    const cleanTag = tag.replace(/^#/, '').toUpperCase();
                    const response = await fetch(`https://royaleapi.com/player/${cleanTag}/battles`, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    });
                    if (!response.ok) return [];
                    const html = await response.text();
                    const $ = cheerio.load(html);
                    const battles = [];
                    const allElements = $('*');
                    const battleContainers = [];
                    allElements.each((i, elem) => {
                        const $elem = $(elem);
                        const text = $elem.text();
                        if (text.includes('Defeat') || text.includes('Victory') || text.includes('Draw')) {
                            battleContainers.push($elem);
                        }
                    });
                    const seenOpponent = new Set();
                    let uniqueCount = 0;
                    for (let i = 0; i < battleContainers.length && uniqueCount < 3; i++) {
                        const $container = battleContainers[i];
                        const containerText = $container.text();
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
                        const opponentKey = `${opponentTag}|${opponentName}`;
                        if (seenOpponent.has(opponentKey)) continue;
                        seenOpponent.add(opponentKey);
                        let crowns = 0;
                        let opponentCrowns = 0;
                        const crownMatch = containerText.match(/(\d+)\s*[-–—]\s*(\d+)/);
                        if (crownMatch) {
                            crowns = parseInt(crownMatch[1]) || 0;
                            opponentCrowns = parseInt(crownMatch[2]) || 0;
                        }
                        let outcome = 'draw';
                        if (crowns > opponentCrowns) {
                            outcome = 'win';
                        } else if (opponentCrowns > crowns) {
                            outcome = 'loss';
                        }
                        // Extract UTC date from .battle-timestamp-popup
                        let utcString = null;
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
                            battleTime: utcString // ISO string or null
                        });
                        uniqueCount++;
                    }
                    return battles;
                }

                // Fetch battles for both users
                const [battles1, battles2] = await Promise.all([
                    fetchBattles(user1.clashRoyaleTag),
                    fetchBattles(user2.clashRoyaleTag)
                ]);


                // Look for a match between these two users in either's recent battles, and check battleTime
                let foundMatch = null;
                let winnerUserId = null;
                let draw = false;
                const matchStartTime = match.startTime || match.joinTime || match.createdAt;
                function isBattleAfterMatch(battle) {
                    if (!battle.battleTime) return false;
                    // battleTime is usually ISO or UTC string
                    const battleDate = new Date(battle.battleTime);
                    const matchDate = new Date(matchStartTime);
                    // Only allow if battle is after match start and within 1 hour
                    const maxDelayMs = 60 * 60 * 1000; // 1 hour
                    return battleDate >= matchDate && (battleDate - matchDate) <= maxDelayMs;
                }
                for (const battle of battles1) {
                    if (
                        battle.opponentTag.replace(/^#/, '').toUpperCase() === user2.clashRoyaleTag.replace(/^#/, '').toUpperCase()
                        && isBattleAfterMatch(battle)
                    ) {
                        foundMatch = battle;
                        if (battle.outcome === 'win') winnerUserId = user1.userId;
                        else if (battle.outcome === 'loss') winnerUserId = user2.userId;
                        else draw = true;
                        break;
                    }
                }
                if (!foundMatch) {
                    for (const battle of battles2) {
                        if (
                            battle.opponentTag.replace(/^#/, '').toUpperCase() === user1.clashRoyaleTag.replace(/^#/, '').toUpperCase()
                            && isBattleAfterMatch(battle)
                        ) {
                            foundMatch = battle;
                            if (battle.outcome === 'win') winnerUserId = user2.userId;
                            else if (battle.outcome === 'loss') winnerUserId = user1.userId;
                            else draw = true;
                            break;
                        }
                    }
                }

                if (!foundMatch) {
                    // Do NOT close the match if not verified
                    return res.status(404).json({ error: 'No valid match found: battle must be after match start time.' });
                }

                // Only update match if a winner or draw is found
                let winnerUsername = null;
                let prizeAwarded = null;
                if (!match.winner && !draw) {
                    match.winner = winnerUserId;
                    match.status = 'completed';
                    match.finalizedAt = new Date().toISOString();
                    await setMatch(matchId, match);
                    // Award prize and update stats
                    const winnerUser = await getUser(match.winner);
                    const loserUserId = (match.player1.userId === match.winner) ? match.player2.userId : match.player1.userId;
                    const loserUser = await getUser(loserUserId);
                    winnerUser.balance += match.prizePool;
                    winnerUser.wins = (winnerUser.wins || 0) + 1;
                    winnerUser.totalWon = (winnerUser.totalWon || 0) + match.prizePool;
                    loserUser.losses = (loserUser.losses || 0) + 1;
                    await setUser(winnerUser.userId, winnerUser);
                    await setUser(loserUser.userId, loserUser);
                    await logTransaction({
                        type: 'match_won',
                        matchId,
                        userId: winnerUser.userId,
                        amount: match.prizePool,
                        timestamp: new Date().toISOString()
                    });
                    winnerUsername = winnerUser.username;
                    prizeAwarded = match.prizePool;
                } else if (!match.winner && draw) {
                    // Handle draw - refund both players
                    const player1 = await getUser(match.player1.userId);
                    const player2 = await getUser(match.player2.userId);
                    player1.balance += match.entryFee;
                    player2.balance += match.entryFee;
                    await setUser(player1.userId, player1);
                    await setUser(player2.userId, player2);
                    match.status = 'completed';
                    match.winner = 'draw';
                    match.finalizedAt = new Date().toISOString();
                    await setMatch(matchId, match);
                    await logTransaction({
                        type: 'match_draw',
                        matchId,
                        timestamp: new Date().toISOString()
                    });
                    winnerUsername = null;
                    prizeAwarded = null;
                }

                // Placeholder: Notify both players (could be implemented by setting a notification field on user or match)
                // Example: match.lastNotification = { type: 'match_verified', winner: winnerUsername, prize: prizeAwarded };
                // await setMatch(matchId, match);

                return res.status(200).json({
                    success: true,
                    verified: true,
                    matchId,
                    winner: winnerUsername,
                    prizeAwarded,
                    draw,
                    battle: foundMatch
                });
            } catch (error) {
                console.error('Error verifying Clash Royale match:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }
    await initDB();

    // GET /api/matches - Get all matches
    if (req.method === 'GET') {
        try {
            await initializeSeedData();

            const matches = await getAllMatches();
            
            // Sort by creation date (newest first)
            const sortedMatches = matches.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            return res.status(200).json({ matches: sortedMatches });
        } catch (error) {
            console.error('Error fetching matches:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/matches?action=create - Create match
    // POST /api/matches?action=join - Join match
    if (req.method === 'POST') {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const action = url.searchParams.get('action');

        if (action === 'create') {
            try {
                const { userId, game, gameShort, mode, entryFee } = req.body;

                if (!userId || !game || !gameShort || !mode || !entryFee) {
                    return res.status(400).json({ error: 'Missing required fields' });
                }

                const fee = parseFloat(entryFee);
                if (isNaN(fee) || fee < 5 || fee > 1000) {
                    return res.status(400).json({ error: 'Invalid entry fee' });
                }

                const user = await getUser(userId);
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                if (user.balance < fee) {
                    return res.status(400).json({ error: 'Insufficient balance' });
                }

                const matchId = uuidv4();
                const match = {
                    matchId,
                    game,
                    gameShort,
                    mode,
                    status: 'open',
                    entryFee: fee,
                    prizePool: fee * 2 * 0.95,
                    player1: {
                        userId: user.userId,
                        username: user.username,
                        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                    },
                    player2: null,
                    winner: null,
                    createdAt: new Date().toISOString(),
                    joinTime: null, // when player2 joins
                    startTime: null, // when match starts (same as joinTime for now)
                    finalizedAt: null
                };

                user.balance -= fee;
                await setUser(userId, user);
                await setMatch(matchId, match);
                await logTransaction({
                    type: 'match_created',
                    matchId,
                    userId,
                    amount: -fee,
                    timestamp: new Date().toISOString()
                });

                return res.status(201).json({ 
                    success: true, 
                    match,
                    balance: user.balance
                });
            } catch (error) {
                console.error('Error creating match:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }

        if (action === 'join') {
            try {
                const { userId, matchId } = req.body;

                if (!userId || !matchId) {
                    return res.status(400).json({ error: 'Missing required fields' });
                }

                const user = await getUser(userId);
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                const match = await getMatch(matchId);
                if (!match) {
                    return res.status(404).json({ error: 'Match not found' });
                }

                if (match.status !== 'open') {
                    return res.status(400).json({ error: 'Match is not open' });
                }

                if (match.player2) {
                    return res.status(400).json({ error: 'Match is already full' });
                }

                if (match.player1.userId === userId) {
                    return res.status(400).json({ error: 'Cannot join your own match' });
                }

                if (user.balance < match.entryFee) {
                    return res.status(400).json({ error: 'Insufficient balance' });
                }

                user.balance -= match.entryFee;
                await setUser(userId, user);

                match.player2 = {
                    userId: user.userId,
                    username: user.username,
                    avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                };
                match.status = 'in-progress';
                match.joinTime = new Date().toISOString();
                match.startTime = match.joinTime;
                await setMatch(matchId, match);

                await logTransaction({
                    type: 'match_joined',
                    matchId,
                    userId,
                    amount: -match.entryFee,
                    timestamp: new Date().toISOString()
                });

                return res.status(200).json({ 
                    success: true, 
                    match,
                    balance: user.balance
                });
            } catch (error) {
                console.error('Error joining match:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }

        if (action === 'verify-clashroyale') {
            try {
                const { matchId } = req.body;

                if (!matchId) {
                    return res.status(400).json({ error: 'Match ID required' });
                }

                const match = await getMatch(matchId);
                if (!match) {
                    return res.status(404).json({ error: 'Match not found' });
                }

                if (match.status !== 'in-progress') {
                    return res.status(400).json({ error: 'Match is not in progress' });
                }

                if (!match.player2) {
                    return res.status(400).json({ error: 'Match needs two players' });
                }

                // Get both players
                const player1 = await getUser(match.player1.userId);
                const player2 = await getUser(match.player2.userId);

                if (!player1 || !player2) {
                    return res.status(404).json({ error: 'Players not found' });
                }

                // Check if both have Clash Royale tags linked
                if (!player1.clashRoyaleTag || !player2.clashRoyaleTag) {
                    return res.status(400).json({ 
                        error: 'Both players must link their Clash Royale accounts',
                        message: 'Please ensure both players have linked their Clash Royale accounts in their profiles.'
                    });
                }

                // Get API key from environment
                const apiKey = process.env.CLASH_ROYALE_API_KEY;
                if (!apiKey) {
                    return res.status(500).json({ error: 'Clash Royale API not configured' });
                }

                // Check for recent battle
                const battleResult = await checkRecentBattle(
                    player1.clashRoyaleTag,
                    player2.clashRoyaleTag,
                    apiKey
                );

                if (!battleResult.found) {
                    return res.status(200).json({ 
                        verified: false,
                        message: battleResult.error || 'No recent battle found between these players in the last 24 hours.'
                    });
                }

                // Determine winner
                let winnerUserId, winnerUsername, loserUserId;
                if (battleResult.result.draw) {
                    // Handle draw - refund both players
                    player1.balance += match.entryFee;
                    player2.balance += match.entryFee;
                    await setUser(player1.userId, player1);
                    await setUser(player2.userId, player2);

                    match.status = 'completed';
                    match.winner = 'draw';
                    match.finalizedAt = new Date().toISOString();
                    await setMatch(matchId, match);

                    await logTransaction({
                        type: 'match_draw',
                        matchId,
                        timestamp: new Date().toISOString()
                    });

                    return res.status(200).json({
                        verified: true,
                        draw: true,
                        message: 'Match was a draw. Entry fees refunded.'
                    });
                }

                // Determine winner by tag
                const winnerTag = battleResult.result.winner;
                if (player1.clashRoyaleTag.replace('#', '').toUpperCase() === winnerTag) {
                    winnerUserId = player1.userId;
                    winnerUsername = player1.username;
                    loserUserId = player2.userId;
                } else {
                    winnerUserId = player2.userId;
                    winnerUsername = player2.username;
                    loserUserId = player1.userId;
                }

                // Award prize to winner
                const winner = await getUser(winnerUserId);
                const loser = await getUser(loserUserId);
                
                winner.balance += match.prizePool;
                winner.wins = (winner.wins || 0) + 1;
                winner.totalWon = (winner.totalWon || 0) + match.prizePool;
                
                loser.losses = (loser.losses || 0) + 1;

                await setUser(winnerUserId, winner);
                await setUser(loserUserId, loser);

                // Update match
                match.status = 'completed';
                match.winner = winnerUserId;
                match.finalizedAt = new Date().toISOString();
                await setMatch(matchId, match);

                await logTransaction({
                    type: 'match_completed',
                    matchId,
                    winnerId: winnerUserId,
                    loserId: loserUserId,
                    prizeAwarded: match.prizePool,
                    timestamp: new Date().toISOString()
                });

                return res.status(200).json({
                    verified: true,
                    winner: winnerUsername,
                    prizeAwarded: match.prizePool,
                    battleTime: battleResult.result.battleTime
                });

            } catch (error) {
                console.error('Error verifying Clash Royale match:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }

        return res.status(400).json({ error: 'Invalid action. Use ?action=create or ?action=join' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

module.exports = handleCors(handler);
