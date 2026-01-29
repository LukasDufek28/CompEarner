# Authentication Flow Diagram

## Google OAuth Login Flow

```
┌─────────────┐
│    USER     │
└──────┬──────┘
       │ 1. Clicks "Sign in with Google"
       ▼
┌─────────────────────┐
│  Google OAuth Pop-up│
│  (Select Account)   │
└──────┬──────────────┘
       │ 2. User selects Google account
       ▼
┌──────────────────────────────────┐
│  Google Authorization Server     │
│  - Verifies user identity        │
│  - Generates ID token (JWT)      │
└──────┬───────────────────────────┘
       │ 3. Returns credential token
       ▼
┌───────────────────────────────────┐
│  Frontend (script.js)             │
│  handleCredentialResponse()       │
│  - Receives Google credential     │
│  - Sends to backend API           │
└──────┬────────────────────────────┘
       │ 4. POST /api/auth/google
       │    { credential: "eyJhb..." }
       ▼
┌───────────────────────────────────────┐
│  Backend (/api/auth/google.js)        │
│  1. Verify token with Google          │
│  2. Extract user info (email, name)   │
│  3. Check if user exists              │
│     ├─ New user: Create account       │
│     └─ Existing: Update last login    │
│  4. Generate JWT session token        │
└──────┬────────────────────────────────┘
       │ 5. Returns user data + JWT token
       │    { success: true, user: {...}, token: "..." }
       ▼
┌───────────────────────────────────┐
│  Frontend (script.js)             │
│  - Stores JWT in localStorage     │
│  - Updates app state              │
│  - Shows user info in navbar      │
│  - Enables match actions          │
└───────────────────────────────────┘
```

## Session Persistence Flow

```
┌─────────────┐
│  Page Load  │
└──────┬──────┘
       │
       ▼
┌────────────────────────┐
│ checkExistingSession() │
│ - Reads localStorage   │
└──────┬─────────────────┘
       │
       ├─ No token found? → Show Google Sign-In button
       │
       └─ Token found
          │
          ▼
     ┌──────────────────────────┐
     │ GET /api/profile/{userId} │
     │ Authorization: Bearer ... │
     └──────┬───────────────────┘
            │
            ├─ Token invalid? → Clear storage, show login
            │
            └─ Token valid
               │
               ▼
          ┌─────────────────────┐
          │ Restore user session │
          │ - Update UI          │
          │ - Load matches       │
          └─────────────────────┘
```

## Match Creation Flow (Authenticated)

```
┌─────────────┐
│    USER     │
│ (Logged In) │
└──────┬──────┘
       │ Clicks "Create Match"
       ▼
┌─────────────────────┐
│  Create Match Modal │
│  - Select game      │
│  - Select mode      │
│  - Choose entry fee │
└──────┬──────────────┘
       │ Clicks "Create"
       ▼
┌──────────────────────────────────┐
│  POST /api/matches/create        │
│  Headers:                        │
│    Authorization: Bearer {token} │
│  Body:                           │
│    { game, mode, entryFee }      │
└──────┬───────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Backend Verification            │
│  1. Verify JWT token             │
│  2. Check user balance >= fee    │
│  3. Deduct entry fee             │
│  4. Create match record          │
│  5. Update user balance          │
└──────┬──────────────────────────┘
       │
       └─ Success → Match created
          │
          ▼
┌─────────────────────┐
│  Frontend Update    │
│  - Refresh matches  │
│  - Update balance   │
│  - Show success msg │
└─────────────────────┘
```

## Profile Page Flow

```
┌─────────────┐
│    USER     │
└──────┬──────┘
       │ Clicks avatar/username
       ▼
┌──────────────────────────────────┐
│  profile.html?userId=xxx         │
│  - Loads from URL parameter      │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  GET /api/profile/{userId}       │
│  - Fetch user data               │
└──────┬───────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Backend Response                │
│  {                               │
│    username, email, avatar,      │
│    balance, wins, losses,        │
│    totalWagered, totalWon,       │
│    winRate, memberSince          │
│  }                               │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────┐
│  Display Profile    │
│  - Show avatar      │
│  - Display stats    │
│  - Calculate rates  │
│  - Show history     │
└─────────────────────┘
```

## Logout Flow

```
┌─────────────┐
│    USER     │
└──────┬──────┘
       │ Clicks "Logout"
       ▼
┌──────────────────────────────┐
│  logout() function           │
│  1. Clear localStorage       │
│     - Remove authToken       │
│     - Remove userId          │
│  2. Reset app state          │
│  3. Update UI                │
└──────┬───────────────────────┘
       │
       ▼
┌─────────────────────┐
│  Show Login State   │
│  - Hide user info   │
│  - Show Google btn  │
│  - Clear matches    │
└─────────────────────┘
```

## Database Operations

```
┌───────────────────────┐
│  Vercel KV (Redis)    │
│                       │
│  Keys:                │
│  ┌──────────────────┐ │
│  │ user:{userId}    │ │
│  │ {                │ │
│  │   userId,        │ │
│  │   email,         │ │
│  │   username,      │ │
│  │   avatar,        │ │
│  │   balance,       │ │
│  │   wins, losses,  │ │
│  │   totalWagered,  │ │
│  │   totalWon,      │ │
│  │   ...            │ │
│  │ }                │ │
│  └──────────────────┘ │
│                       │
│  ┌──────────────────┐ │
│  │ match:{matchId}  │ │
│  │ {                │ │
│  │   matchId,       │ │
│  │   game, mode,    │ │
│  │   status,        │ │
│  │   entryFee,      │ │
│  │   prizePool,     │ │
│  │   player1,       │ │
│  │   player2,       │ │
│  │   winner,        │ │
│  │   ...            │ │
│  │ }                │ │
│  └──────────────────┘ │
└───────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────┐
│  Layer 1: Google OAuth              │
│  - User verification by Google      │
│  - No password management needed    │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Layer 2: Token Verification        │
│  - Verify Google token with Google  │
│  - Prevent forged tokens            │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Layer 3: JWT Session Tokens        │
│  - Signed with JWT_SECRET           │
│  - 24-hour expiration               │
│  - Stateless authentication         │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Layer 4: API Authorization         │
│  - Bearer token in headers          │
│  - Verify on each protected request │
│  - User ID extracted from token     │
└─────────────────────────────────────┘
```

## Environment Variables

```
┌──────────────────────────────────┐
│  Vercel Environment Variables    │
│                                  │
│  JWT_SECRET                      │
│  ├─ Used to sign JWT tokens      │
│  └─ Required for auth            │
│                                  │
│  KV_URL                          │
│  KV_REST_API_URL                 │
│  KV_REST_API_TOKEN               │
│  KV_REST_API_READ_ONLY_TOKEN     │
│  ├─ Auto-added by Vercel KV     │
│  └─ Database connection          │
│                                  │
│  (Frontend - in code)            │
│  GOOGLE_CLIENT_ID                │
│  ├─ In google-config.js          │
│  └─ Public, not secret           │
└──────────────────────────────────┘
```

## Error Handling

```
┌─────────────────────┐
│  Potential Errors   │
└──────┬──────────────┘
       │
       ├─► Google OAuth Error
       │   └─► Show "Login failed" notification
       │       User can try again
       │
       ├─► Invalid/Expired Token
       │   └─► Clear session, redirect to login
       │       User must sign in again
       │
       ├─► Insufficient Balance
       │   └─► Show error, prevent action
       │       User needs to win matches
       │
       ├─► Network Error
       │   └─► Show retry option
       │       Graceful degradation
       │
       └─► Database Error
           └─► Log error, show generic message
               Admin notification (if configured)
```

## User Journey

```
New User:
1. Visit site → See Google Sign-In
2. Click button → Google popup
3. Select account → Authorized
4. Redirect back → Account created ($250)
5. See matches → Can create/join
6. Profile created → Stats tracked

Returning User:
1. Visit site → Auto-login (token valid)
2. See matches → Continue playing
3. Stats updated → Real-time balance
4. Can logout → Session cleared

Match Lifecycle:
1. Create match → Fee deducted
2. Wait for opponent → Status: "open"
3. Opponent joins → Status: "in-progress"
4. Admin finalizes → Status: "completed"
5. Winner paid → Balance updated
6. Stats tracked → Profile updated
```
