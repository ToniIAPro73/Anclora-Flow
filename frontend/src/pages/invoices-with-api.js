// Módulo de Facturas con integración completa API y Verifactu
// Importar servicio API (asegúrate de que esté cargado)

// Estado global del módulo
let invoicesData = [];
let isLoading = false;
let selectedInvoiceId = null;  // Estado para rastrear factura seleccionada
let currentFilters = {
  search: '',
  status: 'all',
  client: 'all'
};

// --- ESTADO DE PAGINACIÓN Y COLUMNAS (Fase 4) ---
let currentPage = 1;
const PAGE_SIZE = 10;
let visibleColumns = {
  number: true,
  client: true,
  issueDate: false,
  dueDate: false,
  total: true,
  status: true,
  verifactu: false,
  days: false
};

// Estado temporal para formularios de edición/creación
let invoiceEditState = null;
const invoiceItemEditors = {
  edit: null,
  create: null
};

// Formatters
// Custom formatter that FORCES thousands separator with dot
function formatCurrency(value) {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return '0,00 €';
  
  // Force 2 decimals
  const fixed = parsed.toFixed(2);
  
  // Split integer and decimal parts
  const [integer, decimal] = fixed.split('.');
  
  // Add thousands separator (dot) manually
  const withSeparator = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Return with comma as decimal separator
  return `${withSeparator},${decimal} €`;
}

// Mapeo de estados de factura
const statusMap = {
  paid: { label: "Cobrada", tone: "paid" },
  sent: { label: "Enviada", tone: "sent" },
  pending: { label: "Pendiente", tone: "pending" },
  overdue: { label: "Vencida", tone: "overdue" },
  draft: { label: "Borrador", tone: "draft" }
};

// Mapeo de estados de Verifactu
const verifactuStatusMap = {
  registered: { label: "Registrada", tone: "success", icon: "✅" },
  pending: { label: "Pendiente", tone: "warning", icon: "⏳" },
  error: { label: "Error", tone: "error", icon: "❌" },
  not_registered: { label: "No registrada", tone: "neutral", icon: "⚪" }
};

// === UTILIDADES ===

function formatDateForInput(dateValue) {
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toISOString().split('T')[0];
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function calculateLineTotals(item = {}) {
  const quantity = sanitizeNumber(item.quantity, 0);
  const unitPrice = sanitizeNumber(item.unitPrice, 0);
  const vatPercentage = sanitizeNumber(item.vatPercentage, 0);
  const base = quantity * unitPrice;
  const vatAmount = base * (vatPercentage / 100);
  const total = base + vatAmount;
  return {
    base: Number(base.toFixed(2)),
    vatAmount: Number(vatAmount.toFixed(2)),
    total: Number(total.toFixed(2))
  };
}

function normalizeInvoiceItem(item = {}) {
  const normalized = {
    id: item.id || null,
    description: item.description || '',
    quantity: sanitizeNumber(item.quantity ?? item.qty, 1) || 1,
    unitType: item.unit_type || item.unitType || 'unidad',
    unitPrice: sanitizeNumber(item.unit_price ?? item.unitPrice, 0),
    vatPercentage: sanitizeNumber(item.vat_percentage ?? item.vatPercentage, 21),
    amount: 0
  };
  const totals = calculateLineTotals(normalized);
  normalized.amount = totals.total;
  return normalized;
}

function calculateInvoiceTotals(items = [], irpfPercentage = 0) {
  const subtotal = items.reduce((sum, item) => {
    return sum + sanitizeNumber(item.quantity, 0) * sanitizeNumber(item.unitPrice, 0);
  }, 0);

  const vatAmount = items.reduce((sum, item) => {
    const base = sanitizeNumber(item.quantity, 0) * sanitizeNumber(item.unitPrice, 0);
    return sum + base * (sanitizeNumber(item.vatPercentage, 0) / 100);
  }, 0);

  const roundedSubtotal = Number(subtotal.toFixed(2));
  const roundedVat = Number(vatAmount.toFixed(2));
  const irpfPct = sanitizeNumber(irpfPercentage, 0);
  const irpfAmount = Number((roundedSubtotal * (irpfPct / 100)).toFixed(2));
  const total = Number((roundedSubtotal + roundedVat - irpfAmount).toFixed(2));
  const vatPct = roundedSubtotal > 0 ? Number(((roundedVat / roundedSubtotal) * 100).toFixed(2)) : 0;

  return {
    subtotal: roundedSubtotal,
    vatAmount: roundedVat,
    vatPercentage: vatPct,
    irpfPercentage: irpfPct,
    irpfAmount,
    total
  };
}


function resolveVerifactuVerificationUrl(invoice = {}) {
  if (invoice.verifactuUrl) return invoice.verifactuUrl;
  if (invoice.verifactuHash) {
    return `https://sede.agenciatributaria.gob.es/verifactu?id=${invoice.verifactuHash}`;
  }
  if (invoice.verifactuCsv) {
    return `https://sede.agenciatributaria.gob.es/verifactu?csv=${invoice.verifactuCsv}`;
  }
  return '';
}

function isPlaceholderVerifactuQr(dataUrl) {
  if (!dataUrl) return false;
  if (dataUrl.startsWith('data:image/svg+xml;base64,')) {
    try {
      const decoded = atob(dataUrl.split(',')[1]);
      return decoded.includes('QR:');
    } catch (error) {
      return false;
    }
  }
  if (dataUrl.startsWith('<svg')) {
    return dataUrl.includes('QR:');
  }
  return false;
}

function buildQrFallbackSource(url) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(url)}`;
}

function renderVerifactuQrImage(invoice, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '<p style="font-size: 0.9rem; color: var(--text-secondary);">Generando codigo QR...</p>';

  const qrSource = invoice.verifactuQrCode;
  if (qrSource && !isPlaceholderVerifactuQr(qrSource)) {
    const img = document.createElement('img');
    img.alt = 'QR Verifactu';
    img.style.width = '150px';
    img.style.height = '150px';
    img.style.display = 'block';
    img.style.borderRadius = '8px';
    img.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
    img.onload = () => {
      container.innerHTML = '';
      container.appendChild(img);
    };
    img.onerror = () => {
      console.warn('Fallback QR para factura Verifactu');
      renderQrFallback(invoice, container);
    };
    img.src = qrSource;
    return;
  }

  renderQrFallback(invoice, container);
}

function renderQrFallback(invoice, container) {
  const verificationUrl = resolveVerifactuVerificationUrl(invoice);
  if (!verificationUrl) {
    container.innerHTML = '<p style="color: #c53030; font-size: 0.9rem;">No se pudo generar el codigo QR.</p>';
    return;
  }

  const img = document.createElement('img');
  img.alt = 'QR Verifactu generado';
  img.style.width = '150px';
  img.style.height = '150px';
  img.style.display = 'block';
  img.style.borderRadius = '8px';
  img.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
  img.onload = () => {
    container.innerHTML = '';
    container.appendChild(img);
  };
  img.onerror = () => {
    container.innerHTML = '<p style="color: #c53030; font-size: 0.9rem;">Error al generar el codigo QR.</p>';
  };
  img.src = buildQrFallbackSource(verificationUrl);
}

function resolveQrDownloadSource(invoice) {
  if (!invoice) return '';
  if (invoice.verifactuQrCode && !isPlaceholderVerifactuQr(invoice.verifactuQrCode)) {
    return invoice.verifactuQrCode;
  }
  const verificationUrl = resolveVerifactuVerificationUrl(invoice);
  return verificationUrl ? buildQrFallbackSource(verificationUrl) : '';
}

// Sistema de editor con pestañas para líneas de factura
function setupItemsEditorWithTabs({
  editorKey,
  containerId,
  tabsContainerId,
  totalsId,
  addButtonId,
  prevButtonId,
  nextButtonId,
  initialItems = [],
  editable = true,
  allowIrpfEdit = true,
  defaultUnitType = 'unidad',
  irpfPercentage = 0
}) {
  const items = initialItems && initialItems.length > 0
    ? initialItems.map(normalizeInvoiceItem)
    : [normalizeInvoiceItem({ unitType: defaultUnitType })];

  invoiceItemEditors[editorKey] = {
    key: editorKey,
    containerId,
    tabsContainerId,
    totalsId,
    addButtonId,
    prevButtonId,
    nextButtonId,
    items,
    currentTabIndex: 0,
    editable,
    baseAllowIrpfEdit: allowIrpfEdit,
    allowIrpfEdit: editable ? allowIrpfEdit : false,
    defaultUnitType,
    irpfPercentage: sanitizeNumber(irpfPercentage, 0),
    eventsAttached: false,
    latestTotals: calculateInvoiceTotals(items, irpfPercentage)
  };

  renderItemsEditorWithTabs(editorKey);
  attachItemsEditorTabsEvents(editorKey);
  updateEditorControlsState(invoiceItemEditors[editorKey]);
}

function renderItemsEditorWithTabs(editorKey) {
  const state = invoiceItemEditors[editorKey];
  if (!state) return;

  // Renderizar pesta¤as
  const tabsContainer = document.getElementById(state.tabsContainerId);
  if (tabsContainer) {
    tabsContainer.innerHTML = state.items.map((item, index) => `
      <button type="button"
              class="modal-tabs__tab ${index === state.currentTabIndex ? 'is-active' : ''}"
              data-tab-index="${index}">
        Línea ${index + 1}
      </button>
    `).join('');
  }

  // Renderizar l¡nea actual
  const container = document.getElementById(state.containerId);
  if (container) {
    const currentItem = state.items[state.currentTabIndex];
    if (!currentItem) {
      container.innerHTML = '<p class="modal-tabs__empty">No hay l¡neas de factura. A¤ade una l¡nea para empezar.</p>';
    } else {
      container.innerHTML = getSingleItemFormMarkup(currentItem, state.currentTabIndex, state.editable, state.items.length > 1);
    }
  }

  // Actualizar botones de navegaci¢n
  updateTabNavigation(editorKey);

  updateTotalsDisplay(editorKey);
}

function getSingleItemFormMarkup(item, index, editable, showDelete) {
  return `
    <div class="modal-tab__grid invoice-item-form" data-index="${index}">
      <label class="form-field modal-tab__field modal-tab__concept">
        <span>Concepto *</span>
        <input
          type="text"
          class="form-input"
          data-field="description"
          value="${escapeHtml(item.description)}"
          ${editable ? '' : 'disabled'}
          placeholder="Servicio o producto"
        />
      </label>
      <label class="form-field modal-tab__field modal-tab__field--sm">
        <span>Unidad</span>
        <input
          type="text"
          class="form-input"
          data-field="unitType"
          value="${escapeHtml(item.unitType)}"
          ${editable ? '' : 'disabled'}
          placeholder="unidad"
        />
      </label>
      <label class="form-field modal-tab__field modal-tab__field--xs">
        <span>Cant.</span>
        <input
          type="number"
          class="form-input"
          data-field="quantity"
          value="${sanitizeNumber(item.quantity, 1)}"
          step="0.01"
          min="0"
          ${editable ? '' : 'disabled'}
        />
      </label>
      <label class="form-field modal-tab__field">
        <span>Precio</span>
        <input
          type="number"
          class="form-input"
          data-field="unitPrice"
          value="${sanitizeNumber(item.unitPrice, 0)}"
          step="0.01"
          min="0"
          ${editable ? '' : 'disabled'}
        />
      </label>
      <label class="form-field modal-tab__field modal-tab__field--xs">
        <span>IVA</span>
        <input
          type="number"
          class="form-input"
          data-field="vatPercentage"
          value="${sanitizeNumber(item.vatPercentage, 21)}"
          step="0.1"
          min="0"
          max="100"
          ${editable ? '' : 'disabled'}
        />
      </label>
      <div class="form-field modal-tab__summary">
        <span>Importe</span>
        <div class="modal-tab__line-total" data-field="line-total">
          ${formatCurrency(item.amount)}
        </div>
      </div>
      <div class="modal-tab__footer">
        <span class="detail-list__meta">Subtotal: ${formatCurrency(calculateLineSubtotal(item))}</span>
        <span class="detail-list__meta">IVA: ${formatCurrency(calculateLineVat(item))}</span>
        <span class="detail-list__meta"><strong>Total: ${formatCurrency(calculateLineTotal(item))}</strong></span>
      </div>
      ${editable && showDelete ? `
        <div class="modal-tab__footer">
          <button type="button" class="btn-ghost" data-action="delete-item" aria-label="Eliminar línea">Eliminar línea</button>
        </div>
      ` : ''}
    </div>
  `;
}

function calculateLineSubtotal(item) {
  const qty = sanitizeNumber(item.quantity, 1);
  const price = sanitizeNumber(item.unitPrice, 0);
  return qty * price;
}

function calculateLineVat(item) {
  const subtotal = calculateLineSubtotal(item);
  const vatPct = sanitizeNumber(item.vatPercentage, 21);
  return subtotal * (vatPct / 100);
}

function calculateLineTotal(item) {
  return calculateLineSubtotal(item) + calculateLineVat(item);
}

function updateTabNavigation(editorKey) {
  const state = invoiceItemEditors[editorKey];
  if (!state) return;

  const prevBtn = document.getElementById(state.prevButtonId);
  const nextBtn = document.getElementById(state.nextButtonId);

  if (prevBtn) {
    prevBtn.disabled = state.currentTabIndex === 0;
    prevBtn.style.opacity = state.currentTabIndex === 0 ? '0.5' : '1';
    prevBtn.style.cursor = state.currentTabIndex === 0 ? 'not-allowed' : 'pointer';
  }

  if (nextBtn) {
    nextBtn.disabled = state.currentTabIndex >= state.items.length - 1;
    nextBtn.style.opacity = state.currentTabIndex >= state.items.length - 1 ? '0.5' : '1';
    nextBtn.style.cursor = state.currentTabIndex >= state.items.length - 1 ? 'not-allowed' : 'pointer';
  }
}

function attachItemsEditorTabsEvents(editorKey) {
  const state = invoiceItemEditors[editorKey];
  if (!state || state.eventsAttached) return;

  // Eventos del contenedor principal
  const container = document.getElementById(state.containerId);
  if (container) {
    container.dataset.editorKey = editorKey;
    container.addEventListener('input', handleItemEditorTabInput);
    container.addEventListener('change', handleItemEditorTabInput);
    container.addEventListener('click', handleItemEditorTabClick);
  }

  // Eventos de pestañas
  const tabsContainer = document.getElementById(state.tabsContainerId);
  if (tabsContainer) {
    tabsContainer.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab-index]');
      if (tab) {
        const tabIndex = parseInt(tab.dataset.tabIndex, 10);
        if (!isNaN(tabIndex)) {
          switchToTab(editorKey, tabIndex);
        }
      }
    });
  }

  // Botón añadir línea
  if (state.addButtonId) {
    const addBtn = document.getElementById(state.addButtonId);
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        addNewItemTab(editorKey);
      });
    }
  }

  // Botones de navegación
  if (state.prevButtonId) {
    const prevBtn = document.getElementById(state.prevButtonId);
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (state.currentTabIndex > 0) {
          switchToTab(editorKey, state.currentTabIndex - 1);
        }
      });
    }
  }

  if (state.nextButtonId) {
    const nextBtn = document.getElementById(state.nextButtonId);
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (state.currentTabIndex < state.items.length - 1) {
          switchToTab(editorKey, state.currentTabIndex + 1);
        }
      });
    }
  }

  // Eventos de totales
  const totalsEl = document.getElementById(state.totalsId);
  if (totalsEl) {
    totalsEl.dataset.editorKey = editorKey;
    totalsEl.addEventListener('input', handleTotalsInput);
  }

  state.eventsAttached = true;
}

function switchToTab(editorKey, tabIndex) {
  const state = invoiceItemEditors[editorKey];
  if (!state || tabIndex < 0 || tabIndex >= state.items.length) return;

  state.currentTabIndex = tabIndex;
  renderItemsEditorWithTabs(editorKey);
}

function addNewItemTab(editorKey) {
  const state = invoiceItemEditors[editorKey];
  if (!state) return;

  const newItem = normalizeInvoiceItem({ unitType: state.defaultUnitType });
  state.items.push(newItem);
  state.currentTabIndex = state.items.length - 1;

  state.latestTotals = calculateInvoiceTotals(state.items, state.irpfPercentage);
  renderItemsEditorWithTabs(editorKey);
}

function handleItemEditorTabInput(e) {
  const field = e.target.dataset.field;
  if (!field) return;

  const container = e.target.closest('[data-editor-key]');
  if (!container) return;

  const editorKey = container.dataset.editorKey;
  const state = invoiceItemEditors[editorKey];
  if (!state) return;

  const index = state.currentTabIndex;
  const item = state.items[index];
  if (!item) return;

  if (field === 'description') {
    item.description = e.target.value;
  } else if (field === 'unitType') {
    item.unitType = e.target.value;
  } else if (field === 'quantity') {
    item.quantity = sanitizeNumber(e.target.value, 1);
  } else if (field === 'unitPrice') {
    item.unitPrice = sanitizeNumber(e.target.value, 0);
  } else if (field === 'vatPercentage') {
    item.vatPercentage = sanitizeNumber(e.target.value, 21);
  }

  state.items[index] = item;
  state.latestTotals = calculateInvoiceTotals(state.items, state.irpfPercentage);

  // Solo actualizar los totales sin re-renderizar todo el formulario
  // Re-renderizar causa que el input pierda el foco
  updateTotalsDisplay(editorKey);
  
  // Actualizar los totales de la línea actual directamente en el DOM
  const lineContainer = e.target.closest('.invoice-item-form');
  if (lineContainer && lineContainer.nextElementSibling) {
    const lineTotals = calculateLineTotals(item);
    const totalsDiv = lineContainer.nextElementSibling;
    const subtotalEl = totalsDiv.querySelector('div:nth-child(1) strong');
    const vatEl = totalsDiv.querySelector('div:nth-child(2) strong');
    const totalEl = totalsDiv.querySelector('div:nth-child(3) strong');
    
    if (subtotalEl) subtotalEl.textContent = formatCurrency(lineTotals.base);
    if (vatEl) vatEl.textContent = formatCurrency(lineTotals.vatAmount);
    if (totalEl) totalEl.textContent = formatCurrency(lineTotals.total);
  }
}

function handleItemEditorTabClick(e) {
  const deleteBtn = e.target.closest('[data-action="delete-item"]');
  if (!deleteBtn) return;

  const container = e.target.closest('[data-editor-key]');
  if (!container) return;

  const editorKey = container.dataset.editorKey;
  const state = invoiceItemEditors[editorKey];
  if (!state || state.items.length <= 1) return;

  const currentIndex = state.currentTabIndex;
  state.items.splice(currentIndex, 1);

  // Ajustar índice actual
  if (state.currentTabIndex >= state.items.length) {
    state.currentTabIndex = state.items.length - 1;
  }

  state.latestTotals = calculateInvoiceTotals(state.items, state.irpfPercentage);
  renderItemsEditorWithTabs(editorKey);
}

function setupItemsEditor({
  editorKey,
  containerId,
  totalsId,
  addButtonId,
  initialItems = [],
  editable = true,
  allowIrpfEdit = true,
  defaultUnitType = 'unidad',
  irpfPercentage = 0
}) {
  const items = initialItems && initialItems.length > 0
    ? initialItems.map(normalizeInvoiceItem)
    : [normalizeInvoiceItem({ unitType: defaultUnitType })];

  invoiceItemEditors[editorKey] = {
    key: editorKey,
    containerId,
    totalsId,
    addButtonId,
    items,
    editable,
    baseAllowIrpfEdit: allowIrpfEdit,
    allowIrpfEdit: editable ? allowIrpfEdit : false,
    defaultUnitType,
    irpfPercentage: sanitizeNumber(irpfPercentage, 0),
    eventsAttached: false,
    latestTotals: calculateInvoiceTotals(items, irpfPercentage)
  };

  renderItemsEditor(editorKey);
  attachItemsEditorEvents(editorKey);
  updateEditorControlsState(invoiceItemEditors[editorKey]);
}

function attachItemsEditorEvents(editorKey) {
  const state = invoiceItemEditors[editorKey];
  if (!state || state.eventsAttached) return;

  const container = document.getElementById(state.containerId);
  if (container) {
    container.dataset.editorKey = editorKey;
    container.addEventListener('input', handleItemEditorInput);
    container.addEventListener('change', handleItemEditorInput);
    container.addEventListener('click', handleItemEditorClick);
  }

  const totalsEl = document.getElementById(state.totalsId);
  if (totalsEl) {
    totalsEl.dataset.editorKey = editorKey;
    totalsEl.addEventListener('input', handleTotalsInput);
  }

  if (state.addButtonId) {
    const addBtn = document.getElementById(state.addButtonId);
    if (addBtn) {
      addBtn.dataset.editorKey = editorKey;
      addBtn.addEventListener('click', handleAddItem);
    }
  }

  state.eventsAttached = true;
}

function renderItemsEditor(editorKey) {
  const state = invoiceItemEditors[editorKey];
  if (!state) return;

  const container = document.getElementById(state.containerId);
  if (container) {
    if (!state.items || state.items.length === 0) {
      container.innerHTML = state.editable
        ? '<p style="font-size: 0.9rem; color: var(--text-secondary);">Anade lineas para esta factura.</p>'
        : '<p style="font-size: 0.9rem; color: var(--text-secondary);">Sin lineas disponibles.</p>';
    } else {
      container.innerHTML = state.items
        .map((item, index) => getItemRowMarkup(item, index, state.editable))
        .join('');
    }
  }

  updateTotalsDisplay(editorKey);
}

function getItemRowMarkup(item, index, editable) {
  return `
    <div class="invoice-item-row" data-index="${index}" style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 0.75rem; margin-bottom: 1rem; align-items: end;">
      <div style="grid-column: span 2;">
        <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-secondary);">Concepto</label>
        <input
          type="text"
          class="form-input"
          data-field="description"
          value="${escapeHtml(item.description)}"
          ${editable ? '' : 'disabled'}
          placeholder="Servicio o producto"
        />
      </div>
      <div>
        <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-secondary);">Unidad</label>
        <input
          type="text"
          class="form-input"
          data-field="unitType"
          value="${escapeHtml(item.unitType)}"
          ${editable ? '' : 'disabled'}
          placeholder="unidad"
        />
      </div>
      <div>
        <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-secondary);">Cantidad</label>
        <input
          type="number"
          class="form-input"
          data-field="quantity"
          value="${sanitizeNumber(item.quantity, 1)}"
          step="0.01"
          min="0"
          ${editable ? '' : 'disabled'}
        />
      </div>
      <div>
        <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-secondary);">Precio unitario</label>
        <input
          type="number"
          class="form-input"
          data-field="unitPrice"
          value="${sanitizeNumber(item.unitPrice, 0)}"
          step="0.01"
          min="0"
          ${editable ? '' : 'disabled'}
        />
      </div>
      <div>
        <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-secondary);">IVA (%)</label>
        <input
          type="number"
          class="form-input"
          data-field="vatPercentage"
          value="${sanitizeNumber(item.vatPercentage, 21)}"
          step="0.1"
          min="0"
          max="100"
          ${editable ? '' : 'disabled'}
        />
      </div>
      <div>
        <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-secondary);">Importe</label>
        <div
          data-field="line-total"
          style="padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); font-weight: 600; color: var(--text-primary);"
        >
          ${formatCurrency(item.amount)}
        </div>
      </div>
      ${editable ? `
        <div style="grid-column: span 6; display: flex; justify-content: flex-end;">
          <button type="button" class="btn-ghost" data-action="remove-item" aria-label="Eliminar línea">Eliminar línea</button>
        </div>
      ` : ''}
    </div>
  `;
}

function updateTotalsDisplay(editorKey) {
  const state = invoiceItemEditors[editorKey];
  if (!state) return;

  const totals = calculateInvoiceTotals(state.items, state.irpfPercentage);
  state.latestTotals = totals;

  const totalsEl = document.getElementById(state.totalsId);
  if (!totalsEl) return;

  const irpfFieldId = `${editorKey}-irpf-percentage`;

  totalsEl.innerHTML = `
    <div class="modal-totals">
      <div class="modal-totals__row">
        <span>Subtotal</span>
        <span class="modal-totals__value">${formatCurrency(totals.subtotal)}</span>
      </div>
      <div class="modal-totals__row">
        <span>IVA estimado (${totals.vatPercentage.toFixed(2)}%)</span>
        <span class="modal-totals__value">${formatCurrency(totals.vatAmount)}</span>
      </div>
      ${state.allowIrpfEdit
        ? `
          <div class="modal-totals__row modal-totals__control">
            <label for="${irpfFieldId}" style="font-weight: 600; color: var(--text-secondary);">IRPF (%)</label>
            <div class="modal-totals__input">
              <input
                id="${irpfFieldId}"
                type="number"
                class="form-input"
                min="0"
                max="100"
                step="0.1"
                value="${state.irpfPercentage}"
                data-totals-field="irpfPercentage"
              />
              <span class="modal-totals__value">${formatCurrency(totals.irpfAmount)}</span>
            </div>
          </div>
        `
        : `
          <div class="modal-totals__row">
            <span>IRPF (${state.irpfPercentage}%)</span>
            <span class="modal-totals__value">${formatCurrency(totals.irpfAmount)}</span>
          </div>
        `}
      <div class="modal-totals__row modal-totals__row--emphasis">
        <span>Total</span>
        <span class="modal-totals__value">${formatCurrency(totals.total)}</span>
      </div>
    </div>
  `;
}

function updateEditorControlsState(state) {
  if (!state) return;

  const addBtn = state.addButtonId ? document.getElementById(state.addButtonId) : null;
  if (addBtn) {
    addBtn.disabled = !state.editable;
    addBtn.style.display = state.editable ? 'inline-flex' : 'none';
  }

  const container = document.getElementById(state.containerId);
  if (container) {
    container.classList.toggle('is-locked', !state.editable);
  }
}

function handleItemEditorInput(event) {
  const target = event.target;
  const field = target.dataset.field;
  if (!field) return;

  const parent = target.closest('[data-editor-key]');
  if (!parent) return;

  const editorKey = parent.dataset.editorKey;
  const state = invoiceItemEditors[editorKey];
  if (!state || !state.editable) return;

  const row = target.closest('.invoice-item-row');
  if (!row) return;

  const index = Number.parseInt(row.dataset.index, 10);
  if (Number.isNaN(index) || !state.items[index]) return;

  if (field === 'description') {
    state.items[index].description = target.value;
  } else if (field === 'unitType') {
    state.items[index].unitType = target.value;
  } else {
    const fallback = field === 'quantity' ? 1 : 0;
    const numericValue = sanitizeNumber(target.value, fallback);
    state.items[index][field] = numericValue;
    target.value = numericValue;
  }

  const totals = calculateLineTotals(state.items[index]);
  state.items[index].amount = totals.total;

  const lineTotalEl = row.querySelector('[data-field="line-total"]');
  if (lineTotalEl) {
    lineTotalEl.textContent = formatCurrency(state.items[index].amount);
  }

  updateTotalsDisplay(editorKey);
}

function handleItemEditorClick(event) {
  const action = event.target.dataset.action;
  if (action !== 'remove-item') return;

  const parent = event.target.closest('[data-editor-key]');
  if (!parent) return;

  const editorKey = parent.dataset.editorKey;
  const state = invoiceItemEditors[editorKey];
  if (!state || !state.editable) return;

  const row = event.target.closest('.invoice-item-row');
  if (!row) return;

  const index = Number.parseInt(row.dataset.index, 10);
  if (Number.isNaN(index)) return;

  state.items.splice(index, 1);
  renderItemsEditor(editorKey);
  updateEditorControlsState(state);
}

function handleTotalsInput(event) {
  const target = event.target;
  const field = target.dataset.totalsField;
  if (!field) return;

  const parent = target.closest('[data-editor-key]');
  if (!parent) return;

  const editorKey = parent.dataset.editorKey;
  const state = invoiceItemEditors[editorKey];
  if (!state) return;

  if (field === 'irpfPercentage') {
    const sanitized = Math.max(0, Math.min(100, sanitizeNumber(target.value, 0)));
    state.irpfPercentage = sanitized;
    target.value = sanitized;
    updateTotalsDisplay(editorKey);
  }
}

function handleAddItem(event) {
  const editorKey = event.currentTarget.dataset.editorKey;
  const state = invoiceItemEditors[editorKey];
  if (!state || !state.editable) return;

  state.items.push(normalizeInvoiceItem({ unitType: state.defaultUnitType }));
  renderItemsEditor(editorKey);
  updateEditorControlsState(state);
}

function setItemsEditorEditable(editorKey, editable) {
  const state = invoiceItemEditors[editorKey];
  if (!state) return;

  state.editable = editable;
  state.allowIrpfEdit = editable ? state.baseAllowIrpfEdit : false;

  if (editable && (!state.items || state.items.length === 0)) {
    state.items = [normalizeInvoiceItem({ unitType: state.defaultUnitType })];
  }

  renderItemsEditor(editorKey);
  updateEditorControlsState(state);
}

function destroyItemsEditor(editorKey) {
  const state = invoiceItemEditors[editorKey];
  if (!state) return;

  const container = document.getElementById(state.containerId);
  if (container) {
    container.removeEventListener('input', handleItemEditorInput);
    container.removeEventListener('change', handleItemEditorInput);
    container.removeEventListener('click', handleItemEditorClick);
    container.innerHTML = '';
  }

  const totalsEl = document.getElementById(state.totalsId);
  if (totalsEl) {
    totalsEl.removeEventListener('input', handleTotalsInput);
    totalsEl.innerHTML = '';
  }

  if (state.addButtonId) {
    const addBtn = document.getElementById(state.addButtonId);
    if (addBtn) {
      addBtn.removeEventListener('click', handleAddItem);
    }
  }

  invoiceItemEditors[editorKey] = null;
}

function getItemsEditorState(editorKey) {
  return invoiceItemEditors[editorKey] || null;
}

function configurePaymentDateField({ statusSelectId, containerId, inputId, initialStatus, initialPaymentDate }) {
  const statusSelect = document.getElementById(statusSelectId);
  const container = document.getElementById(containerId);
  const input = document.getElementById(inputId);

  const toggle = (status) => {
    if (!container) return;
    if (status === 'paid') {
      container.hidden = false;
      if (input && !input.value) {
        const value = initialPaymentDate || new Date();
        input.value = formatDateForInput(value);
      }
    } else {
      container.hidden = true;
      if (input) {
        input.value = '';
      }
    }
  };

  toggle(initialStatus);

  if (statusSelect) {
    statusSelect.addEventListener('change', (event) => {
      toggle(event.target.value);
    });
  }
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function calculateDaysLate(dueDate, status) {
  if (status === 'paid' || status === 'draft') return '';

  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today - due;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `${diffDays} días tarde`;
  }
  return '';
}

// Mostrar notificación
function showNotification(message, type = 'info') {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" class="notification__close">×</button>
  `;

  // Añadir estilos si no existen
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 1rem;
        min-width: 300px;
        animation: slideIn 0.3s ease-out;
      }
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .notification--success { background: #c6f6d5; color: #2f855a; border-left: 4px solid #48bb78; }
      .notification--error { background: #fed7d7; color: #c53030; border-left: 4px solid #f56565; }
      .notification--info { background: #bee3f8; color: #2c5282; border-left: 4px solid #4299e1; }
      .notification--warning { background: #feebc8; color: #c05621; border-left: 4px solid #ed8936; }
      .notification__close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        opacity: 0.7;
      }
      .notification__close:hover { opacity: 1; }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Auto-remover después de 5 segundos
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// === FUNCIONES DE API ===

function ensureInvoiceSelection() {
  if (invoicesData.length > 0) {
    const isValidSelection = invoicesData.some(
      (invoice) => String(invoice.id) === String(selectedInvoiceId)
    );
    if (!isValidSelection) {
      selectedInvoiceId = String(invoicesData[0].id);
    }
  } else {
    selectedInvoiceId = null;
  }
}

async function loadInvoices() {
  isLoading = true;
  renderLoadingState();

  try {
    // Verificar que api esté disponible
    if (typeof window.api === 'undefined') {
      throw new Error('Servicio API no disponible. Asegúrate de que api.js esté cargado.');
    }

    if (!window.api.isAuthenticated()) {
      renderErrorState('Inicia sesión para consultar tus facturas.');
      isLoading = false;
      return;
    }

    const response = await window.api.getInvoices();
    invoicesData = response.invoices || response || [];

    // Mapear datos de API a formato del componente
    // Backend devuelve camelCase después de mapToCamel()
    invoicesData = invoicesData.map(invoice => ({
      id: invoice.id,
      number: invoice.invoiceNumber || invoice.invoice_number,
      client: invoice.clientName || invoice.client_name,
      clientEmail: invoice.clientEmail || invoice.client_email,
      clientNif: invoice.clientNif || invoice.client_nif,
      issueDate: invoice.issueDate || invoice.issue_date,
      dueDate: invoice.dueDate || invoice.due_date,
      total: invoice.total,
      subtotal: invoice.subtotal,
      tax: invoice.tax || invoice.vatAmount,
      status: invoice.status,
      daysLate: calculateDaysLate(invoice.dueDate || invoice.due_date, invoice.status),
      verifactuStatus: invoice.verifactuStatus || invoice.verifactu_status || 'not_registered',
      verifactuCsv: invoice.verifactuCsv || invoice.verifactu_csv,
      verifactuQrCode: invoice.verifactuQrCode || invoice.verifactu_qr_code,
      verifactuUrl: invoice.verifactuUrl || invoice.verifactu_url,
      verifactuHash: invoice.verifactuHash || invoice.verifactu_hash,
      verifactuError: invoice.verifactuErrorMessage || invoice.verifactu_error_message
    }));

    // Asegurar que la primera factura esté seleccionada
    ensureInvoiceSelection();

    renderInvoicesTable();
    updateSummaryCards();

  } catch (error) {
    console.error('Error cargando facturas:', error);
    let message = error.message || 'Error al cargar facturas';
    if (error instanceof window.APIError && error.status === 0) {
      message = 'No se pudo conectar con el backend (http://localhost:8020). Asegúrate de que el servicio esté activo.';
    }
    renderErrorState(message);
    showNotification(message, 'error');
  } finally {
    isLoading = false;
  }
}

// Registrar factura en Verifactu
async function registerInvoiceVerifactu(invoiceId) {
  try {
    showNotification('Registrando factura en Verifactu...', 'info');

    // Actualizar estado a pendiente inmediatamente
    const invoice = invoicesData.find(inv => inv.id === invoiceId);
    if (invoice) {
      invoice.verifactuStatus = 'pending';
      renderInvoicesTable();
    }

    await window.api.registerInvoiceVerifactu(invoiceId);

    // Recargar la factura completa desde el backend para obtener todos los datos actualizados
    const updatedInvoice = await window.api.getInvoice(invoiceId);

    // Actualizar factura con los datos completos desde el backend
    if (invoice && updatedInvoice) {
      invoice.verifactuStatus = updatedInvoice.verifactuStatus || 'registered';
      invoice.verifactuCsv = updatedInvoice.verifactuCsv;
      invoice.verifactuQrCode = updatedInvoice.verifactuQrCode;
      invoice.verifactuUrl = updatedInvoice.verifactuUrl;
      invoice.verifactuHash = updatedInvoice.verifactuHash;

      console.log('Datos Verifactu actualizados:', {
        csv: invoice.verifactuCsv,
        qrCode: invoice.verifactuQrCode ? 'presente' : 'ausente',
        url: invoice.verifactuUrl
      });
    }

    renderInvoicesTable();
    showNotification('Factura registrada en Verifactu correctamente', 'success');

  } catch (error) {
    console.error('Error registrando en Verifactu:', error);

    // Extraer mensaje de error del backend
    const errorMessage = error.data?.message || error.data?.error || error.message || 'Error desconocido al registrar factura';

    // Actualizar estado a error
    const invoice = invoicesData.find(inv => inv.id === invoiceId);
    if (invoice) {
      invoice.verifactuStatus = 'error';
      invoice.verifactuError = errorMessage;
      renderInvoicesTable();
    }

    showNotification(`Error: ${errorMessage}`, 'error');
  }
}

// === MODALES DE VERIFACTU ===

function showVerifactuQRModal(invoiceId) {
  const invoice = invoicesData.find(inv => inv.id === invoiceId);
  if (!invoice) {
    showNotification('No se encontro la factura', 'error');
    return;
  }

  console.log('Mostrando modal QR para factura:', {
    id: invoice.id,
    number: invoice.number,
    csv: invoice.verifactuCsv,
    hasQrCode: !!invoice.verifactuQrCode,
    qrCodePreview: invoice.verifactuQrCode ? invoice.verifactuQrCode.substring(0, 50) + '...' : 'sin datos'
  });

  const verificationUrl = resolveVerifactuVerificationUrl(invoice);
  const qrDownloadSrc = resolveQrDownloadSource(invoice);

  if (!invoice.verifactuCsv && !verificationUrl) {
    showNotification('Esta factura no tiene datos de Verifactu todavia.', 'warning');
    return;
  }

  const isTestUrl = invoice.verifactuUrl && invoice.verifactuUrl.includes('/test/');

  const modalHTML = `
    <div class="modal is-open" id="verifactu-qr-modal">
      <div class="modal__backdrop" onclick="document.getElementById('verifactu-qr-modal').remove()"></div>
      <div class="modal__panel" style="max-width: 800px; width: 100%; display: flex; flex-direction: column; margin: auto;">
        <header class="modal__head" style="padding: 1.5rem 2rem 0.5rem 2rem; border-bottom: none;">
          <div>
            <h2 class="modal__title" style="font-size: 1.75rem; font-weight: 700;">Codigo QR - Verifactu</h2>
            <p class="modal__subtitle" style="font-size: 1rem; margin-top: 0.25rem; color: var(--text-secondary);">Factura ${invoice.number}</p>
          </div>
          <button type="button" class="modal__close" style="font-size: 1.5rem;" onclick="document.getElementById('verifactu-qr-modal').remove()">&times;</button>
        </header>
        <div class="modal__body" style="padding: 0 2rem 1.5rem 2rem; overflow: visible;">
          ${invoice.verifactuCsv ? `
            <div style="text-align: center; margin-bottom: 1rem;">
              <p style="color: var(--text-secondary); margin-bottom: 0.25rem; font-size: 0.85rem; font-weight: 500;">Codigo Seguro de Verificacion</p>
              <p style="color: var(--text-primary); font-size: 1rem; font-weight: 600;">
                <code style="background: var(--bg-secondary); padding: 0.4rem 1rem; border-radius: 6px; font-family: monospace; color: var(--text-primary); letter-spacing: 1px; border: 1px solid var(--border-color);">
                  ${invoice.verifactuCsv}
                </code>
              </p>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: center; margin-bottom: 1rem;">
            <div id="verifactu-qr-image" style="padding: 0.5rem; background: var(--bg-primary, #ffffff); border-radius: 12px; border: 1px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            </div>
          </div>
          <p style="font-size: 0.9rem; color: var(--text-secondary); text-align: center; margin-bottom: 0.5rem; max-width: 500px; margin-left: auto; margin-right: auto;">
            Escanea para verificar en AEAT.
          </p>
          ${verificationUrl ? `
            <div style="text-align: center;">
              ${isTestUrl ? `
                <p style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic;">
                  Entorno de pruebas (Sandbox)
                </p>
              ` : `
                <a href="${verificationUrl}" target="_blank" rel="noopener" class="btn-secondary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; padding: 0.4rem 0.8rem; border-radius: 6px;">
                  <span>🔗</span> Link AEAT
                </a>
              `}
            </div>
          ` : ''}
        </div>
        <footer class="modal__footer modal-form__footer">
          <button type="button" class="btn-secondary" onclick="document.getElementById('verifactu-qr-modal').remove()">Cerrar</button>
          ${qrDownloadSrc ? `
            <button type="button" class="btn-primary" onclick="downloadVerifactuQr('${qrDownloadSrc}', '${invoice.number}')">Descargar QR</button>
          ` : `
            <button class="btn-primary" disabled>QR no disponible</button>
          `}
        </footer>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  renderVerifactuQrImage(invoice, 'verifactu-qr-image');
}

function downloadVerifactuQr(qrDownloadSrc, invoiceNumber) {
  if (!qrDownloadSrc) {
    return;
  }

  const link = document.createElement('a');
  link.href = qrDownloadSrc;
  link.download = `verifactu-qr-${invoiceNumber}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function showVerifactuCSVModal(invoiceId) {
  // Buscar la factura en los datos cargados
  const invoice = invoicesData.find(inv => inv.id === invoiceId);
  if (!invoice) {
    showNotification('No se encontró la factura', 'error');
    return;
  }

  if (!invoice.verifactuCsv) {
    showNotification('Esta factura no tiene CSV de Verifactu', 'warning');
    return;
  }

  const modalHTML = `
    <div class="modal is-open" id="verifactu-csv-modal">
      <div class="modal__backdrop" onclick="document.getElementById('verifactu-csv-modal').remove()"></div>
      <div class="modal__panel">
        <header class="modal__head">
          <div>
            <h2>Código Seguro de Verificación (CSV)</h2>
            <p class="modal__subtitle">Factura ${invoice.number}</p>
          </div>
          <button type="button" class="modal__close" onclick="document.getElementById('verifactu-csv-modal').remove()">
            <span>×</span>
          </button>
        </header>
        <div class="modal__body" style="padding: 2rem;">
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="background: var(--bg-secondary); border: 2px dashed var(--border-color); padding: 2rem; border-radius: 8px;">
              <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.75rem;">Código Seguro de Verificación</p>
              <p style="font-size: 2rem; font-weight: bold; font-family: monospace; letter-spacing: 4px; color: var(--text-primary); margin: 0;">
                ${invoice.verifactuCsv}
              </p>
            </div>
          </div>
          ${invoice.verifactuHash ? `
          <div style="margin-top: 1.5rem; font-size: 0.85rem;">
            <p style="color: var(--text-primary);"><strong>Hash SHA-256:</strong></p>
            <p style="font-family: monospace; background: var(--bg-secondary); padding: 0.5rem; border-radius: 4px; word-break: break-all; color: var(--text-secondary);">
              ${invoice.verifactuHash}
            </p>
          </div>
          ` : ''}
          <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 1.5rem;">
            Este código CSV identifica de forma única esta factura en el sistema Verifactu de la AEAT.
          </p>
        </div>
        <footer class="modal__footer modal-form__footer">
          <button type="button" class="btn-secondary" onclick="document.getElementById('verifactu-csv-modal').remove()">Cerrar</button>
          <button type="button" class="btn-primary" onclick="navigator.clipboard.writeText('${invoice.verifactuCsv}').then(() => showNotification('CSV copiado al portapapeles', 'success'))">
            Copiar CSV
          </button>
        </footer>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// === CONFIGURACIÓN VERIFACTU ===

async function openVerifactuConfigModal() {
  try {
    showNotification('Cargando configuración...', 'info');
    let config = null;
    
    try {
      config = await window.api.getVerifactuConfig();
    } catch (error) {
      console.warn('No se pudo obtener configuración (posiblemente primer uso):', error);
      config = {
        enabled: false,
        test_mode: true,
        software_nif: '',
        software_name: 'Anclora Flow',
        software_version: '1.0.0'
      };
    }

    const modalHTML = `
      <div class="modal is-open" id="verifactu-config-modal">
        <div class="modal__backdrop" onclick="document.getElementById('verifactu-config-modal').remove()"></div>
        <div class="modal__panel" style="max-width: 550px;">
          <header class="modal__head">
            <div>
              <h2 class="modal__title">Configuración Verifactu</h2>
              <p class="modal__subtitle">Sistema de emisión de facturas verificables (AEAT)</p>
            </div>
            <button type="button" class="modal__close" onclick="document.getElementById('verifactu-config-modal').remove()">×</button>
          </header>
          <div class="modal__body" style="padding: 1.5rem;">
            <form id="verifactu-config-form" style="display: flex; flex-direction: column; gap: 1.25rem;">
              
              <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                  <div style="padding-top: 2px;">
                    <input type="checkbox" id="verifactu-enabled" name="enabled" ${config.enabled ? 'checked' : ''} style="width: 1.2rem; height: 1.2rem;">
                  </div>
                  <div>
                    <label for="verifactu-enabled" style="font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 0.25rem;">Habilitar Verifactu</label>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">
                      Activa la generación automática de registros de facturación verificables al completar una factura.
                    </p>
                  </div>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label for="software-nif" style="display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">NIF del Desarrollador</label>
                  <input type="text" id="software-nif" name="software_nif" class="form-input" value="${config.software_nif || ''}" placeholder="Ej: B12345678" style="width: 100%;">
                </div>
                <div>
                  <label for="software-version" style="display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Versión Software</label>
                  <input type="text" id="software-version" name="software_version" class="form-input" value="${config.software_version || '1.0.0'}" placeholder="1.0.0" style="width: 100%;">
                </div>
              </div>
              
              <div>
                <label for="software-name" style="display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Nombre Software</label>
                <input type="text" id="software-name" name="software_name" class="form-input" value="${config.software_name || 'Anclora Flow'}" placeholder="Nombre de tu aplicación" style="width: 100%;">
              </div>

              <div style="margin-top: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 1.25rem;">
                <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer;">
                  <input type="checkbox" id="test-mode" name="test_mode" ${config.test_mode ? 'checked' : ''}>
                  <span style="font-size: 0.95rem; color: var(--text-primary);">Modo Pruebas (Entorno Test AEAT)</span>
                </label>
                <p style="margin: 0.25rem 0 0 1.8rem; font-size: 0.85rem; color: var(--text-secondary);">
                  Recomendado para desarrollo. No enviará datos reales a Hacienda.
                </p>
              </div>

            </form>
          </div>
          <footer class="modal__footer modal-form__footer">
            <button type="button" class="btn-secondary" onclick="document.getElementById('verifactu-config-modal').remove()">Cancelar</button>
            <button type="button" class="btn-primary" onclick="saveVerifactuConfig()">Guardar Configuración</button>
          </footer>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Eliminar notificaciones de carga
    document.querySelectorAll('.notification--info').forEach(n => n.remove());

  } catch (error) {
    console.error('Error opening config:', error);
    showNotification('Error al abrir la configuración: ' + error.message, 'error');
  }
}

async function saveVerifactuConfig() {
  try {
    const enabled = document.getElementById('verifactu-enabled').checked;
    const testMode = document.getElementById('test-mode').checked;
    const softwareNif = document.getElementById('software-nif').value;
    const softwareName = document.getElementById('software-name').value;
    const softwareVersion = document.getElementById('software-version').value;

    if (enabled && !softwareNif) {
      showNotification('El NIF es obligatorio si Verifactu está habilitado', 'warning');
      return;
    }

    showNotification('Guardando configuración...', 'info');

    await window.api.updateVerifactuConfig({
      enabled,
      test_mode: testMode,
      software_nif: softwareNif,
      software_name: softwareName,
      software_version: softwareVersion
    });

    document.getElementById('verifactu-config-modal').remove();
    showNotification('Configuración de Verifactu guardada correctamente', 'success');

  } catch (error) {
    console.error('Error saving config:', error);
    showNotification('Error al guardar: ' + (error.data?.error || error.message), 'error');
  }
}

// === ACCIONES DE FACTURA ===

// Ver detalles de factura
async function viewInvoice(invoiceId) {
  try {
    showNotification('Cargando detalles de la factura...', 'info');

    const invoice = await window.api.getInvoice(invoiceId);
    let payments = [];
    let auditLogs = [];

    try {
      payments = await window.api.getInvoicePayments(invoiceId);
      auditLogs = await window.api.getInvoiceAuditLog(invoiceId);
    } catch (e) {
      console.warn('No se pudieron cargar pagos o auditoría:', e);
    }

    const totalInvoice = sanitizeNumber(invoice.total, 0);
    const paidAmount = sanitizeNumber(invoice.paidAmount || invoice.paid_amount, 0);
    const remainingBalance = Math.max(0, totalInvoice - paidAmount);

    const modalHTML = `
      <div class="modal is-open" id="view-invoice-modal">
        <div class="modal__backdrop" onclick="document.getElementById('view-invoice-modal').remove()"></div>
        <div class="modal__panel modal__panel--xl modal__panel--flex">
          <header class="modal__head">
            <div>
              <h2 class="modal__title">Factura ${invoice.invoiceNumber || invoice.number || invoice.invoice_number}</h2>
              <p class="modal__subtitle">Detalles completos de la factura</p>
            </div>
            <button type="button" class="modal__close" onclick="document.getElementById('view-invoice-modal').remove()">&times;</button>
          </header>
          <div class="modal__body">
            <div class="modal-form">
              <div class="modal-form__body modal-form__body--split">
                <div class="modal-form__column">
                  <section class="modal-section modal-section--card">
                    <div class="modal-section__header">
                      <h3 class="modal-section__title">Datos de factura</h3>
                    </div>
                    <div class="invoice-modal__row">
                      <label class="form-field invoice-modal__field invoice-modal__field--md">
                        <span>Numero de factura</span>
                        <input type="text" class="form-input" value="${invoice.invoiceNumber || invoice.number || invoice.invoice_number || ''}" disabled />
                      </label>
                      <label class="form-field invoice-modal__field invoice-modal__field--sm">
                        <span>Estado</span>
                        <div class="form-input form-input--readonly">
                          <span class="status-pill status-pill--${statusMap[invoice.status]?.tone || 'draft'}">
                            ${statusMap[invoice.status]?.label || invoice.status}
                          </span>
                        </div>
                      </label>
                      <label class="form-field invoice-modal__field invoice-modal__field--sm">
                        <span>F. Emision</span>
                        <input type="text" class="form-input" value="${formatDate(invoice.issue_date) || '-'}" disabled />
                      </label>
                      <label class="form-field invoice-modal__field invoice-modal__field--sm">
                        <span>F. Vencimiento</span>
                        <input type="text" class="form-input" value="${formatDate(invoice.due_date) || '-'}" disabled />
                      </label>
                    </div>
                    <div class="invoice-modal__row">
                      <label class="form-field invoice-modal__field invoice-modal__field--lg">
                        <span>Cliente</span>
                        <input type="text" class="form-input" value="${invoice.client?.name || invoice.client_name || 'Sin cliente asignado'}" disabled />
                        ${invoice.client?.email ? `<span class="form-field__meta">${invoice.client.email}</span>` : ''}
                      </label>
                      <label class="form-field invoice-modal__field invoice-modal__field--lg">
                        <span>Descripcion</span>
                        <input type="text" class="form-input" value="${invoice.description || ''}" placeholder="Sin descripcion" disabled />
                      </label>
                    </div>
                    ${invoice.notes ? `
                    <div class="invoice-modal__row">
                      <label class="form-field invoice-modal__field invoice-modal__field--full">
                        <span>Notas</span>
                        <textarea class="form-input" rows="2" disabled>${invoice.notes}</textarea>
                      </label>
                    </div>
                    ` : ''}
                  </section>

                  <section class="modal-section modal-section--card">
                    <div class="modal-section__header">
                      <h3 class="modal-section__title">Líneas de factura</h3>
                    </div>
                    <div class="modal-tabs">
                      <div class="modal-tabs__bar">
                        <button type="button" class="modal-tabs__scroller" id="view-invoice-tab-prev" disabled>&larr;</button>
                        <div id="view-invoice-tabs" class="modal-tabs__nav"></div>
                        <button type="button" class="modal-tabs__scroller" id="view-invoice-tab-next" disabled>&rarr;</button>
                      </div>
                      <div class="modal-tabs__panel">
                        <div id="view-invoice-items"></div>
                      </div>
                    </div>
                  </section>
                </div>

                <div class="modal-form__column modal-form__column--side">
                  <section class="modal-section modal-section--card modal-section--totals">
                    <div class="modal-section__header">
                      <h3 class="modal-section__title">Resumen de Importes</h3>
                    </div>
                    <div class="invoice-summary-stats">
                      <div class="invoice-summary-stat">
                        <span class="invoice-summary-stat__label">Total Factura</span>
                        <span class="invoice-summary-stat__value">${formatCurrency(totalInvoice)}</span>
                      </div>
                      <div class="invoice-summary-stat">
                        <span class="invoice-summary-stat__label">Pagado hasta hoy</span>
                        <span class="invoice-summary-stat__value text-success">${formatCurrency(paidAmount)}</span>
                      </div>
                      <div class="invoice-summary-stat invoice-summary-stat--pending">
                        <span class="invoice-summary-stat__label">Saldo Pendiente</span>
                        <span class="invoice-summary-stat__value ${remainingBalance > 0 ? 'text-warning' : 'text-success'}">${formatCurrency(remainingBalance)}</span>
                      </div>
                    </div>
                    <div id="view-invoice-totals" style="margin-top: 1.5rem; border-top: 1px dashed var(--border-color); padding-top: 1rem;"></div>
                  </section>

                  <section class="modal-section modal-section--card">
                    <div class="modal-section__header">
                      <h3 class="modal-section__title">Historial de Pagos</h3>
                      <span class="badge badge--neutral">${payments.length}</span>
                    </div>
                    <div class="invoice-history">
                      ${payments.length > 0 ? payments.map(p => `
                        <div class="history-item">
                          <div class="history-item__header">
                            <span class="history-item__title">${formatCurrency(p.amount)}</span>
                            <span class="history-item__date">${formatDate(p.paymentDate || p.payment_date)}</span>
                          </div>
                          <div class="history-item__meta">
                            ${p.paymentMethod === 'bank_transfer' ? 'Transferencia' : p.paymentMethod}
                            ${p.transactionId ? ` • Ref: ${p.transactionId}` : ''}
                          </div>
                        </div>
                      `).join('') : '<p class="empty-state">No hay pagos registrados.</p>'}
                    </div>
                  </section>

                  <section class="modal-section modal-section--card">
                    <div class="modal-section__header">
                      <h3 class="modal-section__title">Registro de Actividad</h3>
                    </div>
                    <div class="invoice-activity">
                      ${auditLogs.length > 0 ? auditLogs.map(log => `
                        <div class="activity-log-item">
                          <div class="activity-log-item__dot"></div>
                          <div class="activity-log-item__content">
                            <div class="activity-log-item__action">
                              <strong>${log.action === 'CREATE' ? 'Creación' : log.action === 'UPDATE' ? 'Actualización' : log.action === 'PAYMENT' ? 'Pago Recibido' : log.action}</strong>
                            </div>
                            ${log.changeReason ? `<div class="activity-log-item__reason">${log.changeReason}</div>` : ''}
                            <div class="activity-log-item__footer">
                              <span>${formatDate(log.createdAt || log.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      `).join('') : '<p class="empty-state">Sin actividad registrada.</p>'}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
          <footer class="modal__footer modal-form__footer">
            <button type="button" class="btn-secondary" onclick="document.getElementById('view-invoice-modal').remove()">Cerrar</button>
            <button type="button" class="btn-primary" onclick="downloadInvoicePDF('${invoice.id}')">Descargar PDF</button>
          </footer>
        </div>
      </div>
`

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Configurar editor de pestañas en modo solo lectura
    setupItemsEditorWithTabs({
      editorKey: 'view',
      containerId: 'view-invoice-items',
      tabsContainerId: 'view-invoice-tabs',
      totalsId: 'view-invoice-totals',
      addButtonId: null,
      prevButtonId: 'view-invoice-tab-prev',
      nextButtonId: 'view-invoice-tab-next',
      initialItems: invoice.items || [],
      editable: false,
      allowIrpfEdit: false,
      defaultUnitType: 'unidad',
      irpfPercentage: invoice.irpf_percentage || 0
    });

    const notifications = document.querySelectorAll('.notification--info');
    notifications.forEach(n => n.remove());

  } catch (error) {
    console.error('Error viewing invoice:', error);
    showNotification(`Error al cargar la factura: ${error.message}`, 'error');
  }
}

// Editar factura
async function editInvoice(invoiceId) {
  try {
    showNotification('Cargando factura...', 'info');

    const invoice = await window.api.getInvoice(invoiceId);

    const issueDateValue = formatDateForInput(invoice.issue_date);
    const dueDateValue = formatDateForInput(invoice.due_date);
    const paymentDateValue = formatDateForInput(invoice.payment_date);

    const modalHTML = `
      <div class="modal is-open invoice-modal" id="edit-invoice-modal">
        <div class="modal__backdrop" onclick="closeEditInvoiceModal()"></div>
        <div class="modal__panel modal__panel--xl modal__panel--flex">
          <header class="modal__head">
            <div>
              <h2 class="modal__title">Editar factura ${invoice.invoiceNumber || invoice.invoice_number || '---'}</h2>
              <p class="modal__subtitle">Actualiza datos y conceptos</p>
            </div>
            <button type="button" class="modal__close" onclick="closeEditInvoiceModal()">&times;</button>
          </header>
          <div class="modal__body">
            <form id="edit-invoice-form" class="modal-form invoice-form">
              <div class="modal-form__body modal-form__body--split">
                <div class="modal-form__column">
                  ${invoice.verifactu_status === 'registered' ? `
                    <div class="modal-banner modal-banner--info">
                      <span class="modal-banner__icon" aria-hidden="true">!</span>
                      <div class="modal-banner__content">
                        <strong>Factura registrada en Verifactu</strong>
                        <p>Los cambios no afectan al registro enviado.</p>
                      </div>
                    </div>
                  ` : ''}
                  <div id="edit-lock-message" class="modal-banner" ${invoice.status === 'draft' ? 'hidden' : ''}>
                    <span class="modal-banner__icon" aria-hidden="true">!</span>
                    <div class="modal-banner__content">
                      <strong>Edicion limitada</strong>
                      <p>Para editar conceptos e importes cambia el estado a Borrador.</p>
                    </div>
                  </div>

                  <section class="modal-section modal-section--card">
                    <div class="modal-section__header">
                      <h3 class="modal-section__title">Datos de factura</h3>
                    </div>
                    <div class="invoice-modal__row">
                      <label class="form-field invoice-modal__field invoice-modal__field--md">
                        <span>Numero de factura</span>
                        <input type="text" class="form-input" value="${invoice.invoiceNumber || invoice.invoice_number || ''}" disabled />
                      </label>
                      <label class="form-field invoice-modal__field invoice-modal__field--sm">
                        <span>Estado</span>
                        <select id="edit-status" name="status" class="form-input">
                          <option value="draft" ${invoice.status === 'draft' ? 'selected' : ''}>Borrador</option>
                          <option value="pending" ${invoice.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                          <option value="sent" ${invoice.status === 'sent' ? 'selected' : ''}>Enviada</option>
                          <option value="paid" ${invoice.status === 'paid' ? 'selected' : ''}>Cobrada</option>
                          <option value="overdue" ${invoice.status === 'overdue' ? 'selected' : ''}>Vencida</option>
                        </select>
                      </label>
                      <label class="form-field invoice-modal__field invoice-modal__field--sm">
                        <span>F. Emision</span>
                        <input type="date" id="edit-issue-date" name="issue_date" class="form-input" value="${issueDateValue || ''}" />
                      </label>
                      <label class="form-field invoice-modal__field invoice-modal__field--sm">
                        <span>F. Vencimiento</span>
                        <input type="date" id="edit-due-date" name="due_date" class="form-input" value="${dueDateValue || ''}" />
                      </label>
                      <label id="payment-date-container" class="form-field invoice-modal__field invoice-modal__field--sm" ${invoice.status === 'paid' ? '' : 'hidden'}>
                        <span>F. Pago</span>
                        <input type="date" id="edit-payment-date" name="payment_date" class="form-input" value="${paymentDateValue || ''}" />
                      </label>
                    </div>
                    <div class="invoice-modal__row">
                      <label class="form-field invoice-modal__field invoice-modal__field--lg">
                        <span>Descripcion</span>
                        <input type="text" id="edit-description" name="description" class="form-input" value="${invoice.description || ''}" placeholder="Concepto general de la factura" />
                      </label>
                      <label class="form-field invoice-modal__field invoice-modal__field--lg">
                        <span>Notas</span>
                        <textarea id="edit-notes" name="notes" rows="2" class="form-input">${invoice.notes || ''}</textarea>
                      </label>
                    </div>
                    <div class="invoice-modal__row">
                      <label class="form-field invoice-modal__field invoice-modal__field--xl">
                        <span>Motivo del cambio (Obligatorio)</span>
                        <input type="text" id="edit-change-reason" name="changeReason" class="form-input" placeholder="Ej: Error en el precio unitario, Cambio de fecha por acuerdo..." />
                      </label>
                    </div>
                  </section>

                  <section class="modal-section modal-section--card">
                    <div class="modal-section__header">
                      <h3 class="modal-section__title">Líneas de factura</h3>
                      <button type="button" class="invoice-form__add-line" id="add-edit-invoice-item">+ Añadir línea</button>
                    </div>
                    <div class="modal-tabs">
                      <div class="modal-tabs__bar">
                        <button type="button" class="modal-tabs__scroller" id="edit-invoice-tab-prev" disabled>&larr;</button>
                        <div id="edit-invoice-tabs" class="modal-tabs__nav"></div>
                        <button type="button" class="modal-tabs__scroller" id="edit-invoice-tab-next" disabled>&rarr;</button>
                      </div>
                      <div class="modal-tabs__panel">
                        <div id="edit-invoice-items"></div>
                      </div>
                    </div>
                  </section>
                </div>

                <div class="modal-form__column modal-form__column--side">
                  <section class="modal-section modal-section--card modal-section--totals">
                    <div class="modal-section__header">
                      <h3 class="modal-section__title">Resumen</h3>
                    </div>
                    <div id="edit-invoice-totals"></div>
                  </section>
                </div>
              </div>
            </form>
          </div>
          <footer class="modal__footer modal-form__footer">
            <button type="button" class="btn-secondary" onclick="closeEditInvoiceModal()">Cancelar</button>
            <button type="button" class="btn-primary" onclick="saveInvoiceChanges('${invoice.id}')">Guardar cambios</button>
          </footer>
        </div>
      </div>
`

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    setupInvoiceEditForm(invoice);

    const notifications = document.querySelectorAll('.notification--info');
    notifications.forEach(n => n.remove());
  } catch (error) {
    console.error('Error loading invoice for edit:', error);
    showNotification(`Error al cargar la factura: ${error.message}`, 'error');
  }
}

function setupInvoiceEditForm(invoice) {
  invoiceEditState = { invoiceId: invoice.id };

  setupItemsEditorWithTabs({
    editorKey: 'edit',
    containerId: 'edit-invoice-items',
    tabsContainerId: 'edit-invoice-tabs',
    totalsId: 'edit-invoice-totals',
    addButtonId: 'add-edit-invoice-item',
    prevButtonId: 'edit-invoice-tab-prev',
    nextButtonId: 'edit-invoice-tab-next',
    initialItems: invoice.items || [],
    editable: invoice.status === 'draft',
    allowIrpfEdit: true,
    defaultUnitType: 'unidad',
    irpfPercentage: invoice.irpf_percentage || 0
  });

  configurePaymentDateField({
    statusSelectId: 'edit-status',
    containerId: 'payment-date-container',
    inputId: 'edit-payment-date',
    initialStatus: invoice.status,
    initialPaymentDate: invoice.payment_date
  });

  const statusSelect = document.getElementById('edit-status');
  const lockMessage = document.getElementById('edit-lock-message');

  if (statusSelect) {
    statusSelect.addEventListener('change', (event) => {
      const isDraft = event.target.value === 'draft';
      setItemsEditorEditable('edit', isDraft);
      if (lockMessage) {
        lockMessage.hidden = isDraft;
      }
    });
  }
}

function closeEditInvoiceModal() {
  destroyItemsEditor('edit');
  invoiceEditState = null;
  const modal = document.getElementById('edit-invoice-modal');
  if (modal) {
    modal.remove();
  }
}

async function openNewInvoiceModal() {
  try {
    showNotification('Preparando formulario de factura...', 'info');

    let clients = [];
    try {
      const clientsResponse = await window.api.getClients({ isActive: true });
      clients = clientsResponse?.clients || clientsResponse || [];
    } catch (clientError) {
      console.warn('No se pudieron cargar los clientes:', clientError);
    }

    const today = formatDateForInput(new Date());
    const dueDefaultDate = formatDateForInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    const modalHTML = `
      <div class="modal is-open invoice-modal" id="new-invoice-modal">
        <div class="modal__backdrop" onclick="closeNewInvoiceModal()"></div>
        <div class="modal__panel modal__panel--xl modal__panel--flex">
          <header class="modal__head">
            <div>
              <h2 class="modal__title">Nueva factura</h2>
              <p class="modal__subtitle">Completa los datos y conceptos</p>
            </div>
            <button type="button" class="modal__close" onclick="closeNewInvoiceModal()">&times;</button>
          </header>
          <div class="modal__body">
            <form id="new-invoice-form" class="modal-form invoice-form">
              <div class="modal-form__body modal-form__body--split">
                <div class="modal-form__column">
                  <section class="modal-section modal-section--card">
                    <div class="modal-section__header">
                      <h3 class="modal-section__title">Datos de factura</h3>
                    </div>
                    <div class="invoice-modal__row">
                      <label class="form-field invoice-modal__field invoice-modal__field--md">
                        <span>Numero de factura *</span>
                        <input type="text" id="new-invoice-number" name="invoice_number" class="form-input" placeholder="2024-001" required />
                      </label>
                      <label class="form-field invoice-modal__field invoice-modal__field--sm">
                        <span>Estado</span>
                        <select id="new-invoice-status" name="status" class="form-input">
                          <option value="draft" selected>Borrador</option>
                          <option value="pending">Pendiente</option>
                          <option value="sent">Enviada</option>
                          <option value="paid">Cobrada</option>
                          <option value="overdue">Vencida</option>
                        </select>
                      </label>
                      <label class="form-field invoice-modal__field invoice-modal__field--sm">
                        <span>F. Emision</span>
                        <input type="date" id="new-invoice-issue-date" name="issue_date" class="form-input" value="${today}" required />
                      </label>
                      <label class="form-field invoice-modal__field invoice-modal__field--sm">
                        <span>F. Vencimiento</span>
                        <input type="date" id="new-invoice-due-date" name="due_date" class="form-input" value="${dueDefaultDate}" required />
                      </label>
                    </div>
                    <div class="invoice-modal__row">
                      <label class="form-field invoice-modal__field invoice-modal__field--lg">
                        <span>Cliente</span>
                        <select id="new-invoice-client" name="client_id" class="form-input">
                          <option value="">Sin cliente asignado</option>
                          ${clients.map(client => `<option value="${client.id}">${client.name || client.business_name || 'Cliente sin nombre'}</option>`).join('')}
                        </select>
                      </label>
                      <label class="form-field invoice-modal__field invoice-modal__field--lg">
                        <span>Descripcion</span>
                        <input type="text" id="new-invoice-description" name="description" class="form-input" placeholder="Concepto general de la factura" />
                      </label>
                    </div>
                    <div class="invoice-modal__row">
                      <label class="form-field invoice-modal__field invoice-modal__field--lg">
                        <span>Notas</span>
                        <textarea id="new-invoice-notes" name="notes" rows="2" class="form-input" placeholder="Observaciones internas o para el cliente"></textarea>
                      </label>
                      <label id="new-payment-date-container" class="form-field invoice-modal__field invoice-modal__field--sm" hidden>
                        <span>Fecha de pago</span>
                        <input type="date" id="new-payment-date" name="payment_date" class="form-input" />
                      </label>
                    </div>
                  </section>

                  <section class="modal-section modal-section--card">
                    <div class="modal-section__header">
                      <h3 class="modal-section__title">Líneas de factura</h3>
                      <button type="button" class="invoice-form__add-line" id="add-new-invoice-item">+ Añadir línea</button>
                    </div>
                    <div class="modal-tabs">
                      <div class="modal-tabs__bar">
                        <button type="button" class="modal-tabs__scroller" id="new-invoice-tab-prev" disabled>&larr;</button>
                        <div id="new-invoice-tabs" class="modal-tabs__nav"></div>
                        <button type="button" class="modal-tabs__scroller" id="new-invoice-tab-next" disabled>&rarr;</button>
                      </div>
                      <div class="modal-tabs__panel">
                        <div id="new-invoice-items"></div>
                      </div>
                    </div>
                  </section>
                </div>

                <div class="modal-form__column modal-form__column--side">
                  <section class="modal-section modal-section--card modal-section--totals">
                    <div class="modal-section__header">
                      <h3 class="modal-section__title">Resumen</h3>
                    </div>
                    <div id="new-invoice-totals"></div>
                  </section>
                </div>
              </div>
            </form>
          </div>
          <footer class="modal__footer modal-form__footer">
            <button type="button" class="btn-secondary" onclick="closeNewInvoiceModal()">Cancelar</button>
            <button type="button" class="btn-primary" onclick="submitNewInvoice()">Crear factura</button>
          </footer>
        </div>
      </div>
`

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    setupItemsEditorWithTabs({
      editorKey: 'create',
      containerId: 'new-invoice-items',
      tabsContainerId: 'new-invoice-tabs',
      totalsId: 'new-invoice-totals',
      addButtonId: 'add-new-invoice-item',
      prevButtonId: 'new-invoice-tab-prev',
      nextButtonId: 'new-invoice-tab-next',
      initialItems: [],
      editable: true,
      allowIrpfEdit: true,
      defaultUnitType: 'unidad',
      irpfPercentage: 0
    });

    configurePaymentDateField({
      statusSelectId: 'new-invoice-status',
      containerId: 'new-payment-date-container',
      inputId: 'new-payment-date',
      initialStatus: 'draft',
      initialPaymentDate: null
    });

    // --- VALIDACIÓN DE UNICIDAD EN TIEMPO REAL ---
    const numberInput = document.getElementById('new-invoice-number');
    let debounceTimer;

    if (numberInput) {
      numberInput.addEventListener('input', () => {
        const value = numberInput.value.trim();
        
        // Limpiar estilos previos
        numberInput.classList.remove('is-invalid', 'is-valid');
        const existingError = numberInput.parentElement.querySelector('.form-field__error');
        if (existingError) existingError.remove();

        if (!value) return;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          try {
            const { exists } = await window.api.checkInvoiceNumberUniqueness(value);
            if (exists) {
              numberInput.classList.add('is-invalid');
              numberInput.insertAdjacentHTML('afterend', '<span class="form-field__error" style="color: #e53e3e; font-size: 0.75rem; margin-top: 0.25rem; display: block;">Este número de factura ya está en uso.</span>');
            } else {
              numberInput.classList.add('is-valid');
            }
          } catch (error) {
            console.error('Error al verificar unicidad:', error);
          }
        }, 500); // 500ms debounce
      });
    }

    const notifications = document.querySelectorAll('.notification--info');
    notifications.forEach(n => n.remove());
  } catch (error) {
    console.error('Error opening new invoice modal:', error);
    showNotification(`Error al preparar la factura: ${error.message}`, 'error');
  }
}

function closeNewInvoiceModal() {
  destroyItemsEditor('create');
  const modal = document.getElementById('new-invoice-modal');
  if (modal) {
    modal.remove();
  }
}

async function submitNewInvoice() {
  try {
    const form = document.getElementById('new-invoice-form');
    if (!form) {
      showNotification('No se encontro el formulario de nueva factura.', 'error');
      return;
    }

    const formData = new FormData(form);
    const invoiceNumber = (formData.get('invoice_number') || '').trim();
    const issueDate = formData.get('issue_date');
    const dueDate = formData.get('due_date');
    const status = formData.get('status') || 'draft';
    const clientId = formData.get('client_id') || null;
    let notes = (formData.get('notes') || '').trim();
    const description = (formData.get('description') || '').trim();

    if (description) {
      notes = `Concepto: ${description}\n\n${notes}`.trim();
    }

    // --- VALIDACIONES ---
    const errors = [];

    // 1. Número de factura (Patrón)
    if (!invoiceNumber) {
      errors.push('El número de factura es obligatorio.');
    } else {
      const invoicePattern = /^[A-Z0-9\-\/]+$/i;
      if (!invoicePattern.test(invoiceNumber)) {
        errors.push('El número de factura tiene un formato inválido (solo letras, números, guiones y barras).');
      }
    }

    // 2. Cliente obligatorio
    if (!clientId) {
      errors.push('Debes seleccionar un cliente.');
    }

    // 3. Fechas obligatorias y consistentes
    if (!issueDate || !dueDate) {
      errors.push('Las fechas de emisión y vencimiento son obligatorias.');
    } else if (new Date(dueDate) < new Date(issueDate)) {
      errors.push('La fecha de vencimiento no puede ser anterior a la de emisión.');
    }

    // 4. Líneas de factura
    const editorState = getItemsEditorState('create');
    if (!editorState || !editorState.items || editorState.items.length === 0) {
      errors.push('Añade al menos una línea de concepto.');
    }

    const items = editorState.items
      .map((item) => {
        const quantity = sanitizeNumber(item.quantity, 0);
        const unitPrice = sanitizeNumber(item.unitPrice, 0);
        const vatPercentage = sanitizeNumber(item.vatPercentage, 0);
        const itemDescription = (item.description || '').trim();
        const totals = calculateLineTotals({ quantity, unitPrice, vatPercentage });
        return {
          description: itemDescription,
          quantity,
          unitType: item.unitType || 'unidad',
          unitPrice,
          vatPercentage,
          amount: totals.total
        };
      })
      .filter(item => item.description.length > 0);

    if (items.length === 0) {
      errors.push('Añade al menos una línea con descripción.');
    } else {
      items.forEach((item, index) => {
        if (item.quantity <= 0) errors.push(`Línea ${index + 1}: La cantidad debe ser mayor que 0.`);
        if (item.unitPrice < 0) errors.push(`Línea ${index + 1}: El precio no puede ser negativo.`);
        if (item.vatPercentage < 0 || item.vatPercentage > 100) errors.push(`Línea ${index + 1}: IVA inválido.`);
      });
    }

    if (errors.length > 0) {
      showNotification(errors.join('<br>'), 'warning');
      return;
    }
    // --- FIN VALIDACIONES ---

    const totals = calculateInvoiceTotals(items, editorState.irpfPercentage);

    const payload = {
      invoiceNumber,
      issueDate,
      dueDate,
      status,
      notes: notes || null,
      subtotal: totals.subtotal,
      vatPercentage: totals.vatPercentage,
      vatAmount: totals.vatAmount,
      irpfPercentage: totals.irpfPercentage,
      irpfAmount: totals.irpfAmount,
      total: totals.total,
      items
    };

    if (clientId) {
      payload.clientId = clientId;
    }

    showNotification('Creando factura...', 'info');

    await window.api.createInvoice(payload);
    await loadInvoices();
    closeNewInvoiceModal();

    showNotification('Factura creada correctamente', 'success');
  } catch (error) {
    console.error('Error creating invoice:', error);
    showNotification(`Error al crear la factura: ${error.message}`, 'error');
  }
}

// Guardar cambios de factura
async function saveInvoiceChanges(invoiceId) {
  try {
    const form = document.getElementById('edit-invoice-form');
    if (!form) {
      showNotification('No se encontro el formulario de edicion.', 'error');
      return;
    }

    const formData = new FormData(form);

    const status = formData.get('status') || 'draft';
    const issueDate = formData.get('issue_date');
    const dueDate = formData.get('due_date');
    const rawNotes = (formData.get('notes') || '').trim();
    const paymentDateFromForm = formData.get('payment_date');

    const updates = {
      status,
    };

    if (issueDate) {
      updates.issueDate = issueDate;
    }

    if (dueDate) {
      updates.dueDate = dueDate;
    }

    if (rawNotes.length > 0) {
      updates.notes = rawNotes;
    }

    if (status === 'paid') {
      updates.paymentDate = paymentDateFromForm && paymentDateFromForm.length > 0
        ? paymentDateFromForm
        : new Date().toISOString().split('T')[0];
    } else {
      updates.paymentDate = undefined;
    }

    const editorState = getItemsEditorState('edit');
    const changeReason = (formData.get('changeReason') || '').trim();

    // --- VALIDACIONES ---
    const errors = [];

    // 1. Motivo del cambio obligatorio
    if (!changeReason) {
      errors.push('El motivo del cambio es obligatorio para registrar la modificación.');
    }

    // 2. Fechas consistentes
    if (!issueDate || !dueDate) {
      errors.push('Las fechas de emisión y vencimiento son obligatorias.');
    } else if (new Date(dueDate) < new Date(issueDate)) {
      errors.push('La fecha de vencimiento no puede ser anterior a la de emisión.');
    }

    // 3. Líneas de factura (Solo si está en Borrador se pueden editar)
    let preparedItems = null;
    if (editorState && status === 'draft') {
      preparedItems = editorState.items
        .map((item) => {
          const quantity = sanitizeNumber(item.quantity, 0);
          const unitPrice = sanitizeNumber(item.unitPrice, 0);
          const vatPercentage = sanitizeNumber(item.vatPercentage, 0);
          const itemDescription = (item.description || '').trim();
          const totals = calculateLineTotals({ quantity, unitPrice, vatPercentage });
          return {
            description: itemDescription,
            quantity,
            unitType: item.unitType || 'unidad',
            unitPrice,
            vatPercentage,
            amount: totals.total
          };
        })
        .filter(item => item.description.length > 0);

      if (preparedItems.length === 0) {
        errors.push('Añade al menos una línea con descripción.');
      } else {
        preparedItems.forEach((item, index) => {
          if (item.quantity <= 0) errors.push(`Línea ${index + 1}: La cantidad debe ser mayor que 0.`);
          if (item.unitPrice < 0) errors.push(`Línea ${index + 1}: El precio no puede ser negativo.`);
          if (item.vatPercentage < 0 || item.vatPercentage > 100) errors.push(`Línea ${index + 1}: IVA inválido.`);
        });
      }
    }

    if (errors.length > 0) {
      showNotification(errors.join('<br>'), 'warning');
      return;
    }
    // --- FIN VALIDACIONES ---

    updates.changeReason = changeReason;

    if (preparedItems) {
      const totals = calculateInvoiceTotals(preparedItems, editorState.irpfPercentage);
      updates.items = preparedItems;
      updates.subtotal = totals.subtotal;
      updates.vatPercentage = totals.vatPercentage;
      updates.vatAmount = totals.vatAmount;
      updates.irpfPercentage = totals.irpfPercentage;
      updates.irpfAmount = totals.irpfAmount;
      updates.total = totals.total;
    }

    if (updates.paymentDate === undefined) {
      delete updates.paymentDate;
    }

    showNotification('Guardando cambios...', 'info');

    await window.api.updateInvoice(invoiceId, updates);
    await loadInvoices();
    closeEditInvoiceModal();

    showNotification('Factura actualizada correctamente', 'success');
  } catch (error) {
    console.error('Error saving invoice:', error);
    showNotification(`Error al guardar: ${error.message}`, 'error');
  }
}

// Descargar PDF de factura
async function downloadInvoicePDF(invoiceId) {
  try {
    showNotification('Generando PDF...', 'info');

    // Obtener detalles completos de la factura
    const invoice = await window.api.getInvoice(invoiceId);

    // Generar HTML para PDF
    const pdfHTML = generateInvoicePDFHTML(invoice);

    // Crear un iframe oculto para imprimir
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write(pdfHTML);
    doc.close();

    // Esperar a que se cargue
    printFrame.onload = function() {
      setTimeout(() => {
        printFrame.contentWindow.print();
        // Limpiar después de imprimir
        setTimeout(() => document.body.removeChild(printFrame), 1000);
      }, 250);
    };

    showNotification('Abriendo diálogo de impresión...', 'success');

  } catch (error) {
    console.error('Error downloading PDF:', error);
    showNotification(`Error al generar PDF: ${error.message}`, 'error');
  }
}

// Generar HTML para PDF
function generateInvoicePDFHTML(invoice) {
  const now = new Date().toLocaleDateString('es-ES');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Factura ${invoice.invoice_number}</title>
      <style>
        @page { margin: 2cm; }
        body {
          font-family: Arial, sans-serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #4299e1;
        }
        .header h1 {
          color: #2c5282;
          margin: 0 0 10px 0;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .info-box {
          padding: 15px;
          background-color: #f7fafc;
          border-radius: 5px;
        }
        .info-box h3 {
          margin: 0 0 10px 0;
          color: #2c5282;
          font-size: 14pt;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background-color: #2c5282;
          color: white;
          padding: 12px;
          text-align: left;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals {
          margin-left: auto;
          width: 300px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        .totals-row.final {
          border-top: 2px solid #2c5282;
          font-weight: bold;
          font-size: 14pt;
          margin-top: 10px;
          padding-top: 10px;
        }
        .notes {
          margin-top: 30px;
          padding: 15px;
          background-color: #f7fafc;
          border-left: 4px solid #4299e1;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          font-size: 10pt;
          color: #718096;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>FACTURA</h1>
        <p style="font-size: 18pt; font-weight: bold; color: #2c5282;">${invoice.invoice_number}</p>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <h3>Cliente</h3>
          <p><strong>${invoice.client?.name || invoice.client_name || 'Sin cliente'}</strong></p>
          ${invoice.client?.email ? `<p>${invoice.client.email}</p>` : ''}
          ${invoice.client?.nif_cif ? `<p>NIF/CIF: ${invoice.client.nif_cif}</p>` : ''}
          ${invoice.client?.address ? `<p>${invoice.client.address}</p>` : ''}
          ${invoice.client?.city && invoice.client?.postal_code ? `<p>${invoice.client.postal_code} ${invoice.client.city}</p>` : ''}
        </div>
        <div class="info-box">
          <h3>Información de Factura</h3>
          <p><strong>Fecha emisión:</strong> ${formatDate(invoice.issue_date)}</p>
          <p><strong>Fecha vencimiento:</strong> ${formatDate(invoice.due_date)}</p>
          <p><strong>Estado:</strong> ${statusMap[invoice.status]?.label || invoice.status}</p>
          ${invoice.payment_date ? `<p><strong>Fecha pago:</strong> ${formatDate(invoice.payment_date)}</p>` : ''}
        </div>
      </div>

      ${invoice.items && invoice.items.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th class="text-center">Cantidad</th>
              <th class="text-right">Precio Unit.</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td class="text-center">${item.quantity} ${item.unit_type || ''}</td>
                <td class="text-right">${formatCurrency(item.unit_price)}</td>
                <td class="text-right">${formatCurrency(item.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <div class="totals">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(invoice.subtotal)}</span>
        </div>
        <div class="totals-row">
          <span>IVA (${invoice.vat_percentage}%):</span>
          <span>${formatCurrency(invoice.vat_amount)}</span>
        </div>
        ${invoice.irpf_amount > 0 ? `
          <div class="totals-row">
            <span>IRPF (${invoice.irpf_percentage}%):</span>
            <span style="color: #c53030;">-${formatCurrency(invoice.irpf_amount)}</span>
          </div>
        ` : ''}
        <div class="totals-row final">
          <span>TOTAL:</span>
          <span>${formatCurrency(invoice.total)}</span>
        </div>
      </div>

      ${invoice.notes ? `
        <div class="notes">
          <h3>Notas</h3>
          <p>${invoice.notes}</p>
        </div>
      ` : ''}

      <div class="footer">
        <p>Generado el ${now} por Anclora Flow</p>
        ${invoice.verifactu_csv ? `<p>CSV Verifactu: ${invoice.verifactu_csv}</p>` : ''}
      </div>
    </body>
    </html>
  `;
}

// === RENDERIZADO ===

function renderLoadingState() {
  const tbody = document.querySelector('.invoices-table tbody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 3rem;">
          <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #4299e1; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="margin-top: 1rem; color: #718096;">Cargando facturas...</p>
        </td>
      </tr>
    `;
  }

  // Añadir animación de spinner si no existe
  if (!document.getElementById('spinner-animation')) {
    const style = document.createElement('style');
    style.id = 'spinner-animation';
    style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }
}

function renderErrorState(message) {
  const tbody = document.querySelector('.invoices-table tbody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 3rem;">
          <p style="color: #c53030; font-size: 1.1rem; margin-bottom: 1rem;">⚠️ Error al cargar facturas</p>
          <p style="color: #718096; margin-bottom: 1.5rem;">${message}</p>
          <button onclick="loadInvoices()" class="btn-primary">Reintentar</button>
        </td>
      </tr>
    `;
  }
}

function renderInvoiceRows() {
  if (!invoicesData || invoicesData.length === 0) {
    return `
      <tr>
        <td colspan="9" style="text-align: center; padding: 3rem;">
          <p style="color: #718096; font-size: 1.1rem;">No hay facturas todavía</p>
          <p style="color: #a0aec0; margin-top: 0.5rem;">Crea tu primera factura para empezar</p>
        </td>
      </tr>
    `;
  }

  // Aplicar filtros
  let filteredInvoices = invoicesData;

  if (currentFilters.search) {
    const search = currentFilters.search.toLowerCase();
    filteredInvoices = filteredInvoices.filter(inv =>
      inv.number.toLowerCase().includes(search) ||
      inv.client.toLowerCase().includes(search)
    );
  }

  if (currentFilters.status !== 'all') {
    filteredInvoices = filteredInvoices.filter(inv => inv.status === currentFilters.status);
  }

  if (currentFilters.client !== 'all') {
    filteredInvoices = filteredInvoices.filter(inv =>
      inv.client.toLowerCase() === currentFilters.client
    );
  }

  const total = filteredInvoices.length;
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pagedInvoices = filteredInvoices.slice(startIdx, startIdx + PAGE_SIZE);

  if (pagedInvoices.length === 0) {
    return `
      <tr>
        <td colspan="9" style="text-align: center; padding: 3rem;">
          <p style="color: #718096;">No hay facturas que coincidan con los filtros o la página seleccionada</p>
        </td>
      </tr>
    `;
  }

  return pagedInvoices.map(invoice => {
    const statusInfo = statusMap[invoice.status] || statusMap.draft;
    const verifactuInfo = verifactuStatusMap[invoice.verifactuStatus] || verifactuStatusMap.not_registered;

    // Determinar acciones de Verifactu
    let verifactuActions = '';

    if (invoice.verifactuStatus === 'registered') {
      verifactuActions = `
        <button type="button" class="table-action" title="Ver QR Verifactu" onclick="showVerifactuQRModal('${invoice.id}')">
          <span>🔲</span>
        </button>
        <button type="button" class="table-action" title="Ver CSV" onclick="showVerifactuCSVModal('${invoice.id}')">
          <span>🔐</span>
        </button>
      `;
    } else if (invoice.verifactuStatus === 'not_registered') {
      verifactuActions = `
        <button type="button" class="table-action table-action--primary" title="Registrar en Verifactu" onclick="registerInvoiceVerifactu('${invoice.id}')">
          <span>📋</span>
        </button>
      `;
    } else if (invoice.verifactuStatus === 'pending') {
      verifactuActions = `
        <button type="button" class="table-action" disabled title="Registro pendiente">
          <span>⏳</span>
        </button>
      `;
    } else if (invoice.verifactuStatus === 'error') {
      verifactuActions = `
        <button type="button" class="table-action table-action--retry" title="Reintentar registro - ${invoice.verifactuError || 'Error desconocido'}" onclick="registerInvoiceVerifactu('${invoice.id}')">
          <span>🔄</span>
        </button>
      `;
    }

    const isSelected = String(invoice.id) === String(selectedInvoiceId);
    return `
      <tr data-invoice-id="${invoice.id}" 
          class="invoices-table__row table-row-clickable ${isSelected ? ' is-selected' : ''}"
          onclick="handleRowClick(event, '${invoice.id}')">
        <td data-label="Nº Factura" ${visibleColumns.number ? '' : 'hidden'}>
          <span class="invoices-table__number">${invoice.number}</span>
        </td>
        <td data-label="Cliente" ${visibleColumns.client ? '' : 'hidden'}>
          <span class="invoices-table__client">${invoice.client}</span>
        </td>
        <td data-label="F. Emisión" class="hide-mobile" ${visibleColumns.issueDate ? '' : 'hidden'}>
          <time datetime="${invoice.issueDate}">${formatDate(invoice.issueDate)}</time>
        </td>
        <td data-label="F. Vencimiento" class="hide-mobile" ${visibleColumns.dueDate ? '' : 'hidden'}>
          <time datetime="${invoice.dueDate}">${formatDate(invoice.dueDate)}</time>
        </td>
        <td data-label="Importe" ${visibleColumns.total ? '' : 'hidden'}>
          <span class="invoices-table__amount">${formatCurrency(invoice.total)}</span>
        </td>
        <td data-label="Estado" ${visibleColumns.status ? '' : 'hidden'}>
          <span class="status-pill status-pill--${statusInfo.tone}">
            <span class="status-pill__dot"></span>
            ${statusInfo.label}
          </span>
        </td>
        <td data-label="Verifactu" class="hide-mobile" ${visibleColumns.verifactu ? '' : 'hidden'}>
          <div style="display: flex; gap: 0.25rem;">
            <span class="status-pill status-pill--${verifactuInfo.tone}" title="${verifactuInfo.label}">
              ${verifactuInfo.label}
            </span>
            ${verifactuActions}
          </div>
        </td>
        <td data-label="Días" class="hide-mobile" ${visibleColumns.days ? '' : 'hidden'}>
          <span class="invoices-table__days ${invoice.daysLate.includes('tarde') ? 'text-danger' : ''}">${invoice.daysLate}</span>
        </td>
        <td data-label="ACCIONES" class="invoices-table__actions">
          <button type="button" class="btn-ghost btn-sm" onclick="viewInvoice('${invoice.id}')" title="Ver Detalles">👁️</button>
          <button type="button" class="btn-ghost btn-sm" onclick="editInvoice('${invoice.id}')" title="Editar Factura" ${invoice.status !== 'draft' ? 'disabled' : ''}>✏️</button>
          <button type="button" class="btn-ghost btn-sm" onclick="openAddPaymentModal('${invoice.id}')" title="Registrar Pago" ${invoice.status === 'paid' ? 'disabled' : ''}>💰</button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderInvoicesTable() {
  const container = document.querySelector('.invoices-table-container');
  if (!container) return;

  // 1. TOOLBAR (Fase 4)
  const toolbarHTML = `
    <div class="table-toolbar">
      <button class="btn-config-columns" onclick="openColumnConfigModal()" title="Configurar qué columnas mostrar">
        ⚙️ Columnas
      </button>
      <input 
        type="text" 
        id="table-search"
        class="search-input" 
        placeholder="Buscar por número o cliente..."
        value="${currentFilters.search || ''}"
        oninput="handleTableSearch(this.value)"
      >
      <div style="flex: 1;"></div>
    </div>
  `;

  // 2. TABLA (Refactorizada para Phase 4)
  const tableHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th data-column="number" ${visibleColumns.number ? '' : 'hidden'}>Número</th>
            <th data-column="client" ${visibleColumns.client ? '' : 'hidden'}>Cliente</th>
            <th data-column="issueDate" class="hide-mobile" ${visibleColumns.issueDate ? '' : 'hidden'}>Emisión</th>
            <th data-column="dueDate" class="hide-mobile" ${visibleColumns.dueDate ? '' : 'hidden'}>Vencimiento</th>
            <th data-column="total" ${visibleColumns.total ? '' : 'hidden'}>Importe</th>
            <th data-column="status" ${visibleColumns.status ? '' : 'hidden'}>Estado</th>
            <th data-column="verifactu" class="hide-mobile" ${visibleColumns.verifactu ? '' : 'hidden'}>Verifactu</th>
            <th data-column="days" class="hide-mobile" ${visibleColumns.days ? '' : 'hidden'}>Días</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${renderInvoiceRows()}
        </tbody>
      </table>
    </div>
  `;

  // 3. PAGINACIÓN (Fase 4)
  const filteredCount = getFilteredInvoicesCount();
  const totalPages = Math.ceil(filteredCount / PAGE_SIZE) || 1;
  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, filteredCount);

  const paginationHTML = filteredCount > PAGE_SIZE ? `
    <div class="pagination">
      <button class="btn-paginate" onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''}>
        ← Anterior
      </button>
      <div class="page-numbers">
        ${renderPageNumbers(totalPages)}
      </div>
      <button class="btn-paginate" onclick="changePage(1)" ${currentPage === totalPages ? 'disabled' : ''}>
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

function renderPageNumbers(totalPages) {
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
        ${i}
      </button>
    `;
  }
  return html;
}

function getFilteredInvoicesCount() {
  let filtered = invoicesData;
  if (currentFilters.search) {
    const search = currentFilters.search.toLowerCase();
    filtered = filtered.filter(inv =>
      inv.number.toLowerCase().includes(search) ||
      inv.client.toLowerCase().includes(search)
    );
  }
  if (currentFilters.status !== 'all') {
    filtered = filtered.filter(inv => inv.status === currentFilters.status);
  }
  return filtered.length;
}

function handleTableSearch(value) {
  currentFilters.search = value;
  currentPage = 1;
  renderInvoicesTable();
}

function changePage(delta) {
  currentPage += delta;
  renderInvoicesTable();
}

function goToPage(page) {
  currentPage = page;
  renderInvoicesTable();
}

function updateResultCount() {
  const countEl = document.querySelector('[data-result-count]');
  if (countEl && invoicesData) {
    countEl.textContent = `Mostrando ${invoicesData.length} factura(s)`;
  }
}

function handleRowClick(event, invoiceId) {
  // Evitar abrir drawer si se hace clic en botones de acción
  if (event.target.closest('button')) return;

  const invoice = invoicesData.find(inv => String(inv.id) === String(invoiceId));
  if (!invoice) return;

  openInvoiceDrawer(invoice);
}

function openInvoiceDrawer(invoice) {
  let drawer = document.getElementById('details-drawer');
  let overlay = document.getElementById('drawer-overlay');

  if (!drawer) {
    const drawerHTML = `
      <div class="drawer-overlay" id="drawer-overlay" onclick="closeInvoiceDrawer()"></div>
      <div class="drawer" id="details-drawer">
        <header class="drawer__header">
          <h2 class="drawer__title">Detalles rápidos</h2>
          <button class="drawer__close" onclick="closeInvoiceDrawer()">&times;</button>
        </header>
        <div class="drawer__body" id="drawer-body"></div>
        <footer class="drawer__footer">
          <button class="btn-primary" id="drawer-view-full">Ver detalle completo</button>
          <button class="btn-secondary" onclick="closeInvoiceDrawer()">Cerrar</button>
        </footer>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', drawerHTML);
    drawer = document.getElementById('details-drawer');
    overlay = document.getElementById('drawer-overlay');
  }

  const body = document.getElementById('drawer-body');
  const statusInfo = statusMap[invoice.status] || statusMap.draft;

  body.innerHTML = `
    <div class="field-group">
      <label class="field-label">Nº Factura</label>
      <span class="field-value" style="font-size: 1.25rem; font-weight: 700;">${invoice.number}</span>
    </div>
    <div class="field-group">
      <label class="field-label">Cliente</label>
      <span class="field-value">${invoice.client}</span>
    </div>
    <div class="field-group">
      <label class="field-label">Estado</label>
      <span class="status-pill status-pill--${statusInfo.tone}">
        <span class="status-pill__dot"></span>
        ${statusInfo.label}
      </span>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
      <div class="field-group">
        <label class="field-label">Fecha Emisión</label>
        <span class="field-value">${formatDate(invoice.issueDate)}</span>
      </div>
      <div class="field-group">
        <label class="field-label">Vencimiento</label>
        <span class="field-value">${formatDate(invoice.dueDate)}</span>
      </div>
    </div>
    <div class="field-group" style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
      <label class="field-label">Importe Total</label>
      <span class="field-value" style="font-size: 1.5rem; color: var(--primary-color); font-weight: 700;">${formatCurrency(invoice.total)}</span>
    </div>
    <div class="field-group">
      <label class="field-label">Notas</label>
      <span class="field-value">${invoice.notes || 'Sin notas'}</span>
    </div>
  `;

  document.getElementById('drawer-view-full').onclick = () => {
    closeInvoiceDrawer();
    viewInvoice(invoice.id);
  };

  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    drawer.classList.add('is-open');
  });
}

function closeInvoiceDrawer() {
  const drawer = document.getElementById('details-drawer');
  const overlay = document.getElementById('drawer-overlay');
  if (drawer) drawer.classList.remove('is-open');
  if (overlay) overlay.classList.remove('is-open');
}

function openColumnConfigModal() {
  let modal = document.getElementById('column-config-modal');
  if (!modal) {
    const modalHTML = `
      <div class="modal is-open" id="column-config-modal">
        <div class="modal__backdrop" onclick="closeColumnConfigModal()"></div>
        <div class="modal__panel modal__panel--sm" style="max-height: 80vh;">
          <header class="modal__head">
            <div>
              <h2 class="modal__title">Configurar Columnas</h2>
              <p class="modal__subtitle">Selecciona qué columnas ver en la tabla</p>
            </div>
            <button class="modal__close" onclick="closeColumnConfigModal()">&times;</button>
          </header>
          <div class="modal__body">
            <div class="column-options" style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${Object.keys(visibleColumns).map(key => {
                const labels = {
                  number: 'Número (Fijo)',
                  client: 'Cliente',
                  issueDate: 'F. Emisión',
                  dueDate: 'F. Vencimiento',
                  total: 'Importe',
                  status: 'Estado',
                  verifactu: 'Verifactu',
                  days: 'Días'
                };
                const isFixed = key === 'number' || key === 'total';
                return `
                  <label style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: 8px; cursor: ${isFixed ? 'not-allowed' : 'pointer'};">
                    <input type="checkbox" id="col-${key}" ${visibleColumns[key] ? 'checked' : ''} ${isFixed ? 'disabled' : ''}>
                    <span>${labels[key]}</span>
                  </label>
                `;
              }).join('')}
            </div>
          </div>
          <footer class="modal__footer">
            <button class="btn-secondary" onclick="closeColumnConfigModal()">Cancelar</button>
            <button class="btn-primary" onclick="applyColumnConfig()">Aplicar cambios</button>
          </footer>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modal = document.getElementById('column-config-modal');
  } else {
    modal.classList.add('is-open');
    modal.style.display = 'flex';
  }
}

function closeColumnConfigModal() {
  const modal = document.getElementById('column-config-modal');
  if (modal) {
    modal.classList.remove('is-open');
    modal.style.display = 'none';
  }
}

function applyColumnConfig() {
  Object.keys(visibleColumns).forEach(key => {
    const input = document.getElementById(`col-${key}`);
    if (input) {
      visibleColumns[key] = input.checked;
    }
  });
  renderInvoicesTable();
  closeColumnConfigModal();
  showNotification('Columnas actualizadas correctamente', 'success');
}

// === INICIALIZACIÓN ===

export function initInvoicesPage() {
  console.log('Inicializando módulo de facturas con API...');

  // Hacer funciones globales para que funcionen los onclick en el HTML
  window.loadInvoices = loadInvoices;
  window.registerInvoiceVerifactu = registerInvoiceVerifactu;
  window.showVerifactuQRModal = showVerifactuQRModal;
  window.showVerifactuCSVModal = showVerifactuCSVModal;
  window.showNotification = showNotification;
  window.viewInvoice = viewInvoice;
  window.editInvoice = editInvoice;
  window.saveInvoiceChanges = saveInvoiceChanges;
  window.closeEditInvoiceModal = closeEditInvoiceModal;
  window.downloadInvoicePDF = downloadInvoicePDF;
  window.openNewInvoiceModal = openNewInvoiceModal;
  window.submitNewInvoice = submitNewInvoice;
  window.closeNewInvoiceModal = closeNewInvoiceModal;

  // Cargar facturas automáticamente
  loadInvoices();

  // Configurar filtros
  setupFilters();

  const newInvoiceButton = document.querySelector('[data-modal-open=\"invoice\"]');
  if (newInvoiceButton) {
    newInvoiceButton.addEventListener('click', openNewInvoiceModal);
  }
}

function setupFilters() {
  // Buscar facturas
  const searchInput = document.querySelector('[data-invoices-search]');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilters.search = e.target.value;
      renderInvoicesTable();
    });
  }

  // Filtro por estado
  const statusFilter = document.querySelector('[data-invoices-filter="status"]');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      currentFilters.status = e.target.value;
      renderInvoicesTable();
    });
  }

  // Filtro por cliente
  const clientFilter = document.querySelector('[data-invoices-filter="client"]');
  if (clientFilter) {
    clientFilter.addEventListener('change', (e) => {
      currentFilters.client = e.target.value;
      renderInvoicesTable();
    });
  }

  // Manejar selección de filas
  const tbody = document.querySelector('.invoices-table tbody');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      // Ignorar clics en botones y enlaces
      if (e.target.closest('button') || e.target.closest('a')) {
        return;
      }

      const row = e.target.closest('tr[data-invoice-id]');
      if (row) {
        const invoiceId = String(row.dataset.invoiceId);
        // Solo cambiar si es diferente (no deseleccionar)
        if (selectedInvoiceId !== invoiceId) {
          selectedInvoiceId = invoiceId;
          console.log('Factura seleccionada:', selectedInvoiceId);
          renderInvoicesTable();
        }
      }
    });
  }
}

// ==========================================
// MODAL: AÑADIR COBRO
// ==========================================

async function openAddPaymentModal(invoiceId = null) {
  try {
    // showNotification('Preparando formulario de pago...', 'info');

    // Si no se proporciona invoiceId, buscar la factura seleccionada
    const targetInvoiceId = invoiceId || selectedInvoiceId;
    
    if (!targetInvoiceId) {
      showNotification('Por favor, selecciona una factura para registrar el pago', 'warning');
      return;
    }

    // Obtener datos de la factura
    let invoice = null;
    try {
      invoice = await window.api.getInvoiceById(targetInvoiceId);
      if (!invoice) {
        showNotification('No se pudo cargar la factura', 'error');
        return;
      }
    } catch (error) {
      console.error('Error al cargar factura:', error);
      showNotification('Error al cargar los datos de la factura', 'error');
      return;
    }

    // Calcular el importe pendiente (total - pagos ya registrados)
    const totalInvoice = sanitizeNumber(invoice.total, 0);
    const alreadyPaid = sanitizeNumber(invoice.paidAmount || invoice.paid_amount, 0);
    const remainingAmount = Math.max(0, totalInvoice - alreadyPaid);

    const today = new Date().toISOString().split('T')[0];

    // MODAL COMPACTO - SIN SCROLL
    const modalHTML = `
      <div class="modal is-open" id="add-payment-modal" style="display: flex; align-items: center; justify-content: center;">
        <div class="modal__backdrop" onclick="closeAddPaymentModal()"></div>
        
        <div class="modal__panel" style="width: 100%; max-width: 650px; margin: auto; max-height: 90vh; display: flex; flex-direction: column;">
          <!-- Header Compacto -->
          <div style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface);">
            <div>
              <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">💰 Registrar Pago</h2>
              <div style="margin-top: 0.25rem; font-size: 0.85rem; color: var(--text-secondary);">
                Factura: <strong style="color: var(--primary-color);">${escapeHtml(invoice.invoice_number || invoice.invoiceNumber)}</strong>
                ${invoice.client_name ? `• ${escapeHtml(invoice.client_name)}` : ''}
              </div>
            </div>
            <button type="button" onclick="closeAddPaymentModal()" style="background: none; border: none; font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; padding: 0;">&times;</button>
          </div>
          
          <!-- Body -->
          <div style="padding: 1.25rem 1.5rem; overflow-y: auto;">
            <form id="add-payment-form">
              <!-- Info Banner Inline -->
              <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Pagado</div>
                  <div style="font-size: 1.1rem; font-weight: 700; color: #047857;">${formatCurrency(alreadyPaid)}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Pendiente</div>
                  <div style="font-size: 1.1rem; font-weight: 700; color: ${remainingAmount > 0 ? '#b45309' : '#047857'};">${formatCurrency(remainingAmount)}</div>
                </div>
              </div>

              <!-- Form Fields - Grid Layout -->
              <div style="display: grid; gap: 1rem;">
                
                <!-- Row 1: Amount & Date & Method -->
                <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 1rem;">
                  <div>
                    <label for="payment-amount" style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.85rem; color: var(--text-primary);">
                      Importe <span style="color: #ef4444;">*</span>
                    </label>
                    <div style="position: relative;">
                      <input type="number" id="payment-amount" name="amount" value="${remainingAmount.toFixed(2)}" step="0.01" min="0.01" max="${remainingAmount}" required 
                        class="form-input" style="width: 100%; font-weight: 600;" placeholder="0.00" />
                      <span style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-size: 0.85rem;">€</span>
                    </div>
                  </div>

                  <div>
                    <label for="payment-date" style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.85rem; color: var(--text-primary);">
                      Fecha <span style="color: #ef4444;">*</span>
                    </label>
                    <input type="date" id="payment-date" name="payment_date" value="${today}" max="${today}" required class="form-input" style="width: 100%;" />
                  </div>

                  <div>
                    <label for="payment-method" style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.85rem; color: var(--text-primary);">
                      Método <span style="color: #ef4444;">*</span>
                    </label>
                    <select id="payment-method" name="payment_method" required class="form-input" style="width: 100%;">
                      <option value="">Seleccionar...</option>
                      <option value="bank_transfer" selected>Transferencia</option>
                      <option value="card">Tarjeta</option>
                      <option value="cash">Efectivo</option>
                      <option value="paypal">PayPal</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                </div>

                <!-- Row 2: Transaction ID & Notes -->
                <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 1rem;">
                  <div>
                    <label for="payment-transaction-id" style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.85rem; color: var(--text-primary);">
                      ID Transacción <span style="font-weight: 400; color: var(--text-secondary); font-size: 0.75rem;">(Op.)</span>
                    </label>
                    <input type="text" id="payment-transaction-id" name="transaction_id" placeholder="Ej: TRX-123" maxlength="100" class="form-input" style="width: 100%;" />
                  </div>
                  <div>
                    <label for="payment-notes" style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.85rem; color: var(--text-primary);">
                      Notas <span style="font-weight: 400; color: var(--text-secondary); font-size: 0.75rem;">(Op.)</span>
                    </label>
                    <input type="text" id="payment-notes" name="notes" placeholder="Observaciones..." maxlength="200" class="form-input" style="width: 100%;" />
                  </div>
                </div>

              </div>

              <input type="hidden" name="invoice_id" value="${targetInvoiceId}" />
            </form>
          </div>
          
          <!-- Footer Compacto -->
          <footer style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 0.75rem; background: var(--bg-surface); border-bottom-left-radius: 16px; border-bottom-right-radius: 16px;">
            <button type="button" class="btn-secondary" onclick="closeAddPaymentModal()" style="padding: 0.5rem 1rem;">
              Cancelar
            </button>
            <button type="button" class="btn-primary" onclick="submitAddPayment()" style="padding: 0.5rem 1.5rem; font-weight: 600;">
              Registrar Pago
            </button>
          </footer>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Validación de importe en tiempo real (sin cambios)
    const amountInput = document.getElementById('payment-amount');
    if (amountInput) {
      amountInput.addEventListener('input', () => {
        const value = sanitizeNumber(amountInput.value, 0);
        if (value > remainingAmount) {
          amountInput.setCustomValidity(`Máximo: ${formatCurrency(remainingAmount)}`);
        } else if (value <= 0) {
          amountInput.setCustomValidity('Debe ser positivo');
        } else {
          amountInput.setCustomValidity('');
        }
      });
    }
    
    // Enfocar importe al abrir
    setTimeout(() => {
        const input = document.getElementById('payment-amount');
        if (input) input.select();
    }, 100);

  } catch (error) {
    console.error('Error al abrir modal de pago:', error);
    showNotification('Error al abrir el formulario de pago', 'error');
  }
}

function closeAddPaymentModal() {
  const modal = document.getElementById('add-payment-modal');
  if (modal) {
    modal.remove();
  }
}

async function submitAddPayment() {
  const form = document.getElementById('add-payment-form');
  if (!form) return;

  const formData = new FormData(form);
  
  // Validar formulario HTML5
  const amountInput = document.getElementById('payment-amount');
  const dateInput = document.getElementById('payment-date');
  const methodSelect = document.getElementById('payment-method');

  if (!amountInput.checkValidity() || !dateInput.checkValidity() || !methodSelect.checkValidity()) {
    amountInput.reportValidity() || dateInput.reportValidity() || methodSelect.reportValidity();
    return;
  }

  const paymentData = {
    invoice_id: formData.get('invoice_id'),
    amount: sanitizeNumber(formData.get('amount'), 0),
    payment_date: formData.get('payment_date'),
    payment_method: formData.get('payment_method'),
    transaction_id: formData.get('transaction_id') || null,
    notes: formData.get('notes') || null
  };

  // Validaciones adicionales
  if (paymentData.amount <= 0) {
    showNotification('El importe del pago debe ser mayor que 0', 'error');
    return;
  }

  if (!paymentData.payment_method) {
    showNotification('Selecciona un método de pago', 'error');
    return;
  }

  try {
    showNotification('Registrando pago...', 'info');

    // Llamar a la API real
    await window.api.addInvoicePayment(paymentData.invoice_id, {
      amount: paymentData.amount,
      paymentDate: paymentData.payment_date,
      paymentMethod: paymentData.payment_method,
      transactionId: paymentData.transaction_id,
      notes: paymentData.notes
    });
    
    showNotification('✅ Pago registrado correctamente', 'success');
    closeAddPaymentModal();
    
    // Recargar la lista de facturas para reflejar el cambio
    await loadInvoices();

  } catch (error) {
    console.error('Error al registrar pago:', error);
    showNotification(
      `Error al registrar pago: ${error.message || 'Error desconocido'}`,
      'error'
    );
  }
}

// Exportar funciones globalmente para que puedan ser usadas desde HTML onclick
window.openAddPaymentModal = openAddPaymentModal;
window.closeAddPaymentModal = closeAddPaymentModal;
window.submitAddPayment = submitAddPayment;
window.openVerifactuConfigModal = openVerifactuConfigModal;
window.saveVerifactuConfig = saveVerifactuConfig;

// Export para uso en módulos
export { loadInvoices, registerInvoiceVerifactu, showVerifactuQRModal, showVerifactuCSVModal, openAddPaymentModal };

// Mantener la función de render original para compatibilidad
export function renderInvoices() {
  const html = `
    <section class="invoices" aria-labelledby="invoices-title">
      <header class="invoices__hero">
        <div class="invoices__hero-copy">
          <h1 id="invoices-title">Ingresos &amp; Facturas</h1>
          <p>Controla facturación, cobros y rendimiento en un panel unificado.</p>
        </div>
        <div class="invoices__hero-actions">
          <button type="button" class="btn-primary" data-modal-open="invoice">Nueva factura</button>
          <button type="button" class="btn-ghost" onclick="window.openAddPaymentModal ? window.openAddPaymentModal() : showNotification('Selecciona una factura primero', 'warning')">Añadir cobro</button>
        </div>
      </header>

      <section class="invoices__filters" aria-label="Filtros de facturas">
        <div class="invoices__filters-group">
          <label class="visually-hidden" for="invoice-search">Buscar facturas</label>
          <input
            type="search"
            id="invoice-search"
            class="invoices__search"
            placeholder="Buscar facturas..."
            autocomplete="off"
            data-invoices-search
          />
        </div>
        <div class="invoices__filters-group">
          <label class="visually-hidden" for="invoice-status">Filtrar por estado</label>
          <select id="invoice-status" class="invoices__select" data-invoices-filter="status">
            <option value="all">Todos los estados</option>
            <option value="paid">Cobradas</option>
            <option value="sent">Enviadas</option>
            <option value="pending">Pendientes</option>
            <option value="overdue">Vencidas</option>
            <option value="draft">Borradores</option>
          </select>
        </div>
        <div class="invoices__filters-group">
          <button type="button" class="btn-ghost" onclick="openVerifactuConfigModal()" title="Configuración Verifactu" style="margin-right: 0.5rem;">
            <span>⚙️</span>
            Verifactu
          </button>
          <button type="button" class="btn-ghost" onclick="loadInvoices()">
            <span>🔄</span>
            Recargar
          </button>
        </div>
      </section>

      <section class="invoices-table" aria-label="Listado de facturas">
        <div class="invoices-table__surface">
          <table>
            <thead>
              <tr>
                <th scope="col">Nº Factura</th>
                <th scope="col">Cliente</th>
                <th scope="col">Fecha Emisión</th>
                <th scope="col">Fecha Vencimiento</th>
                <th scope="col">Importe Total</th>
                <th scope="col">Estado</th>
                <th scope="col">Verifactu</th>
                <th scope="col">Días</th>
                <th scope="col">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <!-- Se llenará dinámicamente -->
            </tbody>
          </table>
        </div>
        <footer class="invoices-table__footer">
          <p data-result-count>Cargando...</p>
        </footer>
      </section>
    </section>
  `;

  // Inicializar después de renderizar
  setTimeout(() => {
    initInvoicesPage();
  }, 100);

  return html;
}

export default renderInvoices;
