const sidebarViews = {
  DETAIL: 'detail',
  FORM: 'form',
  EMPTY: 'empty',
};

const budgetState = {
  month: new Date().toISOString().slice(0, 7),
  budgets: [],
  summary: {
    planned_total: 0,
    actual_total: 0,
    remaining_total: 0,
    on_track_categories: 0,
    tracked_categories: 0,
  },
  suggestions: [],
  filters: {
    search: '',
  },
  selectedId: null,
  editingId: null,
  sidebarView: sidebarViews.DETAIL,
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

function formatPercent(value) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setLoading(isLoading) {
  budgetState.loading = isLoading;
  const spinner = document.querySelector('[data-budget-loading]');
  if (spinner) spinner.hidden = !isLoading;
}

function setError(message) {
  budgetState.error = message;
  const box = document.querySelector('[data-budget-error]');
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
        <p class="module-error__title">No pudimos cargar los presupuestos</p>
        <p class="module-error__message">${escapeHtml(message)}</p>
      </div>
      <button type="button" class="btn btn-secondary" data-action="retry-budgets">Reintentar</button>
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
  if (budgetState.budgets.length) {
    if (
      !budgetState.selectedId ||
      !budgetState.budgets.some((item) => item.id === budgetState.selectedId)
    ) {
      budgetState.selectedId = budgetState.budgets[0].id;
    }
    if (budgetState.sidebarView === sidebarViews.EMPTY) {
      budgetState.sidebarView = sidebarViews.DETAIL;
    }
  } else {
    budgetState.selectedId = null;
    if (
      budgetState.sidebarView === sidebarViews.DETAIL ||
      budgetState.sidebarView === sidebarViews.FORM
    ) {
      budgetState.sidebarView = sidebarViews.EMPTY;
    }
  }
}

async function loadBudgets() {
  const response = await window.api.getBudgets({
    month: `${budgetState.month}-01`,
    search: budgetState.filters.search || undefined,
  });
  const rows = Array.isArray(response) ? response : [];
  budgetState.budgets = rows.map((row) => ({
    id: String(row.id),
    category: row.category,
    month: row.month,
    plannedAmount: row.planned_amount,
    actualSpent: row.actual_spent,
    remaining: row.remaining_amount,
    spendingRatio: row.spending_ratio,
    notes: row.notes,
    relatedRevenue: row.related_revenue,
  }));
}

async function loadSummary() {
  const summary = await window.api.getBudgetSummary({ month: `${budgetState.month}-01` });
  if (summary) {
    budgetState.summary = summary;
  }
}

async function loadSuggestions() {
  try {
    const suggestions = await window.api.getBudgetSuggestions({
      month: `${budgetState.month}-01`,
      historyMonths: 3,
    });
    budgetState.suggestions = Array.isArray(suggestions) ? suggestions : [];
  } catch (error) {
    budgetState.suggestions = [];
  }
}

function renderSummary() {
  const planned = document.getElementById('budget-planned');
  const actual = document.getElementById('budget-actual');
  const remaining = document.getElementById('budget-remaining');
  const onTrack = document.getElementById('budget-ontrack');

  if (planned) planned.textContent = formatCurrency(budgetState.summary.planned_total ?? 0);
  if (actual) actual.textContent = formatCurrency(budgetState.summary.actual_total ?? 0);
  if (remaining) remaining.textContent = formatCurrency(budgetState.summary.remaining_total ?? 0);
  if (onTrack)
    onTrack.textContent = `${budgetState.summary.on_track_categories ?? 0}/${
      budgetState.summary.tracked_categories ?? 0
    }`;
}

function renderBudgetTable() {
  const tbody = document.querySelector('[data-budget-table]');
  if (!tbody) return;

  if (!budgetState.budgets.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <span class="empty-state__icon">📊</span>
            <h3>No hay presupuestos definidos para este mes.</h3>
            <p>Configura un presupuesto para controlar tus gastos por categoría.</p>
            <button type="button" class="btn btn-primary" data-open-budget>Crear presupuesto</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = budgetState.budgets
    .map((item) => {
      const isSelected = item.id === budgetState.selectedId;
      const ratio = item.spendingRatio ?? 0;
      const progress = Math.min(Math.max(ratio, 0), 150);
      const barClass = ratio < 80 ? 'progress--success' : ratio <= 100 ? 'progress--warning' : 'progress--danger';
      return `
        <tr data-budget-row="${item.id}" class="budgets-table__row${isSelected ? ' is-selected' : ''}">
          <td>
            <div class="table-cell--main">
              <strong>${escapeHtml(item.category)}</strong>
              <span>${escapeHtml(item.notes || 'Sin notas adicionales')}</span>
            </div>
          </td>
          <td>${formatCurrency(item.plannedAmount ?? 0)}</td>
          <td>${formatCurrency(item.actualSpent ?? 0)}</td>
          <td>${formatCurrency(item.remaining ?? 0)}</td>
          <td>
            <div class="progress ${barClass}">
              <div class="progress__bar" style="width: ${progress > 100 ? 100 : progress}%"></div>
              <span class="progress__label">${formatPercent(ratio)}</span>
            </div>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-icon" data-budget-edit="${item.id}" aria-label="Editar">✏️</button>
              <button type="button" class="btn-icon btn-icon--danger" data-budget-delete="${item.id}" aria-label="Eliminar">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderSuggestions() {
  const list = document.querySelector('[data-budget-suggestions]');
  if (!list) return;

  if (!budgetState.suggestions.length) {
    list.innerHTML = '<li class="empty">Sin recomendaciones para este periodo</li>';
    return;
  }

  list.innerHTML = budgetState.suggestions
    .map(
      (suggestion) => `
        <li>
          <span class="title">${escapeHtml(suggestion.category)}</span>
          <span class="meta">
            Promedio: ${formatCurrency(suggestion.avg_monthly_spend ?? 0)} · Actual: ${formatCurrency(
        suggestion.planned_amount ?? 0
      )}
          </span>
          <span class="meta">
            Recomendación: ${
              suggestion.recommendation === 'incrementar'
                ? 'Incrementar presupuesto'
                : suggestion.recommendation === 'optimizar'
                ? 'Optimizar gasto'
                : suggestion.recommendation === 'nuevo'
                ? 'Sin presupuesto actual'
                : 'Mantener'
            }
          </span>
        </li>
      `
    )
    .join('');
}

function buildBudgetFormHTML(budget = {}) {
  return `
    <form class="sidebar-form" data-form-type="budget" style="display: flex; flex-direction: column; max-height: 95vh; overflow: hidden;">
      <header class="sidebar-form__header" style="flex-shrink: 0;">
        <h3>${budget.id ? 'Editar presupuesto' : 'Nuevo presupuesto'}</h3>
        <button type="button" class="btn-ghost" data-action="cancel-form">Cancelar</button>
      </header>
      <div class="form-grid" style="flex: 1; overflow-y: auto; padding: 1rem;">
        <label>
          <span>Categoría *</span>
          <input type="text" name="category" value="${escapeHtml(budget.category || '')}" required />
        </label>
        <label>
          <span>Mes</span>
          <input type="month" name="month" value="${budget.month ? budget.month.slice(0, 7) : budgetState.month}" required />
        </label>
        <label>
          <span>Monto planificado (€)</span>
          <input type="number" min="0" step="0.01" name="plannedAmount" value="${budget.plannedAmount != null ? budget.plannedAmount : ''}" required />
        </label>
        <label class="wide">
          <span>Notas</span>
          <textarea name="notes" rows="3">${escapeHtml(budget.notes || '')}</textarea>
        </label>
      </div>
      <footer class="sidebar-form__footer" style="flex-shrink: 0; border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 0;">
        <button type="submit" class="btn btn-primary">${budget.id ? 'Guardar cambios' : 'Crear presupuesto'}</button>
      </footer>
    </form>
  `;
}

function buildBudgetDetailHTML(budget) {
  if (!budget) {
    return `
      <div class="sidebar-empty">
        <span class="sidebar-empty__icon">📊</span>
        <p>Selecciona una categoría para ver su evolución.</p>
      </div>
    `;
  }

  const ratio = budget.spendingRatio ?? 0;
  const status =
    ratio <= 80 ? 'En buen camino' : ratio <= 100 ? 'Vigilando' : 'Sobrepasado';
  const badge =
    ratio <= 80 ? 'success' : ratio <= 100 ? 'warning' : 'danger';

  return `
    <article class="sidebar-card">
      <header class="sidebar-card__header">
        <div>
          <h3>${escapeHtml(budget.category)}</h3>
          <p>${escapeHtml(budget.notes || 'Sin notas adicionales')}</p>
        </div>
        <span class="badge badge--${badge}">${status}</span>
      </header>
      <dl class="detail-grid">
        <div>
          <dt>Planificado</dt>
          <dd>${formatCurrency(budget.plannedAmount ?? 0)}</dd>
        </div>
        <div>
          <dt>Gasto real</dt>
          <dd>${formatCurrency(budget.actualSpent ?? 0)}</dd>
        </div>
        <div>
          <dt>Disponible</dt>
          <dd>${formatCurrency(budget.remaining ?? 0)}</dd>
        </div>
        <div>
          <dt>Avance</dt>
          <dd>${formatPercent(ratio)}</dd>
        </div>
        <div>
          <dt>Ingresos vinculados</dt>
          <dd>${formatCurrency(budget.relatedRevenue ?? 0)}</dd>
        </div>
      </dl>
      <footer class="sidebar-card__footer">
        <button type="button" class="btn btn-secondary" data-budget-edit="${budget.id}">Editar presupuesto</button>
      </footer>
    </article>
  `;
}

function renderSidebar() {
  const container = document.querySelector('[data-budget-sidebar]');
  if (!container) return;

  let html = '';

  if (budgetState.sidebarView === sidebarViews.EMPTY) {
    html = `
      <div class="sidebar-empty">
        <span class="sidebar-empty__icon">📊</span>
        <p>No hay presupuestos definidos.</p>
        <button type="button" class="btn btn-primary" data-open-budget>Crear presupuesto</button>
      </div>
    `;
  } else if (budgetState.sidebarView === sidebarViews.FORM) {
    const budget =
      budgetState.editingId &&
      budgetState.budgets.find((item) => item.id === budgetState.editingId);
    html = buildBudgetFormHTML(budget || {});
  } else {
    const budget = budgetState.budgets.find((item) => item.id === budgetState.selectedId);
    html = buildBudgetDetailHTML(budget);
  }

  container.innerHTML = html;
}

async function refreshBudgetModule() {
  if (typeof window.api === 'undefined') {
    setError('Servicio API no disponible. Comprueba la carga de api.js');
    return;
  }

  if (!window.api.isAuthenticated()) {
    setError('Inicia sesión para gestionar tu presupuesto.');
    return;
  }

  try {
    setLoading(true);
    setError(null);
    await Promise.all([loadBudgets(), loadSummary(), loadSuggestions()]);
    ensureSelection();
    renderSummary();
    renderBudgetTable();
    renderSuggestions();
    renderSidebar();
  } catch (error) {
    console.error('Error loading budgets', error);
    setError('Ocurrió un problema al cargar los presupuestos.');
  } finally {
    setLoading(false);
  }
}

async function handleBudgetFormSubmit(event) {
  event.preventDefault();
  const form = event.target.closest('form');
  if (!form) return;
  const data = new FormData(form);
  const monthInput = data.get('month')?.toString();

  const payload = {
    category: data.get('category')?.toString().trim(),
    month: monthInput ? `${monthInput}-01` : `${budgetState.month}-01`,
    plannedAmount: data.get('plannedAmount') ? Number.parseFloat(data.get('plannedAmount')) : 0,
    notes: data.get('notes')?.toString().trim() || undefined,
  };

  const editingId = budgetState.editingId;

  try {
    let response;
    if (editingId) {
      response = await window.api.updateBudget(editingId, payload);
      budgetState.selectedId = String(editingId);
      showToast('Presupuesto actualizado correctamente', 'success');
    } else {
      response = await window.api.createBudget(payload);
      if (response?.id) {
        budgetState.selectedId = String(response.id);
      }
      showToast('Presupuesto creado correctamente', 'success');
    }
    budgetState.editingId = null;
    budgetState.sidebarView = sidebarViews.DETAIL;
    await refreshBudgetModule();
  } catch (error) {
    console.error('Error saving budget', error);
    showToast('No se pudo guardar el presupuesto', 'error');
  }
}

async function handleBudgetDelete(id) {
  if (!window.confirm('¿Seguro que deseas eliminar este presupuesto?')) return;
  try {
    await window.api.deleteBudget(id);
    showToast('Presupuesto eliminado', 'success');
    if (budgetState.selectedId === id) {
      budgetState.selectedId = null;
    }
    await refreshBudgetModule();
  } catch (error) {
    console.error('Error deleting budget', error);
    showToast('No se pudo eliminar el presupuesto', 'error');
  }
}

function handleSubmit(event) {
  if (event.target.matches('[data-form-type="budget"]')) {
    void handleBudgetFormSubmit(event);
  }
}

function handleInput(event) {
  if (event.target.matches('[data-budget-search]')) {
    budgetState.filters.search = event.target.value;
    window.clearTimeout(handleInput.timer);
    handleInput.timer = window.setTimeout(() => void refreshBudgetModule(), 320);
  }
}

function handleChange(event) {
  if (event.target.matches('[data-budget-month]')) {
    budgetState.month = event.target.value || budgetState.month;
    void refreshBudgetModule();
  }
}

function handleClick(event) {
  const retryButton = event.target.closest('[data-action="retry-budgets"]');
  if (retryButton) {
    void refreshBudgetModule();
    return;
  }

  const newButton = event.target.closest('[data-open-budget]');
  if (newButton) {
    budgetState.editingId = null;
    budgetState.sidebarView = sidebarViews.FORM;
    renderSidebar();
    return;
  }

  const cancelBtn = event.target.closest('[data-action="cancel-form"]');
  if (cancelBtn) {
    budgetState.editingId = null;
    budgetState.sidebarView = budgetState.budgets.length ? sidebarViews.DETAIL : sidebarViews.EMPTY;
    renderSidebar();
    return;
  }

  const editBtn = event.target.closest('[data-budget-edit]');
  if (editBtn) {
    event.stopPropagation();
    budgetState.editingId = String(editBtn.dataset.budgetEdit);
    budgetState.sidebarView = sidebarViews.FORM;
    renderSidebar();
    return;
  }

  const deleteBtn = event.target.closest('[data-budget-delete]');
  if (deleteBtn) {
    event.stopPropagation();
    void handleBudgetDelete(deleteBtn.dataset.budgetDelete);
    return;
  }

  const row = event.target.closest('[data-budget-row]');
  if (row) {
    budgetState.selectedId = String(row.dataset.budgetRow);
    budgetState.sidebarView = sidebarViews.DETAIL;
    renderBudgetTable();
    renderSidebar();
  }
}




export function initBudget() {
  const module = document.querySelector('.budget-module');
  if (!module) return;

  module.addEventListener('click', handleClick);
  module.addEventListener('input', handleInput);
  module.addEventListener('change', handleChange);
  module.addEventListener('submit', handleSubmit);

  window.requestAnimationFrame(() => {
    void refreshBudgetModule();
  });
}

export default function renderBudget() {
  return `
    <section class="module budget-module">
      <header class="module-header">
        <div class="module-title-section">
          <h1>Presupuesto inteligente</h1>
          <p>Compara tus previsiones con el gasto real y recibe recomendaciones.</p>
        </div>
        <div class="module-actions">
          <label class="input input--month">
            <span>Mes</span>
            <input type="month" data-budget-month value="${budgetState.month}" />
          </label>
          <button type="button" class="btn btn-primary" data-open-budget>＋ Nuevo presupuesto</button>
        </div>
      </header>
      <div class="summary-wrap">
        <div class="summary-grid summary-grid--compact">
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-primary-light);">📊</div>
            <div class="card-content">
              <span class="card-label">Planificado</span>
              <span class="card-value" id="budget-planned">€0</span>
            </div>
          </article>
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-secondary-light);">💸</div>
            <div class="card-content">
              <span class="card-label">Gastado</span>
              <span class="card-value" id="budget-actual">€0</span>
            </div>
          </article>
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-success-light);">✅</div>
            <div class="card-content">
              <span class="card-label">Disponible</span>
              <span class="card-value" id="budget-remaining">€0</span>
            </div>
          </article>
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-info-light);">🎯</div>
            <div class="card-content">
              <span class="card-label">Categorías en control</span>
              <span class="card-value" id="budget-ontrack">0</span>
            </div>
          </article>
        </div>
      </div>
      <div class="module-body module-body--split">
        <div class="module-main">
          <div class="module-toolbar">
            <label class="input input--search">
              <span class="input__icon">🔍</span>
              <input type="search" data-budget-search placeholder="Filtrar por categoría..." autocomplete="off" />
            </label>
          </div>
          <div class="table-wrapper">
            <table class="data-table data-table--compact">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Planificado</th>
                  <th>Real</th>
                  <th>Disponible</th>
                  <th>Avance</th>
                  <th></th>
                </tr>
              </thead>
              <tbody data-budget-table></tbody>
            </table>
          </div>
          <div class="module-loading" data-budget-loading hidden>
            <span class="spinner"></span>
            <p>Cargando presupuestos...</p>
          </div>
          <div class="module-error" data-budget-error hidden></div>
        </div>
        <aside class="module-sidebar" data-budget-sidebar></aside>
      </div>
      <footer class="module-footer">
        <section>
          <h4>Recomendaciones inteligentes</h4>
          <ul class="insight-list" data-budget-suggestions></ul>
        </section>
      </footer>
    </section>
  `;
}
