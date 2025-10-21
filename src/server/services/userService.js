const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const dataStore = require("../dataStore");
const questTemplates = require("../questTemplates");

const DAILY_QUEST_COUNT = 3;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function xpForLevel(level) {
  const base = 120;
  const increment = 40;
  return base + (level - 1) * increment;
}

function deriveProgress(totalXp) {
  let remainingXp = totalXp;
  let level = 1;
  let xpNeeded = xpForLevel(level);

  while (remainingXp >= xpNeeded) {
    remainingXp -= xpNeeded;
    level += 1;
    xpNeeded = xpForLevel(level);
  }

  return {
    level,
    xpIntoLevel: remainingXp,
    xpForNextLevel: xpNeeded
  };
}

function sanitizeUser(user) {
  const { passwordHash, ...rest } = user;
  const progress = deriveProgress(user.totalXp || 0);
  return {
    ...rest,
    level: progress.level,
    progress
  };
}

function getRandomQuests(count = DAILY_QUEST_COUNT) {
  const pool = [...questTemplates];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).map((template) => ({
    id: randomUUID(),
    templateId: template.id,
    title: template.title,
    description: template.description,
    focus: template.focus,
    xp: template.xp,
    tags: template.tags,
    durationMinutes: template.durationMinutes,
    completed: false
  }));
}

async function findUser(username) {
  if (typeof username !== "string") {
    return undefined;
  }
  const normalized = username.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  const data = await dataStore.read();
  return data.users.find(
    (u) => u.username.trim().toLowerCase() === normalized
  );
}

const VALID_GENDERS = new Set(["female", "male", "nonbinary", "prefer_not"]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

async function register({ username, password, email, gender }) {
  const trimmedUsername = typeof username === "string" ? username.trim() : "";
  if (!trimmedUsername) {
    throw new Error("Username is required.");
  }
  if (!password) {
    throw new Error("Password is required.");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }
  if (!isValidEmail(normalizedEmail)) {
    throw new Error("Enter a valid email address.");
  }
  if (!gender || !VALID_GENDERS.has(gender)) {
    throw new Error("Please select a valid gender option.");
  }

  const existing = await findUser(trimmedUsername);
  if (existing) {
    throw new Error("That username is already taken.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const data = await dataStore.read();
  const emailInUse = data.users.find(
    (user) => (user.email || "").toLowerCase() === normalizedEmail
  );
  if (emailInUse) {
    throw new Error("That email is already registered.");
  }

  const user = {
    id: randomUUID(),
    username: trimmedUsername,
    email: normalizedEmail,
    gender,
    passwordHash,
    totalXp: 0,
    level: 1,
    streak: 0,
    bestStreak: 0,
    lastDailyReset: null,
    dailyQuests: null,
    questHistory: [],
    createdAt: new Date().toISOString()
  };

  data.users.push(user);
  await dataStore.write(data);
  return sanitizeUser(user);
}

async function authenticate(username, password) {
  const normalizedUsername =
    typeof username === "string" ? username.trim() : "";
  if (!normalizedUsername) {
    return null;
  }
  const user = await findUser(normalizedUsername);
  if (!user) {
    return null;
  }
  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return null;
  }
  return sanitizeUser(user);
}

async function getUserById(id) {
  const data = await dataStore.read();
  return data.users.find((user) => user.id === id);
}

async function ensureDailyQuests(user) {
  const today = todayKey();
  const yesterday = yesterdayKey();
  if (!user.dailyQuests || user.dailyQuests.date !== today) {
    if (user.lastDailyReset === yesterday) {
      user.streak = (user.streak || 0) + 1;
    } else if (user.lastDailyReset === today) {
      user.streak = user.streak || 1;
    } else {
      user.streak = 1;
    }
    user.dailyQuests = {
      date: today,
      quests: getRandomQuests()
    };
    if (user.streak > user.bestStreak) {
      user.bestStreak = user.streak;
    }
    user.lastDailyReset = today;
  }
}

async function getDailyQuests(userId) {
  const data = await dataStore.read();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("User not found.");
  }
  await ensureDailyQuests(user);
  await dataStore.write(data);

  return {
    date: user.dailyQuests.date,
    quests: user.dailyQuests.quests,
    streak: user.streak,
    bestStreak: user.bestStreak
  };
}

async function completeQuest(userId, questId) {
  const data = await dataStore.read();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("User not found.");
  }
  await ensureDailyQuests(user);

  const quest = user.dailyQuests.quests.find((q) => q.id === questId);
  if (!quest) {
    throw new Error("Quest not found.");
  }
  if (quest.completed) {
    throw new Error("Quest already completed.");
  }

  quest.completed = true;
  quest.completedAt = new Date().toISOString();

  if (!user.totalXp) {
    user.totalXp = 0;
  }
  user.totalXp += quest.xp;

  user.questHistory.push({
    instanceId: quest.id,
    templateId: quest.templateId,
    title: quest.title,
    xpEarned: quest.xp,
    completedAt: quest.completedAt,
    dayKey: user.dailyQuests.date
  });

  const progress = deriveProgress(user.totalXp);
  user.level = progress.level;

  await dataStore.write(data);

  return {
    quest,
    progress,
    totalXp: user.totalXp,
    level: user.level
  };
}

async function getProfile(userId) {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found.");
  }
  return sanitizeUser(user);
}

async function getQuestHistory(userId) {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found.");
  }
  return user.questHistory.slice(-25).reverse();
}

async function getLeaderboard(limit = 10) {
  const data = await dataStore.read();
  const sorted = [...data.users].sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0));
  return sorted.slice(0, limit).map((user, index) => ({
    rank: index + 1,
    username: user.username,
    level: deriveProgress(user.totalXp || 0).level,
    totalXp: user.totalXp || 0,
    bestStreak: user.bestStreak || 0
  }));
}

module.exports = {
  register,
  authenticate,
  getProfile,
  getDailyQuests,
  completeQuest,
  getQuestHistory,
  getLeaderboard
};
