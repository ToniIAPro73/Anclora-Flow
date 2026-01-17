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

// Estado temporal para formularios de edición/creación
let invoiceEditState = null;
const invoiceItemEditors = {
  edit: null,
  create: null
};

// Formatters
const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2
});

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

function formatCurrency(value) {
  return currencyFormatter.format(sanitizeNumber(value, 0));
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
    img.style.width = '280px';
    img.style.height = '280px';
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
  img.style.width = '280px';
  img.style.height = '280px';
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

  // Renderizar pestañas
  const tabsContainer = document.getElementById(state.tabsContainerId);
  if (tabsContainer) {
    tabsContainer.innerHTML = state.items.map((item, index) => `
      <button type="button"
              class="invoice-line-tab ${index === state.currentTabIndex ? 'active' : ''}"
              data-tab-index="${index}"
              style="padding: 0.5rem 1rem; background: ${index === state.currentTabIndex ? '#3b82f6' : 'var(--bg-primary)'}; color: ${index === state.currentTabIndex ? 'white' : 'var(--text-secondary)'}; border: 1px solid ${index === state.currentTabIndex ? '#3b82f6' : 'var(--border-color)'}; border-radius: 6px; cursor: pointer; font-size: 0.875rem; font-weight: ${index === state.currentTabIndex ? '600' : '500'}; white-space: nowrap; transition: all 0.2s;">
        Línea ${index + 1}
      </button>
    `).join('');
  }

  // Renderizar línea actual
  const container = document.getElementById(state.containerId);
  if (container) {
    const currentItem = state.items[state.currentTabIndex];
    if (!currentItem) {
      container.innerHTML = '<p style="font-size: 0.9rem; color: var(--text-secondary); text-align: center; padding: 2rem;">No hay líneas de factura. Añade una línea para empezar.</p>';
    } else {
      container.innerHTML = getSingleItemFormMarkup(currentItem, state.currentTabIndex, state.editable, state.items.length > 1);
    }
  }

  // Actualizar botones de navegación
  updateTabNavigation(editorKey);

  updateTotalsDisplay(editorKey);
}

function getSingleItemFormMarkup(item, index, editable, showDelete) {
  return `
    <div class="invoice-item-form" data-index="${index}" style="display: grid; gap: 0.65rem; grid-template-columns: 2.5fr 1fr 0.9fr 1.1fr 0.9fr auto; align-items: end;">
      <div>
        <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.8rem; color: var(--text-secondary);">Concepto *</label>
        <input
          type="text"
          class="form-input"
          data-field="description"
          value="${escapeHtml(item.description)}"
          ${editable ? '' : 'disabled'}
          placeholder="Servicio o producto"
          style="width: 100%;"
        />
      </div>
      <div>
        <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.8rem; color: var(--text-secondary);">Unidad</label>
        <input
          type="text"
          class="form-input"
          data-field="unitType"
          value="${escapeHtml(item.unitType)}"
          ${editable ? '' : 'disabled'}
          placeholder="unidad"
          style="width: 100%;"
        />
      </div>
      <div>
        <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.8rem; color: var(--text-secondary);">Cantidad</label>
        <input
          type="number"
          class="form-input"
          data-field="quantity"
          value="${sanitizeNumber(item.quantity, 1)}"
          step="0.01"
          min="0"
          ${editable ? '' : 'disabled'}
          style="width: 100%;"
        />
      </div>
      <div>
        <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.8rem; color: var(--text-secondary);">Precio unit.</label>
        <input
          type="number"
          class="form-input"
          data-field="unitPrice"
          value="${sanitizeNumber(item.unitPrice, 0)}"
          step="0.01"
          min="0"
          ${editable ? '' : 'disabled'}
          style="width: 100%;"
        />
      </div>
      <div>
        <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.8rem; color: var(--text-secondary);">IVA (%)</label>
        <input
          type="number"
          class="form-input"
          data-field="vatPercentage"
          value="${sanitizeNumber(item.vatPercentage, 21)}"
          step="0.1"
          min="0"
          max="100"
          ${editable ? '' : 'disabled'}
          style="width: 100%;"
        />
      </div>
      <div>
        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; color: transparent;">-</label>
        ${editable && showDelete ? `
          <button type="button" class="btn-icon btn-icon--danger" data-action="delete-item" title="Eliminar línea" style="padding: 0.6rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; cursor: pointer; color: #ef4444;">🗑️</button>
        ` : ''}
      </div>
    </div>
    <div style="margin-top: 0.5rem; padding: 0.5rem 0.75rem; background: var(--bg-primary); border-radius: 6px; display: flex; gap: 1rem; font-size: 0.75rem; align-items: center; border-left: 3px solid #3b82f6;">
      <div style="display: flex; align-items: center; gap: 0.4rem;">
        <span style="color: var(--text-secondary); font-weight: 500;">Subtotal:</span>
        <strong style="color: var(--text-primary);">${currencyFormatter.format(calculateLineSubtotal(item))}</strong>
      </div>
      <div style="display: flex; align-items: center; gap: 0.4rem;">
        <span style="color: var(--text-secondary); font-weight: 500;">IVA:</span>
        <strong style="color: var(--text-primary);">${currencyFormatter.format(calculateLineVat(item))}</strong>
      </div>
      <div style="display: flex; align-items: center; gap: 0.35rem;">
        <span style="color: var(--text-secondary); font-weight: 500;">Total:</span>
        <strong style="color: #3b82f6;">${currencyFormatter.format(calculateLineTotal(item))}</strong>
      </div>
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

  // Re-renderizar solo la línea actual para actualizar totales de línea
  renderItemsEditorWithTabs(editorKey);
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
          <button type="button" class="btn-ghost" data-action="remove-item" aria-label="Eliminar linea">Eliminar linea</button>
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
    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
      <span>Subtotal</span>
      <strong>${formatCurrency(totals.subtotal)}</strong>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
      <span>IVA estimado (${totals.vatPercentage.toFixed(2)}%)</span>
      <strong>${formatCurrency(totals.vatAmount)}</strong>
    </div>
    ${state.allowIrpfEdit
      ? `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
          <label for="${irpfFieldId}" style="font-weight: 600; color: var(--text-secondary);">IRPF (%)</label>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <input
              id="${irpfFieldId}"
              type="number"
              class="form-input"
              style="width: 110px;"
              min="0"
              max="100"
              step="0.1"
              value="${state.irpfPercentage}"
              data-totals-field="irpfPercentage"
            />
            <span style="font-weight: 600; color: var(--text-secondary);">${formatCurrency(totals.irpfAmount)}</span>
          </div>
        </div>
      `
      : `
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>IRPF (${state.irpfPercentage}%)</span>
          <strong>${formatCurrency(totals.irpfAmount)}</strong>
        </div>
      `}
    <div style="display: flex; justify-content: space-between; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
      <span>Total</span>
      <strong>${formatCurrency(totals.total)}</strong>
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
      container.style.display = 'block';
      if (input && !input.value) {
        const value = initialPaymentDate || new Date();
        input.value = formatDateForInput(value);
      }
    } else {
      container.style.display = 'none';
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
    invoicesData = invoicesData.map(invoice => ({
      id: invoice.id,
      number: invoice.invoice_number,
      client: invoice.client_name,
      clientEmail: invoice.client_email,
      clientNif: invoice.client_nif,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      total: invoice.total,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      status: invoice.status,
      daysLate: calculateDaysLate(invoice.due_date, invoice.status),
      verifactuStatus: invoice.verifactu_status || 'not_registered',
      verifactuCsv: invoice.verifactu_csv,
      verifactuQrCode: invoice.verifactu_qr_code,
      verifactuUrl: invoice.verifactu_url,
      verifactuHash: invoice.verifactu_hash,
      verifactuError: invoice.verifactu_error_message
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
      invoice.verifactuStatus = updatedInvoice.verifactu_status || 'registered';
      invoice.verifactuCsv = updatedInvoice.verifactu_csv;
      invoice.verifactuQrCode = updatedInvoice.verifactu_qr_code;
      invoice.verifactuUrl = updatedInvoice.verifactu_url;
      invoice.verifactuHash = updatedInvoice.verifactu_hash;

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

    // Actualizar estado a error
    const invoice = invoicesData.find(inv => inv.id === invoiceId);
    if (invoice) {
      invoice.verifactuStatus = 'error';
      invoice.verifactuError = error.message;
      renderInvoicesTable();
    }

    showNotification(`Error: ${error.message}`, 'error');
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
      <div class="modal__panel" style="max-width: 600px;">
        <header class="modal__head">
          <div>
            <h2 class="modal__title">Codigo QR - Verifactu</h2>
            <p class="modal__subtitle">Factura ${invoice.number}</p>
          </div>
          <button type="button" class="modal__close" onclick="document.getElementById('verifactu-qr-modal').remove()">&times;</button>
        </header>
        <div class="modal__body" style="padding: 2rem;">
          ${invoice.verifactuCsv ? `
            <div style="text-align: center; margin-bottom: 2rem;">
              <p style="color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.875rem;">Codigo Seguro de Verificacion</p>
              <p style="color: var(--text-primary); font-size: 1.125rem; font-weight: 600;">
                <code style="background: var(--bg-secondary); padding: 0.5rem 1rem; border-radius: 6px; font-family: monospace; color: var(--text-primary); letter-spacing: 1px;">
                  ${invoice.verifactuCsv}
                </code>
              </p>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: center; margin-bottom: 2rem;">
            <div id="verifactu-qr-image" style="padding: 1.5rem; background: var(--bg-primary, #ffffff); border-radius: 12px; border: 1px solid var(--border-color); box-shadow: 0 4px 6px rgba(0,0,0,0.08);">
            </div>
          </div>
          <p style="font-size: 0.9rem; color: var(--text-secondary); text-align: center;">
            Escanea este codigo QR para verificar la factura.
          </p>
          ${verificationUrl ? `
            <div style="text-align: center; margin-top: 1rem;">
              ${isTestUrl ? `
                <p style="font-size: 0.85rem; color: var(--text-secondary); font-style: italic;">
                  Enlace de modo test. La verificacion oficial puede no estar disponible.
                </p>
              ` : `
                <a href="${verificationUrl}" target="_blank" rel="noopener" class="btn-secondary" style="text-decoration: none; display: inline-block;">
                  Abrir enlace AEAT
                </a>
              `}
            </div>
          ` : `
            <div style="text-align: center; margin-top: 1rem;">
              <p style="font-size: 0.85rem; color: var(--text-secondary); font-style: italic;">
                Todavia no hay un enlace publico disponible.
              </p>
            </div>
          `}
        </div>
        <footer class="modal__footer" style="display: flex; gap: 0.75rem;">
          <button class="btn-secondary" style="flex: 1;" onclick="document.getElementById('verifactu-qr-modal').remove()">Cerrar</button>
          ${qrDownloadSrc ? `
            <a href="${qrDownloadSrc}" download="verifactu-qr-${invoice.number}.png" class="btn-primary" style="flex: 1; text-decoration: none; display: flex; align-items: center; justify-content: center;">
              Descargar QR
            </a>
          ` : `
            <button class="btn-primary" style="flex: 1;" disabled>QR no disponible</button>
          `}
        </footer>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  renderVerifactuQrImage(invoice, 'verifactu-qr-image');
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
        <footer class="modal__footer">
          <button class="btn-secondary" onclick="document.getElementById('verifactu-csv-modal').remove()">Cerrar</button>
          <button class="btn-primary" onclick="navigator.clipboard.writeText('${invoice.verifactuCsv}').then(() => showNotification('CSV copiado al portapapeles', 'success'))">
            Copiar CSV
          </button>
        </footer>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// === ACCIONES DE FACTURA ===

// Ver detalles de factura
async function viewInvoice(invoiceId) {
  try {
    showNotification('Cargando detalles de la factura...', 'info');

    const invoice = await window.api.getInvoice(invoiceId);

    const modalHTML = `
      <div class="modal is-open" id="view-invoice-modal">
        <div class="modal__backdrop" onclick="document.getElementById('view-invoice-modal').remove()"></div>
        <div class="modal__panel" style="width: min(95vw, 1400px); max-width: 1400px; max-height: 92vh; display: flex; flex-direction: column;">
          <header class="modal__head" style="flex-shrink: 0;">
            <div>
              <h2 class="modal__title">Factura ${invoice.invoice_number}</h2>
              <p class="modal__subtitle">Detalles completos de la factura</p>
            </div>
            <button type="button" class="modal__close" onclick="document.getElementById('view-invoice-modal').remove()">×</button>
          </header>
          <div class="modal__body" style="flex: 1; overflow-y: hidden; padding: 1.75rem;">
            <div style="display: flex; flex-direction: column; gap: 1.5rem; height: 100%; min-height: 0;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.25rem; padding: 1.1rem 1.25rem; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border-color);">
                <div>
                  <h3 style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Cliente</h3>
                  <p style="font-size: 0.95rem; color: var(--text-primary); font-weight: 500;">${invoice.client?.name || invoice.client_name || 'Sin cliente'}</p>
                  ${invoice.client?.email ? `<p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">${invoice.client.email}</p>` : ''}
                </div>
                <div>
                  <h3 style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Estado</h3>
                  <span class="status-pill status-pill--${statusMap[invoice.status]?.tone || 'draft'}">
                    ${statusMap[invoice.status]?.label || invoice.status}
                  </span>
                </div>
                <div>
                  <h3 style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">F. Emisión</h3>
                  <p style="font-size: 0.95rem; color: var(--text-primary); font-weight: 500;">${formatDate(invoice.issue_date)}</p>
                </div>
                <div>
                  <h3 style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">F. Vencimiento</h3>
                  <p style="font-size: 0.95rem; color: var(--text-primary); font-weight: 500;">${formatDate(invoice.due_date)}</p>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: minmax(0, 1.9fr) minmax(0, 1fr); gap: 1.5rem; flex: 1; min-height: 0;">
                <section style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1.15rem; background: var(--bg-secondary); display: flex; flex-direction: column; min-height: 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-primary);">Líneas de factura</h3>
                  </div>

                  <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1rem; flex-shrink: 0;">
                    <button type="button" class="invoice-tab-nav" id="view-invoice-tab-prev" style="padding: 0.4rem 0.6rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; color: var(--text-primary); font-size: 0.875rem;" disabled>&larr;</button>
                    <div id="view-invoice-tabs" style="display: flex; gap: 0.5rem; flex: 1; overflow-x: auto; scrollbar-width: thin;"></div>
                    <button type="button" class="invoice-tab-nav" id="view-invoice-tab-next" style="padding: 0.4rem 0.6rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; color: var(--text-primary); font-size: 0.875rem;" disabled>&rarr;</button>
                  </div>

                  <div id="view-invoice-items" style="flex: 1; display: flex; flex-direction: column; min-height: 0;"></div>
                </section>

                <aside style="display: flex; flex-direction: column; gap: 1rem; min-height: 0;">
                  <div id="view-invoice-totals" style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1.15rem; background: var(--bg-secondary);"></div>
                  ${invoice.notes ? `
                    <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem 1.15rem; background: var(--bg-secondary); color: var(--text-primary); font-size: 0.88rem;">
                      <h3 style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Notas</h3>
                      <p style="margin: 0; white-space: pre-wrap; line-height: 1.45;">${invoice.notes}</p>
                    </div>
                  ` : ''}
                </aside>
              </div>
            </div>
          </div>
          <footer class="modal__footer modal-form__footer">
            <button type="button" class="btn-secondary" onclick="document.getElementById('view-invoice-modal').remove()">Cerrar</button>
            <button type="button" class="btn-primary" onclick="downloadInvoicePDF('${invoice.id}')">Descargar PDF</button>
          </footer>
        </div>
      </div>
    `;

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
      <div class="modal is-open" id="edit-invoice-modal">
        <div class="modal__backdrop" onclick="closeEditInvoiceModal()"></div>
        <div class="modal__panel" style="width: min(95vw, 1400px); max-width: 1400px; max-height: 92vh; display: flex; flex-direction: column;">
          <header class="modal__head" style="flex-shrink: 0;">
            <div>
              <h2 class="modal__title">Editar factura ${invoice.invoice_number}</h2>
              <p class="modal__subtitle">Actualiza datos y conceptos</p>
            </div>
            <button type="button" class="modal__close" onclick="closeEditInvoiceModal()">&times;</button>
          </header>
          <div class="modal__body" style="flex: 1; overflow-y: hidden; padding: 1.75rem;">
            <form id="edit-invoice-form" style="display: flex; flex-direction: column; gap: 1.15rem; height: 100%; min-height: 0;">
              <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
                ${invoice.verifactu_status === 'registered' ? `
                  <div style="flex: 1 1 240px; display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.6rem 0.85rem; border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 8px; background: rgba(59, 130, 246, 0.12); font-size: 0.82rem; line-height: 1.45; color: var(--text-primary);">
                    <span aria-hidden="true" style="font-size: 1rem;">ℹ️</span>
                    <span>Esta factura está registrada en Verifactu. Los cambios no afectan al registro enviado.</span>
                  </div>
                ` : ''}
                <div id="edit-lock-message" style="display: ${invoice.status === 'draft' ? 'none' : 'flex'}; flex: 1 1 240px; align-items: flex-start; gap: 0.6rem; padding: 0.6rem 0.85rem; border-radius: 8px; border: 1px solid rgba(234, 179, 8, 0.4); background: rgba(234, 179, 8, 0.12); font-size: 0.82rem; line-height: 1.45; color: var(--text-primary);">
                  <span aria-hidden="true" style="font-size: 1rem;">⚠️</span>
                  <span>Para editar conceptos e importes cambia el estado a Borrador.</span>
                </div>
              </div>

              <div style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
                <div>
                  <label for="edit-status" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Estado</label>
                  <select id="edit-status" name="status" class="form-input" style="width: 100%;">
                    <option value="draft" ${invoice.status === 'draft' ? 'selected' : ''}>Borrador</option>
                    <option value="pending" ${invoice.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                    <option value="sent" ${invoice.status === 'sent' ? 'selected' : ''}>Enviada</option>
                    <option value="paid" ${invoice.status === 'paid' ? 'selected' : ''}>Cobrada</option>
                    <option value="overdue" ${invoice.status === 'overdue' ? 'selected' : ''}>Vencida</option>
                  </select>
                </div>
                <div style="min-width: 160px;">
                  <label for="edit-issue-date" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">F. Emisión</label>
                  <input type="date" id="edit-issue-date" name="issue_date" class="form-input" value="${issueDateValue || ''}" style="width: 100%;" />
                </div>
                <div style="min-width: 160px;">
                  <label for="edit-due-date" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">F. Vencimiento</label>
                  <input type="date" id="edit-due-date" name="due_date" class="form-input" value="${dueDateValue || ''}" style="width: 100%;" />
                </div>
                <div id="payment-date-container" style="display: ${invoice.status === 'paid' ? 'block' : 'none'}; min-width: 160px;">
                  <label for="edit-payment-date" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">F. Pago</label>
                  <input type="date" id="edit-payment-date" name="payment_date" class="form-input" value="${paymentDateValue || ''}" style="width: 100%;" />
                </div>
              </div>

              <div>
                <label for="edit-notes" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Notas</label>
                <textarea id="edit-notes" name="notes" rows="2" class="form-input" style="resize: none; width: 100%;">${invoice.notes || ''}</textarea>
              </div>

              <div style="display: grid; grid-template-columns: minmax(0, 2.1fr) minmax(0, 1fr); gap: 1.5rem; flex: 1; min-height: 0;">
                <section style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1.15rem; background: var(--bg-secondary); display: flex; flex-direction: column; min-height: 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-primary);">Líneas de factura</h3>
                    <button type="button" class="btn-secondary" id="add-edit-invoice-item" style="padding: 0.5rem 1rem; font-size: 0.875rem;">+ Añadir línea</button>
                  </div>

                  <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1rem; flex-shrink: 0;">
                    <button type="button" class="invoice-tab-nav" id="edit-invoice-tab-prev" style="padding: 0.4rem 0.6rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; color: var(--text-primary); font-size: 0.875rem;" disabled>&larr;</button>
                    <div id="edit-invoice-tabs" style="display: flex; gap: 0.5rem; flex: 1; overflow-x: auto; scrollbar-width: thin;"></div>
                    <button type="button" class="invoice-tab-nav" id="edit-invoice-tab-next" style="padding: 0.4rem 0.6rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; color: var(--text-primary); font-size: 0.875rem;" disabled>&rarr;</button>
                  </div>

                  <div id="edit-invoice-items" style="flex: 1; display: flex; flex-direction: column; min-height: 0;"></div>
                </section>

                <aside style="display: flex; flex-direction: column; gap: 1rem; min-height: 0;">
                  <div id="edit-invoice-totals" style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1.15rem; background: var(--bg-secondary);"></div>
                </aside>
              </div>
            </form>
          </div>
          <footer class="modal__footer modal-form__footer">
            <button type="button" class="btn-secondary" onclick="closeEditInvoiceModal()">Cancelar</button>
            <button type="button" class="btn-primary" onclick="saveInvoiceChanges('${invoice.id}')">Guardar cambios</button>
          </footer>
        </div>
      </div>
    `;

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
        lockMessage.style.display = isDraft ? 'none' : 'flex';
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
      <div class="modal is-open" id="new-invoice-modal">
        <div class="modal__backdrop" onclick="closeNewInvoiceModal()"></div>
        <div class="modal__panel" style="width: min(98vw, 1800px); max-width: 1800px; max-height: 85vh; display: flex; flex-direction: column;">
          <header class="modal__head" style="flex-shrink: 0; padding: 1rem 1.5rem;">
            <div>
              <h2 class="modal__title" style="margin: 0; font-size: 1.25rem;">Nueva factura</h2>
              <p class="modal__subtitle" style="margin: 0.15rem 0 0 0; font-size: 0.75rem;">Completa los datos y conceptos</p>
            </div>
            <button type="button" class="modal__close" onclick="closeNewInvoiceModal()">&times;</button>
          </header>
          <div class="modal__body" style="flex: 1; overflow-y: hidden; padding: 0.85rem 1.5rem;">
            <form id="new-invoice-form" style="display: grid; grid-template-columns: 1fr 350px; gap: 1.25rem; height: 100%;">
              
              <!-- COLUMNA IZQUIERDA: Datos de factura y líneas -->
              <div style="display: flex; flex-direction: column; gap: 0.5rem; min-height: 0;">
                
                <!-- Datos principales de la factura -->
                <div style="display: grid; gap: 0.5rem; grid-template-columns: minmax(125px, auto) 1fr 1fr 1fr;">
                  <div style="min-width: 125px;">
                    <label for="new-invoice-number" style="display: block; font-weight: 600; margin-bottom: 0.25rem; font-size: 0.75rem; color: var(--text-secondary);">Nº Factura *</label>
                    <input type="text" id="new-invoice-number" name="invoice_number" class="form-input" placeholder="2024-001" required style="width: 100%; padding: 0.4rem 0.6rem; font-size: 0.8rem; height: 34px;" />
                  </div>
                  <div>
                    <label for="new-invoice-status" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Estado</label>
                    <select id="new-invoice-status" name="status" class="form-input" style="width: 100%;">
                      <option value="draft" selected>Borrador</option>
                      <option value="pending">Pendiente</option>
                      <option value="sent">Enviada</option>
                      <option value="paid">Cobrada</option>
                      <option value="overdue">Vencida</option>
                    </select>
                  </div>
                  <div style="min-width: 160px;">
                    <label for="new-invoice-issue-date" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">F. Emisión</label>
                    <input type="date" id="new-invoice-issue-date" name="issue_date" class="form-input" value="${today}" required style="width: 100%;" />
                  </div>
                  <div style="min-width: 160px;">
                    <label for="new-invoice-due-date" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">F. Vencimiento</label>
                    <input type="date" id="new-invoice-due-date" name="due_date" class="form-input" value="${dueDefaultDate}" required style="width: 100%;" />
                  </div>
                </div>
                
                <div style="display: grid; gap: 1rem; grid-template-columns: 1fr 2fr;">
                  <div>
                    <label for="new-invoice-client" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Cliente</label>
                    <select id="new-invoice-client" name="client_id" class="form-input" style="width: 100%;">
                      <option value="">Sin cliente asignado</option>
                      ${clients.map(client => `<option value="${client.id}">${client.name || client.business_name || 'Cliente sin nombre'}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <label for="new-invoice-notes" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Notas</label>
                    <textarea id="new-invoice-notes" name="notes" rows="2" class="form-input" style="resize: none; width: 100%;" placeholder="Observaciones internas o para el cliente"></textarea>
                  </div>
                  <div id="new-payment-date-container" style="display: none;">
                    <label for="new-payment-date" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Fecha de pago</label>
                    <input type="date" id="new-payment-date" name="payment_date" class="form-input" style="width: 100%;" />
                  </div>
                </div>

                <!-- Editor de líneas de factura -->
                <section style="border: 1px solid var(--border-color); border-radius: 8px; padding: 0.65rem; background: var(--bg-secondary); flex: 1; display: flex; flex-direction: column; min-height: 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <h3 style="margin: 0; font-size: 0.9rem; font-weight: 700; color: var(--text-primary);">Líneas de factura</h3>
                    <button type="button" class="btn-secondary" id="add-new-invoice-item" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;">+ Añadir línea</button>
                  </div>

                  <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1rem; flex-shrink: 0;">
                    <button type="button" class="invoice-tab-nav" id="new-invoice-tab-prev" style="padding: 0.4rem 0.6rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; color: var(--text-primary); font-size: 0.875rem;" disabled>&larr;</button>
                    <div id="new-invoice-tabs" style="display: flex; gap: 0.5rem; flex: 1; overflow-x: auto; scrollbar-width: thin;"></div>
                    <button type="button" class="invoice-tab-nav" id="new-invoice-tab-next" style="padding: 0.4rem 0.6rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; color: var(--text-primary); font-size: 0.875rem;" disabled>&rarr;</button>
                  </div>

                  <div id="new-invoice-items" style="flex: 1; display: flex; flex-direction: column; min-height: 0; overflow-y: auto;"></div>
                </section>
              </div>

              <!-- COLUMNA DERECHA: Resumen y totales -->
              <aside style="display: flex; flex-direction: column;">
                <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; background: var(--bg-secondary);">
                  <h3 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; font-weight: 700; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem;">📊 Resumen</h3>
                  <div id="new-invoice-totals"></div>
                </div>
              </aside>

            </form>
          </div>
          <footer class="modal__footer modal-form__footer">
            <button type="button" class="btn-secondary" onclick="closeNewInvoiceModal()">Cancelar</button>
            <button type="button" class="btn-primary" onclick="submitNewInvoice()">Crear factura</button>
          </footer>
        </div>
      </div>
    `;

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
    const notes = (formData.get('notes') || '').trim();

    if (!invoiceNumber) {
      showNotification('El numero de factura es obligatorio.', 'warning');
      return;
    }

    if (!issueDate || !dueDate) {
      showNotification('Las fechas de emision y vencimiento son obligatorias.', 'warning');
      return;
    }

    const editorState = getItemsEditorState('create');
    if (!editorState || !editorState.items || editorState.items.length === 0) {
      showNotification('Anade al menos una linea de concepto antes de crear la factura.', 'warning');
      return;
    }

    const items = editorState.items
      .map((item) => {
        const quantity = sanitizeNumber(item.quantity, 0);
        const unitPrice = sanitizeNumber(item.unitPrice, 0);
        const vatPercentage = sanitizeNumber(item.vatPercentage, 0);
        const description = (item.description || '').trim();
        const totals = calculateLineTotals({ quantity, unitPrice, vatPercentage });
        return {
          description,
          quantity,
          unitType: item.unitType || 'unidad',
          unitPrice,
          vatPercentage,
          amount: totals.total
        };
      })
      .filter(item => item.description.length > 0);

    if (items.length === 0) {
      showNotification('Anade al menos una linea con descripcion para crear la factura.', 'warning');
      return;
    }

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

    if (editorState && status === 'draft') {
      const preparedItems = editorState.items
        .map((item) => {
          const quantity = sanitizeNumber(item.quantity, 0);
          const unitPrice = sanitizeNumber(item.unitPrice, 0);
          const vatPercentage = sanitizeNumber(item.vatPercentage, 0);
          const description = (item.description || '').trim();
          const totals = calculateLineTotals({ quantity, unitPrice, vatPercentage });
          return {
            description,
            quantity,
            unitType: item.unitType || 'unidad',
            unitPrice,
            vatPercentage,
            amount: totals.total
          };
        })
        .filter(item => item.description.length > 0);

      if (preparedItems.length === 0) {
        showNotification('Anade al menos una linea con descripcion para guardar la factura.', 'warning');
        return;
      }

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
                <td class="text-right">${currencyFormatter.format(item.unit_price)}</td>
                <td class="text-right">${currencyFormatter.format(item.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <div class="totals">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>${currencyFormatter.format(invoice.subtotal)}</span>
        </div>
        <div class="totals-row">
          <span>IVA (${invoice.vat_percentage}%):</span>
          <span>${currencyFormatter.format(invoice.vat_amount)}</span>
        </div>
        ${invoice.irpf_amount > 0 ? `
          <div class="totals-row">
            <span>IRPF (${invoice.irpf_percentage}%):</span>
            <span style="color: #c53030;">-${currencyFormatter.format(invoice.irpf_amount)}</span>
          </div>
        ` : ''}
        <div class="totals-row final">
          <span>TOTAL:</span>
          <span>${currencyFormatter.format(invoice.total)}</span>
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

  if (filteredInvoices.length === 0) {
    return `
      <tr>
        <td colspan="9" style="text-align: center; padding: 3rem;">
          <p style="color: #718096;">No hay facturas que coincidan con los filtros</p>
        </td>
      </tr>
    `;
  }

  return filteredInvoices.map(invoice => {
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
      <tr data-invoice-id="${invoice.id}" class="invoices-table__row${isSelected ? ' is-selected' : ''}">
        <td data-column="Factura">
          <span class="invoices-table__number">${invoice.number}</span>
        </td>
        <td data-column="Cliente">
          <span class="invoices-table__client">${invoice.client}</span>
        </td>
        <td data-column="Emision">
          <time datetime="${invoice.issueDate}">${formatDate(invoice.issueDate)}</time>
        </td>
        <td data-column="Vencimiento">
          <time datetime="${invoice.dueDate}">${formatDate(invoice.dueDate)}</time>
        </td>
        <td data-column="Importe">
          <span class="invoices-table__amount">${currencyFormatter.format(invoice.total)}</span>
        </td>
        <td data-column="Estado">
          <span class="status-pill status-pill--${statusInfo.tone}">
            <span class="status-pill__dot"></span>
            ${statusInfo.label}
          </span>
        </td>
        <td data-column="Verifactu">
          <span class="status-pill status-pill--${verifactuInfo.tone}" title="${verifactuInfo.label}">
            <span>${verifactuInfo.icon}</span>
            ${verifactuInfo.label}
          </span>
        </td>
        <td data-column="Dias">
          <span class="invoices-table__days">${invoice.daysLate || "-"}</span>
        </td>
        <td data-column="Acciones">
          <div class="invoices-table__actions">
            <button type="button" class="table-action" title="Ver factura" onclick="viewInvoice('${invoice.id}')">
              <span>👁️</span>
            </button>
            <button type="button" class="table-action" title="Editar factura" onclick="editInvoice('${invoice.id}')">
              <span>✏️</span>
            </button>
            <button type="button" class="table-action" title="Descargar PDF" onclick="downloadInvoicePDF('${invoice.id}')">
              <span>📄</span>
            </button>
            ${verifactuActions}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderInvoicesTable() {
  const tbody = document.querySelector('.invoices-table tbody');
  if (tbody) {
    tbody.innerHTML = renderInvoiceRows();
  }

  // Actualizar contador
  updateResultCount();
}

function updateResultCount() {
  const countEl = document.querySelector('[data-result-count]');
  if (countEl && invoicesData) {
    countEl.textContent = `Mostrando ${invoicesData.length} factura(s)`;
  }
}

function updateSummaryCards() {
  // Calcular estadísticas reales
  const totalThisMonth = invoicesData
    .filter(inv => {
      const issueDate = new Date(inv.issueDate);
      const now = new Date();
      return issueDate.getMonth() === now.getMonth() &&
             issueDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, inv) => sum + inv.total, 0);

  const pendingTotal = invoicesData
    .filter(inv => inv.status === 'pending' || inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.total, 0);

  const pendingCount = invoicesData.filter(inv => inv.status === 'pending' || inv.status === 'sent').length;

  const paidCount = invoicesData.filter(inv => inv.status === 'paid').length;
  const totalCount = invoicesData.length;
  const paymentRatio = totalCount > 0 ? ((paidCount / totalCount) * 100).toFixed(1) : 0;

  // Puedes actualizar las tarjetas resumen aquí si quieres
  // Por ahora mantienen sus valores estáticos
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

// Export para uso en módulos
export { loadInvoices, registerInvoiceVerifactu, showVerifactuQRModal, showVerifactuCSVModal };

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
          <button type="button" class="btn-ghost" data-feature-pending="add-payment">Añadir cobro</button>
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
