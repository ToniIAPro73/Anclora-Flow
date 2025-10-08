import "./styles/colors.css";
import renderApp from "./pages/index.js";
import renderLogin from "./pages/login.js";
import renderInvoices from "./pages/invoices.js";
import renderExpenses from "./pages/expenses.js";
import renderClients from "./pages/clients.js";
import renderSubscriptions from "./pages/subscriptions.js";
import renderBudget from "./pages/budget.js";
import renderCalendar from "./pages/calendar.js";
import renderReports from "./pages/reports.js";
import renderAssistant from "./pages/assistant.js";
import renderSettings from "./pages/settings.js";

const defaultDashboard = () => `
  <section class="module dashboard">
    <h1>Dashboard</h1>
    <p>Selecciona una seccion en la barra lateral para comenzar.</p>
  </section>
`;

const routes = {
  "/dashboard": defaultDashboard,
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
  const pageRenderer = routes[targetRoute] || defaultDashboard;
  const container = document.getElementById("page-content");
  if (container) {
    container.innerHTML = pageRenderer(demoUser);
  }
}

window.addEventListener("hashchange", navigate);
document.addEventListener("DOMContentLoaded", navigate);
