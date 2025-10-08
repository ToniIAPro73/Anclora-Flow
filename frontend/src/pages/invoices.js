const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2
});

const statusMap = {
  cobradas: {
    label: "Cobrada",
    tone: "paid"
  },
  enviadas: {
    label: "Enviada",
    tone: "sent"
  },
  pendientes: {
    label: "Pendiente",
    tone: "pending"
  },
  vencidas: {
    label: "Vencida",
    tone: "overdue"
  },
  borradores: {
    label: "Borrador",
    tone: "draft"
  }
};

const invoices = [
  {
    number: "F2025-001",
    client: "TechStart Solutions SL",
    issueDate: "2025-01-15",
    dueDate: "2025-02-14",
    total: 2650,
    status: statusMap.cobradas,
    daysLate: "",
    highlight: true
  },
  {
    number: "F2025-002",
    client: "Consultoría Martínez",
    issueDate: "2025-02-01",
    dueDate: "2025-03-03",
    total: 1224,
    status: statusMap.enviadas,
    daysLate: "219 días tarde"
  },
  {
    number: "F2025-003",
    client: "Academia de Idiomas Global",
    issueDate: "2025-02-15",
    dueDate: "2025-03-17",
    total: 648,
    status: statusMap.pendientes,
    daysLate: "205 días tarde"
  },
  {
    number: "F2025-004",
    client: "Startup Innovation Hub",
    issueDate: "2025-03-01",
    dueDate: "2025-04-14",
    total: 3710,
    status: statusMap.vencidas,
    daysLate: "190 días tarde"
  },
  {
    number: "F2025-005",
    client: "Freelancer Network SL",
    issueDate: "2025-03-15",
    dueDate: "2025-04-14",
    total: 1908,
    status: statusMap.borradores,
    daysLate: "177 días tarde"
  }
];

const clientOptions = [...new Set(invoices.map((invoice) => invoice.client))];

const summaryCards = [
  {
    id: "total",
    title: "Facturación Total",
    hint: "Este mes",
    value: 8500,
    badge: "+18.1%",
    tone: "primary"
  },
  {
    id: "pending",
    title: "Cobros Pendientes",
    hint: "4 facturas",
    value: 4132,
    action: "Gestionar",
    tone: "alert"
  },
  {
    id: "average",
    title: "Facturación Media",
    hint: "Por cliente",
    value: 2840,
    badge: "Por proyecto",
    tone: "neutral"
  },
  {
    id: "ratio",
    title: "Ratio de Cobro",
    hint: "En plazo",
    value: "82.5%",
    badge: "Bueno",
    tone: "success"
  }
];

function formatDate(date) {
  const [year, month, day] = date.split("-").map(Number);
  return `${day}/${month}/${year}`;
}

function renderSummaryCards() {
  return summaryCards
    .map((card) => {
      const amount =
        typeof card.value === "number" ? currencyFormatter.format(card.value) : card.value;
      const badgeMarkup = card.badge
        ? `<span class="invoices-card__badge">${card.badge}</span>`
        : "";
      const actionMarkup = card.action
        ? `<button type="button" class="invoices-card__cta">${card.action}</button>`
        : "";

      return `
        <article class="invoices-card invoices-card--${card.tone}" role="listitem">
          <div class="invoices-card__content">
            <header class="invoices-card__header">
              <p class="invoices-card__title">${card.title}</p>
              <p class="invoices-card__hint">${card.hint}</p>
            </header>
            <p class="invoices-card__value">${amount}</p>
            <footer class="invoices-card__footer">
              ${badgeMarkup}
              ${actionMarkup}
            </footer>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderInvoiceRows() {
  return invoices
    .map((invoice) => {
      const { number, client, issueDate, dueDate, total, status, daysLate, highlight } = invoice;
      const statusLabel = status.label;
      const statusTone = status.tone;

      return `
        <tr
          data-invoice-row
          data-client="${client.toLowerCase()}"
          data-status="${statusTone}"
          data-number="${number.toLowerCase()}"
          class="${highlight ? "invoices-table__row invoices-table__row--highlight" : "invoices-table__row"}"
        >
          <td data-column="Factura">
            <span class="invoices-table__number">${number}</span>
          </td>
          <td data-column="Cliente">
            <span class="invoices-table__client">${client}</span>
          </td>
          <td data-column="Emision">
            <time datetime="${issueDate}">${formatDate(issueDate)}</time>
          </td>
          <td data-column="Vencimiento">
            <time datetime="${dueDate}">${formatDate(dueDate)}</time>
          </td>
          <td data-column="Importe">
            <span class="invoices-table__amount">${currencyFormatter.format(total)}</span>
          </td>
          <td data-column="Estado">
            <span class="status-pill status-pill--${statusTone}">
              <span class="status-pill__dot" aria-hidden="true"></span>
              ${statusLabel}
            </span>
          </td>
          <td data-column="Dias">
            <span class="invoices-table__days">${daysLate || "-"}</span>
          </td>
          <td data-column="Acciones" class="invoices-table__actions">
            <button type="button" class="table-action" title="Ver factura" aria-label="Ver ${number}">
              <span aria-hidden="true">👁️</span>
            </button>
            <button type="button" class="table-action" title="Editar factura" aria-label="Editar ${number}">
              <span aria-hidden="true">✏️</span>
            </button>
            <button type="button" class="table-action" title="Descargar PDF" aria-label="Descargar ${number}">
              <span aria-hidden="true">📄</span>
            </button>
            <button type="button" class="table-action" title="Marcar como cobrada" aria-label="Marcar ${number} como cobrada">
              <span aria-hidden="true">✅</span>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderInvoiceModal() {
  return `
    <div class="modal" id="invoice-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="invoice-modal-title">
      <div class="modal__backdrop" data-modal-dismiss></div>
      <div class="modal__panel" role="document">
        <header class="modal__head">
          <div>
            <h2 id="invoice-modal-title">Nueva factura</h2>
            <p class="modal__subtitle">Completa los datos para generar la factura y enviarla al cliente.</p>
          </div>
          <button type="button" class="modal__close" data-modal-close aria-label="Cerrar modal">
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <form class="invoice-form" novalidate>
          <section class="invoice-form__section">
            <h3>Datos del cliente</h3>
            <div class="invoice-form__grid">
              <label class="form-field">
                <span>Cliente</span>
                <input type="text" name="client" placeholder="Introduce el nombre fiscal" required />
              </label>
              <label class="form-field">
                <span>Email</span>
                <input type="email" name="clientEmail" placeholder="cliente@empresa.com" />
              </label>
              <label class="form-field">
                <span>NIF / CIF</span>
                <input type="text" name="clientTaxId" placeholder="B12345678" />
              </label>
              <label class="form-field">
                <span>Dirección</span>
                <input type="text" name="clientAddress" placeholder="Calle, ciudad, provincia" />
              </label>
            </div>
          </section>

          <section class="invoice-form__section">
            <h3>Datos de la factura</h3>
            <div class="invoice-form__grid invoice-form__grid--compact">
              <label class="form-field">
                <span>Nº de factura</span>
                <input type="text" name="invoiceNumber" value="F2025-006" />
              </label>
              <label class="form-field">
                <span>Fecha de emisión</span>
                <input type="date" name="issueDate" value="2025-10-08" />
              </label>
              <label class="form-field">
                <span>Fecha de vencimiento</span>
                <input type="date" name="dueDate" value="2025-11-08" />
              </label>
              <label class="form-field">
                <span>Proyecto</span>
                <input type="text" name="project" placeholder="Nombre del proyecto" />
              </label>
            </div>
          </section>

          <section class="invoice-form__section invoice-form__section--lines">
            <div class="invoice-form__section-head">
              <h3>Conceptos</h3>
              <button type="button" class="invoice-form__add-line">
                <span aria-hidden="true">＋</span>
                Añadir línea
              </button>
            </div>
            <div class="invoice-lines">
              <article class="invoice-line">
                <div class="invoice-line__desc">
                  <label class="form-field">
                    <span>Descripción</span>
                    <input type="text" name="lineDescription" value="Servicios de consultoría fiscal" />
                  </label>
                </div>
                <div class="invoice-line__meta">
                  <label class="form-field">
                    <span>Horas</span>
                    <input type="number" inputmode="decimal" name="lineQty" value="10" min="0" step="0.5" />
                  </label>
                  <label class="form-field">
                    <span>Tarifa</span>
                    <input type="number" inputmode="decimal" name="lineRate" value="120" min="0" step="0.01" />
                  </label>
                  <label class="form-field">
                    <span>IVA</span>
                    <select name="lineVat">
                      <option value="21" selected>21%</option>
                      <option value="10">10%</option>
                      <option value="4">4%</option>
                      <option value="0">Exento</option>
                    </select>
                  </label>
                </div>
                <div class="invoice-line__total">
                  <span class="invoice-line__total-label">Importe estimado</span>
                  <span class="invoice-line__total-value">${currencyFormatter.format(1452)}</span>
                </div>
              </article>
            </div>
          </section>

          <section class="invoice-form__section invoice-summary">
            <h3>Resumen</h3>
            <dl class="invoice-summary__list">
              <div class="invoice-summary__row">
                <dt>Base imponible</dt>
                <dd>${currencyFormatter.format(1200)}</dd>
              </div>
              <div class="invoice-summary__row">
                <dt>IVA (21%)</dt>
                <dd>${currencyFormatter.format(252)}</dd>
              </div>
              <div class="invoice-summary__row">
                <dt>Retención IRPF (15%)</dt>
                <dd>- ${currencyFormatter.format(180)}</dd>
              </div>
              <div class="invoice-summary__row invoice-summary__row--total">
                <dt>Total a cobrar</dt>
                <dd>${currencyFormatter.format(1272)}</dd>
              </div>
            </dl>
          </section>

          <footer class="invoice-form__footer">
            <button type="button" class="btn-secondary" data-modal-close>Cancelar</button>
            <button type="submit" class="btn-primary">Guardar y enviar</button>
          </footer>
        </form>
      </div>
    </div>
  `;
}

export function renderInvoices() {
  return `
    <section class="invoices" aria-labelledby="invoices-title">
      <header class="invoices__hero">
        <div class="invoices__hero-copy">
          <h1 id="invoices-title">Ingresos &amp; Facturas</h1>
          <p>Controla facturación, cobros y rendimiento en un panel unificado.</p>
        </div>
        <div class="invoices__hero-actions">
          <button type="button" class="btn-primary" data-modal-open="invoice">Nueva factura</button>
          <button type="button" class="btn-ghost" data-feature-pending="add-payment">Añadir cobro</button>
        </div>
      </header>

      <section class="invoices__filters" aria-label="Filtros de facturas">
        <div class="invoices__filters-group">
          <label class="visually-hidden" for="invoice-search">Buscar facturas</label>
          <input
            type="search"
            id="invoice-search"
            class="invoices__search"
            placeholder="Buscar facturas..."
            autocomplete="off"
            data-invoices-search
          />
        </div>
        <div class="invoices__filters-group">
          <label class="visually-hidden" for="invoice-status">Filtrar por estado</label>
          <select id="invoice-status" class="invoices__select" data-invoices-filter="status">
            <option value="all">Todos los estados</option>
            <option value="paid">Cobradas</option>
            <option value="sent">Enviadas</option>
            <option value="pending">Pendientes</option>
            <option value="overdue">Vencidas</option>
            <option value="draft">Borradores</option>
          </select>
        </div>
        <div class="invoices__filters-group">
          <label class="visually-hidden" for="invoice-client">Filtrar por cliente</label>
          <select id="invoice-client" class="invoices__select" data-invoices-filter="client">
            <option value="all">Todos los clientes</option>
            ${clientOptions
              .map((client) => `<option value="${client.toLowerCase()}">${client}</option>`)
              .join("")}
          </select>
        </div>
        <div class="invoices__filters-group invoices__filters-group--pinned">
          <button type="button" class="btn-ghost" data-export-excel>
            <span aria-hidden="true">📊</span>
            Exportar Excel
          </button>
        </div>
      </section>

      <section class="invoices-table" aria-label="Listado de facturas">
        <div class="invoices-table__surface">
          <table>
            <thead>
              <tr>
                <th scope="col">Nº Factura</th>
                <th scope="col">Cliente</th>
                <th scope="col">Fecha Emisión</th>
                <th scope="col">Fecha Vencimiento</th>
                <th scope="col">Importe Total</th>
                <th scope="col">Estado</th>
                <th scope="col">Días</th>
                <th scope="col"><span class="visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              ${renderInvoiceRows()}
            </tbody>
          </table>
          <div class="invoices-table__empty" hidden>
            <p>No hay facturas que coincidan con los filtros seleccionados.</p>
          </div>
        </div>
        <footer class="invoices-table__footer">
          <p data-result-count>Mostrando 1-5 de ${invoices.length} facturas</p>
          <div class="invoices-table__pager" role="navigation" aria-label="Paginación">
            <button type="button" class="pager-btn" disabled aria-disabled="true">Anterior</button>
            <button type="button" class="pager-btn pager-btn--primary">Siguiente</button>
          </div>
        </footer>
      </section>

      <section class="invoices__insights" aria-label="Indicadores clave">
        <div class="invoices__metrics" role="list">
          ${renderSummaryCards()}
        </div>

        <div class="invoices__charts">
          <article class="chart-card chart-card--line">
            <div class="chart-card__head">
              <h3>Evolución mensual - Ingresos</h3>
              <p>Comparativa de los últimos 12 meses</p>
            </div>
            <svg class="chart chart--line" viewBox="0 0 320 180" role="img" aria-label="Gráfico de ingresos">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="rgba(51,102,255,0.45)"></stop>
                  <stop offset="100%" stop-color="rgba(51,102,255,0)"></stop>
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="var(--secondary-400)"></stop>
                  <stop offset="100%" stop-color="var(--accent-500)"></stop>
                </linearGradient>
              </defs>
              <polyline
                fill="url(#lineGradient)"
                stroke="url(#strokeGradient)"
                stroke-width="4"
                stroke-linecap="round"
                points="10,140 40,120 70,130 100,115 130,118 160,105 190,110 220,108 250,95 280,100 310,70"
              ></polyline>
              <g class="chart__axis">
                <line x1="10" y1="150" x2="310" y2="150"></line>
                <line x1="10" y1="40" x2="10" y2="150"></line>
              </g>
            </svg>
          </article>
          <article class="chart-card chart-card--bars">
            <div class="chart-card__head">
              <h3>Top 5 clientes</h3>
              <p>Facturación acumulada anual</p>
            </div>
            <svg class="chart chart--bars" viewBox="0 0 320 180" role="img" aria-label="Ranking de clientes">
              <g>
                <rect x="40" y="60" width="36" height="100" class="bar bar--1"></rect>
                <rect x="90" y="80" width="36" height="80" class="bar bar--2"></rect>
                <rect x="140" y="95" width="36" height="65" class="bar bar--3"></rect>
                <rect x="190" y="105" width="36" height="55" class="bar bar--4"></rect>
                <rect x="240" y="120" width="36" height="40" class="bar bar--5"></rect>
              </g>
            </svg>
          </article>
          <article class="chart-card chart-card--donut">
            <div class="chart-card__head">
              <h3>Distribución por servicio</h3>
              <p>Reparto de facturación por línea</p>
            </div>
            <svg class="chart chart--donut" viewBox="0 0 180 180" role="img" aria-label="Distribución por servicio">
              <circle class="donut-ring" cx="90" cy="90" r="70"></circle>
              <circle class="donut-segment donut-segment--primary" cx="90" cy="90" r="70" stroke-dasharray="300 440" stroke-dashoffset="0"></circle>
              <circle class="donut-segment donut-segment--accent" cx="90" cy="90" r="70" stroke-dasharray="220 440" stroke-dashoffset="-300"></circle>
              <circle class="donut-segment donut-segment--secondary" cx="90" cy="90" r="70" stroke-dasharray="120 440" stroke-dashoffset="-520"></circle>
            </svg>
            <ul class="chart-legend">
              <li><span class="legend-dot legend-dot--primary"></span>Desarrollo web</li>
              <li><span class="legend-dot legend-dot--accent"></span>Consultoría</li>
              <li><span class="legend-dot legend-dot--secondary"></span>Enseñanza</li>
              <li><span class="legend-dot legend-dot--muted"></span>Diseño</li>
            </ul>
          </article>
        </div>
      </section>
    </section>
    ${renderInvoiceModal()}
  `;
}

export default renderInvoices;
