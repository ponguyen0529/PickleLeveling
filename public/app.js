const state = {
  user: null,
  daily: null,
  history: [],
  leaderboard: [],
  quizQuestions: [],
  customShots: [],
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
const swapInfoEl = document.getElementById("swapInfo");
const historyListEl = document.getElementById("historyList");
const leaderboardListEl = document.getElementById("leaderboardList");
const shotLibraryLink = document.getElementById("shotLibraryLink");
const shotListEl = document.getElementById("shotList");
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

function setShotLibraryLinkVisible(visible) {
  if (!shotLibraryLink) {
    return;
  }
  if (visible) {
    shotLibraryLink.hidden = false;
    shotLibraryLink.removeAttribute("hidden");
  } else {
    shotLibraryLink.hidden = true;
  }
}

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
  if (!state.quiz.active) {
    state.quiz.detailsOpen = false;
    setQuizDetailsOpen(false);
  }
  setShotLibraryLinkVisible(false);
  closeUserMenu();
}

function refreshQuizCollapsedCta() {
  if (!collapsedStartQuizButton) {
    return;
  }
  if (state.quiz.active) {
    collapsedStartQuizButton.disabled = true;
    collapsedStartQuizButton.textContent = "Quiz in progress...";
    return;
  }
  collapsedStartQuizButton.disabled = false;
  const hasRating = Boolean(state.user?.estimatedRating);
  collapsedStartQuizButton.textContent = hasRating ? "Review rating details" : "Start rating quiz";
}

function setQuizDetailsOpen(open) {
  if (!quizDetailSection || !quizCollapsedCta) {
    state.quiz.detailsOpen = open;
    return;
  }
  if (!open && state.quiz.active) {
    return;
  }
  state.quiz.detailsOpen = open;
  quizDetailSection.hidden = !open;
  quizCollapsedCta.hidden = !!open;
  if (collapsedStartQuizButton) {
    collapsedStartQuizButton.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (closeQuizDetailsButton) {
    closeQuizDetailsButton.hidden = !open;
  }
  refreshQuizCollapsedCta();
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
    ...state.quiz,
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
    setQuizDetailsOpen(true);
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
    refreshQuizCollapsedCta();
    return;
  }

  setQuizDetailsOpen(state.quiz.detailsOpen);
  refreshQuizCollapsedCta();

  if (!rating) {
    ratingSummaryEl.textContent = "Don't know your rating? Let's estimate it together.";
    if (startQuizButton) {
      startQuizButton.hidden = !state.quiz.detailsOpen;
      startQuizButton.disabled = false;
      startQuizButton.textContent = "Start rating quiz";
    }
    if (quizContainer) {
      quizContainer.hidden = true;
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
  const confidenceLabelValue =
    rating.confidenceLabel || confidenceDescriptor(rating.confidence ?? 0);
  const summary =
    (rating.explanations && rating.explanations[0]) ||
    `Estimated rating ${rating.rating} (${rating.bandLabel}).`;

  ratingSummaryEl.textContent = summary;

  if (quizRatingValueEl) {
    quizRatingValueEl.textContent = `Rating ${rating.rating} \u2022 ${rating.bandLabel}`;
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
    quizResultEl.hidden = !state.quiz.detailsOpen;
  }
  if (retakeQuizButton) {
    retakeQuizButton.hidden = !state.quiz.detailsOpen;
    retakeQuizButton.disabled = false;
  }
  if (startQuizButton) {
    startQuizButton.hidden = !state.quiz.detailsOpen;
    startQuizButton.disabled = false;
    startQuizButton.textContent = "Retake rating quiz";
  }
  if (quizContainer) {
    quizContainer.hidden = true;
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
  setQuizDetailsOpen(true);
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
    ...state.quiz,
    active: true,
    currentIndex: 0,
    answers: {},
    submitting: false,
    order,
    total: order.length,
    detailsOpen: true
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

if (collapsedStartQuizButton) {
  collapsedStartQuizButton.addEventListener("click", (event) => {
    event.preventDefault();
    const hasRating = Boolean(state.user?.estimatedRating);
    setQuizDetailsOpen(true);
    if (!hasRating) {
      startQuiz();
    } else {
      updateRatingSection();
    }
  });
}

if (startQuizButton) {
  startQuizButton.addEventListener("click", (event) => {
    event.preventDefault();
    startQuiz();
  });
}

if (closeQuizDetailsButton) {
  closeQuizDetailsButton.addEventListener("click", (event) => {
    event.preventDefault();
    setQuizDetailsOpen(false);
    updateRatingSection();
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
    try {
      const shotsRes = await request("/api/shots");
      state.customShots = Array.isArray(shotsRes.customShots) ? shotsRes.customShots : [];
    } catch (error) {
      console.warn("Unable to load shot library data:", error);
      state.customShots = [];
    }
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
  if (swapInfoEl) {
    if (!state.daily) {
      swapInfoEl.textContent = "";
    } else {
      const tokens = state.daily.swapsRemaining ?? 0;
      swapInfoEl.textContent = tokens > 0
        ? `Swap tokens left today: ${tokens}`
        : "Swap tokens left today: 0 (refresh tomorrow).";
    }
  }
  questMessageEl.textContent = "";
  if (!state.daily || state.daily.quests.length === 0) {
    questMessageEl.textContent = "New quests unlock tomorrow after midnight.";
    return;
  }

  const swapsRemaining = state.daily.swapsRemaining ?? 0;
  const customShots = Array.isArray(state.customShots) ? state.customShots : [];

  state.daily.quests.forEach((quest) => {
    const li = document.createElement("li");
    li.className = `quest ${quest.completed ? "completed" : ""}`;
    if (quest.isCustom) {
      li.classList.add("quest-custom");
    }
    if (quest.customShotId) {
      li.dataset.customShotId = quest.customShotId;
    }

    const header = document.createElement("header");
    const title = document.createElement("h3");
    title.textContent = quest.title;
    header.appendChild(title);

    const badgeWrapper = document.createElement("div");
    badgeWrapper.className = "quest-badges";

    const xpBadge = document.createElement("span");
    xpBadge.className = "tag";
    xpBadge.textContent = `${quest.xp} XP`;
    badgeWrapper.appendChild(xpBadge);

    if (quest.isCustom) {
      const customBadge = document.createElement("span");
      customBadge.className = "tag tag-custom";
      customBadge.textContent = "Custom";
      badgeWrapper.appendChild(customBadge);
    }

    header.appendChild(badgeWrapper);
    li.appendChild(header);

    const desc = document.createElement("p");
    desc.textContent = quest.description;
    li.appendChild(desc);

    if (Array.isArray(quest.tags) && quest.tags.length > 0) {
      const tags = document.createElement("div");
      tags.className = "quest-tags";
      quest.tags.forEach((tag) => {
        const tagEl = document.createElement("span");
        tagEl.className = "tag";
        tagEl.textContent = tag;
        tags.appendChild(tagEl);
      });
      li.appendChild(tags);
    }

    const footer = document.createElement("footer");
    const info = document.createElement("span");
    const infoParts = [];
    if (quest.durationMinutes) {
      infoParts.push(`${quest.durationMinutes} min`);
    }
    if (quest.focus) {
      infoParts.push(quest.focus);
    }
    info.textContent = infoParts.join(" | ") || "Custom session";
    footer.appendChild(info);

    if (!quest.completed) {
      const buttonGroup = document.createElement("div");
      buttonGroup.className = "quest-buttons";

      const completeButton = document.createElement("button");
      completeButton.textContent = "Complete quest";
      completeButton.addEventListener("click", () => completeQuest(quest.id, completeButton));
      buttonGroup.appendChild(completeButton);

      const swapButton = document.createElement("button");
      swapButton.className = "secondary-button";
      swapButton.textContent = swapsRemaining > 0 ? "Swap (random)" : "Swap (0 left)";
      if (swapsRemaining > 0) {
        swapButton.addEventListener("click", () => swapQuest(quest.id, swapButton));
      } else {
        swapButton.disabled = true;
      }
      buttonGroup.appendChild(swapButton);

      if (swapsRemaining > 0 && customShots.length > 0) {
        const customSwapControl = document.createElement("div");
        customSwapControl.className = "custom-swap-control";

        const customSelect = document.createElement("select");
        customSelect.className = "custom-swap-select";
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Choose custom shot";
        customSelect.appendChild(placeholder);

        customShots.forEach((shot) => {
          const option = document.createElement("option");
          option.value = shot.id;
          option.textContent = shot.name;
          customSelect.appendChild(option);
        });

        const customSwapButton = document.createElement("button");
        customSwapButton.type = "button";
        customSwapButton.className = "secondary-button custom-swap-button";
        customSwapButton.textContent = "Use custom";
        customSwapButton.disabled = true;

        customSelect.addEventListener("change", () => {
          customSwapButton.disabled = !customSelect.value;
        });

        customSwapButton.addEventListener("click", () => {
          if (!customSelect.value) {
            return;
          }
          customSwapButton.disabled = true;
          customSelect.disabled = true;
          swapQuest(quest.id, customSwapButton, customSelect.value).then((result) => {
            if (!result) {
              customSwapButton.disabled = false;
              customSelect.disabled = false;
            }
          });
        });

        customSwapControl.append(customSelect, customSwapButton);
        buttonGroup.appendChild(customSwapControl);
      }

      footer.appendChild(buttonGroup);
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
      state.customShots = [];
      dashboardSection.hidden = true;
      authSection.hidden = false;
      if (userMenu) {
        userMenu.hidden = true;
      }
      if (swapInfoEl) {
        swapInfoEl.textContent = "";
      }
      setAuthMode("login");
    }
  });
}


async function swapQuest(questId, button, customShotId) {
  if (!state.daily) {
    questMessageEl.textContent = "No daily quests available.";
    return false;
  }
  if ((state.daily.swapsRemaining ?? 0) <= 0) {
    questMessageEl.textContent = "No swaps remaining today.";
    return false;
  }

  let success = false;
  button.disabled = true;
  try {
    const endpoint = customShotId
      ? `/api/quests/${questId}/swap/custom`
      : `/api/quests/${questId}/swap`;
    const options = customShotId
      ? { method: "POST", body: { shotId: customShotId } }
      : { method: "POST" };
    const response = await request(endpoint, options);
    state.daily = {
      ...state.daily,
      quests: response.quests,
      swapsRemaining: response.swapsRemaining
    };
    renderQuests();
    if (customShotId) {
      const shot = state.customShots.find((item) => item.id === customShotId);
      const shotName = shot?.name || "Custom shot";
      questMessageEl.textContent = `${shotName} is locked in. Let's roll.`;
    } else {
      questMessageEl.textContent = "Quest swapped in. Time to groove the new drill.";
    }
    success = true;
  } catch (error) {
    questMessageEl.textContent = error.message;
  } finally {
    button.disabled = false;
  }
  return success;
}

async function showDashboard() {
  authSection.hidden = true;
  dashboardSection.hidden = false;
  if (userMenu) {
    userMenu.hidden = false;
  }
  closeUserMenu();
  setShotLibraryLinkVisible(true);
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

if (
  shotListEl &&
  typeof window !== "undefined" &&
  typeof window.renderShotLibraryList === "function"
) {
  window.renderShotLibraryList(shotListEl);
}

initialize();



















