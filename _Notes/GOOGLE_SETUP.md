# Google OAuth Setup Guide

This guide will walk you through setting up Google Sign-In for your CompEarner platform.

## Prerequisites

- A Google account
- Your project deployed on Vercel (or running locally)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "CompEarner")
5. Click **"Create"**

## Step 2: Enable Google Sign-In API

1. In your Google Cloud Console, make sure your project is selected
2. Go to **"APIs & Services" > "Library"**
3. Search for **"Google+ API"** or **"Google Identity Services"**
4. Click on it and press **"Enable"**

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services" > "OAuth consent screen"**
2. Select **"External"** user type (unless you have a Google Workspace)
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: CompEarner
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **"Save and Continue"**
6. Skip the **"Scopes"** section (click "Save and Continue")
7. Skip the **"Test users"** section (click "Save and Continue")
8. Review and click **"Back to Dashboard"**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"Create Credentials" > "OAuth client ID"**
3. Select **"Web application"** as the application type
4. Enter a name (e.g., "CompEarner Web Client")
5. Under **"Authorized JavaScript origins"**, add:
   - `http://localhost:3000` (for local development)
   - `https://your-project-name.vercel.app` (your Vercel domain)
   - `https://comp-earner.vercel.app` (if using this domain)
6. Under **"Authorized redirect URIs"**, add:
   - `http://localhost:3000` (for local development)
   - `https://your-project-name.vercel.app` (your Vercel domain)
7. Click **"Create"**
8. **IMPORTANT**: Copy your **Client ID** - you'll need this!

## Step 5: Update Your Code

1. Open `index.html`
2. Find the line with `data-client_id="YOUR_GOOGLE_CLIENT_ID"`
3. Replace `YOUR_GOOGLE_CLIENT_ID` with the Client ID you copied

```html
<div id="g_id_onload"
     data-client_id="YOUR_ACTUAL_CLIENT_ID_HERE"
     data-callback="handleCredentialResponse"
     data-auto_prompt="false">
</div>
```

## Step 6: Deploy to Vercel (if not already deployed)

```bash
# Install Vercel CLI if you haven't already
npm install -g vercel

# Deploy
vercel --prod
```

## Step 7: Test Google Sign-In

1. Open your website (locally or on Vercel)
2. You should see a "Sign in with Google" button
3. Click it and sign in with your Google account
4. You should be logged in and see your profile information

## Database Schema

The user data is stored in Vercel KV with the following structure:

```javascript
{
  userId: "unique-id",
  email: "user@gmail.com",
  username: "User123",
  avatar: "https://lh3.googleusercontent.com/...",
  balance: 250.00,
  wins: 0,
  losses: 0,
  totalWagered: 0,
  totalWon: 0,
  createdAt: "2024-01-15T10:30:00Z",
  lastLogin: "2024-01-15T10:30:00Z",
  provider: "google"
}
```

## Vercel KV Setup

Your project already uses Vercel KV (Redis) for database storage. To set it up:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (CompEarner)
3. Go to **"Storage"** tab
4. Click **"Create Database"**
5. Select **"KV"** (Key-Value store)
6. Choose a region close to your users
7. Click **"Create"**
8. Vercel will automatically add the environment variables to your project

The following environment variables are automatically added:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

## Environment Variables Summary

Make sure these are set in your Vercel project settings:

1. **JWT_SECRET**: Random string for signing auth tokens
   - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   
2. **KV_*** variables: Automatically added by Vercel when you create KV database

3. **GOOGLE_CLIENT_ID**: (Optional) Your Google OAuth client ID
   - Only needed if you want server-side verification (already have it in HTML)

## Troubleshooting

### "redirect_uri_mismatch" error
- Make sure your domain is added to "Authorized JavaScript origins" and "Authorized redirect URIs" in Google Cloud Console
- Include both `http://localhost:3000` and your production domain

### Google button doesn't appear
- Check browser console for errors
- Verify your Client ID is correct in `index.html`
- Make sure the Google Sign-In script is loading: `https://accounts.google.com/gsi/client`

### Users can't log in
- Check that Vercel KV database is created and environment variables are set
- Check the `/api/auth/google` endpoint is working (should return JSON)

### "Invalid token" errors
- The Google token verification uses Google's public endpoint
- Make sure your server can make HTTPS requests to Google

## Security Notes

- Never commit your Google Client ID or JWT_SECRET to a public repository
- Use environment variables for all secrets
- The JWT_SECRET should be a long random string
- Tokens expire after 24 hours by default (configurable in `/api/lib/auth.js`)

## Next Steps

Once Google Sign-In is working:
1. Users will automatically get $250 starting balance
2. Their profiles are saved in Vercel KV
3. They can create and join matches
4. Their stats (wins/losses/balance) persist across sessions

For more help, check:
- [Google Sign-In Documentation](https://developers.google.com/identity/gsi/web)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
