// API Configuration
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

// State
let authToken = localStorage.getItem('adminToken');
let currentMatch = null;
let selectedWinner = null;

// DOM Elements
const loginSection = document.getElementById('loginSection');
const adminDashboard = document.getElementById('adminDashboard');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const finalizeModal = document.getElementById('finalizeModal');
const finalizeError = document.getElementById('finalizeError');
const playerOptions = document.getElementById('playerOptions');
const confirmFinalizeBtn = document.getElementById('confirmFinalizeBtn');
const cancelFinalizeBtn = document.getElementById('cancelFinalizeBtn');

// Initialize
function init() {
    if (authToken) {
        showDashboard();
    }
    
    setupEventListeners();
}

function setupEventListeners() {
    loginBtn.addEventListener('click', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') passwordInput.focus();
    });
    
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Tab switching
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            
            e.target.classList.add('active');
            const tabName = e.target.dataset.tab;
            
            if (tabName === 'in-progress') {
                document.getElementById('inProgressSection').classList.add('active');
            } else if (tabName === 'open') {
                document.getElementById('openSection').classList.add('active');
            } else if (tabName === 'completed') {
                document.getElementById('completedSection').classList.add('active');
            } else if (tabName === 'all') {
                document.getElementById('allSection').classList.add('active');
            }
        });
    });
    
    // Finalize modal
    confirmFinalizeBtn.addEventListener('click', handleConfirmFinalize);
    cancelFinalizeBtn.addEventListener('click', closeFinalizeModal);
    
    finalizeModal.addEventListener('click', (e) => {
        if (e.target === finalizeModal) {
            closeFinalizeModal();
        }
    });
}

// Authentication
async function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
        showError(loginError, 'Please enter username and password');
        return;
    }
    
    loginBtn.disabled = true;
    loginBtn.textContent = 'LOGGING IN...';
    
    try {
        const response = await fetch(`${API_BASE}/admin?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('adminToken', authToken);
            showDashboard();
        } else {
            showError(loginError, data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError(loginError, 'Connection error. Please try again.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'LOGIN';
    }
}

function handleLogout() {
    authToken = null;
    localStorage.removeItem('adminToken');
    loginSection.classList.remove('hidden');
    adminDashboard.classList.add('hidden');
    logoutBtn.style.display = 'none';
    usernameInput.value = '';
    passwordInput.value = '';
}

function showDashboard() {
    loginSection.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    logoutBtn.style.display = 'block';
    loadDashboardData();
    loadAllUsers();
    
    // Refresh every 30 seconds
    setInterval(loadDashboardData, 30000);
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadStats(),
            loadMatches()
        ]);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/admin?action=stats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                handleLogout();
                return;
            }
            throw new Error('Failed to load stats');
        }
        
        const data = await response.json();
        updateStats(data.stats);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateStats(stats) {
    document.getElementById('statTotalMatches').textContent = stats.totalMatches;
    document.getElementById('statInProgress').textContent = stats.inProgressMatches;
    document.getElementById('statCompleted').textContent = stats.completedMatches;
    document.getElementById('statPrizePool').textContent = `$${stats.totalPrizePool.toFixed(2)}`;
    document.getElementById('statPaidOut').textContent = `$${stats.totalPaidOut.toFixed(2)}`;
    document.getElementById('statFees').textContent = `$${stats.totalPlatformFees.toFixed(2)}`;
}

async function loadMatches() {
    try {
        const response = await fetch(`${API_BASE}/matches`);
        
        if (!response.ok) {
            throw new Error('Failed to load matches');
        }
        
        const data = await response.json();
        renderMatches(data.matches);
    } catch (error) {
        console.error('Error loading matches:', error);
    }
}

function renderMatches(matches) {
    const inProgressMatches = matches.filter(m => m.status === 'in-progress');
    const openMatches = matches.filter(m => m.status === 'open');
    const completedMatches = matches.filter(m => m.status === 'completed');
    
    renderMatchList('inProgressMatches', inProgressMatches, 'in-progress');
    renderMatchList('openMatches', openMatches, 'open');
    renderMatchList('completedMatches', completedMatches, 'completed');
    renderMatchList('allMatches', matches, 'all');
}

function renderMatchList(containerId, matches, type) {
    const container = document.getElementById(containerId);
    
    if (matches.length === 0) {
        container.innerHTML = '<div class="empty-state">No matches found</div>';
        return;
    }
    
    container.innerHTML = matches.map(match => {
        if (type === 'completed') {
            return renderCompletedMatchRow(match);
        } else {
            return renderMatchRow(match);
        }
    }).join('');
    
    // Add event listeners
    container.querySelectorAll('.btn-finalize').forEach(btn => {
        btn.addEventListener('click', () => openFinalizeModal(JSON.parse(btn.dataset.match)));
    });
    
    container.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', () => handleCancelMatch(btn.dataset.matchId));
    });
}

function renderMatchRow(match) {
    const statusClass = match.status === 'open' ? 'open' : 
                       match.status === 'in-progress' ? 'in-progress' : 
                       match.status === 'cancelled' ? 'cancelled' : 'completed';
    
    const player2Display = match.player2 
        ? match.player2.username 
        : '<span style="color: var(--text-muted);">Waiting...</span>';
    
    const actions = match.status === 'in-progress' && match.player2
        ? `<div class="action-buttons">
             <button class="btn-small btn-finalize" data-match='${JSON.stringify(match)}'>Finalize</button>
             <button class="btn-small btn-cancel" data-match-id="${match.matchId}">Cancel</button>
           </div>`
        : match.status === 'open'
        ? `<div class="action-buttons">
             <button class="btn-small btn-cancel" data-match-id="${match.matchId}">Cancel</button>
           </div>`
        : match.status === 'cancelled'
        ? '<span style="color: var(--text-muted);">Cancelled</span>'
        : '<span style="color: var(--text-muted);">No actions</span>';
    
    return `
        <div class="table-row">
            <div>${match.game}</div>
            <div>${match.mode}</div>
            <div>${match.player1.username}</div>
            <div>${player2Display}</div>
            <div>$${match.entryFee}</div>
            <div style="color: var(--green);">$${match.prizePool.toFixed(2)}</div>
            <div>${actions}</div>
        </div>
    `;
}

function renderCompletedMatchRow(match) {
    const winner = match.winner === match.player1.userId ? match.player1 : match.player2;
    const loser = match.winner === match.player1.userId ? match.player2 : match.player1;
    
    const finalizedDate = new Date(match.finalizedAt).toLocaleString();
    
    return `
        <div class="table-row">
            <div>${match.game}</div>
            <div>${match.mode}</div>
            <div style="color: var(--green);">🏆 ${winner.username}</div>
            <div>${loser.username}</div>
            <div>$${match.entryFee}</div>
            <div style="color: var(--green);">$${match.prizePool.toFixed(2)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${finalizedDate}</div>
        </div>
    `;
}

// Finalize Match Modal
function openFinalizeModal(match) {
    if (!match.player2) {
        alert('Match needs two players to finalize');
        return;
    }
    
    currentMatch = match;
    selectedWinner = null;
    finalizeError.classList.add('hidden');
    
    playerOptions.innerHTML = `
        <div class="player-option" data-user-id="${match.player1.userId}">
            <img src="${match.player1.avatar}" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--cyan);">
            <div>
                <div style="font-weight: 700; font-size: 1.125rem;">${match.player1.username}</div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">Player 1</div>
            </div>
        </div>
        <div class="player-option" data-user-id="${match.player2.userId}">
            <img src="${match.player2.avatar}" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--cyan);">
            <div>
                <div style="font-weight: 700; font-size: 1.125rem;">${match.player2.username}</div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">Player 2</div>
            </div>
        </div>
    `;
    
    // Add click handlers
    playerOptions.querySelectorAll('.player-option').forEach(option => {
        option.addEventListener('click', () => {
            playerOptions.querySelectorAll('.player-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            selectedWinner = option.dataset.userId;
        });
    });
    
    finalizeModal.classList.remove('hidden');
}

function closeFinalizeModal() {
    finalizeModal.classList.add('hidden');
    currentMatch = null;
    selectedWinner = null;
}

async function handleConfirmFinalize() {
    if (!selectedWinner) {
        showError(finalizeError, 'Please select a winner');
        return;
    }
    
    confirmFinalizeBtn.disabled = true;
    confirmFinalizeBtn.textContent = 'FINALIZING...';
    
    try {
        const response = await fetch(`${API_BASE}/admin?action=finalize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                matchId: currentMatch.matchId,
                winnerId: selectedWinner
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(`Match finalized! ${data.winner.username} won $${data.match.prizePool.toFixed(2)}`, 'success');
            closeFinalizeModal();
            loadDashboardData();
        } else {
            showError(finalizeError, data.error || 'Failed to finalize match');
        }
    } catch (error) {
        console.error('Finalize error:', error);
        showError(finalizeError, 'Connection error. Please try again.');
    } finally {
        confirmFinalizeBtn.disabled = false;
        confirmFinalizeBtn.textContent = 'Finalize & Pay Winner';
    }
}

async function handleCancelMatch(matchId) {
    if (!confirm('Are you sure you want to cancel this match? Players will be refunded.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin?action=cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                matchId,
                reason: 'Cancelled by admin'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Match cancelled and players refunded', 'success');
            loadDashboardData();
        } else {
            alert(data.error || 'Failed to cancel match');
        }
    } catch (error) {
        console.error('Cancel error:', error);
        alert('Connection error. Please try again.');
    }
}

// === LOAD ALL USERS ===
async function loadAllUsers() {
    try {
        const response = await fetch(`${API_BASE}/admin?action=stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!data.stats || !data.stats.users) return;
        const users = data.stats.users;
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('div');
            row.className = 'table-row';
            row.style.gridTemplateColumns = '2fr 2fr 1fr 1fr 1fr 1fr 1fr';
            row.innerHTML = `
                <div title="${user.userId}">${user.userId}</div>
                <div>${user.username}</div>
                <div>${user.email || ''}</div>
                <div>$${user.balance.toFixed(2)}</div>
                <div>${user.wins}</div>
                <div>${user.losses}</div>
                <div>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}</div>
            `;
            tbody.appendChild(row);
        });
    } catch (e) { /* ignore */ }
}

// Utility Functions
function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}

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
            z-index: 4000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 10px 40px rgba(0, 240, 255, 0.3);
        }
        
        .notification-success {
            border-left: 4px solid var(--success);
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
    `;
    
    if (!document.getElementById('notification-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'notification-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
