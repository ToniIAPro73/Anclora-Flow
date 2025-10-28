const subscriptionState = {
  subscriptions: [],
  summary: {
    total_subscriptions: 0,
    active_subscriptions: 0,
    paused_subscriptions: 0,
    cancelled_subscriptions: 0,
    monthly_recurring_revenue: 0,
    next_30_days_revenue: 0,
  },
  upcoming: [],
  breakdown: [],
  clients: [],
  filters: {
    search: "",
    status: "all",
    billingCycle: "all",
    autoInvoice: "all",
  },
  loading: false,
  error: null,
};

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function formatCurrency(value) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) return currency.format(0);
  return currency.format(parsed);
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `notification notification--${type}`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button type="button" class="notification__close" aria-label="Cerrar">×</button>
  `;
  toast
    .querySelector(".notification__close")
    .addEventListener("click", () => toast.remove());
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3500);
}

function setLoading(isLoading) {
  subscriptionState.loading = isLoading;
  const spinner = document.querySelector("[data-subscriptions-loading]");
  if (spinner) spinner.hidden = !isLoading;
}

function setError(message) {
  subscriptionState.error = message;
  const box = document.querySelector("[data-subscriptions-error]");
  if (!box) return;
  if (!message) {
    box.hidden = true;
    box.innerHTML = "";
    return;
  }
  box.hidden = false;
  box.innerHTML = `
    <div class="module-error__content">
      <span class="module-error__icon">⚠️</span>
      <div>
        <p class="module-error__title">No pudimos cargar las suscripciones</p>
        <p class="module-error__message">${escapeHtml(message)}</p>
      </div>
      <button type="button" class="btn btn-secondary" data-subscriptions-retry>Reintentar</button>
    </div>
  `;
  box
    .querySelector("[data-subscriptions-retry]")
    ?.addEventListener("click", () => void refreshSubscriptionsModule());
}

function buildFilters() {
  const filters = {};
  if (subscriptionState.filters.search.trim()) {
    filters.search = subscriptionState.filters.search.trim();
  }
  if (subscriptionState.filters.status !== "all") {
    filters.status = subscriptionState.filters.status;
  }
  if (subscriptionState.filters.billingCycle !== "all") {
    filters.billingCycle = subscriptionState.filters.billingCycle;
  }
  if (subscriptionState.filters.autoInvoice !== "all") {
    filters.autoInvoice = subscriptionState.filters.autoInvoice === "true";
  }
  return filters;
}

async function loadSubscriptions() {
  const response = await window.api.getSubscriptions(buildFilters());
  const { subscriptions = [] } = response || {};
  subscriptionState.subscriptions = subscriptions.map((sub) => ({
    id: sub.id,
    name: sub.name,
    clientId: sub.client_id,
    clientName: sub.client_name,
    amount: sub.amount,
    billingCycle: sub.billing_cycle,
    nextBillingDate: sub.next_billing_date,
    status: sub.status,
    autoInvoice: sub.auto_invoice,
    currency: sub.currency || "EUR",
    description: sub.description,
    startDate: sub.start_date,
  }));
}

async function loadSummary() {
  const summary = await window.api.getSubscriptionSummary();
  if (summary) {
    subscriptionState.summary = summary;
  }
}

async function loadInsights() {
  const [upcoming, breakdown] = await Promise.all([
    window.api.getSubscriptionUpcoming(6),
    window.api.getSubscriptionStatusBreakdown(),
  ]);
  subscriptionState.upcoming = Array.isArray(upcoming) ? upcoming : [];
  subscriptionState.breakdown = Array.isArray(breakdown) ? breakdown : [];
}

async function loadClients() {
  const response = await window.api.getClients({ isActive: true });
  const { clients = [] } = response || {};
  subscriptionState.clients = clients;
}

function renderSummaryCards() {
  const summary = subscriptionState.summary;
  const total = document.getElementById("subscriptions-summary-total");
  const active = document.getElementById("subscriptions-summary-active");
  const paused = document.getElementById("subscriptions-summary-paused");
  const cancelled = document.getElementById("subscriptions-summary-cancelled");
  const mrr = document.getElementById("subscriptions-summary-mrr");
  const cashflow = document.getElementById("subscriptions-summary-cashflow");

  if (total) total.textContent = summary.total_subscriptions ?? 0;
  if (active) active.textContent = summary.active_subscriptions ?? 0;
  if (paused) paused.textContent = summary.paused_subscriptions ?? 0;
  if (cancelled) cancelled.textContent = summary.cancelled_subscriptions ?? 0;
  if (mrr)
    mrr.textContent = formatCurrency(summary.monthly_recurring_revenue ?? 0);
  if (cashflow)
    cashflow.textContent = formatCurrency(summary.next_30_days_revenue ?? 0);
}

function renderSubscriptionsTable() {
  const tbody = document.querySelector("[data-subscriptions-table]");
  if (!tbody) return;
  if (!subscriptionState.subscriptions.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <span class="empty-state__icon">🔁</span>
            <p>No hay suscripciones registradas.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  tbody.innerHTML = subscriptionState.subscriptions
    .map(
      (sub) => `
        <tr>
          <td>
            <div class="table-cell--main">
              <strong>${escapeHtml(sub.name)}</strong>
              <span>${escapeHtml(sub.description || "Sin descripción")}</span>
            </div>
          </td>
          <td>
            <span>${escapeHtml(sub.clientName || "Sin cliente")}</span>
          </td>
          <td>
            <span class="badge badge--info">
              ${sub.billingCycle === "monthly" ? "Mensual" : sub.billingCycle === "quarterly" ? "Trimestral" : sub.billingCycle === "yearly" ? "Anual" : "Personalizado"}
            </span>
          </td>
          <td>
            <span>${formatDate(sub.nextBillingDate)}</span>
            <span class="meta">${formatDate(sub.startDate)}</span>
          </td>
          <td>
            <strong>${formatCurrency(sub.amount ?? 0)}</strong>
            <span class="meta">${escapeHtml(sub.currency || "EUR")}</span>
          </td>
          <td>
            <span class="badge badge--${sub.autoInvoice ? "success" : "neutral"}">
              ${sub.autoInvoice ? "Automática" : "Manual"}
            </span>
          </td>
          <td>
            <span class="badge badge--${sub.status === "active" ? "success" : sub.status === "paused" ? "warning" : "danger"}">
              ${sub.status === "active" ? "Activa" : sub.status === "paused" ? "Pausada" : "Cancelada"}
            </span>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-icon" data-subscription-edit="${sub.id}" aria-label="Editar">✏️</button>
              <button type="button" class="btn-icon btn-icon--danger" data-subscription-delete="${sub.id}" aria-label="Eliminar">🗑️</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderInsights() {
  const upcomingList = document.querySelector("[data-upcoming-subscriptions]");
  const breakdownList = document.querySelector("[data-status-breakdown]");

  if (upcomingList) {
    if (!subscriptionState.upcoming.length) {
      upcomingList.innerHTML =
        "<li class=\"empty\">Sin cobros próximos</li>";
    } else {
      upcomingList.innerHTML = subscriptionState.upcoming
        .map(
          (item) => `
            <li>
              <span class="title">${escapeHtml(item.name)}</span>
              <span class="meta">${formatDate(item.next_billing_date)} · ${formatCurrency(item.amount ?? 0)}</span>
            </li>
          `
        )
        .join("");
    }
  }

  if (breakdownList) {
    if (!subscriptionState.breakdown.length) {
      breakdownList.innerHTML =
        "<li class=\"empty\">Sin datos por estado</li>";
    } else {
      breakdownList.innerHTML = subscriptionState.breakdown
        .map(
          (item) => `
            <li>
              <span class="title">${escapeHtml(item.status)}</span>
              <span class="meta">${item.count} · ${formatCurrency(item.total_amount ?? 0)}</span>
            </li>
          `
        )
        .join("");
    }
  }
}

function populateClientSelect() {
  const select = document.querySelector("[name='clientId']");
  if (!select) return;
  select.innerHTML = [
    '<option value="">Sin asignar</option>',
    ...subscriptionState.clients.map(
      (client) =>
        `<option value="${client.id}">${escapeHtml(client.name)}</option>`
    ),
  ].join("");
}

async function refreshSubscriptionsModule() {
  if (typeof window.api === "undefined") {
    setError("Servicio API no disponible. Verifica api.js");
    return;
  }
  if (!window.api.isAuthenticated()) {
    setError("Inicia sesión para gestionar tus suscripciones.");
    return;
  }

  try {
    setError(null);
    setLoading(true);
    await Promise.all([
      loadSubscriptions(),
      loadSummary(),
      loadInsights(),
      loadClients(),
    ]);
    renderSummaryCards();
    renderSubscriptionsTable();
    renderInsights();
    populateClientSelect();
  } catch (error) {
    console.error("Error loading subscriptions module", error);
    setError("Ocurrió un problema al obtener las suscripciones.");
  } finally {
    setLoading(false);
  }
}

function openModal(id) {
  document
    .querySelectorAll("[data-modal]")
    .forEach((modal) => modal.classList.toggle("is-open", modal.dataset.modal === id));
}

function closeModal(id) {
  const modal = document.querySelector(`[data-modal="${id}"]`);
  if (!modal) return;
  modal.classList.remove("is-open");
  const form = modal.querySelector("form");
  if (form) {
    form.reset();
    form.removeAttribute("data-editing");
  }
}

function fillSubscriptionForm(subscription) {
  const form = document.querySelector("[data-subscription-form]");
  if (!form) return;
  form.dataset.editing = subscription.id;
  form.querySelector("[name='name']").value = subscription.name || "";
  form.querySelector("[name='clientId']").value =
    subscription.clientId || "";
  form.querySelector("[name='amount']").value =
    subscription.amount != null ? subscription.amount : "";
  form.querySelector("[name='currency']").value =
    subscription.currency || "EUR";
  form.querySelector("[name='billingCycle']").value =
    subscription.billingCycle || "monthly";
  form.querySelector("[name='startDate']").value =
    subscription.startDate ? subscription.startDate.split("T")[0] : "";
  form.querySelector("[name='nextBillingDate']").value =
    subscription.nextBillingDate
      ? subscription.nextBillingDate.split("T")[0]
      : "";
  form.querySelector("[name='status']").value =
    subscription.status || "active";
  form.querySelector("[name='autoInvoice']").checked = !!subscription.autoInvoice;
  form.querySelector("[name='description']").value =
    subscription.description || "";
}

async function handleSubscriptionSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const payload = {
    name: data.get("name")?.toString().trim(),
    clientId: data.get("clientId") || undefined,
    amount: data.get("amount") ? Number.parseFloat(data.get("amount")) : undefined,
    currency: data.get("currency") || "EUR",
    billingCycle: data.get("billingCycle") || "monthly",
    startDate: data.get("startDate") || undefined,
    nextBillingDate: data.get("nextBillingDate") || undefined,
    status: data.get("status") || "active",
    autoInvoice: data.get("autoInvoice") === "on",
    description: data.get("description")?.toString().trim() || undefined,
  };

  try {
    if (form.dataset.editing) {
      await window.api.updateSubscription(form.dataset.editing, payload);
      showToast("Suscripción actualizada correctamente", "success");
    } else {
      await window.api.createSubscription(payload);
      showToast("Suscripción creada correctamente", "success");
    }
    closeModal("subscription");
    await refreshSubscriptionsModule();
  } catch (error) {
    console.error("Subscription submit failed", error);
    showToast("No se pudo guardar la suscripción", "error");
  }
}

async function handleSubscriptionDelete(id) {
  if (!window.confirm("¿Seguro que deseas eliminar esta suscripción?")) return;
  try {
    await window.api.deleteSubscription(id);
    showToast("Suscripción eliminada", "success");
    await refreshSubscriptionsModule();
  } catch (error) {
    console.error("Subscription delete failed", error);
    showToast("No se pudo eliminar la suscripción", "error");
  }
}

function registerEventListeners() {
  document
    .querySelector("[data-subscriptions-search]")
    ?.addEventListener("input", (event) => {
      subscriptionState.filters.search = event.target.value;
      window.clearTimeout(subscriptionState.searchDebounce);
      subscriptionState.searchDebounce = window.setTimeout(() => {
        void refreshSubscriptionsModule();
      }, 300);
    });

  document
    .querySelector("[data-subscriptions-status]")
    ?.addEventListener("change", (event) => {
      subscriptionState.filters.status = event.target.value;
      void refreshSubscriptionsModule();
    });

  document
    .querySelector("[data-subscriptions-cycle]")
    ?.addEventListener("change", (event) => {
      subscriptionState.filters.billingCycle = event.target.value;
      void refreshSubscriptionsModule();
    });

  document
    .querySelector("[data-subscriptions-autoinvoice]")
    ?.addEventListener("change", (event) => {
      subscriptionState.filters.autoInvoice = event.target.value;
      void refreshSubscriptionsModule();
    });

  document
    .querySelector("[data-open-modal='subscription']")
    ?.addEventListener("click", () => {
      document.querySelector("[data-subscription-form]")?.reset();
      document
        .querySelector("[data-subscription-form]")
        ?.removeAttribute("data-editing");
      openModal("subscription");
    });

  document
    .querySelector("[data-subscription-form]")
    ?.addEventListener("submit", handleSubscriptionSubmit);

  document
    .querySelectorAll("[data-close-modal]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        const modal = button.closest("[data-modal]");
        if (modal) closeModal(modal.dataset.modal);
      })
    );

  document.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-subscription-edit]");
    const deleteButton = event.target.closest("[data-subscription-delete]");
    if (editButton) {
      const id = editButton.dataset.subscriptionEdit;
      const subscription = subscriptionState.subscriptions.find(
        (item) => item.id === id
      );
      if (subscription) {
        fillSubscriptionForm(subscription);
        openModal("subscription");
      }
    }
    if (deleteButton) {
      const id = deleteButton.dataset.subscriptionDelete;
      void handleSubscriptionDelete(id);
    }
  });
}

export function initSubscriptions() {
  registerEventListeners();
  window.requestAnimationFrame(() => {
    void refreshSubscriptionsModule();
  });
}

export default function renderSubscriptions() {
  return `
    <section class="module subscriptions-module">
      <header class="module-header">
        <div class="module-title-section">
          <h1>Gestión de suscripciones</h1>
          <p>Controla ingresos recurrentes, ciclos de facturación y cobros previstos.</p>
        </div>
        <div class="module-actions">
          <button type="button" class="btn btn-primary" data-open-modal="subscription">
            ＋ Nueva suscripción
          </button>
        </div>
      </header>

      <div class="summary-cards">
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-primary-light);">🔁</div>
          <div class="card-content">
            <span class="card-label">Suscripciones totales</span>
            <span class="card-value" id="subscriptions-summary-total">0</span>
            <span class="card-trend">Registradas</span>
          </div>
        </article>
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-success-light);">✅</div>
          <div class="card-content">
            <span class="card-label">Activas</span>
            <span class="card-value" id="subscriptions-summary-active">0</span>
            <span class="card-trend">En curso</span>
          </div>
        </article>
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-warning-light);">⏸️</div>
          <div class="card-content">
            <span class="card-label">En pausa</span>
            <span class="card-value" id="subscriptions-summary-paused">0</span>
            <span class="card-trend">Temporalmente</span>
          </div>
        </article>
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-danger-light);">🛑</div>
          <div class="card-content">
            <span class="card-label">Canceladas</span>
            <span class="card-value" id="subscriptions-summary-cancelled">0</span>
            <span class="card-trend">Histórico</span>
          </div>
        </article>
      </div>

      <div class="summary-cards secondary">
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-tertiary-light);">💶</div>
          <div class="card-content">
            <span class="card-label">MRR estimado</span>
            <span class="card-value" id="subscriptions-summary-mrr">€0</span>
            <span class="card-trend">Ingresos mensuales</span>
          </div>
        </article>
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-info-light);">📅</div>
          <div class="card-content">
            <span class="card-label">Cobros próximos</span>
            <span class="card-value" id="subscriptions-summary-cashflow">€0</span>
            <span class="card-trend">Próximos 30 días</span>
          </div>
        </article>
      </div>

      <div class="module-toolbar">
        <label class="input input--search">
          <span class="input__icon">🔍</span>
          <input type="search" placeholder="Buscar por nombre o descripción..." data-subscriptions-search />
        </label>
        <div class="toolbar-filters">
          <label class="input input--select">
            <span>Estado</span>
            <select data-subscriptions-status>
              <option value="all">Todos</option>
              <option value="active">Activa</option>
              <option value="paused">Pausada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </label>
          <label class="input input--select">
            <span>Ciclo</span>
            <select data-subscriptions-cycle>
              <option value="all">Todos</option>
              <option value="monthly">Mensual</option>
              <option value="quarterly">Trimestral</option>
              <option value="yearly">Anual</option>
              <option value="custom">Personalizado</option>
            </select>
          </label>
          <label class="input input--select">
            <span>Auto facturación</span>
            <select data-subscriptions-autoinvoice>
              <option value="all">Todas</option>
              <option value="true">Automáticas</option>
              <option value="false">Manuales</option>
            </select>
          </label>
        </div>
      </div>

      <div class="module-body subscriptions-layout">
        <div class="module-main">
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Cliente</th>
                  <th>Ciclo</th>
                  <th>Próximo cobro</th>
                  <th>Importe</th>
                  <th>Auto-Fact.</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody data-subscriptions-table></tbody>
            </table>
          </div>
          <div class="module-loading" data-subscriptions-loading hidden>
            <span class="spinner"></span>
            <p>Cargando suscripciones...</p>
          </div>
          <div class="module-error" data-subscriptions-error hidden></div>
        </div>

        <aside class="module-sidebar">
          <section>
            <h4>Próximos cobros</h4>
            <ul class="insight-list" data-upcoming-subscriptions></ul>
          </section>
          <section>
            <h4>Distribución por estado</h4>
            <ul class="insight-list" data-status-breakdown></ul>
          </section>
        </aside>
      </div>
    </section>

    <div class="modal" data-modal="subscription" aria-hidden="true">
      <div class="modal__overlay" data-close-modal></div>
      <div class="modal__content">
        <header class="modal__header">
          <h2>Suscripción</h2>
          <button type="button" class="btn-icon" data-close-modal aria-label="Cerrar">×</button>
        </header>
        <form class="modal__body form-grid" data-subscription-form>
          <label>
            <span>Nombre *</span>
            <input type="text" name="name" required />
          </label>
          <label>
            <span>Cliente</span>
            <select name="clientId"></select>
          </label>
          <label>
            <span>Importe (€)</span>
            <input type="number" min="0" step="0.01" name="amount" required />
          </label>
          <label>
            <span>Moneda</span>
            <input type="text" name="currency" value="EUR" maxlength="5" />
          </label>
          <label>
            <span>Ciclo de facturación</span>
            <select name="billingCycle">
              <option value="monthly">Mensual</option>
              <option value="quarterly">Trimestral</option>
              <option value="yearly">Anual</option>
              <option value="custom">Personalizado</option>
            </select>
          </label>
          <label>
            <span>Inicio</span>
            <input type="date" name="startDate" required />
          </label>
          <label>
            <span>Próximo cobro</span>
            <input type="date" name="nextBillingDate" required />
          </label>
          <label>
            <span>Estado</span>
            <select name="status">
              <option value="active">Activa</option>
              <option value="paused">Pausada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </label>
          <label class="checkbox">
            <input type="checkbox" name="autoInvoice" checked />
            <span>Generar factura automáticamente</span>
          </label>
          <label class="wide">
            <span>Descripción</span>
            <textarea name="description" rows="3"></textarea>
          </label>
          <footer class="modal__footer">
            <button type="button" class="btn btn-secondary" data-close-modal>Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar</button>
          </footer>
        </form>
      </div>
    </div>
  `;
}

