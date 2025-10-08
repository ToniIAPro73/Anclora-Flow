export function renderDashboard(user = {}) {
  const { name = "" } = user;
  const displayName = name ? name.split(" ")[0] : "Anclora";
  const currency = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  });

  const metrics = [
    {
      id: "deadline",
      icon: "\u23F3",
      title: "Proxima obligacion",
      value: "14 dias",
      detail: "IVA trimestral vence el 24 oct.",
      tone: "due"
    },
    {
      id: "taxes",
      icon: "\uD83D\uDCB0",
      title: "Pago IVA previsto",
      value: currency.format(6600),
      detail: "Importe calculado con gastos deducidos",
      tone: "neutral"
    },
    {
      id: "revenue",
      icon: "\uD83C\uDFE6",
      title: "Ingresos del ano",
      value: currency.format(40050),
      detail: "Objetivo anual alcanzado al 72%",
      tone: "positive"
    },
    {
      id: "compliance",
      icon: "\u2705",
      title: "Dias sin incidencias",
      value: "387",
      detail: "Declaraciones presentadas en plazo",
      tone: "success"
    }
  ];

  const quickActions = [
    {
      href: "#/invoices",
      icon: "\uD83D\uDCC4",
      title: "Nueva factura",
      description: "Crea y envia documentos en segundos"
    },
    {
      href: "#/expenses",
      icon: "\uD83D\uDCB8",
      title: "Registrar gasto",
      description: "Anade deducciones con ticket adjunto"
    },
    {
      href: "#/reports",
      icon: "\uD83D\uDCCA",
      title: "Ver informes",
      description: "Analiza margenes y cashflow"
    },
    {
      href: "#/calendar",
      icon: "\uD83D\uDDD3\uFE0F",
      title: "Calendario fiscal",
      description: "Consulta fechas limite oficiales"
    },
    {
      href: "#/assistant",
      icon: "\uD83E\uDDD1\u200D\uD83E\uDDB1",
      title: "Asistente IA",
      description: "Resuelve dudas con lenguaje natural"
    },
    {
      href: "#/subscriptions",
      icon: "\uD83D\uDCE6",
      title: "Suscripciones",
      description: "Gestiona pagos recurrentes"
    }
  ];

  const obligations = [
    {
      label: "Modelo 303",
      date: "24 oct 2025",
      status: "Programado",
      href: "#/calendar"
    },
    {
      label: "Modelo 111",
      date: "31 oct 2025",
      status: "Pendiente",
      href: "#/calendar"
    },
    {
      label: "Cuota RETA",
      date: "30 oct 2025",
      status: "Confirmado",
      href: "#/expenses"
    }
  ];

  const activity = [
    {
      label: "Factura 2025-144",
      value: currency.format(1540),
      meta: "Emitida a Studio Goya",
      href: "#/invoices"
    },
    {
      label: "Gasto coworking",
      value: currency.format(220),
      meta: "Deducible al 100%",
      href: "#/expenses"
    },
    {
      label: "Ingreso Stripe",
      value: currency.format(890),
      meta: "Conciliado hace 2 horas",
      href: "#/reports"
    }
  ];

  const metricCards = metrics
    .map(
      (metric) => `
        <article class="module dashboard__kpi-card dashboard__kpi-card--${metric.tone}" role="listitem">
          <div class="dashboard__kpi-icon" aria-hidden="true">${metric.icon}</div>
          <div class="dashboard__kpi-content">
            <p class="dashboard__kpi-title">${metric.title}</p>
            <p class="dashboard__kpi-value">${metric.value}</p>
            <p class="dashboard__kpi-detail">${metric.detail}</p>
          </div>
        </article>
      `
    )
    .join("");

  const quickCards = quickActions
    .map(
      (action) => `
        <a class="dashboard__quick-card" href="${action.href}" role="listitem">
          <span class="dashboard__quick-icon" aria-hidden="true">${action.icon}</span>
          <span class="dashboard__quick-body">
            <span class="dashboard__quick-title">${action.title}</span>
            <span class="dashboard__quick-description">${action.description}</span>
          </span>
          <span class="dashboard__quick-arrow" aria-hidden="true">&rarr;</span>
        </a>
      `
    )
    .join("");

  const obligationsList = obligations
    .map(
      (item) => `
        <li class="dashboard__timeline-item">
          <div class="dashboard__timeline-marker" aria-hidden="true"></div>
          <div class="dashboard__timeline-content">
            <p class="dashboard__timeline-title">${item.label}</p>
            <p class="dashboard__timeline-meta">${item.date} &middot; ${item.status}</p>
          </div>
          <a class="dashboard__timeline-link" href="${item.href}" aria-label="Ver detalles de ${item.label}">&rarr;</a>
        </li>
      `
    )
    .join("");

  const activityList = activity
    .map(
      (item) => `
        <li class="dashboard__activity-item">
          <div class="dashboard__activity-info">
            <p class="dashboard__activity-title">${item.label}</p>
            <p class="dashboard__activity-meta">${item.meta}</p>
          </div>
          <div class="dashboard__activity-value">${item.value}</div>
          <a class="dashboard__activity-link" href="${item.href}" aria-label="Abrir ${item.label}">&rarr;</a>
        </li>
      `
    )
    .join("");

  return `
    <section class="dashboard" aria-labelledby="dashboard-title">
      <header class="module dashboard__hero">
        <div class="dashboard__hero-headline">
          <p class="dashboard__kicker">Hola ${displayName || "Anclora"}</p>
          <h1 id="dashboard-title">Dashboard principal</h1>
          <p class="dashboard__subtitle">Supervisa ingresos, obligaciones fiscales y acciones recomendadas en un unico lugar.</p>
        </div>
        <div class="dashboard__hero-actions">
          <a class="dashboard__primary-action" href="#/invoices">Crear factura</a>
          <a class="dashboard__secondary-action" href="#/reports">Ver resumen mensual</a>
        </div>
      </header>

      <section class="dashboard__metrics" aria-labelledby="dashboard-metrics">
        <div class="dashboard__section-heading">
          <h2 id="dashboard-metrics">Resumen rapido</h2>
          <p class="dashboard__section-meta">Datos sincronizados con tus ultimas operaciones</p>
        </div>
        <div class="dashboard__kpi-grid" role="list">
          ${metricCards}
        </div>
      </section>

      <section class="module dashboard__quick" aria-labelledby="dashboard-quick">
        <div class="dashboard__section-heading dashboard__section-heading--inline">
          <h2 id="dashboard-quick">Acceso rapido</h2>
          <p class="dashboard__section-meta">Acciones frecuentes para mantenerte al dia</p>
        </div>
        <div class="dashboard__quick-grid" role="list">
          ${quickCards}
        </div>
      </section>

      <section class="dashboard__insights" aria-labelledby="dashboard-insights">
        <div class="module dashboard__timeline" aria-labelledby="dashboard-obligations">
          <div class="dashboard__section-heading dashboard__section-heading--inline">
            <h2 id="dashboard-obligations">Proximas obligaciones</h2>
            <p class="dashboard__section-meta">Planifica tus entregas fiscales sin sorpresas</p>
          </div>
          <ul class="dashboard__timeline-list">
            ${obligationsList}
          </ul>
        </div>
        <div class="module dashboard__activity" aria-labelledby="dashboard-activity">
          <div class="dashboard__section-heading dashboard__section-heading--inline">
            <h2 id="dashboard-activity">Actividad reciente</h2>
            <p class="dashboard__section-meta">Ultimos movimientos registrados</p>
          </div>
          <ul class="dashboard__activity-list">
            ${activityList}
          </ul>
        </div>
      </section>
    </section>
  `;
}

export default renderDashboard;
