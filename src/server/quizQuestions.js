module.exports = [
  {
    id: "experience",
    prompt: "How long have you been playing pickleball?",
    options: [
      { id: "lt6m", label: "Less than 6 months", score: 1 },
      { id: "6to12m", label: "6-12 months", score: 2 },
      { id: "1to2y", label: "1-2 years", score: 3 },
      { id: "gt2y", label: "More than 2 years", score: 4 }
    ]
  },
  {
    id: "serve_consistency",
    prompt: "How consistent are your serves under pressure?",
    options: [
      { id: "rarely_in", label: "I double-fault often", score: 1 },
      { id: "usually_in", label: "Most serves land but lack depth", score: 2 },
      { id: "aggressive", label: "Consistent depth with purposeful placement", score: 3 },
      { id: "threatening", label: "Mix of pace, spin, and precision to set tone", score: 4 }
    ]
  },
  {
    id: "soft_game",
    prompt: "Describe your soft game around the kitchen",
    options: [
      { id: "basic_dinks", label: "Still working on getting dinks over consistently", score: 1 },
      { id: "stable_dinks", label: "Can dink cross-court, occasional mistakes", score: 2 },
      { id: "strategic_dinks", label: "Use dinks to move opponents and create errors", score: 3 },
      { id: "dictate_nv", label: "Regularly win kitchen battles with resets and speed-ups", score: 4 }
    ]
  },
  {
    id: "transition_game",
    prompt: "How comfortable are you transitioning from baseline to kitchen?",
    options: [
      { id: "struggle", label: "Often get caught mid-court or pop balls up", score: 1 },
      { id: "improving", label: "Can reset with some success, but not under pressure", score: 2 },
      { id: "confident", label: "Use drops and drives to advance consistently", score: 3 },
      { id: "threatening_transition", label: "Mix drives, drops, and lobs to force errors", score: 4 }
    ]
  },
  {
    id: "match_iq",
    prompt: "How would you rate your tactical decision-making in matches?",
    options: [
      { id: "reactive", label: "Mostly reacting, not reading opponents yet", score: 1 },
      { id: "developing", label: "Recognize patterns but execution is inconsistent", score: 2 },
      { id: "proactive", label: "Create plans and adjust mid-match effectively", score: 3 },
      { id: "commanding", label: "Dictate tempo, exploit weaknesses, control momentum", score: 4 }
    ]
  }
];
