/**
 * Pickleball self-rating question bank (adapted for current Express app).
 * The structure mirrors the spec: domains, question types, difficulty, tags.
 */

module.exports = [
  // Rules domain
  {
    id: "rules_two_bounce",
    domain: "rules",
    type: "mcq",
    prompt: "What does the two-bounce rule require before a rally can include volleys?",
    options: [
      "Serve and return must each bounce once before volleys are allowed",
      "Returner must let the serve bounce twice",
      "Serving team must stay back until the ball bounces twice"
    ],
    answerKey: { correct: 0 },
    tags: ["seed", "rules-basic"],
    difficulty: 0.2,
    version: 1
  },
  {
    id: "rules_nvz_fault",
    domain: "rules",
    type: "mcq",
    prompt: "A player volleys the ball and their momentum carries them into the Non-Volley Zone. What is the ruling?",
    options: [
      "Legal play if the ball was contacted outside the NVZ",
      "Fault on the volleying player",
      "Depends on where the partner is standing"
    ],
    answerKey: { correct: 1 },
    tags: ["rules-basic"],
    difficulty: 0.3,
    version: 1
  },
  {
    id: "rules_let_serve",
    domain: "rules",
    type: "scenario",
    prompt: "During sanctioned play, a serve clips the net cord and lands in. What should happen?",
    options: [
      "Call 'let' and replay the serve",
      "Play on - no replay",
      "Serving team loses the point"
    ],
    grading: { table: { "0": 0.1, "1": 1, "2": 0 } },
    tags: ["rules-updated"],
    difficulty: 0.35,
    version: 1
  },

  // Technique domain
  {
    id: "tech_third_drop_pct",
    domain: "technique",
    type: "percent_bucket",
    prompt: "In match play, how often does your third-shot drop land in the kitchen or forces a neutral reset?",
    buckets: ["0-30", "31-60", "61-80", "81-95", "96-100"],
    bucketScores: [0.2, 0.5, 0.75, 0.9, 1],
    tags: ["seed", "third_shot"],
    difficulty: 0.5,
    version: 1
  },
  {
    id: "tech_reset_pct",
    domain: "technique",
    type: "percent_bucket",
    prompt: "Against a fast drive or speed-up, how often can you reset the ball softly into the kitchen?",
    buckets: ["0-30", "31-60", "61-80", "81-95", "96-100"],
    bucketScores: [0.2, 0.5, 0.75, 0.9, 1],
    tags: ["reset"],
    difficulty: 0.55,
    version: 1
  },
  {
    id: "tech_serve_depth_pct",
    domain: "technique",
    type: "percent_bucket",
    prompt: "How often do your serves land within 2 feet of the baseline?",
    buckets: ["0-30", "31-60", "61-80", "81-95", "96-100"],
    bucketScores: [0.2, 0.45, 0.7, 0.9, 1],
    tags: ["serve"],
    difficulty: 0.45,
    version: 1
  },
  {
    id: "tech_dink_pattern",
    domain: "technique",
    type: "scenario",
    prompt: "In a neutral cross-court dink exchange, which tactic best applies consistent pressure?",
    options: [
      "Speed the ball up at the first chance",
      "Change depth, angle, and pace to move the opponent",
      "Drive the ball hard at the opponent's paddle"
    ],
    grading: { table: { "0": 0.2, "1": 1, "2": 0.1 } },
    tags: ["dink"],
    difficulty: 0.5,
    version: 1
  },

  // Tactics domain
  {
    id: "tactics_third_shot_choice",
    domain: "tactics",
    type: "scenario",
    prompt: "You serve deep, the return pushes you back. Opponents are at the NVZ. What is your best third-shot option?",
    options: [
      "Drive hard at the body and stay back",
      "Soft drop to the kitchen then move forward",
      "High lob from the baseline"
    ],
    grading: { table: { "0": 0.3, "1": 1, "2": 0 } },
    tags: ["seed", "third_shot"],
    difficulty: 0.45,
    version: 1
  },
  {
    id: "tactics_poach_counter",
    domain: "tactics",
    type: "scenario",
    prompt: "Opponents are poaching aggressively at the NVZ. What adjustment tends to reclaim control?",
    options: [
      "Speed up every third ball regardless of contact point",
      "Change direction/tempo into the poacher's feet or open court",
      "Lob consistently cross-court"
    ],
    grading: { table: { "0": 0.1, "1": 1, "2": 0.3 } },
    tags: ["poach", "dink"],
    difficulty: 0.6,
    version: 1
  },
  {
    id: "tactics_returns",
    domain: "tactics",
    type: "mcq",
    prompt: "Your opponents serve and charge the NVZ together. What is the highest percentage second-shot plan?",
    options: [
      "Drive the return at the approaching player",
      "Roll a high, deep return keeping them back",
      "Short angle return to bring them forward"
    ],
    answerKey: { correct: 1 },
    tags: ["return"],
    difficulty: 0.55,
    version: 1
  },

  // Mental domain
  {
    id: "mental_reset_plan",
    domain: "mental",
    type: "likert",
    prompt: "After an unforced error I reset quickly with a planned next play.",
    tags: ["mental"],
    difficulty: 0.4,
    version: 1,
    reverse: false
  },
  {
    id: "mental_composure",
    domain: "mental",
    type: "likert",
    prompt: "In a tight game to 11, I stay composed and communicate adjustments with my partner.",
    tags: ["mental", "communication"],
    difficulty: 0.5,
    version: 1,
    reverse: false
  },

  // Physical domain
  {
    id: "physical_reflex",
    domain: "physical",
    type: "likert",
    prompt: "I win most hand-speed exchanges at the Non-Volley Zone.",
    tags: ["physical"],
    difficulty: 0.5,
    version: 1,
    reverse: false
  },
  {
    id: "physical_mobility",
    domain: "physical",
    type: "likert",
    prompt: "I can recover balance quickly after wide dinks or transition shots.",
    tags: ["physical", "mobility"],
    difficulty: 0.45,
    version: 1,
    reverse: false
  }
];
