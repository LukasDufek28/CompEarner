# CompEarner Deployment Guide

## Quick Deploy to Vercel

### 1. Prerequisites
- Vercel account (free)
- GitHub account (optional but recommended)

### 2. Deploy Steps

#### Option A: Deploy with Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Install dependencies
npm install

# Generate admin credentials
node setup.js

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# Set up Vercel KV database
# Go to your Vercel dashboard
# Storage → Create Database → KV
# Link it to your project

# Deploy to production
vercel --prod
```

#### Option B: Deploy with GitHub

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

2. Import to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Add environment variables (see below)
   - Click "Deploy"

3. Add Vercel KV:
   - Go to your project in Vercel dashboard
   - Storage → Create Database → KV
   - Select your project to link

### 3. Environment Variables

Run `node setup.js` to generate these values, then add them in Vercel:

```
JWT_SECRET=your-generated-secret
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD_HASH=your-generated-hash
```

**In Vercel Dashboard:**
1. Go to Project Settings
2. Environment Variables
3. Add each variable above
4. Select all environments (Production, Preview, Development)

### 4. Access Your Site

After deployment:
- **Main site**: `https://your-project.vercel.app`
- **Admin panel**: `https://your-project.vercel.app/admin.html`

### 5. Local Development

```bash
# Install dependencies
npm install

# Create .env.local (use output from setup.js)
node setup.js
# Copy the local development variables to .env.local

# Link to Vercel project
vercel link

# Pull environment variables
vercel env pull .env.local

# Start development server
npm run dev
```

Access at:
- Main site: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin.html`

## Post-Deployment Checklist

✅ Verify environment variables are set  
✅ Vercel KV database is linked  
✅ Admin login works at `/admin.html`  
✅ Can create matches on main site  
✅ Can join matches  
✅ Admin can finalize matches  
✅ Balance updates correctly

## Troubleshooting

### "Failed to load matches"
- Check Vercel KV is linked
- Check environment variables are set
- Check function logs in Vercel dashboard

### "Invalid credentials" on admin login
- Verify ADMIN_PASSWORD_HASH matches your password
- Re-run `node setup.js` if needed
- Update environment variables in Vercel

### API errors
- Check Vercel function logs
- Ensure all environment variables are set
- Verify KV database is linked

### Local development not working
- Run `vercel link` to link project
- Run `vercel env pull .env.local` to get KV credentials
- Restart dev server after pulling environment variables

## Security Notes

🔒 **IMPORTANT:**
- Never commit `.env.local` or `.env` files
- Keep JWT_SECRET secure
- Use strong admin passwords (12+ characters)
- Enable 2FA on your Vercel account
- Regularly rotate credentials
- Monitor admin access logs

## Custom Domain

To add a custom domain:
1. Go to Vercel project settings
2. Domains → Add Domain
3. Follow DNS configuration steps
4. Wait for SSL certificate

## Monitoring

Access logs and metrics:
- Vercel Dashboard → Your Project → Analytics
- View function invocations, errors, and performance
- Set up error notifications

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel KV Docs: https://vercel.com/docs/storage/vercel-kv
- GitHub Issues: Report bugs in your repository

---

**Need help?** Check the README.md for API documentation and feature details.
