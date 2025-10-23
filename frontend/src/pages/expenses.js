// Categorías de gastos
const EXPENSE_CATEGORIES = {
  office: 'Oficina',
  software: 'Software',
  hardware: 'Hardware',
  marketing: 'Marketing',
  travel: 'Viajes',
  meals: 'Comidas',
  professional_services: 'Servicios Profesionales',
  supplies: 'Suministros',
  insurance: 'Seguros',
  other: 'Otros'
};

// Métodos de pago
const PAYMENT_METHODS = {
  bank_transfer: 'Transferencia Bancaria',
  card: 'Tarjeta',
  cash: 'Efectivo',
  other: 'Otro'
};

// Datos de demostración
const demoExpenses = [
  {
    id: '1',
    category: 'software',
    subcategory: 'Suscripción',
    description: 'Adobe Creative Cloud',
    amount: 54.99,
    vatAmount: 11.55,
    vatPercentage: 21,
    isDeductible: true,
    deductiblePercentage: 100,
    expenseDate: '2024-12-15',
    paymentMethod: 'card',
    vendor: 'Adobe Systems',
    receiptUrl: null,
    notes: 'Suscripción mensual'
  },
  {
    id: '2',
    category: 'office',
    subcategory: 'Material de oficina',
    description: 'Material de oficina variado',
    amount: 125.50,
    vatAmount: 26.36,
    vatPercentage: 21,
    isDeductible: true,
    deductiblePercentage: 100,
    expenseDate: '2024-12-10',
    paymentMethod: 'card',
    vendor: 'Office Depot',
    receiptUrl: null,
    notes: ''
  },
  {
    id: '3',
    category: 'travel',
    subcategory: 'Transporte',
    description: 'Gasolina vehículo empresa',
    amount: 85.00,
    vatAmount: 17.85,
    vatPercentage: 21,
    isDeductible: true,
    deductiblePercentage: 100,
    expenseDate: '2024-12-08',
    paymentMethod: 'card',
    vendor: 'Repsol',
    receiptUrl: null,
    notes: 'Viaje a reunión con cliente'
  },
  {
    id: '4',
    category: 'meals',
    subcategory: 'Comida de negocios',
    description: 'Comida con cliente',
    amount: 68.00,
    vatAmount: 6.80,
    vatPercentage: 10,
    isDeductible: true,
    deductiblePercentage: 100,
    expenseDate: '2024-12-05',
    paymentMethod: 'card',
    vendor: 'Restaurante El Gourmet',
    receiptUrl: null,
    notes: 'Reunión con cliente potencial'
  },
  {
    id: '5',
    category: 'hardware',
    subcategory: 'Equipo informático',
    description: 'Monitor 27 pulgadas',
    amount: 299.00,
    vatAmount: 62.79,
    vatPercentage: 21,
    isDeductible: true,
    deductiblePercentage: 100,
    expenseDate: '2024-12-01',
    paymentMethod: 'bank_transfer',
    vendor: 'Amazon',
    receiptUrl: null,
    notes: 'Equipo para oficina'
  }
];

export function renderExpenses() {
  return `
    <section class="module expenses">
      <div class="module-header">
        <div class="module-title-section">
          <h2>Gastos y Deducciones</h2>
          <p class="module-subtitle">Gestiona tus gastos deducibles y optimiza tu fiscalidad</p>
        </div>
        <button id="new-expense-btn" class="btn btn-primary" type="button">
          <span class="icon">+</span> Añadir Gasto
        </button>
      </div>

      <!-- Tarjetas de resumen -->
      <div class="summary-cards">
        <div class="card stat-card">
          <div class="card-icon" style="background: var(--color-error-light);">💰</div>
          <div class="card-content">
            <span class="card-label">Gastos Totales</span>
            <span class="card-value" id="total-expenses">€0</span>
            <span class="card-trend positive">Este mes</span>
          </div>
        </div>

        <div class="card stat-card">
          <div class="card-icon" style="background: var(--color-success-light);">✓</div>
          <div class="card-content">
            <span class="card-label">Gastos Deducibles</span>
            <span class="card-value" id="deductible-expenses">€0</span>
            <span class="card-trend">Ahorro fiscal</span>
          </div>
        </div>

        <div class="card stat-card">
          <div class="card-icon" style="background: var(--color-warning-light);">📊</div>
          <div class="card-content">
            <span class="card-label">IVA Recuperable</span>
            <span class="card-value" id="recoverable-vat">€0</span>
            <span class="card-trend">A reclamar</span>
          </div>
        </div>

        <div class="card stat-card">
          <div class="card-icon" style="background: var(--color-info-light);">📈</div>
          <div class="card-content">
            <span class="card-label">Promedio por Gasto</span>
            <span class="card-value" id="average-expense">€0</span>
            <span class="card-trend">Media</span>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="filters-section">
        <div class="filters-row">
          <div class="filter-group">
            <label for="expense-search">Buscar</label>
            <input
              type="text"
              id="expense-search"
              class="filter-input"
              placeholder="Descripción, proveedor..."
            />
          </div>

          <div class="filter-group">
            <label for="expense-category-filter">Categoría</label>
            <select id="expense-category-filter" class="filter-select">
              <option value="">Todas las categorías</option>
              ${Object.entries(EXPENSE_CATEGORIES).map(([key, label]) =>
                `<option value="${key}">${label}</option>`
              ).join('')}
            </select>
          </div>

          <div class="filter-group">
            <label for="expense-deductible-filter">Deducible</label>
            <select id="expense-deductible-filter" class="filter-select">
              <option value="">Todos</option>
              <option value="true">Deducibles</option>
              <option value="false">No deducibles</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="expense-date-from">Fecha desde</label>
            <input type="date" id="expense-date-from" class="filter-input" />
          </div>

          <div class="filter-group">
            <label for="expense-date-to">Fecha hasta</label>
            <input type="date" id="expense-date-to" class="filter-input" />
          </div>

          <button id="reset-filters" class="btn btn-secondary" type="button">
            Limpiar filtros
          </button>
        </div>
        <div class="filter-results">
          <span id="filter-result-count">0 gastos encontrados</span>
        </div>
      </div>

      <!-- Tabla de gastos -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Proveedor</th>
              <th>Importe</th>
              <th>IVA</th>
              <th>Deducible</th>
              <th>Método Pago</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="expenses-table-body">
            <!-- Los gastos se cargarán aquí -->
          </tbody>
        </table>
      </div>

      <!-- Gráficos -->
      <div class="charts-section">
        <div class="chart-card">
          <h3>Gastos por Categoría</h3>
          <div id="expenses-by-category-chart" class="chart-placeholder">
            <canvas id="category-chart-canvas"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <h3>Evolución Mensual de Gastos</h3>
          <div id="monthly-expenses-chart" class="chart-placeholder">
            <canvas id="monthly-chart-canvas"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <h3>Top 5 Proveedores</h3>
          <div id="top-vendors-chart" class="chart-placeholder">
            <canvas id="vendors-chart-canvas"></canvas>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal para añadir/editar gasto -->
    <div id="expense-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="expense-modal-title">Añadir Gasto</h3>
          <button class="modal-close" id="close-expense-modal" type="button">&times;</button>
        </div>
        <div class="modal-body">
          <form id="expense-form">
            <div class="form-section">
              <h4>Información del Gasto</h4>

              <div class="form-row">
                <div class="form-group">
                  <label for="expense-category">Categoría *</label>
                  <select id="expense-category" required>
                    <option value="">Seleccionar categoría</option>
                    ${Object.entries(EXPENSE_CATEGORIES).map(([key, label]) =>
                      `<option value="${key}">${label}</option>`
                    ).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label for="expense-subcategory">Subcategoría</label>
                  <input type="text" id="expense-subcategory" placeholder="Ej: Suscripción mensual" />
                </div>
              </div>

              <div class="form-group">
                <label for="expense-description">Descripción *</label>
                <textarea
                  id="expense-description"
                  rows="2"
                  required
                  placeholder="Describe el gasto..."
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="expense-vendor">Proveedor</label>
                  <input type="text" id="expense-vendor" placeholder="Nombre del proveedor" />
                </div>

                <div class="form-group">
                  <label for="expense-date">Fecha del Gasto *</label>
                  <input type="date" id="expense-date" required />
                </div>
              </div>
            </div>

            <div class="form-section">
              <h4>Importe y Fiscalidad</h4>

              <div class="form-row">
                <div class="form-group">
                  <label for="expense-amount">Importe (sin IVA) *</label>
                  <input
                    type="number"
                    id="expense-amount"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                  />
                </div>

                <div class="form-group">
                  <label for="expense-vat-percentage">IVA (%)</label>
                  <select id="expense-vat-percentage">
                    <option value="0">0% - Exento</option>
                    <option value="4">4% - Reducido</option>
                    <option value="10">10% - Reducido</option>
                    <option value="21" selected>21% - General</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="expense-vat-amount">Importe IVA</label>
                  <input
                    type="number"
                    id="expense-vat-amount"
                    step="0.01"
                    min="0"
                    readonly
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group checkbox-group">
                  <label>
                    <input type="checkbox" id="expense-is-deductible" checked />
                    Gasto deducible
                  </label>
                </div>

                <div class="form-group">
                  <label for="expense-deductible-percentage">Porcentaje Deducible (%)</label>
                  <input
                    type="number"
                    id="expense-deductible-percentage"
                    min="0"
                    max="100"
                    value="100"
                    placeholder="100"
                  />
                </div>
              </div>
            </div>

            <div class="form-section">
              <h4>Detalles de Pago</h4>

              <div class="form-row">
                <div class="form-group">
                  <label for="expense-payment-method">Método de Pago</label>
                  <select id="expense-payment-method">
                    <option value="">Seleccionar método</option>
                    ${Object.entries(PAYMENT_METHODS).map(([key, label]) =>
                      `<option value="${key}">${label}</option>`
                    ).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label for="expense-receipt-url">URL del Recibo</label>
                  <input type="url" id="expense-receipt-url" placeholder="https://..." />
                </div>
              </div>

              <div class="form-group">
                <label for="expense-notes">Notas</label>
                <textarea
                  id="expense-notes"
                  rows="2"
                  placeholder="Notas adicionales..."
                ></textarea>
              </div>
            </div>

            <div class="form-summary">
              <div class="summary-row">
                <span>Base imponible:</span>
                <span id="form-subtotal">€0.00</span>
              </div>
              <div class="summary-row">
                <span>IVA:</span>
                <span id="form-vat">€0.00</span>
              </div>
              <div class="summary-row total">
                <span>Total:</span>
                <span id="form-total">€0.00</span>
              </div>
              <div class="summary-row deductible">
                <span>Importe deducible:</span>
                <span id="form-deductible">€0.00</span>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" id="cancel-expense-btn" class="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary">
                Guardar Gasto
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

// Inicializar la página de gastos
export function initExpenses() {
  loadExpenses();
  attachExpenseEventListeners();
  updateSummaryCards();
  renderCharts();
}

// Cargar gastos (desde API o datos demo)
function loadExpenses() {
  const expenses = demoExpenses; // TODO: Cargar desde API
  renderExpensesTable(expenses);
  updateFilterCount(expenses.length);
}

// Renderizar tabla de gastos
function renderExpensesTable(expenses) {
  const tbody = document.getElementById('expenses-table-body');
  if (!tbody) return;

  if (expenses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          No se encontraron gastos. Añade tu primer gasto para empezar.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = expenses.map(expense => `
    <tr data-expense-id="${expense.id}">
      <td>${formatDate(expense.expenseDate)}</td>
      <td>
        <span class="category-badge" style="background: var(--color-primary-light);">
          ${EXPENSE_CATEGORIES[expense.category] || expense.category}
        </span>
      </td>
      <td>
        <div class="expense-description">
          <strong>${expense.description}</strong>
          ${expense.subcategory ? `<small>${expense.subcategory}</small>` : ''}
        </div>
      </td>
      <td>${expense.vendor || '-'}</td>
      <td class="amount-cell">€${expense.amount.toFixed(2)}</td>
      <td class="amount-cell">€${expense.vatAmount.toFixed(2)}</td>
      <td>
        ${expense.isDeductible ?
          `<span class="badge badge-success">${expense.deductiblePercentage}%</span>` :
          `<span class="badge badge-error">No</span>`
        }
      </td>
      <td>${PAYMENT_METHODS[expense.paymentMethod] || '-'}</td>
      <td class="actions-cell">
        <button
          class="btn-icon btn-view"
          title="Ver detalles"
          data-action="view"
          data-id="${expense.id}"
        >
          👁️
        </button>
        <button
          class="btn-icon btn-edit"
          title="Editar"
          data-action="edit"
          data-id="${expense.id}"
        >
          ✏️
        </button>
        <button
          class="btn-icon btn-delete"
          title="Eliminar"
          data-action="delete"
          data-id="${expense.id}"
        >
          🗑️
        </button>
      </td>
    </tr>
  `).join('');
}

// Actualizar tarjetas de resumen
function updateSummaryCards() {
  const expenses = demoExpenses;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const deductibleExpenses = expenses.reduce((sum, e) =>
    sum + (e.isDeductible ? e.amount * (e.deductiblePercentage / 100) : 0), 0
  );
  const recoverableVat = expenses.reduce((sum, e) =>
    sum + (e.isDeductible ? e.vatAmount : 0), 0
  );
  const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;

  document.getElementById('total-expenses').textContent = `€${totalExpenses.toFixed(2)}`;
  document.getElementById('deductible-expenses').textContent = `€${deductibleExpenses.toFixed(2)}`;
  document.getElementById('recoverable-vat').textContent = `€${recoverableVat.toFixed(2)}`;
  document.getElementById('average-expense').textContent = `€${averageExpense.toFixed(2)}`;
}

// Renderizar gráficos
function renderCharts() {
  renderCategoryChart();
  renderMonthlyChart();
  renderVendorsChart();
}

function renderCategoryChart() {
  // Placeholder para gráfico de categorías
  const chartDiv = document.getElementById('expenses-by-category-chart');
  if (!chartDiv) return;

  const categoryData = {};
  demoExpenses.forEach(expense => {
    categoryData[expense.category] = (categoryData[expense.category] || 0) + expense.amount;
  });

  const bars = Object.entries(categoryData)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => {
      const percentage = (amount / demoExpenses.reduce((sum, e) => sum + e.amount, 0)) * 100;
      return `
        <div class="chart-bar-item">
          <div class="chart-bar-label">${EXPENSE_CATEGORIES[category]}</div>
          <div class="chart-bar-wrapper">
            <div class="chart-bar" style="width: ${percentage}%"></div>
            <span class="chart-bar-value">€${amount.toFixed(2)}</span>
          </div>
        </div>
      `;
    }).join('');

  chartDiv.innerHTML = `<div class="chart-bars">${bars}</div>`;
}

function renderMonthlyChart() {
  // Placeholder para gráfico mensual
  const chartDiv = document.getElementById('monthly-expenses-chart');
  if (!chartDiv) return;

  chartDiv.innerHTML = '<div class="chart-placeholder-text">Gráfico de evolución mensual</div>';
}

function renderVendorsChart() {
  // Placeholder para gráfico de proveedores
  const chartDiv = document.getElementById('top-vendors-chart');
  if (!chartDiv) return;

  const vendorData = {};
  demoExpenses.forEach(expense => {
    if (expense.vendor) {
      vendorData[expense.vendor] = (vendorData[expense.vendor] || 0) + expense.amount;
    }
  });

  const bars = Object.entries(vendorData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([vendor, amount]) => {
      const maxAmount = Math.max(...Object.values(vendorData));
      const percentage = (amount / maxAmount) * 100;
      return `
        <div class="chart-bar-item">
          <div class="chart-bar-label">${vendor}</div>
          <div class="chart-bar-wrapper">
            <div class="chart-bar" style="width: ${percentage}%"></div>
            <span class="chart-bar-value">€${amount.toFixed(2)}</span>
          </div>
        </div>
      `;
    }).join('');

  chartDiv.innerHTML = `<div class="chart-bars">${bars}</div>`;
}

// Event listeners
function attachExpenseEventListeners() {
  // Botón nuevo gasto
  const newExpenseBtn = document.getElementById('new-expense-btn');
  if (newExpenseBtn) {
    newExpenseBtn.addEventListener('click', openExpenseModal);
  }

  // Cerrar modal
  const closeModalBtn = document.getElementById('close-expense-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeExpenseModal);
  }

  const cancelBtn = document.getElementById('cancel-expense-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeExpenseModal);
  }

  // Formulario
  const form = document.getElementById('expense-form');
  if (form) {
    form.addEventListener('submit', handleExpenseSubmit);
  }

  // Cálculo automático de IVA
  const amountInput = document.getElementById('expense-amount');
  const vatPercentageInput = document.getElementById('expense-vat-percentage');
  if (amountInput && vatPercentageInput) {
    amountInput.addEventListener('input', calculateExpenseTotal);
    vatPercentageInput.addEventListener('change', calculateExpenseTotal);
  }

  // Filtros
  document.getElementById('expense-search')?.addEventListener('input', applyFilters);
  document.getElementById('expense-category-filter')?.addEventListener('change', applyFilters);
  document.getElementById('expense-deductible-filter')?.addEventListener('change', applyFilters);
  document.getElementById('expense-date-from')?.addEventListener('change', applyFilters);
  document.getElementById('expense-date-to')?.addEventListener('change', applyFilters);
  document.getElementById('reset-filters')?.addEventListener('click', resetFilters);

  // Acciones de tabla
  const tbody = document.getElementById('expenses-table-body');
  if (tbody) {
    tbody.addEventListener('click', handleTableAction);
  }

  // Checkbox deducible
  const deductibleCheckbox = document.getElementById('expense-is-deductible');
  const deductiblePercentage = document.getElementById('expense-deductible-percentage');
  if (deductibleCheckbox && deductiblePercentage) {
    deductibleCheckbox.addEventListener('change', () => {
      deductiblePercentage.disabled = !deductibleCheckbox.checked;
      calculateExpenseTotal();
    });
  }
}

// Abrir modal
function openExpenseModal(expense = null) {
  const modal = document.getElementById('expense-modal');
  const title = document.getElementById('expense-modal-title');
  const form = document.getElementById('expense-form');

  if (!modal || !form) return;

  if (expense) {
    title.textContent = 'Editar Gasto';
    // Rellenar formulario con datos del gasto
    // TODO: Implementar edición
  } else {
    title.textContent = 'Añadir Gasto';
    form.reset();
    // Establecer fecha actual por defecto
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
  }

  modal.style.display = 'flex';
  calculateExpenseTotal();
}

// Cerrar modal
function closeExpenseModal() {
  const modal = document.getElementById('expense-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Calcular total del gasto
function calculateExpenseTotal() {
  const amount = parseFloat(document.getElementById('expense-amount')?.value || 0);
  const vatPercentage = parseFloat(document.getElementById('expense-vat-percentage')?.value || 0);
  const isDeductible = document.getElementById('expense-is-deductible')?.checked;
  const deductiblePercentage = parseFloat(document.getElementById('expense-deductible-percentage')?.value || 100);

  const vatAmount = amount * (vatPercentage / 100);
  const total = amount + vatAmount;
  const deductibleAmount = isDeductible ? amount * (deductiblePercentage / 100) : 0;

  document.getElementById('expense-vat-amount').value = vatAmount.toFixed(2);
  document.getElementById('form-subtotal').textContent = `€${amount.toFixed(2)}`;
  document.getElementById('form-vat').textContent = `€${vatAmount.toFixed(2)}`;
  document.getElementById('form-total').textContent = `€${total.toFixed(2)}`;
  document.getElementById('form-deductible').textContent = `€${deductibleAmount.toFixed(2)}`;
}

// Manejar envío del formulario
function handleExpenseSubmit(e) {
  e.preventDefault();

  const expenseData = {
    category: document.getElementById('expense-category').value,
    subcategory: document.getElementById('expense-subcategory').value,
    description: document.getElementById('expense-description').value,
    vendor: document.getElementById('expense-vendor').value,
    expenseDate: document.getElementById('expense-date').value,
    amount: parseFloat(document.getElementById('expense-amount').value),
    vatPercentage: parseFloat(document.getElementById('expense-vat-percentage').value),
    vatAmount: parseFloat(document.getElementById('expense-vat-amount').value),
    isDeductible: document.getElementById('expense-is-deductible').checked,
    deductiblePercentage: parseFloat(document.getElementById('expense-deductible-percentage').value),
    paymentMethod: document.getElementById('expense-payment-method').value,
    receiptUrl: document.getElementById('expense-receipt-url').value,
    notes: document.getElementById('expense-notes').value
  };

  console.log('Nuevo gasto:', expenseData);
  // TODO: Enviar a la API

  alert('Gasto añadido correctamente (Demo)');
  closeExpenseModal();
}

// Aplicar filtros
function applyFilters() {
  const search = document.getElementById('expense-search')?.value.toLowerCase() || '';
  const category = document.getElementById('expense-category-filter')?.value || '';
  const deductible = document.getElementById('expense-deductible-filter')?.value || '';
  const dateFrom = document.getElementById('expense-date-from')?.value || '';
  const dateTo = document.getElementById('expense-date-to')?.value || '';

  let filtered = demoExpenses.filter(expense => {
    const matchesSearch = !search ||
      expense.description.toLowerCase().includes(search) ||
      expense.vendor?.toLowerCase().includes(search);

    const matchesCategory = !category || expense.category === category;

    const matchesDeductible = !deductible ||
      expense.isDeductible.toString() === deductible;

    const matchesDateFrom = !dateFrom || expense.expenseDate >= dateFrom;
    const matchesDateTo = !dateTo || expense.expenseDate <= dateTo;

    return matchesSearch && matchesCategory && matchesDeductible &&
           matchesDateFrom && matchesDateTo;
  });

  renderExpensesTable(filtered);
  updateFilterCount(filtered.length);
}

// Resetear filtros
function resetFilters() {
  document.getElementById('expense-search').value = '';
  document.getElementById('expense-category-filter').value = '';
  document.getElementById('expense-deductible-filter').value = '';
  document.getElementById('expense-date-from').value = '';
  document.getElementById('expense-date-to').value = '';
  applyFilters();
}

// Actualizar contador de resultados
function updateFilterCount(count) {
  const countElement = document.getElementById('filter-result-count');
  if (countElement) {
    countElement.textContent = `${count} gasto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
  }
}

// Manejar acciones de tabla
function handleTableAction(e) {
  const button = e.target.closest('[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const expenseId = button.dataset.id;
  const expense = demoExpenses.find(e => e.id === expenseId);

  switch (action) {
    case 'view':
      alert(`Ver detalles del gasto ${expenseId}`);
      break;
    case 'edit':
      openExpenseModal(expense);
      break;
    case 'delete':
      if (confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
        console.log('Eliminar gasto:', expenseId);
        // TODO: Implementar eliminación
      }
      break;
  }
}

// Formatear fecha
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default renderExpenses;
