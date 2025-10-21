const DOMAIN_WEIGHTS = {
  rules: 0.2,
  technique: 0.3,
  tactics: 0.25,
  mental: 0.15,
  physical: 0.1
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const avg = (values) => {
  if (!values || values.length === 0) {
    return 0;
  }
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

function scoreItem(question, response) {
  switch (question.type) {
    case "mcq":
      return Number(response) === question.answerKey.correct ? 1 : 0;
    case "scenario":
      return question.grading?.table?.[String(response)] ?? 0;
    case "percent_bucket": {
      const idx = question.buckets.indexOf(String(response));
      return idx >= 0 ? question.bucketScores[idx] : 0;
    }
    case "likert": {
      const raw = Number(response);
      if (Number.isNaN(raw)) {
        return 0;
      }
      const adjusted = question.reverse ? 6 - raw : raw;
      const bounded = clamp(adjusted, 1, 5);
      return bounded / 5;
    }
    default:
      return 0;
  }
}

function compositeScore(items) {
  const domains = {
    rules: [],
    technique: [],
    tactics: [],
    mental: [],
    physical: []
  };

  items.forEach((item) => {
    const score = scoreItem(item.q, item.response);
    if (domains[item.q.domain]) {
      domains[item.q.domain].push(score);
    }
  });

  const domainScores = {
    rules: avg(domains.rules),
    technique: avg(domains.technique),
    tactics: avg(domains.tactics),
    mental: avg(domains.mental),
    physical: avg(domains.physical)
  };

  const weighted =
    domainScores.rules * DOMAIN_WEIGHTS.rules +
    domainScores.technique * DOMAIN_WEIGHTS.technique +
    domainScores.tactics * DOMAIN_WEIGHTS.tactics +
    domainScores.mental * DOMAIN_WEIGHTS.mental +
    domainScores.physical * DOMAIN_WEIGHTS.physical;

  const penalty = consistencyPenalty(items);
  const finalScore = clamp(weighted * 100 - penalty, 0, 100);

  return { final: finalScore, domainScores };
}

function bucketValue(items, id) {
  const item = items.find((entry) => entry.q.id === id);
  if (!item || item.q.type !== "percent_bucket") {
    return 0;
  }
  const idx = item.q.buckets.indexOf(String(item.response));
  return idx >= 0 ? item.q.bucketScores[idx] : 0;
}

function countScenario(items, tag, cutoffScore) {
  return items.filter((entry) => {
    if (entry.q.type !== "scenario") {
      return false;
    }
    const tags = Array.isArray(entry.q.tags) ? entry.q.tags : [];
    return tags.includes(tag) && scoreItem(entry.q, entry.response) <= cutoffScore;
  }).length;
}

function answeredWrong(items, id) {
  const item = items.find((entry) => entry.q.id === id);
  if (!item || item.q.type !== "mcq") {
    return false;
  }
  return scoreItem(item.q, item.response) === 0;
}

function consistencyPenalty(items) {
  let penalty = 0;

  const dropClaim = bucketValue(items, "tech_third_drop_pct");
  const poorThirdShots = countScenario(items, "third_shot", 0.3);
  if (dropClaim >= 0.9 && poorThirdShots >= 2) {
    penalty += 3;
  }

  const deepServe = bucketValue(items, "tech_serve_depth_pct");
  const nvzFaultWrong = answeredWrong(items, "rules_nvz_fault");
  if (deepServe >= 0.9 && nvzFaultWrong) {
    penalty += 2;
  }

  return Math.min(8, penalty);
}

function standardDeviation(values) {
  if (!values || values.length < 2) {
    return 0;
  }
  const mean = avg(values);
  const variance = avg(values.map((val) => (val - mean) ** 2));
  return Math.sqrt(variance);
}

function confidenceScore(items, domainScores) {
  const scoredObjectives = items.filter(
    ({ q }) => q.domain === "rules" || q.type === "scenario"
  );
  const objectiveAccuracy = avg(
    scoredObjectives.map(({ q, response }) => scoreItem(q, response))
  );

  const timingFactor = avg(
    items.map((item) => {
      const time = item.timeMs ?? 6000;
      return clamp(time / 7000, 0.6, 1);
    })
  );

  const spread = standardDeviation(Object.values(domainScores));
  const spreadFactor = 1 - clamp(spread, 0, 0.5) / 0.5;

  const base =
    0.4 * objectiveAccuracy +
    0.3 * timingFactor +
    0.3 * spreadFactor;

  return clamp(base, 0.1, 1);
}

function mapToDecimalRating(score) {
  const bounded = clamp(score, 0, 100);
  const rating = 2 + (bounded / 100) * 3.5;
  const rounded = Math.round(rating * 10) / 10;
  return rounded >= 5.5 ? "5.5+" : rounded.toFixed(1);
}

function labelFromRating(ratingValue) {
  const numeric = typeof ratingValue === "string" ? parseFloat(ratingValue) : ratingValue;
  if (numeric < 2.5) return "Beginner";
  if (numeric < 3) return "Novice";
  if (numeric < 3.5) return "Intermediate";
  if (numeric < 4) return "Advanced Intermediate";
  if (numeric < 4.5) return "Advanced";
  if (numeric < 5) return "Competitive Advanced";
  return "Pro Level";
}

module.exports = {
  DOMAIN_WEIGHTS,
  scoreItem,
  compositeScore,
  confidenceScore,
  mapToDecimalRating,
  labelFromRating,
  consistencyPenalty,
  bucketValue,
  countScenario,
  answeredWrong
};
