# 🚀 Quick Start Guide

Get CompEarner running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Generate Admin Credentials

```bash
npm run setup
```

Follow the prompts and save the generated credentials.

## Step 3: Local Development (Optional)

Create `.env.local` and paste the credentials from step 2:

```bash
# .env.local
JWT_SECRET="your-generated-secret"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="your-generated-hash"
```

Then run:

```bash
npm run dev
```

Visit: http://localhost:3000

## Step 4: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables in Vercel dashboard
# (use credentials from step 2)

# Add Vercel KV database
# Dashboard → Storage → Create Database → KV

# Deploy to production
vercel --prod
```

## Step 5: Test Your Deployment

1. **Visit your site**: `https://your-project.vercel.app`
2. **Click "Get Started"** to simulate login
3. **Create a match** 
4. **Visit admin panel**: `https://your-project.vercel.app/admin.html`
5. **Login with your credentials**
6. **Finalize matches** and process payouts

## 🎮 Features Ready to Use

✅ Create and join matches  
✅ Real-time match updates  
✅ Balance management  
✅ Admin panel for match finalization  
✅ Automatic payout processing  
✅ Win/loss tracking  
✅ Platform fee calculation  

## 📱 Admin Panel Access

URL: `/admin.html`

**Capabilities:**
- View all matches (open, in-progress, completed)
- Finalize matches and declare winners
- Process payouts automatically
- Cancel matches with refunds
- View platform statistics

## 🔧 Environment Variables Required

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `JWT_SECRET` | Token encryption key | `npm run setup` |
| `ADMIN_USERNAME` | Admin login username | `npm run setup` |
| `ADMIN_PASSWORD_HASH` | Hashed password | `npm run setup` |

## 📊 What Gets Stored in Vercel KV

- User accounts and balances
- Match data (open, in-progress, completed)
- Transaction history
- Win/loss records

## 🆘 Need Help?

- **Deployment issues?** See [DEPLOYMENT.md](DEPLOYMENT.md)
- **API documentation?** See [README.md](README.md)
- **Local dev not working?** Make sure Vercel KV is linked with `vercel link`

## 🔒 Security Reminder

- Never commit `.env.local`
- Use strong passwords (12+ characters)
- Keep JWT_SECRET secure
- Enable 2FA on Vercel account

---

**You're all set! 🎉** Your competitive gaming platform is ready to accept wagers and process payouts.
