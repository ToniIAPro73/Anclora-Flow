/**
 * GESTIÓN DE SUSCRIPCIONES - VISTA DUAL
 * 
 * Pestaña 1: MIS GASTOS - Servicios que YO PAGO (GitHub, Adobe, etc.)
 * Pestaña 2: MIS INGRESOS - Clientes que ME PAGAN (planes de suscripción)
 */

// ==========================================
// ESTADO GLOBAL
// =========================================
const subscriptionState = {
  activeTab: 'expenses', // 'expenses' o 'revenue'
  
  // Mis gastos (subscriptions)
  mySubscriptions: [],
  mySubscriptionsSummary: {
    total: 0,
    active: 0,
    trial: 0,
    monthly_cost: 0,
    trials_expiring_soon: 0
  },
  
  // Mis ingresos (customer_subscriptions)
  customerSubscriptions: [],
  customerSubscriptionsSummary: {
    total: 0,
    active: 0,
    trial: 0,
    mrr: 0,
    arr: 0,
    trials_expiring_soon: 0
  },
  
  filters: {
    expenses: { search: '', status: 'all', category: 'all' },
    revenue: { search: '', status: 'all', plan: 'all' }
  },
  
  loading: false,
  error: null
};

const PAGE_SIZE = 10;
const EXPENSE_COLUMNS = {
  service_name: "Servicio",
  provider: "Proveedor",
  category: "Categoría",
  amount: "Importe",
  billing_frequency: "Frecuencia",
  next_billing_date: "Próximo cargo",
  status: "Estado",
  trial: "Trial",
  actions: "Acciones",
};

const REVENUE_COLUMNS = {
  client: "Cliente",
  plan: "Plan",
  amount: "Importe",
  billing_frequency: "Frecuencia",
  next_billing_date: "Próx. factura",
  status: "Estado",
  trial: "Trial",
  total_revenue: "Revenue total",
  actions: "Acciones",
};

const REQUIRED_EXPENSE_COLUMNS = ["service_name", "amount", "actions"];
const REQUIRED_REVENUE_COLUMNS = ["client", "plan", "amount", "actions"];
const COLUMN_STORAGE_KEYS = {
  expenses: "subscriptions_expenses_columns",
  revenue: "subscriptions_revenue_columns",
};
const DEFAULT_EXPENSE_COLUMNS = {
  service_name: true,
  provider: true,
  category: true,
  amount: true,
  billing_frequency: false,
  next_billing_date: false,
  status: true,
  trial: false,
  actions: true,
};

const DEFAULT_REVENUE_COLUMNS = {
  client: true,
  plan: true,
  amount: true,
  billing_frequency: false,
  next_billing_date: false,
  status: true,
  trial: false,
  total_revenue: false,
  actions: true,
};

let expensesPage = 1;
let revenuePage = 1;
let selectedExpenseId = null;
let selectedRevenueId = null;
let visibleExpenseColumns = null;
let visibleRevenueColumns = null;

// ==========================================
// UTILIDADES
// ==========================================
// Custom formatter that FORCES thousands separator with dot
function formatCurrency(value) {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return '0,00 €';
  const fixed = parsed.toFixed(2);
  const [integer, decimal] = fixed.split('.');
  const withSeparator = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${withSeparator},${decimal} €`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
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

function showNotification(message, type = 'info') {
  // Implementación simplificada - usar sistema de notificaciones global si existe
  console.log(`[${type.toUpperCase()}]`, message);
  
  const toast = document.createElement('div');
  toast.className = `notification notification--${type}`;
  toast.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; padding: 1rem 1.5rem; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <span>${escapeHtml(message)}</span>
      <button type="button" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
    </div>
  `;
  
  document.body.appendChild(toast);
  toast.querySelector('button').addEventListener('click', () => toast.remove());
  
  setTimeout(() => toast.remove(), 5000);
}

function loadColumnConfig(storageKey, defaults) {
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.warn('Column config parse error:', error);
    }
  }
  return { ...defaults };
}

function saveColumnConfig(storageKey, config) {
  localStorage.setItem(storageKey, JSON.stringify(config));
}

function getVisibleColumns(columnsMap, visibilityConfig) {
  return Object.keys(columnsMap).filter((key) => visibilityConfig[key]);
}

// ==========================================
// CARGA DE DATOS
// ==========================================
async function loadMySubscriptions() {
  try {
    const response = await window.api.getSubscriptions({ type: 'expenses' });
    
    subscriptionState.mySubscriptions = response.subscriptions || [];
    subscriptionState.mySubscriptionsSummary = calculateExpensesSummary(subscriptionState.mySubscriptions);
    
    renderExpensesTab();
  } catch (error) {
    console.error('Error loading my subscriptions:', error);
    showNotification('Error al cargar tus suscripciones de gastos', 'error');
  }
}

async function loadCustomerSubscriptions() {
  try {
    const response = await window.api.getCustomerSubscriptions();
    
    subscriptionState.customerSubscriptions = response.subscriptions || [];
    subscriptionState.customerSubscriptionsSummary = calculateRevenueSummary(subscriptionState.customerSubscriptions);
    
    renderRevenueTab();
  } catch (error) {
    console.error('Error loading customer subscriptions:', error);
    showNotification('Error al cargar suscripciones de clientes', 'error');
  }
}

function calculateExpensesSummary(subscriptions) {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    trial: subscriptions.filter(s => s.status === 'trial').length,
    monthly_cost: subscriptions
      .filter(s => s.status === 'active' || s.status === 'trial')
      .reduce((sum, s) => {
        if (s.billing_frequency === 'monthly') return sum + parseFloat(s.amount);
        if (s.billing_frequency === 'quarterly') return sum + (parseFloat(s.amount) / 3);
        if (s.billing_frequency === 'yearly') return sum + (parseFloat(s.amount) / 12);
        return sum;
      }, 0),
    trials_expiring_soon: subscriptions.filter(s => {
      if (s.status !== 'trial' || !s.trial_end_date) return false;
      const endDate = new Date(s.trial_end_date);
      return endDate <= in7Days;
    }).length
  };
}

function calculateRevenueSummary(subscriptions) {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const activeSubs = subscriptions.filter(s => s.status === 'active' || s.status === 'trial');
  
  const mrr = activeSubs.reduce((sum, s) => {
    if (s.billing_frequency === 'monthly') return sum + parseFloat(s.amount);
    if (s.billing_frequency === 'quarterly') return sum + (parseFloat(s.amount) / 3);
    if (s.billing_frequency === 'yearly') return sum + (parseFloat(s.amount) / 12);
    return sum;
  }, 0);
  
  return {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    trial: subscriptions.filter(s => s.status === 'trial').length,
    mrr: mrr,
    arr: mrr * 12,
    trials_expiring_soon: subscriptions.filter(s => {
      if (s.status !== 'trial' || !s.trial_end_date) return false;
      const endDate = new Date(s.trial_end_date);
      return endDate <= in7Days;
    }).length
  };
}

// ==========================================
// RENDERIZADO - TABS
// ==========================================
function switchTab(tab) {
  subscriptionState.activeTab = tab;
  
  // Actualizar UI de tabs
  document.querySelectorAll('[data-tab]').forEach(tabEl => {
    if (tabEl.dataset.tab === tab) {
      tabEl.classList.add('is-active');
      tabEl.setAttribute("aria-selected", "true");
    } else {
      tabEl.classList.remove('is-active');
      tabEl.setAttribute("aria-selected", "false");
    }
  });
  
  // Mostrar/ocultar contenido
  document.querySelectorAll('[data-tab-content]').forEach(content => {
    if (content.dataset.tabContent === tab) {
      content.style.display = 'block';
    } else {
      content.style.display = 'none';
    }
  });
  
  // Cargar datos si es necesario
  if (tab === 'expenses' && subscriptionState.mySubscriptions.length === 0) {
    loadMySubscriptions();
  } else if (tab === 'revenue' && subscriptionState.customerSubscriptions.length === 0) {
    loadCustomerSubscriptions();
  }

  if (tab === "expenses" && subscriptionState.mySubscriptions.length > 0) {
    renderExpensesTable();
  }
  if (tab === "revenue" && subscriptionState.customerSubscriptions.length > 0) {
    renderRevenueTable();
  }
}

// ==========================================
// RENDERIZADO - TAB DE GASTOS
// ==========================================
function renderExpensesTab() {
  const summary = subscriptionState.mySubscriptionsSummary;
  const subscriptions = subscriptionState.mySubscriptions;
  
  // Update summary cards
  const totalCount = document.getElementById('expenses-total-count');
  const activeCount = document.getElementById('expenses-active-count');
  const monthlyCost = document.getElementById('expenses-monthly-cost');
  const approxCost = document.getElementById('expenses-approx-cost');
  
  if (totalCount) totalCount.textContent = summary.total || '0';
  if (activeCount) activeCount.textContent = summary.active || '0';
  if (monthlyCost) monthlyCost.textContent = formatCurrency(summary.monthly_cost || 0);
  if (approxCost) approxCost.textContent = formatCurrency(summary.monthly_cost || 0);
  
  // Update badge counts
  const expensesBadge = document.querySelector('[data-expenses-count]');
  if (expensesBadge) expensesBadge.textContent = summary.total || '0';
  
  renderExpensesTable();
}

// ==========================================
// RENDERIZADO - TAB DE INGRESOS
// ==========================================
function renderRevenueTab() {
  const summary = subscriptionState.customerSubscriptionsSummary;
  const subscriptions = subscriptionState.customerSubscriptions;
  
  // Update summary cards
  const totalCount = document.getElementById('revenue-total-count');
  const activeCount = document.getElementById('revenue-active-count');
  const mrr = document.getElementById('revenue-mrr');
  const arr = document.getElementById('revenue-arr');
  
  if (totalCount) totalCount.textContent = summary.total || '0';
  if (activeCount) activeCount.textContent = summary.active || '0';
  if (mrr) mrr.textContent = formatCurrency(summary.mrr || 0);
  if (arr) arr.textContent = formatCurrency(summary.arr || 0);
  
  // Update badge counts
  const revenueBadge = document.querySelector('[data-revenue-count]');
  if (revenueBadge) revenueBadge.textContent = summary.total || '0';
  
  renderRevenueTable();
}

function ensureRequiredColumns(visibility, required) {
  required.forEach((key) => {
    visibility[key] = true;
  });
}

function getFilteredExpenses() {
  const { search, status, category } = subscriptionState.filters.expenses;
  const term = search.trim().toLowerCase();
  return subscriptionState.mySubscriptions.filter((sub) => {
    const matchesSearch =
      !term ||
      sub.service_name?.toLowerCase().includes(term) ||
      sub.provider?.toLowerCase().includes(term) ||
      (sub.category || "").toLowerCase().includes(term);
    const matchesStatus = status === "all" || sub.status === status;
    const matchesCategory =
      category === "all" || (sub.category || "") === category;
    return matchesSearch && matchesStatus && matchesCategory;
  });
}

function getFilteredRevenue() {
  const { search, status, plan } = subscriptionState.filters.revenue;
  const term = search.trim().toLowerCase();
  return subscriptionState.customerSubscriptions.filter((sub) => {
    const matchesSearch =
      !term ||
      sub.client_name?.toLowerCase().includes(term) ||
      sub.plan_name?.toLowerCase().includes(term) ||
      sub.plan_code?.toLowerCase().includes(term);
    const matchesStatus = status === "all" || sub.status === status;
    const matchesPlan = plan === "all" || sub.plan_code === plan;
    return matchesSearch && matchesStatus && matchesPlan;
  });
}

function renderPageNumbers(totalPages, current, onClickName) {
  const maxVisible = 5;
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  let html = "";
  for (let i = start; i <= end; i++) {
    html += `
      <button class="page-btn ${i === current ? "active" : ""}" onclick="${onClickName}(${i})">
        ${i}
      </button>
    `;
  }
  return html;
}

function renderExpensesTable() {
  const container = document.querySelector("[data-expenses-table]");
  const pagination = document.querySelector("[data-expenses-pagination]");
  if (!container) return;

  const filtered = getFilteredExpenses();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (expensesPage > totalPages) expensesPage = totalPages;
  const pageItems = filtered.slice(
    (expensesPage - 1) * PAGE_SIZE,
    expensesPage * PAGE_SIZE,
  );
  const start = filtered.length === 0 ? 0 : (expensesPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(expensesPage * PAGE_SIZE, filtered.length);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No tienes suscripciones de gastos registradas.</p>
        <button class="btn btn-primary" onclick="window.openAddExpenseSubscriptionModal()">Registrar gasto</button>
      </div>
    `;
    if (pagination) pagination.innerHTML = "";
    return;
  }

  const columns = getVisibleColumns(EXPENSE_COLUMNS, visibleExpenseColumns);

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          ${columns.map((key) => `<th>${EXPENSE_COLUMNS[key]}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${pageItems.map((sub) => renderExpenseRow(sub, columns)).join("")}
      </tbody>
    </table>
  `;

  if (pagination && filtered.length > PAGE_SIZE) {
    pagination.innerHTML = `
      <button class="btn-paginate" ${expensesPage === 1 ? "disabled" : ""} onclick="window.changeExpensePage(-1)">
        ← Anterior
      </button>
      <div class="page-numbers">
        ${renderPageNumbers(totalPages, expensesPage, "window.goToExpensePage")}
      </div>
      <button class="btn-paginate" ${expensesPage === totalPages ? "disabled" : ""} onclick="window.changeExpensePage(1)">
        Siguiente →
      </button>
      <span class="pagination-info">
        Mostrando ${start}-${end} de ${filtered.length} (página ${expensesPage} de ${totalPages})
      </span>
    `;
  } else if (pagination) {
    pagination.innerHTML = "";
  }

  syncExpenseFiltersUI();
}

function renderRevenueTable() {
  const container = document.querySelector("[data-revenue-table]");
  const pagination = document.querySelector("[data-revenue-pagination]");
  if (!container) return;

  const filtered = getFilteredRevenue();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (revenuePage > totalPages) revenuePage = totalPages;
  const pageItems = filtered.slice(
    (revenuePage - 1) * PAGE_SIZE,
    revenuePage * PAGE_SIZE,
  );
  const start = filtered.length === 0 ? 0 : (revenuePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(revenuePage * PAGE_SIZE, filtered.length);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No tienes clientes suscritos aún.</p>
        <button class="btn btn-primary" onclick="window.openAddCustomerSubscriptionModal()">+ Añadir cliente</button>
      </div>
    `;
    if (pagination) pagination.innerHTML = "";
    return;
  }

  const columns = getVisibleColumns(REVENUE_COLUMNS, visibleRevenueColumns);

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          ${columns.map((key) => `<th>${REVENUE_COLUMNS[key]}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${pageItems.map((sub) => renderRevenueRow(sub, columns)).join("")}
      </tbody>
    </table>
  `;

  if (pagination && filtered.length > PAGE_SIZE) {
    pagination.innerHTML = `
      <button class="btn-paginate" ${revenuePage === 1 ? "disabled" : ""} onclick="window.changeRevenuePage(-1)">
        ← Anterior
      </button>
      <div class="page-numbers">
        ${renderPageNumbers(totalPages, revenuePage, "window.goToRevenuePage")}
      </div>
      <button class="btn-paginate" ${revenuePage === totalPages ? "disabled" : ""} onclick="window.changeRevenuePage(1)">
        Siguiente →
      </button>
      <span class="pagination-info">
        Mostrando ${start}-${end} de ${filtered.length} (página ${revenuePage} de ${totalPages})
      </span>
    `;
  } else if (pagination) {
    pagination.innerHTML = "";
  }

  syncRevenueFiltersUI();
}

function renderExpenseRow(sub, columns) {
  const statusBadge = {
    trial: { label: "Prueba", class: "badge-warning" },
    active: { label: "Activa", class: "badge-success" },
    paused: { label: "Pausada", class: "badge--neutral" },
    cancelled: { label: "Cancelada", class: "badge-danger" },
    expired: { label: "Expirada", class: "badge--neutral" },
  }[sub.status] || { label: sub.status, class: "badge--neutral" };

  const trialInfo =
    sub.has_trial && sub.status === "trial"
      ? `${sub.trial_days || 0} días`
      : "—";

  const cells = {
    service_name: `<strong>${escapeHtml(sub.service_name)}</strong>`,
    provider: escapeHtml(sub.provider),
    category: `<span class="category-badge">${escapeHtml(sub.category || "—")}</span>`,
    amount: `<span class="table-amount">${formatCurrency(sub.amount)}</span>`,
    billing_frequency: escapeHtml(sub.billing_frequency || "—"),
    next_billing_date: sub.next_billing_date ? formatDate(sub.next_billing_date) : "—",
    status: `<span class="badge ${statusBadge.class}">${statusBadge.label}</span>`,
    trial: trialInfo,
    actions: `
      <button type="button" class="btn-ghost" onclick="window.openExpenseDrawerById('${sub.id}')">
        Ver detalles →
      </button>
    `,
  };

  const isSelected = selectedExpenseId === sub.id;
  return `
    <tr class="table-row-clickable${isSelected ? " is-selected" : ""}" onclick="window.handleExpenseRowClick(event, '${sub.id}')">
      ${columns.map((key) => `<td>${cells[key] || "—"}</td>`).join("")}
    </tr>
  `;
}

function renderRevenueRow(sub, columns) {
  const statusBadge = {
    trial: { label: "Prueba", class: "badge-warning" },
    active: { label: "Activa", class: "badge-success" },
    past_due: { label: "Impagada", class: "badge-danger" },
    cancelled: { label: "Cancelada", class: "badge--neutral" },
  }[sub.status] || { label: sub.status, class: "badge--neutral" };

  const trialInfo =
    sub.has_trial && sub.status === "trial"
      ? `${sub.trial_days || 0} días`
      : "—";

  const cells = {
    client: `<strong>${escapeHtml(sub.client_name || "Cliente")}</strong><div class="text-muted" style="font-size: 0.75rem;">${escapeHtml(sub.client_id || "").slice(0, 8)}</div>`,
    plan: `<span class="plan-badge">${escapeHtml(sub.plan_name || "Plan")}</span>`,
    amount: `<span class="table-amount">${formatCurrency(sub.amount)}</span>`,
    billing_frequency: escapeHtml(sub.billing_frequency || "—"),
    next_billing_date: sub.next_billing_date ? formatDate(sub.next_billing_date) : "—",
    status: `<span class="badge ${statusBadge.class}">${statusBadge.label}</span>`,
    trial: trialInfo,
    total_revenue: formatCurrency(sub.total_revenue || 0),
    actions: `
      <button type="button" class="btn-ghost" onclick="window.openRevenueDrawerById('${sub.id}')">
        Ver detalles →
      </button>
    `,
  };

  const isSelected = selectedRevenueId === sub.id;
  return `
    <tr class="table-row-clickable${isSelected ? " is-selected" : ""}" onclick="window.handleRevenueRowClick(event, '${sub.id}')">
      ${columns.map((key) => `<td>${cells[key] || "—"}</td>`).join("")}
    </tr>
  `;
}

function syncExpenseFiltersUI() {
  const searchInput = document.querySelector("[data-expense-search]");
  if (searchInput) searchInput.value = subscriptionState.filters.expenses.search;

  const statusSelect = document.querySelector("[data-expense-status]");
  if (statusSelect) statusSelect.value = subscriptionState.filters.expenses.status;

  const categorySelect = document.querySelector("[data-expense-category]");
  if (categorySelect) {
    const categories = Array.from(
      new Set(
        subscriptionState.mySubscriptions
          .map((sub) => sub.category)
          .filter(Boolean),
      ),
    ).sort();

    categorySelect.innerHTML = `
      <option value="all">Categoría (todas)</option>
      ${categories.map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join("")}
    `;
    if (!categories.includes(subscriptionState.filters.expenses.category)) {
      subscriptionState.filters.expenses.category = "all";
    }
    categorySelect.value = subscriptionState.filters.expenses.category;
  }
}

function syncRevenueFiltersUI() {
  const searchInput = document.querySelector("[data-revenue-search]");
  if (searchInput) searchInput.value = subscriptionState.filters.revenue.search;

  const statusSelect = document.querySelector("[data-revenue-status]");
  if (statusSelect) statusSelect.value = subscriptionState.filters.revenue.status;

  const planSelect = document.querySelector("[data-revenue-plan]");
  if (planSelect) {
    const plans = Array.from(
      new Set(
        subscriptionState.customerSubscriptions
          .map((sub) => sub.plan_code)
          .filter(Boolean),
      ),
    ).sort();

    planSelect.innerHTML = `
      <option value="all">Plan (todos)</option>
      ${plans.map((plan) => `<option value="${escapeHtml(plan)}">${escapeHtml(plan)}</option>`).join("")}
    `;
    if (!plans.includes(subscriptionState.filters.revenue.plan)) {
      subscriptionState.filters.revenue.plan = "all";
    }
    planSelect.value = subscriptionState.filters.revenue.plan;
  }
}

function handleExpenseSearch(value) {
  subscriptionState.filters.expenses.search = value;
  expensesPage = 1;
  renderExpensesTable();
}

function handleRevenueSearch(value) {
  subscriptionState.filters.revenue.search = value;
  revenuePage = 1;
  renderRevenueTable();
}

function updateExpenseFilter(key, value) {
  subscriptionState.filters.expenses[key] = value;
  expensesPage = 1;
  renderExpensesTable();
}

function updateRevenueFilter(key, value) {
  subscriptionState.filters.revenue[key] = value;
  revenuePage = 1;
  renderRevenueTable();
}

function toggleExpenseFilters() {
  const panel = document.querySelector("[data-expenses-filters]");
  if (!panel) return;
  const isHidden = panel.hasAttribute("hidden");
  if (isHidden) {
    panel.removeAttribute("hidden");
  } else {
    panel.setAttribute("hidden", "true");
  }
}

function toggleRevenueFilters() {
  const panel = document.querySelector("[data-revenue-filters]");
  if (!panel) return;
  const isHidden = panel.hasAttribute("hidden");
  if (isHidden) {
    panel.removeAttribute("hidden");
  } else {
    panel.setAttribute("hidden", "true");
  }
}

function changeExpensePage(delta) {
  const filteredCount = getFilteredExpenses().length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const nextPage = expensesPage + delta;
  if (nextPage >= 1 && nextPage <= totalPages) {
    expensesPage = nextPage;
    renderExpensesTable();
  }
}

function changeRevenuePage(delta) {
  const filteredCount = getFilteredRevenue().length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const nextPage = revenuePage + delta;
  if (nextPage >= 1 && nextPage <= totalPages) {
    revenuePage = nextPage;
    renderRevenueTable();
  }
}

function goToExpensePage(page) {
  expensesPage = page;
  renderExpensesTable();
}

function goToRevenuePage(page) {
  revenuePage = page;
  renderRevenueTable();
}

function handleExpenseRowClick(event, subscriptionId) {
  if (event.target.closest("button")) return;
  selectedExpenseId = subscriptionId;
  renderExpensesTable();
  openExpenseDrawerById(subscriptionId);
}

function handleRevenueRowClick(event, subscriptionId) {
  if (event.target.closest("button")) return;
  selectedRevenueId = subscriptionId;
  renderRevenueTable();
  openRevenueDrawerById(subscriptionId);
}

function openExpenseDrawerById(subscriptionId) {
  const subscription = subscriptionState.mySubscriptions.find(
    (sub) => sub.id === subscriptionId,
  );
  if (subscription) {
    openExpenseDrawer(subscription);
  }
}

function openRevenueDrawerById(subscriptionId) {
  const subscription = subscriptionState.customerSubscriptions.find(
    (sub) => sub.id === subscriptionId,
  );
  if (subscription) {
    openRevenueDrawer(subscription);
  }
}

// ==========================================
// RENDERIZADO PRINCIPAL
// ==========================================
export function renderSubscriptions() {
  const html = `
    <section class="subscriptions" aria-labelledby="subscriptions-title">
      <header class="subscriptions__hero">
        <div class="subscriptions__hero-copy">
          <h1 id="subscriptions-title">Gestión de Suscripciones</h1>
          <p>Controla tus gastos recurrentes y los ingresos de tus clientes.</p>
        </div>
        <div class="subscriptions__hero-actions">
          <button type="button" class="btn btn-secondary" onclick="window.openExpenseCTA()">
            Registrar gasto
          </button>
          <button type="button" class="btn btn-primary" onclick="window.openRevenueCTA()">
            Asignar cliente
          </button>
        </div>
      </header>

      <div class="subscriptions-tabs" role="tablist">
        <button type="button" class="subscriptions-tab is-active" data-tab="expenses" onclick="switchTab('expenses')" role="tab" aria-selected="true">
          💸 Mis Gastos
          <span class="badge badge-success" data-expenses-count>0</span>
        </button>
        <button type="button" class="subscriptions-tab" data-tab="revenue" onclick="switchTab('revenue')" role="tab" aria-selected="false">
          💰 Mis Ingresos (Clientes)
          <span class="badge badge-warning" data-revenue-count>0</span>
        </button>
      </div>

      <div class="subscriptions-panel" data-tab-content="expenses">
        <div class="summary-cards">
          <div class="stat-card">
            <div class="card-icon">📊</div>
            <div>
              <div class="card-trend">Total suscripciones</div>
              <div class="card-value" id="expenses-total-count">0</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="card-icon">✅</div>
            <div>
              <div class="card-trend">Activas</div>
              <div class="card-value" id="expenses-active-count">0</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="card-icon">💰</div>
            <div>
              <div class="card-trend">Gasto mensual</div>
              <div class="card-value" id="expenses-monthly-cost">0,00 €</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="card-icon">⏰</div>
            <div>
              <div class="card-trend">Coste recurrente aprox.</div>
              <div class="card-value" id="expenses-approx-cost">0,00 €</div>
            </div>
          </div>
        </div>

        <div class="table-toolbar">
          <button class="btn-config-columns" onclick="window.openExpenseColumnConfigModal()" title="Configurar columnas">
            ⚙️ Configurar columnas
          </button>
          <input class="search-input" data-expense-search type="search" placeholder="Buscar servicio, proveedor..." oninput="window.handleExpenseSearch(this.value)" />
          <button class="btn-filters" onclick="window.toggleExpenseFilters()">🔍 Filtros</button>
        </div>

        <div class="table-filters" data-expenses-filters hidden>
          <select class="select-input" data-expense-status onchange="window.updateExpenseFilter('status', this.value)">
            <option value="all">Estado (todos)</option>
            <option value="active">Activa</option>
            <option value="trial">Trial</option>
            <option value="paused">Pausada</option>
            <option value="cancelled">Cancelada</option>
            <option value="expired">Expirada</option>
          </select>
          <select class="select-input" data-expense-category onchange="window.updateExpenseFilter('category', this.value)">
            <option value="all">Categoría (todas)</option>
          </select>
        </div>

        <div class="table-container" data-expenses-table>
          <div class="empty-state">Cargando suscripciones...</div>
        </div>
        <div class="pagination" data-expenses-pagination></div>
      </div>

      <div class="subscriptions-panel" data-tab-content="revenue" style="display: none;">
        <div class="summary-cards">
          <div class="stat-card">
            <div class="card-icon">👥</div>
            <div>
              <div class="card-trend">Total clientes</div>
              <div class="card-value" id="revenue-total-count">0</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="card-icon">✅</div>
            <div>
              <div class="card-trend">Activos</div>
              <div class="card-value" id="revenue-active-count">0</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="card-icon">💵</div>
            <div>
              <div class="card-trend">MRR (mensual)</div>
              <div class="card-value" id="revenue-mrr">0,00 €</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="card-icon">📅</div>
            <div>
              <div class="card-trend">ARR (anual)</div>
              <div class="card-value" id="revenue-arr">0,00 €</div>
            </div>
          </div>
        </div>

        <div class="table-toolbar">
          <button class="btn-config-columns" onclick="window.openRevenueColumnConfigModal()" title="Configurar columnas">
            ⚙️ Configurar columnas
          </button>
          <input class="search-input" data-revenue-search type="search" placeholder="Buscar cliente o plan..." oninput="window.handleRevenueSearch(this.value)" />
          <button class="btn-filters" onclick="window.toggleRevenueFilters()">🔍 Filtros</button>
          <button class="btn btn-primary" onclick="window.openAddCustomerSubscriptionModal()">+ Añadir cliente</button>
        </div>

        <div class="table-filters" data-revenue-filters hidden>
          <select class="select-input" data-revenue-status onchange="window.updateRevenueFilter('status', this.value)">
            <option value="all">Estado (todos)</option>
            <option value="active">Activa</option>
            <option value="trial">Trial</option>
            <option value="past_due">Impagada</option>
            <option value="cancelled">Cancelada</option>
          </select>
          <select class="select-input" data-revenue-plan onchange="window.updateRevenueFilter('plan', this.value)">
            <option value="all">Plan (todos)</option>
          </select>
        </div>

        <div class="table-container" data-revenue-table>
          <div class="empty-state">Cargando clientes...</div>
        </div>
        <div class="pagination" data-revenue-pagination></div>
      </div>
    </section>
  `;
  
  // Inicializar página
  setTimeout(() => {
    initSubscriptionsPage();
  }, 100);
  
  return html;
}


// ==========================================
// DRAWERS
// ==========================================
function openExpenseDrawer(subscription) {
  let overlay = document.getElementById("subscription-expense-overlay");
  let drawer = document.getElementById("subscription-expense-drawer");

  if (!drawer || !overlay) {
    const drawerHTML = `
      <div class="drawer-overlay" id="subscription-expense-overlay" onclick="window.closeExpenseDrawer()"></div>
      <div class="drawer" id="subscription-expense-drawer">
        <header class="drawer__header">
          <h2 class="drawer__title">Detalles del gasto recurrente</h2>
          <button class="drawer__close" onclick="window.closeExpenseDrawer()">&times;</button>
        </header>
        <div class="drawer__body" id="subscription-expense-body"></div>
        <footer class="drawer__footer">
          <button class="btn-secondary" id="subscription-expense-edit">Editar</button>
          <button class="btn-secondary text-danger" id="subscription-expense-delete">Eliminar</button>
          <button class="btn-primary" onclick="window.closeExpenseDrawer()">Cerrar</button>
        </footer>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", drawerHTML);
    overlay = document.getElementById("subscription-expense-overlay");
    drawer = document.getElementById("subscription-expense-drawer");
  }

  const body = document.getElementById("subscription-expense-body");
  body.innerHTML = `
    <div class="drawer-field">
      <label class="field-label">Servicio</label>
      <div class="field-value">${escapeHtml(subscription.service_name)}</div>
    </div>
    <div class="drawer-field">
      <label class="field-label">Proveedor</label>
      <div class="field-value">${escapeHtml(subscription.provider)}</div>
    </div>
    <div class="drawer-field">
      <label class="field-label">Categoría</label>
      <div class="field-value">${escapeHtml(subscription.category || "—")}</div>
    </div>
    <div class="drawer-field">
      <label class="field-label">Importe</label>
      <div class="field-value">${formatCurrency(subscription.amount)}</div>
    </div>
    <div class="drawer-field">
      <label class="field-label">Frecuencia</label>
      <div class="field-value">${escapeHtml(subscription.billing_frequency || "—")}</div>
    </div>
    <div class="drawer-field">
      <label class="field-label">Estado</label>
      <div class="field-value">${escapeHtml(subscription.status || "—")}</div>
    </div>
    <div class="drawer-field">
      <label class="field-label">Inicio</label>
      <div class="field-value">${subscription.start_date ? formatDate(subscription.start_date) : "—"}</div>
    </div>
    <div class="drawer-field">
      <label class="field-label">Próximo cargo</label>
      <div class="field-value">${subscription.next_billing_date ? formatDate(subscription.next_billing_date) : "—"}</div>
    </div>
    <div class="drawer-field">
      <label class="field-label">Trial</label>
      <div class="field-value">${subscription.has_trial ? "Sí" : "No"}</div>
    </div>
    ${subscription.notes ? `
      <div class="drawer-field">
        <label class="field-label">Notas</label>
        <div class="field-value">${escapeHtml(subscription.notes)}</div>
      </div>
    ` : ""}
  `;

  const editBtn = document.getElementById("subscription-expense-edit");
  const deleteBtn = document.getElementById("subscription-expense-delete");

  if (editBtn) {
    editBtn.onclick = () => {
      window.closeExpenseDrawer();
      openExpenseSubscriptionModal("edit", subscription);
    };
  }

  if (deleteBtn) {
    deleteBtn.onclick = () => confirmDeleteExpenseSubscription(subscription.id);
  }

  requestAnimationFrame(() => {
    overlay.classList.add("is-open");
    drawer.classList.add("is-open");
  });
}

function closeExpenseDrawer() {
  const overlay = document.getElementById("subscription-expense-overlay");
  const drawer = document.getElementById("subscription-expense-drawer");
  if (overlay) overlay.classList.remove("is-open");
  if (drawer) drawer.classList.remove("is-open");
}

function openRevenueDrawer(subscription) {
  let overlay = document.getElementById("subscription-revenue-overlay");
  let drawer = document.getElementById("subscription-revenue-drawer");

  if (!drawer || !overlay) {
    const drawerHTML = `
      <div class="drawer-overlay" id="subscription-revenue-overlay" onclick="window.closeRevenueDrawer()"></div>
      <div class="drawer" id="subscription-revenue-drawer">
        <header class="drawer__header">
          <h2 class="drawer__title">Detalles de ingreso recurrente</h2>
          <button class="drawer__close" onclick="window.closeRevenueDrawer()">&times;</button>
        </header>
        <div class="drawer__body" id="subscription-revenue-body"></div>
        <footer class="drawer__footer" id="subscription-revenue-footer"></footer>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", drawerHTML);
    overlay = document.getElementById("subscription-revenue-overlay");
    drawer = document.getElementById("subscription-revenue-drawer");
  }

  const body = document.getElementById("subscription-revenue-body");
  body.innerHTML = `
    <div class="drawer-field">
      <label class="field-label">Cliente</label>
      <div class="field-value">${escapeHtml(subscription.client_name || "Cliente")}</div>
    </div>
    <div class="drawer-field">
      <label class="field-label">Plan</label>
      <div class="field-value">${escapeHtml(subscription.plan_name || "—")}</div>
    </div>
    <div class="drawer-field">
      <label class="field-label">Código plan</label>
      <div class="field-value">${escapeHtml(subscription.plan_code || "—")}</div>
    </div>
    <div class="drawer-field">
      <label class="field-label">Importe</label>
      <div class="field-value">${formatCurrency(subscription.amount)}</div>
    </div>
    <div class="drawer-field">
      <label class="field-label">Frecuencia</label>
      <div class="field-value">${escapeHtml(subscription.billing_frequency || "—")}</div>
    </div>
    <div class="drawer-field">
      <label class="field-label">Estado</label>
      <div class="field-value">${escapeHtml(subscription.status || "—")}</div>
    </div>
    <div class="drawer-field">
      <label class="field-label">Próxima factura</label>
      <div class="field-value">${subscription.next_billing_date ? formatDate(subscription.next_billing_date) : "—"}</div>
    </div>
    <div class="drawer-field">
      <label class="field-label">Ingresos acumulados</label>
      <div class="field-value">${formatCurrency(subscription.total_revenue || 0)}</div>
    </div>
  `;

  const footer = document.getElementById("subscription-revenue-footer");
  const actionButtons = [];

  if (subscription.status === "trial") {
    actionButtons.push(`
      <button class="btn-secondary" onclick="window.convertCustomerSubscription('${subscription.id}')">
        Convertir trial
      </button>
    `);
  }

  if (subscription.status === "active") {
    actionButtons.push(`
      <button class="btn-secondary text-danger" onclick="window.cancelCustomerSubscription('${subscription.id}')">
        Cancelar
      </button>
    `);
  }

  actionButtons.push(`
    <button class="btn-primary" onclick="window.closeRevenueDrawer()">Cerrar</button>
  `);

  footer.innerHTML = actionButtons.join("");

  requestAnimationFrame(() => {
    overlay.classList.add("is-open");
    drawer.classList.add("is-open");
  });
}

function closeRevenueDrawer() {
  const overlay = document.getElementById("subscription-revenue-overlay");
  const drawer = document.getElementById("subscription-revenue-drawer");
  if (overlay) overlay.classList.remove("is-open");
  if (drawer) drawer.classList.remove("is-open");
}

async function confirmDeleteExpenseSubscription(subscriptionId) {
  if (!confirm("¿Seguro que deseas eliminar esta suscripción?")) return;
  try {
    await window.api.deleteSubscription(subscriptionId);
    showNotification("Suscripción eliminada", "success");
    loadMySubscriptions();
    closeExpenseDrawer();
  } catch (error) {
    console.error("Error deleting subscription:", error);
    showNotification("No se pudo eliminar la suscripción", "error");
  }
}

async function convertCustomerSubscription(subscriptionId) {
  if (!confirm("¿Convertir trial a activo?")) return;
  try {
    await window.api.convertTrialToActive(subscriptionId);
    showNotification("Trial convertido correctamente", "success");
    loadCustomerSubscriptions();
    closeRevenueDrawer();
  } catch (error) {
    console.error("Error converting trial:", error);
    showNotification("No se pudo convertir el trial", "error");
  }
}

async function cancelCustomerSubscription(subscriptionId) {
  if (!confirm("¿Cancelar esta suscripción?")) return;
  try {
    await window.api.cancelCustomerSubscription(subscriptionId);
    showNotification("Suscripción cancelada", "success");
    loadCustomerSubscriptions();
    closeRevenueDrawer();
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    showNotification("No se pudo cancelar la suscripción", "error");
  }
}

// ==========================================
// MODALES
// ==========================================
function normalizeDateInputValue(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function openExpenseSubscriptionModal(mode = "create", subscription = null) {
  const isEdit = mode === "edit";
  const modalId = "expense-subscription-modal";
  const existing = document.getElementById(modalId);
  if (existing) existing.remove();

  const defaults = {
    serviceName: subscription?.service_name || "",
    provider: subscription?.provider || "",
    category: subscription?.category || "",
    amount: subscription?.amount || "",
    currency: subscription?.currency || "EUR",
    billingFrequency: subscription?.billing_frequency || "monthly",
    startDate:
      normalizeDateInputValue(subscription?.start_date) ||
      normalizeDateInputValue(new Date().toISOString()),
    status: subscription?.status || "active",
    hasTrial: Boolean(subscription?.has_trial),
    trialDays: subscription?.trial_days || "",
    trialEndDate: normalizeDateInputValue(subscription?.trial_end_date),
    trialRequiresCard: Boolean(subscription?.trial_requires_card),
    notes: subscription?.notes || "",
  };

  const modalHTML = `
    <div class="modal is-open" id="${modalId}">
      <div class="modal__backdrop" onclick="window.closeExpenseSubscriptionModal()"></div>
      <div class="modal__panel modal__panel--flex subscription-modal">
        <header class="modal__head">
          <div>
            <h2 class="modal__title">${isEdit ? "Editar" : "Nueva"} suscripción de gasto</h2>
            <p class="modal__subtitle">Completa los datos básicos del gasto recurrente</p>
          </div>
          <button class="modal__close" onclick="window.closeExpenseSubscriptionModal()">&times;</button>
        </header>
        <div class="modal__body">
          <form id="expense-subscription-form" class="subscription-form">
            <div class="subscription-form__grid">
              <div class="form-group">
                <label class="form-label" for="exp-service-name">Servicio *</label>
                <input class="form-input" id="exp-service-name" name="serviceName" value="${escapeHtml(defaults.serviceName)}" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="exp-provider">Proveedor *</label>
                <input class="form-input" id="exp-provider" name="provider" value="${escapeHtml(defaults.provider)}" required />
              </div>
            </div>
            <div class="subscription-form__grid">
              <div class="form-group">
                <label class="form-label" for="exp-category">Categoría</label>
                <input class="form-input" id="exp-category" name="category" value="${escapeHtml(defaults.category)}" />
              </div>
              <div class="form-group">
                <label class="form-label" for="exp-amount">Importe *</label>
                <input class="form-input" id="exp-amount" name="amount" type="number" min="0" step="0.01" value="${defaults.amount}" required />
              </div>
            </div>
            <div class="subscription-form__grid">
              <div class="form-group">
                <label class="form-label" for="exp-frequency">Frecuencia *</label>
                <select class="form-input" id="exp-frequency" name="billingFrequency">
                  <option value="monthly" ${defaults.billingFrequency === "monthly" ? "selected" : ""}>Mensual</option>
                  <option value="quarterly" ${defaults.billingFrequency === "quarterly" ? "selected" : ""}>Trimestral</option>
                  <option value="yearly" ${defaults.billingFrequency === "yearly" ? "selected" : ""}>Anual</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="exp-currency">Moneda</label>
                <select class="form-input" id="exp-currency" name="currency">
                  <option value="EUR" ${defaults.currency === "EUR" ? "selected" : ""}>EUR</option>
                  <option value="USD" ${defaults.currency === "USD" ? "selected" : ""}>USD</option>
                  <option value="GBP" ${defaults.currency === "GBP" ? "selected" : ""}>GBP</option>
                </select>
              </div>
            </div>
            <div class="subscription-form__grid">
              <div class="form-group">
                <label class="form-label" for="exp-start-date">Fecha inicio *</label>
                <input class="form-input" id="exp-start-date" name="startDate" type="date" value="${defaults.startDate}" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="exp-status">Estado</label>
                <select class="form-input" id="exp-status" name="status">
                  <option value="active" ${defaults.status === "active" ? "selected" : ""}>Activa</option>
                  <option value="trial" ${defaults.status === "trial" ? "selected" : ""}>Trial</option>
                  <option value="paused" ${defaults.status === "paused" ? "selected" : ""}>Pausada</option>
                  <option value="cancelled" ${defaults.status === "cancelled" ? "selected" : ""}>Cancelada</option>
                </select>
              </div>
            </div>
            <div class="subscription-form__grid">
              <div class="form-group subscription-form__inline">
                <label class="form-label" for="exp-has-trial" style="margin-bottom: 0;">Trial</label>
                <input id="exp-has-trial" name="hasTrial" type="checkbox" ${defaults.hasTrial ? "checked" : ""} />
              </div>
              <div class="form-group subscription-form__inline">
                <label class="form-label" for="exp-trial-card" style="margin-bottom: 0;">Tarjeta requerida</label>
                <input id="exp-trial-card" type="checkbox" name="trialRequiresCard" ${defaults.trialRequiresCard ? "checked" : ""} />
              </div>
            </div>
            <div class="trial-fields subscription-form__grid" style="display: ${defaults.hasTrial ? "grid" : "none"};">
              <div class="form-group">
                <label class="form-label" for="exp-trial-days">Días trial</label>
                <input class="form-input" id="exp-trial-days" name="trialDays" type="number" min="1" value="${defaults.trialDays}" />
              </div>
              <div class="form-group">
                <label class="form-label" for="exp-trial-end">Fin trial</label>
                <input class="form-input" id="exp-trial-end" name="trialEndDate" type="date" value="${defaults.trialEndDate}" />
              </div>
            </div>
            <div class="form-group subscription-form__full">
              <label class="form-label" for="exp-notes">Notas</label>
              <textarea class="form-input" id="exp-notes" name="notes" rows="2">${escapeHtml(defaults.notes)}</textarea>
            </div>
          </form>
        </div>
        <footer class="modal__footer modal__footer--right">
          <div class="modal__footer-actions">
            <button class="btn-secondary" onclick="window.closeExpenseSubscriptionModal()">Cancelar</button>
            <button class="btn-primary" onclick="window.submitExpenseSubscription('${mode}', '${subscription?.id || ""}')">
              ${isEdit ? "Guardar cambios" : "Crear suscripción"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const trialCheckbox = document.getElementById("exp-has-trial");
  const trialFields = document.querySelector(`#${modalId} .trial-fields`);
  if (trialCheckbox && trialFields) {
    trialCheckbox.addEventListener("change", () => {
      trialFields.style.display = trialCheckbox.checked ? "grid" : "none";
    });
  }
}

function closeExpenseSubscriptionModal() {
  const modal = document.getElementById("expense-subscription-modal");
  if (modal) modal.remove();
}

async function submitExpenseSubscription(mode, subscriptionId) {
  const form = document.getElementById("expense-subscription-form");
  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const raw = Object.fromEntries(formData.entries());

  const payload = {
    serviceName: raw.serviceName,
    provider: raw.provider,
    category: raw.category || null,
    amount: parseFloat(raw.amount),
    currency: raw.currency || "EUR",
    billingFrequency: raw.billingFrequency,
    startDate: raw.startDate,
    status: raw.status || "active",
    hasTrial: Boolean(raw.hasTrial),
    trialDays: raw.trialDays ? Number(raw.trialDays) : null,
    trialEndDate: raw.trialEndDate || null,
    trialRequiresCard: Boolean(raw.trialRequiresCard),
    notes: raw.notes || null,
  };

  if (!payload.hasTrial) {
    payload.trialDays = null;
    payload.trialEndDate = null;
    payload.trialRequiresCard = false;
  }

  try {
    if (mode === "edit") {
      await window.api.updateSubscription(subscriptionId, payload);
      showNotification("Suscripción actualizada", "success");
    } else {
      await window.api.createSubscription(payload);
      showNotification("Suscripción creada", "success");
    }
    closeExpenseSubscriptionModal();
    loadMySubscriptions();
  } catch (error) {
    console.error("Error saving subscription:", error);
    showNotification("No se pudo guardar la suscripción", "error");
  }
}

function openExpenseColumnConfigModal() {
  let modal = document.getElementById("expense-column-config-modal");
  if (!modal) {
    const modalHTML = `
      <div class="modal is-open" id="expense-column-config-modal">
        <div class="modal__backdrop" onclick="window.closeExpenseColumnConfigModal()"></div>
        <div class="modal__panel modal__panel--md modal__panel--flex">
          <header class="modal__head">
            <div>
              <h2 class="modal__title">Configurar columnas</h2>
              <p class="modal__subtitle">Selecciona qué columnas mostrar en la tabla</p>
            </div>
            <button class="modal__close" onclick="window.closeExpenseColumnConfigModal()">&times;</button>
          </header>
          <div class="modal__body">
            <div class="column-options-grid">
              ${Object.keys(EXPENSE_COLUMNS).map((key) => {
                const isRequired = REQUIRED_EXPENSE_COLUMNS.includes(key);
                return `
                  <label class="column-option-card ${isRequired ? "is-disabled" : ""}">
                    <input type="checkbox" id="exp-col-${key}" ${visibleExpenseColumns[key] ? "checked" : ""} ${isRequired ? "disabled" : ""} />
                    <span>${EXPENSE_COLUMNS[key]}${isRequired ? " (Fijo)" : ""}</span>
                  </label>
                `;
              }).join("")}
            </div>
          </div>
          <footer class="modal__footer modal__footer--columns">
            <button class="btn-ghost" onclick="window.resetExpenseColumnConfig()">Restablecer</button>
            <div class="modal__footer-actions">
              <button class="btn-secondary" onclick="window.closeExpenseColumnConfigModal()">Cancelar</button>
              <button class="btn-primary" onclick="window.applyExpenseColumnConfig()">Aplicar</button>
            </div>
          </footer>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  } else {
    modal.classList.add("is-open");
  }
}

function closeExpenseColumnConfigModal() {
  const modal = document.getElementById("expense-column-config-modal");
  if (modal) modal.classList.remove("is-open");
}

function applyExpenseColumnConfig() {
  Object.keys(EXPENSE_COLUMNS).forEach((key) => {
    const input = document.getElementById(`exp-col-${key}`);
    if (input) {
      visibleExpenseColumns[key] = input.checked;
    }
  });
  ensureRequiredColumns(visibleExpenseColumns, REQUIRED_EXPENSE_COLUMNS);
  saveColumnConfig(COLUMN_STORAGE_KEYS.expenses, visibleExpenseColumns);
  closeExpenseColumnConfigModal();
  renderExpensesTable();
}

function resetExpenseColumnConfig() {
  visibleExpenseColumns = { ...DEFAULT_EXPENSE_COLUMNS };
  ensureRequiredColumns(visibleExpenseColumns, REQUIRED_EXPENSE_COLUMNS);
  saveColumnConfig(COLUMN_STORAGE_KEYS.expenses, visibleExpenseColumns);
  closeExpenseColumnConfigModal();
  renderExpensesTable();
}

function openRevenueColumnConfigModal() {
  let modal = document.getElementById("revenue-column-config-modal");
  if (!modal) {
    const modalHTML = `
      <div class="modal is-open" id="revenue-column-config-modal">
        <div class="modal__backdrop" onclick="window.closeRevenueColumnConfigModal()"></div>
        <div class="modal__panel modal__panel--md modal__panel--flex">
          <header class="modal__head">
            <div>
              <h2 class="modal__title">Configurar columnas</h2>
              <p class="modal__subtitle">Selecciona qué columnas mostrar en la tabla</p>
            </div>
            <button class="modal__close" onclick="window.closeRevenueColumnConfigModal()">&times;</button>
          </header>
          <div class="modal__body">
            <div class="column-options-grid">
              ${Object.keys(REVENUE_COLUMNS).map((key) => {
                const isRequired = REQUIRED_REVENUE_COLUMNS.includes(key);
                return `
                  <label class="column-option-card ${isRequired ? "is-disabled" : ""}">
                    <input type="checkbox" id="rev-col-${key}" ${visibleRevenueColumns[key] ? "checked" : ""} ${isRequired ? "disabled" : ""} />
                    <span>${REVENUE_COLUMNS[key]}${isRequired ? " (Fijo)" : ""}</span>
                  </label>
                `;
              }).join("")}
            </div>
          </div>
          <footer class="modal__footer modal__footer--columns">
            <button class="btn-ghost" onclick="window.resetRevenueColumnConfig()">Restablecer</button>
            <div class="modal__footer-actions">
              <button class="btn-secondary" onclick="window.closeRevenueColumnConfigModal()">Cancelar</button>
              <button class="btn-primary" onclick="window.applyRevenueColumnConfig()">Aplicar</button>
            </div>
          </footer>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  } else {
    modal.classList.add("is-open");
  }
}

function closeRevenueColumnConfigModal() {
  const modal = document.getElementById("revenue-column-config-modal");
  if (modal) modal.classList.remove("is-open");
}

function applyRevenueColumnConfig() {
  Object.keys(REVENUE_COLUMNS).forEach((key) => {
    const input = document.getElementById(`rev-col-${key}`);
    if (input) {
      visibleRevenueColumns[key] = input.checked;
    }
  });
  ensureRequiredColumns(visibleRevenueColumns, REQUIRED_REVENUE_COLUMNS);
  saveColumnConfig(COLUMN_STORAGE_KEYS.revenue, visibleRevenueColumns);
  closeRevenueColumnConfigModal();
  renderRevenueTable();
}

function resetRevenueColumnConfig() {
  visibleRevenueColumns = { ...DEFAULT_REVENUE_COLUMNS };
  ensureRequiredColumns(visibleRevenueColumns, REQUIRED_REVENUE_COLUMNS);
  saveColumnConfig(COLUMN_STORAGE_KEYS.revenue, visibleRevenueColumns);
  closeRevenueColumnConfigModal();
  renderRevenueTable();
}

async function openAddCustomerSubscriptionModal() {
  try {
    // 1. Cargar clientes para el select
    showNotification('Cargando clientes...', 'info');
    const response = await window.api.getClients({ limit: 100 });
    const clients = response.clients || [];
    
    // Eliminar notificación de carga
    document.querySelectorAll('.notification--info').forEach(n => n.remove());

    const modalHTML = `
      <div class="modal is-open" id="add-customer-subscription-modal">
        <div class="modal__backdrop" onclick="document.getElementById('add-customer-subscription-modal').remove()"></div>
        <div class="modal__panel" style="max-width: 600px;">
          <header class="modal__head">
            <h2 class="modal__title">Nueva Suscripción de Cliente</h2>
            <button type="button" class="modal__close" onclick="document.getElementById('add-customer-subscription-modal').remove()">×</button>
          </header>
          <div class="modal__body">
            <form id="add-customer-subscription-form">
              
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" for="sub-client">Cliente *</label>
                <select id="sub-client" name="clientId" class="form-input" required>
                  <option value="">Seleccionar cliente...</option>
                  ${clients.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
                </select>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                  <label class="form-label" for="sub-plan-name">Nombre del Plan *</label>
                  <input type="text" id="sub-plan-name" name="planName" class="form-input" placeholder="Ej. Mantenimiento Web" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="sub-plan-code">Código Plan *</label>
                  <input type="text" id="sub-plan-code" name="planCode" class="form-input" placeholder="Ej. PLAN_BASIC" required style="text-transform: uppercase;">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                  <label class="form-label" for="sub-amount">Importe *</label>
                  <input type="number" id="sub-amount" name="amount" class="form-input" step="0.01" min="0" placeholder="0.00" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="sub-frequency">Frecuencia *</label>
                  <select id="sub-frequency" name="billingFrequency" class="form-input" required>
                    <option value="monthly">Mensual</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                  <label class="form-label" for="sub-start-date">Fecha Inicio *</label>
                  <input type="date" id="sub-start-date" name="startDate" class="form-input" required value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                  <label class="form-label" for="sub-status">Estado</label>
                  <select id="sub-status" name="status" class="form-input">
                    <option value="active">Activa</option>
                    <option value="trial">Periodo de prueba</option>
                    <option value="past_due">Impagada</option>
                  </select>
                </div>
              </div>
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label class="form-group-checkbox" style="display: flex; gap: 0.5rem; align-items: center; cursor: pointer;">
                  <input type="checkbox" name="autoInvoice" checked>
                  <span>Generar factura automáticamente</span>
                </label>
              </div>

            </form>
          </div>
          <footer class="modal__footer modal__footer--right">
            <div class="modal__footer-actions">
              <button class="btn-secondary" onclick="document.getElementById('add-customer-subscription-modal').remove()">Cancelar</button>
              <button class="btn-primary" onclick="submitCustomerSubscription()">Crear Suscripción</button>
            </div>
          </footer>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Auto-fill plan code based on name
    const nameInput = document.getElementById('sub-plan-name');
    const codeInput = document.getElementById('sub-plan-code');
    
    if (nameInput && codeInput) {
      nameInput.addEventListener('input', () => {
        if (!codeInput.value || codeInput.dataset.touched !== 'true') {
          codeInput.value = nameInput.value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '_')
            .replace(/__+/g, '_')
            .replace(/^_|_$/g, '');
        }
      });
      
      codeInput.addEventListener('input', () => codeInput.dataset.touched = 'true');
    }

  } catch (error) {
    console.error('Error opening modal:', error);
    showNotification('Error al cargar formulario: ' + error.message, 'error');
  }
}

async function submitCustomerSubscription() {
  const form = document.getElementById('add-customer-subscription-form');
  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  // Procesar datos
  data.amount = parseFloat(data.amount);
  data.autoInvoice = form.querySelector('[name="autoInvoice"]').checked;
  
  // Calcular periodos
  const startDate = new Date(data.startDate);
  data.currentPeriodStart = data.startDate;
  
  const endPeriod = new Date(startDate);
  if (data.billingFrequency === 'monthly') endPeriod.setMonth(endPeriod.getMonth() + 1);
  else if (data.billingFrequency === 'quarterly') endPeriod.setMonth(endPeriod.getMonth() + 3);
  else if (data.billingFrequency === 'yearly') endPeriod.setFullYear(endPeriod.getFullYear() + 1);
  
  data.currentPeriodEnd = endPeriod.toISOString();
  data.nextBillingDate = endPeriod.toISOString();

  try {
    showNotification('Creando suscripción...', 'info');
    await window.api.createCustomerSubscription(data);
    
    document.getElementById('add-customer-subscription-modal').remove();
    showNotification('Suscripción creada correctamente', 'success');
    
    loadCustomerSubscriptions(); // Recargar tabla
  } catch (error) {
    console.error('Error creating subscription:', error);
    showNotification('Error al crear suscripción: ' + (error.data?.error || error.message), 'error');
  }
}

function initSubscriptionsPage() {
  visibleExpenseColumns =
    visibleExpenseColumns ||
    loadColumnConfig(COLUMN_STORAGE_KEYS.expenses, DEFAULT_EXPENSE_COLUMNS);
  visibleRevenueColumns =
    visibleRevenueColumns ||
    loadColumnConfig(COLUMN_STORAGE_KEYS.revenue, DEFAULT_REVENUE_COLUMNS);
  ensureRequiredColumns(visibleExpenseColumns, REQUIRED_EXPENSE_COLUMNS);
  ensureRequiredColumns(visibleRevenueColumns, REQUIRED_REVENUE_COLUMNS);
  saveColumnConfig(COLUMN_STORAGE_KEYS.expenses, visibleExpenseColumns);
  saveColumnConfig(COLUMN_STORAGE_KEYS.revenue, visibleRevenueColumns);

  // Exponer funciones globalmente
  window.switchTab = switchTab;
  window.openAddExpenseSubscriptionModal = () => openExpenseSubscriptionModal("create");
  window.openAddCustomerSubscriptionModal = openAddCustomerSubscriptionModal;
  window.submitCustomerSubscription = submitCustomerSubscription;
  window.openExpenseColumnConfigModal = openExpenseColumnConfigModal;
  window.closeExpenseColumnConfigModal = closeExpenseColumnConfigModal;
  window.applyExpenseColumnConfig = applyExpenseColumnConfig;
  window.resetExpenseColumnConfig = resetExpenseColumnConfig;
  window.openRevenueColumnConfigModal = openRevenueColumnConfigModal;
  window.closeRevenueColumnConfigModal = closeRevenueColumnConfigModal;
  window.applyRevenueColumnConfig = applyRevenueColumnConfig;
  window.resetRevenueColumnConfig = resetRevenueColumnConfig;
  window.handleExpenseSearch = handleExpenseSearch;
  window.handleRevenueSearch = handleRevenueSearch;
  window.updateExpenseFilter = updateExpenseFilter;
  window.updateRevenueFilter = updateRevenueFilter;
  window.toggleExpenseFilters = toggleExpenseFilters;
  window.toggleRevenueFilters = toggleRevenueFilters;
  window.changeExpensePage = changeExpensePage;
  window.changeRevenuePage = changeRevenuePage;
  window.goToExpensePage = goToExpensePage;
  window.goToRevenuePage = goToRevenuePage;
  window.handleExpenseRowClick = handleExpenseRowClick;
  window.handleRevenueRowClick = handleRevenueRowClick;
  window.openExpenseDrawerById = openExpenseDrawerById;
  window.openRevenueDrawerById = openRevenueDrawerById;
  window.closeExpenseDrawer = closeExpenseDrawer;
  window.closeRevenueDrawer = closeRevenueDrawer;
  window.submitExpenseSubscription = submitExpenseSubscription;
  window.closeExpenseSubscriptionModal = closeExpenseSubscriptionModal;
  window.convertCustomerSubscription = convertCustomerSubscription;
  window.cancelCustomerSubscription = cancelCustomerSubscription;
  window.openExpenseCTA = () => {
    switchTab("expenses");
    openExpenseSubscriptionModal("create");
  };
  window.openRevenueCTA = () => {
    switchTab("revenue");
    openAddCustomerSubscriptionModal();
  };

  
  // Cargar datos iniciales
  loadMySubscriptions();
}


// Exportar con el nombre esperado por main.js
export const initSubscriptions = initSubscriptionsPage;

export default renderSubscriptions;
