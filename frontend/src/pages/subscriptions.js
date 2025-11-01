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
  suggestions: [],
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

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function formatCurrency(value) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) return currencyFormatter.format(0);
  return currencyFormatter.format(parsed);
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

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let debounceTimer = null;
function debounce(callback, delay = 320) {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(callback, delay);
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
      <button type="button" class="btn btn-secondary" data-action="retry-subscriptions">Reintentar</button>
    </div>
  `;
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
  window.setTimeout(() => toast.remove(), 3200);
}

async function loadSubscriptions() {
  const response = await window.api.getSubscriptions({
    search: subscriptionState.filters.search || undefined,
    status:
      subscriptionState.filters.status !== "all"
        ? subscriptionState.filters.status
        : undefined,
    billingCycle:
      subscriptionState.filters.billingCycle !== "all"
        ? subscriptionState.filters.billingCycle
        : undefined,
    autoInvoice:
      subscriptionState.filters.autoInvoice !== "all"
        ? subscriptionState.filters.autoInvoice === "true"
        : undefined,
  });
  const { subscriptions = [] } = response || {};
  subscriptionState.subscriptions = subscriptions.map((item) => ({
    id: String(item.id),
    name: item.name,
    description: item.description,
    clientId: item.client_id ? String(item.client_id) : null,
    clientName: item.client_name,
    amount: item.amount,
    currency: item.currency || "EUR",
    billingCycle: item.billing_cycle,
    nextBillingDate: item.next_billing_date,
    status: item.status,
    autoInvoice: item.auto_invoice,
    startDate: item.start_date,
    relatedRevenue: item.related_revenue,
  }));
}

async function loadSummary() {
  const summary = await window.api.getSubscriptionSummary();
  if (summary) {
    subscriptionState.summary = summary;
  }
}

async function loadUpcoming() {
  try {
    const upcoming = await window.api.getSubscriptionUpcoming(6);
    subscriptionState.upcoming = Array.isArray(upcoming) ? upcoming : [];
  } catch (error) {
    subscriptionState.upcoming = [];
  }
}

async function loadBreakdown() {
  try {
    const breakdown = await window.api.getSubscriptionStatusBreakdown();
    subscriptionState.breakdown = Array.isArray(breakdown) ? breakdown : [];
  } catch (error) {
    subscriptionState.breakdown = [];
  }
}

function buildSuggestions() {
  const active = subscriptionState.subscriptions.filter(
    (item) => item.status === "active"
  );
  const upcomingSoon = subscriptionState.upcoming
    .slice()
    .sort(
      (a, b) =>
        new Date(a.next_billing_date || a.nextBillingDate) -
        new Date(b.next_billing_date || b.nextBillingDate)
    )
    .slice(0, 3);

  const highest = active
    .slice()
    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
    .slice(0, 3);

  subscriptionState.suggestions = [
    ...upcomingSoon.map((item) => ({
      type: "upcoming",
      label: `Cobro próximo ${formatDate(
        item.next_billing_date || item.nextBillingDate
      )}`,
      value: `${escapeHtml(item.name)} · ${formatCurrency(item.amount ?? 0)}`,
    })),
    ...highest.map((item) => ({
      type: "high",
      label: "Alta facturación recurrente",
      value: `${escapeHtml(item.name)} · ${formatCurrency(item.amount ?? 0)}`,
    })),
  ];
}

async function loadClients() {
  try {
    const response = await window.api.getClients({ isActive: true });
    subscriptionState.clients = Array.isArray(response?.clients)
      ? response.clients.map((client) => ({
          ...client,
          id: String(client.id),
        }))
      : [];
  } catch (error) {
    subscriptionState.clients = [];
  }
}

function renderSummary() {
  const summary = subscriptionState.summary;
  const total = document.getElementById("subscriptions-total");
  const active = document.getElementById("subscriptions-active");
  const paused = document.getElementById("subscriptions-paused");
  const cancelled = document.getElementById("subscriptions-cancelled");
  const mrr = document.getElementById("subscriptions-mrr");
  const cashflow = document.getElementById("subscriptions-cashflow");

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
        <td colspan="8">
          <div class="empty-state">
            <span class="empty-state__icon">🔁</span>
            <h3>No hay suscripciones registradas.</h3>
            <p>Configura tu primera suscripción para automatizar la facturación recurrente.</p>
            <button type="button" class="btn btn-primary" data-open-subscription>Crear suscripción</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = subscriptionState.subscriptions
    .map((sub) => {
      const statusBadge =
        sub.status === "active"
          ? "success"
          : sub.status === "paused"
          ? "warning"
          : "danger";
      const cycleLabel =
        sub.billingCycle === "monthly"
          ? "Mensual"
          : sub.billingCycle === "quarterly"
          ? "Trimestral"
          : sub.billingCycle === "yearly"
          ? "Anual"
          : "Personalizado";

      return `
        <tr data-subscription-row="${sub.id}">
          <td>
            <div class="table-cell--main">
              <strong>${escapeHtml(sub.name)}</strong>
              <span>${escapeHtml(sub.description || "Sin descripción")}</span>
            </div>
          </td>
          <td>${escapeHtml(sub.clientName || "Sin cliente")}</td>
          <td>
            <span class="badge badge--info">${cycleLabel}</span>
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
            <span class="badge badge--${
              sub.autoInvoice ? "success" : "neutral"
            }">${sub.autoInvoice ? "Automática" : "Manual"}</span>
          </td>
          <td>
            <span class="badge badge--${statusBadge}">
              ${
                sub.status === "active"
                  ? "Activa"
                  : sub.status === "paused"
                  ? "Pausada"
                  : "Cancelada"
              }
            </span>
          </td>
          <td>
            <div class="table-actions" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
              <button type="button" class="btn-link" data-subscription-view="${sub.id}">Ver</button>
              <button type="button" class="btn-link" data-subscription-edit="${sub.id}">Editar</button>
              <button type="button" class="btn-link" data-subscription-delete="${sub.id}" style="color: var(--danger, #ef4444);">Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderInsights() {
  const upcomingList = document.querySelector("[data-upcoming-subscriptions]");
  const breakdownList = document.querySelector("[data-status-breakdown]");
  const suggestionList = document.querySelector(
    "[data-subscription-suggestions]"
  );

  if (upcomingList) {
    if (!subscriptionState.upcoming.length) {
      upcomingList.innerHTML = '<li class="empty">Sin cobros próximos</li>';
    } else {
      upcomingList.innerHTML = subscriptionState.upcoming
        .map(
          (item) => `
            <li>
              <span class="title">${escapeHtml(item.name)}</span>
              <span class="meta">${formatDate(
                item.next_billing_date || item.nextBillingDate
              )} · ${formatCurrency(item.amount ?? 0)}</span>
            </li>
          `
        )
        .join("");
    }
  }

  if (breakdownList) {
    if (!subscriptionState.breakdown.length) {
      breakdownList.innerHTML = '<li class="empty">Sin datos por estado</li>';
    } else {
      breakdownList.innerHTML = subscriptionState.breakdown
        .map(
          (item) => `
            <li>
              <span class="title">${escapeHtml(item.status)}</span>
              <span class="meta">${item.count} · ${formatCurrency(
            item.total_amount ?? 0
          )}</span>
            </li>
          `
        )
        .join("");
    }
  }

  if (suggestionList) {
    if (!subscriptionState.suggestions.length) {
      suggestionList.innerHTML =
        '<li class="empty">Sin recomendaciones generadas</li>';
    } else {
      suggestionList.innerHTML = subscriptionState.suggestions
        .map(
          (item) => `
            <li>
              <span class="title">${escapeHtml(item.label)}</span>
              <span class="meta">${escapeHtml(item.value)}</span>
            </li>
          `
        )
        .join("");
    }
  }
}

function getSubscriptionById(id) {
  if (!id) return null;
  return subscriptionState.subscriptions.find((item) => item.id === id) || null;
}

function buildSubscriptionFormFields(subscription = {}) {
  const clientOptions = [
    '<option value="">Sin cliente</option>',
    ...subscriptionState.clients.map(
      (client) =>
        `<option value="${client.id}" ${
          subscription.clientId === String(client.id) ? "selected" : ""
        }>${escapeHtml(client.name || "Cliente sin nombre")}</option>`
    ),
  ].join("");

  return `
    <div class="modal-form__grid">
      <label class="form-field">
        <span>Nombre *</span>
        <input type="text" name="name" value="${escapeHtml(
          subscription.name || ""
        )}" required />
      </label>
      <label class="form-field">
        <span>Cliente</span>
        <select name="clientId">
          ${clientOptions}
        </select>
      </label>
      <label class="form-field">
        <span>Importe (€) *</span>
        <input type="number" step="0.01" min="0" name="amount" value="${
          subscription.amount ?? ""
        }" required />
      </label>
      <label class="form-field">
        <span>Moneda</span>
        <input type="text" name="currency" value="${escapeHtml(
          subscription.currency || "EUR"
        )}" maxlength="5" />
      </label>
      <label class="form-field">
        <span>Ciclo</span>
        <select name="billingCycle">
          <option value="monthly" ${
            subscription.billingCycle === "monthly" ? "selected" : ""
          }>Mensual</option>
          <option value="quarterly" ${
            subscription.billingCycle === "quarterly" ? "selected" : ""
          }>Trimestral</option>
          <option value="yearly" ${
            subscription.billingCycle === "yearly" ? "selected" : ""
          }>Anual</option>
          <option value="custom" ${
            subscription.billingCycle === "custom" ? "selected" : ""
          }>Personalizado</option>
        </select>
      </label>
      <label class="form-field">
        <span>Inicio *</span>
        <input type="date" name="startDate" value="${
          subscription.startDate
            ? subscription.startDate.split("T")[0]
            : ""
        }" required />
      </label>
      <label class="form-field">
        <span>Próximo cobro *</span>
        <input type="date" name="nextBillingDate" value="${
          subscription.nextBillingDate
            ? subscription.nextBillingDate.split("T")[0]
            : ""
        }" required />
      </label>
      <label class="form-field">
        <span>Estado</span>
        <select name="status">
          <option value="active" ${
            subscription.status === "active" ? "selected" : ""
          }>Activa</option>
          <option value="paused" ${
            subscription.status === "paused" ? "selected" : ""
          }>Pausada</option>
          <option value="cancelled" ${
            subscription.status === "cancelled" ? "selected" : ""
          }>Cancelada</option>
        </select>
      </label>
      <label class="checkbox">
        <input type="checkbox" name="autoInvoice" ${
          subscription.autoInvoice !== false ? "checked" : ""
        } />
        <span>Generar factura automáticamente</span>
      </label>
      <label class="form-field form-field--wide">
        <span>Descripción</span>
        <textarea name="description" rows="3">${escapeHtml(
          subscription.description || ""
        )}</textarea>
      </label>
    </div>
  `;
}

function buildSubscriptionDetail(subscription) {
  if (!subscription) {
    return `
      <div style="display: grid; gap: 1rem;">
        <p style="margin: 0; font-size: 0.95rem; color: var(--text-secondary);">
          No se encontró la suscripción seleccionada.
        </p>
      </div>
    `;
  }

  const cycleLabel =
    subscription.billingCycle === "monthly"
      ? "Mensual"
      : subscription.billingCycle === "quarterly"
      ? "Trimestral"
      : subscription.billingCycle === "yearly"
      ? "Anual"
      : "Personalizado";

  return `
    <div style="display: grid; gap: 1.25rem;">
      <section style="display: grid; gap: 0.75rem;">
        <div>
          <h3 style="margin: 0; font-size: 1.1rem;">${escapeHtml(
            subscription.name
          )}</h3>
          <p style="margin: 0; color: var(--text-secondary);">
            ${escapeHtml(subscription.clientName || "Sin cliente asociado")}
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <span class="badge badge--${
            subscription.status === "active"
              ? "success"
              : subscription.status === "paused"
              ? "warning"
              : "danger"
          }">
            ${subscription.status === "active"
              ? "Activa"
              : subscription.status === "paused"
              ? "Pausada"
              : "Cancelada"}
          </span>
          <span class="badge badge--info">${cycleLabel}</span>
          <span class="badge badge--${
            subscription.autoInvoice ? "success" : "neutral"
          }">${subscription.autoInvoice ? "Auto facturación" : "Manual"}</span>
        </div>
      </section>
      <section style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
        <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem 1.25rem; background: var(--bg-secondary); display: grid; gap: 0.35rem;">
          <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); font-weight: 600;">Importe</span>
          <span style="font-size: 0.95rem; font-weight: 600;">${formatCurrency(
            subscription.amount ?? 0
          )}</span>
        </div>
        <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem 1.25rem; background: var(--bg-secondary); display: grid; gap: 0.35rem;">
          <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); font-weight: 600;">Moneda</span>
          <span style="font-size: 0.95rem; font-weight: 600;">${escapeHtml(
            subscription.currency || "EUR"
          )}</span>
        </div>
        <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem 1.25rem; background: var(--bg-secondary); display: grid; gap: 0.35rem;">
          <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); font-weight: 600;">Próximo cobro</span>
          <span style="font-size: 0.95rem; font-weight: 600;">${formatDate(
            subscription.nextBillingDate
          )}</span>
        </div>
        <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem 1.25rem; background: var(--bg-secondary); display: grid; gap: 0.35rem;">
          <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); font-weight: 600;">Inicio</span>
          <span style="font-size: 0.95rem; font-weight: 600;">${formatDate(
            subscription.startDate
          )}</span>
        </div>
      </section>
      <section style="display: grid; gap: 0.5rem;">
        <h3 style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">
          Descripción
        </h3>
        <p style="margin: 0; color: var(--text-primary); white-space: pre-wrap;">
          ${escapeHtml(subscription.description || "Sin descripción añadida")}
        </p>
      </section>
    </div>
  `;
}

function closeSubscriptionModal() {
  const modal = document.getElementById("subscription-modal");
  if (modal) modal.remove();
}

function openSubscriptionModal(mode, subscriptionId = null) {
  closeSubscriptionModal();
  const subscription = subscriptionId
    ? getSubscriptionById(String(subscriptionId))
    : null;

  if (mode !== "create" && !subscription && mode !== "create") {
    showToast("No se encontró la suscripción seleccionada", "warning");
    return;
  }

  if (mode === "view") {
    const detailHtml = buildSubscriptionDetail(subscription);
    const modalHtml = `
      <div class="modal is-open" id="subscription-modal">
        <div class="modal__backdrop" data-modal-close></div>
        <div class="modal__panel" style="width: min(95vw, 640px);">
          <header class="modal__head">
            <div>
              <h2 class="modal__title">Detalle de la suscripción</h2>
              <p class="modal__subtitle">${escapeHtml(
                subscription?.name || ""
              )}</p>
            </div>
            <button type="button" class="modal__close" data-modal-close aria-label="Cerrar">×</button>
          </header>
          <div class="modal__body" style="display: flex; flex-direction: column; gap: 1.5rem;">
            ${detailHtml}
          </div>
          <footer class="modal__footer modal-form__footer">
            <button type="button" class="btn-secondary" data-modal-close>Cerrar</button>
            <button type="button" class="btn-primary" data-modal-edit="${subscription?.id}">Editar</button>
          </footer>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modal = document.getElementById("subscription-modal");
    modal
      ?.querySelector(".modal__backdrop")
      ?.addEventListener("click", closeSubscriptionModal);
    modal
      ?.querySelectorAll("[data-modal-close]")
      .forEach((btn) => btn.addEventListener("click", closeSubscriptionModal));
    modal
      ?.querySelector("[data-modal-edit]")
      ?.addEventListener("click", (ev) => {
        const id = ev.currentTarget.dataset.modalEdit;
        closeSubscriptionModal();
        openSubscriptionModal("edit", id);
      });
    return;
  }

  const title =
    mode === "edit" ? "Editar suscripción" : "Nueva suscripción";
  const formId = "subscription-form";
  const formFields = buildSubscriptionFormFields(subscription || {});
  const modalHtml = `
    <div class="modal is-open" id="subscription-modal">
      <div class="modal__backdrop" data-modal-close></div>
      <div class="modal__panel" style="width: min(95vw, 720px);">
        <header class="modal__head">
          <div>
            <h2 class="modal__title">${title}</h2>
            <p class="modal__subtitle">Gestiona la facturación recurrente con toda la información clave.</p>
          </div>
          <button type="button" class="modal__close" data-modal-close aria-label="Cerrar">×</button>
        </header>
        <form class="modal__body" id="${formId}" data-form-type="subscription" data-subscription-id="${subscription?.id || ""}" novalidate>
          ${formFields}
        </form>
        <footer class="modal__footer modal-form__footer">
          <button type="button" class="btn-secondary" data-modal-close>Cancelar</button>
          <button type="submit" form="${formId}" class="btn-primary">${
            mode === "edit" ? "Guardar cambios" : "Crear suscripción"
          }</button>
        </footer>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);
  const modal = document.getElementById("subscription-modal");
  modal
    ?.querySelector(".modal__backdrop")
    ?.addEventListener("click", closeSubscriptionModal);
  modal
    ?.querySelectorAll("[data-modal-close]")
    .forEach((btn) => btn.addEventListener("click", closeSubscriptionModal));
  modal
    ?.querySelector("form")
    ?.addEventListener("submit", handleSubscriptionFormSubmit);
}

async function refreshSubscriptionsModule() {
  if (typeof window.api === "undefined") {
    setError("Servicio API no disponible. Comprueba la carga de api.js");
    return;
  }

  if (!window.api.isAuthenticated()) {
    setError("Inicia sesión para gestionar tus suscripciones.");
    return;
  }

  try {
    setLoading(true);
    setError(null);
    await Promise.all([
      loadSubscriptions(),
      loadSummary(),
      loadUpcoming(),
      loadBreakdown(),
      loadClients(),
    ]);
    buildSuggestions();
    renderSummary();
    renderSubscriptionsTable();
    renderInsights();
  } catch (error) {
    console.error("Error loading subscriptions module", error);
    setError("Ocurrió un problema al obtener las suscripciones.");
  } finally {
    setLoading(false);
  }
}

function handleClick(event) {
  const retryButton = event.target.closest(
    '[data-action="retry-subscriptions"]'
  );
  if (retryButton) {
    void refreshSubscriptionsModule();
    return;
  }

  const newButton = event.target.closest("[data-open-subscription]");
  if (newButton) {
    openSubscriptionModal("create");
    return;
  }

  if (event.target.closest("[data-modal-close]")) {
    closeSubscriptionModal();
    return;
  }

  const viewBtn = event.target.closest("[data-subscription-view]");
  if (viewBtn) {
    event.stopPropagation();
    openSubscriptionModal("view", viewBtn.dataset.subscriptionView);
    return;
  }

  const modalEditBtn = event.target.closest("[data-modal-edit]");
  if (modalEditBtn) {
    event.stopPropagation();
    const id = modalEditBtn.dataset.modalEdit;
    closeSubscriptionModal();
    openSubscriptionModal("edit", id);
    return;
  }

  const editBtn = event.target.closest("[data-subscription-edit]");
  if (editBtn) {
    event.stopPropagation();
    openSubscriptionModal("edit", editBtn.dataset.subscriptionEdit);
    return;
  }

  const deleteBtn = event.target.closest("[data-subscription-delete]");
  if (deleteBtn) {
    event.stopPropagation();
    void handleSubscriptionDelete(deleteBtn.dataset.subscriptionDelete);
    return;
  }

  const row = event.target.closest("[data-subscription-row]");
  if (row && !event.target.closest("button")) {
    openSubscriptionModal("view", row.dataset.subscriptionRow);
  }
}

function handleInput(event) {
  if (event.target.matches("[data-subscriptions-search]")) {
    subscriptionState.filters.search = event.target.value;
    debounce(() => void refreshSubscriptionsModule());
  }
}

function handleChange(event) {
  if (event.target.matches("[data-subscriptions-status]")) {
    subscriptionState.filters.status = event.target.value;
    void refreshSubscriptionsModule();
    return;
  }

  if (event.target.matches("[data-subscriptions-cycle]")) {
    subscriptionState.filters.billingCycle = event.target.value;
    void refreshSubscriptionsModule();
    return;
  }

  if (event.target.matches("[data-subscriptions-autoinvoice]")) {
    subscriptionState.filters.autoInvoice = event.target.value;
    void refreshSubscriptionsModule();
  }
}

async function handleSubscriptionFormSubmit(event) {
  event.preventDefault();
  const form = event.target.closest("form");
  if (!form) return;
  const data = new FormData(form);

  const payload = {
    name: data.get("name")?.toString().trim(),
    clientId: data.get("clientId") || undefined,
    amount: data.get("amount")
      ? Number.parseFloat(data.get("amount"))
      : undefined,
    currency: data.get("currency")?.toString().trim() || "EUR",
    billingCycle: data.get("billingCycle") || "monthly",
    startDate: data.get("startDate") || undefined,
    nextBillingDate: data.get("nextBillingDate") || undefined,
    status: data.get("status") || "active",
    autoInvoice: data.get("autoInvoice") === "on",
    description: data.get("description")?.toString().trim() || undefined,
  };

  const editingId = form.dataset.subscriptionId
    ? String(form.dataset.subscriptionId)
    : null;

  try {
    let response;
    if (editingId) {
      response = await window.api.updateSubscription(editingId, payload);
      showToast("Suscripción actualizada correctamente", "success");
    } else {
      response = await window.api.createSubscription(payload);
      showToast("Suscripción creada correctamente", "success");
    }
    closeSubscriptionModal();
    await refreshSubscriptionsModule();
  } catch (error) {
    console.error("Error saving subscription", error);
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
    console.error("Error deleting subscription", error);
    showToast("No se pudo eliminar la suscripción", "error");
  }
}

export function initSubscriptions() {
  const module = document.querySelector(".subscriptions");
  if (!module) return;

  module.addEventListener("click", handleClick);
  module.addEventListener("input", handleInput);
  module.addEventListener("change", handleChange);

  window.requestAnimationFrame(() => {
    void refreshSubscriptionsModule();
  });
}

export default function renderSubscriptions() {
  return `
    <section class="subscriptions" aria-labelledby="subscriptions-title">
      <header class="expenses__hero">
        <div class="expenses__hero-copy">
          <h1 id="subscriptions-title">Ingresos recurrentes</h1>
          <p>Controla las suscripciones, ciclos de facturación y cobros previstos sin salir de Flow.</p>
        </div>
        <div class="expenses__hero-actions">
          <button type="button" class="btn-primary" data-open-subscription>Nueva suscripción</button>
        </div>
      </header>

      <div class="summary-cards">
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-primary-light);">🔁</div>
          <div class="card-content">
            <span class="card-label">Suscripciones totales</span>
            <span class="card-value" id="subscriptions-total">0</span>
          </div>
        </article>
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-success-light);">✅</div>
          <div class="card-content">
            <span class="card-label">Activas</span>
            <span class="card-value" id="subscriptions-active">0</span>
          </div>
        </article>
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-warning-light);">⏸️</div>
          <div class="card-content">
            <span class="card-label">Pausadas</span>
            <span class="card-value" id="subscriptions-paused">0</span>
          </div>
        </article>
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-danger-light);">🛑</div>
          <div class="card-content">
            <span class="card-label">Canceladas</span>
            <span class="card-value" id="subscriptions-cancelled">0</span>
          </div>
        </article>
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-tertiary-light);">💶</div>
          <div class="card-content">
            <span class="card-label">MRR estimado</span>
            <span class="card-value" id="subscriptions-mrr">€0</span>
            <span class="card-trend">Ingresos mensuales</span>
          </div>
        </article>
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-info-light);">📅</div>
          <div class="card-content">
            <span class="card-label">Cobros próximos</span>
            <span class="card-value" id="subscriptions-cashflow">€0</span>
            <span class="card-trend">30 días</span>
          </div>
        </article>
      </div>

      <section class="expenses__filters" aria-label="Filtros de suscripciones">
        <div class="expenses__filters-group">
          <label class="visually-hidden" for="subscription-search">Buscar suscripciones</label>
          <input type="search" id="subscription-search" class="expenses__search" placeholder="Nombre, descripción o cliente..." autocomplete="off" data-subscriptions-search />
        </div>
        <div class="expenses__filters-group">
          <label class="visually-hidden" for="subscription-status-filter">Estado</label>
          <select id="subscription-status-filter" class="expenses__select" data-subscriptions-status>
            <option value="all">Todos los estados</option>
            <option value="active">Activa</option>
            <option value="paused">Pausada</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>
        <div class="expenses__filters-group">
          <label class="visually-hidden" for="subscription-cycle-filter">Ciclo</label>
          <select id="subscription-cycle-filter" class="expenses__select" data-subscriptions-cycle>
            <option value="all">Todos los ciclos</option>
            <option value="monthly">Mensual</option>
            <option value="quarterly">Trimestral</option>
            <option value="yearly">Anual</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
        <div class="expenses__filters-group">
          <label class="visually-hidden" for="subscription-autoinvoice-filter">Auto facturación</label>
          <select id="subscription-autoinvoice-filter" class="expenses__select" data-subscriptions-autoinvoice>
            <option value="all">Todas</option>
            <option value="true">Automáticas</option>
            <option value="false">Manuales</option>
          </select>
        </div>
        <div class="expenses__filters-group expenses__filters-group--pinned">
          <button type="button" class="btn-ghost" data-action="retry-subscriptions">Recargar</button>
        </div>
      </section>

      <section class="expenses-table" aria-label="Listado de suscripciones">
        <div class="expenses-table__surface">
          <table>
            <thead>
              <tr>
                <th scope="col">Servicio</th>
                <th scope="col">Cliente</th>
                <th scope="col">Ciclo</th>
                <th scope="col">Próximo cobro</th>
                <th scope="col">Importe</th>
                <th scope="col">Auto-Fact.</th>
                <th scope="col">Estado</th>
                <th scope="col"><span class="visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody data-subscriptions-table>
              <tr>
                <td colspan="8" class="empty-state">Cargando suscripciones...</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="module-loading" data-subscriptions-loading hidden>
          <span class="spinner"></span>
          <p>Cargando suscripciones...</p>
        </div>
        <div class="module-error" data-subscriptions-error hidden></div>
      </section>

      <section class="subscriptions-insights" aria-label="Indicadores de suscripciones" style="display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
        <article class="card" style="padding: 1.5rem;">
          <h3 style="margin-top: 0;">Próximos cobros</h3>
          <ul class="insight-list" data-upcoming-subscriptions></ul>
        </article>
        <article class="card" style="padding: 1.5rem;">
          <h3 style="margin-top: 0;">Distribución por estado</h3>
          <ul class="insight-list" data-status-breakdown></ul>
        </article>
        <article class="card" style="padding: 1.5rem;">
          <h3 style="margin-top: 0;">Recomendaciones</h3>
          <ul class="insight-list" data-subscription-suggestions></ul>
        </article>
      </section>
    </section>
  `;
}
