const shotLibraryState = {
  defaultShots: [],
  customShots: [],
  loading: false
};

const listEl = document.getElementById("shotLibraryList");
const countEl = document.getElementById("shotCount");
const openFormButton = document.getElementById("openCustomShotForm");
const shotFormContainer = document.getElementById("shotFormContainer");
const shotForm = document.getElementById("customShotForm");
const cancelFormButton = document.getElementById("cancelShotForm");
const messageEl = document.getElementById("shotFormMessage");
const collapsedInfoEl = document.getElementById("shotCollapsedInfo");

function revealShotLibraryLink() {
  const link = document.getElementById("shotLibraryLink");
  if (link) {
    link.hidden = false;
    link.removeAttribute("hidden");
  }
}

async function checkAuthentication() {
  const response = await fetch("/api/auth/me", {
    headers: { Accept: "application/json" },
    credentials: "same-origin"
  });
  if (!response.ok) {
    throw new Error("Authentication check failed.");
  }
  const data = await response.json();
  if (!data?.authenticated) {
    throw new Error("Not authenticated.");
  }
  return data;
}

async function request(url, options = {}) {
  const config = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  };

  if (config.body && typeof config.body !== "string") {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "Something went wrong.");
  }
  return data;
}

function setMessage(text, type = "") {
  if (!messageEl) {
    return;
  }
  messageEl.textContent = text || "";
  messageEl.classList.remove("error", "success");
  if (text && type) {
    messageEl.classList.add(type);
  }
}

function setFormVisible(visible) {
  if (!shotForm || !openFormButton || !shotFormContainer) {
    return;
  }
  shotFormContainer.hidden = !visible;
  openFormButton.setAttribute("aria-expanded", visible ? "true" : "false");
  openFormButton.classList.toggle("shot-add-button--open", visible);
  if (!visible) {
    openFormButton.textContent = "Add custom shot";
    openFormButton.focus();
  } else {
    openFormButton.textContent = "Hide custom shot form";
  }

  if (visible) {
    setMessage("");
    const firstInput = shotForm.querySelector("input, textarea");
    window.setTimeout(() => firstInput?.focus(), 0);
    if (collapsedInfoEl) {
      collapsedInfoEl.hidden = true;
    }
  } else {
    shotForm.reset();
  }
}

function parseTags(value) {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function combineShots() {
  const customShots = Array.isArray(shotLibraryState.customShots)
    ? shotLibraryState.customShots.map((shot) => ({ ...shot, isCustom: true }))
    : [];
  const defaultShots = Array.isArray(shotLibraryState.defaultShots)
    ? shotLibraryState.defaultShots.map((shot) => ({
        ...shot,
        isCustom: shot.isCustom || shot.type === "custom"
      }))
    : [];
  return [...customShots, ...defaultShots];
}

function renderShotCount(total) {
  if (countEl) {
    countEl.textContent = total.toString();
  }
}

function renderShots() {
  if (typeof window.renderShotLibraryList !== "function" || !listEl) {
    return;
  }
  const combined = combineShots();
  window.renderShotLibraryList(listEl, combined);
  renderShotCount(combined.length);
}

function showLoadingPlaceholder() {
  if (!listEl) {
    return;
  }
  listEl.innerHTML = "";
  const loadingItem = document.createElement("li");
  loadingItem.className = "shot-item loading";
  loadingItem.textContent = "Loading shot library...";
  listEl.appendChild(loadingItem);
}

async function loadShotLibrary() {
  if (!listEl) {
    return;
  }
  const fallbackDefaults = Array.isArray(window.DEFAULT_SHOT_LIBRARY)
    ? window.DEFAULT_SHOT_LIBRARY
    : [];

  try {
    shotLibraryState.loading = true;
    showLoadingPlaceholder();
    const data = await request("/api/shots");
    const defaults = Array.isArray(data.defaultShots) && data.defaultShots.length
      ? data.defaultShots
      : fallbackDefaults;
    const customs = Array.isArray(data.customShots) ? data.customShots : [];
    shotLibraryState.defaultShots = defaults;
    shotLibraryState.customShots = customs;
    renderShots();
    setMessage("");
  } catch (error) {
    shotLibraryState.defaultShots = fallbackDefaults;
    shotLibraryState.customShots = [];
    renderShots();
    setMessage(error.message || "Unable to load shot library. Showing saved drills.", "error");
  } finally {
    shotLibraryState.loading = false;
  }
}

async function handleShotFormSubmit(event) {
  event.preventDefault();
  if (!shotForm) {
    return;
  }

  const formData = new FormData(shotForm);
  const payload = {
    name: formData.get("name"),
    focus: formData.get("focus"),
    description: formData.get("description"),
    tags: parseTags(formData.get("tags"))
  };

  const xpValue = formData.get("xp");
  if (xpValue !== null && xpValue !== "") {
    payload.xp = Number(xpValue);
  }

  const durationValue = formData.get("durationMinutes");
  if (durationValue !== null && durationValue !== "") {
    payload.durationMinutes = Number(durationValue);
  }

  const submitButton = shotForm.querySelector('button[type="submit"]');
  submitButton?.setAttribute("disabled", "disabled");
  if (submitButton) {
    submitButton.textContent = "Saving...";
  }

  try {
    const result = await request("/api/shots", {
      method: "POST",
      body: payload
    });
    const shot = result?.shot;
    if (shot) {
      shotLibraryState.customShots = [{ ...shot, isCustom: true }, ...shotLibraryState.customShots];
      renderShots();
      setMessage("Custom shot added to your library.", "success");
      if (collapsedInfoEl) {
        const shotName = shot?.name ? `"${shot.name}"` : "Custom shot";
        collapsedInfoEl.textContent = `${shotName} saved. Click "Add custom shot" to add another.`;
        collapsedInfoEl.hidden = false;
      }
    }
    setFormVisible(false);
  } catch (error) {
    setMessage(error.message || "Could not save your shot.", "error");
  } finally {
    if (submitButton) {
      submitButton.removeAttribute("disabled");
      submitButton.textContent = "Save to library";
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await checkAuthentication();
    revealShotLibraryLink();
    await loadShotLibrary();
  } catch (error) {
    console.warn("Redirecting to dashboard because authentication failed.", error);
    window.location.replace("/");
    return;
  }

  openFormButton?.addEventListener("click", () => {
    const nextVisible = shotFormContainer ? shotFormContainer.hidden : true;
    setFormVisible(nextVisible);
  });
  cancelFormButton?.addEventListener("click", () => {
    setFormVisible(false);
    setMessage("");
    if (collapsedInfoEl) {
      collapsedInfoEl.hidden = true;
    }
  });
  shotForm?.addEventListener("submit", handleShotFormSubmit);
});




