import renderSidebarToggleIcon from "./sidebarToggleIcon.js";

const sidebarItems = [
  { path: "/dashboard", label: "Dashboard", icon: "⎈" },
  { path: "/invoices", label: "Ingresos & Facturas", icon: "🧾" },
  { path: "/expenses", label: "Gastos & Deducciones", icon: "💸" },
  { path: "/clients", label: "Clientes & Proyectos", icon: "👥" },
  { path: "/subscriptions", label: "Gestion Suscripciones", icon: "🔁" },
  { path: "/budget", label: "Presupuesto Inteligente", icon: "📊" },
  { path: "/calendar", label: "Calendario & Calculadora Fiscal", icon: "📆" },
  { path: "/reports", label: "Informes & Metricas", icon: "📑" },
  { path: "/assistant", label: "Asistente IA", icon: "🤖" }
];

export function renderSidebar() {
  const links = sidebarItems
    .map(
      (item) => `
        <li>
          <a class="app-sidebar__link" href="#${item.path}" aria-label="${item.label}" title="${item.label}">
            <span class="app-sidebar__glyph" aria-hidden="true">${item.icon}</span>
            <span class="app-sidebar__label">${item.label}</span>
          </a>
        </li>
      `
    )
    .join("");

  return `
    <aside class="app-sidebar" data-state="expanded">
      <div class="app-sidebar__brand">
        <div class="app-sidebar__logo logo" aria-label="Anclora Flow">
          <span class="logo__icon" aria-hidden="true"></span>
          <span class="logo__text">Anclora Flow</span>
        </div>
        <button
          type="button"
          class="sidebar-toggle"
          data-sidebar-trigger="primary"
          aria-expanded="true"
          aria-label="Contraer la navegacion"
        >
          ${renderSidebarToggleIcon()}
        </button>
      </div>
      <nav class="app-sidebar__nav" aria-label="Menu principal">
        <ul>${links}</ul>
      </nav>
    </aside>
  `;
}

export default renderSidebar;
