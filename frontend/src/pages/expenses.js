// Módulo de Gastos con integración API

// === ESTADO GLOBAL ===
let expensesData = [];
let isLoading = false;
let currentFilters = {
  search: "",
  category: "",
  isDeductible: "",
  dateFrom: "",
  dateTo: "",
};
let filterRefreshTimeout = null;
let activeExpenseId = null;
let filteredExpenses = [];
const PAGE_SIZE = 10;
let currentPage = 1;
let selectedExpenseId = null;

let visibleColumns = {
  date: true,
  category: true,
  description: true,
  amount: true,
  isDeductible: true,
  paymentMethod: false,
  projectName: false
};

const EXPENSE_COLUMNS = {
  date: 'Fecha',
  category: 'Categoría',
  description: 'Descripción',
  amount: 'Importe',
  isDeductible: 'Deducible',
  paymentMethod: 'Pago',
  projectName: 'Proyecto'
};

// === CONSTANTES ===
const EXPENSE_CATEGORIES = {
  office: "Oficina",
  software: "Software",
  hardware: "Hardware",
  marketing: "Marketing",
  travel: "Viajes",
  meals: "Comidas",
  professional_services: "Servicios profesionales",
  supplies: "Suministros",
  insurance: "Seguros",
  other: "Otros",
};

const PAYMENT_METHODS = {
  bank_transfer: "Transferencia",
  card: "Tarjeta",
  cash: "Efectivo",
  other: "Otro",
};

// Límites de deducibilidad por categoría (concordancia con backend)
const CATEGORY_DEDUCTION_LIMITS = {
  office: 100,
  software: 100,
  hardware: 100,
  marketing: 100,
  travel: 100,
  meals: 50,
  professional_services: 100,
  supplies: 100,
  insurance: 100,
  other: 50,
};

// === VALIDADOR DE CLIENTE ===
const CLIENT_VALIDATOR = {
  validateExpense: (data) => {
    const errors = {};

    if (!data.expenseDate) {
      errors.expenseDate = "La fecha es obligatoria";
    } else {
      const date = new Date(data.expenseDate);
      if (date > new Date()) errors.expenseDate = "La fecha no puede ser futura";
    }

    if (!data.category) {
      errors.category = "La categoría es obligatoria";
    }

    if (!data.description || data.description.trim().length < 5) {
      errors.description = "La descripción debe tener al menos 5 caracteres";
    }

    if (!data.amount || parseFloat(data.amount) <= 0) {
      errors.amount = "El importe debe ser mayor a 0";
    }

    if (data.isDeductible) {
      const limit = CATEGORY_DEDUCTION_LIMITS[data.category] || 100;
      const pct = parseFloat(data.deductiblePercentage);
      if (isNaN(pct) || pct < 0 || pct > limit) {
        errors.deductiblePercentage = `El porcentaje máximo para esta categoría es ${limit}%`;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

function normalizeExpense(expense) {
  if (!expense) return null;

  return {
    id: expense.id,
    projectId: expense.project_id ?? expense.projectId ?? null,
    projectName: expense.project_name ?? expense.projectName ?? null,
    category: expense.category ?? null,
    subcategory: expense.subcategory ?? null,
    description: expense.description ?? "",
    amount: sanitizeNumber(expense.amount, 0),
    vatAmount: sanitizeNumber(expense.vat_amount ?? expense.vatAmount, 0),
    vatPercentage: sanitizeNumber(
      expense.vat_percentage ?? expense.vatPercentage,
      0
    ),
    isDeductible: Boolean(
      expense.is_deductible ?? expense.isDeductible ?? true
    ),
    deductiblePercentage: sanitizeNumber(
      expense.deductible_percentage ?? expense.deductiblePercentage,
      0
    ),
    expenseDate: expense.expense_date ?? expense.expenseDate ?? null,
    paymentMethod: expense.payment_method ?? expense.paymentMethod ?? null,
    vendor: expense.vendor ?? null,
    receiptUrl: expense.receipt_url ?? expense.receiptUrl ?? null,
    notes: expense.notes ?? null,
  };
}

// === FORMATTERS ===
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
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateForInput(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().split("T")[0];
}

function sanitizeNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function calculateVatAmount(amount, vatPercentage) {
  const base = sanitizeNumber(amount, 0);
  const pct = sanitizeNumber(vatPercentage, 0);
  return Number((base * (pct / 100)).toFixed(2));
}

// === NOTIFICACIONES ===
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification--${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button type="button" class="notification__close" aria-label="Cerrar notificación">×</button>
  `;

  notification
    .querySelector(".notification__close")
    .addEventListener("click", () => {
      notification.remove();
    });

  if (!document.getElementById("notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
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
  const tbody = document.querySelector('[data-expenses-tbody]');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 3rem;">
          <div class="spinner" style="display: inline-block;"></div>
          <p style="margin-top: 1rem; color: var(--text-secondary);">Cargando gastos...</p>
        </td>
      </tr>
    `;
  }
}

function renderErrorState(message) {
  const tbody = document.querySelector('[data-expenses-tbody]');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 3rem;">
          <p style="color: var(--color-error); font-size: 1.1rem; margin-bottom: 1rem;">⚠️ Error al cargar gastos</p>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${message}</p>
          <button onclick="loadExpenses()" class="btn-primary">Reintentar</button>
        </td>
      </tr>
    `;
  }
}

// === CARGA DE DATOS ===
async function loadExpenses() {
  if (typeof window.api === "undefined") {
    renderErrorState("Servicio API no disponible. Verifica la carga de api.js");
    return;
  }

  if (!window.api.isAuthenticated()) {
    renderErrorState("Inicia sesión para revisar tus gastos.");
    isLoading = false;
    return;
  }

  isLoading = true;
  renderLoadingState();
  renderErrorState("");

  try {
    const query = buildFiltersQuery();
    const response = await window.api.getExpenses(query);
    const expenses = response?.expenses || response || [];

    expensesData = expenses
      .map(normalizeExpense)
      .filter((expense) => expense !== null);

    if (expensesData.length > 0) {
      // Marcar primer registro por defecto si no hay selección válida (obligatorio por política UI)
      const currentExists = expensesData.some(ex => String(ex.id) === String(selectedExpenseId));
      if (!selectedExpenseId || !currentExists) {
        selectedExpenseId = String(expensesData[0].id);
      }
    }

    currentPage = 1;
    renderExpensesTable();
    updateSummaryCards();
  } catch (error) {
    console.error("Error cargando gastos:", error);
    let message = error?.message || "Se produjo un error al cargar los gastos";
    // Usar window.api.APIError si está definido, o simplemente comprobar status 0
    if (error.status === 0 || (window.api?.APIError && error instanceof window.api.APIError && error.status === 0)) {
      message =
        "No se pudo conectar con el backend (http://localhost:8020). Comprueba que el servicio esté activo.";
    }
    renderErrorState(message);
    showNotification(message, "error");
  } finally {
    isLoading = false;
  }
}

function updateSummaryCards() {
  const total = expensesData.reduce((sum, ex) => sum + (parseFloat(ex.amount) || 0), 0);
  const deductible = expensesData.reduce((sum, ex) => {
    if (ex.isDeductible || ex.is_deductible) {
      const percentage = (parseFloat(ex.deductible_percentage || ex.deductiblePercentage) || 100) / 100;
      return sum + (parseFloat(ex.amount) * percentage);
    }
    return sum;
  }, 0);
  const vat = expensesData.reduce((sum, ex) => sum + (parseFloat(ex.vat_amount || ex.vatAmount) || 0), 0);
  const avg = expensesData.length > 0 ? total / expensesData.length : 0;

  document.getElementById("total-expenses").textContent = formatCurrency(total);
  document.getElementById("deductible-expenses").textContent = formatCurrency(deductible);
  document.getElementById("recoverable-vat").textContent = formatCurrency(vat);
  document.getElementById("average-expense").textContent = formatCurrency(avg);
}

function buildFiltersQuery() {
  const query = {};
  if (currentFilters.search) query.search = currentFilters.search;
  if (currentFilters.category) query.category = currentFilters.category;
  if (currentFilters.isDeductible !== "")
    query.isDeductible = currentFilters.isDeductible;
  if (currentFilters.dateFrom) query.dateFrom = currentFilters.dateFrom;
  if (currentFilters.dateTo) query.dateTo = currentFilters.dateTo;
  return query;
}

// === RENDERIZADO ===

function renderExpensesTable() {
  const container = document.querySelector('.expenses-table-container');
  if (!container) return;

  // 1. TOOLBAR
  const toolbarHTML = `
    <div class="table-toolbar">
      <div class="table-toolbar__actions">
        <button class="btn-config-columns" onclick="openExpenseColumnConfigModal()" title="Configurar qué columnas mostrar">
          <span class="icon">⚙️</span>
          <span>Columnas</span>
        </button>
      </div>
      <input 
        type="text" 
        id="expense-table-search"
        class="search-input" 
        placeholder="Buscar por descripción o proveedor..."
        value="${currentFilters.search || ''}"
        oninput="handleExpenseSearch(this.value)"
      >
      <div style="flex: 1;"></div>
    </div>
  `;

  // 2. TABLA
  const tableHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th data-column="date" ${visibleColumns.date ? '' : 'hidden'}>Fecha</th>
            <th data-column="category" ${visibleColumns.category ? '' : 'hidden'}>Categoría</th>
            <th data-column="description" ${visibleColumns.description ? '' : 'hidden'}>Descripción</th>
            <th data-column="amount" ${visibleColumns.amount ? '' : 'hidden'}>Importe</th>
            <th data-column="isDeductible" ${visibleColumns.isDeductible ? '' : 'hidden'}>Deducible</th>
            <th data-column="paymentMethod" class="hide-mobile" ${visibleColumns.paymentMethod ? '' : 'hidden'}>Pago</th>
            <th data-column="projectName" class="hide-mobile" ${visibleColumns.projectName ? '' : 'hidden'}>Proyecto</th>
            <th style="text-align: right;">Acciones</th>
          </tr>
        </thead>
        <tbody data-expenses-tbody>
          ${renderExpenseRows()}
        </tbody>
      </table>
    </div>
  `;

  // 3. PAGINACIÓN
  const filteredCount = getFilteredExpensesCount();
  const totalPages = Math.ceil(filteredCount / PAGE_SIZE) || 1;
  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, filteredCount);

  const paginationHTML = filteredCount > PAGE_SIZE ? `
    <div class="pagination">
      <button class="btn-paginate" onclick="window.changeExpensesPage(-1)" ${currentPage === 1 ? 'disabled' : ''}>
        ← Anterior
      </button>
      <div class="page-numbers">
        ${renderExpensePageNumbers(totalPages)}
      </div>
      <button class="btn-paginate" onclick="window.changeExpensesPage(1)" ${currentPage === totalPages ? 'disabled' : ''}>
        Siguiente →
      </button>
      <span class="pagination-info">
        Mostrando ${start}-${end} de ${filteredCount} registros
      </span>
    </div>
  ` : `
    <div class="pagination">
      <span class="pagination-info" style="margin-left: auto;">
        Mostrando ${filteredCount} registros
      </span>
    </div>
  `;

  container.innerHTML = toolbarHTML + tableHTML + paginationHTML;
}

function renderExpenseRows() {
  if (!expensesData || expensesData.length === 0) {
    return `
      <tr>
        <td colspan="8" class="empty-state">No hay gastos todavía</td>
      </tr>
    `;
  }

  // Filtrar y Paginar
  let filtered = expensesData;
  if (currentFilters.search) {
    const search = currentFilters.search.toLowerCase();
    filtered = filtered.filter(ex => 
      ex.description?.toLowerCase().includes(search) || 
      ex.vendor?.toLowerCase().includes(search)
    );
  }
  if (currentFilters.category) {
    filtered = filtered.filter(ex => ex.category === currentFilters.category);
  }
  if (currentFilters.isDeductible !== "") {
    const isDeductible = currentFilters.isDeductible === "true";
    filtered = filtered.filter(ex => ex.isDeductible === isDeductible || ex.is_deductible === isDeductible);
  }

  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pagedExpenses = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  if (pagedExpenses.length === 0 && currentPage > 1) {
    currentPage = 1;
    return renderExpenseRows();
  }

  return pagedExpenses.map(expense => {
    const isDeductible = expense.isDeductible ?? expense.is_deductible;
    const isSelected = String(expense.id) === String(selectedExpenseId);
    
    return `
      <tr data-expense-id="${expense.id}" 
          class="table-row-clickable ${isSelected ? 'is-selected' : ''}"
          onclick="handleExpenseRowClick(event, '${expense.id}')">
        <td data-label="Fecha" ${visibleColumns.date ? '' : 'hidden'}>
          <time datetime="${expense.expenseDate || expense.expense_date}">${formatDate(expense.expenseDate || expense.expense_date)}</time>
        </td>
        <td data-label="Categoría" ${visibleColumns.category ? '' : 'hidden'}>
          <span class="category-pill">${EXPENSE_CATEGORIES[expense.category] || expense.category}</span>
        </td>
        <td data-label="Descripción" ${visibleColumns.description ? '' : 'hidden'}>
          <div class="table-description">
            <strong>${escapeHtml(expense.description)}</strong>
            ${expense.vendor ? `<span class="table-vendor">${escapeHtml(expense.vendor)}</span>` : ''}
          </div>
        </td>
        <td data-label="Importe" ${visibleColumns.amount ? '' : 'hidden'}>
          <span class="table-amount">${formatCurrency(expense.amount)}</span>
        </td>
        <td data-label="Deducible" ${visibleColumns.isDeductible ? '' : 'hidden'}>
          <span class="status-pill status-pill--${isDeductible ? 'success' : 'neutral'}">
            <span class="status-pill__dot"></span>
            ${isDeductible ? 'SÍ' : 'NO'}
          </span>
        </td>
        <td data-label="Pago" class="hide-mobile" ${visibleColumns.paymentMethod ? '' : 'hidden'}>
          ${PAYMENT_METHODS[expense.paymentMethod] || expense.paymentMethod || '-'}
        </td>
        <td data-label="Proyecto" class="hide-mobile" ${visibleColumns.projectName ? '' : 'hidden'}>
          ${expense.projectName || '-'}
        </td>
        <td data-label="ACCIONES" class="table-actions">
           <div style="display: flex; gap: 0.25rem; justify-content: flex-end;">
            <button type="button" class="btn-ghost btn-sm" onclick="viewExpense('${expense.id}')" title="Ver detalle">👁️</button>
            <button type="button" class="btn-ghost btn-sm" onclick="openExpenseModal('edit', '${expense.id}')" title="Editar">✏️</button>
            <button type="button" class="btn-ghost btn-sm btn-ghost--danger" onclick="confirmDeleteExpense('${expense.id}')" title="Eliminar">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// === AYUDANTES DE TABLA ===

function getFilteredExpensesCount() {
  let filtered = expensesData;
  if (currentFilters.search) {
    const search = currentFilters.search.toLowerCase();
    filtered = filtered.filter(ex => 
      ex.description?.toLowerCase().includes(search) || 
      ex.vendor?.toLowerCase().includes(search)
    );
  }
  if (currentFilters.category) {
    filtered = filtered.filter(ex => ex.category === currentFilters.category);
  }
  if (currentFilters.isDeductible !== "") {
    const isDeductibleValue = currentFilters.isDeductible === "true";
    filtered = filtered.filter(ex => (ex.isDeductible ?? ex.is_deductible) === isDeductibleValue);
  }
  return filtered.length;
}

function handleExpenseSearch(value) {
  currentFilters.search = value;
  currentPage = 1;
  renderExpensesTable();
}

function changeExpensesPage(delta) {
  const filteredCount = getFilteredExpensesCount();
  const totalPages = Math.ceil(filteredCount / PAGE_SIZE) || 1;
  const newPage = currentPage + delta;
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    renderExpensesTable();
  }
}

function goToExpensePage(page) {
  currentPage = page;
  renderExpensesTable();
}

function handleExpenseRowClick(event, expenseId) {
  if (event.target.closest('button')) return;
  selectedExpenseId = expenseId;
  renderExpensesTable();
}

function renderExpensePageNumbers(totalPages) {
  let html = '';
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="window.goToExpensePage(${i})">
        ${i}
      </button>
    `;
  }
  return html;
}

// === DRAWER Y CONFIGURACIÓN ===

async function openExpenseDrawer(expense) {
  let drawer = document.getElementById('expense-drawer');
  let overlay = document.getElementById('expense-drawer-overlay');

  if (!drawer) {
    const drawerHTML = `
      <div class="drawer-overlay" id="expense-drawer-overlay" onclick="window.closeExpenseDrawer()"></div>
      <div class="drawer expense-drawer" id="expense-drawer">
        <header class="drawer__header">
          <h2 class="drawer__title">Detalles del Gasto</h2>
          <button class="drawer__close" onclick="window.closeExpenseDrawer()">&times;</button>
        </header>
        <div class="drawer__body" id="expense-drawer-body"></div>
        <footer class="drawer__footer">
          <button class="btn-primary" id="drawer-expense-edit-btn">Editar Gasto</button>
          <button class="btn-secondary" onclick="window.closeExpenseDrawer()">Cerrar</button>
        </footer>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', drawerHTML);
    drawer = document.getElementById('expense-drawer');
    overlay = document.getElementById('expense-drawer-overlay');
  }

  const body = document.getElementById('expense-drawer-body');
  const isDeductible = expense.isDeductible ?? expense.is_deductible;
  const categoryLabel = EXPENSE_CATEGORIES[expense.category] || expense.category;

  body.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color);">
       <div style="font-size: 2rem; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; background: var(--bg-surface); border-radius: 12px; border: 1px solid var(--border-color);">
          ${getCategoryIcon(expense.category)}
       </div>
       <div>
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; letter-spacing: 0.05em;">${categoryLabel}</span>
          <div style="font-size: 1.75rem; font-weight: 800; color: var(--text-primary);">${formatCurrency(expense.amount)}</div>
       </div>
    </div>

    <div style="display: grid; gap: 1.25rem;">
      <div class="drawer-field">
        <label style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; margin-bottom: 0.4rem;">Descripción</label>
        <div style="font-size: 1rem; font-weight: 500;">${escapeHtml(expense.description)}</div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
        <div class="drawer-field">
          <label style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; margin-bottom: 0.4rem;">Fecha</label>
          <div style="font-size: 0.95rem;">${formatDate(expense.expenseDate || expense.expense_date)}</div>
        </div>
        <div class="drawer-field">
          <label style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; margin-bottom: 0.4rem;">Proveedor</label>
          <div style="font-size: 0.95rem;">${escapeHtml(expense.vendor || '-')}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
        <div class="drawer-field">
          <label style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; margin-bottom: 0.4rem;">Deducible</label>
          <span class="status-pill status-pill--${isDeductible ? 'success' : 'neutral'}">
            <span class="status-pill__dot"></span>
            ${isDeductible ? 'SÍ' : 'NO'}
          </span>
        </div>
        <div class="drawer-field">
          <label style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; margin-bottom: 0.4rem;">Método Pago</label>
          <div style="font-size: 0.95rem;">${PAYMENT_METHODS[expense.paymentMethod] || expense.paymentMethod || '-'}</div>
        </div>
      </div>

      ${expense.notes ? `
        <div class="drawer-field">
          <label style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; margin-bottom: 0.4rem;">Notas</label>
          <div style="font-size: 0.9rem; background: var(--bg-secondary); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-color); white-space: pre-wrap;">${escapeHtml(expense.notes)}</div>
        </div>
      ` : ''}

       ${expense.receiptUrl || expense.receipt_url ? `
        <div class="drawer-field">
          <label style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; margin-bottom: 0.4rem;">Justificante</label>
          <div style="background: var(--bg-secondary); border-radius: 8px; border: 1px dashed var(--border-color); padding: 1rem; text-align: center;">
             <a href="${expense.receiptUrl || expense.receipt_url}" target="_blank" class="btn btn-secondary btn-sm">👁️ Ver adjunto</a>
          </div>
        </div>
      ` : ''}

      <div style="margin-top: 1rem; pt: 1rem; border-top: 1px solid var(--border-color);">
         <button class="btn btn-ghost btn-sm" style="width: 100%;" onclick="window.viewExpenseAuditLog('${expense.id}')">📜 Ver historial de cambios</button>
      </div>
    </div>
  `;

  document.getElementById('drawer-expense-edit-btn').onclick = () => {
    window.closeExpenseDrawer();
    window.openExpenseModal('edit', expense.id);
  };

  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    drawer.classList.add('is-open');
  });
}

function closeExpenseDrawer() {
  const drawer = document.getElementById('expense-drawer');
  const overlay = document.getElementById('expense-drawer-overlay');
  if (drawer) drawer.classList.remove('is-open');
  if (overlay) overlay.classList.remove('is-open');
}

function openExpenseColumnConfigModal() {
  let modal = document.getElementById('expense-column-config-modal');
  if (!modal) {
    const modalHTML = `
      <div class="modal is-open" id="expense-column-config-modal">
        <div class="modal__backdrop" onclick="window.closeExpenseColumnConfigModal()"></div>
        <div class="modal__panel modal__panel--md modal__panel--flex">
          <header class="modal__head">
            <div>
              <h2 class="modal__title">Configurar Columnas</h2>
              <p class="modal__subtitle">Selecciona qué columnas ver en la tabla</p>
            </div>
            <button class="modal__close" onclick="window.closeExpenseColumnConfigModal()">&times;</button>
          </header>
          <div class="modal__body">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; padding: 0.5rem;">
              ${Object.keys(EXPENSE_COLUMNS).map(key => {
                const label = EXPENSE_COLUMNS[key];
                const isFixed = key === 'date' || key === 'amount' || key === 'description';
                return `
                  <label style="display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: rgba(51, 102, 255, 0.05); border: 1px solid rgba(51, 102, 255, 0.15); border-radius: 12px; cursor: ${isFixed ? 'not-allowed' : 'pointer'}; transition: all 0.2s;">
                    <input type="checkbox" id="exp-col-${key}" ${visibleColumns[key] ? 'checked' : ''} ${isFixed ? 'disabled' : ''} style="width: 20px; height: 20px; cursor: pointer; accent-color: #3b82f6;">
                    <span style="font-weight: 500; font-size: 0.95rem;">${label} ${isFixed ? '(Fijo)' : ''}</span>
                  </label>
                `;
              }).join('')}
            </div>
          </div>
          <footer class="modal-form__footer" style="padding-top: 1.5rem; margin-top: auto;">
            <button type="button" class="btn btn-secondary" onclick="window.closeExpenseColumnConfigModal()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="window.applyExpenseColumnConfig()">Aplicar cambios</button>
          </footer>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  } else {
    modal.classList.add('is-open');
  }
}

function closeExpenseColumnConfigModal() {
  const modal = document.getElementById('expense-column-config-modal');
  if (modal) modal.classList.remove('is-open');
}

function applyExpenseColumnConfig() {
  Object.keys(visibleColumns).forEach(key => {
    const input = document.getElementById(`exp-col-${key}`);
    if (input) {
      visibleColumns[key] = input.checked;
    }
  });
  renderExpensesTable();
  closeExpenseColumnConfigModal();
  showNotification('Columnas actualizadas', 'success');
}

function getCategoryIcon(category) {
  const icons = {
    office: '🏢', software: '💻', hardware: '⌨️', marketing: '📣',
    travel: '✈️', meals: '🍕', professional_services: '🤝', other: '📦'
  };
  return icons[category] || '💰';
}

// === FILTROS ===
function setupFilters() {
  const searchInput = document.getElementById("expense-search");
  if (searchInput) {
    searchInput.value = currentFilters.search;
    searchInput.addEventListener("input", (event) => {
      currentFilters.search = event.target.value;
      scheduleExpenseReload();
    });
  }

  const categorySelect = document.getElementById("expense-category-filter");
  if (categorySelect) {
    categorySelect.value = currentFilters.category;
    categorySelect.addEventListener("change", (event) => {
      currentFilters.category = event.target.value;
      loadExpenses();
    });
  }

  const deductibleSelect = document.getElementById("expense-deductible-filter");
  if (deductibleSelect) {
    deductibleSelect.value = currentFilters.isDeductible;
    deductibleSelect.addEventListener("change", (event) => {
      currentFilters.isDeductible = event.target.value;
      loadExpenses();
    });
  }

  const dateFromInput = document.getElementById("expense-date-from");
  if (dateFromInput) {
    dateFromInput.value = currentFilters.dateFrom;
    dateFromInput.addEventListener("change", (event) => {
      currentFilters.dateFrom = event.target.value;
      loadExpenses();
    });
  }

  const dateToInput = document.getElementById("expense-date-to");
  if (dateToInput) {
    dateToInput.value = currentFilters.dateTo;
    dateToInput.addEventListener("change", (event) => {
      currentFilters.dateTo = event.target.value;
      loadExpenses();
    });
  }

  const resetBtn = document.querySelector("[data-expenses-reset]");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      currentFilters = {
        search: "",
        category: "",
        isDeductible: "",
        dateFrom: "",
        dateTo: "",
      };
      if (searchInput) searchInput.value = "";
      if (categorySelect) categorySelect.value = "";
      if (deductibleSelect) deductibleSelect.value = "";
      if (dateFromInput) dateFromInput.value = "";
      if (dateToInput) dateToInput.value = "";
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
async function openExpenseModal(mode = "create", expenseId = null) {
  activeExpenseId = expenseId;
  let expense = null;

  if ((mode === "edit" || mode === "view") && expenseId) {
    try {
      expense = await window.api.getExpense(expenseId);
    } catch (error) {
      console.error("Error obteniendo gasto:", error);
      showNotification("No se pudo cargar el gasto seleccionado", "error");
      return;
    }
  }

  const modalHtml = buildExpenseModalHtml(mode, expense);
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  const modal = document.getElementById("expense-modal");
  const form = document.getElementById("expense-form");

  if (!modal || !form) return;

  modal.querySelectorAll("[data-modal-close]").forEach((btn) => {
    btn.addEventListener("click", closeExpenseModal);
  });
  modal
    .querySelector(".modal__backdrop")
    ?.addEventListener("click", closeExpenseModal);

  if (mode === "view") {
    const editBtn = modal.querySelector("[data-expense-edit]");
    editBtn?.addEventListener("click", () => {
      closeExpenseModal();
      openExpenseModal("edit", expenseId);
    });
  }

  setupExpenseForm(form, expense);
}

function closeExpenseModal() {
  const modal = document.getElementById("expense-modal");
  if (modal) modal.remove();
  activeExpenseId = null;
}

function buildExpenseModalHtml(mode, expense) {
  const isEdit = mode === "edit" && expense;
  const isView = mode === "view" && expense;
  const title = isEdit ? "Editar gasto" : "Registrar nuevo gasto";
  const actionLabel = isEdit ? "Guardar cambios" : "Crear gasto";
  
  // Detectar si el periodo está cerrado (simulado o desde backend)
  const isLocked = expense?.fiscal_period_closed || expense?.fiscalPeriodClosed || false;
  const isReadOnly = isView || isLocked;

  const selectedCategory = expense?.category ?? "";
  const paymentMethodValue = expense?.payment_method ?? expense?.paymentMethod ?? "";
  const amountValue = expense ? sanitizeNumber(expense.amount, 0) : "";
  const vatPercentageValue = expense ? sanitizeNumber(expense.vat_percentage ?? expense.vatPercentage, 21) : 21;
  const vatAmountValue = expense ? sanitizeNumber(expense.vat_amount ?? expense.vatAmount, 0) : 0;
  const deductiblePercentageValue = expense ? sanitizeNumber(expense.deductible_percentage ?? expense.deductiblePercentage, 100) : 100;
  const isDeductibleChecked = expense ? (expense.is_deductible ?? expense.isDeductible ?? true ? "checked" : "") : "checked";

  return `
    <div class="modal is-open expense-modal invoice-modal" id="expense-modal" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
      <div class="modal__backdrop" data-modal-close></div>
      <div class="modal__panel modal__panel--xl modal__panel--flex">
        <header class="modal__head" style="padding: 1.5rem 2rem; border-bottom: 1px solid var(--border-color);">
          <div>
            <h2 class="modal__title" id="expense-modal-title">${isView ? 'Detalles del gasto' : title}</h2>
            <p class="modal__subtitle">${isEdit ? 'Actualiza los datos del gasto seleccionado' : isView ? 'Consulta la informaci¢n del gasto' : 'Completa los datos para registrar un gasto'}</p>
            ${isLocked && !isView ? '<p style="color: #e53e3e; font-size: 0.8rem; margin-top: 0.25rem;">⚠️ Este gasto pertenece a un periodo cerrado y tiene edición limitada.</p>' : ''}
          </div>
          <button type="button" class="modal__close" data-modal-close aria-label="Cerrar modal" style="font-size: 1.5rem;">&times;</button>
        </header>
        
        <form id="expense-form" data-mode="${mode}" class="modal-form" novalidate>
          <div class="modal-form__body modal-form__body--split">
            
            <!-- Columna Izquierda: Datos principales -->
            <div class="modal-form__column">
              <section class="modal-section modal-section--card">
                <div class="modal-section__header">
                  <h3 class="modal-section__title">Datos del gasto</h3>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                  <label class="form-field">
                    <span>Fecha *</span>
                    <input type="date" id="expense-date" name="expenseDate" class="form-input"
                      value="${formatDateForInput(expense?.expense_date || expense?.expenseDate)}" 
                      ${isReadOnly ? 'readonly' : 'required'} />
                  </label>
                  
                  <label class="form-field">
                    <span>Categoría *</span>
                    <select id="expense-category" name="category" class="form-input" ${isReadOnly ? 'disabled' : 'required'}>
                      <option value="" disabled ${!expense ? "selected" : ""}>Elegir...</option>
                      ${Object.entries(EXPENSE_CATEGORIES)
                        .map(([key, label]) => `<option value="${key}" ${selectedCategory === key ? "selected" : ""}>${label}</option>`)
                        .join("")}
                    </select>
                  </label>
                </div>

                <div style="margin-bottom: 1.5rem;">
                  <label class="form-field">
                    <span>Descripción *</span>
                    <input type="text" id="expense-description" name="description" class="form-input"
                      placeholder="Ej: Suscripción mensual software CRM" 
                      value="${escapeHtml(expense?.description || "")}" 
                      ${isReadOnly ? 'readonly' : 'required'} maxlength="500" />
                  </label>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                  <label class="form-field">
                    <span>Importe Base (€) *</span>
                    <input type="number" step="0.01" min="0.01" id="expense-amount" name="amount" class="form-input"
                      value="${amountValue}" ${isReadOnly ? 'readonly' : 'required'} />
                  </label>
                  
                  <label class="form-field">
                    <span>Método de Pago</span>
                    <select id="expense-payment-method" name="paymentMethod" class="form-input" ${isReadOnly ? 'disabled' : ''}>
                      <option value="" disabled ${!paymentMethodValue ? "selected" : ""}>Elegir...</option>
                      ${Object.entries(PAYMENT_METHODS)
                        .map(([key, label]) => `<option value="${key}" ${paymentMethodValue === key ? "selected" : ""}>${label}</option>`)
                        .join("")}
                    </select>
                  </label>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                  <label class="form-field">
                    <span>IVA (%)</span>
                    <input type="number" step="1" min="0" max="100" id="expense-vat-percentage" name="vatPercentage" class="form-input"
                      value="${vatPercentageValue}" ${isReadOnly ? 'readonly' : ''} />
                  </label>
                  
                  <label class="form-field">
                    <span>Cuota IVA (€)</span>
                    <input type="number" step="0.01" id="expense-vat-amount" name="vatAmount" class="form-input"
                      value="${vatAmountValue}" readonly style="background: var(--bg-secondary); border-color: var(--border-color);" />
                  </label>
                </div>

                <div style="padding: 1.25rem; background: rgba(51, 102, 255, 0.05); border-radius: 12px; border: 1px solid rgba(51, 102, 255, 0.15);">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <label class="toggle" style="margin:0;">
                      <input type="checkbox" id="expense-deductible" name="isDeductible" ${isDeductibleChecked} ${isReadOnly ? 'disabled' : ''} />
                      <span class="toggle__slider"></span>
                      <span class="toggle__label" style="font-weight: 600;">Gasto Deducible</span>
                    </label>
                  </div>
                  <div id="deductible-percentage-group" style="${isDeductibleChecked ? 'display: flex;' : 'display: none;'} flex-direction: column; gap: 0.5rem; margin-top: 1.25rem;">
                    <label class="form-field">
                      <span>% de Deducibilidad</span>
                      <input type="number" step="1" min="0" max="100" id="expense-deductible-percentage" name="deductiblePercentage" class="form-input" value="${deductiblePercentageValue}" ${isReadOnly ? 'readonly' : ''} />
                      <small style="color: var(--text-secondary); font-size: 0.75rem; margin-top: 0.25rem;">Depende de la categoría y uso profesional.</small>
                    </label>
                  </div>
                </div>
              </section>

              <section class="modal-section modal-section--card">
                <div class="modal-section__header">
                  <h3 class="modal-section__title">Extras</h3>
                </div>
                <div style="display: grid; grid-template-columns: 1fr; gap: 1.5rem;">
                   <label class="form-field">
                    <span>Proveedor / Establecimiento</span>
                    <input type="text" id="expense-vendor" name="vendor" class="form-input" placeholder="Ej: Amazon, Gasolinera Repsol..." value="${escapeHtml(expense?.vendor || "")}" ${isReadOnly ? 'readonly' : ''} />
                  </label>

                  <label class="form-field">
                    <span>Notas adicionales</span>
                    <textarea id="expense-notes" name="notes" class="form-input" rows="3" placeholder="Cualquier aclaración relevante..." style="resize: vertical;">${escapeHtml(expense?.notes || "")}</textarea>
                  </label>
                </div>
              </section>

              <!-- Nueva Sección: Comprobante (Movida aquí para evitar solapamiento) -->
              <section class="modal-section modal-section--card">
                <div class="modal-section__header">
                  <h3 class="modal-section__title">Comprobante / Justificante</h3>
                </div>
                <div id="receipt-dropzone" style="border: 2px dashed var(--border-color); border-radius: 12px; padding: 1.5rem; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--bg-secondary); margin-bottom: 0.5rem;">
                  <div id="dropzone-empty">
                    <span style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">🧾</span>
                    <p style="margin: 0; font-size: 0.9rem; font-weight: 600;">Haz clic o arrastra para cargar justificante</p>
                    <p style="margin: 0.25rem 0 0; font-size: 0.75rem; color: var(--text-secondary);">PDF, JPG o PNG (máx. 10MB)</p>
                  </div>
                  <div id="dropzone-preview" style="display: none;">
                    <p id="file-info" style="margin: 0; font-size: 0.9rem; font-weight: 600; color: var(--color-primary);"></p>
                    <button type="button" id="remove-file" style="background: none; border: none; color: #e53e3e; font-size: 0.8rem; text-decoration: underline; margin-top: 0.5rem; cursor: pointer; font-weight: 500;">Quitar archivo</button>
                  </div>
                  <input type="file" id="expense-receipt-file" style="display: none;" accept=".pdf,.jpg,.jpeg,.png" />
                </div>
              </section>
            </div>

            <div class="modal-form__column modal-form__column--side">
              <section class="modal-section modal-section--card modal-section--totals">
                <div class="modal-section__header">
                  <h3 class="modal-section__title">Resumen del registro</h3>
                </div>
                <div style="display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                    <span style="color: var(--text-secondary); font-size: 0.9rem;">Subtotal</span>
                    <span id="modal-summary-subtotal" style="font-weight: 600;">€0,00</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                    <span style="color: var(--text-secondary); font-size: 0.9rem;">IVA</span>
                    <span id="modal-summary-vat" style="font-weight: 600;">€0,00</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                    <span style="font-weight: 700; font-size: 1rem;">Total Gasto</span>
                    <span id="modal-summary-total" style="font-weight: 800; font-size: 1.25rem; color: var(--color-primary);">€0,00</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
          
          <footer class="modal-form__footer" style="padding: 1.5rem 2rem; background: var(--bg-surface); border-top: 1px solid var(--border-color);">
            ${isView ? `
              <button type="button" class="btn-secondary" data-modal-close>Cerrar</button>
              <button type="button" class="btn-primary" data-expense-edit>Editar gasto</button>
            ` : `
              <button type="button" class="btn-secondary" data-modal-close>Cancelar</button>
              <button type="submit" class="btn-primary">${actionLabel}</button>
            `}
          </footer>
        </form>
      </div>
    </div>
  `;
}

/**
 * Muestra error de validación en el campo
 */
function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  const container = field.closest(".form-field");
  if (!container) return;

  // Limpiar error previo
  removeFieldError(fieldId);

  if (message) {
    container.classList.add("has-error");
    const errorMsg = document.createElement("span");
    errorMsg.className = "field-error-text";
    errorMsg.textContent = message;
    errorMsg.style.cssText = "color: #e53e3e; font-size: 0.75rem; margin-top: 0.25rem; display: block;";
    container.appendChild(errorMsg);
    field.style.borderColor = "#e53e3e";
  }
}

/**
 * Limpia error de validación en el campo
 */
function removeFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  const container = field.closest(".form-field");
  if (!container) return;

  container.classList.remove("has-error");
  const errorMsg = container.querySelector(".field-error-text");
  if (errorMsg) errorMsg.remove();
  field.style.borderColor = "";
}

function setupExpenseForm(form, expense) {
  const mode = form.dataset.mode || 'create';
  const isView = mode === 'view';
  const amountInput = form.querySelector("#expense-amount");
  const vatPercentageInput = form.querySelector("#expense-vat-percentage");
  const vatAmountInput = form.querySelector("#expense-vat-amount");
  const deductibleToggle = form.querySelector("#expense-deductible");
  const deductibleGroup = form.querySelector("#deductible-percentage-group");
  const deductiblePercentageInput = form.querySelector("#expense-deductible-percentage");
  const descriptionInput = form.querySelector("#expense-description");
  const dateInput = form.querySelector("#expense-date");
  const categorySelect = form.querySelector("#expense-category");
  const fileDropzone = form.querySelector("#receipt-dropzone");
  const fileInput = form.querySelector("#expense-receipt-file");
  const dropzoneEmpty = form.querySelector("#dropzone-empty");
  const dropzonePreview = form.querySelector("#dropzone-preview");
  const fileInfo = form.querySelector("#file-info");
  const removeFileBtn = form.querySelector("#remove-file");

  if (isView) {
    form.querySelectorAll("input, select, textarea").forEach((field) => {
      if (field.tagName === "SELECT" || field.type === "checkbox" || field.type === "file") {
        field.disabled = true;
      } else {
        field.readOnly = true;
      }
    });
    if (fileDropzone) {
      fileDropzone.style.pointerEvents = "none";
      fileDropzone.style.opacity = "0.6";
    }
  }

  // ✅ Sincronizar IVA y Resumen de Totales
  const syncTotals = () => {
    const amount = sanitizeNumber(amountInput?.value, 0);
    const vatPercentage = sanitizeNumber(vatPercentageInput?.value, 0);
    const vatAmount = calculateVatAmount(amount, vatPercentage);
    const total = amount + vatAmount;

    if (vatAmountInput) {
      vatAmountInput.value = vatAmount.toFixed(2);
    }

    // Actualizar Resumen Lateral
    const summarySubtotal = form.querySelector("#modal-summary-subtotal");
    const summaryVat = form.querySelector("#modal-summary-vat");
    const summaryTotal = form.querySelector("#modal-summary-total");

    if (summarySubtotal) summarySubtotal.textContent = formatCurrency(amount);
    if (summaryVat) summaryVat.textContent = formatCurrency(vatAmount);
    if (summaryTotal) summaryTotal.textContent = formatCurrency(total);

    removeFieldError("expense-amount");
  };

  amountInput?.addEventListener("input", syncTotals);
  vatPercentageInput?.addEventListener("input", syncTotals);
  
  // Ejecutar inicial
  syncTotals();

  // ✅ Toggle deducible
  let lastDeductiblePercentage = deductiblePercentageInput?.value || "100";
  const toggleDeductibleFields = () => {
    const isChecked = deductibleToggle?.checked;
    if (isChecked) {
      deductibleGroup.style.display = "flex";
      if (isView && deductiblePercentageInput) {
        deductiblePercentageInput.disabled = true;
        return;
      }
      if (deductiblePercentageInput) {
        deductiblePercentageInput.disabled = false;
        if (!deductiblePercentageInput.value || deductiblePercentageInput.value === "0") {
          deductiblePercentageInput.value = lastDeductiblePercentage || "100";
        }
      }
    } else {
      deductibleGroup.style.display = "none";
      if (isView && deductiblePercentageInput) {
        deductiblePercentageInput.disabled = true;
        return;
      }
      if (deductiblePercentageInput) {
        if (deductiblePercentageInput.value && deductiblePercentageInput.value !== "0") {
          lastDeductiblePercentage = deductiblePercentageInput.value;
        }
        deductiblePercentageInput.value = "0";
        deductiblePercentageInput.disabled = true;
      }
    }
  };

  deductibleToggle?.addEventListener("change", toggleDeductibleFields);
  toggleDeductibleFields();

  // ✅ GESTIÓN DE ARCHIVOS: Dropzone
  if (fileDropzone && !isView) {
    fileDropzone.addEventListener('click', () => fileInput?.click());

    fileDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileDropzone.style.borderColor = "var(--color-primary)";
      fileDropzone.style.background = "var(--bg-tertiary)";
    });

    fileDropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      fileDropzone.style.borderColor = "var(--border-color)";
      fileDropzone.style.background = "var(--bg-secondary)";
    });

    fileDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileDropzone.style.borderColor = "var(--border-color)";
      fileDropzone.style.background = "var(--bg-secondary)";

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        fileInput.files = files;
        updateFilePreview(files[0]);
      }
    });

    removeFileBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.value = "";
      dropzonePreview.style.display = "none";
      dropzoneEmpty.style.display = "block";
    });
  }

  if (!isView) {
    fileInput?.addEventListener('change', (e) => {
      if (e.target.files?.length > 0) {
        updateFilePreview(e.target.files[0]);
      }
    });
  }

  function updateFilePreview(file) {
    if (fileInfo) fileInfo.textContent = `📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
    dropzoneEmpty.style.display = "none";
    dropzonePreview.style.display = "block";
  }

  // Validación en tiempo real
  if (!isView) {
    form.querySelectorAll("input, select, textarea").forEach((input) => {
      input.addEventListener("blur", () => {
        validateField(input.id, form);
      });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await handleExpenseSubmitWithValidation(form);
    });
  }
}

/**
 * Valida un campo individual
 */
function validateField(fieldId, form) {
  const formData = new FormData(form);
  const data = {
    expenseDate: formData.get("expenseDate"),
    category: formData.get("category"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    isDeductible: formData.get("isDeductible") === "on",
    deductiblePercentage: formData.get("deductiblePercentage"),
  };

  const validation = CLIENT_VALIDATOR.validateExpense(data);
  const field = document.getElementById(fieldId);
  const fieldName = field?.name;

  if (fieldName && validation.errors[fieldName]) {
    setFieldError(fieldId, validation.errors[fieldName]);
    return false;
  } else {
    removeFieldError(fieldId);
    return true;
  }
}

async function handleExpenseSubmitWithValidation(form) {
  const mode = form.dataset.mode || "create";
  const formData = new FormData(form);
  const isDeductible = formData.get("isDeductible") === "on";
  
  const data = {
    expenseDate: formData.get("expenseDate"),
    category: formData.get("category"),
    subcategory: formData.get("subcategory"),
    description: (formData.get("description") || "").trim(),
    amount: sanitizeNumber(formData.get("amount"), 0),
    vatPercentage: sanitizeNumber(formData.get("vatPercentage"), 21),
    vatAmount: sanitizeNumber(formData.get("vatAmount"), 0),
    isDeductible,
    deductiblePercentage: isDeductible
      ? sanitizeNumber(formData.get("deductiblePercentage"), 100)
      : 0,
    paymentMethod: formData.get("paymentMethod"),
    vendor: formData.get("vendor"),
    notes: formData.get("notes"),
  };

  // Validar antes de enviar
  const validation = CLIENT_VALIDATOR.validateExpense(data);
  if (!validation.isValid) {
    Object.entries(validation.errors).forEach(([field, message]) => {
      const input = form.querySelector(`[name="${field}"]`);
      if (input) setFieldError(input.id, message);
    });
    showNotification("Por favor, corrige los errores en el formulario", "warning");
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Procesando...";

    let result;
    if (mode === "create") {
      result = await window.api.createExpense(data);
      showNotification("Gasto registrado correctamente", "success");
    } else {
      result = await window.api.updateExpense(activeExpenseId, data);
      showNotification("Gasto actualizado correctamente", "success");
    }

    // Gestionar subida de archivo si existe
    const fileInput = form.querySelector("#expense-receipt-file");
    if (fileInput?.files?.length > 0) {
      const expenseId = result.id || activeExpenseId;
      await uploadExpenseReceipt(expenseId, fileInput.files[0]);
    }

    closeExpenseModal();
    loadExpenses();
  } catch (error) {
    console.error("Error al guardar gasto:", error);
    const errorMessage = error?.data?.error || error?.message || "Error al guardar el gasto";
    showNotification(errorMessage, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

async function uploadExpenseReceipt(expenseId, file) {
  try {
    const formData = new FormData();
    formData.append('receipt', file);

    const response = await fetch(`${window.api.getBaseUrl()}/expenses/${expenseId}/receipt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${window.api.getAuthToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error subiendo comprobante');
    }

    showNotification("Comprobante subido correctamente", "success");
  } catch (error) {
    console.error("Error uploading receipt:", error);
    showNotification("El gasto se guardó pero falló la subida del comprobante", "warning");
  }
}

async function buildReceiptPreviewHtml(receiptUrl) {
  if (!receiptUrl) return null;
  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(receiptUrl);
  const isPdf = /\.pdf$/i.test(receiptUrl);

  if (isImage) {
    return `<img src="${escapeHtml(receiptUrl)}" alt="Justificante" style="max-width: 100%; border-radius: 8px;" />`;
  } else if (isPdf) {
    return `<div style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; text-align: center;">
      <p>Vista previa no disponible para PDF</p>
      <a href="${escapeHtml(receiptUrl)}" target="_blank" class="btn btn-secondary">Ver PDF completo</a>
    </div>`;
  }
  return `<a href="${escapeHtml(receiptUrl)}" target="_blank">Ver justificante</a>`;
}



async function viewExpense(expenseId) {
  try {
    const expense = expensesData.find(ex => String(ex.id) === String(expenseId)) || 
                   await window.api.getExpense(expenseId);
    if (!expense) {
      showNotification("No se encontró el gasto", "error");
      return;
    }
    openExpenseModal("view", expense.id);
  } catch (error) {
    console.error("Error mostrando gasto:", error);
    showNotification("No se pudo mostrar el detalle del gasto", "error");
  }
}

async function viewExpenseAuditLog(expenseId) {
  try {
    const response = await fetch(`${window.api.getBaseUrl()}/expenses/${expenseId}/audit-log`, {
      headers: {
        'Authorization': `Bearer ${window.api.getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('No se pudo obtener el historial');
    }

    const data = await response.json();
    const auditLog = data.auditLog || [];

    const modalHtml = `
      <div class="modal is-open" id="audit-modal" role="dialog" aria-modal="true" style="z-index: 10001;">
        <div class="modal__backdrop"></div>
        <div class="modal__panel" style="width: min(95vw, 600px); max-width: 600px;">
          <header class="modal__head">
            <h2 class="modal__title">Historial de Cambios</h2>
            <button type="button" class="modal__close" data-modal-close>×</button>
          </header>
          <div class="modal__body" style="max-height: 60vh; overflow-y: auto; padding: 1.5rem;">
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${auditLog.length === 0 ? '<p>No hay cambios registrados</p>' : auditLog.map((log) => `
                <div style="border-left: 3px solid var(--color-primary); padding: 0 0 1rem 1rem; border-bottom: 1px solid var(--border-color);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                    <span style="font-weight: 600; font-size: 0.9rem;">
                      ${log.action === 'created' ? '✨ Creado' : '✏️ Actualizado'}
                    </span>
                    <small style="color: var(--text-secondary);">${new Date(log.created_at).toLocaleString()}</small>
                  </div>
                  <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">
                    Usuario ID: ${log.user_id}
                  </p>
                  ${log.change_reason ? `<p style="margin-top: 0.5rem; font-size: 0.85rem; font-style: italic;">Motivo: ${escapeHtml(log.change_reason)}</p>` : ''}
                </div>
              `).join("")}
            </div>
          </div>
          <footer class="modal__footer">
            <button type="button" class="btn-secondary" data-modal-close>Cerrar</button>
          </footer>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modal = document.getElementById("audit-modal");
    modal?.querySelectorAll("[data-modal-close]").forEach((btn) => {
      btn.addEventListener("click", () => modal.remove());
    });
    modal?.querySelector(".modal__backdrop")?.addEventListener("click", () => modal.remove());

  } catch (error) {
    console.error("Error al obtener historial:", error);
    showNotification("No se pudo cargar el historial", "error");
  }
}

async function confirmDeleteExpense(expenseId) {
  const confirmed = window.confirm(
    "¿Seguro que deseas eliminar este gasto? Esta acción no se puede deshacer."
  );
  if (!confirmed) return;

  try {
    await window.api.deleteExpense(expenseId);
    showNotification("Gasto eliminado correctamente", "success");
    await loadExpenses();
  } catch (error) {
    console.error("Error eliminando gasto:", error);
    showNotification(error?.message || "No se pudo eliminar el gasto", "error");
  }
}

// === MARKUP PRINCIPAL ===
export default function renderExpenses() {
  return `
    <style>
      /* --- ARQUITECTURA DE FRAMES INDEPENDIENTES --- */
      .expenses {
        max-width: 100%;
        overflow-x: hidden;
      }

      .table-toolbar-frame {
        background: var(--bg-surface);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        margin-bottom: 1.5rem; /* Gap de separación física */
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }
      
      .table-toolbar {
        padding: 1.25rem 1.5rem !important;
        display: flex !important;
        align-items: center !important;
        gap: 1.5rem !important;
      }

      .table-card-frame {
        background: var(--bg-surface);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }

      .table-toolbar .search-input {
        max-width: 500px !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0.75rem 1.25rem !important;
        background: var(--bg-secondary) !important;
        border: 1px solid var(--border-color) !important;
        border-radius: 10px !important;
        font-size: 0.95rem !important;
      }

      .expenses-table table {
        min-width: 0;
      }

      .btn-config-columns {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.7rem 1.2rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        color: var(--text-primary);
      }
      
      .btn-config-columns:hover {
        background: var(--bg-tertiary);
        border-color: var(--color-primary);
        transform: translateY(-1px);
      }

      /* --- TABLA: OPTIMIZACIÓN DE ESPACIO Y COLUMNAS --- */
      .data-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: auto;
      }
      
      .data-table th, .data-table td {
        padding: 1.1rem 1rem !important;
        font-size: 0.875rem !important;
        border-bottom: 1px solid var(--border-color);
        white-space: nowrap;
      }

      .data-table th {
        background: rgba(255, 255, 255, 0.02);
        color: var(--text-secondary);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.75rem !important;
      }

      .data-table th[data-column="amount"],
      .data-table td[data-label="Importe"] {
        text-align: right;
      }

      .data-table th:last-child,
      .data-table td.table-actions {
        text-align: right;
        white-space: nowrap;
      }

      .data-table td[data-label="Categor¡a"],
      .data-table td[data-label="Descripci¢n"] {
        white-space: normal;
      }

      .table-description {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-weight: 600;
        color: var(--text-primary);
        white-space: normal;
        overflow-wrap: anywhere;
      }

      /* --- SELECCIÓN DE FILA: ESTILO NAVY (MATCH INVOICES) --- */
      .data-table tr.is-selected {
        background-color: #1e3a8a !important; /* Navy Blue sólido del pantallazo */
        position: relative;
      }
      
      .data-table tr.is-selected td {
        color: #ffffff !important;
        border-bottom-color: rgba(255, 255, 255, 0.1);
      }
      
      .data-table tr.is-selected::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: #3b82f6; /* Acento azul brillante */
      }
      
      .data-table tr.is-selected .table-amount {
        color: #ffffff !important;
        font-weight: 800;
      }
      
      .data-table tr.is-selected .category-pill, 
      .data-table tr.is-selected .status-pill {
        background: rgba(255, 255, 255, 0.2) !important;
        color: #ffffff !important;
        border-color: rgba(255, 255, 255, 0.3);
      }

      .data-table tr:hover:not(.is-selected) {
        background-color: var(--bg-secondary);
      }

      .table-toolbar-frame,
      .table-card-frame {
        border: none;
        background: transparent;
        box-shadow: none;
        padding: 0;
        margin: 0;
      }

      /* --- AJUSTE SELECCION Y BORDES EN LIGHT --- */
      .expenses .data-table tr.is-selected {
        background: rgba(59, 130, 246, 0.15) !important;
        position: static;
      }

      .expenses .data-table tr.is-selected td {
        color: var(--text-primary) !important;
        border-bottom-color: var(--border-color);
      }

      .expenses .data-table tr.is-selected::before {
        display: none;
      }

      .expenses .data-table tr.is-selected .category-pill,
      .expenses .data-table tr.is-selected .status-pill {
        background: var(--bg-secondary);
        color: var(--text-primary);
        border-color: var(--border-color);
      }

      [data-theme="dark"] .expenses .data-table tr.is-selected {
        background: rgba(37, 99, 235, 0.35) !important;
      }

      [data-theme="dark"] .expenses .data-table tr.is-selected td {
        color: var(--text-primary) !important;
        border-bottom-color: rgba(255, 255, 255, 0.1);
      }

      .expense-modal .modal__panel {
        background: var(--bg-surface);
      }

      /* --- MODAL SPLIT FIX --- */
      .modal-form__body--split {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 2.5rem;
        padding: 2.5rem;
        overflow-y: auto;
      }
      
      .modal-form__column--side {
        display: flex !important;
        flex-direction: column !important;
        gap: 1.5rem !important;
      }
      
      .modal-section--totals {
        margin-top: auto;
        border-top: 1px solid var(--border-color);
        padding-top: 1.5rem;
      }

      @media (max-width: 1100px) {
        .modal-form__body--split {
          grid-template-columns: 1fr;
        }
      }
    </style>

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
            ${Object.entries(EXPENSE_CATEGORIES)
              .map(([key, label]) => `<option value="${key}">${label}</option>`)
              .join("")}
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
        <div class="expenses-table-container">
          <!-- El contenido se genera dinámicamente en renderExpensesTable -->
          <div class="module-loading">
            <span class="spinner"></span>
            <p>Sincronizando gastos...</p>
          </div>
        </div>
      </section>
    </section>
  `;
}

// === INICIALIZACIÓN ===
export function initExpenses() {
  window.openExpenseModal = openExpenseModal;
  window.closeExpenseModal = () => {
    const modal = document.getElementById("expense-modal");
    if (modal) modal.remove();
  };
  window.viewExpense = viewExpense;
  window.confirmDeleteExpense = confirmDeleteExpense;
  window.viewExpenseAuditLog = viewExpenseAuditLog;
  window.applyExpenseColumnConfig = applyExpenseColumnConfig;
  window.closeExpenseColumnConfigModal = () => {
    const modal = document.getElementById("expense-column-config-modal");
    if (modal) modal.remove();
  };
  window.openExpenseColumnConfigModal = openExpenseColumnConfigModal;
  window.changeExpensesPage = changeExpensesPage;
  window.goToExpensePage = goToExpensePage;
  window.handleExpenseSearch = handleExpenseSearch;
  window.closeExpenseDrawer = closeExpenseDrawer;
  window.handleExpenseRowClick = handleExpenseRowClick;
  
  const newExpenseBtn = document.getElementById("new-expense-btn");
  newExpenseBtn?.addEventListener("click", () => openExpenseModal("create"));

  setupFilters();
  loadExpenses();
}
