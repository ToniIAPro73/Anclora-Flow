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
  bank_transfer: "Transferencia bancaria",
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
  const loadingEl = document.querySelector("[data-expenses-loading]");
  if (loadingEl) loadingEl.hidden = !isLoading;
}

function renderErrorState(message) {
  const errorEl = document.querySelector("[data-expenses-error]");
  if (!errorEl) return;
  if (!message) {
    errorEl.hidden = true;
    errorEl.innerHTML = "";
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
  const retryBtn = errorEl.querySelector("[data-expenses-retry]");
  if (retryBtn) retryBtn.addEventListener("click", () => loadExpenses());
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
      const hasSelection = expensesData.some(
        (expense) => String(expense.id) === String(selectedExpenseId)
      );
      if (!hasSelection) {
        selectedExpenseId = String(expensesData[0].id);
      }
    } else {
      selectedExpenseId = null;
    }

    currentPage = 1;
    renderExpensesTable();
    updateSummaryCards();
  } catch (error) {
    console.error("Error cargando gastos:", error);
    let message = error?.message || "Se produjo un error al cargar los gastos";
    if (error instanceof window.APIError && error.status === 0) {
      message =
        "No se pudo conectar con el backend (http://localhost:8020). Comprueba que el servicio esté activo.";
    }
    renderErrorState(message);
    showNotification(message, "error");
  } finally {
    isLoading = false;
    renderLoadingState();
  }
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

// === TABLA ===
function renderExpensesTable() {
  const tbody = document.querySelector("[data-expenses-tbody]");
  if (!tbody) return;

  filteredExpenses = Array.isArray(expensesData) ? [...expensesData] : [];

  const total = filteredExpenses.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const start = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, total);
  updateFilterCount(total, start, end);

  if (!filteredExpenses.length) {
    selectedExpenseId = null;
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          No se encontraron gastos. Añade tu primer gasto para empezar.
        </td>
      </tr>
    `;
    renderExpensesPagination(totalPages);
    return;
  }

  const pageItems = filteredExpenses.slice(start - 1, start - 1 + PAGE_SIZE);

  if (filteredExpenses.length) {
    const selectionExists = filteredExpenses.some(
      (expense) => String(expense.id) === String(selectedExpenseId)
    );
    if (!selectionExists) {
      selectedExpenseId = String(filteredExpenses[0].id);
    }
  }

  if (pageItems.length) {
    const pageSelectionExists = pageItems.some(
      (expense) => String(expense.id) === String(selectedExpenseId)
    );
    if (!pageSelectionExists) {
      selectedExpenseId = String(pageItems[0].id);
    }
  }

  tbody.innerHTML = pageItems
    .map((expense) => {
      const categoryLabel =
        EXPENSE_CATEGORIES[expense.category] ||
        expense.category ||
        "Sin categoría";
      const paymentLabel =
        PAYMENT_METHODS[expense.paymentMethod] ||
        expense.paymentMethod ||
        "N/A";
      const isSelected = String(expense.id) === String(selectedExpenseId);
      return `
      <tr class="expenses-table__row${
        isSelected ? " is-selected expenses-table__row--highlight" : ""
      }" data-expense-id="${expense.id}">
        <td>
          <time datetime="${escapeHtml(expense.expenseDate || "")}">
            ${formatDate(expense.expenseDate)}
          </time>
        </td>
        <td>
          <span class="category-badge">
            ${escapeHtml(categoryLabel)}
          </span>
          ${
            expense.subcategory
              ? `<small>${escapeHtml(expense.subcategory)}</small>`
              : ""
          }
        </td>
        <td>
          <div class="expense-description">
            <strong>${escapeHtml(
              expense.description || "Sin descripción"
            )}</strong>
            ${
              expense.vendor
                ? `<small>${escapeHtml(expense.vendor)}</small>`
                : ""
            }
          </div>
        </td>
        <td class="expenses-table__amount">
          ${formatCurrency(expense.amount)}
          <small class="vat-indicator">IVA ${expense.vatPercentage.toFixed(
            2
          )}% (${formatCurrency(expense.vatAmount)})</small>
        </td>
        <td>
          <span class="status-pill status-pill--${
            expense.isDeductible ? "success" : "neutral"
          }">
            ${
              expense.isDeductible
                ? `Deducible ${expense.deductiblePercentage}%`
                : "No deducible"
            }
          </span>
        </td>
        <td class="expenses-table__client">${escapeHtml(paymentLabel)}</td>
        <td class="expenses-table__client">${
          expense.projectName ? escapeHtml(expense.projectName) : "-"
        }</td>
        <td>
          <div class="expenses-table__actions">
            <button type="button" class="table-action" title="Ver gasto" onclick="viewExpense('${
              expense.id
            }')">👁️</button>
            <button type="button" class="table-action" title="Editar gasto" onclick="openExpenseModal('edit', '${
              expense.id
            }')">✏️</button>
            <button type="button" class="table-action" title="Eliminar gasto" onclick="confirmDeleteExpense('${
              expense.id
            }')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");

  tbody.querySelectorAll(".expenses-table__row").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("button") || event.target.closest("a")) return;
      const expenseId = String(row.dataset.expenseId);
      if (selectedExpenseId !== expenseId) {
        selectedExpenseId = expenseId;
        renderExpensesTable();
      }
    });
  });

  renderExpensesPagination(totalPages);
}

function updateFilterCount(total, start = 0, end = 0) {
  const counter = document.querySelector("[data-expenses-count]");
  if (!counter) return;
  if (!total) {
    counter.textContent = "Sin gastos disponibles";
    return;
  }
  const label = total === 1 ? "gasto" : "gastos";
  counter.textContent = `Mostrando ${start}-${end} de ${total} ${label}`;
}

function renderExpensesPagination(totalPages) {
  const pager = document.querySelector('[data-pagination="expenses"]');
  if (!pager) return;

  if (filteredExpenses.length <= PAGE_SIZE) {
    pager.innerHTML = "";
    return;
  }

  pager.innerHTML = `
    <button type="button" class="pager-btn" onclick="window.changeExpensesPage(-1)" ${
      currentPage === 1 ? "disabled" : ""
    }>
      Anterior
    </button>
    <span class="pager-status">Página ${currentPage} de ${totalPages}</span>
    <button type="button" class="pager-btn pager-btn--primary" onclick="window.changeExpensesPage(1)" ${
      currentPage === totalPages ? "disabled" : ""
    }>
      Siguiente
    </button>
  `;
}

// === TARJETAS RESUMEN ===
function updateSummaryCards() {
  const total = expensesData.reduce(
    (sum, expense) => sum + sanitizeNumber(expense.amount, 0),
    0
  );
  const deductible = expensesData
    .filter((expense) => expense.isDeductible)
    .reduce(
      (sum, expense) =>
        sum +
        sanitizeNumber(expense.amount, 0) *
          (sanitizeNumber(expense.deductiblePercentage, 0) / 100),
      0
    );
  const vatRecoverable = expensesData.reduce(
    (sum, expense) => sum + sanitizeNumber(expense.vatAmount, 0),
    0
  );
  const average = expensesData.length ? total / expensesData.length : 0;

  const map = {
    total: document.getElementById("total-expenses"),
    deductible: document.getElementById("deductible-expenses"),
    vat: document.getElementById("recoverable-vat"),
    average: document.getElementById("average-expense"),
  };

  if (map.total) map.total.textContent = formatCurrency(total);
  if (map.deductible) map.deductible.textContent = formatCurrency(deductible);
  if (map.vat) map.vat.textContent = formatCurrency(vatRecoverable);
  if (map.average) map.average.textContent = formatCurrency(average);
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

function changeExpensesPage(delta) {
  const totalPages = Math.max(
    1,
    Math.ceil(filteredExpenses.length / PAGE_SIZE)
  );
  const next = Math.min(Math.max(1, currentPage + delta), totalPages);
  if (next === currentPage) return;
  currentPage = next;
  renderExpensesTable();
}

// === MODALES ===
async function openExpenseModal(mode = "create", expenseId = null) {
  activeExpenseId = expenseId;
  let expense = null;

  if (mode === "edit" && expenseId) {
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

  setupExpenseForm(form, expense);
}

function closeExpenseModal() {
  const modal = document.getElementById("expense-modal");
  if (modal) modal.remove();
  activeExpenseId = null;
}

function buildExpenseModalHtml(mode, expense) {
  const isEdit = mode === "edit" && expense;
  const title = isEdit ? "Editar gasto" : "Registrar nuevo gasto";
  const actionLabel = isEdit ? "Guardar cambios" : "Crear gasto";
  
  // Detectar si el periodo está cerrado (simulado o desde backend)
  const isLocked = expense?.fiscal_period_closed || expense?.fiscalPeriodClosed || false;

  const selectedCategory = expense?.category ?? "";
  const paymentMethodValue = expense?.payment_method ?? expense?.paymentMethod ?? "";
  const amountValue = expense ? sanitizeNumber(expense.amount, 0) : "";
  const vatPercentageValue = expense ? sanitizeNumber(expense.vat_percentage ?? expense.vatPercentage, 21) : 21;
  const vatAmountValue = expense ? sanitizeNumber(expense.vat_amount ?? expense.vatAmount, 0) : 0;
  const deductiblePercentageValue = expense ? sanitizeNumber(expense.deductible_percentage ?? expense.deductiblePercentage, 100) : 100;
  const isDeductibleChecked = expense ? (expense.is_deductible ?? expense.isDeductible ?? true ? "checked" : "") : "checked";

  return `
    <div class="modal is-open" id="expense-modal" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
      <div class="modal__backdrop"></div>
      <div class="modal__panel" style="width: min(95vw, 850px); max-width: 850px; padding: 0;">
        <header class="modal__head" style="padding: 1.5rem; border-bottom: 1px solid var(--border-color);">
          <div>
            <h2 class="modal__title" id="expense-modal-title">${title}</h2>
            ${isLocked ? '<p style="color: #e53e3e; font-size: 0.8rem; margin: 0;">⚠️ Este gasto pertenece a un periodo cerrado y tiene edición limitada.</p>' : ''}
          </div>
          <button type="button" class="modal__close" data-modal-close aria-label="Cerrar modal">×</button>
        </header>
        
        <form id="expense-form" data-mode="${mode}" class="modal-form" novalidate>
          <div class="modal__body" style="padding:1.5rem; max-height: 70vh; overflow-y: auto;">
            
            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem;">
              <!-- Columna Izquierda: Datos principales -->
              <div style="display: flex; flex-direction: column; gap: 1rem;">
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <label class="form-field" id="field-date">
                    <span>Fecha *</span>
                    <input type="date" id="expense-date" name="expenseDate" 
                      value="${formatDateForInput(expense?.expense_date || expense?.expenseDate)}" 
                      ${isLocked ? 'readonly' : 'required'} />
                  </label>
                  
                  <label class="form-field" id="field-category">
                    <span>Categoría *</span>
                    <select id="expense-category" name="category" required ${isLocked ? 'disabled' : ''}>
                      <option value="" disabled ${!expense ? "selected" : ""}>Elegir...</option>
                      ${Object.entries(EXPENSE_CATEGORIES)
                        .map(([key, label]) => `<option value="${key}" ${selectedCategory === key ? "selected" : ""}>${label}</option>`)
                        .join("")}
                    </select>
                  </label>
                </div>

                <label class="form-field" id="field-description">
                  <span>Descripción *</span>
                  <input type="text" id="expense-description" name="description" 
                    placeholder="Ej: Suscripción mensual software CRM" 
                    value="${escapeHtml(expense?.description || "")}" 
                    required maxlength="500" />
                </label>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <label class="form-field" id="field-amount">
                    <span>Importe Base (€) *</span>
                    <input type="number" step="0.01" min="0.01" id="expense-amount" name="amount" 
                      value="${amountValue}" ${isLocked ? 'readonly' : 'required'} />
                  </label>
                  
                  <label class="form-field" id="field-payment-method">
                    <span>Método de Pago</span>
                    <select id="expense-payment-method" name="paymentMethod">
                      <option value="" disabled ${!paymentMethodValue ? "selected" : ""}>Elegir...</option>
                      ${Object.entries(PAYMENT_METHODS)
                        .map(([key, label]) => `<option value="${key}" ${paymentMethodValue === key ? "selected" : ""}>${label}</option>`)
                        .join("")}
                    </select>
                  </label>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <label class="form-field" id="field-vat-percentage">
                    <span>IVA (%)</span>
                    <input type="number" step="1" min="0" max="100" id="expense-vat-percentage" name="vatPercentage" 
                      value="${vatPercentageValue}" />
                  </label>
                  
                  <label class="form-field" id="field-vat-amount">
                    <span>Cuota IVA (€)</span>
                    <input type="number" step="0.01" id="expense-vat-amount" name="vatAmount" 
                      value="${vatAmountValue}" readonly style="background: var(--bg-secondary);" />
                  </label>
                </div>

                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                    <label class="toggle" style="margin:0;">
                      <input type="checkbox" id="expense-deductible" name="isDeductible" ${isDeductibleChecked} />
                      <span class="toggle__slider"></span>
                      <span class="toggle__label" style="font-weight: 600;">Gasto Deducible</span>
                    </label>
                  </div>
                  <div id="deductible-percentage-group" style="${isDeductibleChecked ? 'display: flex;' : 'display: none;'} flex-direction: column; gap: 0.5rem; margin-top: 1rem;">
                    <label class="form-field" id="field-deductible-percentage">
                      <span>% de Deducibilidad</span>
                      <input type="number" step="1" min="0" max="100" id="expense-deductible-percentage" name="deductiblePercentage" value="${deductiblePercentageValue}" />
                      <small style="color: var(--text-secondary); font-size: 0.7rem;">Depende de la categoría y uso profesional.</small>
                    </label>
                  </div>
                </div>

              </div>

              <!-- Columna Derecha: Archivo y Extras -->
              <div style="display: flex; flex-direction: column; gap: 1rem;">
                
                <div class="form-field" id="field-receipt">
                  <span>Comprobante / Justificante</span>
                  <div id="receipt-dropzone" style="border: 2px dashed var(--border-color); border-radius: 12px; padding: 2rem 1rem; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--bg-secondary);">
                    <div id="dropzone-empty">
                      <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">📄</span>
                      <p style="margin: 0; font-size: 0.85rem; font-weight: 500;">Arrastra aquí o haz clic para subir</p>
                      <p style="margin: 0.25rem 0 0; font-size: 0.75rem; color: var(--text-secondary);">PDF, JPG o PNG (máx. 10MB)</p>
                    </div>
                    <div id="dropzone-preview" style="display: none;">
                      <p id="file-info" style="margin: 0; font-size: 0.85rem; font-weight: 600; color: var(--color-primary);"></p>
                      <button type="button" id="remove-file" style="background: none; border: none; color: #e53e3e; font-size: 0.75rem; text-decoration: underline; margin-top: 0.5rem; cursor: pointer;">Quitar archivo</button>
                    </div>
                    <input type="file" id="expense-receipt-file" style="display: none;" accept=".pdf,.jpg,.jpeg,.png" />
                  </div>
                </div>

                <label class="form-field" id="field-vendor">
                  <span>Proveedor / Establecimiento</span>
                  <input type="text" id="expense-vendor" name="vendor" placeholder="Ej: Amazon, Gasolinera Repsol..." value="${escapeHtml(expense?.vendor || "")}" />
                </label>

                <label class="form-field" id="field-notes">
                  <span>Notas adicionales</span>
                  <textarea id="expense-notes" name="notes" rows="4" placeholder="Cualquier aclaración relevante..." style="resize: vertical; min-height: 100px;">${escapeHtml(expense?.notes || "")}</textarea>
                </label>

              </div>
            </div>

          </div>
          <footer class="modal__footer" style="padding: 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 1rem; background: var(--bg-secondary);">
            <button type="button" class="btn-secondary" data-modal-close>Cancelar</button>
            <button type="submit" class="btn-primary">${actionLabel}</button>
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
  const amountInput = form.querySelector("#expense-amount");
  const vatPercentageInput = form.querySelector("#expense-vat-percentage");
  const vatAmountInput = form.querySelector("#expense-vat-amount");
  const deductibleToggle = form.querySelector("#expense-deductible");
  const deductibleGroup = form.querySelector("#deductible-percentage-group");
  const descriptionInput = form.querySelector("#expense-description");
  const dateInput = form.querySelector("#expense-date");
  const categorySelect = form.querySelector("#expense-category");
  const fileDropzone = form.querySelector("#receipt-dropzone");
  const fileInput = form.querySelector("#expense-receipt-file");
  const dropzoneEmpty = form.querySelector("#dropzone-empty");
  const dropzonePreview = form.querySelector("#dropzone-preview");
  const fileInfo = form.querySelector("#file-info");
  const removeFileBtn = form.querySelector("#remove-file");

  // ✅ Sincronizar IVA automático
  const syncVatAmount = () => {
    const amount = sanitizeNumber(amountInput?.value, 0);
    const vatPercentage = sanitizeNumber(vatPercentageInput?.value, 0);
    const calculated = calculateVatAmount(amount, vatPercentage);
    if (vatAmountInput) {
      vatAmountInput.value = calculated.toFixed(2);
    }
    removeFieldError("expense-amount");
  };

  amountInput?.addEventListener("input", syncVatAmount);
  vatPercentageInput?.addEventListener("input", syncVatAmount);

  // ✅ Toggle deducible
  const toggleDeductibleFields = () => {
    const isChecked = deductibleToggle.checked;
    if (isChecked) {
      deductibleGroup.style.display = "flex";
    } else {
      deductibleGroup.style.display = "none";
    }
  };

  deductibleToggle?.addEventListener("change", toggleDeductibleFields);

  // ✅ GESTIÓN DE ARCHIVOS: Dropzone
  if (fileDropzone) {
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

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files?.length > 0) {
      updateFilePreview(e.target.files[0]);
    }
  });

  function updateFilePreview(file) {
    if (fileInfo) fileInfo.textContent = `📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
    dropzoneEmpty.style.display = "none";
    dropzonePreview.style.display = "block";
  }

  // Validación en tiempo real
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
  
  const data = {
    expenseDate: formData.get("expenseDate"),
    category: formData.get("category"),
    subcategory: formData.get("subcategory"),
    description: (formData.get("description") || "").trim(),
    amount: sanitizeNumber(formData.get("amount"), 0),
    vatPercentage: sanitizeNumber(formData.get("vatPercentage"), 21),
    vatAmount: sanitizeNumber(formData.get("vatAmount"), 0),
    isDeductible: formData.get("isDeductible") === "on",
    deductiblePercentage: sanitizeNumber(formData.get("deductiblePercentage"), 100),
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
    showNotification(error.message || "Error al guardar el gasto", "error");
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
    const expense = await window.api.getExpense(expenseId);
    if (!expense) {
      showNotification("No se encontró el gasto", "error");
      return;
    }

    const formattedDate = formatDate(expense.expense_date || expense.expenseDate);
    const categoryLabel = EXPENSE_CATEGORIES[expense.category] || expense.category || "Sin categoría";
    const paymentMethodLabel = PAYMENT_METHODS[expense.paymentMethod] || expense.paymentMethod || "-";
    const receiptHtml = await buildReceiptPreviewHtml(expense.receiptUrl || expense.receipt_url);

    const modalHtml = `
      <div class="modal is-open" id="expense-view-modal" role="dialog" aria-modal="true">
        <div class="modal__backdrop"></div>
        <div class="modal__panel" style="width: min(95vw, 900px); max-width: 900px; padding: 0;">
          <header class="modal__head" style="padding: 1.5rem; border-bottom: 1px solid var(--border-color);">
            <div>
              <h2 class="modal__title">Detalle del Gasto</h2>
              <p class="modal__subtitle">${formattedDate} • ${escapeHtml(categoryLabel)}</p>
            </div>
            <button type="button" class="modal__close" data-modal-close aria-label="Cerrar modal">×</button>
          </header>
          
          <div class="modal__body" style="padding: 1.5rem;">
            <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem;">
              
              <!-- Detalles -->
              <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div>
                  <h3 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.5rem; letter-spacing: 0.05em;">Información</h3>
                  <div style="background: var(--bg-secondary); border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
                    <div>
                      <small style="display: block; color: var(--text-secondary); font-size: 0.7rem;">Descripción</small>
                      <span style="font-weight: 500;">${escapeHtml(expense.description)}</span>
                    </div>
                    <div>
                      <small style="display: block; color: var(--text-secondary); font-size: 0.7rem;">Proveedor</small>
                      <span>${escapeHtml(expense.vendor || "-")}</span>
                    </div>
                    <div>
                      <small style="display: block; color: var(--text-secondary); font-size: 0.7rem;">Método de Pago</small>
                      <span>${escapeHtml(paymentMethodLabel)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.5rem; letter-spacing: 0.05em;">Contabilidad</h3>
                  <div style="background: var(--bg-secondary); border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <small style="color: var(--text-secondary); font-size: 0.7rem;">Importe Base</small>
                      <span style="font-weight: 600;">${formatCurrency(expense.amount)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <small style="color: var(--text-secondary); font-size: 0.7rem;">IVA (${expense.vatPercentage}%)</small>
                      <span>${formatCurrency(expense.vatAmount)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); pt: 0.5rem; mt: 0.25rem;">
                      <small style="font-weight: 600;">Total</small>
                      <span style="font-weight: 700; color: var(--color-primary);">${formatCurrency(sanitizeNumber(expense.amount, 0) + sanitizeNumber(expense.vatAmount, 0))}</span>
                    </div>
                  </div>
                </div>

                <button type="button" class="btn-ghost" style="justify-content: center; width: 100%; border: 1px solid var(--border-color);" onclick="viewExpenseAuditLog('${expense.id}')">
                   📜 Ver historial de cambios
                </button>
              </div>

              <!-- Justificante y Notas -->
              <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div>
                   <h3 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.5rem; letter-spacing: 0.05em;">Justificante</h3>
                   <div style="background: var(--bg-secondary); border-radius: 12px; border: 1px dashed var(--border-color); overflow: hidden; display: flex; align-items: center; justify-content: center; min-height: 200px;">
                      ${receiptHtml || '<p style="color: var(--text-secondary); font-size: 0.85rem;">No hay archivo adjunto</p>'}
                   </div>
                </div>

                ${expense.notes ? `
                  <div>
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.5rem; letter-spacing: 0.05em;">Notas</h3>
                    <div style="background: var(--bg-secondary); border-radius: 8px; padding: 1rem;">
                      <p style="margin: 0; font-size: 0.85rem; white-space: pre-wrap;">${escapeHtml(expense.notes)}</p>
                    </div>
                  </div>
                ` : ''}
              </div>

            </div>
          </div>

          <footer class="modal__footer" style="padding: 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 1rem; background: var(--bg-secondary);">
            <button type="button" class="btn-secondary" data-modal-close>Cerrar</button>
            <button type="button" class="btn-primary" data-expense-edit="${expense.id}">Editar gasto</button>
          </footer>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modal = document.getElementById("expense-view-modal");
    modal?.querySelectorAll("[data-modal-close]").forEach((btn) => {
      btn.addEventListener("click", () => modal.remove());
    });
    modal?.querySelector(".modal__backdrop")?.addEventListener("click", () => modal.remove());
    modal?.querySelector("[data-expense-edit]")?.addEventListener("click", () => {
      modal.remove();
      openExpenseModal("edit", String(expense.id));
    });

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
                <th scope="col">ACCIONES</th>
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
          <p data-expenses-count>Sin gastos disponibles</p>
          <div class="invoices-table__pager" data-pagination="expenses"></div>
        </footer>
        <div class="module-loading" data-expenses-loading hidden>
          <span class="spinner"></span>
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

  const newExpenseBtn = document.getElementById("new-expense-btn");
  newExpenseBtn?.addEventListener("click", () => openExpenseModal("create"));

  setupFilters();
  loadExpenses();
  window.changeExpensesPage = changeExpensesPage;
}
