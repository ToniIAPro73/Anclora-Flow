const sidebarViews = {
  DETAIL: 'detail',
  FORM: 'form',
  EMPTY: 'empty',
};

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
    search: '',
    status: 'all',
    billingCycle: 'all',
    autoInvoice: 'all',
  },
  selectedId: null,
  sidebarView: sidebarViews.DETAIL,
  editingId: null,
  loading: false,
  error: null,
};

const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

function formatCurrency(value) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) return currencyFormatter.format(0);
  return currencyFormatter.format(parsed);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let debounceTimer = null;
function debounce(callback, delay = 320) {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(callback, delay);
}

function setLoading(isLoading) {
  subscriptionState.loading = isLoading;
  const spinner = document.querySelector('[data-subscriptions-loading]');
  if (spinner) spinner.hidden = !isLoading;
}

function setError(message) {
  subscriptionState.error = message;
  const box = document.querySelector('[data-subscriptions-error]');
  if (!box) return;
  if (!message) {
    box.hidden = true;
    box.innerHTML = '';
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

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `notification notification--${type}`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button type="button" class="notification__close" aria-label="Cerrar">×</button>
  `;
  toast.querySelector('.notification__close').addEventListener('click', () => toast.remove());
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

function ensureSelection() {
  if (subscriptionState.subscriptions.length) {
    if (
      !subscriptionState.selectedId ||
      !subscriptionState.subscriptions.some((item) => item.id === subscriptionState.selectedId)
    ) {
      subscriptionState.selectedId = subscriptionState.subscriptions[0].id;
    }
    if (subscriptionState.sidebarView === sidebarViews.EMPTY) {
      subscriptionState.sidebarView = sidebarViews.DETAIL;
    }
  } else {
    subscriptionState.selectedId = null;
    if (
      subscriptionState.sidebarView === sidebarViews.DETAIL ||
      subscriptionState.sidebarView === sidebarViews.FORM
    ) {
      subscriptionState.sidebarView = sidebarViews.EMPTY;
    }
  }
}

async function loadSubscriptions() {
  const response = await window.api.getSubscriptions({
    search: subscriptionState.filters.search || undefined,
    status: subscriptionState.filters.status !== 'all' ? subscriptionState.filters.status : undefined,
    billingCycle:
      subscriptionState.filters.billingCycle !== 'all'
        ? subscriptionState.filters.billingCycle
        : undefined,
    autoInvoice:
      subscriptionState.filters.autoInvoice !== 'all'
        ? subscriptionState.filters.autoInvoice === 'true'
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
    currency: item.currency || 'EUR',
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
  const active = subscriptionState.subscriptions.filter((item) => item.status === 'active');
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
      type: 'upcoming',
      label: `Cobro próximo ${formatDate(item.next_billing_date || item.nextBillingDate)}`,
      value: `${escapeHtml(item.name)} · ${formatCurrency(item.amount ?? 0)}`,
    })),
    ...highest.map((item) => ({
      type: 'high',
      label: 'Alta facturación recurrente',
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
  const total = document.getElementById('subscriptions-total');
  const active = document.getElementById('subscriptions-active');
  const paused = document.getElementById('subscriptions-paused');
  const cancelled = document.getElementById('subscriptions-cancelled');
  const mrr = document.getElementById('subscriptions-mrr');
  const cashflow = document.getElementById('subscriptions-cashflow');

  if (total) total.textContent = summary.total_subscriptions ?? 0;
  if (active) active.textContent = summary.active_subscriptions ?? 0;
  if (paused) paused.textContent = summary.paused_subscriptions ?? 0;
  if (cancelled) cancelled.textContent = summary.cancelled_subscriptions ?? 0;
  if (mrr) mrr.textContent = formatCurrency(summary.monthly_recurring_revenue ?? 0);
  if (cashflow) cashflow.textContent = formatCurrency(summary.next_30_days_revenue ?? 0);
}

function renderSubscriptionsTable() {
  const tbody = document.querySelector('[data-subscriptions-table]');
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
      const isSelected = sub.id === subscriptionState.selectedId;
      const statusBadge =
        sub.status === 'active'
          ? 'success'
          : sub.status === 'paused'
          ? 'warning'
          : 'danger';
      return `
        <tr data-subscription-row="${sub.id}" class="${isSelected ? 'is-selected' : ''}">
          <td>
            <div class="table-cell--main">
              <strong>${escapeHtml(sub.name)}</strong>
              <span>${escapeHtml(sub.description || 'Sin descripción')}</span>
            </div>
          </td>
          <td>${escapeHtml(sub.clientName || 'Sin cliente')}</td>
          <td>
            <span class="badge badge--info">
              ${
                sub.billingCycle === 'monthly'
                  ? 'Mensual'
                  : sub.billingCycle === 'quarterly'
                  ? 'Trimestral'
                  : sub.billingCycle === 'yearly'
                  ? 'Anual'
                  : 'Personalizado'
              }
            </span>
          </td>
          <td>
            <span>${formatDate(sub.nextBillingDate)}</span>
            <span class="meta">${formatDate(sub.startDate)}</span>
          </td>
          <td>
            <strong>${formatCurrency(sub.amount ?? 0)}</strong>
            <span class="meta">${escapeHtml(sub.currency || 'EUR')}</span>
          </td>
          <td>
            <span class="badge badge--${sub.autoInvoice ? 'success' : 'neutral'}">
              ${sub.autoInvoice ? 'Automática' : 'Manual'}
            </span>
          </td>
          <td>
            <span class="badge badge--${statusBadge}">
              ${sub.status === 'active' ? 'Activa' : sub.status === 'paused' ? 'Pausada' : 'Cancelada'}
            </span>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-icon" data-subscription-edit="${sub.id}" aria-label="Editar">✏️</button>
              <button type="button" class="btn-icon btn-icon--danger" data-subscription-delete="${sub.id}" aria-label="Eliminar">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderInsights() {
  const upcomingList = document.querySelector('[data-upcoming-subscriptions]');
  const breakdownList = document.querySelector('[data-status-breakdown]');
  const suggestionList = document.querySelector('[data-subscription-suggestions]');

  if (upcomingList) {
    if (!subscriptionState.upcoming.length) {
      upcomingList.innerHTML = '<li class="empty">Sin cobros próximos</li>';
    } else {
      upcomingList.innerHTML = subscriptionState.upcoming
        .map(
          (item) => `
            <li>
              <span class="title">${escapeHtml(item.name)}</span>
              <span class="meta">${formatDate(item.next_billing_date || item.nextBillingDate)} · ${formatCurrency(item.amount ?? 0)}</span>
            </li>
          `
        )
        .join('');
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
              <span class="meta">${item.count} · ${formatCurrency(item.total_amount ?? 0)}</span>
            </li>
          `
        )
        .join('');
    }
  }

  if (suggestionList) {
    if (!subscriptionState.suggestions.length) {
      suggestionList.innerHTML = '<li class="empty">Sin recomendaciones generadas</li>';
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
        .join('');
    }
  }
}

function buildSubscriptionFormHTML(subscription = {}) {
  const clientOptions = [
    '<option value="">Sin cliente</option>',
    ...subscriptionState.clients.map(
      (client) =>
        `<option value="${client.id}" ${
          subscription.clientId === client.id ? 'selected' : ''
        }>${escapeHtml(client.name)}</option>`
    ),
  ].join('');

  return `
    <form class="sidebar-form" data-form-type="subscription">
      <header class="sidebar-form__header">
        <h3>${subscription.id ? 'Editar suscripción' : 'Nueva suscripción'}</h3>
        <button type="button" class="btn-ghost" data-action="cancel-form">Cancelar</button>
      </header>
      <div class="form-grid">
        <label>
          <span>Nombre *</span>
          <input type="text" name="name" value="${escapeHtml(subscription.name || '')}" required />
        </label>
        <label>
          <span>Cliente</span>
          <select name="clientId">
            ${clientOptions}
          </select>
        </label>
        <label>
          <span>Importe (€)</span>
          <input type="number" min="0" step="0.01" name="amount" value="${subscription.amount != null ? subscription.amount : ''}" required />
        </label>
        <label>
          <span>Moneda</span>
          <input type="text" name="currency" value="${escapeHtml(subscription.currency || 'EUR')}" maxlength="5" />
        </label>
        <label>
          <span>Ciclo</span>
          <select name="billingCycle">
            <option value="monthly" ${subscription.billingCycle === 'monthly' ? 'selected' : ''}>Mensual</option>
            <option value="quarterly" ${subscription.billingCycle === 'quarterly' ? 'selected' : ''}>Trimestral</option>
            <option value="yearly" ${subscription.billingCycle === 'yearly' ? 'selected' : ''}>Anual</option>
            <option value="custom" ${subscription.billingCycle === 'custom' ? 'selected' : ''}>Personalizado</option>
          </select>
        </label>
        <label>
          <span>Inicio</span>
          <input type="date" name="startDate" value="${subscription.startDate ? subscription.startDate.split('T')[0] : ''}" required />
        </label>
        <label>
          <span>Próximo cobro</span>
          <input type="date" name="nextBillingDate" value="${subscription.nextBillingDate ? subscription.nextBillingDate.split('T')[0] : ''}" required />
        </label>
        <label>
          <span>Estado</span>
          <select name="status">
            <option value="active" ${subscription.status === 'active' ? 'selected' : ''}>Activa</option>
            <option value="paused" ${subscription.status === 'paused' ? 'selected' : ''}>Pausada</option>
            <option value="cancelled" ${subscription.status === 'cancelled' ? 'selected' : ''}>Cancelada</option>
          </select>
        </label>
        <label class="checkbox">
          <input type="checkbox" name="autoInvoice" ${subscription.autoInvoice !== false ? 'checked' : ''} />
          <span>Generar factura automáticamente</span>
        </label>
        <label class="wide">
          <span>Descripción</span>
          <textarea name="description" rows="3">${escapeHtml(subscription.description || '')}</textarea>
        </label>
      </div>
      <footer class="sidebar-form__footer">
        <button type="submit" class="btn btn-primary">${subscription.id ? 'Guardar cambios' : 'Crear suscripción'}</button>
      </footer>
    </form>
  `;
}

function buildSubscriptionDetailHTML(subscription) {
  if (!subscription) {
    return `
      <div class="sidebar-empty">
        <span class="sidebar-empty__icon">🔁</span>
        <p>Selecciona una suscripción para revisar sus detalles.</p>
      </div>
    `;
  }

  const statusBadge =
    subscription.status === 'active'
      ? 'success'
      : subscription.status === 'paused'
      ? 'warning'
      : 'danger';

  return `
    <article class="sidebar-card">
      <header class="sidebar-card__header">
        <div>
          <h3>${escapeHtml(subscription.name)}</h3>
          <p>${escapeHtml(subscription.clientName || 'Sin cliente asociado')}</p>
        </div>
        <span class="badge badge--${statusBadge}">
          ${subscription.status === 'active' ? 'Activa' : subscription.status === 'paused' ? 'Pausada' : 'Cancelada'}
        </span>
      </header>
      <dl class="detail-grid">
        <div>
          <dt>Importe</dt>
          <dd>${formatCurrency(subscription.amount ?? 0)}</dd>
        </div>
        <div>
          <dt>Moneda</dt>
          <dd>${escapeHtml(subscription.currency || 'EUR')}</dd>
        </div>
        <div>
          <dt>Ciclo</dt>
          <dd>${
            subscription.billingCycle === 'monthly'
              ? 'Mensual'
              : subscription.billingCycle === 'quarterly'
              ? 'Trimestral'
              : subscription.billingCycle === 'yearly'
              ? 'Anual'
              : 'Personalizado'
          }</dd>
        </div>
        <div>
          <dt>Próximo cobro</dt>
          <dd>${formatDate(subscription.nextBillingDate)}</dd>
        </div>
        <div>
          <dt>Inicio</dt>
          <dd>${formatDate(subscription.startDate)}</dd>
        </div>
        <div>
          <dt>Auto facturación</dt>
          <dd>${subscription.autoInvoice ? 'Automática' : 'Manual'}</dd>
        </div>
      </dl>
      <footer class="sidebar-card__footer">
        <button type="button" class="btn btn-secondary" data-subscription-edit="${subscription.id}">
          Editar suscripción
        </button>
      </footer>
    </article>
  `;
}

function renderSidebar() {
  const container = document.querySelector('[data-subscriptions-sidebar]');
  if (!container) return;

  let html = '';

  if (subscriptionState.sidebarView === sidebarViews.EMPTY) {
    html = `
      <div class="sidebar-empty">
        <span class="sidebar-empty__icon">🔁</span>
        <p>No hay suscripciones registradas.</p>
        <button type="button" class="btn btn-primary" data-open-subscription>Crear suscripción</button>
      </div>
    `;
  } else if (subscriptionState.sidebarView === sidebarViews.FORM) {
    const subscription =
      subscriptionState.editingId &&
      subscriptionState.subscriptions.find((item) => item.id === subscriptionState.editingId);
    html = buildSubscriptionFormHTML(subscription || {});
  } else {
    const subscription = subscriptionState.subscriptions.find(
      (item) => item.id === subscriptionState.selectedId
    );
    html = buildSubscriptionDetailHTML(subscription);
  }

  container.innerHTML = html;
}

async function refreshSubscriptionsModule() {
  if (typeof window.api === 'undefined') {
    setError('Servicio API no disponible. Comprueba la carga de api.js');
    return;
  }

  if (!window.api.isAuthenticated()) {
    setError('Inicia sesión para gestionar tus suscripciones.');
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
    ensureSelection();
    renderSummary();
    renderSubscriptionsTable();
    renderInsights();
    renderSidebar();
  } catch (error) {
    console.error('Error loading subscriptions module', error);
    setError('Ocurrió un problema al obtener las suscripciones.');
  } finally {
    setLoading(false);
  }
}

function handleClick(event) {
  const retryButton = event.target.closest('[data-action="retry-subscriptions"]');
  if (retryButton) {
    void refreshSubscriptionsModule();
    return;
  }

  const newButton = event.target.closest('[data-open-subscription]');
  if (newButton) {
    subscriptionState.editingId = null;
    subscriptionState.sidebarView = sidebarViews.FORM;
    renderSidebar();
    return;
  }

  const cancelBtn = event.target.closest('[data-action="cancel-form"]');
  if (cancelBtn) {
    subscriptionState.editingId = null;
    subscriptionState.sidebarView = subscriptionState.subscriptions.length
      ? sidebarViews.DETAIL
      : sidebarViews.EMPTY;
    renderSidebar();
    return;
  }

  const editBtn = event.target.closest('[data-subscription-edit]');
  if (editBtn) {
    event.stopPropagation();
    subscriptionState.editingId = String(editBtn.dataset.subscriptionEdit);
    subscriptionState.sidebarView = sidebarViews.FORM;
    renderSidebar();
    return;
  }

  const deleteBtn = event.target.closest('[data-subscription-delete]');
  if (deleteBtn) {
    event.stopPropagation();
    void handleSubscriptionDelete(deleteBtn.dataset.subscriptionDelete);
    return;
  }

  const row = event.target.closest('[data-subscription-row]');
  if (row) {
    subscriptionState.selectedId = String(row.dataset.subscriptionRow);
    subscriptionState.sidebarView = sidebarViews.DETAIL;
    renderSubscriptionsTable();
    renderSidebar();
  }
}

function handleInput(event) {
  if (event.target.matches('[data-subscriptions-search]')) {
    subscriptionState.filters.search = event.target.value;
    debounce(() => void refreshSubscriptionsModule());
  }
}

function handleChange(event) {
  if (event.target.matches('[data-subscriptions-status]')) {
    subscriptionState.filters.status = event.target.value;
    void refreshSubscriptionsModule();
    return;
  }

  if (event.target.matches('[data-subscriptions-cycle]')) {
    subscriptionState.filters.billingCycle = event.target.value;
    void refreshSubscriptionsModule();
    return;
  }

  if (event.target.matches('[data-subscriptions-autoinvoice]')) {
    subscriptionState.filters.autoInvoice = event.target.value;
    void refreshSubscriptionsModule();
  }
}

async function handleSubscriptionFormSubmit(event) {
  event.preventDefault();
  const form = event.target.closest('form');
  if (!form) return;
  const data = new FormData(form);

  const payload = {
    name: data.get('name')?.toString().trim(),
    clientId: data.get('clientId') || undefined,
    amount: data.get('amount') ? Number.parseFloat(data.get('amount')) : undefined,
    currency: data.get('currency')?.toString().trim() || 'EUR',
    billingCycle: data.get('billingCycle') || 'monthly',
    startDate: data.get('startDate') || undefined,
    nextBillingDate: data.get('nextBillingDate') || undefined,
    status: data.get('status') || 'active',
    autoInvoice: data.get('autoInvoice') === 'on',
    description: data.get('description')?.toString().trim() || undefined,
  };

  const editingId = subscriptionState.editingId;

  try {
    let response;
    if (editingId) {
      response = await window.api.updateSubscription(editingId, payload);
      subscriptionState.selectedId = String(editingId);
      showToast('Suscripción actualizada correctamente', 'success');
    } else {
      response = await window.api.createSubscription(payload);
      if (response?.id) {
        subscriptionState.selectedId = String(response.id);
      }
      showToast('Suscripción creada correctamente', 'success');
    }
    subscriptionState.editingId = null;
    subscriptionState.sidebarView = sidebarViews.DETAIL;
    await refreshSubscriptionsModule();
  } catch (error) {
    console.error('Error saving subscription', error);
    showToast('No se pudo guardar la suscripción', 'error');
  }
}

function handleSubmit(event) {
  if (event.target.matches('[data-form-type="subscription"]')) {
    void handleSubscriptionFormSubmit(event);
  }
}

async function handleSubscriptionDelete(id) {
  if (!window.confirm('¿Seguro que deseas eliminar esta suscripción?')) return;
  try {
    await window.api.deleteSubscription(id);
    showToast('Suscripción eliminada', 'success');
    if (subscriptionState.selectedId === id) {
      subscriptionState.selectedId = null;
    }
    await refreshSubscriptionsModule();
  } catch (error) {
    console.error('Error deleting subscription', error);
    showToast('No se pudo eliminar la suscripción', 'error');
  }
}



export function initSubscriptions() {
  const module = document.querySelector('.subscriptions-module');
  if (!module) return;

  module.addEventListener('click', handleClick);
  module.addEventListener('input', handleInput);
  module.addEventListener('change', handleChange);
  module.addEventListener('submit', handleSubmit);

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
          <button type="button" class="btn btn-primary" data-open-subscription>＋ Nueva suscripción</button>
        </div>
      </header>
      <div class="summary-wrap">
        <div class="summary-grid summary-grid--compact">
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-primary-light);">🔁</div>
            <div class="card-content">
              <span class="card-label">Suscripciones totales</span>
              <span class="card-value" id="subscriptions-total">0</span>
            </div>
          </article>
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-success-light);">✅</div>
            <div class="card-content">
              <span class="card-label">Activas</span>
              <span class="card-value" id="subscriptions-active">0</span>
            </div>
          </article>
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-warning-light);">⏸️</div>
            <div class="card-content">
              <span class="card-label">Pausadas</span>
              <span class="card-value" id="subscriptions-paused">0</span>
            </div>
          </article>
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-danger-light);">🛑</div>
            <div class="card-content">
              <span class="card-label">Canceladas</span>
              <span class="card-value" id="subscriptions-cancelled">0</span>
            </div>
          </article>
        </div>
        <div class="summary-grid summary-grid--compact">
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-tertiary-light);">💶</div>
            <div class="card-content">
              <span class="card-label">MRR estimado</span>
              <span class="card-value" id="subscriptions-mrr">€0</span>
            </div>
          </article>
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-info-light);">📅</div>
            <div class="card-content">
              <span class="card-label">Cobros próximos</span>
              <span class="card-value" id="subscriptions-cashflow">€0</span>
            </div>
          </article>
        </div>
      </div>
      <div class="module-body module-body--split">
        <div class="module-main">
          <div class="module-toolbar">
            <label class="input input--search">
              <span class="input__icon">🔍</span>
              <input type="search" data-subscriptions-search placeholder="Buscar por nombre o descripción..." autocomplete="off" />
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
          <div class="table-wrapper">
            <table class="data-table data-table--compact">
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
        <aside class="module-sidebar" data-subscriptions-sidebar></aside>
      </div>
      <footer class="module-footer">
        <section>
          <h4>Próximos cobros</h4>
          <ul class="insight-list" data-upcoming-subscriptions></ul>
        </section>
        <section>
          <h4>Distribución por estado</h4>
          <ul class="insight-list" data-status-breakdown></ul>
        </section>
        <section>
          <h4>Recomendaciones</h4>
          <ul class="insight-list" data-subscription-suggestions></ul>
        </section>
      </footer>
    </section>
  `;
}
