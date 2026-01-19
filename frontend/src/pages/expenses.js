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
  const selectedCategory = expense?.category ?? "";
  const paymentMethodValue =
    expense?.payment_method ?? expense?.paymentMethod ?? "";
  const amountValue = expense ? sanitizeNumber(expense.amount, 0) : "";
  const vatPercentageValue = expense
    ? sanitizeNumber(expense.vat_percentage ?? expense.vatPercentage, 21)
    : 21;
  const vatAmountValue = expense
    ? sanitizeNumber(expense.vat_amount ?? expense.vatAmount, 0)
    : 0;
  const deductiblePercentageValue = expense
    ? sanitizeNumber(
        expense.deductible_percentage ?? expense.deductiblePercentage,
        100
      )
    : 100;
  const isDeductibleChecked = expense
    ? expense.is_deductible ?? expense.isDeductible ?? true
      ? "checked"
      : ""
    : "checked";

  // Using 800px width and inline grids to ensure compact horizontal layout without scrolling
  return `
    <div class="modal is-open" id="expense-modal" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
      <div class="modal__backdrop"></div>
      <div class="modal__panel" style="width: min(95vw, 800px); max-width: 800px; padding: 1.5rem;">
        <header class="modal__head" style="margin-bottom: 1rem;">
          <div>
            <h2 class="modal__title" id="expense-modal-title">${title}</h2>
          </div>
          <button type="button" class="modal__close" data-modal-close aria-label="Cerrar modal">×</button>
        </header>
        <form id="expense-form" data-mode="${mode}" class="modal-form" novalidate>
          <div class="modal__body modal-form__body" style="overflow-y: visible;">
            
            <!-- Row 1: Date, Category, Subcategory, Payment Method (4 Cols) -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.75rem;">
              <label class="form-field">
                <span>Fecha *</span>
                <input type="date" id="expense-date" name="expenseDate" value="${formatDateForInput(expense?.expense_date)}" required />
              </label>
              
              <label class="form-field">
                <span>Categoría *</span>
                <select id="expense-category" name="category" required style="font-size: 0.85rem;">
                  <option value="" disabled ${!expense ? "selected" : ""}>Elegir...</option>
                  ${Object.entries(EXPENSE_CATEGORIES)
                    .map(([key, label]) => `<option value="${key}" ${selectedCategory === key ? "selected" : ""}>${label}</option>`)
                    .join("")}
                </select>
              </label>

              <label class="form-field">
                <span>Subcategoría</span>
                <input type="text" id="expense-subcategory" name="subcategory" placeholder="Opcional" value="${escapeHtml(expense?.subcategory || "")}" />
              </label>

               <label class="form-field">
                <span>Método Pago</span>
                <select id="expense-payment-method" name="paymentMethod">
                  <option value="" disabled ${!paymentMethodValue ? "selected" : ""}>Elegir...</option>
                  ${Object.entries(PAYMENT_METHODS)
                    .map(([key, label]) => `<option value="${key}" ${paymentMethodValue === key ? "selected" : ""}>${label}</option>`)
                    .join("")}
                </select>
              </label>
            </div>

            <!-- Row 2: Description (3 Cols) & Vendor (1 Col) -->
            <div style="display: grid; grid-template-columns: 3fr 1fr; gap: 0.75rem; margin-top: 0.75rem;">
               <label class="form-field">
                <span>Descripción *</span>
                <input type="text" id="expense-description" name="description" placeholder="Descripción del gasto" value="${escapeHtml(expense?.description || "")}" required maxlength="200" />
              </label>
               <label class="form-field">
                <span>Proveedor</span>
                <input type="text" id="expense-vendor" name="vendor" placeholder="Nombre" value="${escapeHtml(expense?.vendor || "")}" />
              </label>
            </div>

            <!-- Row 3: Financials (Amount, VAT, Calculate, Deductible) (4 Cols) -->
            <div style="display: grid; grid-template-columns: 1fr 0.8fr 1fr 1.2fr; gap: 0.75rem; margin-top: 0.75rem;">
               <label class="form-field">
                <span>Importe (€) *</span>
                <input type="number" step="0.01" min="0" id="expense-amount" name="amount" value="${amountValue}" required />
              </label>
              
              <label class="form-field">
                <span>IVA %</span>
                <input type="number" step="0.1" min="0" id="expense-vat-percentage" name="vatPercentage" value="${vatPercentageValue}" />
              </label>
              
              <label class="form-field">
                <span>IVA (€)</span>
                <input type="number" step="0.01" min="0" id="expense-vat-amount" name="vatAmount" value="${vatAmountValue}" />
              </label>

              <div class="form-field form-field--inline" style="justify-content: flex-start; padding-top: 1.2rem; padding-left: 0.5rem;">
                 <label class="toggle" style="outline: none;">
                    <input type="checkbox" id="expense-deductible" name="isDeductible" ${isDeductibleChecked} style="outline: none; box-shadow: none;" />
                    <span class="toggle__slider"></span>
                    <span class="toggle__label">Deducible</span>
                  </label>
              </div>
            </div>

            <!-- Row 4: Notes & Receipt URL (Full Width / Grid) -->
             <div id="row-notes" style="display: grid; grid-template-columns: ${isDeductibleChecked ? '1fr 3fr' : '1fr'}; gap: 0.75rem; margin-top: 0.75rem;">
               <label class="form-field" id="deductible-percentage-group" style="${isDeductibleChecked ? '' : 'display: none;'}">
                 <span>% Deducible</span>
                 <input type="number" step="1" min="0" max="100" id="expense-deductible-percentage" name="deductiblePercentage" value="${deductiblePercentageValue}" />
              </label>

              <label class="form-field">
                <span>Notas / URL</span>
                <textarea id="expense-notes" name="notes" rows="1" placeholder="Notas adicionales o URL del recibo" style="min-height: 2.2rem; height: 38px; resize: none;">${escapeHtml(expense?.notes || "")}</textarea>
              </label>
             </div>


          </div>
          <footer class="modal__footer modal-form__footer" style="margin-top: 1.5rem;">
            <button type="button" class="btn-secondary" data-modal-close>Cancelar</button>
            <button type="submit" class="btn-primary">${actionLabel}</button>
          </footer>
        </form>
      </div>
    </div>
  `;
}



function setupExpenseForm(form, expense) {
  const amountInput = form.querySelector("#expense-amount");
  const vatPercentageInput = form.querySelector("#expense-vat-percentage");
  const vatAmountInput = form.querySelector("#expense-vat-amount");
  const deductibleToggle = form.querySelector("#expense-deductible");
  const deductibleGroup = form.querySelector("#deductible-percentage-group");
  const rowNotes = form.querySelector("#row-notes");

  const syncVatAmount = () => {
    const amount = sanitizeNumber(amountInput.value, 0);
    const vatPercentage = sanitizeNumber(vatPercentageInput.value, 0);
    vatAmountInput.value = calculateVatAmount(amount, vatPercentage);
  };

  amountInput?.addEventListener("input", syncVatAmount);
  vatPercentageInput?.addEventListener("input", syncVatAmount);

  const toggleDeductibleFields = () => {
    const isChecked = deductibleToggle.checked;
    if (isChecked) {
        deductibleGroup.style.display = "flex";
        rowNotes.style.gridTemplateColumns = "1fr 3fr";
    } else {
        deductibleGroup.style.display = "none";
        rowNotes.style.gridTemplateColumns = "1fr";
    }
  };

  deductibleToggle?.addEventListener("change", toggleDeductibleFields);
  // Initial call handled by HTML rendering logic, but good to ensure


  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleExpenseSubmit(form);
  });
}

async function handleExpenseSubmit(form) {
  const formData = new FormData(form);
  const mode = form.dataset.mode || "create";

  const payload = {
    expenseDate: formData.get("expenseDate"),
    category: formData.get("category"),
    description: (formData.get("description") || "").trim(),
    amount: sanitizeNumber(formData.get("amount"), 0),
    vatPercentage: sanitizeNumber(formData.get("vatPercentage"), 0),
    vatAmount: sanitizeNumber(formData.get("vatAmount"), 0),
    isDeductible: formData.get("isDeductible") === "on",
  };

  if (payload.isDeductible) {
    payload.deductiblePercentage = sanitizeNumber(
      formData.get("deductiblePercentage"),
      0
    );
  } else {
    payload.deductiblePercentage = 0;
  }

  const subcategory = (formData.get("subcategory") || "").trim();
  if (subcategory) payload.subcategory = subcategory;

  const paymentMethod = formData.get("paymentMethod");
  if (paymentMethod) payload.paymentMethod = paymentMethod;

  const vendor = (formData.get("vendor") || "").trim();
  if (vendor) payload.vendor = vendor;

  const receiptUrl = (formData.get("receiptUrl") || "").trim();
  if (receiptUrl) payload.receiptUrl = receiptUrl;

  const notes = (formData.get("notes") || "").trim();
  if (notes) payload.notes = notes;

  if (!payload.expenseDate) {
    showNotification("Selecciona la fecha del gasto", "warning");
    return;
  }

  if (!payload.category) {
    showNotification("Selecciona una categoría", "warning");
    return;
  }

  if (!payload.description) {
    showNotification("Añade una descripción del gasto", "warning");
    return;
  }

  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    showNotification("Introduce un importe mayor que 0", "warning");
    return;
  }

  try {
    if (mode === "edit" && activeExpenseId) {
      const updatedExpense = await window.api.updateExpense(
        activeExpenseId,
        payload
      );
      const normalized = normalizeExpense(
        updatedExpense?.expense ?? updatedExpense
      );
      if (normalized) {
        expensesData = expensesData.filter(
          (expense) => expense.id !== normalized.id
        );
        expensesData.unshift(normalized);
        expensesData.sort((a, b) => {
          const dateA = new Date(a.expenseDate || 0).getTime();
          const dateB = new Date(b.expenseDate || 0).getTime();
          return dateB - dateA;
        });
        selectedExpenseId = String(normalized.id);
        currentPage = 1;
        renderExpensesTable();
        updateSummaryCards();
      }
      showNotification("Gasto actualizado correctamente", "success");
    } else {
      const createdExpense = await window.api.createExpense(payload);
      const normalized = normalizeExpense(
        createdExpense?.expense ?? createdExpense
      );
      if (normalized) {
        expensesData = expensesData.filter(
          (expense) => expense.id !== normalized.id
        );
        expensesData.unshift(normalized);
        expensesData.sort((a, b) => {
          const dateA = new Date(a.expenseDate || 0).getTime();
          const dateB = new Date(b.expenseDate || 0).getTime();
          return dateB - dateA;
        });
        selectedExpenseId = String(normalized.id);
        currentPage = 1;
        renderExpensesTable();
        updateSummaryCards();
      }
      showNotification("Gasto registrado correctamente", "success");
    }

    closeExpenseModal();
    // Sincroniza con backend pero sin bloquear el feedback inmediato
    loadExpenses();
  } catch (error) {
    console.error("Error guardando gasto:", error);
    showNotification(error?.message || "No se pudo guardar el gasto", "error");
  }
}

async function viewExpense(expenseId) {
  try {
    const expense = await window.api.getExpense(expenseId);
    if (!expense) {
      showNotification("No se encontró el gasto", "error");
      return;
    }

    const formattedDate = formatDate(expense.expense_date);
    const categoryLabel =
      EXPENSE_CATEGORIES[expense.category] ||
      expense.category ||
      "Sin categoría";
    const subcategoryLabel = expense.subcategory || "-";
    const paymentMethodLabel =
      PAYMENT_METHODS[expense.payment_method] || expense.payment_method || "-";
    const projectLabel = expense.project_name || "-";
    const vatPercentageDisplay = sanitizeNumber(
      expense.vat_percentage ?? expense.vatPercentage,
      0
    );
    const deductiblePercentageDisplay = sanitizeNumber(
      expense.deductible_percentage ?? expense.deductiblePercentage,
      0
    );
    const isDeductibleText =
      expense.is_deductible ?? expense.isDeductible ?? true
        ? `Sí, ${deductiblePercentageDisplay}%`
        : "No deducible";
    const receiptLink = expense.receipt_url
      ? `<a href="${escapeHtml(
          expense.receipt_url
        )}" target="_blank" rel="noopener">Abrir justificante</a>`
      : "No adjuntado";

    const modalHtml = `
      <div class="modal is-open" id="expense-view-modal" role="dialog" aria-modal="true">
        <div class="modal__backdrop"></div>
        <div class="modal__panel">
          <header class="modal__head">
            <div>
              <h2 class="modal__title">Detalle del gasto</h2>
              <p class="modal__subtitle">${formattedDate} - ${escapeHtml(
      categoryLabel
    )}</p>
            </div>
            <button type="button" class="modal__close" data-modal-close aria-label="Cerrar modal">×</button>
          </header>
          <div class="modal__body" style="padding: 1.75rem;">
            <div style="display: flex; flex-direction: column; gap: 1.5rem; height: 100%; min-height: 0;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem;">
                ${[
                  { label: "Descripción", value: escapeHtml(expense.description || "-") },
                  { label: "Fecha del gasto", value: formattedDate },
                  { label: "Categoría", value: escapeHtml(categoryLabel) },
                  { label: "Subcategoría", value: escapeHtml(subcategoryLabel) },
                  { label: "Método de pago", value: escapeHtml(paymentMethodLabel) },
                  { label: "Proveedor", value: escapeHtml(expense.vendor || "-") },
                  { label: "Importe base", value: formatCurrency(expense.amount) },
                  {
                    label: "IVA",
                    value: `${formatCurrency(expense.vat_amount)} (${vatPercentageDisplay}%)`,
                  },
                  { label: "Tratamiento fiscal", value: escapeHtml(isDeductibleText) },
                  { label: "Proyecto", value: escapeHtml(projectLabel) },
                ]
                  .map(
                    ({ label, value }) => `
                      <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem 1.25rem; background: var(--bg-secondary);">
                        <h3 style="margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary); font-weight: 600;">${label}</h3>
                        <p style="margin: 0; font-size: 0.95rem; color: var(--text-primary); font-weight: 500;">${value}</p>
                      </div>
                    `
                  )
                  .join("")}
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem;">
                <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem 1.25rem; background: var(--bg-secondary);">
                  <h3 style="margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary); font-weight: 600;">Justificante</h3>
                  <p style="margin: 0; font-size: 0.95rem; color: var(--text-primary); font-weight: 500;">${receiptLink}</p>
                </div>
                <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem 1.25rem; background: var(--bg-secondary);">
                  <h3 style="margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary); font-weight: 600;">Notas</h3>
                  <p style="margin: 0; font-size: 0.95rem; color: var(--text-primary); font-weight: 500; white-space: pre-wrap;">${escapeHtml(expense.notes || "-")}</p>
                </div>
              </div>
            </div>
          </div>
          <footer class="modal__footer modal-form__footer" style="margin-top: 0.75rem;">
            <button type="button" class="btn-secondary" data-modal-close>Cerrar</button>
            <button type="button" class="btn-primary" data-expense-edit="${
              expense.id
            }">Editar gasto</button>
          </footer>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modal = document.getElementById("expense-view-modal");
    modal?.querySelectorAll("[data-modal-close]").forEach((btn) => {
      btn.addEventListener("click", () => modal.remove());
    });
    modal
      ?.querySelector(".modal__backdrop")
      ?.addEventListener("click", () => modal.remove());
    modal
      ?.querySelector("[data-expense-edit]")
      ?.addEventListener("click", () => {
        modal.remove();
        openExpenseModal("edit", String(expense.id));
      });
  } catch (error) {
    console.error("Error mostrando gasto:", error);
    showNotification("No se pudo mostrar el detalle del gasto", "error");
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
