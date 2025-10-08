const sidebarItems = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/invoices", label: "Ingresos y Facturas" },
  { path: "/expenses", label: "Gastos y Deducciones" },
  { path: "/clients", label: "Clientes y Proyectos" },
  { path: "/subscriptions", label: "Gestion Suscripciones" },
  { path: "/budget", label: "Presupuesto Inteligente" },
  { path: "/calendar", label: "Calendario y Calculadora Fiscal" },
  { path: "/reports", label: "Informes y Metricas" },
  { path: "/assistant", label: "Asistente IA" }
];

export function renderSidebar() {
  const links = sidebarItems
    .map((item) => `<li><a href="#${item.path}">${item.label}</a></li>`)
    .join("");

  return `
    <aside class="sidebar">
      <nav>
        <ul>${links}</ul>
      </nav>
    </aside>
  `;
}

export default renderSidebar;
