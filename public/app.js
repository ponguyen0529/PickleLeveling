const state = {
  user: null,
  daily: null,
  history: [],
  leaderboard: []
};

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginView = document.getElementById("loginView");
const registerView = document.getElementById("registerView");
const showRegisterLink = document.getElementById("showRegister");
const showLoginLink = document.getElementById("showLogin");
const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");
const authMessage = document.getElementById("authMessage");
const userMenu = document.getElementById("userMenu");
const userMenuButton = document.getElementById("userMenuButton");
const userMenuDropdown = document.getElementById("userMenuDropdown");
const userMenuName = document.getElementById("userMenuName");
const profileMenuItem = document.getElementById("profileMenuItem");
const settingsMenuItem = document.getElementById("settingsMenuItem");
const logoutButton = document.getElementById("logoutButton");

const greetingEl = document.getElementById("playerGreeting");
const levelEl = document.getElementById("playerLevel");
const xpFillEl = document.getElementById("xpFill");
const xpSummaryEl = document.getElementById("xpSummary");
const streakEl = document.getElementById("streakValue");
const bestStreakEl = document.getElementById("bestStreakValue");
const dailyDateEl = document.getElementById("dailyDate");
const questListEl = document.getElementById("questList");
const questMessageEl = document.getElementById("questMessage");
const historyListEl = document.getElementById("historyList");
const leaderboardListEl = document.getElementById("leaderboardList");
const registerEmailInput = registerForm?.elements?.email;
const emailFeedbackEl = document.getElementById("emailFeedback");
let emailTouched = false;
let userMenuOpen = false;

function setEmailFeedback(type, message) {
  if (!emailFeedbackEl) {
    return;
  }
  emailFeedbackEl.textContent = message || "";
  emailFeedbackEl.className = "field-feedback";
  if (type && message) {
    emailFeedbackEl.classList.add(type);
  }
}

function validateEmailField(showEmptyWarning = false) {
  if (!registerEmailInput) {
    return true;
  }
  const value = registerEmailInput.value.trim();
  if (!value) {
    if (showEmptyWarning) {
      setEmailFeedback("warning", "Email is required.");
    } else {
      setEmailFeedback("", "");
    }
    return false;
  }
  if (!isValidEmail(value)) {
    setEmailFeedback("error", "Enter a valid email address.");
    return false;
  }
  setEmailFeedback("", "");
  return true;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setAuthMode(mode) {
  if (mode === "register") {
    loginView.hidden = true;
    registerView.hidden = false;
  } else {
    loginView.hidden = false;
    registerView.hidden = true;
  }
  authMessage.textContent = "";
  emailTouched = false;
  setEmailFeedback("", "");
  closeUserMenu();
}

if (registerEmailInput) {
  registerEmailInput.addEventListener("input", () => {
    if (!emailTouched && registerEmailInput.value.trim().length > 0) {
      emailTouched = true;
    }
    validateEmailField(emailTouched);
  });

  registerEmailInput.addEventListener("blur", () => {
    emailTouched = true;
    validateEmailField(true);
  });
}

function setUserMenuOpen(open) {
  userMenuOpen = open;
  if (!userMenuDropdown || !userMenuButton) {
    return;
  }
  userMenuDropdown.hidden = !open;
  userMenuButton.setAttribute("aria-expanded", open ? "true" : "false");
  if (userMenu) {
    if (open) {
      userMenu.classList.add("open");
    } else {
      userMenu.classList.remove("open");
    }
  }
}

function closeUserMenu() {
  setUserMenuOpen(false);
}

function toggleUserMenu() {
  setUserMenuOpen(!userMenuOpen);
}

if (userMenuButton) {
  userMenuButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleUserMenu();
  });
  userMenuButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleUserMenu();
    }
  });
}

if (profileMenuItem) {
  profileMenuItem.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeUserMenu();
    if (questMessageEl) {
      questMessageEl.textContent = "Profile editing is coming soon.";
    }
  });
}

if (settingsMenuItem) {
  settingsMenuItem.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeUserMenu();
    if (questMessageEl) {
      questMessageEl.textContent = "Settings customization is on the roadmap.";
    }
  });
}

document.addEventListener("click", (event) => {
  if (!userMenuOpen || !userMenu) {
    return;
  }
  if (userMenu.contains(event.target)) {
    return;
  }
  closeUserMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && userMenuOpen) {
    closeUserMenu();
    userMenuButton?.focus();
  }
});

async function request(url, options = {}) {
  const opts = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  };
  if (opts.body && typeof opts.body !== "string") {
    opts.body = JSON.stringify(opts.body);
  }
  const response = await fetch(url, opts);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = data?.error || "Something went wrong";
    throw new Error(error);
  }
  return data;
}

async function refreshDashboard() {
  try {
    const [profileRes, daily, historyRes, leaderboardRes] = await Promise.all([
      request("/api/auth/me"),
      request("/api/quests/daily"),
      request("/api/quests/history"),
      request("/api/community/leaderboard")
    ]);
    state.user = profileRes.user;
    state.daily = daily;
    state.history = historyRes.history;
    state.leaderboard = leaderboardRes.leaderboard;
    renderDashboard();
  } catch (error) {
    questMessageEl.textContent = error.message;
  }
}

function renderDashboard() {
  if (!state.user) {
    return;
  }
  if (userMenuName) {
    userMenuName.textContent = state.user.username;
  }
  greetingEl.textContent = `Hey ${state.user.username}, ready for the next rally?`;
  levelEl.textContent = state.user.progress.level;

  const { xpIntoLevel, xpForNextLevel } = state.user.progress;
  const percent = Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100));
  xpFillEl.style.width = `${percent}%`;
  xpSummaryEl.textContent = `${xpIntoLevel} / ${xpForNextLevel} XP to level up`;

  streakEl.textContent = state.daily?.streak ?? 0;
  bestStreakEl.textContent = state.daily?.bestStreak ?? 0;
  dailyDateEl.textContent = `Unlocked ${state.daily?.date}`;

  renderQuests();
  renderHistory();
  renderLeaderboard();
}

function renderQuests() {
  questListEl.innerHTML = "";
  questMessageEl.textContent = "";
  if (!state.daily || state.daily.quests.length === 0) {
    questMessageEl.textContent = "New quests unlock tomorrow after midnight.";
    return;
  }

  state.daily.quests.forEach((quest) => {
    const li = document.createElement("li");
    li.className = `quest ${quest.completed ? "completed" : ""}`;

    const header = document.createElement("header");
    const title = document.createElement("h3");
    title.textContent = quest.title;
    const xpBadge = document.createElement("span");
    xpBadge.className = "tag";
    xpBadge.textContent = `${quest.xp} XP`;
    header.appendChild(title);
    header.appendChild(xpBadge);
    li.appendChild(header);

    const desc = document.createElement("p");
    desc.textContent = quest.description;
    li.appendChild(desc);

    const tags = document.createElement("div");
    tags.className = "quest-tags";
    quest.tags?.forEach((tag) => {
      const tagEl = document.createElement("span");
      tagEl.className = "tag";
      tagEl.textContent = tag;
      tags.appendChild(tagEl);
    });
    li.appendChild(tags);

    const footer = document.createElement("footer");
    const info = document.createElement("span");
    info.textContent = `${quest.durationMinutes} min | ${quest.focus}`;
    footer.appendChild(info);
    if (!quest.completed) {
      const button = document.createElement("button");
      button.textContent = "Complete quest";
      button.addEventListener("click", () => completeQuest(quest.id, button));
      footer.appendChild(button);
    } else {
      const done = document.createElement("span");
      done.textContent = "Completed";
      footer.appendChild(done);
    }
    li.appendChild(footer);

    questListEl.appendChild(li);
  });
}

function renderHistory() {
  historyListEl.innerHTML = "";
  if (!state.history || state.history.length === 0) {
    const empty = document.createElement("li");
    empty.className = "history-item";
    empty.textContent = "Crush today's quests to start building your highlight reel.";
    historyListEl.appendChild(empty);
    return;
  }

  state.history.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "history-item";

    const left = document.createElement("span");
    left.innerHTML = `<strong>${entry.title}</strong><br /><small>${new Date(
      entry.completedAt
    ).toLocaleString()}</small>`;

    const right = document.createElement("span");
    right.textContent = `+${entry.xpEarned} XP`;
    li.appendChild(left);
    li.appendChild(right);
    historyListEl.appendChild(li);
  });
}

function renderLeaderboard() {
  leaderboardListEl.innerHTML = "";
  if (!state.leaderboard || state.leaderboard.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Be the first to appear on the board!";
    leaderboardListEl.appendChild(li);
    return;
  }

  state.leaderboard.forEach((entry) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>#${entry.rank} ${entry.username}</span>
      <span>Lvl ${entry.level} | ${entry.totalXp} XP</span>
    `;
    leaderboardListEl.appendChild(li);
  });
}

async function completeQuest(questId, button) {
  button.disabled = true;
  try {
    const result = await request(`/api/quests/${questId}/complete`, {
      method: "POST"
    });
    state.user.progress = result.progress;
    await refreshDashboard();
    questMessageEl.textContent = `Nice! ${result.quest.title} earned you ${result.quest.xp} XP.`;
  } catch (error) {
    questMessageEl.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const username = formData.get("username");
  const password = formData.get("password");
  try {
    await request("/api/auth/login", { method: "POST", body: { username, password } });
    loginForm.reset();
    authMessage.textContent = "";
    await showDashboard();
  } catch (error) {
    authMessage.textContent = error.message;
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(registerForm);
  const username = formData.get("username")?.trim();
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const email = formData.get("email")?.trim();
  const gender = formData.get("gender");

  if (!username) {
    authMessage.textContent = "Username is required.";
    return;
  }

  emailTouched = true;
  if (!validateEmailField(true)) {
    authMessage.textContent = "";
    return;
  }

  if (password !== confirmPassword) {
    authMessage.textContent = "Passwords do not match.";
    return;
  }

  if (!gender) {
    authMessage.textContent = "Please select a gender option.";
    return;
  }
  try {
    await request("/api/auth/register", {
      method: "POST",
      body: {
        username,
        password,
        email,
        gender
      }
    });
    registerForm.reset();
    emailTouched = false;
    setEmailFeedback("", "");
    setAuthMode("login");
    authMessage.textContent = "Account created! You're logged in.";
    await showDashboard();
  } catch (error) {
    authMessage.textContent = error.message;
  }
});

if (logoutButton) {
  logoutButton.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await request("/api/auth/logout", { method: "POST" });
    } finally {
      closeUserMenu();
      state.user = null;
      state.daily = null;
      state.history = [];
      state.leaderboard = [];
      dashboardSection.hidden = true;
      authSection.hidden = false;
      if (userMenu) {
        userMenu.hidden = true;
      }
      setAuthMode("login");
    }
  });
}

async function showDashboard() {
  authSection.hidden = true;
  dashboardSection.hidden = false;
  if (userMenu) {
    userMenu.hidden = false;
  }
  closeUserMenu();
  await refreshDashboard();
}

async function initialize() {
  try {
    const response = await request("/api/auth/me");
    if (response.authenticated) {
      state.user = response.user;
      await showDashboard();
      return;
    }
  } catch (error) {
    console.warn("Unable to auto-login:", error.message);
  }

  if (userMenu) {
    userMenu.hidden = true;
  }
  closeUserMenu();
  setAuthMode("login");
}

showRegisterLink.addEventListener("click", (event) => {
  event.preventDefault();
  setAuthMode("register");
});

showLoginLink.addEventListener("click", (event) => {
  event.preventDefault();
  setAuthMode("login");
});

initialize();
