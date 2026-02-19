# Smack Talk Central

A real-time sports fan chat app. Send messages, run polls, react with emojis, and climb the leaderboard while watching the game.

## Features

- **Real-time chat** — powered by AWS AppSync Events; messages sync instantly across all connected users
- **Polls** — create and vote on polls during the game; see live vote percentages
- **Reactions** — quick emoji reactions (🔥 👍 😮 💪 😂) with a 30-second rolling count
- **XP & Levels** — earn XP for messages, streaks, and poll activity; progress through 5 levels
- **Leaderboard** — top 10 users ranked by XP
- **Authentication** — sign in / sign up via Clerk
- **Message persistence** — last 50 messages loaded from DynamoDB on startup

### XP System

| Action | XP |
|--------|----|
| Send a message | 5 |
| 3-message streak | +15 |
| 5-message streak | +30 |
| 10-message streak | +50 |
| Create a poll | 10 |
| Vote on a poll | 5 |

### Levels

| Level | Name | XP Required |
|-------|------|-------------|
| 1 | Rookie Ranter | 0 |
| 2 | Sideline Sniper | 100 |
| 3 | Halftime Heckler | 300 |
| 4 | Fourth-Quarter Fiend | 600 |
| 5 | Hall-of-Flame | 1000 |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Create React App |
| Auth | Clerk |
| Real-time | AWS AppSync Events |
| Persistence | AWS DynamoDB via Lambda (API Gateway) |
| Styling | Plain CSS with CSS custom properties |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Clerk](https://clerk.com) account
- An AWS account with AppSync Events and a Lambda/API Gateway backend configured

### Installation

```bash
git clone <repo-url>
cd sports-game-hub
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `REACT_APP_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (from Clerk dashboard) |
| `REACT_APP_APPSYNC_ENDPOINT` | AppSync Events API endpoint URL |
| `REACT_APP_APPSYNC_REGION` | AWS region (e.g. `us-east-2`) |
| `REACT_APP_APPSYNC_API_KEY` | AppSync API key (starts with `da2-`) |
| `REACT_APP_LAMBDA_API_URL` | API Gateway URL for the SmackTalkAPI Lambda |

### Run Locally

```bash
npm start
```

Opens at [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
```

---

## Project Structure

```
src/
├── App.js                  # Root component — state, effects, layout
├── App.css                 # All styles (CSS custom properties)
├── aws-config.js           # Amplify / AppSync configuration
├── components/
│   ├── ChatDisplay.js      # Scrollable message list
│   ├── MessageInput.js     # Text input + send button
│   ├── ReactionBar.js      # Emoji reaction buttons
│   ├── PollSidebar.js      # Polls panel (create, vote, view results)
│   ├── CreatePoll.js       # New poll modal
│   ├── LeaderboardSidebar.js # Top users ranked by XP
│   ├── ScoreControls.js    # Score input controls (unused)
│   ├── ScoreTracker.js     # Live score display (unused)
│   ├── GameSelector.js     # Multi-room selector (unused)
│   └── ErrorBoundary.js    # React error boundary
├── services/
│   ├── dynamodbService.js  # Message persistence (save / load)
│   └── userStatsService.js # XP, levels, leaderboard API calls
└── utils/
    └── sanitize.js         # Input sanitization (XSS prevention)
```

### Backend API Endpoints (Lambda)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/messages?gameId=&limit=` | Load recent messages |
| `POST` | `/messages` | Save a message |
| `GET` | `/user-stats?clerkUserId=` | Fetch a user's stats |
| `POST` | `/user-stats` | Update user stats fields |
| `POST` | `/user-stats/xp` | Increment XP (and upsert username) |
| `GET` | `/leaderboard?limit=` | Top users by XP |
