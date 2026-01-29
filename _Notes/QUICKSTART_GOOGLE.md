# Quick Start: Getting Google Login Working

Follow these steps in order to get Google authentication working on your CompEarner platform.

## Step 1: Get Your Google Client ID (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **"APIs & Services" > "Credentials"**
4. Click **"Create Credentials" > "OAuth client ID"**
5. If prompted, configure the OAuth consent screen first:
   - Select "External"
   - Enter app name: "CompEarner"
   - Add your email
   - Save
6. Create OAuth client ID:
   - Type: **Web application**
   - Name: **CompEarner Web Client**
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://comp-earner.vercel.app` (or your domain)
   - Click **"Create"**
7. **Copy the Client ID** (looks like: `123456789-abc123def456.apps.googleusercontent.com`)

## Step 2: Add Client ID to Your Code (1 minute)

Open `google-config.js` and replace:

```javascript
window.GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
```

With your actual Client ID:

```javascript
window.GOOGLE_CLIENT_ID = '123456789-abc123def456.apps.googleusercontent.com';
```

## Step 3: Set Up Database on Vercel (2 minutes)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your CompEarner project
3. Go to **"Storage"** tab
4. Click **"Create Database"**
5. Select **"KV"** (Key-Value store)
6. Choose a region close to you
7. Click **"Create"**

✅ Done! Environment variables automatically added.

## Step 4: Add JWT Secret (1 minute)

1. In Vercel Dashboard, go to **Settings > Environment Variables**
2. Add new variable:
   - Name: `JWT_SECRET`
   - Value: Run this command to generate:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Copy the output and paste as the value
3. Click **"Save"**

## Step 5: Deploy (1 minute)

```bash
# If you haven't deployed yet
vercel --prod

# If already deployed, redeploy to apply changes
vercel --prod
```

Or just push to your Git repository if you have automatic deployments enabled.

## Step 6: Test It! (1 minute)

1. Open your website (local or production)
2. You should see "Sign in with Google" button
3. Click it
4. Sign in with your Google account
5. You should be logged in with $250 balance!

## Troubleshooting

### Button doesn't appear?
- Check browser console for errors
- Verify `google-config.js` has correct Client ID
- Make sure Google Sign-In script is loading

### "redirect_uri_mismatch" error?
- Add your domain to Google Cloud Console authorized origins
- Include both `http://localhost:3000` AND your production domain
- Make sure there are no trailing slashes

### Can't create matches?
- Make sure you're logged in (should see your avatar in navbar)
- Check browser console for API errors
- Verify Vercel KV database is created

### Profile page shows errors?
- Make sure JWT_SECRET is set in Vercel
- Check that KV environment variables are present
- Try logging out and back in

## What You Get

✅ Google Sign-In button  
✅ Automatic user accounts  
✅ $250 starting balance  
✅ Persistent sessions  
✅ User profiles  
✅ Win/loss tracking  

## Files to Configure

1. ✏️ `google-config.js` - Add your Google Client ID here
2. ✅ `index.html` - Already configured
3. ✅ `script.js` - Already configured
4. ✅ API endpoints - Already created

## Next Features to Add

After Google auth is working, you can:
- Implement real match results submission
- Add payment integration
- Build the leaderboard
- Add match history to profile page
- Enable username editing

---

**Total Time:** ~10 minutes  
**Cost:** $0 (Google OAuth is free, Vercel KV has free tier)

Need more detailed instructions? See [GOOGLE_SETUP.md](./GOOGLE_SETUP.md)
