const starPattern = document.querySelector(".star-pattern");
const twinkleLayer = document.querySelector(".twinkle-layer");

const starGrid = [];
const starGapX = 26;
const starGapY = 26;
const isBackgroundRecordPage = document.querySelector(".background-record-page");
const starAreaWidth = isBackgroundRecordPage ? 1200 : 800;
const starAreaHeight = isBackgroundRecordPage ? 820 : 320;

for (let y = 0; y < starAreaHeight; y += starGapY) {
  for (let x = 0; x < starAreaWidth; x += starGapX) {
    starGrid.push([x, y]);
  }
}

const twinkleStars = starGrid.map(([x, y]) => {
  const whiteStar = document.createElement("span");
  whiteStar.className = "pattern-star";
  whiteStar.style.left = `${x}px`;
  whiteStar.style.top = `${y}px`;
  starPattern.appendChild(whiteStar);

  const blueStar = document.createElement("span");
  blueStar.className = "twinkle-star";
  blueStar.style.left = `${x}px`;
  blueStar.style.top = `${y}px`;
  twinkleLayer.appendChild(blueStar);
  return { x, y, el: blueStar, patternEl: whiteStar };
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hotspotAreas = [
  { x: 360, y: 0, width: 150, height: 170 },
  { x: 560, y: 0, width: 640, height: 180 },
];
const hotspotStars = twinkleStars.filter(({ x, y }) =>
  hotspotAreas.some((area) =>
    x >= area.x &&
    x <= area.x + area.width &&
    y >= area.y &&
    y <= area.y + area.height
  )
);
const minActiveTwinkles = 5;
const maxActiveTwinkles = 5;
const adjacentX = starGapX * 1.1;
const adjacentY = starGapY * 1.1;
const twinkleIntensities = [
  { peak: 1, glow: "5px", glowAlpha: 0.52, weight: 2 },
  { peak: 0.5, glow: "4px", glowAlpha: 0.34, weight: 4 },
  { peak: 0.2, glow: "2px", glowAlpha: 0.18, weight: 3 },
];
const strongIntensity = twinkleIntensities[0];

function pickIntensity() {
  const totalWeight = twinkleIntensities.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * totalWeight;
  for (const item of twinkleIntensities) {
    cursor -= item.weight;
    if (cursor <= 0) return item;
  }
  return twinkleIntensities[0];
}

function isNearActiveStar(candidate) {
  return twinkleStars.some(({ x, y, el }) =>
    el.classList.contains("is-twinkling") &&
    Math.abs(candidate.x - x) <= adjacentX &&
    Math.abs(candidate.y - y) <= adjacentY
  );
}

function pickTwinkleStar({ forceHotspot = false } = {}) {
  const pool = (forceHotspot || Math.random() < 0.96) && hotspotStars.length > 0 ? hotspotStars : twinkleStars;
  for (let attempt = 0; attempt < 28; attempt += 1) {
    const star = pool[Math.floor(Math.random() * pool.length)];
    if (!star.el.classList.contains("is-twinkling") && !isNearActiveStar(star)) {
      return star;
    }
  }

  return twinkleStars.find((star) =>
    !star.el.classList.contains("is-twinkling") &&
    !isNearActiveStar(star)
  );
}

function activeTwinkleCount() {
  return twinkleStars.filter(({ el }) => el.classList.contains("is-twinkling")).length;
}

function activeStrongStars() {
  return twinkleStars.filter(({ el }) =>
    el.classList.contains("is-twinkling") &&
    el.style.getPropertyValue("--twinkle-peak") === "1"
  );
}

function applyIntensity(star, intensity) {
  star.el.style.setProperty("--twinkle-peak", intensity.peak);
  star.el.style.setProperty("--twinkle-glow", intensity.glow);
  star.el.style.setProperty("--twinkle-glow-alpha", intensity.glowAlpha);
}

function lightOneStar({ forceStrong = false, forceHotspot = false } = {}) {
  if (reducedMotion || twinkleStars.length === 0 || activeTwinkleCount() >= maxActiveTwinkles) return;
  const star = pickTwinkleStar({ forceHotspot: forceHotspot || forceStrong });
  if (!star || star.el.classList.contains("is-twinkling")) return;

  const duration = 5600 + Math.round(Math.random() * 1800);
  const intensity = forceStrong ? strongIntensity : pickIntensity();
  star.el.style.setProperty("--twinkle-duration", `${duration}ms`);
  applyIntensity(star, intensity);
  star.el.classList.add("is-twinkling");
  if (forceStrong) {
    window.setTimeout(prepareNextStrongTwinkle, Math.round(duration * 0.7));
  }
  window.setTimeout(() => {
    star.el.classList.remove("is-twinkling");
    if (forceStrong) {
      ensureStrongTwinkle();
    }
  }, duration);
}

function prepareNextStrongTwinkle() {
  if (reducedMotion || activeStrongStars().length > 1) return;
  if (activeTwinkleCount() < maxActiveTwinkles) {
    lightOneStar({ forceStrong: true, forceHotspot: true });
    return;
  }

  const activeHotspotStar = hotspotStars.find(({ el }) =>
    el.classList.contains("is-twinkling") &&
    el.style.getPropertyValue("--twinkle-peak") !== "1"
  );
  const activeStar = activeHotspotStar || twinkleStars.find(({ el }) =>
    el.classList.contains("is-twinkling") &&
    el.style.getPropertyValue("--twinkle-peak") !== "1"
  );
  if (activeStar) {
    applyIntensity(activeStar, strongIntensity);
  }
}

function ensureStrongTwinkle() {
  if (reducedMotion || activeStrongStars().length > 0) return;
  if (activeTwinkleCount() < maxActiveTwinkles) {
    lightOneStar({ forceStrong: true, forceHotspot: true });
    return;
  }

  const activeHotspotStar = hotspotStars.find(({ el }) => el.classList.contains("is-twinkling"));
  const activeStar = activeHotspotStar || twinkleStars.find(({ el }) => el.classList.contains("is-twinkling"));
  if (activeStar) {
    applyIntensity(activeStar, strongIntensity);
  }
}

function maintainTwinkles() {
  if (reducedMotion) return;
  ensureStrongTwinkle();
  const active = activeTwinkleCount();
  if (active < minActiveTwinkles) {
    lightOneStar();
    return;
  }
  if (active < maxActiveTwinkles && Math.random() < 0.42) {
    lightOneStar({ forceHotspot: true });
  }
}

lightOneStar({ forceStrong: true, forceHotspot: true });
for (let i = 1; i < minActiveTwinkles; i += 1) {
  window.setTimeout(() => {
    lightOneStar({ forceHotspot: true });
  }, 700 + i * 1100 + Math.random() * 400);
}

window.setInterval(maintainTwinkles, 1350);
window.setInterval(ensureStrongTwinkle, 240);

const tabs = document.querySelectorAll(".mode-tab");
const panels = document.querySelectorAll("[data-panel]");
const modeTabs = document.querySelector(".mode-tabs");
const mainStage = document.querySelector(".main-stage");
const composerShell = document.querySelector(".composer-shell");
const title = document.querySelector(".title");
const typedPrefix = document.querySelector(".typed-prefix");
const typedGradient = document.querySelector(".typed-gradient");
const typedSuffix = document.querySelector(".typed-suffix");
const pageShell = document.querySelector(".page");
const sidebarToggle = document.querySelector(".sidebar-toggle");
const brandLink = document.querySelector(".brand");
const skillChips = document.querySelectorAll(".skill-chip[data-skill-name]");
const profileButton = document.querySelector(".profile-button");
const feedTabs = document.querySelectorAll(".category-tabs [data-feed-tab]");
const feedPanels = document.querySelectorAll("[data-feed-panel]");
const sharedFeed = document.querySelector(".shared-feed");
const skillTriggerButtons = document.querySelectorAll(".skill-trigger");
const skillMenu = document.querySelector(".skill-menu");
const skillMenuItems = document.querySelectorAll(".skill-menu-item[data-skill-name]");
const isSkillMenuTemporarilyHidden = true;
let activeMode = mainStage?.dataset.activeMode || "chat";
let modeSwitchContentTimer = null;
let modeSwitchFinishTimer = null;
let modeSwitchFrame = null;
let composerFlipFrame = null;
let composerFlipCleanupTimer = null;
let skillStripGhostCleanupTimer = null;
let composerOrbitFrame = null;
let titleTypeTimer = null;

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  profileButton?.setAttribute(
    "aria-label",
    nextTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"
  );
}

applyTheme(document.documentElement.dataset.theme || "light");

function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
}

profileButton?.addEventListener("click", () => {
  toggleTheme();
});

modeTabs.dataset.activeMode = activeMode;
mainStage.dataset.activeMode = activeMode;
composerShell.dataset.composerMode = activeMode;

function applySelectedSkill(skillName) {
  const prompt = document.querySelector(activeMode === "canvas" ? ".canvas-prompt" : ".prompt-wrap");
  const input = prompt?.querySelector("textarea");
  const editor = input?.promptEditor;

  if (!skillName || !prompt || !input || !editor) return;

  insertSkillToken(editor, skillName);
  syncEditorToInput(editor, input);
  prompt.classList.add("has-selected-skill");
  composerShell.classList.add("is-input-active");
  composerShell.classList.add("has-selected-skill");
  updateComposerInputState(input);
}

function closeSkillMenu() {
  skillMenu?.setAttribute("hidden", "");
  skillTriggerButtons.forEach((button) => {
    button.classList.remove("is-menu-open");
    button.setAttribute("aria-expanded", "false");
  });
}

function openSkillMenu(triggerButton) {
  if (!skillMenu) return;
  if (isSkillMenuTemporarilyHidden) {
    closeSkillMenu();
    return;
  }
  skillMenu.removeAttribute("hidden");
  skillTriggerButtons.forEach((button) => {
    const isOpenButton = button === triggerButton;
    button.classList.toggle("is-menu-open", isOpenButton);
    button.setAttribute("aria-expanded", isOpenButton ? "true" : "false");
  });
  composerShell.classList.add("is-input-active");
}

function toggleSkillMenu(triggerButton) {
  if (!skillMenu) return;
  if (isSkillMenuTemporarilyHidden) {
    closeSkillMenu();
    return;
  }
  if (!skillMenu.hidden && triggerButton.classList.contains("is-menu-open")) {
    closeSkillMenu();
    return;
  }
  openSkillMenu(triggerButton);
}

skillTriggerButtons.forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
  });

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleSkillMenu(button);
  });
});

skillMenu?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
});

skillMenu?.addEventListener("click", (event) => {
  event.stopPropagation();
});

skillMenuItems.forEach((item) => {
  item.addEventListener("click", () => {
    applySelectedSkill(item.dataset.skillName);
    closeSkillMenu();
  });
});

document.addEventListener("click", (event) => {
  if (skillMenu?.hidden) return;
  if (skillMenu.contains(event.target) || Array.from(skillTriggerButtons).some((button) => button.contains(event.target))) {
    return;
  }
  closeSkillMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeSkillMenu();
});

skillChips.forEach((chip) => {
  chip.addEventListener("pointerdown", (event) => {
    event.preventDefault();
  });

  chip.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  chip.addEventListener("click", () => {
    applySelectedSkill(chip.dataset.skillName);
  });
});

const titleCopy = {
  chat: {
    prefix: "What would you like to",
    gradient: "create",
    suffix: "today?",
  },
  canvas: {
    prefix: "Start creating with",
    gradient: "Canvas",
    suffix: "",
  },
};

function renderTitle(mode, count = Infinity) {
  let remaining = count;
  [typedPrefix, typedGradient, typedSuffix].forEach((span, index) => {
    const key = index === 0 ? "prefix" : index === 1 ? "gradient" : "suffix";
    const value = titleCopy[mode][key];
    const visibleCount = Math.max(0, Math.min(value.length, remaining));
    span.textContent = value.slice(0, visibleCount);
    remaining -= visibleCount;
  });
}

renderTitle(activeMode);

function setFeedTab(feedTab) {
  const nextFeedTab = feedTab === "gd" ? "gd" : "am";
  sharedFeed?.setAttribute("data-active-feed-tab", nextFeedTab);

  feedTabs.forEach((tab) => {
    const selected = tab.dataset.feedTab === nextFeedTab;
    tab.classList.toggle("selected", selected);
    tab.setAttribute("aria-selected", String(selected));
  });

  feedPanels.forEach((panel) => {
    panel.hidden = panel.dataset.feedPanel !== nextFeedTab;
  });
}

setFeedTab(activeMode === "chat" ? "gd" : "am");

function typeTitle(mode) {
  window.clearTimeout(titleTypeTimer);
  const totalLength = titleCopy[mode].prefix.length + titleCopy[mode].gradient.length + titleCopy[mode].suffix.length;
  let count = 0;
  title.classList.add("is-typing");
  renderTitle(mode, 0);

  const tick = () => {
    count += 1;
    renderTitle(mode, count);
    if (count < totalLength) {
      const delay = count < titleCopy[mode].prefix.length ? 19 : 24;
      titleTypeTimer = window.setTimeout(tick, delay);
      return;
    }
    titleTypeTimer = window.setTimeout(() => {
      title.classList.remove("is-typing");
    }, 220);
  };

  titleTypeTimer = window.setTimeout(tick, 70);
}

function clearPanelMotion(panel) {
  panel.classList.remove(
    "panel-leave",
    "panel-enter",
    "panel-enter-active",
    "lower-enter-from-below",
    "lower-enter-from-above",
    "lower-leave-to-up",
    "lower-leave-to-down"
  );
}

function clearSkillStripMotion() {
  mainStage.classList.remove("skill-strip-ghosting");
}

function switchMode(mode) {
  if (mode === activeMode) return;

  window.clearTimeout(modeSwitchContentTimer);
  window.clearTimeout(modeSwitchFinishTimer);
  window.cancelAnimationFrame(modeSwitchFrame);
  window.cancelAnimationFrame(composerFlipFrame);
  window.clearTimeout(composerFlipCleanupTimer);
  window.clearTimeout(skillStripGhostCleanupTimer);
  clearSkillStripMotion();
  const previousMode = activeMode;
  activeMode = mode;

  function applyModeLayout() {
    mainStage.dataset.activeMode = mode;
    composerShell.dataset.composerMode = mode;
  }

  function animateComposerLayoutChange() {
    if (!composerShell || reducedMotion) {
      applyModeLayout();
      return;
    }

    const before = composerShell.getBoundingClientRect();
    composerShell.classList.remove("is-mode-flipping");
    composerShell.classList.add("is-mode-layout-switching");
    composerShell.style.removeProperty("transform");
    composerShell.style.removeProperty("transform-origin");

    applyModeLayout();

    const after = composerShell.getBoundingClientRect();
    const deltaX = before.left - after.left;
    const deltaY = before.top - after.top;
    const scaleX = after.width ? before.width / after.width : 1;
    const scaleY = after.height ? before.height / after.height : 1;
    const changed =
      Math.abs(deltaX) > 0.5 ||
      Math.abs(deltaY) > 0.5 ||
      Math.abs(scaleX - 1) > 0.005 ||
      Math.abs(scaleY - 1) > 0.005;

    if (!changed) {
      composerShell.classList.remove("is-mode-layout-switching");
      return;
    }

    composerShell.style.transformOrigin = "top left";
    composerShell.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;
    void composerShell.offsetWidth;

    composerShell.classList.remove("is-mode-layout-switching");
    composerShell.classList.add("is-mode-flipping");

    composerFlipFrame = window.requestAnimationFrame(() => {
      composerShell.style.transform = "translate(0, 0) scale(1, 1)";
    });

    composerFlipCleanupTimer = window.setTimeout(() => {
      composerShell.classList.remove("is-mode-flipping");
      composerShell.style.removeProperty("transform");
      composerShell.style.removeProperty("transform-origin");
    }, 680);
  }

  modeTabs.classList.remove("switching-to-chat", "switching-to-canvas");
  mainStage.classList.toggle("mode-exiting-canvas", previousMode === "canvas" && mode === "chat");
  void modeTabs.offsetWidth;
  modeTabs.classList.add(`switching-to-${mode}`);
  modeTabs.dataset.activeMode = mode;
  animateComposerLayoutChange();
  setFeedTab(mode === "chat" ? "gd" : "am");
  typeTitle(mode);

  tabs.forEach((item) => {
    const selected = item.dataset.mode === mode;
    item.classList.toggle("active", selected);
    item.setAttribute("aria-selected", String(selected));
  });

  const outgoingPanels = [...panels].filter((panel) => panel.dataset.panel === previousMode && !panel.hidden);
  const incomingPanels = [...panels].filter((panel) => panel.dataset.panel === mode);
  const enteringFrom = mode === "canvas" ? "lower-enter-from-below" : "lower-enter-from-above";
  const leavingTo = mode === "canvas" ? "lower-leave-to-up" : "lower-leave-to-down";
  const exitsCanvasToChat = previousMode === "canvas" && mode === "chat";
  if (exitsCanvasToChat) {
    outgoingPanels.forEach((panel) => {
      clearPanelMotion(panel);
      panel.classList.add("panel-leave");
      if (panel.classList.contains("lower-panel")) {
        panel.classList.add(leavingTo);
      }
    });
  }

  modeSwitchContentTimer = window.setTimeout(() => {
    incomingPanels.forEach((panel) => {
      clearPanelMotion(panel);
      panel.hidden = false;
    });

    incomingPanels.forEach((panel) => {
      panel.classList.add("panel-enter");
      if (panel.classList.contains("lower-panel")) {
        panel.classList.add(enteringFrom);
      }
    });

    modeSwitchFrame = window.requestAnimationFrame(() => {
      if (!exitsCanvasToChat) {
        outgoingPanels.forEach((panel) => {
          clearPanelMotion(panel);
          panel.classList.add("panel-leave");
          if (panel.classList.contains("lower-panel")) {
            panel.classList.add(leavingTo);
          }
        });
      }

      incomingPanels.forEach((panel) => {
        panel.classList.add("panel-enter-active");
      });
    });
  }, 90);

  const finishDelay = previousMode === "canvas" && mode === "chat" ? 300 : 820;

  modeSwitchFinishTimer = window.setTimeout(() => {
    outgoingPanels.forEach((panel) => {
      panel.hidden = true;
      clearPanelMotion(panel);
    });
    incomingPanels.forEach(clearPanelMotion);
    modeTabs.classList.remove("switching-to-chat", "switching-to-canvas");
    mainStage.classList.remove("mode-exiting-canvas");
  }, finishDelay);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    switchMode(tab.dataset.mode);
  });
});

feedTabs.forEach((tab) => {
  tab.setAttribute("role", "tab");
  tab.addEventListener("click", () => {
    setFeedTab(tab.dataset.feedTab);
  });
});

if (pageShell && sidebarToggle) {
  const setSidebarCollapsed = (isCollapsed) => {
    brandLink?.classList.remove("is-logo-hovering");
    pageShell.classList.toggle("sidebar-collapsed", isCollapsed);
    sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
    sidebarToggle.setAttribute(
      "aria-label",
      isCollapsed ? "Expand sidebar" : "Collapse sidebar"
    );
  };

  sidebarToggle.addEventListener("click", () => {
    const isCollapsed = !pageShell.classList.contains("sidebar-collapsed");
    setSidebarCollapsed(isCollapsed);
    sidebarToggle.blur();
  });

  brandLink?.addEventListener("click", (event) => {
    event.preventDefault();
    if (pageShell.classList.contains("sidebar-collapsed")) {
      setSidebarCollapsed(false);
    }
  });

  brandLink?.addEventListener("mouseenter", () => {
    if (!pageShell.classList.contains("sidebar-collapsed")) return;
    brandLink.classList.add("is-logo-hovering");
  });

  brandLink?.addEventListener("mouseleave", () => {
    brandLink.classList.remove("is-logo-hovering");
  });

  brandLink?.addEventListener("focus", () => {
    if (!pageShell.classList.contains("sidebar-collapsed")) return;
    brandLink.classList.add("is-logo-hovering");
  });

  brandLink?.addEventListener("blur", () => {
    brandLink.classList.remove("is-logo-hovering");
  });
}

const hoverVideoItems = [...document.querySelectorAll(".video-hover-thumb")]
  .map((thumb) => {
    const video = thumb.querySelector("video");
    return video ? { thumb, video } : null;
  })
  .filter(Boolean);
const primaryNavItems = document.querySelectorAll(".primary-nav .nav-item");
const createNavItem = document.querySelector(".nav-create-item");
const exploreNavItem = document.querySelector(".nav-explore-item");
const assetsNavItem = document.querySelector(".nav-assets-item");
const elementsNavItem = document.querySelector(".nav-elements-item");
const schemeSwitch = document.querySelector(".scheme-switch");
const schemeOptions = document.querySelectorAll(".scheme-option");
const composerInputs = document.querySelectorAll(".composer textarea, .composer input");
const promptEditorRanges = new WeakMap();
const whatsNewCarousel = document.querySelector(".whats-new-carousel");
const whatsNewRail = whatsNewCarousel?.querySelector(".whats-new-grid");
const whatsNewNext = whatsNewCarousel?.querySelector(".whats-new-next");
const whatsNewPrev = whatsNewCarousel?.querySelector(".whats-new-prev");
const gdTiles = document.querySelectorAll(".feed-tab-gd .gd-tile");
const gdUserMeta = [
  ["激怒里围丝", "./assets/figma/canvas/avatar-jinx-new.png"],
  ["Mika Chen", "./assets/figma/canvas/avatar-ssshy99.png"],
  ["Nora Studio", "./assets/figma/canvas/avatar-huli-new.png"],
  ["XIXI uncle", "./assets/figma/canvas/avatar-d3.png"],
  ["Luna Park", "./assets/figma/dom/avatar.jpg"],
  ["Dreamina Lab", "./assets/figma/canvas/official-avatar-new.png"],
  ["Riko Zhang", "./assets/figma/dom/avatar.jpg"],
  ["Aster Lee", "./assets/figma/canvas/avatar-huli.png"],
  ["Kumo Works", "./assets/figma/canvas/avatar-jinx.png"],
  ["Yuna Design", "./assets/figma/dom/avatar.png"],
  ["Noah Grid", "./assets/figma/am-provided/am-01.png"],
  ["Echo Muse", "./assets/figma/am-provided/am-02.png"],
  ["Mori Studio", "./assets/figma/am-provided/am-03.png"],
  ["April Sun", "./assets/figma/am-provided/am-04.png"],
  ["Jin Visual", "./assets/figma/am-provided/am-05.png"],
  ["Tara Bloom", "./assets/figma/am-provided/am-06.png"],
  ["Pixel Cove", "./assets/figma/am-provided/am-07.png"],
  ["Lio Mockup", "./assets/figma/am-provided/am-08.png"],
  ["Blue Hour", "./assets/figma/am-provided/am-09.png"],
  ["Sora Yan", "./assets/figma/am-provided/am-10.png"],
  ["D3 Archive", "./assets/figma/am-provided/am-11.png"],
  ["Dreamina AI", "./assets/figma/am-provided/am-12.png"],
];

function updateWhatsNewCarouselState() {
  if (!whatsNewCarousel || !whatsNewRail) return;
  const maxScroll = whatsNewRail.scrollWidth - whatsNewRail.clientWidth;
  whatsNewCarousel.classList.toggle("is-at-start", whatsNewRail.scrollLeft <= 1);
  whatsNewCarousel.classList.toggle("is-at-end", maxScroll <= 1 || whatsNewRail.scrollLeft >= maxScroll - 1);
}

if (whatsNewRail) {
  whatsNewNext?.addEventListener("click", () => {
    const maxScroll = whatsNewRail.scrollWidth - whatsNewRail.clientWidth;
    whatsNewRail.scrollTo({ left: maxScroll, behavior: "smooth" });
  });

  whatsNewPrev?.addEventListener("click", () => {
    whatsNewRail.scrollTo({ left: 0, behavior: "smooth" });
  });

  whatsNewRail.addEventListener("scroll", updateWhatsNewCarouselState, { passive: true });
  window.addEventListener("resize", updateWhatsNewCarouselState);
  updateWhatsNewCarouselState();
}

gdTiles.forEach((tile, index) => {
  if (tile.querySelector(".gd-user")) return;
  const [name, avatar] = gdUserMeta[index % gdUserMeta.length];
  const user = document.createElement("span");
  user.className = "gd-user";
  user.innerHTML = `<img src="${avatar}" alt="" /><span>${name}</span>`;
  tile.append(user);
});
primaryNavItems.forEach((item) => {
  item.addEventListener("click", () => {
    primaryNavItems.forEach((navItem) => navItem.classList.remove("active"));
    item.classList.add("active");
  });
});

if (createNavItem) {
  createNavItem.addEventListener("click", () => {
    if (document.documentElement.dataset.assetsScheme !== "scheme-3") return;

    createNavItem.classList.remove("is-create-scheme3-activating");
    void createNavItem.offsetWidth;
    createNavItem.classList.add("is-create-scheme3-activating");

    window.setTimeout(() => {
      createNavItem.classList.remove("is-create-scheme3-activating");
    }, 980);
  });
}

if (exploreNavItem) {
  exploreNavItem.addEventListener("click", () => {
    if (!["scheme-1", "scheme-3"].includes(document.documentElement.dataset.assetsScheme)) return;

    exploreNavItem.classList.remove("is-compass-activating");
    void exploreNavItem.offsetWidth;
    exploreNavItem.classList.add("is-compass-activating");

    window.setTimeout(() => {
      exploreNavItem.classList.remove("is-compass-activating");
    }, 820);
  });
}

if (assetsNavItem) {
  const assetsSvg = assetsNavItem.querySelector(".assets-motion-icon");
  const assetsSchemeThreeDefaultBack = assetsNavItem.querySelector(".assets-scheme3-default-back");
  const assetsSchemeThreeDefaultFront = assetsNavItem.querySelector(".assets-scheme3-default-front");
  const assetsMorphBack = assetsNavItem.querySelector(".assets-morph-back");
  const assetsActiveCutout = assetsNavItem.querySelector(".assets-active-cutout");
  const assetsMorphFront = assetsNavItem.querySelector(".assets-morph-front");
  const assetsDefaultPaths = {
    back: "M8.72852 2.50488C9.57598 2.55313 10.3668 2.95902 10.9004 3.62598L11.7002 4.625C11.8899 4.86183 12.177 4.99995 12.4805 5H19C20.6566 5.00018 21.9999 6.34333 22 8V9.22754C21.6465 9.07959 21.2569 8.99748 20.8447 8.99707L20 8.99609V8C20 7.44785 19.5521 7.00018 19 7H12.4805C11.5692 6.99995 10.707 6.58553 10.1377 5.87402L9.33887 4.875C9.14926 4.63815 8.86197 4.50024 8.55859 4.5H5.50098C4.94869 4.5 4.50098 4.94772 4.50098 5.5V11.4971L3.45801 16.7119C2.96291 19.1871 4.8557 21.496 7.37988 21.4961H18.083L18.001 21.498H6.50098C4.29184 21.498 2.50098 19.7072 2.50098 17.498V5.5C2.50098 3.8949 3.76153 2.58421 5.34668 2.50391L5.50098 2.5H8.55859L8.72852 2.50488Z",
    front: "M21 9.99707V17.4961C21 19.1529 19.6569 20.4961 18 20.4961H6.5C4.84314 20.4961 3.5 19.1529 3.5 17.4961V9.99805H10.502L13.0439 9.99219L21 9.99707Z",
  };
  const assetsHoverPaths = {
    back: "M7.74707 2.50488C8.58377 2.55175 9.3662 2.94732 9.90039 3.59961L10.7422 4.62793C10.9083 4.83072 11.1467 4.9593 11.4043 4.98828L11.5156 4.99414H18.1758C19.7621 4.99414 21.0749 6.22911 21.1709 7.8125L21.2441 9.02344C21.1136 9.00605 20.9797 8.9972 20.8438 8.99707L19.2383 8.99512L19.1748 7.93359C19.1428 7.40579 18.7046 6.99414 18.1758 6.99414H11.5156C10.6165 6.99396 9.76401 6.59025 9.19434 5.89453L8.35254 4.86621C8.16261 4.63452 7.87871 4.50001 7.5791 4.5H4.66211C4.08932 4.50017 3.63299 4.9807 3.66309 5.55273L4.08496 13.5693L3.45703 16.7119C2.96193 19.1871 4.85566 21.4961 7.37988 21.4961H17.8213C17.7977 21.4965 17.7737 21.498 17.75 21.498H6.29492C4.23403 21.4979 2.5219 19.9354 2.31543 17.9062L2.30078 17.709L1.66602 5.65723C1.57878 3.99476 2.8595 2.59022 4.50195 2.50391L4.66211 2.5H7.5791L7.74707 2.50488Z",
    front: "M20.8428 9.99707C22.1041 9.99824 23.0491 11.1519 22.8018 12.3887L21.6631 18.085C21.3826 19.4872 20.1507 20.4961 18.7207 20.4961H7.37891C5.48599 20.4958 4.06627 18.7644 4.4375 16.9082L5.49805 11.6055C5.68511 10.6709 6.50589 9.99822 7.45898 9.99805H13.502L16.043 9.99219L20.8428 9.99707Z",
  };
  const assetsActivePaths = {
    back: "M7.5794 2.5C8.47879 2.5 9.33089 2.90374 9.90069 3.59961L10.7425 4.62793C10.9323 4.85973 11.2163 4.99403 11.5159 4.99414H18.1771C19.7632 4.99435 21.0752 6.22924 21.1712 7.8125L21.1829 8.02051C21.0671 8.00698 20.9492 8.00002 20.8294 8H6.71319C5.30719 8.0001 4.08949 8.97707 3.78448 10.3496L2.38897 16.6318C2.32055 16.9397 2.28946 17.2461 2.29229 17.5459L1.66632 5.65723C1.57625 3.94102 2.94378 2.50002 4.66241 2.5H7.5794Z",
    front: "M7.93945 10.5H19.959C21.1947 10.5001 22.1347 11.6101 21.9316 12.8291L21.0703 17.9971C20.8293 19.4437 19.5779 20.5039 18.1113 20.5039H7.91895C6.01609 20.5039 4.59349 18.7555 4.98145 16.8926L5.98145 12.0918C6.17474 11.1645 6.99224 10.5001 7.93945 10.5Z",
  };
  const assetsSchemeThreeDefaultPaths = {
    back: "M8.5791 2.5C9.47838 2.50009 10.3307 2.90382 10.9004 3.59961L11.7422 4.62793C11.9321 4.85971 12.216 4.99414 12.5156 4.99414H19C20.6567 4.9943 22 6.33738 22 7.99414V17.498C22 19.7071 20.209 21.4979 18 21.498H6.5C4.29086 21.498 2.5 19.7072 2.5 17.498V5.5C2.5 3.84315 3.84315 2.5 5.5 2.5H8.5791Z",
    front: "M21 11V17.5098C21 19.1666 19.6568 20.5098 18 20.5098L6.49902 20.5088C4.84257 20.5084 3.50019 19.1653 3.5 17.5088L3.49902 11H21Z",
  };
  let assetsMorphProgress = 0;
  let assetsMorphFrame = null;

  function sampleAssetsPath(d, count, closed = true) {
    const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
    probe.setAttribute("d", d);
    probe.setAttribute("opacity", "0");
    probe.setAttribute("pointer-events", "none");
    assetsSvg.appendChild(probe);
    const length = probe.getTotalLength();
    const points = Array.from({ length: count }, (_, index) => {
      const denominator = closed ? count : count - 1;
      const point = probe.getPointAtLength((length * index) / denominator);
      return { x: point.x, y: point.y };
    });
    probe.remove();
    return points;
  }

  function pointsToPath(points, closed) {
    const commands = points.map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${point.x.toFixed(3)} ${point.y.toFixed(3)}`;
    });
    return `${commands.join("")}${closed ? "Z" : ""}`;
  }

  function interpolatePoints(from, to, progress) {
    return from.map((point, index) => ({
      x: point.x + (to[index].x - point.x) * progress,
      y: point.y + (to[index].y - point.y) * progress,
    }));
  }

  function alignMorphPoints(reference, candidate) {
    const candidates = [candidate, [...candidate].reverse()];
    let bestPoints = candidate;
    let bestScore = Infinity;

    candidates.forEach((points) => {
      for (let offset = 0; offset < points.length; offset += 1) {
        let score = 0;
        for (let index = 0; index < points.length; index += 2) {
          const point = points[(index + offset) % points.length];
          const referencePoint = reference[index];
          score += Math.hypot(point.x - referencePoint.x, point.y - referencePoint.y);
        }

        if (score < bestScore) {
          bestScore = score;
          bestPoints = points.map((_, index) => points[(index + offset) % points.length]);
        }
      }
    });

    return bestPoints;
  }

  function normalizeClosedMorphPoints(points, reference = null) {
    const anchorScore = (point) => point.y * 2 + point.x;
    let anchorIndex = 0;

    points.forEach((point, index) => {
      if (anchorScore(point) < anchorScore(points[anchorIndex])) {
        anchorIndex = index;
      }
    });

    let normalized = points.map((_, index) => points[(index + anchorIndex) % points.length]);

    if (reference) {
      const forwardScore = normalized.reduce((sum, point, index) => {
        const referencePoint = reference[index];
        return sum + Math.hypot(point.x - referencePoint.x, point.y - referencePoint.y);
      }, 0);
      const reversed = [...points].reverse();
      let reversedAnchorIndex = 0;
      reversed.forEach((point, index) => {
        if (anchorScore(point) < anchorScore(reversed[reversedAnchorIndex])) {
          reversedAnchorIndex = index;
        }
      });
      const reversedNormalized = reversed.map((_, index) => reversed[(index + reversedAnchorIndex) % reversed.length]);
      const reversedScore = reversedNormalized.reduce((sum, point, index) => {
        const referencePoint = reference[index];
        return sum + Math.hypot(point.x - referencePoint.x, point.y - referencePoint.y);
      }, 0);

      if (reversedScore < forwardScore) {
        normalized = reversedNormalized;
      }
    }

    return normalized;
  }

  function easeAssetsMorph(progress) {
    return 1 - Math.pow(1 - progress, 3);
  }

  function setAssetsBackPaint({ filled }) {
    assetsMorphBack.setAttribute("fill", filled ? "black" : "none");
    assetsMorphBack.setAttribute("stroke", "black");
    assetsMorphBack.setAttribute("stroke-width", filled ? "0" : "2");
  }

  function setAssetsFrontPaint({ filled }) {
    assetsMorphFront.setAttribute("fill", "black");
    assetsMorphFront.setAttribute("stroke", "black");
    assetsMorphFront.setAttribute("stroke-width", filled ? "2" : "2");
  }

  function setSchemeThreeDefaultLayerOpacity(opacity) {
    if (!assetsSchemeThreeDefaultBack || !assetsSchemeThreeDefaultFront) return;
    assetsSchemeThreeDefaultBack.style.opacity = String(opacity);
    assetsSchemeThreeDefaultFront.style.opacity = String(opacity);
  }

  function setAssetsMorphLayerOpacity(opacity) {
    assetsMorphBack.style.opacity = String(opacity);
    assetsActiveCutout.style.opacity = String(opacity);
    assetsMorphFront.style.opacity = String(opacity);
  }

  function animateSchemeThreeAssetsClose() {
    if (!assetsMorphPoints) return;
    window.cancelAnimationFrame(assetsMorphFrame);

    if (reducedMotion) {
      renderSchemeThreeAssetsMorph(0);
      return;
    }

    const duration = 180;
    const startTime = performance.now();

    setAssetsBackPaint({ filled: true });
    setAssetsFrontPaint({ filled: true });
    assetsMorphBack.setAttribute("d", assetsActivePaths.back);
    assetsMorphFront.setAttribute("d", assetsActivePaths.front);
    assetsActiveCutout.setAttribute("fill-opacity", "1");
    assetsMorphFront.setAttribute("fill-opacity", "1");

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = smoothstep(0, 1, progress);

      setSchemeThreeDefaultLayerOpacity(eased);
      setAssetsMorphLayerOpacity(1 - eased);

      if (progress < 1) {
        assetsMorphFrame = window.requestAnimationFrame(tick);
        return;
      }

      renderSchemeThreeAssetsMorph(0);
    };

    assetsMorphFrame = window.requestAnimationFrame(tick);
  }

  function isAssetsSchemeTwo() {
    return document.documentElement.dataset.assetsScheme === "scheme-2";
  }

  function isAssetsSchemeThree() {
    return document.documentElement.dataset.assetsScheme === "scheme-3";
  }

  function easeAssetsMotionProgress(progress) {
    if (isAssetsSchemeThree()) {
      if (progress < 0.24) {
        const darkenProgress = progress / 0.24;
        return 0.5 * (1 - Math.pow(1 - darkenProgress, 3));
      }

      const openProgress = (progress - 0.24) / 0.76;
      return 0.5 + 0.5 * (1 - Math.pow(1 - openProgress, 3));
    }

    if (!isAssetsSchemeTwo()) {
      return progress;
    }

    if (progress < 0.42) {
      return 0.82 * (1 - Math.pow(1 - progress / 0.42, 3));
    }

    const settleProgress = (progress - 0.42) / 0.58;
    return 0.82 + 0.18 * (1 - Math.pow(1 - settleProgress, 2));
  }

  function openAngleOvershootAmount(progress) {
    if (isAssetsSchemeThree()) {
      const clamped = Math.max(0, Math.min(1, progress - 1));
      if (clamped < 0.5) return 0;

      const reboundProgress = (clamped - 0.5) / 0.5;
      return Math.sin(Math.PI * reboundProgress) * 0.56;
    }

    if (!isAssetsSchemeTwo()) return 0;
    const segmentProgress = progress < 1 ? progress : progress - 1;
    const clamped = Math.max(0, Math.min(1, segmentProgress));
    const settleStart = 0.58;
    if (clamped < settleStart) return 0;

    const settleProgress = (clamped - settleStart) / (1 - settleStart);
    const angleRebound = Math.sin(Math.PI * settleProgress);
    const activeBias = progress > 1 ? 0.74 : 0.96;
    return angleRebound * activeBias;
  }

  function smoothstep(edge0, edge1, value) {
    const progress = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
    return progress * progress * (3 - 2 * progress);
  }

  function rangeMask(value, min, max, fade) {
    return smoothstep(min, min + fade, value) * (1 - smoothstep(max - fade, max, value));
  }

  function applyOpenAngleOvershoot(points, amount, layer) {
    if (amount <= 0) return points;

    return points.map((point) => {
      if (layer === "back") {
        const openingMask = rangeMask(point.x, 2.2, 8.8, 2.4) * rangeMask(point.y, 4.2, 15.6, 3);
        if (openingMask <= 0) return point;

        const upperEdge = 1 - smoothstep(10.2, 15.2, point.y);
        return {
          x: point.x - amount * openingMask * (0.42 + upperEdge * 0.52),
          y: point.y - amount * openingMask * upperEdge * 0.82,
        };
      }

      const openingMask = rangeMask(point.x, 3.8, 10.4, 2.4) * rangeMask(point.y, 9.2, 17.8, 3.2);
      if (openingMask <= 0) return point;

      const topEdge = 1 - smoothstep(12.6, 17.6, point.y);

      return {
        x: point.x - amount * openingMask * (0.32 + topEdge * 0.46),
        y: point.y + amount * openingMask * topEdge * 1.04,
      };
    });
  }

  const assetsMorphPoints = (() => {
    if (!assetsSvg || !assetsMorphBack || !assetsActiveCutout || !assetsMorphFront) return null;

    const backDefault = normalizeClosedMorphPoints(sampleAssetsPath(assetsDefaultPaths.back, 160));
    const backHover = normalizeClosedMorphPoints(sampleAssetsPath(assetsHoverPaths.back, 160), backDefault);
    const frontDefault = sampleAssetsPath(assetsDefaultPaths.front, 96);
    const frontHover = alignMorphPoints(frontDefault, sampleAssetsPath(assetsHoverPaths.front, 96));
    const frontActive = alignMorphPoints(frontHover, sampleAssetsPath(assetsActivePaths.front, 96));
    const schemeThreeBackDefault = normalizeClosedMorphPoints(sampleAssetsPath(assetsSchemeThreeDefaultPaths.back, 160));
    const schemeThreeBackActive = normalizeClosedMorphPoints(
      sampleAssetsPath(assetsActivePaths.back, 160),
      schemeThreeBackDefault
    );
    const schemeThreeFrontDefault = sampleAssetsPath(assetsSchemeThreeDefaultPaths.front, 96);
    const schemeThreeFrontActive = alignMorphPoints(
      schemeThreeFrontDefault,
      sampleAssetsPath(assetsActivePaths.front, 96)
    );

    return {
      backDefault,
      backHover,
      frontDefault,
      frontHover,
      frontActive,
      schemeThreeBackDefault,
      schemeThreeBackActive,
      schemeThreeFrontDefault,
      schemeThreeFrontActive,
    };
  })();

  function renderSchemeThreeAssetsMorph(progress) {
    if (progress <= 0) {
      setSchemeThreeDefaultLayerOpacity(1);
      setAssetsMorphLayerOpacity(0);
      setAssetsBackPaint({ filled: false });
      setAssetsFrontPaint({ filled: false });
      assetsMorphBack.setAttribute("d", assetsSchemeThreeDefaultPaths.back);
      assetsMorphFront.setAttribute("d", assetsSchemeThreeDefaultPaths.front);
      assetsActiveCutout.setAttribute("fill-opacity", "0");
      assetsMorphFront.setAttribute("fill-opacity", "0");
      assetsMorphProgress = 0;
      return;
    }

    if (progress >= 2) {
      setSchemeThreeDefaultLayerOpacity(0);
      setAssetsMorphLayerOpacity(1);
      setAssetsBackPaint({ filled: true });
      setAssetsFrontPaint({ filled: true });
      assetsMorphBack.setAttribute("d", assetsActivePaths.back);
      assetsMorphFront.setAttribute("d", assetsActivePaths.front);
      assetsActiveCutout.setAttribute("fill-opacity", "1");
      assetsMorphFront.setAttribute("fill-opacity", "1");
      assetsMorphProgress = 2;
      return;
    }

    if (progress < 1) {
      const darkenProgress = smoothstep(0, 1, progress);
      setSchemeThreeDefaultLayerOpacity(1 - darkenProgress);
      setAssetsMorphLayerOpacity(darkenProgress);
      setAssetsBackPaint({ filled: true });
      setAssetsFrontPaint({ filled: true });
      assetsMorphBack.setAttribute("d", assetsSchemeThreeDefaultPaths.back);
      assetsMorphFront.setAttribute("d", assetsSchemeThreeDefaultPaths.front);
      assetsActiveCutout.setAttribute("fill-opacity", "0");
      assetsMorphFront.setAttribute("fill-opacity", "1");
      assetsMorphProgress = progress;
      return;
    }

    const openProgress = easeAssetsMorph(Math.max(0, Math.min(1, progress - 1)));
    setSchemeThreeDefaultLayerOpacity(0);
    setAssetsMorphLayerOpacity(1);
    setAssetsBackPaint({ filled: true });
    setAssetsFrontPaint({ filled: true });
    const backPoints = interpolatePoints(
      assetsMorphPoints.schemeThreeBackDefault,
      assetsMorphPoints.schemeThreeBackActive,
      openProgress
    );
    const frontPoints = interpolatePoints(
      assetsMorphPoints.schemeThreeFrontDefault,
      assetsMorphPoints.schemeThreeFrontActive,
      openProgress
    );

    const overshootAmount = openAngleOvershootAmount(progress);
    assetsMorphBack.setAttribute("d", pointsToPath(applyOpenAngleOvershoot(backPoints, overshootAmount, "back"), true));
    assetsMorphFront.setAttribute("d", pointsToPath(applyOpenAngleOvershoot(frontPoints, overshootAmount, "front"), true));
    assetsActiveCutout.setAttribute("fill-opacity", "1");
    assetsMorphFront.setAttribute("fill-opacity", "1");
    assetsMorphProgress = progress;
  }

  function renderAssetsMorph(progress) {
    if (!assetsMorphPoints) return;
    if (isAssetsSchemeThree()) {
      renderSchemeThreeAssetsMorph(progress);
      return;
    }
    setSchemeThreeDefaultLayerOpacity(0);
    setAssetsMorphLayerOpacity(1);
    setAssetsBackPaint({ filled: true });
    setAssetsFrontPaint({ filled: true });
    const instantActiveFill = isAssetsSchemeThree() && assetsNavItem.classList.contains("active");

    if (progress <= 0) {
      assetsMorphBack.setAttribute("d", assetsDefaultPaths.back);
      assetsMorphFront.setAttribute("d", assetsDefaultPaths.front);
      assetsActiveCutout.setAttribute("fill-opacity", instantActiveFill ? "1" : "0");
      assetsMorphFront.setAttribute("fill-opacity", instantActiveFill ? "1" : "0");
      assetsMorphProgress = 0;
      return;
    }
    if (progress === 1) {
      assetsMorphBack.setAttribute("d", assetsHoverPaths.back);
      assetsMorphFront.setAttribute("d", assetsHoverPaths.front);
      assetsActiveCutout.setAttribute("fill-opacity", instantActiveFill ? "1" : "0");
      assetsMorphFront.setAttribute("fill-opacity", instantActiveFill ? "1" : "0");
      assetsMorphProgress = 1;
      return;
    }
    if (progress >= 2) {
      assetsMorphBack.setAttribute("d", assetsActivePaths.back);
      assetsMorphFront.setAttribute("d", assetsActivePaths.front);
      assetsActiveCutout.setAttribute("fill-opacity", "1");
      assetsMorphFront.setAttribute("fill-opacity", "1");
      assetsMorphProgress = 2;
      return;
    }
    const fromFront = progress < 1 ? assetsMorphPoints.frontDefault : assetsMorphPoints.frontHover;
    const toFront = progress < 1 ? assetsMorphPoints.frontHover : assetsMorphPoints.frontActive;
    const segmentProgress = progress < 1 ? progress : progress - 1;
    const fillProgress = Math.max(0, progress - 1);
    const overshootAmount = openAngleOvershootAmount(progress);

    if (progress < 1) {
      const backPoints = interpolatePoints(
        assetsMorphPoints.backDefault,
        assetsMorphPoints.backHover,
        easeAssetsMorph(segmentProgress)
      );
      assetsMorphBack.setAttribute(
        "d",
        pointsToPath(applyOpenAngleOvershoot(backPoints, overshootAmount, "back"), true)
      );
    } else {
      assetsMorphBack.setAttribute("d", assetsActivePaths.back);
    }
    const frontPoints = interpolatePoints(fromFront, toFront, easeAssetsMorph(segmentProgress));
    assetsMorphFront.setAttribute(
      "d",
      pointsToPath(applyOpenAngleOvershoot(frontPoints, overshootAmount, "front"), true)
    );
    const activeFillOpacity = instantActiveFill ? 1 : easeAssetsMorph(fillProgress);
    assetsActiveCutout.setAttribute("fill-opacity", String(activeFillOpacity));
    assetsMorphFront.setAttribute("fill-opacity", String(activeFillOpacity));
    assetsMorphProgress = progress;
  }

  function animateAssetsMorph(target) {
    if (!assetsMorphPoints) return;
    window.cancelAnimationFrame(assetsMorphFrame);

    if (reducedMotion) {
      renderAssetsMorph(target);
      return;
    }

    const start = assetsMorphProgress;
    const distance = target - start;
    const duration = isAssetsSchemeTwo() ? 560 : isAssetsSchemeThree() ? 520 : 360;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      renderAssetsMorph(start + distance * easeAssetsMotionProgress(progress));
      if (progress < 1) {
        assetsMorphFrame = window.requestAnimationFrame(tick);
      }
    };

    assetsMorphFrame = window.requestAnimationFrame(tick);
  }

  assetsNavItem.addEventListener("pointerenter", () => {
    assetsNavItem.classList.add("is-hovering");
    if (isAssetsSchemeThree()) return;
    animateAssetsMorph(assetsNavItem.classList.contains("active") ? 2 : 1);
  });

  assetsNavItem.addEventListener("pointerleave", () => {
    assetsNavItem.classList.remove("is-hovering");
    if (isAssetsSchemeThree()) return;
    animateAssetsMorph(assetsNavItem.classList.contains("active") ? 2 : 0);
  });

  assetsNavItem.addEventListener("click", () => {
    if (isAssetsSchemeThree()) {
      window.cancelAnimationFrame(assetsMorphFrame);
      setSchemeThreeDefaultLayerOpacity(1);
      setAssetsMorphLayerOpacity(0);
      renderSchemeThreeAssetsMorph(0);
    }
    animateAssetsMorph(2);
  });

  primaryNavItems.forEach((item) => {
    if (item === assetsNavItem) return;
    item.addEventListener("click", () => {
      if (isAssetsSchemeThree()) {
        window.cancelAnimationFrame(assetsMorphFrame);
        renderSchemeThreeAssetsMorph(0);
        return;
      }
      animateAssetsMorph(0);
    });
  });

  schemeOptions.forEach((option) => {
    option.addEventListener("click", () => {
      window.requestAnimationFrame(() => {
        renderAssetsMorph(assetsNavItem.classList.contains("active") ? 2 : 0);
      });
    });
  });
}

if (schemeSwitch && schemeOptions.length > 0) {
  const setAssetsScheme = (scheme) => {
    schemeSwitch.dataset.activeScheme = scheme;
    document.documentElement.dataset.assetsScheme = scheme;

    schemeOptions.forEach((option) => {
      const selected = option.dataset.assetsScheme === scheme;
      option.classList.toggle("active", selected);
      option.setAttribute("aria-selected", String(selected));
    });
  };

  schemeOptions.forEach((option) => {
    option.addEventListener("click", () => {
      setAssetsScheme(option.dataset.assetsScheme);
    });
  });

  setAssetsScheme("scheme-3");
}

function getPromptEditor(input) {
  return input?.promptEditor ?? null;
}

function rangeBelongsToEditor(range, editor) {
  return Boolean(range && editor && editor.contains(range.commonAncestorContainer));
}

function savePromptEditorRange(editor) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (rangeBelongsToEditor(range, editor)) {
    promptEditorRanges.set(editor, range.cloneRange());
  }
}

function placeCaretAtEditorEnd(editor) {
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);

  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  promptEditorRanges.set(editor, range.cloneRange());
}

function restorePromptEditorRange(editor) {
  const selection = window.getSelection();
  const savedRange = promptEditorRanges.get(editor);

  if (selection && rangeBelongsToEditor(savedRange, editor)) {
    selection.removeAllRanges();
    selection.addRange(savedRange);
    return savedRange;
  }

  placeCaretAtEditorEnd(editor);
  return window.getSelection()?.rangeCount ? window.getSelection().getRangeAt(0) : null;
}

function createSkillToken(skillName) {
  const token = document.createElement("span");
  token.className = "selected-skill-token";
  token.contentEditable = "false";
  token.dataset.skillName = skillName;
  token.textContent = skillName;
  return token;
}

function insertSkillToken(editor, skillName) {
  editor.focus();
  const range = restorePromptEditorRange(editor);
  if (!range) return;

  range.deleteContents();
  const token = createSkillToken(skillName);
  range.insertNode(token);
  range.setStartAfter(token);
  range.collapse(true);

  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  promptEditorRanges.set(editor, range.cloneRange());
}

function getEditorTextValue(editor) {
  return Array.from(editor.childNodes)
    .map((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.classList?.contains("selected-skill-token")) {
        return node.dataset.skillName || node.textContent || "";
      }
      return node.textContent || "";
    })
    .join("");
}

function syncEditorToInput(editor, input) {
  const prompt = input.closest(".prompt-wrap, .canvas-prompt");
  if (!editor) {
    input.value = "";
    prompt?.classList.remove("has-selected-skill");
    updateComposerInputState(input);
    return;
  }
  input.value = getEditorTextValue(editor).trim();
  prompt?.classList.toggle("has-selected-skill", Boolean(editor.querySelector(".selected-skill-token")));
  updateComposerInputState(input);
}

function findEditableSibling(node, direction) {
  let current = node;
  while (current) {
    if (current.nodeType === Node.TEXT_NODE && current.textContent.length === 0) {
      current = direction === "previous" ? current.previousSibling : current.nextSibling;
      continue;
    }
    return current;
  }
  return null;
}

function getAdjacentNodeFromRange(range, editor, direction) {
  const container = range.startContainer;
  const offset = range.startOffset;

  if (container === editor) {
    return direction === "previous"
      ? findEditableSibling(editor.childNodes[offset - 1], direction)
      : findEditableSibling(editor.childNodes[offset], direction);
  }

  if (container.nodeType === Node.TEXT_NODE) {
    if (direction === "previous" && offset > 0) return null;
    if (direction === "next" && offset < container.textContent.length) return null;

    return direction === "previous"
      ? findEditableSibling(container.previousSibling, direction)
      : findEditableSibling(container.nextSibling, direction);
  }

  return direction === "previous"
    ? findEditableSibling(container.childNodes[offset - 1] || container.previousSibling, direction)
    : findEditableSibling(container.childNodes[offset] || container.nextSibling, direction);
}

function removeAdjacentSkillToken(event, editor, input) {
  if (event.key !== "Backspace" && event.key !== "Delete") return false;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return false;

  const range = selection.getRangeAt(0);
  if (!rangeBelongsToEditor(range, editor)) return false;

  const adjacentNode = getAdjacentNodeFromRange(
    range,
    editor,
    event.key === "Backspace" ? "previous" : "next"
  );

  if (!(adjacentNode instanceof HTMLElement) || !adjacentNode.classList.contains("selected-skill-token")) {
    return false;
  }

  event.preventDefault();
  const nextRange = document.createRange();
  if (event.key === "Backspace") {
    nextRange.setStartBefore(adjacentNode);
  } else {
    nextRange.setStartAfter(adjacentNode);
  }
  nextRange.collapse(true);
  adjacentNode.remove();

  selection.removeAllRanges();
  selection.addRange(nextRange);
  promptEditorRanges.set(editor, nextRange.cloneRange());
  syncEditorToInput(editor, input);
  return true;
}

function setupPromptEditor(input) {
  const prompt = input.closest(".prompt-wrap, .canvas-prompt");
  if (!prompt || input.promptEditor) return;

  const editor = document.createElement("div");
  editor.className = "prompt-editor";
  editor.contentEditable = "true";
  editor.setAttribute("role", "textbox");
  editor.setAttribute("aria-label", input.getAttribute("aria-label") || "Prompt");
  editor.spellcheck = true;
  prompt.classList.add("has-editor");
  input.promptEditor = editor;
  prompt.appendChild(editor);

  editor.addEventListener("focus", () => {
    composerShell.classList.add("is-input-active");
    triggerComposerBorderOrbit();
    savePromptEditorRange(editor);
  });

  editor.addEventListener("input", () => {
    savePromptEditorRange(editor);
    syncEditorToInput(editor, input);
  });

  editor.addEventListener("keyup", () => savePromptEditorRange(editor));
  editor.addEventListener("mouseup", () => savePromptEditorRange(editor));

  editor.addEventListener("keydown", (event) => {
    if (removeAdjacentSkillToken(event, editor, input)) return;
    window.requestAnimationFrame(() => {
      savePromptEditorRange(editor);
      syncEditorToInput(editor, input);
    });
  });

  editor.addEventListener("blur", () => {
    savePromptEditorRange(editor);
    composerShell.classList.remove("is-input-active");
    cancelComposerBorderOrbit();
  });
}

function clearSelectedSkill(prompt, input) {
  const editor = getPromptEditor(input);
  if (!prompt || !input) return;

  editor?.querySelectorAll(".selected-skill-token").forEach((token) => token.remove());
  prompt.classList.remove("has-selected-skill");
  composerShell.classList.remove("has-selected-skill");
  delete prompt.dataset.selectedSkill;
  prompt.style.removeProperty("--skill-token-width");
  syncEditorToInput(editor, input);
  updateComposerInputState(input);
}

function updateComposerInputState(input) {
  const prompt = input.closest(".prompt-wrap, .canvas-prompt");
  const sendButton = input.closest(".composer-mode")?.querySelector(".send");
  const editor = getPromptEditor(input);
  const hasValue = editor
    ? Array.from(editor.childNodes).some((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.classList?.contains("selected-skill-token")) {
          return false;
        }
        return (node.textContent || "").trim().length > 0;
      })
    : input.value.trim().length > 0;
  const hasSelectedSkill = editor
    ? Boolean(editor.querySelector(".selected-skill-token"))
    : Boolean(prompt?.classList.contains("has-selected-skill"));
  const hasContent = hasValue || hasSelectedSkill;

  prompt?.classList.toggle("has-user-input", hasValue);
  prompt?.classList.toggle("has-selected-skill", hasSelectedSkill);
  composerShell?.classList.toggle("has-selected-skill", hasSelectedSkill);
  sendButton?.classList.toggle("is-ready", hasContent);
  if (sendButton) {
    sendButton.disabled = !hasContent;
  }
}

function triggerComposerBorderOrbit() {
  if (!composerShell) return;
  if (document.documentElement.dataset.theme === "dark") {
    composerShell.classList.remove("is-border-orbiting");
    composerShell.style.setProperty("--composer-orbit", "0");
    return;
  }

  if (composerOrbitFrame) {
    window.cancelAnimationFrame(composerOrbitFrame);
    composerOrbitFrame = null;
  }

  const duration = 10000;
  const circumference = 1000;
  const startedAt = performance.now();

  composerShell.style.setProperty("--composer-orbit", "0");
  composerShell.classList.add("is-border-orbiting");

  const animateOrbit = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    composerShell.style.setProperty(
      "--composer-orbit",
      String(progress * circumference)
    );

    if (progress < 1) {
      composerOrbitFrame = window.requestAnimationFrame(animateOrbit);
      return;
    }

    composerShell.style.setProperty("--composer-orbit", "0");
    composerShell.classList.remove("is-border-orbiting");
    composerOrbitFrame = null;
  };

  composerOrbitFrame = window.requestAnimationFrame(animateOrbit);
}

function cancelComposerBorderOrbit() {
  if (composerOrbitFrame) {
    window.cancelAnimationFrame(composerOrbitFrame);
    composerOrbitFrame = null;
  }

  composerShell?.style.setProperty("--composer-orbit", "0");
  composerShell?.classList.remove("is-border-orbiting");
}

composerInputs.forEach((input) => {
  if (input.tagName === "TEXTAREA") {
    setupPromptEditor(input);
  }

  const updateInputState = () => updateComposerInputState(input);

  input.addEventListener("focus", () => {
    const editor = getPromptEditor(input);
    if (editor) {
      editor.focus();
      return;
    }
    composerShell.classList.add("is-input-active");
    triggerComposerBorderOrbit();
  });

  input.addEventListener("input", () => {
    updateInputState();
  });

  input.addEventListener("keydown", (event) => {
    const prompt = input.closest(".prompt-wrap, .canvas-prompt");
    const cursorAtStart = input.selectionStart === 0 && input.selectionEnd === 0;
    if (event.key === "Backspace" && prompt?.classList.contains("has-selected-skill") && cursorAtStart) {
      event.preventDefault();
      clearSelectedSkill(prompt, input);
    }
  });

  input.addEventListener("blur", () => {
    composerShell.classList.remove("is-input-active");
    cancelComposerBorderOrbit();
  });

  updateInputState();
});

function resetHoverVideo(item) {
  const { video } = item;
  video.pause();
  try {
    video.currentTime = 0;
    if (video.dataset.resetMode === "poster") {
      video.load();
    }
  } catch {
    // Some browsers block seeking before metadata is ready; poster still covers the default state.
  }
}

function resetAllHoverVideos(exceptThumb = null) {
  hoverVideoItems.forEach((item) => {
    if (item.thumb !== exceptThumb) resetHoverVideo(item);
  });
}

hoverVideoItems.forEach((item) => {
  const { thumb, video } = item;

  const playPreview = () => {
    resetAllHoverVideos(thumb);
    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => resetHoverVideo(item));
    }
  };

  const resetPreview = () => resetHoverVideo(item);

  thumb.addEventListener("pointerenter", playPreview);
  thumb.addEventListener("pointerleave", resetPreview);
  thumb.addEventListener("mouseleave", resetPreview);
  thumb.addEventListener("blur", resetPreview, true);
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) resetAllHoverVideos();
});
