// Módulo de Gastos con integración API

// === ESTADO GLOBAL ===
let expensesData = [];
let isLoading = false;
let currentFilters = {
  search: '',
  category: '',
  isDeductible: '',
  dateFrom: '',
  dateTo: ''
};
let filterRefreshTimeout = null;
let activeExpenseId = null;

// === CONSTANTES ===
const EXPENSE_CATEGORIES = {
  office: 'Oficina',
  software: 'Software',
  hardware: 'Hardware',
  marketing: 'Marketing',
  travel: 'Viajes',
  meals: 'Comidas',
  professional_services: 'Servicios profesionales',
  supplies: 'Suministros',
  insurance: 'Seguros',
  other: 'Otros'
};

const PAYMENT_METHODS = {
  bank_transfer: 'Transferencia bancaria',
  card: 'Tarjeta',
  cash: 'Efectivo',
  other: 'Otro'
};

// === FORMATTERS ===
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
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatDateForInput(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
}

function sanitizeNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function calculateVatAmount(amount, vatPercentage) {
  const base = sanitizeNumber(amount, 0);
  const pct = sanitizeNumber(vatPercentage, 0);
  return Number((base * (pct / 100)).toFixed(2));
}

// === NOTIFICACIONES ===
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button type="button" class="notification__close" aria-label="Cerrar notificación">×</button>
  `;

  notification.querySelector('.notification__close').addEventListener('click', () => {
    notification.remove();
  });

  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      .notification {
        position: fixed;
        top: 24px;
        right: 24px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.18);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 1rem;
        min-width: 280px;
        animation: slideInExpenses 0.3s ease-out;
        backdrop-filter: blur(4px);
      }
      @keyframes slideInExpenses {
        from { transform: translateX(320px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .notification--success { background: rgba(198, 246, 213, 0.95); color: #22543d; border-left: 4px solid #38a169; }
      .notification--error { background: rgba(254, 215, 215, 0.95); color: #742a2a; border-left: 4px solid #f56565; }
      .notification--info { background: rgba(190, 227, 248, 0.95); color: #2c5282; border-left: 4px solid #4299e1; }
      .notification--warning { background: rgba(254, 235, 200, 0.95); color: #7b341e; border-left: 4px solid #ed8936; }
      .notification__close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        line-height: 1;
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}

// === RENDERIZADO DE ESTADOS ===
function renderLoadingState() {
  const loadingEl = document.querySelector('[data-expenses-loading]');
  if (loadingEl) loadingEl.hidden = !isLoading;
}

function renderErrorState(message) {
  const errorEl = document.querySelector('[data-expenses-error]');
  if (!errorEl) return;
  if (!message) {
    errorEl.hidden = true;
    errorEl.innerHTML = '';
    return;
  }
  errorEl.hidden = false;
  errorEl.innerHTML = `
    <div class="module-error__content">
      <span class="module-error__icon">⚠️</span>
      <div>
        <p class="module-error__title">No se pudieron cargar los gastos</p>
        <p class="module-error__message">${escapeHtml(message)}</p>
      </div>
      <button type="button" class="btn btn-secondary" data-expenses-retry>Reintentar</button>
    </div>
  `;
  const retryBtn = errorEl.querySelector('[data-expenses-retry]');
  if (retryBtn) retryBtn.addEventListener('click', () => loadExpenses());
}

// === CARGA DE DATOS ===
async function loadExpenses() {
  if (typeof window.api === 'undefined') {
    renderErrorState('Servicio API no disponible. Verifica la carga de api.js');
    return;
  }

  if (!window.api.isAuthenticated()) {
    renderErrorState('Inicia sesión para revisar tus gastos.');
    return;
  }

  isLoading = true;
  renderLoadingState();
  renderErrorState('');

  try {
    const query = buildFiltersQuery();
    const response = await window.api.getExpenses(query);
    const expenses = response?.expenses || response || [];

    expensesData = expenses.map(expense => ({
      id: expense.id,
      projectId: expense.project_id || null,
      projectName: expense.project_name || null,
      category: expense.category,
      subcategory: expense.subcategory,
      description: expense.description,
      amount: sanitizeNumber(expense.amount, 0),
      vatAmount: sanitizeNumber(expense.vat_amount, 0),
      vatPercentage: sanitizeNumber(expense.vat_percentage, 0),
      isDeductible: Boolean(expense.is_deductible),
      deductiblePercentage: sanitizeNumber(expense.deductible_percentage, 0),
      expenseDate: expense.expense_date,
      paymentMethod: expense.payment_method,
      vendor: expense.vendor,
      receiptUrl: expense.receipt_url,
      notes: expense.notes
    }));

    renderExpensesTable();
    updateSummaryCards();
    updateFilterCount(response?.count ?? expensesData.length);
  } catch (error) {
    console.error('Error cargando gastos:', error);
    let message = error?.message || 'Se produjo un error al cargar los gastos';
    if (error instanceof window.APIError && error.status === 0) {
      message = 'No se pudo conectar con el backend (http://localhost:8020). Comprueba que el servicio esté activo.';
    }
    renderErrorState(message);
    showNotification(message, 'error');
  } finally {
    isLoading = false;
    renderLoadingState();
  }
}

function buildFiltersQuery() {
  const query = {};
  if (currentFilters.search) query.search = currentFilters.search;
  if (currentFilters.category) query.category = currentFilters.category;
  if (currentFilters.isDeductible !== '') query.isDeductible = currentFilters.isDeductible;
  if (currentFilters.dateFrom) query.dateFrom = currentFilters.dateFrom;
  if (currentFilters.dateTo) query.dateTo = currentFilters.dateTo;
  return query;
}

// === TABLA ===
function renderExpensesTable() {
  const tbody = document.querySelector('[data-expenses-tbody]');
  if (!tbody) return;

  if (!expensesData.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          No se encontraron gastos. Añade tu primer gasto para empezar.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = expensesData.map(expense => {
    const categoryLabel = EXPENSE_CATEGORIES[expense.category] || expense.category || 'Sin categoría';
    const paymentLabel = PAYMENT_METHODS[expense.paymentMethod] || expense.paymentMethod || 'N/A';
    return `
      <tr class="expenses-table__row" data-expense-id="${expense.id}">
        <td>
          <time datetime="${escapeHtml(expense.expenseDate || '')}">
            ${formatDate(expense.expenseDate)}
          </time>
        </td>
        <td>
          <span class="category-badge">
            ${escapeHtml(categoryLabel)}
          </span>
          ${expense.subcategory ? `<small>${escapeHtml(expense.subcategory)}</small>` : ''}
        </td>
        <td>
          <div class="expense-description">
            <strong>${escapeHtml(expense.description || 'Sin descripción')}</strong>
            ${expense.vendor ? `<small>${escapeHtml(expense.vendor)}</small>` : ''}
          </div>
        </td>
        <td class="expenses-table__amount">
          ${formatCurrency(expense.amount)}
          <small class="vat-indicator">IVA ${expense.vatPercentage.toFixed(2)}% (${formatCurrency(expense.vatAmount)})</small>
        </td>
        <td>
          <span class="status-pill status-pill--${expense.isDeductible ? 'success' : 'neutral'}">
            ${expense.isDeductible ? `Deducible ${expense.deductiblePercentage}%` : 'No deducible'}
          </span>
        </td>
        <td class="expenses-table__client">${escapeHtml(paymentLabel)}</td>
        <td class="expenses-table__client">${expense.projectName ? escapeHtml(expense.projectName) : '-'}</td>
        <td class="expenses-table__actions">
          <button type="button" class="table-action" title="Ver gasto" onclick="viewExpense('${expense.id}')">👁️</button>
          <button type="button" class="table-action" title="Editar gasto" onclick="openExpenseModal('edit', '${expense.id}')">✏️</button>
          <button type="button" class="table-action" title="Eliminar gasto" onclick="confirmDeleteExpense('${expense.id}')">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateFilterCount(count) {
  const counter = document.querySelector('[data-expenses-count]');
  if (!counter) return;
  const label = count === 1 ? 'gasto' : 'gastos';
  counter.textContent = `${count} ${label} encontrados`;
}

// === TARJETAS RESUMEN ===
function updateSummaryCards() {
  const total = expensesData.reduce((sum, expense) => sum + sanitizeNumber(expense.amount, 0), 0);
  const deductible = expensesData
    .filter(expense => expense.isDeductible)
    .reduce((sum, expense) => sum + sanitizeNumber(expense.amount, 0) * (sanitizeNumber(expense.deductiblePercentage, 0) / 100), 0);
  const vatRecoverable = expensesData.reduce((sum, expense) => sum + sanitizeNumber(expense.vatAmount, 0), 0);
  const average = expensesData.length ? total / expensesData.length : 0;

  const map = {
    total: document.getElementById('total-expenses'),
    deductible: document.getElementById('deductible-expenses'),
    vat: document.getElementById('recoverable-vat'),
    average: document.getElementById('average-expense')
  };

  if (map.total) map.total.textContent = formatCurrency(total);
  if (map.deductible) map.deductible.textContent = formatCurrency(deductible);
  if (map.vat) map.vat.textContent = formatCurrency(vatRecoverable);
  if (map.average) map.average.textContent = formatCurrency(average);
}

// === FILTROS ===
function setupFilters() {
  const searchInput = document.getElementById('expense-search');
  if (searchInput) {
    searchInput.value = currentFilters.search;
    searchInput.addEventListener('input', event => {
      currentFilters.search = event.target.value;
      scheduleExpenseReload();
    });
  }

  const categorySelect = document.getElementById('expense-category-filter');
  if (categorySelect) {
    categorySelect.value = currentFilters.category;
    categorySelect.addEventListener('change', event => {
      currentFilters.category = event.target.value;
      loadExpenses();
    });
  }

  const deductibleSelect = document.getElementById('expense-deductible-filter');
  if (deductibleSelect) {
    deductibleSelect.value = currentFilters.isDeductible;
    deductibleSelect.addEventListener('change', event => {
      currentFilters.isDeductible = event.target.value;
      loadExpenses();
    });
  }

  const dateFromInput = document.getElementById('expense-date-from');
  if (dateFromInput) {
    dateFromInput.value = currentFilters.dateFrom;
    dateFromInput.addEventListener('change', event => {
      currentFilters.dateFrom = event.target.value;
      loadExpenses();
    });
  }

  const dateToInput = document.getElementById('expense-date-to');
  if (dateToInput) {
    dateToInput.value = currentFilters.dateTo;
    dateToInput.addEventListener('change', event => {
      currentFilters.dateTo = event.target.value;
      loadExpenses();
    });
  }

  const resetBtn = document.querySelector('[data-expenses-reset]');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentFilters = {
        search: '',
        category: '',
        isDeductible: '',
        dateFrom: '',
        dateTo: ''
      };
      if (searchInput) searchInput.value = '';
      if (categorySelect) categorySelect.value = '';
      if (deductibleSelect) deductibleSelect.value = '';
      if (dateFromInput) dateFromInput.value = '';
      if (dateToInput) dateToInput.value = '';
      loadExpenses();
    });
  }
}

function scheduleExpenseReload() {
  if (filterRefreshTimeout) clearTimeout(filterRefreshTimeout);
  filterRefreshTimeout = setTimeout(() => {
    loadExpenses();
  }, 250);
}

// === MODALES ===
async function openExpenseModal(mode = 'create', expenseId = null) {
  activeExpenseId = expenseId;
  let expense = null;

  if (mode === 'edit' && expenseId) {
    try {
      expense = await window.api.getExpense(expenseId);
    } catch (error) {
      console.error('Error obteniendo gasto:', error);
      showNotification('No se pudo cargar el gasto seleccionado', 'error');
      return;
    }
  }

  const modalHtml = buildExpenseModalHtml(mode, expense);
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modal = document.getElementById('expense-modal');
  const form = document.getElementById('expense-form');

  if (!modal || !form) return;

  modal.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', closeExpenseModal);
  });
  modal.querySelector('.modal__backdrop')?.addEventListener('click', closeExpenseModal);

  setupExpenseForm(form, expense);
}

function closeExpenseModal() {
  const modal = document.getElementById('expense-modal');
  if (modal) modal.remove();
  activeExpenseId = null;
}

function buildExpenseModalHtml(mode, expense) {
  const isEdit = mode === 'edit' && expense;
  const title = isEdit ? 'Editar gasto' : 'Registrar nuevo gasto';
  const actionLabel = isEdit ? 'Guardar cambios' : 'Crear gasto';

  return `
    <div class="modal is-open" id="expense-modal" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
      <div class="modal__backdrop"></div>
      <div class="modal__panel" style="width: min(95vw, 960px); max-width: 960px;">
        <header class="modal__head">
          <div>
            <h2 class="modal__title" id="expense-modal-title">${title}</h2>
            <p class="modal__subtitle">${isEdit ? 'Actualiza los datos del gasto seleccionado' : 'Introduce la información fiscal del nuevo gasto'}</p>
          </div>
          <button type="button" class="modal__close" data-modal-close aria-label="Cerrar modal">×</button>
        </header>
        <div class="modal__body">
          <form id="expense-form" data-mode="${mode}" novalidate style="display: flex; flex-direction: column; gap: 1.25rem;">
            <div class="grid grid--three">
              <div class="form-group">
                <label for="expense-date">Fecha del gasto</label>
                <input type="date" id="expense-date" name="expenseDate" class="form-input" value="${formatDateForInput(expense?.expense_date)}" required />
              </div>
              <div class="form-group">
                <label for="expense-category">Categoría</label>
                <select id="expense-category" name="category" class="form-input" required>
                  <option value="" disabled ${!expense ? 'selected' : ''}>Selecciona una categoría</option>
                  ${Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => `
                    <option value="${key}" ${expense?.category === key ? 'selected' : ''}>${label}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div class="grid grid--three">
              <div class="form-group">
                <label for="expense-description">Descripción</label>
                <input type="text" id="expense-description" name="description" class="form-input" placeholder="Describe el gasto" value="${escapeHtml(expense?.description || '')}" required maxlength="200" />
              </div>
              <div class="form-group">
                <label for="expense-subcategory">Subcategoría</label>
                <input type="text" id="expense-subcategory" name="subcategory" class="form-input" placeholder="Opcional" value="${escapeHtml(expense?.subcategory || '')}" />
              </div>
            </div>

            <div class="grid grid--three">
              <div class="form-group">
                <label for="expense-amount">Importe base (€)</label>
                <input type="number" step="0.01" min="0" id="expense-amount" name="amount" class="form-input" value="${expense ? sanitizeNumber(expense.amount, 0) : ''}" required />
              </div>
              <div class="form-group">
                <label for="expense-vat-percentage">IVA (%)</label>
                <input type="number" step="0.1" min="0" id="expense-vat-percentage" name="vatPercentage" class="form-input" value="${expense ? sanitizeNumber(expense.vat_percentage || expense.vatPercentage, 21) : 21}" />
              </div>
              <div class="form-group">
                <label for="expense-vat-amount">IVA calculado (€)</label>
                <input type="number" step="0.01" min="0" id="expense-vat-amount" name="vatAmount" class="form-input" value="${expense ? sanitizeNumber(expense.vat_amount || expense.vatAmount, 0) : 0}" />
                <small class="form-hint">Se actualiza al modificar importe o IVA</small>
              </div>
            </div>

            <div class="grid grid--two">
              <div class="form-group">
                <label for="expense-payment-method">Método de pago</label>
                <select id="expense-payment-method" name="paymentMethod" class="form-input">
                  <option value="" disabled ${!expense?.payment_method ? 'selected' : ''}>Selecciona un método</option>
                  ${Object.entries(PAYMENT_METHODS).map(([key, label]) => `
                    <option value="${key}" ${expense?.payment_method === key ? 'selected' : ''}>${label}</option>
                  `).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="expense-vendor">Proveedor</label>
                <input type="text" id="expense-vendor" name="vendor" class="form-input" placeholder="Nombre del proveedor" value="${escapeHtml(expense?.vendor || '')}" />
              </div>
            </div>

            <div class="grid grid--two">
              <div class="form-group">
                <label for="expense-deductible">Tratamiento fiscal</label>
                <div class="toggle-group">
                  <label class="toggle">
                    <input type="checkbox" id="expense-deductible" name="isDeductible" ${expense?.is_deductible || expense?.isDeductible !== false ? 'checked' : ''} />
                    <span class="toggle__slider"></span>
                    <span class="toggle__label">Deducible</span>
                  </label>
                </div>
              </div>
              <div class="form-group" id="deductible-percentage-group">
                <label for="expense-deductible-percentage">Porcentaje deducible (%)</label>
                <input type="number" step="1" min="0" max="100" id="expense-deductible-percentage" name="deductiblePercentage" class="form-input" value="${expense ? sanitizeNumber(expense.deductible_percentage || expense.deductiblePercentage, 100) : 100}" />
              </div>
            </div>

            <div class="form-group">
              <label for="expense-receipt-url">Enlace al justificante</label>
              <input type="url" id="expense-receipt-url" name="receiptUrl" class="form-input" placeholder="https://..." value="${escapeHtml(expense?.receipt_url || expense?.receiptUrl || '')}" />
            </div>

            <div class="form-group">
              <label for="expense-notes">Notas</label>
              <textarea id="expense-notes" name="notes" rows="3" class="form-input" placeholder="Información adicional">${escapeHtml(expense?.notes || '')}</textarea>
            </div>

            <div class="modal__footer" style="display: flex; gap: 0.75rem;">
              <button type="button" class="btn-secondary" style="flex: 1;" data-modal-close>Cancelar</button>
              <button type="submit" class="btn-primary" style="flex: 1;">${actionLabel}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function setupExpenseForm(form, expense) {
  const amountInput = form.querySelector('#expense-amount');
  const vatPercentageInput = form.querySelector('#expense-vat-percentage');
  const vatAmountInput = form.querySelector('#expense-vat-amount');
  const deductibleToggle = form.querySelector('#expense-deductible');
  const deductibleGroup = form.querySelector('#deductible-percentage-group');

  const syncVatAmount = () => {
    const amount = sanitizeNumber(amountInput.value, 0);
    const vatPercentage = sanitizeNumber(vatPercentageInput.value, 0);
    vatAmountInput.value = calculateVatAmount(amount, vatPercentage);
  };

  amountInput?.addEventListener('input', syncVatAmount);
  vatPercentageInput?.addEventListener('input', syncVatAmount);

  const toggleDeductibleFields = () => {
    const isChecked = deductibleToggle.checked;
    deductibleGroup.style.display = isChecked ? 'block' : 'none';
    if (!isChecked) {
      form.querySelector('#expense-deductible-percentage').value = '0';
    } else if (!expense) {
      form.querySelector('#expense-deductible-percentage').value = '100';
    }
  };

  deductibleToggle?.addEventListener('change', toggleDeductibleFields);
  toggleDeductibleFields();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    await handleExpenseSubmit(form);
  });
}

async function handleExpenseSubmit(form) {
  const formData = new FormData(form);
  const mode = form.dataset.mode || 'create';

  const payload = {
    expenseDate: formData.get('expenseDate'),
    category: formData.get('category'),
    subcategory: (formData.get('subcategory') || '').trim() || null,
    description: (formData.get('description') || '').trim(),
    amount: sanitizeNumber(formData.get('amount'), 0),
    vatPercentage: sanitizeNumber(formData.get('vatPercentage'), 0),
    vatAmount: sanitizeNumber(formData.get('vatAmount'), 0),
    paymentMethod: formData.get('paymentMethod') || null,
    vendor: (formData.get('vendor') || '').trim() || null,
    receiptUrl: (formData.get('receiptUrl') || '').trim() || null,
    notes: (formData.get('notes') || '').trim() || null
  };

  const isDeductible = formData.get('isDeductible') === 'on';
  payload.isDeductible = isDeductible;
  payload.deductiblePercentage = isDeductible
    ? sanitizeNumber(formData.get('deductiblePercentage'), 0)
    : 0;

  if (!payload.expenseDate) {
    showNotification('Selecciona la fecha del gasto', 'warning');
    return;
  }

  if (!payload.category) {
    showNotification('Selecciona una categoría', 'warning');
    return;
  }

  if (!payload.description) {
    showNotification('Añade una descripción del gasto', 'warning');
    return;
  }

  try {
    if (mode === 'edit' && activeExpenseId) {
      await window.api.updateExpense(activeExpenseId, payload);
      showNotification('Gasto actualizado correctamente', 'success');
    } else {
      await window.api.createExpense(payload);
      showNotification('Gasto registrado correctamente', 'success');
    }

    closeExpenseModal();
    await loadExpenses();
  } catch (error) {
    console.error('Error guardando gasto:', error);
    showNotification(error?.message || 'No se pudo guardar el gasto', 'error');
  }
}

async function viewExpense(expenseId) {
  try {
    const expense = await window.api.getExpense(expenseId);
    if (!expense) {
      showNotification('No se encontró el gasto', 'error');
      return;
    }

    const modalHtml = `
      <div class="modal is-open" id="expense-view-modal" role="dialog" aria-modal="true">
        <div class="modal__backdrop"></div>
        <div class="modal__panel" style="width: min(90vw, 640px); max-width: 640px;">
          <header class="modal__head">
            <div>
              <h2 class="modal__title">Detalle del gasto</h2>
              <p class="modal__subtitle">${formatDate(expense.expense_date)} · ${EXPENSE_CATEGORIES[expense.category] || expense.category}</p>
            </div>
            <button type="button" class="modal__close" data-modal-close aria-label="Cerrar">×</button>
          </header>
          <div class="modal__body">
            <dl class="detail-list">
              <div><dt>Descripción</dt><dd>${escapeHtml(expense.description || '-')}</dd></div>
              <div><dt>Proveedor</dt><dd>${escapeHtml(expense.vendor || '-')}</dd></div>
              <div><dt>Importe</dt><dd>${formatCurrency(expense.amount)} + IVA ${formatCurrency(expense.vat_amount)} (${sanitizeNumber(expense.vat_percentage, 0)}%)</dd></div>
              <div><dt>Deducible</dt><dd>${expense.is_deductible ? `Sí, ${sanitizeNumber(expense.deductible_percentage, 0)}%` : 'No deducible'}</dd></div>
              <div><dt>Método de pago</dt><dd>${PAYMENT_METHODS[expense.payment_method] || expense.payment_method || '-'}</dd></div>
              <div><dt>Proyecto</dt><dd>${escapeHtml(expense.project_name || '-')}</dd></div>
              <div><dt>Notas</dt><dd>${escapeHtml(expense.notes || '-')}</dd></div>
              <div><dt>Justificante</dt><dd>${expense.receipt_url ? `<a href="${escapeHtml(expense.receipt_url)}" target="_blank" rel="noopener">Abrir justificante</a>` : 'No adjuntado'}</dd></div>
            </dl>
          </div>
          <footer class="modal__footer">
            <button type="button" class="btn-secondary" data-modal-close>Cerrar</button>
            <button type="button" class="btn-primary" onclick="openExpenseModal('edit', '${expense.id}')">Editar</button>
          </footer>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.getElementById('expense-view-modal');
    modal?.querySelectorAll('[data-modal-close]').forEach(btn => {
      btn.addEventListener('click', () => modal.remove());
    });
    modal?.querySelector('.modal__backdrop')?.addEventListener('click', () => modal.remove());
  } catch (error) {
    console.error('Error mostrando gasto:', error);
    showNotification('No se pudo mostrar el detalle del gasto', 'error');
  }
}

async function confirmDeleteExpense(expenseId) {
  const confirmed = window.confirm('¿Seguro que deseas eliminar este gasto? Esta acción no se puede deshacer.');
  if (!confirmed) return;

  try {
    await window.api.deleteExpense(expenseId);
    showNotification('Gasto eliminado correctamente', 'success');
    await loadExpenses();
  } catch (error) {
    console.error('Error eliminando gasto:', error);
    showNotification(error?.message || 'No se pudo eliminar el gasto', 'error');
  }
}

// === MARKUP PRINCIPAL ===
export default function renderExpenses() {
  return `
    <section class="expenses" aria-labelledby="expenses-title">
      <header class="expenses__hero">
        <div class="expenses__hero-copy">
          <h1 id="expenses-title">Gastos &amp; Deducciones</h1>
          <p>Gestiona tus deducciones, tickets y bases imponibles en un único panel.</p>
        </div>
        <div class="expenses__hero-actions">
          <button type="button" class="btn-primary" id="new-expense-btn">Registrar gasto</button>
          <button type="button" class="btn-ghost" data-feature-pending="upload-receipt">Adjuntar justificante</button>
        </div>
      </header>

      <div class="summary-cards">
        <div class="card stat-card">
          <div class="card-icon" style="background: var(--color-error-light);">💸</div>
          <div class="card-content">
            <span class="card-label">Gastos totales</span>
            <span class="card-value" id="total-expenses">€0</span>
            <span class="card-trend positive">Periodo actual</span>
          </div>
        </div>
        <div class="card stat-card">
          <div class="card-icon" style="background: var(--color-success-light);">✅</div>
          <div class="card-content">
            <span class="card-label">Base deducible</span>
            <span class="card-value" id="deductible-expenses">€0</span>
            <span class="card-trend">Ahorro fiscal</span>
          </div>
        </div>
        <div class="card stat-card">
          <div class="card-icon" style="background: var(--color-warning-light);">🧾</div>
          <div class="card-content">
            <span class="card-label">IVA recuperable</span>
            <span class="card-value" id="recoverable-vat">€0</span>
            <span class="card-trend">Declaración trimestral</span>
          </div>
        </div>
        <div class="card stat-card">
          <div class="card-icon" style="background: var(--color-info-light);">📊</div>
          <div class="card-content">
            <span class="card-label">Promedio por gasto</span>
            <span class="card-value" id="average-expense">€0</span>
            <span class="card-trend">Comparativa</span>
          </div>
        </div>
      </div>

      <section class="expenses__filters" aria-label="Filtros de gastos">
        <div class="expenses__filters-group">
          <label class="visually-hidden" for="expense-search">Buscar gastos</label>
          <input type="search" id="expense-search" class="expenses__search" placeholder="Descripción, proveedor..." autocomplete="off" />
        </div>
        <div class="expenses__filters-group">
          <label class="visually-hidden" for="expense-category-filter">Categoría</label>
          <select id="expense-category-filter" class="expenses__select">
            <option value="">Todas las categorías</option>
            ${Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}
          </select>
        </div>
        <div class="expenses__filters-group">
          <label class="visually-hidden" for="expense-deductible-filter">Deducible</label>
          <select id="expense-deductible-filter" class="expenses__select">
            <option value="">Todos</option>
            <option value="true">Solo deducibles</option>
            <option value="false">No deducibles</option>
          </select>
        </div>
        <div class="expenses__filters-group">
          <label class="visually-hidden" for="expense-date-from">Fecha desde</label>
          <input type="date" id="expense-date-from" class="expenses__select" />
        </div>
        <div class="expenses__filters-group">
          <label class="visually-hidden" for="expense-date-to">Fecha hasta</label>
          <input type="date" id="expense-date-to" class="expenses__select" />
        </div>
        <div class="expenses__filters-group expenses__filters-group--pinned">
          <button type="button" class="btn-ghost" data-expenses-reset>Limpiar filtros</button>
        </div>
      </section>

      <section class="expenses-table" aria-label="Listado de gastos">
        <div class="expenses-table__surface">
          <table>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Categoría</th>
                <th scope="col">Descripción</th>
                <th scope="col">Importe</th>
                <th scope="col">Deducible</th>
                <th scope="col">Pago</th>
                <th scope="col">Proyecto</th>
                <th scope="col"><span class="visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody data-expenses-tbody>
              <tr>
                <td colspan="8" class="empty-state">Cargando gastos...</td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer class="invoices-table__footer">
          <p data-expenses-count>0 gastos encontrados</p>
        </footer>
        <div class="module-loading" data-expenses-loading hidden>
          <span class="loader"></span>
          <p>Sincronizando gastos...</p>
        </div>
        <div class="module-error" data-expenses-error hidden></div>
      </section>
    </section>
  `;
}

// === INICIALIZACIÓN ===
export function initExpenses() {
  window.openExpenseModal = openExpenseModal;
  window.closeExpenseModal = closeExpenseModal;
  window.viewExpense = viewExpense;
  window.confirmDeleteExpense = confirmDeleteExpense;

  const newExpenseBtn = document.getElementById('new-expense-btn');
  newExpenseBtn?.addEventListener('click', () => openExpenseModal('create'));

  setupFilters();
  loadExpenses();
}
