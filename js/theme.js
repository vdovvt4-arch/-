// ============================================================
// طبيّة — theme.js
// Shared dark/light mode toggle for every page.
// The initial theme is already applied by an inline script in
// <head> (before first paint, to avoid a flash of the wrong
// theme) — this file only wires up the toggle button(s) and
// keeps the choice in localStorage.
// ============================================================
(function () {
  const STORAGE_KEY = "tibbiya-theme";
  const SITE_STORAGE_KEY = "tibbiya_site_settings";
  const AVAILABLE_THEMES = ["light", "dark", "blue", "blue-dark"];

  function defaultSiteSettings() {
    return {
      siteTitle: "طبيّة",
      primaryColor: "#14304A",
      footerText: "© 2026 طبيّة — جميع الحقوق محفوظة",
      telegramLink: "https://t.me/FordeReter",
      whatsappLink: "https://wa.me/201069821311",
      logoUrl: "",
      themeMode: "light"
    };
  }

  function readSiteSettings() {
    try {
      const raw = localStorage.getItem(SITE_STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      return { ...defaultSiteSettings(), ...saved };
    } catch (e) {
      return defaultSiteSettings();
    }
  }

  function applySiteSettings() {
    const settings = readSiteSettings();
    const root = document.documentElement;

    root.style.setProperty("--primary", settings.primaryColor || "#14304A");
    root.style.setProperty("--accent", settings.primaryColor || "#14304A");
    document.title = settings.siteTitle ? `${settings.siteTitle} | طبيّة` : document.title;

    document.querySelectorAll("[data-site-title]").forEach((node) => {
      node.textContent = settings.siteTitle || "طبيّة";
    });

    const brandImage = document.querySelector("[data-site-logo]");
    if (brandImage) {
      brandImage.src = settings.logoUrl || brandImage.getAttribute("data-default-src") || "assets/brand-popup.jpg";
    }

    const footerNodes = document.querySelectorAll("[data-site-footer]");
    footerNodes.forEach((node) => {
      node.textContent = settings.footerText || "© 2026 طبيّة — جميع الحقوق محفوظة";
    });

    const telegramLinks = document.querySelectorAll("[data-site-telegram]");
    telegramLinks.forEach((node) => {
      node.href = settings.telegramLink || "https://t.me/FordeReter";
    });

    const whatsappLinks = document.querySelectorAll("[data-site-whatsapp]");
    whatsappLinks.forEach((node) => {
      node.href = settings.whatsappLink || "https://wa.me/201069821311";
    });

    const mainTheme = AVAILABLE_THEMES.includes(settings.themeMode) ? settings.themeMode : "light";
    root.setAttribute("data-theme", mainTheme);
    localStorage.setItem(STORAGE_KEY, mainTheme);
    paintButtons();
  }

  function currentTheme() {
    const theme = document.documentElement.getAttribute("data-theme");
    return AVAILABLE_THEMES.includes(theme) ? theme : "light";
  }

  function paintButtons() {
    const theme = currentTheme();
    const labels = {
      light: "🌙",
      dark: "☀️",
      blue: "🔵",
      "blue-dark": "🌙"
    };
    document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
      btn.textContent = labels[theme] || "🌙";
      btn.setAttribute("aria-label", "تبديل النمط");
    });
  }

  function setTheme(theme) {
    if (!AVAILABLE_THEMES.includes(theme)) theme = "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    const site = readSiteSettings();
    const nextSite = { ...site, themeMode: theme };
    localStorage.setItem(SITE_STORAGE_KEY, JSON.stringify(nextSite));
    if (window.Api && typeof window.Api.saveSiteSettings === "function") {
      window.Api.saveSiteSettings(nextSite).catch(() => {});
    }
    paintButtons();
  }

  function toggleTheme() {
    const current = currentTheme();
    const index = AVAILABLE_THEMES.indexOf(current);
    const nextIndex = (index + 1) % AVAILABLE_THEMES.length;
    setTheme(AVAILABLE_THEMES[nextIndex]);
  }

  function init() {
    applySiteSettings();
    paintButtons();
    document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
      btn.addEventListener("click", toggleTheme);
    });
  }

  // Export for use in settings page
  window.ThemeManager = {
    setTheme,
    currentTheme,
    getAvailableThemes: () => AVAILABLE_THEMES
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
