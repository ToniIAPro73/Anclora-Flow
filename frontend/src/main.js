import "./styles/colors.css";
import renderApp from "./pages/index.js";
import renderLogin from "./pages/login.js";
import renderDashboard from "./pages/dashboard.js";
import renderInvoices from "./pages/invoices.js";
import renderExpenses from "./pages/expenses.js";
import renderClients from "./pages/clients.js";
import renderSubscriptions from "./pages/subscriptions.js";
import renderBudget from "./pages/budget.js";
import renderCalendar from "./pages/calendar.js";
import renderReports from "./pages/reports.js";
import renderAssistant from "./pages/assistant.js";
import renderSettings from "./pages/settings.js";

const routes = {
  "/dashboard": renderDashboard,
  "/invoices": renderInvoices,
  "/expenses": renderExpenses,
  "/clients": renderClients,
  "/subscriptions": renderSubscriptions,
  "/budget": renderBudget,
  "/calendar": renderCalendar,
  "/reports": renderReports,
  "/assistant": renderAssistant,
  "/settings": renderSettings
};

const demoUser = {
  name: "Demo",
  email: "demo@demo.com",
  avatar: "",
  authProvider: "local"
};

const STORAGE_KEYS = {
  theme: "anclora-theme",
  language: "anclora-language"
};

const root = document.documentElement;
let themeButtonsCache = [];
let langButtonsCache = [];
let preferencesInitialized = false;
let userMenuInitialized = false;

function getDefaultTheme() {
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

let currentTheme = localStorage.getItem(STORAGE_KEYS.theme) || getDefaultTheme();
let currentLanguage = localStorage.getItem(STORAGE_KEYS.language) || "es";

function updateToggleState(buttons = [], datasetKey, value) {
  buttons.forEach((button) => {
    const isActive = button.dataset[datasetKey] === value;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function applyTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";
  if (currentTheme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme");
  }
  updateToggleState(themeButtonsCache, "theme", currentTheme);
}

function applyLanguage(lang) {
  currentLanguage = lang === "en" ? "en" : "es";
  root.setAttribute("lang", currentLanguage);
  updateToggleState(langButtonsCache, "lang", currentLanguage);
}

applyTheme(currentTheme);
applyLanguage(currentLanguage);

function initPreferencesControls() {
  const themeButtons = Array.from(document.querySelectorAll(".theme-switch__btn"));
  const langButtons = Array.from(document.querySelectorAll(".lang-switch__btn"));

  if (!themeButtons.length || !langButtons.length) {
    return;
  }

  themeButtonsCache = themeButtons;
  langButtonsCache = langButtons;

  if (!preferencesInitialized) {
    themeButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        const targetTheme = event.currentTarget.dataset.theme;
        if (!targetTheme || targetTheme === currentTheme) {
          return;
        }
        applyTheme(targetTheme);
        localStorage.setItem(STORAGE_KEYS.theme, currentTheme);
      });
    });

    langButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        const targetLang = event.currentTarget.dataset.lang;
        if (!targetLang || targetLang === currentLanguage) {
          return;
        }
        applyLanguage(targetLang);
        localStorage.setItem(STORAGE_KEYS.language, currentLanguage);
      });
    });

    preferencesInitialized = true;
  }

  updateToggleState(themeButtonsCache, "theme", currentTheme);
  updateToggleState(langButtonsCache, "lang", currentLanguage);
}

function initUserMenu() {
  const menu = document.querySelector(".user-menu");
  if (!menu) {
    return;
  }

  const trigger = menu.querySelector(".user-chip");
  const dropdown = menu.querySelector(".dropdown");
  if (!trigger || !dropdown) {
    return;
  }

  const closeMenu = () => {
    menu.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  };

  if (!userMenuInitialized) {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const willOpen = !menu.classList.contains("is-open");
      if (willOpen) {
        menu.classList.add("is-open");
      } else {
        menu.classList.remove("is-open");
      }
      trigger.setAttribute("aria-expanded", String(willOpen));
    });

    document.addEventListener("click", (event) => {
      if (!menu.contains(event.target)) {
        closeMenu();
      }
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
        trigger.blur();
      }
    });

    userMenuInitialized = true;
  }
}

function initShellInteractions() {
  initPreferencesControls();
  initUserMenu();
}

if (window.matchMedia) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = (event) => {
    if (localStorage.getItem(STORAGE_KEYS.theme)) {
      return;
    }
    applyTheme(event.matches ? "dark" : "light");
    initPreferencesControls();
  };

  if (media.addEventListener) {
    media.addEventListener("change", handleChange);
  } else if (media.addListener) {
    media.addListener(handleChange);
  }
}

function ensureShell() {
  if (!document.getElementById("page-content")) {
    document.body.innerHTML = renderApp(demoUser);
  }
}

function navigate() {
  const rawHash = window.location.hash || "";
  const hash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
  const targetRoute = hash || "/dashboard";

  if (targetRoute === "/login") {
    document.body.innerHTML = renderLogin();
    return;
  }

  ensureShell();
  initShellInteractions();

  const pageRenderer = routes[targetRoute] || renderDashboard;
  const container = document.getElementById("page-content");
  if (container) {
    container.innerHTML = pageRenderer(demoUser);
  }
}

window.addEventListener("hashchange", navigate);
document.addEventListener("DOMContentLoaded", navigate);
