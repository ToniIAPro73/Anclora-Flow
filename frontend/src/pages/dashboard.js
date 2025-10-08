const numberFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR"
});

export function renderDashboard(user = {}) {
  const { name = "Demo" } = user;
  const firstName = name.split(/\s+/)[0] || "Demo";

  const metrics = [
    {
      id: "deadline",
      icon: "\u23F3",
      title: "Dias hasta vencimiento",
      value: "14",
      helper: "Revisa tus obligaciones",
      tone: "warning"
    },
    {
      id: "iva",
      icon: "\uD83D\uDCB0",
      title: "Proximo pago IVA",
      value: numberFormatter.format(6600),
      helper: "Corresponde al T3 2025",
      tone: "info"
    },
    {
      id: "forecast",
      icon: "\uD83D\uDCCA",
      title: "Estimacion anual",
      value: numberFormatter.format(40050),
      helper: "Objetivo al 72%",
      tone: "success"
    },
    {
      id: "days",
      icon: "\u2705",
      title: "Dias sin incidencias",
      value: "387",
      helper: "Declaraciones al dia",
      tone: "neutral"
    }
  ];

  const quickActions = [
    {
      icon: "\uD83E\uDDFE",
      title: "Nueva factura",
      description: "Crear facturas",
      href: "#/invoices"
    },
    {
      icon: "\uD83D\uDCC9",
      title: "Gastos del mes",
      description: "Revisar gastos",
      href: "#/expenses"
    },
    {
      icon: "\uD83D\uDCC6",
      title: "Proximas obligaciones",
      description: "Vencimientos fiscales",
      href: "#/calendar"
    },
    {
      icon: "\uD83E\uDDEE",
      title: "Calculadora IRPF",
      description: "Calcular impuestos",
      href: "#/assistant"
    },
    {
      icon: "\uD83D\uDCD1",
      title: "Informes",
      description: "Analisis y metricas",
      href: "#/reports"
    },
    {
      icon: "\uD83E\uDD16",
      title: "Asistente IA",
      description: "Ayuda inteligente",
      href: "#/assistant"
    }
  ];

  const deadlines = [
    {
      label: "Modelo 303 - IVA",
      date: "20 ene 2025"
    },
    {
      label: "IRPF Q4 2024",
      date: "30 ene 2025"
    },
    {
      label: "Modelo 111",
      date: "20 feb 2025"
    }
  ];

  const activities = [
    {
      label: "Factura #2025-001 creada",
      time: "Hace 2 horas",
      href: "#/invoices"
    },
    {
      label: "Gasto registrado: material oficina",
      time: "Hace 4 horas",
      href: "#/expenses"
    },
    {
      label: "Recordatorio: Modelo 303 proximo",
      time: "Hace 1 dia",
      href: "#/calendar"
    }
  ];

  const metricCards = metrics
    .map(
      (metric) => `
        <article class="dashboard__kpi-card dashboard__kpi-card--${metric.tone}" role="listitem">
          <span class="dashboard__kpi-icon" aria-hidden="true">${metric.icon}</span>
          <div class="dashboard__kpi-copy">
            <p class="dashboard__kpi-label">${metric.title}</p>
            <p class="dashboard__kpi-value">${metric.value}</p>
            <p class="dashboard__kpi-helper">${metric.helper}</p>
          </div>
        </article>
      `
    )
    .join("");

  const quickCards = quickActions
    .map(
      (action) => `
        <article class="dashboard__quick-card" role="listitem">
          <div class="dashboard__quick-icon" aria-hidden="true">${action.icon}</div>
          <div class="dashboard__quick-copy">
            <h3>${action.title}</h3>
            <p>${action.description}</p>
            <a class="dashboard__quick-link" href="${action.href}">Acceder</a>
          </div>
        </article>
      `
    )
    .join("");

  const timelineItems = deadlines
    .map(
      (deadline) => `
        <li class="dashboard__timeline-item">
          <span class="dashboard__timeline-dot" aria-hidden="true"></span>
          <div class="dashboard__timeline-copy">
            <p class="dashboard__timeline-label">${deadline.label}</p>
            <p class="dashboard__timeline-date">${deadline.date}</p>
          </div>
        </li>
      `
    )
    .join("");

  const activityItems = activities
    .map(
      (item) => `
        <li class="dashboard__activity-item">
          <div class="dashboard__activity-copy">
            <p class="dashboard__activity-label">${item.label}</p>
            <p class="dashboard__activity-time">${item.time}</p>
          </div>
          <a class="dashboard__activity-link" href="${item.href}">Acceder</a>
        </li>
      `
    )
    .join("");

  return `
    <section class="dashboard" aria-labelledby="dashboard-title">
      <header class="dashboard__hero">
        <div class="dashboard__hero-content">
          <p class="dashboard__hero-greeting">Hola ${firstName}</p>
          <p class="dashboard__hero-subtitle">Este es tu resumen fiscal del dia.</p>
        </div>
        <div class="dashboard__hero-badge" role="status">
          <span class="dashboard__hero-badge-label">Siguiente obligacion en</span>
          <span class="dashboard__hero-badge-value">14 dias</span>
        </div>
      </header>

      <section class="dashboard__section" aria-labelledby="dashboard-metrics">
        <div class="dashboard__section-head">
          <h2 id="dashboard-metrics">Resumen de metricas</h2>
          <p>Datos sincronizados con tus ultimas operaciones</p>
        </div>
        <div class="dashboard__kpi-list" role="list">
          ${metricCards}
        </div>
      </section>

      <section class="dashboard__section" aria-labelledby="dashboard-quick">
        <div class="dashboard__section-head">
          <h2 id="dashboard-quick">Acciones rapidas</h2>
          <p>Gestiona tareas habituales desde un solo lugar</p>
        </div>
        <div class="dashboard__quick-list" role="list">
          ${quickCards}
        </div>
      </section>

      <section class="dashboard__grid" aria-labelledby="dashboard-grid">
        <article class="dashboard__panel" aria-labelledby="dashboard-dates">
          <div class="dashboard__panel-head">
            <h2 id="dashboard-dates">Proximas fechas</h2>
            <p>Preparate para los vencimientos claves</p>
          </div>
          <ol class="dashboard__timeline">
            ${timelineItems}
          </ol>
        </article>
        <article class="dashboard__panel" aria-labelledby="dashboard-activity">
          <div class="dashboard__panel-head">
            <h2 id="dashboard-activity">Actividad reciente</h2>
            <p>Ultimas acciones registradas</p>
          </div>
          <ul class="dashboard__activity" role="list">
            ${activityItems}
          </ul>
        </article>
      </section>
    </section>
  `;
}

export default renderDashboard;
