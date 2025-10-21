# Pickleball Progress Lab

A focused daily training companion where pickleball players can log in, complete skill-driven quests, and level up their real-world game. The app pairs an Express backend with a lightweight vanilla JavaScript interface served from the same server.

## Features

- Account creation and login backed by hashed credentials (bcryptjs + cookie sessions).
- Auto-generated daily quest lineup that refreshes at midnight with streak tracking.
- XP-based leveling system with progress feedback for each player.
- Quest completion history, including recent highlights and XP gains.
- Community leaderboard that ranks players by total XP and best streak.
- Guided rating quiz that estimates your current skill level and stores tailored guidance.
- Responsive, single-page experience with vanilla JS, tailored styling, and zero build tooling.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start the server**
   ```bash
   npm start
   ```
   The app listens on `http://localhost:3000` by default. Set the environment variable `PORT` to override.
3. **Visit the app**
   Open `http://localhost:3000` in your browser. Register a new account, then log in to begin completing quests.

## Project Structure

```
.
├── data/                 # JSON persistence for user profiles and quest history
├── public/               # Static assets (HTML, CSS, JS)
└── src/server/           # Express app, quest templates, and services
```

## Configuration

- `PORT`: Port number for the Express server (defaults to `3000`).
- `SESSION_SECRET`: Set to customize the session signing secret (falls back to a development-safe default).

## Notes & Next Steps

- Data persistence uses a simple JSON file for easy prototyping. For production, replace with a real database and swap `dataStore.js` accordingly.
- Sessions use the in-memory store from `express-session`. Configure a persistent store (Redis, database) before deploying to multiple instances.
- The quest templates (`src/server/questTemplates.js`) are a starting point. Extend the list or expose admin tooling to curate quests per skill tier.
- Consider adding push notifications or calendar sync to help players plan their training ahead of time.
