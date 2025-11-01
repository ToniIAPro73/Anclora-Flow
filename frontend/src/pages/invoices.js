// Módulo de Facturas con integración completa API y Verifactu
// Importar servicio API (asegúrate de que esté cargado)

// Estado global del módulo
let invoicesData = [];
let filteredInvoices = [];
let isLoading = false;
let selectedInvoiceId = null; // Estado para rastrear factura seleccionada
let currentFilters = {
  search: "",
  status: "all",
  client: "all",
};
const PAGE_SIZE = 10;
let currentPage = 1;

// Formatters
const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

// Mapeo de estados de factura
const statusMap = {
  paid: { label: "Cobrada", tone: "paid" },
  sent: { label: "Enviada", tone: "sent" },
  pending: { label: "Pendiente", tone: "pending" },
  overdue: { label: "Vencida", tone: "overdue" },
  draft: { label: "Borrador", tone: "draft" },
};

// Mapeo de estados de Verifactu
const verifactuStatusMap = {
  registered: { label: "Registrada", tone: "success", icon: "✅" },
  pending: { label: "Pendiente", tone: "warning", icon: "⏳" },
  error: { label: "Error", tone: "error", icon: "❌" },
  not_registered: { label: "No registrada", tone: "neutral", icon: "⚪" },
};

// === UTILIDADES ===

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function calculateDaysLate(dueDate, status) {
  if (status === "paid" || status === "draft") return "";

  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today - due;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `${diffDays} días tarde`;
  }
  return "";
}

// Mostrar notificación
function showNotification(message, type = "info") {
  // Crear elemento de notificación
  const notification = document.createElement("div");
  notification.className = `notification notification--${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" class="notification__close">×</button>
  `;

  // Añadir estilos si no existen
  if (!document.getElementById("notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
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

async function loadInvoices() {
  isLoading = true;
  renderLoadingState();

  try {
    // Verificar que api esté disponible
    if (typeof window.api === "undefined") {
      throw new Error(
        "Servicio API no disponible. Asegúrate de que api.js esté cargado."
      );
    }

    const response = await window.api.getInvoices();
    invoicesData = response.invoices || response || [];

    // Mapear datos de API a formato del componente
    invoicesData = invoicesData.map((invoice) => ({
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
      verifactuStatus: invoice.verifactu_status || "not_registered",
      verifactuCsv: invoice.verifactu_csv,
      verifactuQrCode: invoice.verifactu_qr_code,
      verifactuUrl: invoice.verifactu_url,
      verifactuHash: invoice.verifactu_hash,
      verifactuError: invoice.verifactu_error_message,
    }));

    currentPage = 1;
    renderInvoicesTable();
    updateSummaryCards();
  } catch (error) {
    console.error("Error cargando facturas:", error);
    renderErrorState(error.message);
    showNotification(error.message || "Error al cargar facturas", "error");
  } finally {
    isLoading = false;
  }
}

// Registrar factura en Verifactu
async function registerInvoiceVerifactu(invoiceId) {
  try {
    showNotification("Registrando factura en Verifactu...", "info");

    // Actualizar estado a pendiente inmediatamente
    const invoice = invoicesData.find((inv) => inv.id === invoiceId);
    if (invoice) {
      invoice.verifactuStatus = "pending";
      renderInvoicesTable();
    }

    const result = await window.api.registerInvoiceVerifactu(invoiceId);

    // Actualizar factura con los datos devueltos
    if (invoice) {
      invoice.verifactuStatus = "registered";
      invoice.verifactuCsv = result.invoice.verifactu_csv;
      invoice.verifactuQrCode = result.invoice.verifactu_qr_code;
      invoice.verifactuUrl = result.invoice.verifactu_url;
      invoice.verifactuHash = result.invoice.verifactu_hash;
    }

    renderInvoicesTable();
    showNotification(
      "Factura registrada en Verifactu correctamente",
      "success"
    );
  } catch (error) {
    console.error("Error registrando en Verifactu:", error);

    // Actualizar estado a error
    const invoice = invoicesData.find((inv) => inv.id === invoiceId);
    if (invoice) {
      invoice.verifactuStatus = "error";
      invoice.verifactuError = error.message;
      renderInvoicesTable();
    }

    showNotification(`Error: ${error.message}`, "error");
  }
}

// === MODALES DE FACTURAS ===

async function openInvoiceModal(mode = "create", invoiceId = null) {
  let invoice = null;

  if ((mode === "edit" || mode === "view") && invoiceId) {
    try {
      invoice = await window.api.getInvoice(invoiceId);
    } catch (error) {
      console.error("Error obteniendo factura:", error);
      showNotification("No se pudo cargar la factura seleccionada", "error");
      return;
    }
  }

  const modalHtml = buildInvoiceModalHtml(mode, invoice);
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  const modal = document.getElementById("invoice-modal");
  if (!modal) return;

  modal.querySelectorAll("[data-modal-close]").forEach((btn) => {
    btn.addEventListener("click", closeInvoiceModal);
  });
  modal
    .querySelector(".modal__backdrop")
    ?.addEventListener("click", closeInvoiceModal);

  if (mode !== "view") {
    const form = document.getElementById("invoice-form");
    if (form) setupInvoiceForm(form, invoice);
  }
}

function closeInvoiceModal() {
  const modal = document.getElementById("invoice-modal");
  if (modal) modal.remove();
}

function buildInvoiceModalHtml(mode, invoice) {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const title = isView
    ? "Detalles de la factura"
    : isEdit
    ? "Editar factura"
    : "Nueva factura";
  const actionLabel = isEdit ? "Guardar cambios" : "Crear factura";

  if (isView) {
    const verifactuInfo =
      verifactuStatusMap[invoice?.verifactuStatus] ||
      verifactuStatusMap.not_registered;
    return `
      <div class="modal is-open" id="invoice-modal" role="dialog" aria-modal="true">
        <div class="modal__backdrop"></div>
        <div class="modal__panel" style="width: min(95vw, 800px); max-width: 800px;">
          <header class="modal__head">
            <div>
              <h2 class="modal__title">${title}</h2>
              <p class="modal__subtitle">Factura ${
                invoice.number
              } · ${formatDate(invoice.issueDate)}</p>
            </div>
            <button type="button" class="modal__close" data-modal-close aria-label="Cerrar">×</button>
          </header>
              <div class="modal__body">
              <dl class="detail-list" style="display: grid; gap: 1rem;">
              <div><dt>Cliente</dt><dd>${invoice.client}</dd></div>
              <div><dt>Número de factura</dt><dd>${invoice.number}</dd></div>
              <div><dt>Fecha de emisión</dt><dd>${formatDate(
                invoice.issueDate
              )}</dd></div>
              <div><dt>Fecha de vencimiento</dt><dd>${formatDate(
                invoice.dueDate
              )}</dd></div>
              <div><dt>Estado</dt><dd>${
                statusMap[invoice.status]?.label || invoice.status
              }</dd></div>
              <div><dt>Subtotal</dt><dd>${currencyFormatter.format(
                invoice.subtotal
              )}</dd></div>
              <div><dt>IVA</dt><dd>${currencyFormatter.format(
                invoice.tax
              )}</dd></div>
              <div><dt>Total</dt><dd><strong>${currencyFormatter.format(
                invoice.total
              )}</strong></dd></div>
              <div><dt>Verifactu</dt><dd>
                <span class="status-pill status-pill--${verifactuInfo.tone}">
                  ${verifactuInfo.icon} ${verifactuInfo.label}
                </span>
              </dd></div>
            </dl>
          </div>
          <footer class="modal__footer modal-form__footer">
            <button type="button" class="btn-secondary" data-modal-close>Cerrar</button>
            <button type="button" class="btn-primary" onclick="closeInvoiceModal(); openInvoiceModal('edit', '${
              invoice.id
            }')">Editar</button>
          </footer>
        </div>
      </div>
    `;
  }

  return `
    <div class="modal is-open" id="invoice-modal" role="dialog" aria-modal="true" aria-labelledby="invoice-modal-title">
      <div class="modal__backdrop"></div>
      <div class="modal__panel" style="width: min(95vw, 1100px); max-width: 1100px;">
        <header class="modal__head">
          <div>
            <h2 class="modal__title" id="invoice-modal-title">${title}</h2>
            <p class="modal__subtitle">Completa los datos y conceptos para generar la factura</p>
          </div>
          <button type="button" class="modal__close" data-modal-close aria-label="Cerrar modal">×</button>
        </header>
        <form id="invoice-form" data-mode="${mode}" novalidate>
          <div class="modal__body" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div style="display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr));">
              <div class="form-group">
                <label for="invoice-number">Número de factura</label>
                <input type="text" id="invoice-number" name="invoiceNumber" class="form-input" placeholder="Ej. 2024-001" value="${
                  invoice?.number || ""
                }" required />
              </div>
              <div class="form-group">
                <label for="invoice-status">Estado</label>
                <select id="invoice-status" name="status" class="form-input" required>
                  <option value="draft" ${
                    !invoice || invoice.status === "draft" ? "selected" : ""
                  }>Borrador</option>
                  <option value="pending" ${
                    invoice?.status === "pending" ? "selected" : ""
                  }>Pendiente</option>
                  <option value="sent" ${
                    invoice?.status === "sent" ? "selected" : ""
                  }>Enviada</option>
                  <option value="paid" ${
                    invoice?.status === "paid" ? "selected" : ""
                  }>Cobrada</option>
                  <option value="overdue" ${
                    invoice?.status === "overdue" ? "selected" : ""
                  }>Vencida</option>
                </select>
              </div>
            </div>

            <div style="display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr));">
              <div class="form-group">
                <label for="invoice-issue-date">Fecha de emisión</label>
                <input type="date" id="invoice-issue-date" name="issueDate" class="form-input" value="${
                  invoice?.issueDate || new Date().toISOString().split("T")[0]
                }" required />
              </div>
              <div class="form-group">
                <label for="invoice-due-date">Fecha de vencimiento</label>
                <input type="date" id="invoice-due-date" name="dueDate" class="form-input" value="${
                  invoice?.dueDate || ""
                }" required />
              </div>
            </div>

            <div class="form-group">
              <label for="invoice-client">Cliente</label>
              <select id="invoice-client" name="clientId" class="form-input" required>
                <option value="" disabled ${
                  !invoice ? "selected" : ""
                }>Sin cliente asignado</option>
              </select>
            </div>

            <div class="form-group">
              <label for="invoice-notes">Notas</label>
              <textarea id="invoice-notes" name="notes" rows="2" class="form-input" placeholder="Observaciones internas o para el cliente">${
                invoice?.notes || ""
              }</textarea>
            </div>

            <div style="background: var(--bg-secondary); border-radius: 8px; padding: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="font-size: 1rem; font-weight: 600; margin: 0;">Conceptos facturados</h3>
                <button type="button" class="btn-primary" id="add-line-btn" style="font-size: 0.875rem; padding: 0.5rem 1rem;">
                  Añadir línea
                </button>
              </div>
              <div id="invoice-lines-container" style="display: flex; flex-direction: column; gap: 0.75rem;">
              </div>
            </div>

            <div style="background: var(--bg-secondary); border-radius: 8px; padding: 1.25rem;">
              <div style="display: grid; gap: 0.75rem;">
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                  <span style="font-size: 0.95rem; color: var(--text-secondary);">Importe</span>
                  <span style="font-size: 0.95rem; font-weight: 500;" id="invoice-subtotal">0.00 €</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                  <span style="font-size: 0.95rem; color: var(--text-secondary);">Subtotal</span>
                  <span style="font-size: 0.95rem; font-weight: 500;" id="invoice-subtotal-display">0.00 €</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                  <span style="font-size: 0.95rem; color: var(--text-secondary);">IVA estimado (0.00%)</span>
                  <span style="font-size: 0.95rem; font-weight: 500;" id="invoice-vat">0.00 €</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-top: 2px solid var(--border-color);">
                  <label for="invoice-irpf" style="font-size: 0.95rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem;">
                    IRPF (%)
                    <input type="number" id="invoice-irpf" name="irpf" class="form-input" style="width: 80px; padding: 0.375rem 0.5rem; font-size: 0.875rem;" value="0" min="0" max="100" step="0.1" />
                  </label>
                  <span style="font-size: 0.95rem; font-weight: 500;" id="invoice-irpf-amount">0.00 €</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-top: 2px solid var(--border-color);">
                  <span style="font-size: 1.125rem; font-weight: 700;">Total</span>
                  <span style="font-size: 1.5rem; font-weight: 700; color: var(--primary-600);" id="invoice-total">0.00 €</span>
                </div>
              </div>
            </div>
          </div>
          <footer class="modal__footer modal-form__footer">
            <button type="button" class="btn-secondary" data-modal-close>Cancelar</button>
            <button type="submit" class="btn-primary">${actionLabel}</button>
          </footer>
        </form>
      </div>
    </div>
  `;
}

function setupInvoiceForm(form, invoice) {
  let lineItems = invoice?.items || [];

  const addLineBtn = form.querySelector("#add-line-btn");
  const linesContainer = form.querySelector("#invoice-lines-container");
  const irpfInput = form.querySelector("#invoice-irpf");

  function renderLines() {
    if (lineItems.length === 0) {
      lineItems.push({
        concept: "",
        unit: "unidad",
        quantity: 1,
        unitPrice: 0,
        vatPercentage: 21,
      });
    }

    linesContainer.innerHTML = lineItems
      .map(
        (item, index) => `
        <div class="invoice-line" data-line-index="${index}" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto; gap: 0.5rem; align-items: end; padding: 0.75rem; background: var(--bg-primary); border-radius: 6px;">
          <div class="form-group" style="margin: 0;">
            <label style="font-size: 0.8rem; margin-bottom: 0.25rem;">Concepto</label>
            <input type="text" class="form-input line-concept" style="font-size: 0.875rem; padding: 0.5rem;" placeholder="Servicio o producto" value="${
              item.concept || ""
            }" required />
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="font-size: 0.8rem; margin-bottom: 0.25rem;">Unidad</label>
            <input type="text" class="form-input line-unit" style="font-size: 0.875rem; padding: 0.5rem;" placeholder="unidad" value="${
              item.unit || "unidad"
            }" />
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="font-size: 0.8rem; margin-bottom: 0.25rem;">Cantidad</label>
            <input type="number" class="form-input line-quantity" style="font-size: 0.875rem; padding: 0.5rem;" min="0" step="0.01" value="${
              item.quantity || 1
            }" required />
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="font-size: 0.8rem; margin-bottom: 0.25rem;">Precio unitario</label>
            <input type="number" class="form-input line-price" style="font-size: 0.875rem; padding: 0.5rem;" min="0" step="0.01" value="${
              item.unitPrice || 0
            }" required />
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="font-size: 0.8rem; margin-bottom: 0.25rem;">IVA (%)</label>
            <input type="number" class="form-input line-vat" style="font-size: 0.875rem; padding: 0.5rem;" min="0" step="0.1" value="${
              item.vatPercentage || 21
            }" />
          </div>
          <button type="button" class="btn-secondary remove-line-btn" style="padding: 0.5rem; font-size: 1.2rem; height: 38px; width: 38px; display: flex; align-items: center; justify-content: center;" title="Eliminar línea">×</button>
        </div>
      `
      )
      .join("");

    linesContainer.querySelectorAll(".remove-line-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const lineDiv = e.target.closest(".invoice-line");
        const index = parseInt(lineDiv.dataset.lineIndex);
        lineItems.splice(index, 1);
        renderLines();
        calculateTotals();
      });
    });

    linesContainer.querySelectorAll(".invoice-line input").forEach((input) => {
      input.addEventListener("input", calculateTotals);
    });

    calculateTotals();
  }

  function calculateTotals() {
    const lines = Array.from(linesContainer.querySelectorAll(".invoice-line"));
    let subtotal = 0;
    let totalVat = 0;

    lines.forEach((line) => {
      const quantity =
        parseFloat(line.querySelector(".line-quantity").value) || 0;
      const price = parseFloat(line.querySelector(".line-price").value) || 0;
      const vatPct = parseFloat(line.querySelector(".line-vat").value) || 0;

      const lineSubtotal = quantity * price;
      const lineVat = lineSubtotal * (vatPct / 100);

      subtotal += lineSubtotal;
      totalVat += lineVat;
    });

    const irpfPct = parseFloat(irpfInput?.value) || 0;
    const irpfAmount = subtotal * (irpfPct / 100);
    const total = subtotal + totalVat - irpfAmount;

    form.querySelector("#invoice-subtotal").textContent =
      currencyFormatter.format(subtotal);
    form.querySelector("#invoice-subtotal-display").textContent =
      currencyFormatter.format(subtotal);
    form.querySelector("#invoice-vat").textContent =
      currencyFormatter.format(totalVat);
    form.querySelector("#invoice-irpf-amount").textContent =
      currencyFormatter.format(irpfAmount);
    form.querySelector("#invoice-total").textContent =
      currencyFormatter.format(total);
  }

  addLineBtn?.addEventListener("click", () => {
    lineItems.push({
      concept: "",
      unit: "unidad",
      quantity: 1,
      unitPrice: 0,
      vatPercentage: 21,
    });
    renderLines();
  });

  irpfInput?.addEventListener("input", calculateTotals);

  renderLines();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleInvoiceSubmit(form);
  });
}

async function handleInvoiceSubmit(form) {
  const formData = new FormData(form);
  const mode = form.dataset.mode || "create";

  const lines = Array.from(form.querySelectorAll(".invoice-line")).map(
    (line) => ({
      concept: line.querySelector(".line-concept").value,
      unit: line.querySelector(".line-unit").value || "unidad",
      quantity: parseFloat(line.querySelector(".line-quantity").value) || 0,
      unitPrice: parseFloat(line.querySelector(".line-price").value) || 0,
      vatPercentage: parseFloat(line.querySelector(".line-vat").value) || 0,
    })
  );

  const payload = {
    invoiceNumber: formData.get("invoiceNumber"),
    clientId: formData.get("clientId"),
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate"),
    status: formData.get("status"),
    notes: formData.get("notes") || "",
    items: lines,
    irpf: parseFloat(formData.get("irpf")) || 0,
  };

  try {
    if (mode === "edit" && selectedInvoiceId) {
      await window.api.updateInvoice(selectedInvoiceId, payload);
      showNotification("Factura actualizada correctamente", "success");
    } else {
      await window.api.createInvoice(payload);
      showNotification("Factura creada correctamente", "success");
    }
    closeInvoiceModal();
    await loadInvoices();
  } catch (error) {
    console.error("Error guardando factura:", error);
    showNotification(
      error?.message || "No se pudo guardar la factura",
      "error"
    );
  }
}

// === MODALES DE VERIFACTU ===

function showVerifactuQRModal(invoice) {
  const modalHTML = `
    <div class="modal modal--open" id="verifactu-qr-modal">
      <div class="modal__backdrop" onclick="document.getElementById('verifactu-qr-modal').remove()"></div>
      <div class="modal__panel">
        <header class="modal__head">
          <div>
            <h2>Código QR - Verifactu</h2>
            <p class="modal__subtitle">Factura ${invoice.number}</p>
          </div>
          <button type="button" class="modal__close" onclick="document.getElementById('verifactu-qr-modal').remove()">
            <span>×</span>
          </button>
        </header>
        <div class="modal__body" style="padding: 2rem; text-align: center;">
          <div style="margin-bottom: 1.5rem;">
            <p><strong>CSV:</strong> <code style="background: #f7fafc; padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace;">${
              invoice.verifactuCsv
            }</code></p>
          </div>
          <div style="display: flex; justify-content: center; margin-bottom: 1.5rem;">
            <img src="${
              invoice.verifactuQrCode
            }" alt="QR Verifactu" style="max-width: 300px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; background: white;">
          </div>
          <p style="font-size: 0.9rem; color: #718096;">
            Escanea este código QR para verificar la factura en la web de la Agencia Tributaria.
          </p>
          ${
            invoice.verifactuUrl
              ? `<p style="font-size: 0.85rem; margin-top: 1rem;"><a href="${invoice.verifactuUrl}" target="_blank" style="color: #4299e1;">Verificar en AEAT →</a></p>`
              : ""
          }
        </div>
        <footer class="modal__footer">
          <button class="btn-secondary" onclick="document.getElementById('verifactu-qr-modal').remove()">Cerrar</button>
          <a href="${invoice.verifactuQrCode}" download="qr-${
    invoice.number
  }.png" class="btn-primary" style="text-decoration: none; display: inline-block;">
            Descargar QR
          </a>
        </footer>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

function showVerifactuCSVModal(invoice) {
  const modalHTML = `
    <div class="modal modal--open" id="verifactu-csv-modal">
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
            <div style="background: #f7fafc; border: 2px dashed #cbd5e0; padding: 2rem; border-radius: 8px;">
              <p style="font-size: 0.9rem; color: #718096; margin-bottom: 0.75rem;">Código Seguro de Verificación</p>
              <p style="font-size: 2rem; font-weight: bold; font-family: monospace; letter-spacing: 4px; color: #2d3748; margin: 0;">
                ${invoice.verifactuCsv}
              </p>
            </div>
          </div>
          ${
            invoice.verifactuHash
              ? `
          <div style="margin-top: 1.5rem; font-size: 0.85rem;">
            <p><strong>Hash SHA-256:</strong></p>
            <p style="font-family: monospace; background: #f7fafc; padding: 0.5rem; border-radius: 4px; word-break: break-all; color: #4a5568;">
              ${invoice.verifactuHash}
            </p>
          </div>
          `
              : ""
          }
          <p style="font-size: 0.9rem; color: #718096; margin-top: 1.5rem;">
            Este código CSV identifica de forma única esta factura en el sistema Verifactu de la AEAT.
          </p>
        </div>
        <footer class="modal__footer">
          <button class="btn-secondary" onclick="document.getElementById('verifactu-csv-modal').remove()">Cerrar</button>
          <button class="btn-primary" onclick="navigator.clipboard.writeText('${
            invoice.verifactuCsv
          }').then(() => showNotification('CSV copiado al portapapeles', 'success'))">
            Copiar CSV
          </button>
        </footer>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

// === RENDERIZADO ===

function renderLoadingState() {
  const tbody = document.querySelector(".invoices-table tbody");
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
  if (!document.getElementById("spinner-animation")) {
    const style = document.createElement("style");
    style.id = "spinner-animation";
    style.textContent =
      "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }";
    document.head.appendChild(style);
  }
}

function renderErrorState(message) {
  const tbody = document.querySelector(".invoices-table tbody");
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
  filteredInvoices = Array.isArray(invoicesData) ? [...invoicesData] : [];

  if (filteredInvoices.length === 0) {
    return `
      <tr>
        <td colspan="9" style="text-align: center; padding: 3rem;">
          <p style="color: #718096; font-size: 1.1rem;">No hay facturas todavía</p>
          <p style="color: #a0aec0; margin-top: 0.5rem;">Crea tu primera factura para empezar</p>
        </td>
      </tr>
    `;
  }

  // Aplicar filtros activos sobre la copia local
  if (currentFilters.search) {
    const search = currentFilters.search.trim().toLowerCase();
    filteredInvoices = filteredInvoices.filter((inv = {}) => {
      const invoiceNumber = (inv.number ?? "").toString().toLowerCase();
      const clientName = (inv.client ?? "").toString().toLowerCase();
      return invoiceNumber.includes(search) || clientName.includes(search);
    });
  }

  if (currentFilters.status !== "all") {
    filteredInvoices = filteredInvoices.filter(
      (inv) => inv.status === currentFilters.status
    );
  }

  if (currentFilters.client !== "all") {
    filteredInvoices = filteredInvoices.filter(
      (inv) => inv.client.toLowerCase() === currentFilters.client
    );
  }

  if (filteredInvoices.length === 0) {
    currentPage = 1;
    return `
      <tr>
        <td colspan="9" style="text-align: center; padding: 3rem;">
          <p style="color: #718096;">No hay facturas que coincidan con los filtros</p>
        </td>
      </tr>
    `;
  }

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInvoices.length / PAGE_SIZE)
  );
  if (currentPage > totalPages) {
    currentPage = totalPages;
  } else if (currentPage < 1) {
    currentPage = 1;
  }

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageInvoices = filteredInvoices.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  return pageInvoices
    .map((invoice) => {
      const statusInfo = statusMap[invoice.status] || statusMap.draft;
      const verifactuInfo =
        verifactuStatusMap[invoice.verifactuStatus] ||
        verifactuStatusMap.not_registered;

      // Determinar acciones de Verifactu
      let verifactuActions = "";

      if (invoice.verifactuStatus === "registered") {
        verifactuActions = `
        <button type="button" class="table-action" title="Ver QR Verifactu" onclick="showVerifactuQRModal(${JSON.stringify(
          invoice
        ).replace(/"/g, "&quot;")})">
          <span>🔲</span>
        </button>
        <button type="button" class="table-action" title="Ver CSV" onclick="showVerifactuCSVModal(${JSON.stringify(
          invoice
        ).replace(/"/g, "&quot;")})">
          <span>🔐</span>
        </button>
      `;
      } else if (invoice.verifactuStatus === "not_registered") {
        verifactuActions = `
        <button type="button" class="table-action table-action--primary" title="Registrar en Verifactu" onclick="registerInvoiceVerifactu('${invoice.id}')">
          <span>📋</span>
        </button>
      `;
      } else if (invoice.verifactuStatus === "pending") {
        verifactuActions = `
        <button type="button" class="table-action" disabled title="Registro pendiente">
          <span>⏳</span>
        </button>
      `;
      } else if (invoice.verifactuStatus === "error") {
        verifactuActions = `
        <button type="button" class="table-action table-action--retry" title="Reintentar registro - ${
          invoice.verifactuError || "Error desconocido"
        }" onclick="registerInvoiceVerifactu('${invoice.id}')">
          <span>🔄</span>
        </button>
      `;
      }

      const isSelected = invoice.id === selectedInvoiceId;
      return `
      <tr data-invoice-id="${invoice.id}" class="invoices-table__row${
        isSelected ? " is-selected" : ""
      }">
        <td data-column="Factura">
          <span class="invoices-table__number">${invoice.number}</span>
        </td>
        <td data-column="Cliente">
          <span class="invoices-table__client">${invoice.client}</span>
        </td>
        <td data-column="Emision">
          <time datetime="${invoice.issueDate}">${formatDate(
        invoice.issueDate
      )}</time>
        </td>
        <td data-column="Vencimiento">
          <time datetime="${invoice.dueDate}">${formatDate(
        invoice.dueDate
      )}</time>
        </td>
        <td data-column="Importe">
          <span class="invoices-table__amount">${currencyFormatter.format(
            invoice.total
          )}</span>
        </td>
        <td data-column="Estado">
          <span class="status-pill status-pill--${statusInfo.tone}">
            <span class="status-pill__dot"></span>
            ${statusInfo.label}
          </span>
        </td>
        <td data-column="Verifactu">
          <span class="status-pill status-pill--${verifactuInfo.tone}" title="${
        verifactuInfo.label
      }">
            <span>${verifactuInfo.icon}</span>
            ${verifactuInfo.label}
          </span>
        </td>
        <td data-column="Dias">
          <span class="invoices-table__days">${invoice.daysLate || "-"}</span>
        </td>
        <td data-column="Acciones" class="invoices-table__actions">
          <button type="button" class="table-action" title="Ver factura" onclick="openInvoiceModal('view', '${
            invoice.id
          }')">
            <span>👁️</span>
          </button>
          <button type="button" class="table-action" title="Editar factura" onclick="openInvoiceModal('edit', '${
            invoice.id
          }')">
            <span>✏️</span>
          </button>
          <button type="button" class="table-action" title="Descargar PDF">
            <span>📄</span>
          </button>
          ${verifactuActions}
        </td>
      </tr>
    `;
    })
    .join("");
}

function renderInvoicesTable() {
  const tbody = document.querySelector(".invoices-table tbody");
  if (tbody) {
    tbody.innerHTML = renderInvoiceRows();
  }

  // Actualizar contador
  updateResultCount();
  renderInvoicePagination();
}

function updateResultCount() {
  const countEl = document.querySelector("[data-result-count]");
  if (!countEl) return;

  const total = filteredInvoices.length;
  if (!total) {
    countEl.textContent = "Sin facturas disponibles";
    return;
  }

  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, total);
  const label = total === 1 ? "factura" : "facturas";
  countEl.textContent = `Mostrando ${start}-${end} de ${total} ${label}`;
}

function renderInvoicePagination() {
  const pager = document.querySelector('[data-pagination="invoices"]');
  if (!pager) return;

  const total = filteredInvoices.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (total <= PAGE_SIZE) {
    pager.innerHTML = "";
    return;
  }

  pager.innerHTML = `
    <button type="button" class="pager-btn" onclick="window.changeInvoicesPage(-1)" ${
      currentPage === 1 ? "disabled" : ""
    }>
      Anterior
    </button>
    <span class="pager-status">Página ${currentPage} de ${totalPages}</span>
    <button type="button" class="pager-btn pager-btn--primary" onclick="window.changeInvoicesPage(1)" ${
      currentPage === totalPages ? "disabled" : ""
    }>
      Siguiente
    </button>
  `;
}

function updateSummaryCards() {
  // Calcular estadísticas reales
  const totalThisMonth = invoicesData
    .filter((inv) => {
      const issueDate = new Date(inv.issueDate);
      const now = new Date();
      return (
        issueDate.getMonth() === now.getMonth() &&
        issueDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, inv) => sum + inv.total, 0);

  const pendingTotal = invoicesData
    .filter((inv) => inv.status === "pending" || inv.status === "sent")
    .reduce((sum, inv) => sum + inv.total, 0);

  const pendingCount = invoicesData.filter(
    (inv) => inv.status === "pending" || inv.status === "sent"
  ).length;

  const paidCount = invoicesData.filter((inv) => inv.status === "paid").length;
  const totalCount = invoicesData.length;
  const paymentRatio =
    totalCount > 0 ? ((paidCount / totalCount) * 100).toFixed(1) : 0;

  // Puedes actualizar las tarjetas resumen aquí si quieres
  // Por ahora mantienen sus valores estáticos
}

// === INICIALIZACIÓN ===

export function initInvoicesPage() {
  console.log("Inicializando módulo de facturas con API...");

  // Hacer funciones globales para que funcionen los onclick en el HTML
  window.loadInvoices = loadInvoices;
  window.openInvoiceModal = openInvoiceModal;
  window.closeInvoiceModal = closeInvoiceModal;
  window.registerInvoiceVerifactu = registerInvoiceVerifactu;
  window.showVerifactuQRModal = showVerifactuQRModal;
  window.showVerifactuCSVModal = showVerifactuCSVModal;
  window.showNotification = showNotification;
  window.changeInvoicesPage = changeInvoicesPage;

  // Configurar botón de nueva factura
  const newInvoiceBtn = document.querySelector('[data-modal-open="invoice"]');
  if (newInvoiceBtn) {
    newInvoiceBtn.addEventListener("click", () => openInvoiceModal("create"));
  }

  // Cargar facturas automáticamente
  loadInvoices();

  // Configurar filtros
  setupFilters();
}

function setupFilters() {
  // Buscar facturas
  const searchInput = document.querySelector("[data-invoices-search]");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentFilters.search = e.target.value;
      currentPage = 1;
      renderInvoicesTable();
    });
  }

  // Filtro por estado
  const statusFilter = document.querySelector(
    '[data-invoices-filter="status"]'
  );
  if (statusFilter) {
    statusFilter.addEventListener("change", (e) => {
      currentFilters.status = e.target.value;
      currentPage = 1;
      renderInvoicesTable();
    });
  }

  // Filtro por cliente
  const clientFilter = document.querySelector(
    '[data-invoices-filter="client"]'
  );
  if (clientFilter) {
    clientFilter.addEventListener("change", (e) => {
      currentFilters.client = e.target.value;
      currentPage = 1;
      renderInvoicesTable();
    });
  }

  // Manejar selección de filas
  const tbody = document.querySelector(".invoices-table tbody");
  if (tbody) {
    tbody.addEventListener("click", (e) => {
      const row = e.target.closest("tr[data-invoice-id]");
      if (row) {
        const invoiceId = row.dataset.invoiceId;
        selectedInvoiceId = selectedInvoiceId === invoiceId ? null : invoiceId;
        renderInvoicesTable();
      }
    });
  }
}

function changeInvoicesPage(delta) {
  const totalPages = Math.max(
    1,
    Math.ceil(filteredInvoices.length / PAGE_SIZE)
  );
  const next = Math.min(Math.max(1, currentPage + delta), totalPages);
  if (next === currentPage) return;
  currentPage = next;
  renderInvoicesTable();
}

// Export para uso en módulos
export {
  loadInvoices,
  registerInvoiceVerifactu,
  showVerifactuQRModal,
  showVerifactuCSVModal,
};

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
                <th scope="col"><span class="visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              <!-- Se llenará dinámicamente -->
            </tbody>
          </table>
        </div>
        <footer class="invoices-table__footer">
          <p data-result-count>Cargando...</p>
          <div class="invoices-table__pager" data-pagination="invoices"></div>
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
