
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

async function loadBudgets() {
  const response = await window.api.getBudgets({
    month: `${budgetState.month}-01`,
    search: budgetState.filters.search || undefined,
  });
  const { budgets = [] } = response || {};
  budgetState.budgets = budgets.map((row) => ({
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
    const suggestions = await window.api.getAutoBudgetRecommendations(); 
    // Nota: Usamos getAutoBudgetRecommendations que añadimos a api.js
    budgetState.suggestions = Array.isArray(suggestions) ? suggestions : [];
  } catch (error) {
    budgetState.suggestions = [];
  }
}

function renderSummaryCards() {
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
      const progress = Math.min(Math.max(ratio, 0), 100);
      const barClass = ratio < 80 ? 'progress--success' : ratio <= 100 ? 'progress--warning' : 'progress--danger';
      return `
        <tr data-budget-row="${item.id}" class="budgets-table__row${isSelected ? ' is-selected' : ''}">
          <td>
            <div class="table-cell--main">
              <strong>${escapeHtml(item.category)}</strong>
              ${item.notes ? `<span class="meta">${escapeHtml(item.notes)}</span>` : ''}
            </div>
          </td>
          <td>${formatCurrency(item.plannedAmount ?? 0)}</td>
          <td>${formatCurrency(item.actualSpent ?? 0)}</td>
          <td>${formatCurrency(item.remaining ?? 0)}</td>
          <td>
            <div class="progress ${barClass}">
              <div class="progress__bar" style="width: ${progress}%"></div>
              <span class="progress__label">${formatPercent(ratio)}</span>
            </div>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="table-action" data-budget-edit="${item.id}" aria-label="Editar">✏️</button>
              <button type="button" class="table-action" data-budget-delete="${item.id}" aria-label="Eliminar">🗑️</button>
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
            Promedio: ${formatCurrency(suggestion.avg_monthly_spend ?? 0)}
          </span>
          <span class="meta">
             ${suggestion.recommendation === 'incrementar' ? '⬆️ Incrementar' : 
               suggestion.recommendation === 'optimizar' ? '⬇️ Optimizar' : 'Mantener'}
          </span>
        </li>
      `
    )
    .join('');
}


// --- MODAL LOGIC FOR BUDGET ---

function closeBudgetModal() {
  const modal = document.getElementById('budget-modal');
  if (modal) modal.remove();
  document.body.classList.remove('is-lock-scroll');
}

function getBudgetById(id) {
  return budgetState.budgets.find(b => b.id === id) || null;
}

function openBudgetModal(mode, budgetId = null) {
  closeBudgetModal();
  const budget = budgetId ? getBudgetById(String(budgetId)) : null;
  const title = mode === 'edit' ? 'Editar presupuesto' : 'Nuevo presupuesto';
  const formId = 'budget-form';

  const modalHtml = `
    <div class="modal is-open" id="budget-modal">
      <div class="modal__backdrop" data-modal-close></div>
      <div class="modal__panel" style="width: min(92vw, 500px);">
        <header class="modal__head">
          <div>
            <h2 class="modal__title">${title}</h2>
            <p class="modal__subtitle">Define límites de gasto para tus categorías.</p>
          </div>
          <button type="button" class="modal__close" data-modal-close aria-label="Cerrar">×</button>
        </header>
        <form class="modal-form" id="${formId}" style="overflow: visible;">
          <div class="modal__body modal-form__body">
             <div class="modal-form__grid">
                <label class="form-field">
                  <span>Categoría *</span>
                  <input type="text" name="category" value="${escapeHtml(budget?.category || '')}" required placeholder="Ej. Marketing, Oficina..." />
                </label>
                
                <div class="modal-form__grid modal-form__grid--two">
                  <label class="form-field">
                    <span>Mes *</span>
                    <input type="month" name="month" value="${budget?.month ? budget.month.slice(0, 7) : budgetState.month}" required />
                  </label>
                  <label class="form-field">
                    <span>Monto (€) *</span>
                    <input type="number" min="0" step="0.01" name="plannedAmount" value="${budget?.plannedAmount ?? ''}" required />
                  </label>
                </div>

                <label class="form-field">
                  <span>Notas</span>
                  <textarea name="notes" rows="2" placeholder="Opcional">${escapeHtml(budget?.notes || '')}</textarea>
                </label>
             </div>
          </div>
          <footer class="modal__footer modal-form__footer">
            <button type="button" class="btn-secondary" data-modal-close>Cancelar</button>
            <button type="submit" class="btn-primary">${mode === 'edit' ? 'Guardar cambios' : 'Crear presupuesto'}</button>
          </footer>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  document.body.classList.add('is-lock-scroll');

  const modal = document.getElementById('budget-modal');
  modal.querySelector('.modal__backdrop').addEventListener('click', closeBudgetModal);
  modal.querySelectorAll('[data-modal-close]').forEach(btn => btn.addEventListener('click', closeBudgetModal));
  
  const form = document.getElementById(formId);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = {
      category: data.get('category').trim(),
      month: `${data.get('month')}-01`,
      plannedAmount: parseFloat(data.get('plannedAmount') || 0),
      notes: data.get('notes').trim() || undefined
    };

    try {
      if (mode === 'edit' && budgetId) {
        await window.api.updateBudget(budgetId, payload);
        showToast('Presupuesto actualizado', 'success');
      } else {
        await window.api.createBudget(payload);
        showToast('Presupuesto creado', 'success');
      }
      closeBudgetModal();
      await refreshBudgetModule();
    } catch (err) {
      console.error(err);
      showToast('Error guardando presupuesto', 'error');
    }
  });
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
    renderSummaryCards();
    renderBudgetTable();
    renderSuggestions();
  } catch (error) {
    console.error('Error loading budgets', error);
    setError('Ocurrió un problema al cargar los presupuestos.');
  } finally {
    setLoading(false);
  }
}

async function handleBudgetDelete(id) {
  if (!window.confirm('¿Seguro que deseas eliminar este presupuesto?')) return;
  try {
    await window.api.deleteBudget(id);
    showToast('Presupuesto eliminado', 'success');
    await refreshBudgetModule();
  } catch (error) {
    console.error('Error deleting budget', error);
    showToast('No se pudo eliminar el presupuesto', 'error');
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

  if (event.target.closest('[data-open-budget]')) {
    openBudgetModal('create');
    return;
  }

  const editBtn = event.target.closest('[data-budget-edit]');
  if (editBtn) {
    openBudgetModal('edit', editBtn.dataset.budgetEdit);
    return;
  }

  const deleteBtn = event.target.closest('[data-budget-delete]');
  if (deleteBtn) {
    handleBudgetDelete(deleteBtn.dataset.budgetDelete);
    return;
  }
}

// --- RENDERIZADO PRINCIPAL (Estructura idéntica a Suscripciones/Gastos) ---

export function initBudget() {
  const module = document.querySelector('.budget-module');
  if (!module) return;

  module.addEventListener('click', handleClick);
  module.addEventListener('input', handleInput);
  module.addEventListener('change', handleChange);

  // Inicializar carga
  window.requestAnimationFrame(() => {
    void refreshBudgetModule();
  });
}

export default function renderBudget() {
  return `
    <section class="budget-module" aria-labelledby="budget-title">
      
      <!-- HERO BANNER (Idéntico a Suscripciones) -->
      <header class="expenses__hero">
        <div class="expenses__hero-copy">
          <h1 id="budget-title">Presupuesto Inteligente</h1>
          <p>Compara tus previsiones con el gasto real y recibe recomendaciones de ahorro.</p>
        </div>
        <div class="expenses__hero-actions">
          <button type="button" class="btn-primary" data-open-budget>Nuevo presupuesto</button>
        </div>
      </header>

      <!-- TARJETAS DE RESUMEN -->
      <section aria-labelledby="budget-overview" style="margin: 2rem 0 2.5rem;">
        <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 1.25rem;">
          <h2 id="budget-overview" style="margin: 0; font-size: 1.1rem;">Visión general</h2>
        </div>
        
        <div class="summary-cards">
          <article class="card stat-card">
            <div class="card-icon" style="background: var(--color-primary-light);">📊</div>
            <div class="card-content">
              <span class="card-label">Planificado</span>
              <span class="card-value" id="budget-planned">€0</span>
            </div>
          </article>
          <article class="card stat-card">
            <div class="card-icon" style="background: var(--color-warning-light);">💸</div>
            <div class="card-content">
              <span class="card-label">Gastado</span>
              <span class="card-value" id="budget-actual">€0</span>
            </div>
          </article>
          <article class="card stat-card">
            <div class="card-icon" style="background: var(--color-success-light);">✅</div>
            <div class="card-content">
              <span class="card-label">Disponible</span>
              <span class="card-value" id="budget-remaining">€0</span>
            </div>
          </article>
          <article class="card stat-card">
            <div class="card-icon" style="background: var(--color-tertiary-light);">🎯</div>
            <div class="card-content">
              <span class="card-label">Categorías controladas</span>
              <span class="card-value" id="budget-ontrack">0</span>
            </div>
          </article>
        </div>
      </section>

      <!-- BARRA DE FILTROS (Estilo consistente) -->
      <section aria-labelledby="budget-filters" style="margin: 0 0 2.5rem;">
        <h2 id="budget-filters" style="margin: 0 0 1.25rem; font-size: 1.1rem;">Filtrar presupuesto</h2>
        <section class="expenses__filters" aria-label="Filtros de presupuesto">
          
          <!-- Selector de Mes -->
          <div class="expenses__filters-group">
            <label class="visually-hidden" for="budget-month-filter">Mes</label>
            <input type="month" id="budget-month-filter" class="expenses__select" data-budget-month value="${budgetState.month}" style="padding-right: 1rem;" />
          </div>

          <!-- Buscador -->
          <div class="expenses__filters-group" style="flex: 1;">
            <label class="visually-hidden" for="budget-search">Buscar categoría</label>
            <input type="search" id="budget-search" class="expenses__search" placeholder="Buscar categoría..." autocomplete="off" data-budget-search />
          </div>

          <!-- Botón Recargar -->
          <div class="expenses__filters-group expenses__filters-group--pinned">
            <button type="button" class="btn-ghost" data-action="retry-budgets">Recargar</button>
          </div>
        </section>
      </section>

      <!-- TABLA DE DATOS (Envuelta en Card/Surface) -->
      <section aria-labelledby="budget-table-title" style="margin: 0 0 2.5rem;">
        <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 1rem;">
          <h2 id="budget-table-title" style="margin: 0; font-size: 1.1rem;">Desglose por categorías</h2>
        </div>

        <section class="expenses-table" aria-label="Tabla de presupuestos">
          <div class="expenses-table__surface">
            <table>
              <thead>
                <tr>
                  <th scope="col" style="width: 30%;">Categoría</th>
                  <th scope="col">Planificado</th>
                  <th scope="col">Real</th>
                  <th scope="col">Disponible</th>
                  <th scope="col" style="width: 20%;">Avance</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody data-budget-table>
                <tr>
                  <td colspan="6" class="empty-state">
                    <div style="padding: 2rem; text-align: center; color: var(--color-text-muted);">
                       Cargando presupuestos...
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Estados de Carga y Error dentro del contexto de la tabla -->
          <div class="module-loading" data-budget-loading hidden>
            <span class="spinner"></span>
            <p>Actualizando datos...</p>
          </div>
          <div class="module-error" data-budget-error hidden style="margin-top: 1rem;"></div>
        </section>
      </section>

      <!-- RECOMENDACIONES (Insights) -->
      <section class="subscriptions-insights" aria-label="Recomendaciones" style="display: grid; gap: 1.5rem; grid-template-columns: 1fr; margin-bottom: 1.5rem;">
        <article class="card" style="padding: 1.5rem;">
          <h3 style="margin-top: 0; font-size: 1.1rem; margin-bottom: 1rem;">Recomendaciones inteligentes</h3>
          <ul class="insight-list" data-budget-suggestions style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;"></ul>
        </article>
      </section>

    </section>
  `;
}

