import "./styles/colors.css";
import renderApp from "./pages/index.js";
import renderLogin from "./pages/login.js";
import renderDashboard from "./pages/dashboard.js";
import renderInvoices from "./pages/invoices.js";
import renderExpenses, { initExpenses } from "./pages/expenses.js";
import renderClients, { initClients } from "./pages/clients.js";
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
  language: "anclora-language",
  sidebar: "anclora-sidebar"
};

const root = document.documentElement;
let themeButtonsCache = [];
let langButtonsCache = [];
let preferencesInitialized = false;
let userMenuInitialized = false;
const SIDEBAR_STATE = {
  COLLAPSED: "collapsed",
  EXPANDED: "expanded"
};
const SIDEBAR_BREAKPOINT = 960;
const sidebarMedia = window.matchMedia(`(max-width: ${SIDEBAR_BREAKPOINT}px)`);

function getInitialSidebarPreference() {
  const stored = localStorage.getItem(STORAGE_KEYS.sidebar);
  if (stored === SIDEBAR_STATE.COLLAPSED) {
    return true;
  }
  if (stored === SIDEBAR_STATE.EXPANDED) {
    return false;
  }
  return window.matchMedia("(max-width: 1280px)").matches;
}

let preferredDesktopSidebarCollapsed = getInitialSidebarPreference();
let isSidebarCollapsed = preferredDesktopSidebarCollapsed;
let shellHydrated = false;
let sidebarGlobalHandlersBound = false;
const modalFocusableSelectors =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
let invoiceModalLastFocus = null;
let isInvoiceModalOpen = false;

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

function getInvoiceModalElement() {
  return document.getElementById("invoice-modal");
}

function trapInvoiceModalFocus(event) {
  if (event.key !== "Tab") {
    return;
  }

  const modal = getInvoiceModalElement();
  if (!modal) {
    return;
  }

  const focusable = Array.from(modal.querySelectorAll(modalFocusableSelectors)).filter(
    (node) => !node.hasAttribute("disabled") && node.getAttribute("tabindex") !== "-1"
  );

  if (!focusable.length) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const isShiftPressed = event.shiftKey;
  const active = document.activeElement;

  if (!isShiftPressed && active === last) {
    event.preventDefault();
    first.focus();
  } else if (isShiftPressed && active === first) {
    event.preventDefault();
    last.focus();
  }
}

function closeInvoiceModal() {
  const modal = getInvoiceModalElement();
  if (!modal || !isInvoiceModalOpen) {
    return;
  }

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-lock-scroll");
  isInvoiceModalOpen = false;

  modal.removeEventListener("keydown", handleInvoiceModalKeydown);

  if (invoiceModalLastFocus && typeof invoiceModalLastFocus.focus === "function") {
    invoiceModalLastFocus.focus();
  }
  invoiceModalLastFocus = null;
}

function handleInvoiceModalKeydown(event) {
  if (event.key === "Escape" && !event.defaultPrevented) {
    event.preventDefault();
    closeInvoiceModal();
    return;
  }
  trapInvoiceModalFocus(event);
}

function openInvoiceModal() {
  const modal = getInvoiceModalElement();
  if (!modal) {
    return;
  }

  invoiceModalLastFocus = document.activeElement;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-lock-scroll");
  isInvoiceModalOpen = true;

  modal.addEventListener("keydown", handleInvoiceModalKeydown);

  const focusable = Array.from(modal.querySelectorAll(modalFocusableSelectors)).filter(
    (node) => !node.hasAttribute("disabled") && node.getAttribute("tabindex") !== "-1"
  );
  const firstFocusable = focusable[0];
  if (firstFocusable) {
    window.requestAnimationFrame(() => {
      firstFocusable.focus();
    });
  }
}

function initInvoiceModalElements() {
  const modal = getInvoiceModalElement();
  if (!modal || modal.dataset.modalReady === "true") {
    return;
  }

  const dismiss = modal.querySelector("[data-modal-dismiss]");
  const closeButtons = modal.querySelectorAll("[data-modal-close]");
  const form = modal.querySelector("form");

  if (dismiss) {
    dismiss.addEventListener("click", () => closeInvoiceModal());
  }

  closeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      closeInvoiceModal();
    });
  });

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      closeInvoiceModal();
    });
  }

  modal.dataset.modalReady = "true";
}

function applySidebarState(collapsed, options = {}) {
  const shell = document.querySelector(".app-shell");
  isSidebarCollapsed = collapsed;

  if (!shell) {
    return;
  }

  const sidebar = shell.querySelector(".app-sidebar");
  const toggles = shell.querySelectorAll("[data-sidebar-trigger]");
  const isMobile = sidebarMedia.matches;
  const shouldPersist = options.persist ?? !isMobile;

  if (isMobile) {
    shell.classList.toggle("is-sidebar-open", !collapsed);
    shell.classList.remove("is-collapsed");
    document.body.classList.toggle("is-lock-scroll", !collapsed);
  } else {
    shell.classList.toggle("is-collapsed", collapsed);
    shell.classList.remove("is-sidebar-open");
    document.body.classList.remove("is-lock-scroll");
  }

  if (sidebar) {
    sidebar.setAttribute("data-state", collapsed ? "collapsed" : "expanded");
  }

  toggles.forEach((toggle) => {
    const expanded = !collapsed;
    const label = expanded ? "Contraer la navegacion" : "Expandir la navegacion";
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("title", label);
  });

  if (shouldPersist) {
    preferredDesktopSidebarCollapsed = collapsed;
    localStorage.setItem(
      STORAGE_KEYS.sidebar,
      collapsed ? SIDEBAR_STATE.COLLAPSED : SIDEBAR_STATE.EXPANDED
    );
  }
}

function handleSidebarGlobalClick(event) {
  if (!sidebarMedia.matches) {
    return;
  }

  const shell = document.querySelector(".app-shell");
  const sidebar = shell?.querySelector(".app-sidebar");
  if (!shell || !sidebar) {
    return;
  }

  if (sidebar.contains(event.target)) {
    return;
  }

  const toggles = shell.querySelectorAll("[data-sidebar-trigger]");
  for (const toggle of toggles) {
    if (toggle.contains(event.target)) {
      return;
    }
  }

  if (!isSidebarCollapsed) {
    applySidebarState(true, { persist: false });
  }
}

function handleSidebarGlobalKey(event) {
  if (event.key !== "Escape" || event.defaultPrevented || !sidebarMedia.matches) {
    return;
  }

  if (!isSidebarCollapsed) {
    applySidebarState(true, { persist: false });
  }
}

function initSidebarToggle() {
  const shell = document.querySelector(".app-shell");
  if (!shell) {
    return;
  }

  const toggles = Array.from(shell.querySelectorAll("[data-sidebar-trigger]"));
  if (!toggles.length) {
    return;
  }

  toggles.forEach((toggle) => {
    if (toggle.dataset.sidebarReady === "true") {
      return;
    }
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      applySidebarState(!isSidebarCollapsed);
    });
    toggle.dataset.sidebarReady = "true";
  });

  if (!sidebarGlobalHandlersBound) {
    document.addEventListener("click", handleSidebarGlobalClick);
    document.addEventListener("keyup", handleSidebarGlobalKey);
    sidebarGlobalHandlersBound = true;
  }
}

function setActiveNavLink(route) {
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
  const links = document.querySelectorAll(".app-sidebar__link");
  if (!links.length) {
    return;
  }

  links.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const normalizedHref = href.startsWith("#") ? href.slice(1) : href;
    const isActive = normalizedHref === normalizedRoute;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
      link.removeAttribute("tabindex");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function maybeCloseSidebarForMobile() {
  if (!sidebarMedia.matches) {
    return;
  }

  if (!isSidebarCollapsed) {
    applySidebarState(true, { persist: false });
  }
}

function handleSidebarBreakpointChange(event) {
  if (event.matches) {
    applySidebarState(true, { persist: false });
    return;
  }
  applySidebarState(preferredDesktopSidebarCollapsed, { persist: false });
}

function initInvoicesPage(params) {
  initInvoiceModalElements();

  const openers = document.querySelectorAll('[data-modal-open="invoice"]');
  openers.forEach((button) => {
    if (button.dataset.modalTriggerReady === "true") {
      return;
    }
    button.addEventListener("click", (event) => {
      event.preventDefault();
      openInvoiceModal();
    });
    button.dataset.modalTriggerReady = "true";
  });

  const searchInput = document.querySelector("[data-invoices-search]");
  const statusSelect = document.querySelector('[data-invoices-filter="status"]');
  const clientSelect = document.querySelector('[data-invoices-filter="client"]');
  const rows = Array.from(document.querySelectorAll("[data-invoice-row]"));
  const emptyState = document.querySelector(".invoices-table__empty");
  const resultCount = document.querySelector("[data-result-count]");
  const totalInvoices = rows.length;

  const applyFilters = () => {
    const searchTerm = (searchInput?.value || "").trim().toLowerCase();
    const statusFilter = statusSelect?.value || "all";
    const clientFilter = clientSelect?.value || "all";

    let visibleRows = 0;

    rows.forEach((row) => {
      const matchesSearch =
        !searchTerm ||
        row.dataset.number?.includes(searchTerm) ||
        row.dataset.client?.includes(searchTerm);
      const matchesStatus = statusFilter === "all" || row.dataset.status === statusFilter;
      const matchesClient = clientFilter === "all" || row.dataset.client === clientFilter;

      const isVisible = Boolean(matchesSearch && matchesStatus && matchesClient);
      row.hidden = !isVisible;
      if (isVisible) {
        visibleRows += 1;
      }
    });

    if (emptyState) {
      emptyState.hidden = visibleRows !== 0;
    }

    if (resultCount) {
      if (visibleRows === 0) {
        resultCount.textContent = "No se encontraron facturas";
      } else if (visibleRows === totalInvoices) {
        resultCount.textContent = `Mostrando ${visibleRows} de ${totalInvoices} facturas`;
      } else {
        resultCount.textContent = `Mostrando ${visibleRows} de ${totalInvoices} facturas`;
      }
    }
  };

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }
  if (statusSelect) {
    statusSelect.addEventListener("change", applyFilters);
  }
  if (clientSelect) {
    clientSelect.addEventListener("change", applyFilters);
  }

  applyFilters();

  const pendingButton = document.querySelector('[data-feature-pending="add-payment"]');
  if (pendingButton && pendingButton.dataset.pendingBound !== "true") {
    pendingButton.addEventListener("click", (event) => {
      event.preventDefault();
      window.alert("La gestión de cobros estará disponible próximamente.");
    });
    pendingButton.dataset.pendingBound = "true";
  }

  if (params && params.get("open") === "new-invoice") {
    window.requestAnimationFrame(() => {
      openInvoiceModal();
    });
  }
}

function initPage(route, params) {
  switch (route) {
    case "/invoices":
      initInvoicesPage(params);
      break;
    case "/expenses":
      initExpenses();
      break;
    case "/clients":
      initClients();
      break;
    default:
      break;
  }
}

function parseRoute(hash) {
  const safeHash = hash || "/dashboard";
  const [pathPart, queryString = ""] = safeHash.split("?");
  const path = pathPart || "/dashboard";
  let params;
  try {
    params = new URLSearchParams(queryString);
  } catch (_) {
    params = new URLSearchParams();
  }
  return { path, params };
}

function initShellInteractions() {
  initPreferencesControls();
  initUserMenu();
  initSidebarToggle();
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

if (sidebarMedia.addEventListener) {
  sidebarMedia.addEventListener("change", handleSidebarBreakpointChange);
} else if (sidebarMedia.addListener) {
  sidebarMedia.addListener(handleSidebarBreakpointChange);
}

function ensureShell() {
  const hasPageContent = Boolean(document.getElementById("page-content"));
  if (!hasPageContent) {
    document.body.innerHTML = renderApp(demoUser);
    shellHydrated = false;
  }

  if (!shellHydrated) {
    const initialCollapsed = sidebarMedia.matches ? true : preferredDesktopSidebarCollapsed;
    applySidebarState(initialCollapsed, { persist: false });
    shellHydrated = true;
  }
}

function navigate() {
  const rawHash = window.location.hash || "";
  const hash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
  const { path, params } = parseRoute(hash || "/dashboard");
  const targetRoute = routes[path] ? path : "/dashboard";

  if (isInvoiceModalOpen) {
    closeInvoiceModal();
  }

  if (targetRoute === "/login") {
    document.body.classList.remove("is-lock-scroll");
    shellHydrated = false;
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

  initPage(targetRoute, params);
  setActiveNavLink(targetRoute);
  if (sidebarMedia.matches) {
    maybeCloseSidebarForMobile();
  }
}

window.addEventListener("hashchange", navigate);
document.addEventListener("DOMContentLoaded", navigate);
