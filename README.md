# Built Entirely by AI
Every line of code in this project was written by AI using Claude from Anthropic. Utilizing Claude chat for planning and troubleshooting the inevitable errors or bugs, Claude VS Code Extension and various Claude skill.md files were also heavily used. A human guided all the strategic decisions on designs and product options. This was/is a learning project that I very much enjoyed.  No hand-written code. No humans were injured in the making of this project. Enjoy, I'll Be Back!

# Lessons Learned

This project was a deep dive into AI-assisted development and full-stack architecture. Documenting these challenges helped solidify my understanding of the modern developer workflow.

---

### 1. AI Workflow: Managing Context Fragmentation
One of the biggest hurdles was managing the interplay between the **Claude Chat AI** and the **Claude Code CLI**. Using two interfaces for the same project inherently creates a "split-brain" effect where neither has the full context of the other's changes.

* **The Conflict:** I faced significant rework because the Chat interface was on a newer version of Sonnet, while the extension was trailing behind. I was hung-up on the "better" version.
* **The Solution:** I learned to treat the CLI as the "hands-on" developer for file manipulation and the Chat UI as the "architect" for high-level strategy, ensuring I manually synced context when switching between them. When I had AWS settings or dev tools questions I used screenshots with Claude Chat AI to gain clarity. 

### 2. Strategic Troubleshooting: The "Outside-In" Method
Initially, I found myself in "logic loops" with AI when debugging—proposing the same failing solutions repeatedly. The breakthrough came when I stopped guessing and started tracing the data flow from the end-user backward. 

**My Debugging Chain:**
1.  **UI/UX:** Used Browser DevTools to inspect React state and network requests.
2.  **Environment:** Verified `.env` variables in AWS Amplify (the "is it plugged in?" check).
3.  **API Gateway:** Identified exactly where requests were being rejected.
4.  **Lambda:** Isolated the function logic to ensure the payload was being passed correctly.
5.  **DynamoDB:** Confirmed if the data actually reached the table.

### 3. Key Observations & Growth
* **Purposeful Deployment:** I deliberately chose **AWS Amplify** to abstract the publishing process. This allowed me to focus my energy on the interplay between the frontend and backend rather than wrestling with CI/CD pipelines.
* **User-Driven Iteration:** I didn't originally plan to use a database. However, early feedback—*"I wish I could save my progress"*—pivoted the project toward **DynamoDB**. This taught me the "push and pull" of product management: balancing a technical roadmap with actual user needs. I've experienced this for years, but its been quite a while since I had to make changes myself.
* **Refinement:** This project was a great experience in rapid prototyping. I plan to continue making minor updates as I encounter new edge cases.

---

# Smack Talk Central

A real-time sports fan chat app. Send messages, run polls, and react with emojis while watching the game.

## Features

- **Real-time chat** — powered by AWS AppSync Events; messages sync instantly across all connected users; supports text messages and media (GIFs/clips)
- **Polls** — create and vote on polls during the game; see live vote percentages
- **Reactions** — quick emoji reactions (🔥 👍 😮 💪 😂) with a 30-second rolling count
- **XP & Levels** — earn XP for messages, streaks, and poll activity; progress through 5 levels
- **Authentication** — sign in / sign up via Clerk
- **Message persistence** — last 50 messages loaded from DynamoDB on startup
- **GIF & Clip Sharing** — search and share sports-themed GIFs, clips, and stickers powered by Klipy; includes trending content and debounced search

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
| Sports Content | Klipy API |
| Styling | Plain CSS with CSS custom properties |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Clerk](https://clerk.com) account (dev account used for cost & ease)
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
| `REACT_APP_KLIPY_API_KEY` | Klipy API key for sports GIF/clip content |

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
│   ├── ChatDisplay.js      # Scrollable message list (supports media)
│   ├── MessageInput.js     # Text input + GIF button + send button
│   ├── ReactionBar.js      # Emoji reaction buttons
│   ├── PollSidebar.js      # Polls panel (create, vote, view results)
│   ├── CreatePoll.js       # New poll modal
│   ├── KlipyPicker.js      # GIF/clip search and selection modal
│   └── ErrorBoundary.js    # React error boundary
├── services/
│   ├── dynamodbService.js  # Message persistence (save / load)
│   ├── userStatsService.js # XP and levels management
│   └── klipyService.js     # Klipy API integration (search, trending, validation)
└── utils/
    └── sanitize.js         # Input sanitization + media URL validation
```

### Backend API Endpoints (Lambda)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/messages?gameId=&limit=` | Load recent messages |
| `POST` | `/messages` | Save a message |
| `GET` | `/user-stats?clerkUserId=` | Fetch a user's stats |
| `POST` | `/user-stats` | Update user stats fields |
| `POST` | `/user-stats/xp` | Increment XP (and upsert username) |

---

## Testing

The project uses Jest and React Testing Library for component testing.

```bash
npm test
```

**Current Status:**
- Testing framework configured via Create React App
- React Testing Library and jest-dom installed
- Basic test setup in place
- Comprehensive test coverage is a work in progress
