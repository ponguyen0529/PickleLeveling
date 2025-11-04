(() => {
  const DEFAULT_SHOT_LIBRARY = [
    {
      id: "fh-cross-court-drive",
      name: "Forehand Cross-Court Drive",
      focus: "Power + depth",
      description:
        "Baseline ladder of 60 forehand drives landing deep cross-court. Emphasize loading on the outside leg and recovering to ready stance.",
      xp: 55,
      durationMinutes: 20,
      tags: ["forehand", "baseline", "power"]
    },
    {
      id: "bh-cross-court-drive",
      name: "Backhand Cross-Court Drive",
      focus: "Power + balance",
      description:
        "Mirror the forehand pattern on the backhand wing to groove shoulder rotation and weight transfer without losing balance.",
      xp: 55,
      durationMinutes: 20,
      tags: ["backhand", "baseline", "power"]
    },
    {
      id: "fh-line-drive",
      name: "Forehand Down-the-Line Drive",
      focus: "Accuracy under pressure",
      description:
        "Alternate short and deep DTL targets to keep opponents honest and set up poaches. Track made vs. miss each round.",
      xp: 60,
      durationMinutes: 18,
      tags: ["forehand", "baseline", "accuracy"]
    },
    {
      id: "bh-line-drive",
      name: "Backhand Down-the-Line Drive",
      focus: "Backhand aggression",
      description:
        "Work 5x12 reps hugging the sideline to expand your backhand attacking window and punish poaches.",
      xp: 60,
      durationMinutes: 18,
      tags: ["backhand", "baseline", "accuracy"]
    },
    {
      id: "fh-cross-drop",
      name: "Forehand Cross-Court Drop",
      focus: "Soft touch",
      description:
        "Progress baseline-to-kitchen drops with travel into the NVZ. Mix neutral, angled, and high-arc variations.",
      xp: 65,
      durationMinutes: 22,
      tags: ["forehand", "touch", "transition"]
    },
    {
      id: "bh-cross-drop",
      name: "Backhand Cross-Court Drop",
      focus: "Soft touch",
      description:
        "Repeat the drop progression backhand side focusing on compact strokes and absorbing pace into the kitchen.",
      xp: 65,
      durationMinutes: 22,
      tags: ["backhand", "touch", "transition"]
    },
    {
      id: "roll-volley-chain",
      name: "Forehand & Backhand Roll Volleys",
      focus: "Topspin roll",
      description:
        "From mid-court, alternate roll volleys off both wings to shape balls down at opponents' feet.",
      xp: 58,
      durationMinutes: 18,
      tags: ["mid-court", "topspin", "pressure"]
    },
    {
      id: "flick-series",
      name: "Kitchen Flick & Speed-Up",
      focus: "Attack selection",
      description:
        "Practice disguised flicks from the NVZ against a practice partner or wall, mixing forehand and backhand takes.",
      xp: 62,
      durationMinutes: 20,
      tags: ["kitchen", "speed-up", "attack"]
    },
    {
      id: "reset-gauntlet",
      name: "Reset Gauntlet",
      focus: "Defensive touch",
      description:
        "Have feeds fired at you from mid-court and reset 30 balls softly back into the kitchen while closing in.",
      xp: 72,
      durationMinutes: 25,
      tags: ["defense", "touch", "transition"]
    },
    {
      id: "lob-defense-offense",
      name: "Offensive & Defensive Lobs",
      focus: "Aerial control",
      description:
        "Split reps between surprise kitchen lobs and deep defensive lobs to regain neutral. Aim for baseline depth.",
      xp: 60,
      durationMinutes: 20,
      tags: ["lobs", "defense", "offense"]
    },
    {
      id: "serve-targets",
      name: "Serve Targets",
      focus: "Consistent depth",
      description:
        "Hit 40 serves alternating corners and centerline. Log how many finish within two feet of the baseline.",
      xp: 50,
      durationMinutes: 18,
      tags: ["serve", "fundamentals", "accuracy"]
    },
    {
      id: "deep-returns",
      name: "Deep Returns",
      focus: "Return depth",
      description:
        "Roll 40 returns cross-court with height, keeping servers back so you can own the kitchen first.",
      xp: 48,
      durationMinutes: 18,
      tags: ["return", "depth", "fundamentals"]
    },
    {
      id: "transition-shuffle",
      name: "Transition Shuffle",
      focus: "Footwork timing",
      description:
        "Combine soft drops with split-steps into the NVZ line. Emphasize staying balanced between each shot.",
      xp: 50,
      durationMinutes: 16,
      tags: ["movement", "footwork", "conditioning"]
    }
  ];

  function createMetaBadge(text, className) {
    const badge = document.createElement("span");
    badge.className = className;
    badge.textContent = text;
    return badge;
  }

  function renderShotLibraryList(container, shots = []) {
    if (!container) {
      return;
    }

    const source =
      Array.isArray(shots) && shots.length ? shots : [...DEFAULT_SHOT_LIBRARY];

    container.innerHTML = "";

    if (source.length === 0) {
      const empty = document.createElement("li");
      empty.className = "shot-item empty";
      empty.textContent = "No shots to show yet. Add a custom session to get started.";
      container.appendChild(empty);
      return;
    }

    source.forEach((shot) => {
      const item = document.createElement("li");
      item.className = "shot-item";
      if (shot.isCustom || shot.type === "custom") {
        item.classList.add("shot-item-custom");
      }

      if (shot.id) {
        item.dataset.shotId = shot.id;
      }

      const header = document.createElement("header");
      header.className = "shot-item-header";

      const title = document.createElement("h3");
      title.textContent = shot.name || shot.title || "Custom Shot";

      const headerRight = document.createElement("div");
      headerRight.className = "shot-header-right";

      if (shot.isCustom || shot.type === "custom") {
        const badge = createMetaBadge("Custom", "shot-badge custom");
        headerRight.appendChild(badge);
      }

      const focusText = shot.focus || shot.focusLabel;
      if (focusText) {
        const focus = document.createElement("span");
        focus.className = "shot-focus";
        focus.textContent = focusText;
        headerRight.appendChild(focus);
      }

      header.append(title, headerRight);

      const description = document.createElement("p");
      description.textContent = shot.description || "No description provided.";

      const meta = document.createElement("div");
      meta.className = "shot-meta";
      const metaItems = [];

      if (shot.durationMinutes) {
        metaItems.push(`Time: ${shot.durationMinutes} min`);
      }
      if (shot.xp) {
        metaItems.push(`XP: +${shot.xp}`);
      }
      if (Array.isArray(shot.tags) && shot.tags.length) {
        metaItems.push(`Tags: ${shot.tags.length}`);
      }

      if (metaItems.length > 0) {
        meta.textContent = metaItems.join(" | ");
      }

      const tagsRow = document.createElement("div");
      tagsRow.className = "shot-tags";
      if (Array.isArray(shot.tags)) {
        shot.tags.forEach((tag) => {
          const tagEl = createMetaBadge(tag, "shot-tag");
          tagsRow.appendChild(tagEl);
        });
      }

      item.append(header, description);
      if (meta.textContent) {
        item.appendChild(meta);
      }
      if (tagsRow.childElementCount > 0) {
        item.appendChild(tagsRow);
      }
      container.appendChild(item);
    });
  }

  window.DEFAULT_SHOT_LIBRARY = DEFAULT_SHOT_LIBRARY;
  window.renderShotLibraryList = renderShotLibraryList;
})();



