# CompEarner - Competitive Gaming Wagering Platform

A cyberpunk-styled competitive gaming wagering platform with Google authentication, real-time match management, and admin controls.

## 🚀 Quick Start

### For Google Authentication Setup:
```bash
npm install              # Install dependencies
```

Then follow [QUICKSTART_GOOGLE.md](QUICKSTART_GOOGLE.md) to set up Google Sign-In (10 minutes).

### For Full Deployment:
```bash
npm run setup           # Generate admin credentials
vercel --prod           # Deploy to production
```

See [QUICKSTART.md](QUICKSTART.md) for detailed setup guide.

## Features

- 🔐 **Google Sign-In** - One-click authentication with Google OAuth
- 👤 **User Profiles** - Persistent accounts with stats and match history
- 💰 **Starting Balance** - New users get $250 to start competing
- 🎮 **Match System** - Create and join 1v1 competitive matches
- 💸 **Prize Pools** - Winner takes 95% (5% platform fee)
- 🏆 **Win/Loss Tracking** - Real-time statistics and win rates
- 👑 **Admin Panel** - Match finalization and platform management
- 🔒 **Secure Auth** - JWT tokens with automatic session management
- ⚡ **Serverless Backend** - Scalable Vercel Functions + KV database

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Vercel KV (Redis)
- **Authentication**: 
  - Google OAuth 2.0 (users)
  - JWT + bcrypt (admin)
- **Deployment**: Vercel

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   npm run setup
   # Follow prompts and save the output to .env.local
   ```

3. **Link to Vercel (for KV database):**
   ```bash
   npm install -g vercel
   vercel link
   vercel env pull .env.local
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Main site: `http://localhost:3000`
   - Admin panel: `http://localhost:3000/admin.html`

## Deployment to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Set up Vercel KV Storage:**
   - Go to your Vercel dashboard
   - Navigate to Storage → Create Database → KV
   - Link it to your project

3. **Add environment variables in Vercel:**
   ```bash
   vercel env add JWT_SECRET
   vercel env add ADMIN_USERNAME
   vercel env add ADMIN_PASSWORD_HASH
   ```

4. **Deploy:**
   ```bash
   vercel --prod
   ```

## Admin Panel

Access at `/admin.html`

**Default credentials (CHANGE THESE!):**
- Username: admin
- Password: (set in environment variables)

**Admin capabilities:**
- View all matches (open, in-progress, completed)
- Finalize matches and declare winners
- Process payouts to winners
- View platform statistics
- Cancel matches and refund players

## API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth authentication

### Public Endpoints
- `GET /api/matches` - Get all matches
- `POST /api/matches/create` - Create a new match (requires auth)
- `POST /api/matches/join` - Join a match (requires auth)
- `GET /api/profile/:userId` - Get user profile

### User Endpoints (require JWT token)
- `PUT /api/profile/update` - Update user profile

### Admin Endpoints (require admin JWT token)
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/finalize-match` - Finalize match and declare winner
- `POST /api/admin/cancel-match` - Cancel match and refund
- `GET /api/admin/stats` - Get platform statistics

## Database Schema

### Users
```javascript
{
  userId: string,              // UUID v4
  email: string,               // From Google OAuth
  username: string,            // Extracted from email or Google profile
  avatar: string,              // Google profile picture URL
  balance: number,             // Starting: $250
  wins: number,
  losses: number,
  totalWagered: number,        // Lifetime total wagered
  totalWon: number,            // Lifetime total won
  createdAt: timestamp,        // ISO 8601
  lastLogin: timestamp,        // ISO 8601
  provider: 'google'           // OAuth provider
}
```

### Matches
```javascript
{
  matchId: string,
  game: string,
  mode: string,
  status: 'open' | 'in-progress' | 'completed' | 'cancelled',
  entryFee: number,
  prizePool: number,
  player1: { userId, username, avatar },
  player2: { userId, username, avatar } | null,
  winner: userId | null,
  createdAt: timestamp,
  finalizedAt: timestamp | null
}
```

## Security Notes

- Always use HTTPS in production
- Change default admin credentials
- Keep JWT_SECRET secure and never commit it
- Implement rate limiting for production
- Add proper input validation
- Consider adding 2FA for admin accounts

## License

MIT
