const state = {
  user: null,
  daily: null,
  history: [],
  leaderboard: [],
  quizQuestions: [],
  quiz: {
    active: false,
    currentIndex: 0,
    answers: {},
    submitting: false,
    order: [],
    total: 0
  }
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
const ratingSummaryEl = document.getElementById("ratingSummary");
const startQuizButton = document.getElementById("startQuizButton");
const quizContainer = document.getElementById("quizContainer");
const quizProgressEl = document.getElementById("quizProgress");
const quizPromptEl = document.getElementById("quizPrompt");
const quizOptionsEl = document.getElementById("quizOptions");
const quizMessageEl = document.getElementById("quizMessage");
const quizBackButton = document.getElementById("quizBackButton");
const quizNextButton = document.getElementById("quizNextButton");
const quizResultEl = document.getElementById("quizResult");
const quizRatingValueEl = document.getElementById("quizRatingValue");
const quizScoreTextEl = document.getElementById("quizScoreText");
const quizConfidenceTextEl = document.getElementById("quizConfidenceText");
const quizDomainListEl = document.getElementById("quizDomainList");
const quizExplanationListEl = document.getElementById("quizExplanationList");
const quizRatingGuidanceEl = document.getElementById("quizRatingGuidance");
const retakeQuizButton = document.getElementById("retakeQuizButton");
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
  if (!userMenuDropdown || !userMenuButton || !userMenu) {
    return;
  }

  if (open) {
    userMenuDropdown.hidden = false;
    userMenuDropdown.setAttribute("aria-hidden", "false");
  } else {
    userMenuDropdown.hidden = true;
    userMenuDropdown.setAttribute("aria-hidden", "true");
  }

  userMenuButton.setAttribute("aria-expanded", open ? "true" : "false");
  userMenu.classList.toggle("open", open);
}

function closeUserMenu() {
  setUserMenuOpen(false);
}

function toggleUserMenu() {
  setUserMenuOpen(!userMenuOpen);
}

async function loadQuizQuestions() {
  if (state.quizQuestions?.length > 0) {
    return;
  }
  const response = await request("/api/quiz/questions");
  state.quizQuestions = response.questions || [];
}

function resetQuizState() {
  state.quiz = {
    active: false,
    currentIndex: 0,
    answers: {},
    submitting: false,
    order: [],
    total: 0
  };
  if (quizMessageEl) {
    quizMessageEl.textContent = "";
  }
  if (quizOptionsEl) {
    quizOptionsEl.innerHTML = "";
  }
  if (quizPromptEl) {
    quizPromptEl.textContent = "";
  }
  if (quizProgressEl) {
    quizProgressEl.textContent = "";
  }
  if (quizContainer) {
    quizContainer.hidden = true;
  }
  if (quizBackButton) {
    quizBackButton.disabled = false;
  }
  if (quizNextButton) {
    quizNextButton.disabled = false;
    quizNextButton.textContent = "Next";
  }
}

const DOMAIN_LABELS = {
  rules: "Rules & Awareness",
  technique: "Technique & Execution",
  tactics: "Tactics & Patterns",
  mental: "Mental Game",
  physical: "Physical Readiness"
};

const QUIZ_DOMAIN_ORDER = ["rules", "technique", "tactics", "mental", "physical"];

function domainLabel(id) {
  return DOMAIN_LABELS[id] || id;
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function selectQuizOrder() {
  const pool = state.quizQuestions || [];
  if (!pool.length) {
    return [];
  }

  const targetCounts = {
    rules: 3,
    technique: 4,
    tactics: 3,
    mental: 2,
    physical: 2
  };

  const grouped = pool.reduce((acc, question) => {
    if (!acc[question.domain]) {
      acc[question.domain] = [];
    }
    acc[question.domain].push(question);
    return acc;
  }, {});

  const order = [];
  Object.entries(targetCounts).forEach(([domain, target]) => {
    const candidates = shuffle(grouped[domain] || []);
    for (let i = 0; i < target && candidates.length; i += 1) {
      const next = candidates.shift();
      if (next) {
        order.push(next);
      }
    }
  });

  const usedIds = new Set(order.map((item) => item.id));
  const totalTarget = Math.min(14, pool.length);
  if (order.length < totalTarget) {
    const leftovers = shuffle(pool.filter((question) => !usedIds.has(question.id)));
    while (order.length < totalTarget && leftovers.length) {
      const next = leftovers.shift();
      if (next) {
        order.push(next);
      }
    }
  }

  return order;
}

function confidenceDescriptor(value) {
  if (value >= 0.85) return "High";
  if (value >= 0.65) return "Moderate";
  return "Low";
}

function updateRatingSection() {
  if (!ratingSummaryEl) {
    return;
  }
  const rating = state.user?.estimatedRating || null;

  if (state.quiz.active) {
    ratingSummaryEl.textContent = "Answer a few questions to estimate your rating.";
    if (startQuizButton) {
      startQuizButton.hidden = true;
      startQuizButton.disabled = true;
    }
    if (quizContainer) {
      quizContainer.hidden = false;
    }
    if (quizResultEl) {
      quizResultEl.hidden = true;
    }
    if (retakeQuizButton) {
      retakeQuizButton.hidden = true;
    }
    return;
  }

  if (quizContainer) {
    quizContainer.hidden = true;
  }

  if (!rating) {
    ratingSummaryEl.textContent = "Don't know your rating? Let's estimate it together.";
    if (startQuizButton) {
      startQuizButton.hidden = false;
      startQuizButton.disabled = false;
      startQuizButton.textContent = "Start rating quiz";
    }
    if (quizResultEl) {
      quizResultEl.hidden = true;
    }
    if (retakeQuizButton) {
      retakeQuizButton.hidden = true;
    }
    if (quizRatingValueEl) {
      quizRatingValueEl.textContent = "";
    }
    if (quizScoreTextEl) {
      quizScoreTextEl.textContent = "";
    }
    if (quizConfidenceTextEl) {
      quizConfidenceTextEl.textContent = "";
    }
    if (quizDomainListEl) {
      quizDomainListEl.innerHTML = "";
    }
    if (quizExplanationListEl) {
      quizExplanationListEl.innerHTML = "";
    }
    if (quizRatingGuidanceEl) {
      quizRatingGuidanceEl.textContent = "";
    }
    return;
  }

  const confidencePct = Math.round((rating.confidence ?? 0) * 100);
  const confidenceLabelValue = rating.confidenceLabel || confidenceDescriptor(rating.confidence ?? 0);
  const summary =
    (rating.explanations && rating.explanations[0]) ||
    `Estimated rating ${rating.rating} (${rating.bandLabel}).`;

  ratingSummaryEl.textContent = summary;

  if (quizRatingValueEl) {
    quizRatingValueEl.textContent = `Rating ${rating.rating} • ${rating.bandLabel}`;
  }
  if (quizScoreTextEl && typeof rating.score === "number") {
    quizScoreTextEl.textContent = `Composite score: ${rating.score.toFixed(1)} / 100`;
  }
  if (quizConfidenceTextEl) {
    quizConfidenceTextEl.textContent = `Confidence: ${confidencePct}% (${confidenceLabelValue})`;
  }
  if (quizDomainListEl) {
    quizDomainListEl.innerHTML = "";
    const domainEntries = QUIZ_DOMAIN_ORDER.map((domain) => [
      domain,
      rating.domainScores?.[domain] ?? 0
    ]);
    domainEntries.forEach(([domain, score]) => {
      const item = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = domainLabel(domain);
      const value = document.createElement("strong");
      value.textContent = `${Math.round(score * 100)}%`;
      item.append(label, value);
      quizDomainListEl.appendChild(item);
    });
  }
  if (quizExplanationListEl) {
    quizExplanationListEl.innerHTML = "";
    const extraExplanations = (rating.explanations || []).slice(1);
    const guidanceItems = [...extraExplanations, ...(rating.tips || [])];
    guidanceItems.forEach((text) => {
      if (!text) {
        return;
      }
      const li = document.createElement("li");
      li.textContent = text;
      quizExplanationListEl.appendChild(li);
    });
  }
  if (quizRatingGuidanceEl) {
    quizRatingGuidanceEl.textContent = rating.tips?.[0] || "";
  }
  if (quizResultEl) {
    quizResultEl.hidden = false;
  }
  if (retakeQuizButton) {
    retakeQuizButton.hidden = false;
    retakeQuizButton.disabled = false;
  }
  if (startQuizButton) {
    startQuizButton.hidden = false;
    startQuizButton.disabled = false;
    startQuizButton.textContent = "Retake rating quiz";
  }
}

function renderQuizQuestion() {
  if (!state.quiz.active || !quizContainer) {
    return;
  }

  const questions = state.quiz.order || [];
  const total = state.quiz.total || questions.length;

  if (!questions.length) {
    if (quizMessageEl) {
      quizMessageEl.textContent = "Quiz questions are unavailable. Please try again later.";
    }
    resetQuizState();
    updateRatingSection();
    return;
  }

  const currentQuestion = questions[state.quiz.currentIndex];
  if (!currentQuestion) {
    return;
  }

  quizContainer.hidden = false;
  if (quizMessageEl) {
    quizMessageEl.textContent = "";
  }
  if (quizProgressEl) {
    const questionNumber = state.quiz.currentIndex + 1;
    const domainText = domainLabel(currentQuestion.domain);
    quizProgressEl.textContent = `Question ${questionNumber} of ${total} - ${domainText}`;
  }
  if (quizPromptEl) {
    quizPromptEl.textContent = currentQuestion.prompt;
  }

  if (quizOptionsEl) {
    quizOptionsEl.innerHTML = "";
    const choices =
      currentQuestion.choices || (currentQuestion.options || []).map((label, idx) => ({ value: String(idx), label }));

    choices.forEach((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiz-option";
      button.textContent = choice.label;
      if (state.quiz.answers[currentQuestion.id] === choice.value) {
        button.classList.add("selected");
      }
      button.addEventListener("click", () => {
        if (state.quiz.submitting) {
          return;
        }
        state.quiz.answers = {
          ...state.quiz.answers,
          [currentQuestion.id]: choice.value
        };
        renderQuizQuestion();
      });
      quizOptionsEl.appendChild(button);
    });
  }
  if (quizBackButton) {
    quizBackButton.disabled = state.quiz.submitting;
    quizBackButton.textContent = state.quiz.currentIndex === 0 ? "Cancel" : "Back";
  }
  if (quizNextButton) {
    quizNextButton.disabled = state.quiz.submitting;
    quizNextButton.textContent =
      state.quiz.currentIndex === total - 1 ? "Submit" : "Next";
  }
}

function handleQuizBack() {
  if (!state.quiz.active || state.quiz.submitting) {
    return;
  }
  if (state.quiz.currentIndex === 0) {
    resetQuizState();
    updateRatingSection();
    return;
  }
  state.quiz.currentIndex -= 1;
  renderQuizQuestion();
}

async function submitQuiz() {
  if (state.quiz.submitting) {
    return;
  }
  const questions = state.quiz.order || [];
  const answers = questions
    .map((question) => ({
      questionId: question.id,
      value: state.quiz.answers[question.id]
    }))
    .filter((entry) => entry.value !== undefined && entry.value !== null);

  if (answers.length !== questions.length) {
    if (quizMessageEl) {
      quizMessageEl.textContent = "Please answer every question before submitting.";
    }
    return;
  }

  state.quiz.submitting = true;
  if (quizMessageEl) {
    quizMessageEl.textContent = "Scoring your estimate...";
  }
  if (quizBackButton) {
    quizBackButton.disabled = true;
  }
  if (quizNextButton) {
    quizNextButton.disabled = true;
  }

  try {
    const response = await request("/api/quiz/estimate", {
      method: "POST",
      body: {
        answers
      }
    });
    state.user = response.user;
    if (response.result) {
      state.user.estimatedRating = response.result;
    }
    state.quiz.submitting = false;
    resetQuizState();
    updateRatingSection();
    renderDashboard();
  } catch (error) {
    state.quiz.submitting = false;
    if (quizMessageEl) {
      quizMessageEl.textContent = error.message;
    }
    if (quizBackButton) {
      quizBackButton.disabled = false;
    }
    if (quizNextButton) {
      quizNextButton.disabled = false;
    }
    renderQuizQuestion();
  }
}

function handleQuizNext() {
  if (!state.quiz.active || state.quiz.submitting) {
    return;
  }
  const questions = state.quiz.order || [];
  const total = state.quiz.total || questions.length;
  const currentQuestion = questions[state.quiz.currentIndex];
  if (!currentQuestion) {
    return;
  }
  if (!state.quiz.answers[currentQuestion.id]) {
    if (quizMessageEl) {
      quizMessageEl.textContent = "Choose an option to continue.";
    }
    return;
  }
  if (state.quiz.currentIndex === total - 1) {
    submitQuiz();
  } else {
    state.quiz.currentIndex += 1;
    renderQuizQuestion();
  }
}

async function startQuiz() {
  try {
    await loadQuizQuestions();
  } catch (error) {
    if (quizMessageEl) {
      quizMessageEl.textContent = error.message || "Unable to load quiz questions.";
    }
    return;
  }

  const order = selectQuizOrder();
  if (order.length === 0) {
    if (quizMessageEl) {
      quizMessageEl.textContent = "Quiz questions are unavailable. Please try again later.";
    }
    if (startQuizButton) {
      startQuizButton.hidden = false;
      startQuizButton.disabled = false;
    }
    return;
  }

  state.quiz = {
    active: true,
    currentIndex: 0,
    answers: {},
    submitting: false,
    order,
    total: order.length
  };

  if (startQuizButton) {
    startQuizButton.hidden = true;
    startQuizButton.disabled = true;
  }
  if (quizResultEl) {
    quizResultEl.hidden = true;
  }
  if (quizMessageEl) {
    quizMessageEl.textContent = "";
  }
  renderQuizQuestion();
  updateRatingSection();
}

if (userMenuButton) {
  userMenuButton.addEventListener("click", (event) => {
    event.preventDefault();
    toggleUserMenu();
  });
  userMenuButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleUserMenu();
    }
  });
}

if (startQuizButton) {
  startQuizButton.addEventListener("click", (event) => {
    event.preventDefault();
    startQuiz();
  });
}

if (quizNextButton) {
  quizNextButton.addEventListener("click", handleQuizNext);
}

if (quizBackButton) {
  quizBackButton.addEventListener("click", (event) => {
    event.preventDefault();
    handleQuizBack();
  });
}

if (retakeQuizButton) {
  retakeQuizButton.addEventListener("click", (event) => {
    event.preventDefault();
    startQuiz();
  });
}

if (profileMenuItem) {
  profileMenuItem.addEventListener("click", (event) => {
    event.preventDefault();
    closeUserMenu();
    if (questMessageEl) {
      questMessageEl.textContent = "Profile editing is coming soon.";
    }
  });
}

if (settingsMenuItem) {
  settingsMenuItem.addEventListener("click", (event) => {
    event.preventDefault();
    closeUserMenu();
    if (questMessageEl) {
      questMessageEl.textContent = "Settings customization is on the roadmap.";
    }
  });
}

if (userMenuDropdown) {
  userMenuDropdown.addEventListener("click", (event) => {
    const item = event.target.closest(".dropdown-item");
    if (!item) {
      return;
    }
    if (item !== logoutButton) {
      closeUserMenu();
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
    const [profileRes, daily, historyRes, leaderboardRes, quizQuestionsRes] = await Promise.all([
      request("/api/auth/me"),
      request("/api/quests/daily"),
      request("/api/quests/history"),
      request("/api/community/leaderboard"),
      request("/api/quiz/questions")
    ]);
    state.user = profileRes.user;
    state.daily = daily;
    state.history = historyRes.history;
    state.leaderboard = leaderboardRes.leaderboard;
    state.quizQuestions = quizQuestionsRes.questions || [];
    renderDashboard();
  } catch (error) {
    questMessageEl.textContent = error.message;
  }
}

function renderDashboard() {
  if (!state.user) {
    updateRatingSection();
    return;
  }
  updateRatingSection();
  if (state.quiz.active) {
    renderQuizQuestion();
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
    closeUserMenu();
    try {
      await request("/api/auth/logout", { method: "POST" });
    } finally {
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




