const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const dataStore = require("../dataStore");
const questTemplates = require("../questTemplates");

const DAILY_QUEST_COUNT = 3;
const MAX_DAILY_SWAPS = 2;
const DEFAULT_CUSTOM_XP = 50;
const DEFAULT_CUSTOM_DURATION = 20;
const MAX_CUSTOM_XP = 500;
const MAX_CUSTOM_DURATION = 240;
const MAX_CUSTOM_TAGS = 8;
const MAX_TAG_LENGTH = 24;
const MAX_NAME_LENGTH = 80;
const MAX_FOCUS_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 600;
const MAX_CUSTOM_SHOT_COUNT = 50;

function clampString(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return trimmed.slice(0, maxLength);
}

function ensureCustomShotsArray(user) {
  if (!Array.isArray(user.customShots)) {
    user.customShots = [];
  }
}

function normalizeTags(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    const cleaned = value
      .map((tag) => clampString(tag, MAX_TAG_LENGTH))
      .filter(Boolean);
    return Array.from(new Set(cleaned)).slice(0, MAX_CUSTOM_TAGS);
  }
  if (typeof value === "string") {
    const cleaned = value
      .split(",")
      .map((tag) => clampString(tag, MAX_TAG_LENGTH))
      .filter(Boolean);
    return Array.from(new Set(cleaned)).slice(0, MAX_CUSTOM_TAGS);
  }
  return [];
}

function normalizeCustomShotInput(input = {}) {
  const name = clampString(input.name, MAX_NAME_LENGTH);
  if (!name) {
    throw new Error("Give your custom shot a name.");
  }
  const description = clampString(input.description, MAX_DESCRIPTION_LENGTH);
  if (!description) {
    throw new Error("Describe the drill so you remember what to do.");
  }
  const focus = clampString(input.focus, MAX_FOCUS_LENGTH) || "Custom focus";

  const xpCandidate =
    input.xp !== undefined && input.xp !== null ? Number.parseInt(input.xp, 10) : NaN;
  let xp = Number.isFinite(xpCandidate) ? Math.round(xpCandidate) : DEFAULT_CUSTOM_XP;
  xp = Math.min(Math.max(xp, 10), MAX_CUSTOM_XP);

  const durationInput =
    input.durationMinutes !== undefined && input.durationMinutes !== null
      ? input.durationMinutes
      : input.duration;
  const durationCandidate =
    durationInput !== undefined && durationInput !== null
      ? Number.parseInt(durationInput, 10)
      : NaN;
  let durationMinutes = Number.isFinite(durationCandidate)
    ? Math.round(durationCandidate)
    : DEFAULT_CUSTOM_DURATION;
  durationMinutes = Math.min(Math.max(durationMinutes, 5), MAX_CUSTOM_DURATION);

  const tags = normalizeTags(input.tags);

  return {
    id: randomUUID(),
    name,
    focus,
    description,
    xp,
    durationMinutes,
    tags,
    type: "custom",
    createdAt: new Date().toISOString()
  };
}

function shotToTemplate(shot) {
  return {
    id: `custom:${shot.id}`,
    title: shot.name,
    description: shot.description,
    focus: shot.focus || "Custom focus",
    xp: shot.xp || DEFAULT_CUSTOM_XP,
    tags: Array.isArray(shot.tags) && shot.tags.length ? [...shot.tags] : ["custom"],
    durationMinutes: shot.durationMinutes || DEFAULT_CUSTOM_DURATION,
    source: "custom",
    customShotId: shot.id
  };
}

function getTemplatePool(customShots = []) {
  const basePool = questTemplates.map((template) => ({
    ...template,
    source: "default"
  }));
  const customPool = (Array.isArray(customShots) ? customShots : []).map(shotToTemplate);
  return [...basePool, ...customPool];
}

function pickTemplate(pool, excludedTemplates = new Set()) {
  if (!Array.isArray(pool) || pool.length === 0) {
    throw new Error("No quest templates available.");
  }
  const available = pool.filter((template) => !excludedTemplates.has(template.id));
  const effectivePool = available.length ? available : pool;
  const index = Math.floor(Math.random() * effectivePool.length);
  return effectivePool[index];
}

function createQuestInstance(template) {
  return {
    id: randomUUID(),
    templateId: template.id,
    title: template.title,
    description: template.description,
    focus: template.focus || "Custom focus",
    xp: template.xp || DEFAULT_CUSTOM_XP,
    tags: Array.isArray(template.tags) ? [...template.tags] : [],
    durationMinutes: template.durationMinutes || DEFAULT_CUSTOM_DURATION,
    completed: false,
    isCustom: template.source === "custom",
    customShotId: template.customShotId || null
  };
}

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
  const { passwordHash, customShots = [], ...rest } = user;
  const progress = deriveProgress(user.totalXp || 0);
  return {
    ...rest,
    level: progress.level,
    progress,
    customShotCount: Array.isArray(customShots) ? customShots.length : 0
  };
}

function getRandomQuests(count = DAILY_QUEST_COUNT, excludeTemplates = [], pool = questTemplates) {
  const quests = [];
  const usedTemplateIds = new Set(
    Array.isArray(excludeTemplates) ? excludeTemplates : Array.from(excludeTemplates || [])
  );

  while (quests.length < count) {
    const template = pickTemplate(pool, usedTemplateIds);
    quests.push(createQuestInstance(template));
    usedTemplateIds.add(template.id);
    if (usedTemplateIds.size >= pool.length) {
      usedTemplateIds.clear();
    }
  }

  return quests;
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
    estimatedRating: null,
    customShots: [],
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
  ensureCustomShotsArray(user);
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
      swapsRemaining: MAX_DAILY_SWAPS,
      quests: getRandomQuests(DAILY_QUEST_COUNT)
    };
    if (user.streak > user.bestStreak) {
      user.bestStreak = user.streak;
    }
    user.lastDailyReset = today;
  } else {
    if (!Array.isArray(user.dailyQuests.quests)) {
      user.dailyQuests.quests = [];
    }
    if (typeof user.dailyQuests.swapsRemaining !== "number") {
      user.dailyQuests.swapsRemaining = MAX_DAILY_SWAPS;
    }
    if (user.dailyQuests.quests.length < DAILY_QUEST_COUNT) {
      const existingTemplateIds = new Set(
        user.dailyQuests.quests.map((quest) => quest.templateId)
      );
      const missing = DAILY_QUEST_COUNT - user.dailyQuests.quests.length;
      const additional = getRandomQuests(missing, existingTemplateIds);
      user.dailyQuests.quests.push(...additional);
    }
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
    swapsRemaining: user.dailyQuests.swapsRemaining,
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

async function getCustomShots(userId) {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found.");
  }
  const shots = Array.isArray(user.customShots) ? user.customShots : [];
  return [...shots]
    .map((shot) => ({
      ...shot,
      type: "custom"
    }))
    .sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
}

async function addCustomShot(userId, input) {
  const data = await dataStore.read();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("User not found.");
  }
  ensureCustomShotsArray(user);
  const shot = normalizeCustomShotInput(input);
  const nameKey = shot.name.toLowerCase();
  const duplicate = user.customShots.find(
    (existing) => typeof existing.name === "string" && existing.name.toLowerCase() === nameKey
  );
  if (duplicate) {
    throw new Error("You already saved a custom shot with that name.");
  }
  user.customShots.push(shot);
  if (user.customShots.length > MAX_CUSTOM_SHOT_COUNT) {
    user.customShots.splice(0, user.customShots.length - MAX_CUSTOM_SHOT_COUNT);
  }
  await dataStore.write(data);
  return shot;
}

async function swapDailyQuest(userId, questInstanceId) {
  const data = await dataStore.read();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("User not found.");
  }
  ensureCustomShotsArray(user);

  await ensureDailyQuests(user);

  if (typeof user.dailyQuests.swapsRemaining !== "number") {
    user.dailyQuests.swapsRemaining = MAX_DAILY_SWAPS;
  }

  if (user.dailyQuests.swapsRemaining <= 0) {
    throw new Error("No swaps remaining today.");
  }

  const questIndex = user.dailyQuests.quests.findIndex((quest) => quest.id === questInstanceId);
  if (questIndex === -1) {
    throw new Error("Quest not found.");
  }

  const currentQuest = user.dailyQuests.quests[questIndex];
  if (currentQuest.completed) {
    throw new Error("Completed quests cannot be swapped.");
  }
  const usedTemplateIds = new Set(
    user.dailyQuests.quests
      .map((quest) => quest.templateId)
      .filter((templateId) => templateId !== currentQuest.templateId)
  );

  const templatePool = getTemplatePool(user.customShots);
  const replacementTemplate = pickTemplate(templatePool, usedTemplateIds);
  const replacementQuest = createQuestInstance(replacementTemplate);

  user.dailyQuests.quests[questIndex] = replacementQuest;
  user.dailyQuests.swapsRemaining -= 1;

  await dataStore.write(data);

  return {
    quests: user.dailyQuests.quests,
    swapsRemaining: user.dailyQuests.swapsRemaining
  };
}

async function swapDailyQuestWithCustom(userId, questInstanceId, shotId) {
  if (!shotId) {
    throw new Error("Select a custom shot to swap in.");
  }
  const data = await dataStore.read();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("User not found.");
  }
  ensureCustomShotsArray(user);

  await ensureDailyQuests(user);

  if (typeof user.dailyQuests.swapsRemaining !== "number") {
    user.dailyQuests.swapsRemaining = MAX_DAILY_SWAPS;
  }

  if (user.dailyQuests.swapsRemaining <= 0) {
    throw new Error("No swaps remaining today.");
  }

  const questIndex = user.dailyQuests.quests.findIndex((quest) => quest.id === questInstanceId);
  if (questIndex === -1) {
    throw new Error("Quest not found.");
  }

  const currentQuest = user.dailyQuests.quests[questIndex];
  if (currentQuest.completed) {
    throw new Error("Completed quests cannot be swapped.");
  }

  const shot = user.customShots.find((item) => item.id === shotId);
  if (!shot) {
    throw new Error("Custom shot not found.");
  }

  const duplicateInPlan = user.dailyQuests.quests.some(
    (quest, index) => index !== questIndex && quest.customShotId === shot.id
  );
  if (duplicateInPlan) {
    throw new Error("That custom shot is already scheduled today.");
  }

  const replacementQuest = createQuestInstance(shotToTemplate(shot));

  user.dailyQuests.quests[questIndex] = replacementQuest;
  user.dailyQuests.swapsRemaining -= 1;

  await dataStore.write(data);

  return {
    quests: user.dailyQuests.quests,
    swapsRemaining: user.dailyQuests.swapsRemaining
  };
}

module.exports = {
  register,
  authenticate,
  getProfile,
  getDailyQuests,
  swapDailyQuest,
  swapDailyQuestWithCustom,
  completeQuest,
  getQuestHistory,
  getLeaderboard,
  getCustomShots,
  addCustomShot
};






