const dataStore = require("../dataStore");
const quizQuestions = require("../quizQuestions");

function getQuestions() {
  return quizQuestions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options.map(({ id, label }) => ({
      id,
      label
    }))
  }));
}

function normalizeAnswers(answers) {
  if (!Array.isArray(answers)) {
    return [];
  }
  return answers
    .map((entry) => ({
      questionId: entry?.questionId,
      optionId: entry?.optionId
    }))
    .filter((entry) => entry.questionId && entry.optionId);
}

function lookupScore(questionId, optionId) {
  const question = quizQuestions.find((item) => item.id === questionId);
  if (!question) {
    return null;
  }
  const option = question.options.find((item) => item.id === optionId);
  if (!option) {
    return null;
  }
  return option.score;
}

function determineRating(avgScore) {
  const bands = [
    {
      threshold: 1.75,
      value: 2.0,
      label: "Newcomer (2.0)",
      guidance: "Keep building core skills: serves, returns, and consistent dinks."
    },
    {
      threshold: 2.25,
      value: 2.5,
      label: "Developing Player (2.5)",
      guidance: "You're rallying more often - focus on footwork and resetting balls."
    },
    {
      threshold: 2.75,
      value: 3.0,
      label: "Intermediate (3.0)",
      guidance: "You can sustain kitchen exchanges. Sharpen transition play next."
    },
    {
      threshold: 3.25,
      value: 3.5,
      label: "Advanced Intermediate (3.5)",
      guidance: "You mix drops, drives, and attacks - look for smarter pattern builds."
    },
    {
      threshold: 3.75,
      value: 4.0,
      label: "Competitive (4.0)",
      guidance: "Your all-court game is a threat. Dial in situational decision-making."
    }
  ];

  for (const band of bands) {
    if (avgScore < band.threshold) {
      return {
        value: band.value,
        label: band.label,
        guidance: band.guidance
      };
    }
  }

  return {
    value: 4.5,
    label: "Tournament Ready (4.5)",
    guidance: "You're ready for high-level play. Fine-tune shot selection and scouting."
  };
}

async function saveRating(userId, answers) {
  const normalized = normalizeAnswers(answers);
  if (normalized.length === 0) {
    throw new Error("No answers provided.");
  }

  let totalScore = 0;
  let counted = 0;

  normalized.forEach(({ questionId, optionId }) => {
    const score = lookupScore(questionId, optionId);
    if (typeof score === "number") {
      totalScore += score;
      counted += 1;
    }
  });

  if (counted === 0) {
    throw new Error("Answers could not be scored.");
  }

  const avg = totalScore / counted;
  const rating = determineRating(avg);

  const data = await dataStore.read();
  const user = data.users.find((entry) => entry.id === userId);
  if (!user) {
    throw new Error("User not found.");
  }

  user.estimatedRating = {
    value: rating.value,
    label: rating.label,
    guidance: rating.guidance,
    averagedScore: Number(avg.toFixed(2)),
    answeredAt: new Date().toISOString(),
    answerCount: counted
  };

  await dataStore.write(data);

  return {
    rating: user.estimatedRating
  };
}

module.exports = {
  getQuestions,
  saveRating
};
