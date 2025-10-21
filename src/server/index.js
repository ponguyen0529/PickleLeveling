const path = require("path");
const express = require("express");
const session = require("express-session");

const userService = require("./services/userService");
const quizService = require("./services/quizService");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "pickleball-quest-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

app.use((req, _res, next) => {
  req.userId = req.session.userId;
  next();
});

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return next();
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password, email, gender } = req.body;
    const user = await userService.register({
      username,
      password,
      email,
      gender
    });
    req.session.userId = user.id;
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await userService.authenticate(username, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    req.session.userId = user.id;
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get("/api/auth/me", async (req, res) => {
  if (!req.session.userId) {
    return res.json({ authenticated: false });
  }
  try {
    const profile = await userService.getProfile(req.session.userId);
    return res.json({ authenticated: true, user: profile });
  } catch (error) {
    return res.status(500).json({ error: "Could not load profile" });
  }
});

app.get("/api/quests/daily", requireAuth, async (req, res) => {
  try {
    const data = await userService.getDailyQuests(req.session.userId);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/quests/:questId/complete", requireAuth, async (req, res) => {
  try {
    const result = await userService.completeQuest(
      req.session.userId,
      req.params.questId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/quests/history", requireAuth, async (req, res) => {
  try {
    const history = await userService.getQuestHistory(req.session.userId);
    res.json({ history });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/community/leaderboard", async (_req, res) => {
  try {
    const leaderboard = await userService.getLeaderboard();
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

app.get("/api/quiz/questions", (_req, res) => {
  const questions = quizService.getQuestions();
  res.json({ questions });
});

app.post("/api/quiz/estimate", requireAuth, async (req, res) => {
  try {
    const { answers } = req.body;
    const result = await quizService.saveRating(req.session.userId, answers);
    const profile = await userService.getProfile(req.session.userId);
    res.json({
      result,
      user: profile
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const publicPath = path.join(__dirname, "..", "..", "public");
app.use(express.static(publicPath));

app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Pickleball quest app running at http://localhost:${PORT}`);
  });
}

module.exports = app;
