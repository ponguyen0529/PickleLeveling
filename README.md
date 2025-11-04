# Pickleball Progress Lab

A focused daily training companion where pickleball players can log in, complete skill-driven quests, and level up their real-world game. The app pairs an Express backend with a lightweight vanilla JavaScript interface served from the same server.

## Features

- Account creation and login backed by hashed credentials (bcryptjs + cookie sessions).
- Auto-generated lineup of five shot-focused quests that refresh at midnight with streak tracking and two daily swaps.
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
+-- data/                 # JSON persistence for user profiles and quest history
+-- public/               # Static assets (HTML, CSS, JS)
+-- src/
    +-- server/           # Express app, quest templates, and services
```

## Configuration

- `PORT`: Port number for the Express server (defaults to `3000`).
- `SESSION_SECRET`: Session signing secret. **Set this in production.**
- `DATA_PATH`: Optional filesystem path for the JSON datastore (defaults to `./data/db.json`).
- `COOKIE_SECURE`: Set to `"true"` to mark the session cookie as secure (recommended behind HTTPS proxies).
- `COOKIE_SAMESITE`: Override the `SameSite` attribute applied to the session cookie (defaults to `"lax"`).

## Deploying to Render

1. **Commit your code** to a Git repository Render can access (GitHub, GitLab, or Bitbucket).
2. **Review `render.yaml`** in the project root. It provisions a Node web service, mounts a persistent disk at `/var/data`, and generates a secure `SESSION_SECRET`.
3. **Create a new Web Service** on Render:
   - Choose the **Blueprint** option and point Render at your repository. Render will detect `render.yaml` and provision everything automatically, *or*
   - Create a manual Node Web Service with the following settings:
     - Build command: `npm install`
     - Start command: `npm start`
     - Environment variables: `NODE_ENV=production`, `SESSION_SECRET` (Generate), `COOKIE_SECURE=true`, `DATA_PATH=/var/data/db.json`
     - Persistent disk: 1 GB mounted at `/var/data`
4. **Deploy.** Render installs dependencies and boots the Express server. Once the build finishes your service URL is live.
5. **Seed data (optional).** The default datastore is a JSON file, so your Render instance starts empty. Upload a prepared `db.json` to the mounted disk or add onboarding logic if you need starter data.

The Express app already respects `PORT`, trusts the Render proxy when `COOKIE_SECURE=true`, and persists player data to whichever path you provide via `DATA_PATH`.

## Notes & Next Steps

- Data persistence currently uses a JSON file for easy prototyping. Swap in a database-backed store for production workloads.
- Sessions use the in-memory store from `express-session`. Configure a persistent store (Redis, database) before deploying multiple instances.
- The quest templates (`src/server/questTemplates.js`) are a starting point. Extend the list or expose admin tooling to curate quests per skill tier.
- Consider adding push notifications or calendar sync to help players plan their training ahead of time.

