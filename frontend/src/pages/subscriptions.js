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

// ==========================================
// UTILIDADES
// ==========================================
const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2
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
      tabEl.classList.add('active');
    } else {
      tabEl.classList.remove('active');
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
}

// ==========================================
// RENDERIZADO - TAB DE GASTOS
// ==========================================
function renderExpensesTab() {
  const container = document.querySelector('[data-tab-content="expenses"]');
  if (!container) return;
  
  const summary = subscriptionState.mySubscriptionsSummary;
  const subscriptions = subscriptionState.mySubscriptions;
  
  container.innerHTML = `
    <!-- Métricas de gastos -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      <div class="stat-card">
        <div class="stat-card__label">Total suscripciones</div>
        <div class="stat-card__value">${summary.total}</div>
        <div class="stat-card__sublabel">${summary.active} activas · ${summary.trial} en prueba</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card__label">Gasto mensual</div>
        <div class="stat-card__value">${formatCurrency(summary.monthly_cost)}</div>
        <div class="stat-card__sublabel">Coste recurrente aproximado</div>
      </div>
      
      ${summary.trials_expiring_soon > 0 ? `
        <div class="stat-card stat-card--warning">
          <div class="stat-card__label">⚠️ Trials por expirar</div>
          <div class="stat-card__value">${summary.trials_expiring_soon}</div>
          <div class="stat-card__sublabel">En los próximos 7 días</div>
        </div>
      ` : ''}
    </div>
    
    <!-- Tabla de suscripciones de gastos -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Servicio</th>
            <th>Proveedor</th>
            <th>Categoría</th>
            <th>Importe</th>
            <th>Frecuencia</th>
            <th>Próximo cargo</th>
            <th>Estado</th>
            <th>Trial</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${subscriptions.length === 0 ? `
            <tr>
              <td colspan="9" style="text-align: center; padding: 3rem;">
                <p style="color: var(--text-secondary); margin: 0;">No tienes suscripciones de gastos registradas</p>
                <button type="button" class="btn-primary" style="margin-top: 1rem;" onclick="openAddExpenseSubscriptionModal()">
                  + Añadir suscripción
                </button>
              </td>
            </tr>
          ` :subscriptions.map(sub => renderExpenseSubscriptionRow(sub)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderExpenseSubscriptionRow(sub) {
  const statusBadge = {
    trial: { label: 'Prueba', class: 'badge--warning' },
    active: { label: 'Activa', class: 'badge--success' },
    paused: { label: 'Pausada', class: 'badge--neutral' },
    cancelled: { label: 'Cancelada', class: 'badge--error' }
  }[sub.status] || { label: sub.status, class: '' };
  
  const trialInfo = sub.has_trial && sub.status === 'trial' 
    ? `${sub.trial_days} días${sub.trial_requires_card ? ' (tarjeta req.)' : ' (sin tarjeta)'}`
    : '—';
  
  return `
    <tr>
      <td><strong>${escapeHtml(sub.service_name)}</strong></td>
      <td>${escapeHtml(sub.provider)}</td>
      <td><span class="category-badge">${escapeHtml(sub.category || '—')}</span></td>
      <td>${formatCurrency(sub.amount)}</td>
      <td>${sub.billing_frequency}</td>
      <td>${formatDate(sub.next_billing_date)}</td>
      <td><span class="badge ${statusBadge.class}">${statusBadge.label}</span></td>
      <td>${trialInfo}</td>
      <td>
        <button type="button" class="btn-icon" title="Editar">✏️</button>
        <button type="button" class="btn-icon" title="Eliminar">🗑️</button>
      </td>
    </tr>
  `;
}

// ==========================================
// RENDERIZADO - TAB DE INGRESOS
// ==========================================
function renderRevenueTab() {
  const container = document.querySelector('[data-tab-content="revenue"]');
  if (!container) return;
  
  const summary = subscriptionState.customerSubscriptionsSummary;
  const subscriptions = subscriptionState.customerSubscriptions;
  
  container.innerHTML = `
    <!-- Métricas de ingresos -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      <div class="stat-card stat-card--success">
        <div class="stat-card__label">MRR (Mensual)</div>
        <div class="stat-card__value">${formatCurrency(summary.mrr)}</div>
        <div class="stat-card__sublabel">Ingresos recurrentes mensuales</div>
      </div>
      
      <div class="stat-card stat-card--success">
        <div class="stat-card__label">ARR (Anual)</div>
        <div class="stat-card__value">${formatCurrency(summary.arr)}</div>
        <div class="stat-card__sublabel">Proyección anual</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card__label">Clientes suscritos</div>
        <div class="stat-card__value">${summary.total}</div>
        <div class="stat-card__sublabel">${summary.active} activos · ${summary.trial} en prueba</div>
      </div>
      
      ${summary.trials_expiring_soon > 0 ? `
        <div class="stat-card stat-card--warning">
          <div class="stat-card__label">⚠️ Trials por expirar</div>
          <div class="stat-card__value">${summary.trials_expiring_soon}</div>
          <div class="stat-card__sublabel">Oportunidades de conversión</div>
        </div>
      ` : ''}
    </div>
    
    <!-- Tabla de suscripciones de clientes -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Plan</th>
            <th>Importe</th>
            <th>Frecuencia</th>
            <th>Próx. factura</th>
            <th>Estado</th>
            <th>Trial</th>
            <th>Revenue total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${subscriptions.length === 0 ? `
            <tr>
              <td colspan="9" style="text-align: center; padding: 3rem;">
                <p style="color: var(--text-secondary); margin: 0;">No tienes clientes suscritos aún</p>
                <button type="button" class="btn-primary" style="margin-top: 1rem;" onclick="openAddCustomerSubscriptionModal()">
                  + Añadir cliente suscrito
                </button>
              </td>
            </tr>
          ` : subscriptions.map(sub => renderCustomerSubscriptionRow(sub)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderCustomerSubscriptionRow(sub) {
  const statusBadge = {
    trial: { label: 'Prueba', class: 'badge--warning' },
    active: { label: 'Activa', class: 'badge--success' },
    past_due: { label: 'Impagada', class: 'badge--error' },
    cancelled: { label: 'Cancelada', class: 'badge--neutral' }
  }[sub.status] || { label: sub.status, class: '' };
  
  const trialInfo = sub.has_trial && sub.status === 'trial'
    ? `${sub.trial_days} días (expira: ${formatDate(sub.trial_end_date)})`
    : '—';
  
  return `
    <tr>
      <td><strong>${escapeHtml(sub.client_name || 'Cliente')}</strong></td>
      <td>
        <span class="plan-badge plan-badge--${sub.plan_code}">${escapeHtml(sub.plan_name)}</span>
      </td>
      <td>${formatCurrency(sub.amount)}</td>
      <td>${sub.billing_frequency}</td>
      <td>${formatDate(sub.next_billing_date)}</td>
      <td><span class="badge ${statusBadge.class}">${statusBadge.label}</span></td>
      <td>${trialInfo}</td>
      <td>${formatCurrency(sub.total_revenue || 0)}</td>
      <td>
        <button type="button" class="btn-icon" title="Ver detalles">👁️</button>
        <button type="button" class="btn-icon" title="Editar">✏️</button>
        ${sub.status === 'trial' ? '<button type="button" class="btn-icon" title="Convertir">✅</button>' : ''}
      </td>
    </tr>
  `;
}

// ==========================================
// RENDERIZADO PRINCIPAL
// ==========================================
export function renderSubscriptions() {
  const html = `
    <section class="subscriptions-module">
      <!-- Header -->
      <header class="module-header">
        <div>
          <h1 style="margin: 0; font-size: 1.75rem;">Gestión de Suscripciones</h1>
          <p style="margin: 0.5rem 0 0; color: var(--text-secondary);">
            Controla tus gastos recurrentes y los ingresos de tus clientes
          </p>
        </div>
      </header>
      
      <!-- Tabs -->
      <div class="tabs-container" style="margin: 2rem 0 1.5rem;">
        <div class="tabs">
          <button 
            type="button" 
            class="tab active" 
            data-tab="expenses" 
            onclick="switchTab('expenses')"
            style="padding: 0.75rem 1.5rem; font-size: 1rem; border-bottom: 3px solid var(--primary-color);"
          >
            💸 Mis Gastos
            <span class="tab-badge" data-expenses-count>0</span>
          </button>
          
          <button 
            type="button" 
            class="tab" 
            data-tab="revenue" 
            onclick="switchTab('revenue')"
            style="padding: 0.75rem 1.5rem; font-size: 1rem;"
          >
            💰 Mis Ingresos (Clientes)
            <span class="tab-badge" data-revenue-count>0</span>
          </button>
        </div>
      </div>
      
      <!-- Tab Content: Mis Gastos -->
      <div data-tab-content="expenses" style="display: block;">
        <div style="text-align: center; padding: 3rem;">
          <div class="spinner"></div>
          <p>Cargando suscripciones...</p>
        </div>
      </div>
      
      <!-- Tab Content: Mis Ingresos -->
      <div data-tab-content="revenue" style="display: none;">
        <div style="text-align: center; padding: 3rem;">
          <p style="color: var(--text-secondary);">
            Cambia a esta pestaña para ver los clientes suscritos a tus servicios
          </p>
        </div>
      </div>
    </section>
  `;
  
  // Inicializar página
  setTimeout(() => {
    initSubscriptionsPage();
  }, 100);
  
  return html;
}

function initSubscriptionsPage() {
  // Exponer funciones globalmente
  window.switchTab = switchTab;
  window.openAddExpenseSubscriptionModal = () => showNotification('Modal de añadir suscripción de gasto - Por implementar', 'info');
  window.openAddCustomerSubscriptionModal = () => showNotification('Modal de añadir cliente suscrito - Por implementar', 'info');
  
  // Cargar datos iniciales
  loadMySubscriptions();
}

// Exportar con el nombre esperado por main.js
export const initSubscriptions = initSubscriptionsPage;

export default renderSubscriptions;
