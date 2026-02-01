// Phantom Wallet integration for Solana (client-side)
// Handles wallet connect, deposit, and withdrawal UI

// Check if Phantom is installed
function isPhantomInstalled() {
    return window.solana && window.solana.isPhantom;
}

// Connect to Phantom Wallet
async function connectPhantomWallet(auto = false) {
    if (!isPhantomInstalled()) {
        alert('Phantom Wallet not found. Please install the Phantom extension.');
        return null;
    }
    try {
        let resp;
        if (auto && window.solana.isConnected) {
            resp = window.solana;
        } else {
            resp = await window.solana.connect();
        }
        if (resp && resp.publicKey) {
            localStorage.setItem('phantomWallet', resp.publicKey.toString());
            return resp.publicKey.toString();
        }
        return null;
    } catch (err) {
        if (!auto) alert('Wallet connection failed.');
        return null;
    }
}

// Request deposit address from backend
async function requestDepositAddress(userId, walletAddress) {
    const res = await fetch(`${API_BASE}/crypto/deposit-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, walletAddress })
    });
    return res.json();
}

// Notify backend of deposit (after sending SOL)
async function confirmDeposit(userId, signature) {
    const res = await fetch(`${API_BASE}/crypto/confirm-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, signature })
    });
    return res.json();
}

// Withdraw request
async function requestWithdrawal(userId, amount) {
    const res = await fetch(`${API_BASE}/crypto/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount })
    });
    return res.json();
}

// UI logic (add buttons to profile page)
document.addEventListener('DOMContentLoaded', async function() {
    const walletBtn = document.getElementById('phantomWalletBtn');
    const walletStatus = document.getElementById('phantomWalletStatus');
    const depositBtn = document.getElementById('depositCryptoBtn');
    const withdrawBtn = document.getElementById('withdrawCryptoBtn');
    const disconnectBtn = document.getElementById('disconnectWalletBtn');
    let connectedWallet = localStorage.getItem('phantomWallet') || null;

    // Helper to update wallet UI
    function updateWalletUI() {
        if (connectedWallet) {
            if (walletStatus) walletStatus.textContent = 'Connected: ' + connectedWallet.slice(0, 6) + '...' + connectedWallet.slice(-4);
            if (walletBtn) walletBtn.style.display = 'none';
            if (depositBtn) depositBtn.style.display = 'inline-block';
            if (withdrawBtn) withdrawBtn.style.display = 'inline-block';
            if (disconnectBtn) disconnectBtn.style.display = 'inline-block';
        } else {
            if (walletStatus) walletStatus.textContent = '';
            if (walletBtn) walletBtn.style.display = 'inline-block';
            if (depositBtn) depositBtn.style.display = 'none';
            if (withdrawBtn) withdrawBtn.style.display = 'none';
            if (disconnectBtn) disconnectBtn.style.display = 'none';
        }
    }
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', async function() {
            // Disconnect Phantom
            if (isPhantomInstalled() && window.solana.isConnected) {
                try { await window.solana.disconnect(); } catch (e) {}
            }
            // Remove from backend
            const userId = localStorage.getItem('userId');
            if (userId) {
                await fetch(`${API_BASE}/crypto-disconnect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                });
            }
            localStorage.removeItem('phantomWallet');
            connectedWallet = null;
            updateWalletUI();
        });
    }

    // Do NOT auto-connect to Phantom on load. If a wallet is stored but Phantom
    // is not actually connected, clear the stale storage so manual connect
    // always triggers the Phantom popup (allowing wallet switching).
    if (isPhantomInstalled() && window.solana && window.solana.isConnected) {
        const walletAddress = window.solana.publicKey?.toString();
        if (walletAddress) {
            connectedWallet = walletAddress;
            localStorage.setItem('phantomWallet', walletAddress);
        }
    } else {
        // Remove stale localStorage entry to avoid hiding connect button
        if (localStorage.getItem('phantomWallet')) {
            localStorage.removeItem('phantomWallet');
            connectedWallet = null;
        }
    }
    updateWalletUI();

    if (walletBtn) {
        walletBtn.addEventListener('click', async function() {
            const userId = localStorage.getItem('userId');
            // Disconnect first if already connected to force account selection
            if (isPhantomInstalled() && window.solana.isConnected) {
                try {
                    await window.solana.disconnect();
                } catch (e) {
                    console.warn('Disconnect failed:', e);
                }
            }
            // Instantly hide connect button for UX
            walletBtn.style.display = 'none';
            // Always force Phantom popup (do not use onlyIfTrusted)
            let walletAddress = null;
            try {
                const resp = await window.solana.connect();
                if (resp && resp.publicKey) {
                    walletAddress = resp.publicKey.toString();
                }
            } catch (e) {}
            if (walletAddress) {
                connectedWallet = walletAddress;
                localStorage.setItem('phantomWallet', walletAddress);
                try {
                    await requestDepositAddress(userId, walletAddress);
                } catch (err) {
                    console.warn('deposit request failed:', err);
                }
                updateWalletUI();
            } else {
                // If failed, show button again
                walletBtn.style.display = 'inline-block';
                updateWalletUI();
            }
        });
    }
    if (depositBtn) {
        depositBtn.addEventListener('click', async function() {
            const userId = localStorage.getItem('userId');
            // Always check Phantom connection and get latest address
            let walletAddress = localStorage.getItem('phantomWallet');
            if (isPhantomInstalled() && window.solana.isConnected && window.solana.publicKey) {
                walletAddress = window.solana.publicKey.toString();
                localStorage.setItem('phantomWallet', walletAddress);
            }
            if (!walletAddress) {
                alert('Connect your Phantom Wallet first.');
                return;
            }
            const { depositAddress, memo } = await requestDepositAddress(userId, walletAddress);
            const amount = prompt('Enter amount of SOL to deposit:');
            if (!amount || isNaN(amount) || Number(amount) <= 0) return;
            try {
                // Open Phantom send popup
                const solana = window.solana;
                if (!solana) throw new Error('Phantom not found');
                // Re-check connection before sending
                if (!solana.isConnected) {
                    await solana.connect();
                }
                // Use Phantom's send method
                const result = await solana.request({
                    method: 'sendTransaction',
                    params: [depositAddress, { amount: amount.toString() }]
                });
                alert('Transaction sent! Signature: ' + result + '\nWaiting for confirmation...');
                // Confirm with backend
                const confirmRes = await confirmDeposit(userId, result);
                if (confirmRes.success) {
                    alert('Deposit successful! Amount credited: ' + confirmRes.amount + ' SOL');
                } else {
                    alert('Deposit failed: ' + (confirmRes.error || 'Unknown error'));
                }
            } catch (e) {
                alert('Transaction failed: ' + (e.message || e));
            }
        });
    }
    // Hide connect button if wallet is linked
    updateWalletUI();
});
