# 🧪 Testing Checklist

Use this checklist to verify your deployment is working correctly.

## Pre-Deployment Tests (Local)

### Environment Setup
- [ ] Dependencies installed (`npm install`)
- [ ] Admin credentials generated (`npm run setup`)
- [ ] `.env.local` created with credentials
- [ ] Development server starts (`npm run dev`)
- [ ] No console errors on startup

### Frontend Tests
- [ ] Main page loads at `http://localhost:3000`
- [ ] Hero section displays correctly
- [ ] "Get Started" button works
- [ ] After login, balance displays in navbar
- [ ] Match grid displays
- [ ] Match filters work (All, Open, In Progress, CS2, Valorant)

### Match Creation Tests
- [ ] Click "Create Match" button
- [ ] Modal opens
- [ ] Can select game type
- [ ] Can select game mode
- [ ] Can select entry fee
- [ ] Prize amount calculates correctly (entry fee × 2 × 0.95)
- [ ] "Create Match" deducts balance
- [ ] New match appears in grid
- [ ] Match shows as "Open" status

### Match Joining Tests
- [ ] Can click "Join Match" on open match
- [ ] Balance deducts entry fee
- [ ] Match status changes to "In Progress"
- [ ] Both players display in match card
- [ ] "Watch Live" button appears

### Admin Panel Tests
- [ ] Admin panel loads at `/admin.html`
- [ ] Can login with generated credentials
- [ ] Dashboard displays after login
- [ ] Statistics cards show data
- [ ] Tabs switch correctly (In Progress, Open, Completed, All)
- [ ] Matches display in tables

### Admin Match Management Tests
- [ ] Can view in-progress matches
- [ ] "Finalize" button appears for in-progress matches
- [ ] Click "Finalize" opens winner selection modal
- [ ] Can select winner
- [ ] "Finalize & Pay Winner" processes correctly
- [ ] Match moves to "Completed" tab
- [ ] Winner receives prize pool
- [ ] Statistics update

### Admin Match Cancellation Tests
- [ ] Can cancel open matches
- [ ] Can cancel in-progress matches
- [ ] Players receive refunds
- [ ] Match shows as "Cancelled"

## Post-Deployment Tests (Production)

### Deployment Verification
- [ ] Site deployed successfully to Vercel
- [ ] Environment variables set in Vercel
- [ ] Vercel KV database created and linked
- [ ] No build errors
- [ ] No deployment errors

### Production URL Tests
- [ ] Main site loads: `https://your-project.vercel.app`
- [ ] Admin panel loads: `https://your-project.vercel.app/admin.html`
- [ ] No 404 errors
- [ ] HTTPS enabled
- [ ] Assets load correctly

### API Tests
- [ ] GET `/api/matches` returns data
- [ ] POST `/api/matches/create` works
- [ ] POST `/api/matches/join` works
- [ ] POST `/api/admin/login` authenticates
- [ ] POST `/api/admin/finalize-match` processes
- [ ] POST `/api/admin/cancel-match` works
- [ ] GET `/api/admin/stats` returns statistics

### Database Tests
- [ ] Vercel KV stores user data
- [ ] Vercel KV stores match data
- [ ] Data persists across sessions
- [ ] Matches auto-refresh
- [ ] Balance updates save

### Cross-Browser Tests
- [ ] Chrome/Edge works
- [ ] Firefox works
- [ ] Safari works (if on Mac)
- [ ] Mobile Chrome works
- [ ] Mobile Safari works

### Responsive Design Tests
- [ ] Desktop view (1920px) looks good
- [ ] Laptop view (1440px) looks good
- [ ] Tablet view (768px) looks good
- [ ] Mobile view (375px) looks good
- [ ] Navigation adapts on mobile
- [ ] Match grid stacks on mobile
- [ ] Admin panel usable on mobile

### Security Tests
- [ ] Admin login requires correct credentials
- [ ] Wrong password rejected
- [ ] JWT token required for admin endpoints
- [ ] Invalid token rejected
- [ ] Expired token rejected
- [ ] User can't finalize matches
- [ ] CORS headers set correctly

### Performance Tests
- [ ] Page loads in < 3 seconds
- [ ] Match refresh works smoothly
- [ ] No memory leaks
- [ ] API responses < 1 second
- [ ] Images load quickly
- [ ] Animations smooth (60fps)

## Edge Cases to Test

### Balance Tests
- [ ] Can't join match with insufficient balance
- [ ] Can't create match with insufficient balance
- [ ] Balance never goes negative
- [ ] Balance updates are atomic

### Match Tests
- [ ] Can't join own match
- [ ] Can't join full match
- [ ] Can't join completed match
- [ ] Can't finalize match without two players
- [ ] Can only finalize in-progress matches

### Admin Tests
- [ ] Can't access admin endpoints without token
- [ ] Token expires after 24 hours
- [ ] Multiple admins can work simultaneously
- [ ] Can't cancel completed matches

### Error Handling
- [ ] Network errors show user-friendly messages
- [ ] API errors don't crash frontend
- [ ] Invalid data rejected gracefully
- [ ] Missing fields show validation errors

## Monitoring Setup

- [ ] Vercel Analytics enabled
- [ ] Function logs accessible
- [ ] Error notifications configured
- [ ] Performance metrics visible

## Documentation

- [ ] README.md is complete
- [ ] DEPLOYMENT.md is accurate
- [ ] QUICKSTART.md is clear
- [ ] API endpoints documented
- [ ] Environment variables listed

## Production Readiness

- [ ] All tests passing
- [ ] No console errors
- [ ] No console warnings
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation complete
- [ ] Monitoring enabled

---

## Test Results

**Date Tested:** _____________  
**Tested By:** _____________  
**Environment:** [ ] Local [ ] Staging [ ] Production  
**Result:** [ ] Pass [ ] Fail  

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

## Issues Found

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
|       |          |        |       |
|       |          |        |       |
|       |          |        |       |

---

**All tests passed? 🎉 You're ready to go live!**
