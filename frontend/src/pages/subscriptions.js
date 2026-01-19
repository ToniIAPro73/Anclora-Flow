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
  
  // Render table
  const container = document.querySelector('[data-tab-content="expenses"] .table-container');
  if (!container) return;
  
  if (subscriptions.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">📊</div>
        <p style="color: var(--text-secondary); margin: 0 0 1rem 0;">No tienes suscripciones de gastos registradas</p>
        <button type="button" class="btn btn-primary" onclick="openAddExpenseSubscriptionModal()">
          + Añadir suscripción
        </button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <table class="data-table" style="width: 100%;">
      <thead>
        <tr>
          <th style="text-align: left; padding: 1rem;">Servicio</th>
          <th style="text-align: left; padding: 1rem;">Proveedor</th>
          <th style="text-align: left; padding: 1rem;">Categoría</th>
          <th style="text-align: right; padding: 1rem;">Importe</th>
          <th style="text-align: center; padding: 1rem;">Frecuencia</th>
          <th style="text-align: center; padding: 1rem;">Próximo cargo</th>
          <th style="text-align: center; padding: 1rem;">Estado</th>
          <th style="text-align: center; padding: 1rem;">Trial</th>
          <th style="text-align: right; padding: 1rem;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${subscriptions.map((sub, index) => renderExpenseSubscriptionRow(sub, index === 0)).join('')}
      </tbody>
    </table>
  `;
}

function renderExpenseSubscriptionRow(sub, isFirst = false) {
  const statusBadge = {
    trial: { label: 'Prueba', class: 'badge--warning' },
    active: { label: 'Activa', class: 'badge--success' },
    paused: { label: 'Pausada', class: 'badge--neutral' },
    cancelled: { label: 'Cancelada', class: 'badge--error' }
  }[sub.status] || { label: sub.status, class: '' };
  
  const trialInfo = sub.has_trial && sub.status === 'trial' 
    ? `${sub.trial_days} días${sub.trial_requires_card ? ' (tarjeta req.)' : ' (sin tarjeta)'}`
    : '—';
  
  const rowStyle = isFirst ? 'background: rgba(139, 92, 246, 0.1); border-left: 3px solid #8b5cf6;' : '';
  
  return `
    <tr style="${rowStyle} ${isFirst ? 'font-weight: 500;' : ''}">
      <td style="padding: 1rem;"><strong>${escapeHtml(sub.service_name)}</strong></td>
      <td style="padding: 1rem;">${escapeHtml(sub.provider)}</td>
      <td style="padding: 1rem;"><span class="category-badge">${escapeHtml(sub.category || '—')}</span></td>
      <td style="padding: 1rem; text-align: right;">${formatCurrency(sub.amount)}</td>
      <td style="padding: 1rem; text-align: center;">${sub.billing_frequency}</td>
      <td style="padding: 1rem; text-align: center;">${sub.next_billing_date ? formatDate(sub.next_billing_date) : '—'}</td>
      <td style="padding: 1rem; text-align: center;"><span class="badge ${statusBadge.class}">${statusBadge.label}</span></td>
      <td style="padding: 1rem; text-align: center;">${trialInfo}</td>
      <td style="padding: 1rem; text-align: right;">
        <button type="button" class="btn-icon" title="Editar" style="margin-right: 0.5rem;" onclick="showNotification('Editar suscripción: Funcionalidad en desarrollo', 'info')">✏️</button>
        <button type="button" class="btn-icon" title="Eliminar" onclick="showNotification('Eliminar suscripción: Funcionalidad en desarrollo', 'info')">🗑️</button>
      </td>
    </tr>
  `;
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
  
  // Render table
  const container = document.querySelector('[data-tab-content="revenue"] .table-container');
  if (!container) return;
  
  if (subscriptions.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">💰</div>
        <p style="color: var(--text-secondary); margin: 0 0 1rem 0;">No tienes clientes suscritos aún</p>
        <button type="button" class="btn btn-primary" onclick="openAddCustomerSubscriptionModal()">
          + Añadir cliente
        </button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <table class="data-table" style="width: 100%;">
      <thead>
        <tr>
          <th style="text-align: left; padding: 1rem;">Cliente</th>
          <th style="text-align: left; padding: 1rem;">Plan</th>
          <th style="text-align: right; padding: 1rem;">Importe</th>
          <th style="text-align: center; padding: 1rem;">Frecuencia</th>
          <th style="text-align: center; padding: 1rem;">Próx. factura</th>
          <th style="text-align: center; padding: 1rem;">Estado</th>
          <th style="text-align: center; padding: 1rem;">Trial</th>
          <th style="text-align: right; padding: 1rem;">Revenue total</th>
          <th style="text-align: right; padding: 1rem;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${subscriptions.map((sub, index) => renderCustomerSubscriptionRow(sub, index === 0)).join('')}
      </tbody>
    </table>
  `;
}

function renderCustomerSubscriptionRow(sub, isFirst = false) {
  const statusBadge = {
    trial: { label: 'Prueba', class: 'badge--warning' },
    active: { label: 'Activa', class: 'badge--success' },
    past_due: { label: 'Impagada', class: 'badge--error' },
    cancelled: { label: 'Cancelada', class: 'badge--neutral' }
  }[sub.status] || { label: sub.status, class: '' };
  
  const trialInfo = sub.has_trial && sub.status === 'trial'
    ? `${sub.trial_days} días (expira: ${formatDate(sub.trial_end_date)})`
    : '—';
  
  const rowStyle = isFirst ? 'background: rgba(99, 102, 241, 0.1); border-left: 3px solid #6366f1;' : '';
  
  return `
    <tr style="${rowStyle} ${isFirst ? 'font-weight: 500;' : ''}">
      <td style="padding: 1rem;"><strong>${escapeHtml(sub.client_name || 'Cliente')}</strong></td>
      <td style="padding: 1rem;">
        <span class="plan-badge plan-badge--${sub.plan_code}">${escapeHtml(sub.plan_name)}</span>
      </td>
      <td style="padding: 1rem; text-align: right;">${formatCurrency(sub.amount)}</td>
      <td style="padding: 1rem; text-align: center;">${sub.billing_frequency}</td>
      <td style="padding: 1rem; text-align: center;">${sub.next_billing_date ? formatDate(sub.next_billing_date) : '—'}</td>
      <td style="padding: 1rem; text-align: center;"><span class="badge ${statusBadge.class}">${statusBadge.label}</span></td>
      <td style="padding: 1rem; text-align: center;">${trialInfo}</td>
      <td style="padding: 1rem; text-align: right;">${formatCurrency(sub.total_revenue || 0)}</td>
      <td style="padding: 1rem; text-align: right;">
        <button type="button" class="btn-icon" title="Ver detalles" style="margin-right: 0.5rem;">👁️</button>
        <button type="button" class="btn-icon" title="Editar" style="margin-right: 0.5rem;" onclick="showNotification('Editar suscripción de cliente: Funcionalidad en desarrollo', 'info')">✏️</button>
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
      <!-- Hero Banner -->
      <div class="subscriptions__hero module-banner" style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 16px; padding: 2rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
        <div class="subscriptions__hero-copy">
          <h1 style="margin: 0 0 0.5rem 0; font-size: 1.75rem; color: white;">Gestión de Suscripciones</h1>
          <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 1rem;">
            Controla tus gastos recurrentes y los ingresos de tus clientes
          </p>
        </div>
      </div>
      
      <!-- Tabs with modern styling -->
      <div class="tabs-container" style="margin-bottom: 2rem; border-bottom: 2px solid var(--border-color);">
        <div style="display: flex; gap: 1rem;">
          <button 
            type="button" 
            class="tab-button active" 
            data-tab="expenses" 
            onclick="switchTab('expenses')"
            style="padding: 1rem 2rem; background: none; border: none; border-bottom: 3px solid #8b5cf6; color: #8b5cf6; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem;"
          >
            💸 Mis Gastos
            <span class="badge" data-expenses-count style="background: #8b5cf6; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">0</span>
          </button>
          
          <button 
            type="button" 
            class="tab-button" 
            data-tab="revenue" 
            onclick="switchTab('revenue')"
            style="padding: 1rem 2rem; background: none; border: none; border-bottom: 3px solid transparent; color: var(--text-secondary); font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem;"
          >
            💰 Mis Ingresos (Clientes)
            <span class="badge" data-revenue-count style="background: var(--text-secondary); color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">0</span>
          </button>
        </div>
      </div>
      
      <!-- Tab Content: Mis Gastos -->
      <div data-tab-content="expenses" style="display: block;">
        <!-- Summary Cards -->
        <div class="summary-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
          <div class="stat-card" style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div class="card-icon" style="width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(139, 92, 246, 0.2); color: #8b5cf6; font-size: 1.5rem;">📊</div>
              <div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Total suscripciones</div>
                <div id="expenses-total-count" style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">0</div>
              </div>
            </div>
          </div>
          
          <div class="stat-card" style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div class="card-icon" style="width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(16, 185, 129, 0.2); color: #10b981; font-size: 1.5rem;">📈</div>
              <div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Activas</div>
                <div id="expenses-active-count" style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">0</div>
              </div>
            </div>
          </div>
          
          <div class="stat-card" style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div class="card-icon" style="width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(245, 158, 11, 0.2); color: #f59e0b; font-size: 1.5rem;">💰</div>
              <div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Gasto mensual</div>
                <div id="expenses-monthly-cost" style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">0,00 €</div>
              </div>
            </div>
          </div>
          
          <div class="stat-card" style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div class="card-icon" style="width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(236, 72, 153, 0.2); color: #ec4899; font-size: 1.5rem;">⏰</div>
              <div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Coste recurrente aproximado</div>
                <div id="expenses-approx-cost" style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">0,00 €</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Table -->
        <div class="table-container" style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; overflow-x: auto;">
          <div style="text-align: center; padding: 3rem;">
            <div class="spinner"></div>
            <p>Cargando suscripciones...</p>
          </div>
        </div>
      </div>
      
      <!-- Tab Content: Mis Ingresos -->
      <div data-tab-content="revenue" style="display: none;">
       <!-- Summary Cards -->
        <div class="summary-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
          <div class="stat-card" style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div class="card-icon" style="width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(59, 130, 246, 0.2); color: #3b82f6; font-size: 1.5rem;">👥</div>
              <div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Total clientes</div>
                <div id="revenue-total-count" style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">0</div>
              </div>
            </div>
          </div>
          
          <div class="stat-card" style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div class="card-icon" style="width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(16, 185, 129, 0.2); color: #10b981; font-size: 1.5rem;">✅</div>
              <div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Activos</div>
                <div id="revenue-active-count" style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">0</div>
              </div>
            </div>
          </div>
          
          <div class="stat-card" style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div class="card-icon" style="width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(34, 197, 94, 0.2); color: #22c55e; font-size: 1.5rem;">💵</div>
              <div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">MRR (mensual)</div>
                <div id="revenue-mrr" style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">0,00 €</div>
              </div>
            </div>
          </div>
          
          <div class="stat-card" style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div class="card-icon" style="width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(99, 102, 241, 0.2); color: #6366f1; font-size: 1.5rem;">📅</div>
              <div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">ARR (anual)</div>
                <div id="revenue-arr" style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">0,00 €</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Table -->
        <div class="table-container" style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; overflow-x: auto;">
          <div style="text-align: center; padding: 3rem;">
            <p style="color: var(--text-secondary);">
              Cargando clientes...
            </p>
          </div>
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


// ==========================================
// MODALES
// ==========================================

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
          <footer class="modal__footer">
            <button class="btn-secondary" onclick="document.getElementById('add-customer-subscription-modal').remove()">Cancelar</button>
            <button class="btn-primary" onclick="submitCustomerSubscription()">Crear Suscripción</button>
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
  // Exponer funciones globalmente
  window.switchTab = switchTab;
  window.openAddExpenseSubscriptionModal = () => showNotification('Modal de añadir suscripción de gasto - Por implementar', 'info');
  window.openAddCustomerSubscriptionModal = openAddCustomerSubscriptionModal;
  window.submitCustomerSubscription = submitCustomerSubscription;

  
  // Cargar datos iniciales
  loadMySubscriptions();
}


// Exportar con el nombre esperado por main.js
export const initSubscriptions = initSubscriptionsPage;

export default renderSubscriptions;
