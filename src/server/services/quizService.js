const dataStore = require("../dataStore");
const quizQuestions = require("../quizQuestions");
const {
  compositeScore,
  confidenceScore,
  mapToDecimalRating,
  labelFromRating
} = require("./quizEngine");

const questionMap = new Map(quizQuestions.map((question) => [question.id, question]));

function sanitizeQuestion(question) {
  const base = {
    id: question.id,
    domain: question.domain,
    type: question.type,
    prompt: question.prompt,
    difficulty: question.difficulty,
    tags: question.tags || []
  };

  if (question.type === "mcq" || question.type === "scenario") {
    return {
      ...base,
      choices: question.options.map((label, index) => ({
        value: String(index),
        label
      }))
    };
  }

  if (question.type === "percent_bucket") {
    return {
      ...base,
      choices: question.buckets.map((bucket) => ({
        value: bucket,
        label: `${bucket}%`
      }))
    };
  }

  if (question.type === "likert") {
    const labels = [
      "1 - Strongly disagree",
      "2 - Disagree",
      "3 - Neutral",
      "4 - Agree",
      "5 - Strongly agree"
    ];
    return {
      ...base,
      choices: labels.map((label, idx) => ({
        value: String(idx + 1),
        label
      })),
      meta: {
        reverse: !!question.reverse
      }
    };
  }

  return base;
}

function getQuestions() {
  return quizQuestions.map(sanitizeQuestion);
}

function normalizeAnswers(answers) {
  if (!Array.isArray(answers)) {
    return [];
  }
  return answers
    .map((entry) => ({
      questionId: entry?.questionId,
      value: entry?.value,
      timeMs: typeof entry?.timeMs === "number" ? entry.timeMs : undefined
    }))
    .filter((entry) => entry.questionId && entry.value !== undefined && entry.value !== null);
}

function parseResponse(question, rawValue) {
  switch (question.type) {
    case "mcq":
    case "scenario": {
      const parsed = Number(rawValue);
      return Number.isNaN(parsed) ? rawValue : parsed;
    }
    case "likert": {
      const parsed = Number(rawValue);
      return Number.isNaN(parsed) ? 3 : parsed;
    }
    case "percent_bucket":
    default:
      return String(rawValue);
  }
}

function confidenceLabel(value) {
  if (value >= 0.85) return "High";
  if (value >= 0.65) return "Moderate";
  return "Low";
}

function buildExplanations(result) {
  const messages = [];
  messages.push(
    `Estimated rating ${result.rating} (${result.bandLabel}) with ${result.confidenceLabel.toLowerCase()} confidence.`
  );

  const weakDomains = Object.entries(result.domainScores)
    .filter(([, score]) => score < 0.55)
    .sort((a, b) => a[1] - b[1]);

  weakDomains.forEach(([domain]) => {
    messages.push(`Focus on ${domainName(domain)} - bring the score above 70% with targeted reps.`);
  });

  if (weakDomains.length === 0) {
    messages.push("Solid balance across domains. Continue refining patterns under match pressure.");
  }

  return messages;
}

function buildTips(result) {
  const tips = [];
  const sortedDomains = Object.entries(result.domainScores).sort((a, b) => a[1] - b[1]);
  const lowest = sortedDomains[0];

  if (lowest) {
    const [domain, score] = lowest;
    if (score < 0.6) {
      tips.push(`Targeted practice: dedicate a session this week to ${domainName(domain)} reps.`);
    }
  }

  if (result.confidenceLabel !== "High") {
    tips.push("Increase quiz confidence by answering steadily and reviewing rule scenarios.");
  }

  return tips;
}

function domainName(id) {
  const mapping = {
    rules: "Rules & Awareness",
    technique: "Technique & Execution",
    tactics: "Tactics & Patterns",
    mental: "Mental Game",
    physical: "Physical Readiness"
  };
  return mapping[id] || id;
}

async function saveRating(userId, answers) {
  const normalized = normalizeAnswers(answers);
  if (normalized.length === 0) {
    throw new Error("No answers provided.");
  }

  const items = [];
  normalized.forEach((entry) => {
    const question = questionMap.get(entry.questionId);
    if (!question) {
      return;
    }
    const response = parseResponse(question, entry.value);
    items.push({
      q: question,
      response,
      timeMs: entry.timeMs
    });
  });

  if (items.length === 0) {
    throw new Error("Answers could not be scored.");
  }

  const { final, domainScores } = compositeScore(items);
  const rating = mapToDecimalRating(final);
  const confidence = confidenceScore(items, domainScores);
  const confidenceLabelValue = confidenceLabel(confidence);
  const bandLabel = labelFromRating(rating);

  const result = {
    score: Number(final.toFixed(1)),
    rating,
    confidence: Number(confidence.toFixed(2)),
    confidenceLabel: confidenceLabelValue,
    bandLabel,
    domainScores: Object.fromEntries(
      Object.entries(domainScores).map(([domain, score]) => [domain, Number(score.toFixed(2))])
    ),
    explanations: [],
    tips: [],
    updatedAt: new Date().toISOString()
  };

  result.explanations = buildExplanations(result);
  result.tips = buildTips(result);

  const data = await dataStore.read();
  const user = data.users.find((entry) => entry.id === userId);
  if (!user) {
    throw new Error("User not found.");
  }

  user.estimatedRating = {
    score: result.score,
    rating: result.rating,
    confidence: result.confidence,
    confidenceLabel: result.confidenceLabel,
    bandLabel: result.bandLabel,
    domainScores: result.domainScores,
    explanations: result.explanations,
    tips: result.tips,
    updatedAt: result.updatedAt
  };

  await dataStore.write(data);

  return result;
}

module.exports = {
  getQuestions,
  saveRating
};
