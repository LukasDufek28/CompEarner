// Sample profit calculation for a skill-based match platform
// Adjust these values as needed


function calculateProfit({
  matchAmount = 10, // total prize pool per match
  matchFeePercent = 5, // your platform fee %
  withdrawalFee = 0.5, // fixed fee per withdrawal
  depositFeePercent = 3, // payment processor fee % on deposit
  withdrawalProcessorFeePercent = 3, // payment processor fee % on withdrawal
  kycCost = 1, // KYC cost per user
  usersPerMatch = 2, // number of users per match
  matchesPerWithdrawal = 5, // avg matches played before withdrawal
  avgDepositAmount = 50, // average deposit size
  avgWithdrawalAmount = 50, // average withdrawal size
  avgMatchesPerUser = 5 // average matches played per user (for KYC amortization)
} = {}) {
  // Platform revenue per match (no processor fee on internal movement)
  const matchFee = (matchAmount * matchFeePercent) / 100;

  // Amortized KYC cost per match (spread over avg matches per user)
  const kycPerMatch = (kycCost * usersPerMatch) / avgMatchesPerUser;

  // Withdrawal fee profit (spread over matches)
  const withdrawalFeePerMatch = withdrawalFee / matchesPerWithdrawal;

  // Payment processor fees (only on deposit/withdrawal, not per match)
  const depositProcessorFee = (avgDepositAmount * depositFeePercent) / 100;
  const withdrawalProcessorFee = (avgWithdrawalAmount * withdrawalProcessorFeePercent) / 100;
  // Spread these fees over the number of matches played per deposit/withdrawal
  const depositProcessorFeePerMatch = depositProcessorFee / matchesPerWithdrawal;
  const withdrawalProcessorFeePerMatch = withdrawalProcessorFee / matchesPerWithdrawal;

  // Total profit per match (platform fee + withdrawal fee - KYC - processor fees)
  const profit = matchFee + withdrawalFeePerMatch - kycPerMatch - depositProcessorFeePerMatch - withdrawalProcessorFeePerMatch;

  return {
    matchFee,
    withdrawalFeePerMatch,
    kycPerMatch,
    depositProcessorFeePerMatch,
    withdrawalProcessorFeePerMatch,
    profit,
  };
}


// Simulation: 5 duos (10 users) each play 5 $10 games, then withdraw
const duos = 5;
const users = duos * 2;
const gamesPerDuo = 5;
const totalGames = duos * gamesPerDuo;
const matchAmount = 10;

// Each user deposits once, plays 5 games, then withdraws once
const depositFeePercent = 3;
const withdrawalProcessorFeePercent = 3;
const withdrawalFee = 0.5;
const kycCost = 1;
const avgDepositAmount = matchAmount * gamesPerDuo; // $50 per user
const avgWithdrawalAmount = matchAmount * gamesPerDuo; // $50 per user

let totalMatchFee = 0;
let totalWithdrawalFee = 0;
let totalKyc = 0;
let totalDepositProcessorFee = 0;
let totalWithdrawalProcessorFee = 0;

for (let i = 0; i < totalGames; i++) {
  const result = calculateProfit({
    matchAmount,
    matchFeePercent: 5,
    withdrawalFee,
    depositFeePercent,
    withdrawalProcessorFeePercent,
    kycCost,
    usersPerMatch: 2,
    matchesPerWithdrawal: gamesPerDuo, // 5 games per withdrawal
    avgDepositAmount,
    avgWithdrawalAmount,
    avgMatchesPerUser: gamesPerDuo // amortize KYC over 5 games
  });
  totalMatchFee += result.matchFee;
  totalWithdrawalFee += result.withdrawalFeePerMatch;
  totalKyc += result.kycPerMatch;
  totalDepositProcessorFee += result.depositProcessorFeePerMatch;
  totalWithdrawalProcessorFee += result.withdrawalProcessorFeePerMatch;
}

const totalProfit = totalMatchFee + totalWithdrawalFee - totalKyc - totalDepositProcessorFee - totalWithdrawalProcessorFee;

console.log('--- Simulation: 5 duos, 5 games each, $10/game ---');
console.log('Total Games:', totalGames);
console.log('Total Users:', users);
console.log('Total Match Fee Revenue: $' + totalMatchFee.toFixed(2));
console.log('Total Withdrawal Fee Collected: $' + totalWithdrawalFee.toFixed(2));
console.log('Total KYC Cost: $' + totalKyc.toFixed(2));
console.log('Total Deposit Processor Fees: $' + totalDepositProcessorFee.toFixed(2));
console.log('Total Withdrawal Processor Fees: $' + totalWithdrawalProcessorFee.toFixed(2));
console.log('Total Estimated Profit: $' + totalProfit.toFixed(2));
console.log('Estimated Profit per Match: $' + (totalProfit / totalGames).toFixed(2));
