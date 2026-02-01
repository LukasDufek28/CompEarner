// Phantom Wallet and Crypto Handling API
// Handles deposit and withdrawal endpoints for Solana/SPL tokens

const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const db = require('./lib/db');

const connection = new Connection(clusterApiUrl('mainnet-beta'));

async function handler(req, res) {
    // Normalize pathname so this handler works behind Vercel routing
    const fullUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = fullUrl.pathname || req.url || '';

    if (req.method === 'POST' && pathname.endsWith('/deposit-request')) {
        const { userId, walletAddress } = req.body;
        if (!userId || !walletAddress) return res.status(400).json({ error: 'Missing userId or walletAddress' });
        await db.saveUserWallet(userId, walletAddress);
        const depositAddress = process.env.SOLANA_DEPOSIT_ADDRESS;
        const memo = userId;
        return res.json({ depositAddress, memo });
    }
    if (req.method === 'POST' && pathname.endsWith('/confirm-deposit')) {
        const { userId, signature } = req.body;
        if (!userId || !signature) return res.status(400).json({ error: 'Missing userId or signature' });
        try {
            const tx = await connection.getParsedTransaction(signature, { commitment: 'confirmed' });
            if (!tx) return res.status(404).json({ error: 'Transaction not found' });
            // Validate destination, amount, memo
            let found = false;
            let creditedAmount = 0;
            const depositAddress = process.env.SOLANA_DEPOSIT_ADDRESS;
            const expectedMemo = userId;
            if (tx.transaction && tx.meta && tx.meta.postBalances && tx.transaction.message) {
                const instructions = tx.transaction.message.instructions;
                for (const ix of instructions) {
                    if (ix.parsed && ix.parsed.type === 'transfer') {
                        const dest = ix.parsed.info.destination;
                        const amount = Number(ix.parsed.info.lamports) / 1e9; // SOL
                        const memoIx = instructions.find(i => i.program === 'spl-memo');
                        const memo = memoIx && memoIx.parsed ? memoIx.parsed : null;
                        if (dest === depositAddress && (!memo || memo === expectedMemo)) {
                            found = true;
                            creditedAmount += amount;
                        }
                    }
                }
            }
            if (!found || creditedAmount <= 0) return res.status(400).json({ error: 'No valid deposit found in transaction.' });
            await db.creditUserBalance(userId, creditedAmount);
            await db.logTransaction({ type: 'crypto_deposit', userId, amount: creditedAmount, signature, timestamp: new Date().toISOString() });
            return res.json({ success: true, amount: creditedAmount });
        } catch (e) {
            return res.status(500).json({ error: 'Blockchain check failed' });
        }
    }
    if (req.method === 'POST' && pathname.endsWith('/withdraw')) {
        const { userId, amount } = req.body;
        if (!userId || !amount || isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Invalid withdrawal request' });
        try {
            const user = await db.getUser(userId);
            if (!user || !user.walletAddress) return res.status(400).json({ error: 'User or wallet not found' });
            if ((user.balance || 0) < amount) return res.status(400).json({ error: 'Insufficient balance' });
            // Send transaction (pseudo, implement with private key or custodian wallet)
            // const txSignature = await sendSolToUser(user.walletAddress, amount);
            await db.debitUserBalance(userId, amount);
            await db.logTransaction({ type: 'crypto_withdraw', userId, amount, to: user.walletAddress, timestamp: new Date().toISOString() });
            return res.json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: 'Withdrawal failed' });
        }
    }
    return res.status(405).json({ error: 'Method not allowed' });
}

module.exports = handler;
