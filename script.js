// --- Notification Persistence Helpers ---
function getNotifiedMatchesKey(userId) {
    return `notifiedCompletedMatches_${userId}`;
}

function loadNotifiedCompletedMatches(userId) {
    if (!userId) return [];
    try {
        const key = getNotifiedMatchesKey(userId);
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function saveNotifiedCompletedMatches(userId, matches) {
    if (!userId) return;
    try {
        const key = getNotifiedMatchesKey(userId);
        localStorage.setItem(key, JSON.stringify(matches));
    } catch (e) {}
}

// === API CONFIGURATION ===
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

// === AUTHENTICATION ===
function handleCredentialResponse(response) {
    console.log('Google credential received');
    
    // Send the credential to our backend
    fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            credential: response.credential
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Store the JWT token
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userId', data.user.userId);
            
            // Update app state
            appState.isLoggedIn = true;
            appState.user = data.user;
            
            // Update UI
            updateAuthUI();
            showNotification('Welcome back, ' + data.user.username + '!', 'success');
            
            // Reload matches
            loadMatchesFromAPI();
        } else {
            showNotification('Login failed: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    });
}

function logout() {
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    
    // Reset app state
    appState.isLoggedIn = false;
    appState.user = {
        userId: null,
        username: null,
        balance: 250.00,
        wins: 0,
        losses: 0
    };
    
    // Update UI
    updateAuthUI();
    showNotification('Logged out successfully', 'success');
    
    // Reload matches
    loadMatchesFromAPI();
}

function updateAuthUI() {
    const navActions = document.getElementById('navActions');
    const navUserInfo = document.getElementById('navUserInfo');
    
    if (appState.isLoggedIn) {
        navActions.classList.add('hidden');
        navUserInfo.classList.remove('hidden');
        
        // Update user info
        document.getElementById('navBalance').textContent = `$${appState.user.balance.toFixed(2)}`;
        document.getElementById('winsCount').textContent = appState.user.wins;
        document.getElementById('lossesCount').textContent = appState.user.losses;
        document.getElementById('username').textContent = appState.user.username;
        document.getElementById('userAvatar').src = appState.user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + appState.user.userId;
        document.getElementById('userProfileLink').href = 'profile.html'; // Removed userId parameter - will load current user
    } else {
        navActions.classList.remove('hidden');
        navUserInfo.classList.add('hidden');
    }
}

function checkExistingSession() {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    if (token && userId) {
        // Verify token and fetch user data
        fetch(`${API_BASE}/user?userId=${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                appState.isLoggedIn = true;
                appState.user = data.user;
                updateAuthUI();
            } else {
                // Token invalid, clear storage
                localStorage.removeItem('authToken');
                localStorage.removeItem('userId');
            }
        })
        .catch(error => {
            console.error('Session check error:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
        });
    }
}

// === STATE MANAGEMENT ===
const appState = {
    isLoggedIn: false,
    user: {
        userId: null,
        username: null,
        balance: 250.00,
        wins: 12,
        losses: 3
    },
    selectedFee: 25,
    matches: [
        {
            id: 1,
            game: 'Counter-Strike 2',
            gameShort: 'cs2',
            mode: '1v1 Competitive',
            status: 'open',
            entryFee: 50,
            prizePool: 95,
            player1: {
                name: 'xShadowKing',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shadow'
            },
            player2: null
        },
        {
            id: 2,
            game: 'Valorant',
            gameShort: 'valorant',
            mode: '1v1 Deathmatch',
            status: 'open',
            entryFee: 25,
            prizePool: 47.5,
            player1: {
                name: 'PhoenixRising',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=phoenix'
            },
            player2: null
        },
        {
            id: 3,
            game: 'Counter-Strike 2',
            gameShort: 'cs2',
            mode: '1v1 Competitive',
            status: 'in-progress',
            entryFee: 100,
            prizePool: 190,
            player1: {
                name: 'AceSniper',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ace'
            },
            player2: {
                name: 'GhostReaper',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ghost'
            }
        },
        {
            id: 4,
            game: 'Valorant',
            gameShort: 'valorant',
            mode: '1v1 Competitive',
            status: 'open',
            entryFee: 10,
            prizePool: 19,
            player1: {
                name: 'ViperQueen',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viper'
            },
            player2: null
        },
        {
            id: 5,
            game: 'Counter-Strike 2',
            gameShort: 'cs2',
            mode: '1v1 Aim Duel',
            status: 'open',
            entryFee: 75,
            prizePool: 142.5,
            player1: {
                name: 'NinjaStrike',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ninja'
            },
            player2: null
        },
        {
            id: 6,
            game: 'Valorant',
            gameShort: 'valorant',
            mode: '1v1 Deathmatch',
            status: 'in-progress',
            entryFee: 50,
            prizePool: 95,
            player1: {
                name: 'CyberNova',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cyber'
            },
            player2: {
                name: 'BlitzKrieg',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=blitz'
            }
        }
    ]
};

// === DOM ELEMENTS ===
const elements = {
    logoutBtn: document.getElementById('logoutBtn'),
    navActions: document.getElementById('navActions'),
    navUserInfo: document.getElementById('navUserInfo'),
    navBalance: document.getElementById('navBalance'),
    winsCount: document.getElementById('winsCount'),
    lossesCount: document.getElementById('lossesCount'),
    livePlayersCount: document.getElementById('livePlayersCount'),
    createMatchBtn: document.getElementById('createMatchBtn'),
    createMatchModal: document.getElementById('createMatchModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    confirmCreateBtn: document.getElementById('confirmCreateBtn'),
    gameSelect: document.getElementById('gameSelect'),
    modeSelect: document.getElementById('modeSelect'),
    feeOptions: document.querySelectorAll('.fee-option'),
    customFeeInput: document.getElementById('customFeeInput'),
    prizeAmount: document.getElementById('prizeAmount'),
    matchGrid: document.getElementById('matchGrid'),
    filterBtns: document.querySelectorAll('.filter-btn')
};

// === INITIALIZATION ===
async function init() {
    checkExistingSession();
    setupEventListeners();
    await loadMatchesFromAPI();
    // Auto-refresh matches every 3 seconds for real-time updates
    setInterval(loadMatchesFromAPI, 3000);
    // Also refresh when window regains focus
    window.addEventListener('focus', loadMatchesFromAPI);
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    // Logout
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', logout);
    }
    
    // Create Match Modal
    elements.createMatchBtn.addEventListener('click', openCreateMatchModal);
    elements.closeModalBtn.addEventListener('click', closeCreateMatchModal);
    elements.cancelModalBtn.addEventListener('click', closeCreateMatchModal);
    elements.confirmCreateBtn.addEventListener('click', handleCreateMatch);
    
    // Modal backdrop click
    elements.createMatchModal.addEventListener('click', (e) => {
        if (e.target === elements.createMatchModal) {
            closeCreateMatchModal();
        }
    });
    
    // Entry fee selection
    elements.feeOptions.forEach(btn => {
        btn.addEventListener('click', handleFeeSelection);
    });
    
    // Custom fee input
    elements.customFeeInput.addEventListener('input', handleCustomFeeInput);
    
    // Match filters
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', handleFilterChange);
    });
    
    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// === LOGIN SIMULATION ===
function handleLogin() {
    appState.isLoggedIn = true;
    
    // Generate a user ID for this session
    if (!appState.user.userId) {
        appState.user.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        appState.user.username = `Player${Math.floor(Math.random() * 10000)}`;
    }
    
    // Hide login button, show user info
    elements.navActions.classList.add('hidden');
    elements.navUserInfo.classList.remove('hidden');
    
    // Update user info
    updateUserInfo();
    
    // Scroll to matches section
    document.getElementById('matches').scrollIntoView({ behavior: 'smooth' });
    
    // Show notification
    showNotification('Welcome back! Your account is loaded and ready to compete.', 'success');
}

function updateUserInfo() {
    elements.navBalance.textContent = `$${appState.user.balance.toFixed(2)}`;
    elements.winsCount.textContent = appState.user.wins;
    elements.lossesCount.textContent = appState.user.losses;
}

// === API INTEGRATION ===
let lastMatchCount = 0;
let lastMatchState = '';

// Remove old notifiedCompletedMatches Set
delete window.notifiedCompletedMatches;

async function loadMatchesFromAPI() {
    try {
        const response = await fetch(`${API_BASE}/matches`);
        if (!response.ok) {
            console.error('Failed to load matches from API, using local data');
            renderMatches();
            return;
        }
        
        const data = await response.json();
        
        // Convert API matches to app format (do NOT filter out completed/cancelled yet)
        const allMatches = data.matches.map(m => ({
            id: m.matchId,
            matchId: m.matchId,
            game: m.game,
            gameShort: m.gameShort,
            mode: m.mode,
            status: m.status,
            entryFee: m.entryFee,
            prizePool: m.prizePool,
            player1: {
                name: m.player1.username,
                username: m.player1.username,
                userId: m.player1.userId,
                avatar: m.player1.avatar
            },
            player2: m.player2 ? {
                name: m.player2.username,
                username: m.player2.username,
                userId: m.player2.userId,
                avatar: m.player2.avatar
            } : null
        }));

        // --- Show notifications for completed matches (persisted per user) ---
        let notifiedMatches = [];
        if (appState.user && appState.user.userId) {
            notifiedMatches = loadNotifiedCompletedMatches(appState.user.userId);
        }
        let updated = false;
        allMatches.forEach(m => {
            if (
                m.status === 'completed' &&
                (m.player1?.userId === appState.user.userId || m.player2?.userId === appState.user.userId) &&
                !notifiedMatches.includes(m.matchId)
            ) {
                if (m.winner === appState.user.userId) {
                    showNotification(`✅ Match verified! You won the match! Prize: $${m.prizePool}`, 'success');
                } else if (m.winner === 'draw') {
                    showNotification('Match verified! Your match ended in a draw. Entry fees refunded.', 'success');
                } else if (m.winner) {
                    showNotification('Match verified! You lost the match.', 'warning');
                }
                notifiedMatches.push(m.matchId);
                updated = true;
            }
        });
        if (updated && appState.user && appState.user.userId) {
            saveNotifiedCompletedMatches(appState.user.userId, notifiedMatches);
        }

        // Now filter out completed/cancelled for display
        const newMatches = allMatches.filter(m => m.status !== 'completed' && m.status !== 'cancelled');

        // Check for changes to show notifications
        const currentMatchState = JSON.stringify(newMatches);
        const matchCountChanged = newMatches.length !== lastMatchCount;
        const matchStateChanged = currentMatchState !== lastMatchState;
        
        if (matchStateChanged && lastMatchState !== '') {
            // Find new matches
            const oldMatchIds = appState.matches.map(m => m.matchId);
            const newMatchCreated = newMatches.find(m => !oldMatchIds.includes(m.matchId));
            
            if (newMatchCreated && newMatchCreated.player1.userId !== appState.user.userId) {
                console.log('New match detected:', newMatchCreated.game);
            }
            
            // Check for matches that got a second player
            appState.matches.forEach(oldMatch => {
                const updatedMatch = newMatches.find(m => m.matchId === oldMatch.matchId);
                if (updatedMatch && !oldMatch.player2 && updatedMatch.player2) {
                    if (oldMatch.player1.userId === appState.user.userId) {
                        showNotification(`${updatedMatch.player2.username} joined your match!`, 'success');
                    }
                }
            });
        }
        
        appState.matches = newMatches;
        lastMatchCount = newMatches.length;
        lastMatchState = currentMatchState;
        
        renderMatches();
        // Refresh user profile after matches update
        if (appState.isLoggedIn && appState.user.userId) {
            const token = localStorage.getItem('authToken');
            fetch(`${API_BASE}/user?userId=${appState.user.userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    appState.user = data.user;
                    updateAuthUI();
                }
            });
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        renderMatches();
    }
}

// === MATCH RENDERING ===
function renderMatches(filter = 'all') {
    let filteredMatches = appState.matches;
    
    if (filter !== 'all') {
        if (filter === 'open' || filter === 'in-progress') {
            filteredMatches = appState.matches.filter(m => m.status === filter);
        } else {
            filteredMatches = appState.matches.filter(m => m.gameShort === filter);
        }
    }
    
    elements.matchGrid.innerHTML = filteredMatches.map(match => createMatchCard(match)).join('');
    
    // Add event listeners to join buttons
    document.querySelectorAll('.btn-join').forEach(btn => {
        btn.addEventListener('click', () => handleJoinMatch(btn.dataset.matchId));
    });
    
    // Add event listeners to verify buttons
    document.querySelectorAll('.btn-verify').forEach(btn => {
        btn.addEventListener('click', () => handleVerifyMatch(btn.dataset.matchId));
    });
}

function createMatchCard(match) {
    const statusClass = match.status === 'open' ? 'open' : 'in-progress';
    const statusText = match.status === 'open' ? 'Open' : 'In Progress';
    
    // Check if this match can be verified (both players present, in-progress, Clash Royale game)
    const canVerify = match.status === 'in-progress' && 
                      match.player2 && 
                      (match.gameShort === 'clashroyale' || match.game?.toLowerCase().includes('clash royale'));
    
    // Check if current user is a player in this match
    const isPlayer = appState.isLoggedIn && 
                     (match.player1?.userId === appState.user?.userId || 
                      match.player2?.userId === appState.user?.userId);
    
    let actionButton = '';
    if (match.status === 'open') {
        actionButton = `<button class="btn-join" data-match-id="${match.matchId || match.id}">JOIN MATCH</button>`;
    } else if (canVerify && isPlayer) {
        actionButton = `<button class="btn-verify" data-match-id="${match.matchId || match.id}">🔍 VERIFY MATCH</button>`;
    } else if (match.status === 'in-progress') {
        actionButton = `<button class="btn-watch">WATCH LIVE</button>`;
    }
    
    return `
        <div class="match-card" data-status="${match.status}" data-game="${match.gameShort}">
            <div class="match-header">
                <span class="match-game">${match.game}</span>
                <span class="match-status ${statusClass}">${statusText}</span>
            </div>
            
            <div class="match-mode">${match.mode}</div>
            
            <div class="match-players">
                <div class="player-slot">
                    <img src="${match.player1.avatar}" alt="${match.player1.username || match.player1.name}" class="player-avatar">
                    <span class="player-name">${match.player1.username || match.player1.name}</span>
                </div>
                <span class="vs-divider">VS</span>
                <div class="player-slot ${match.player2 ? '' : 'empty'}">
                    ${match.player2 
                        ? `<img src="${match.player2.avatar}" alt="${match.player2.username || match.player2.name}" class="player-avatar">
                           <span class="player-name">${match.player2.username || match.player2.name}</span>`
                        : `<span class="player-name">Waiting...</span>`
                    }
                </div>
            </div>
            
            <div class="match-details">
                <div class="detail-item">
                    <span class="detail-label">Entry Fee</span>
                    <span class="detail-value entry-fee">$${match.entryFee}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Prize Pool</span>
                    <span class="detail-value prize-pool">$${match.prizePool}</span>
                </div>
            </div>
            
            <div class="match-actions">
                ${actionButton}
            </div>
        </div>
    `;
}

// === MATCH FILTERS ===
function handleFilterChange(e) {
    // Remove active class from all buttons
    elements.filterBtns.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    e.target.classList.add('active');
    
    // Render filtered matches
    const filter = e.target.dataset.filter;
    renderMatches(filter);
}

// === JOIN MATCH ===
async function handleJoinMatch(matchId) {
    if (!appState.isLoggedIn) {
        showNotification('Please log in to join matches!', 'warning');
        handleLogin();
        return;
    }
    
    const match = appState.matches.find(m => m.matchId === matchId || m.id === parseInt(matchId));
    
    if (!match) {
        showNotification('Match not found!', 'error');
        return;
    }
    
    if (appState.user.balance < match.entryFee) {
        showNotification('Insufficient balance! Please add funds to your account.', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/matches?action=join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: appState.user.userId,
                matchId: match.matchId || match.id
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Update user balance
            appState.user.balance = data.balance;
            updateUserInfo();
            
            showNotification(`Successfully joined ${match.game} match! Entry fee: $${match.entryFee}`, 'success');
            
            // Reload matches
            await loadMatchesFromAPI();
        } else {
            showNotification(data.error || 'Failed to join match', 'error');
        }
    } catch (error) {
        console.error('Error joining match:', error);
        
        // Fallback to local simulation
        appState.user.balance -= match.entryFee;
        updateUserInfo();
        
        showNotification(`Successfully joined ${match.game} match! Entry fee: $${match.entryFee}`, 'success');
        
        // Update match status locally
        match.player2 = {
            name: appState.user.username || 'You',
            username: appState.user.username || 'You',
            userId: appState.user.userId,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${appState.user.username || 'user'}`
        };
        match.status = 'in-progress';
        
        renderMatches();
    }
}

// === VERIFY MATCH ===
async function handleVerifyMatch(matchId) {
    if (!appState.isLoggedIn) {
        showNotification('Please log in to verify matches!', 'warning');
        return;
    }
    
    const match = appState.matches.find(m => m.matchId === matchId || m.id === parseInt(matchId));
    
    if (!match) {
        showNotification('Match not found!', 'error');
        return;
    }
    
    // Check if both players have Clash Royale accounts linked
    if (!confirm('This will check the Clash Royale API to verify the match result. Both players must have linked their Clash Royale accounts. Continue?')) {
        return;
    }
    
    try {
        showNotification('🔍 Checking Clash Royale match history...', 'info');
        
        const response = await fetch(`${API_BASE}/matches?action=verify-clashroyale`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                matchId: match.matchId || match.id
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.verified) {
                showNotification(`✅ Match verified! Winner: ${data.winner}. Prize: $${data.prizeAwarded}`, 'success');
                
                // Reload matches and user data
                await loadMatchesFromAPI();
                if (appState.user.userId) {
                    const token = localStorage.getItem('authToken');
                    const userRes = await fetch(`${API_BASE}/user?userId=${appState.user.userId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const userData = await userRes.json();
                    if (userData.success) {
                        appState.user = userData.user;
                        updateAuthUI();
                    }
                }
            } else {
                showNotification(data.message || 'Could not verify match. Please ensure both players have linked Clash Royale accounts and completed a match.', 'warning');
            }
        } else {
            showNotification(data.error || 'Failed to verify match', 'error');
        }
    } catch (error) {
        console.error('Error verifying match:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// === CREATE MATCH MODAL ===
function openCreateMatchModal() {
    if (!appState.isLoggedIn) {
        showNotification('Please log in to create matches!', 'warning');
        handleLogin();
        return;
    }
    
    elements.createMatchModal.classList.remove('hidden');
    updatePrizeDisplay();
}

function closeCreateMatchModal() {
    elements.createMatchModal.classList.add('hidden');
    elements.customFeeInput.classList.add('hidden');
}

// === ENTRY FEE SELECTION ===
function handleFeeSelection(e) {
    // Remove active class from all
    elements.feeOptions.forEach(btn => btn.classList.remove('active'));
    
    // Add active to clicked
    e.target.classList.add('active');
    
    const fee = e.target.dataset.fee;
    
    if (fee === 'custom') {
        elements.customFeeInput.classList.remove('hidden');
        elements.customFeeInput.focus();
        appState.selectedFee = parseInt(elements.customFeeInput.value) || 25;
    } else {
        elements.customFeeInput.classList.add('hidden');
        appState.selectedFee = parseInt(fee);
    }
    
    updatePrizeDisplay();
}

function handleCustomFeeInput(e) {
    const value = parseInt(e.target.value) || 0;
    appState.selectedFee = value;
    updatePrizeDisplay();
}

function updatePrizeDisplay() {
    const prize = appState.selectedFee * 2 * 0.95; // 5% platform fee
    elements.prizeAmount.textContent = `$${prize.toFixed(2)}`;
}

// === CREATE MATCH ===
async function handleCreateMatch() {
    if (appState.user.balance < appState.selectedFee) {
        showNotification('Insufficient balance to create this match!', 'error');
        return;
    }
    
    const game = elements.gameSelect.options[elements.gameSelect.selectedIndex].text;
    const gameShort = elements.gameSelect.value;
    const mode = elements.modeSelect.options[elements.modeSelect.selectedIndex].text;
    
    try {
        const response = await fetch(`${API_BASE}/matches?action=create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: appState.user.userId,
                game,
                gameShort,
                mode,
                entryFee: appState.selectedFee
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Update user balance
            appState.user.balance = data.balance;
            updateUserInfo();
            
            showNotification(`Match created successfully! Entry fee: $${appState.selectedFee}`, 'success');
            
            // Close modal and reload matches
            closeCreateMatchModal();
            await loadMatchesFromAPI();
            
            // Scroll to matches
            elements.matchGrid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            showNotification(data.error || 'Failed to create match', 'error');
        }
    } catch (error) {
        console.error('Error creating match:', error);
        
        // Fallback to local simulation
        const newMatch = {
            id: appState.matches.length + 1,
            matchId: `match_${Date.now()}`,
            game: game,
            gameShort: gameShort,
            mode: mode,
            status: 'open',
            entryFee: appState.selectedFee,
            prizePool: appState.selectedFee * 2 * 0.95,
            player1: {
                name: appState.user.username || 'You',
                username: appState.user.username || 'You',
                userId: appState.user.userId,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${appState.user.username || 'user'}`
            },
            player2: null
        };
        
        // Deduct entry fee
        appState.user.balance -= appState.selectedFee;
        updateUserInfo();
        
        // Add match to beginning of list
        appState.matches.unshift(newMatch);
        
        // Close modal and refresh matches
        closeCreateMatchModal();
        renderMatches();
        
        showNotification(`Match created successfully! Entry fee: $${appState.selectedFee}`, 'success');
        
        // Scroll to matches
        elements.matchGrid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// === NOTIFICATIONS ===
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const styles = `
        .notification {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            padding: 1rem 1.5rem;
            background: var(--bg-card);
            border: 1px solid var(--border-glow);
            border-radius: 8px;
            color: var(--text-primary);
            font-family: var(--font-body);
            font-weight: 600;
            z-index: 3000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 10px 40px rgba(0, 240, 255, 0.3);
        }
        
        .notification-success {
            border-left: 4px solid var(--success);
        }
        
        .notification-warning {
            border-left: 4px solid var(--warning);
        }
        
        .notification-error {
            border-left: 4px solid var(--danger);
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    
    // Add styles if not already present
    if (!document.getElementById('notification-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'notification-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}


// === PUBLIC STATS ===
async function updatePublicStats() {
    try {
        const response = await fetch(`${API_BASE}/public-stats`);
        if (!response.ok) return;
        const data = await response.json();
        if (data.totalPlayers) {
            document.getElementById('livePlayersCount').textContent = data.totalPlayers.toLocaleString();
        }
        if (typeof data.totalPaidOut === 'number') {
            const paidOut = data.totalPaidOut >= 1000 ? `$${(data.totalPaidOut/1000).toFixed(1)}K` : `$${data.totalPaidOut.toFixed(2)}`;
            document.getElementById('totalPaidOut').textContent = paidOut;
        }
    } catch (e) { /* ignore */ }
}

// Call on load and every 10 seconds
setInterval(updatePublicStats, 10000);
document.addEventListener('DOMContentLoaded', updatePublicStats);

// === SHOW CLASH ROYALE INFO ===
function checkAndShowClashRoyaleInfo() {
    const hasSeenInfo = localStorage.getItem('clashRoyaleInfoSeen');
    if (!hasSeenInfo) {
        setTimeout(() => {
            const banner = document.getElementById('clashRoyaleInfo');
            if (banner) {
                banner.style.display = 'flex';
                localStorage.setItem('clashRoyaleInfoSeen', 'true');
            }
        }, 2000);
    }
}

// === START APPLICATION ===
document.addEventListener('DOMContentLoaded', () => {
    init();
    checkAndShowClashRoyaleInfo();
});
