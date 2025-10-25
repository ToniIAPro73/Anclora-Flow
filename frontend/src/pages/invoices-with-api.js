// Módulo de Facturas con integración completa API y Verifactu
// Importar servicio API (asegúrate de que esté cargado)

// Estado global del módulo
let invoicesData = [];
let isLoading = false;
let currentFilters = {
  search: '',
  status: 'all',
  client: 'all'
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

async function loadInvoices() {
  isLoading = true;
  renderLoadingState();

  try {
    // Verificar que api esté disponible
    if (typeof window.api === 'undefined') {
      throw new Error('Servicio API no disponible. Asegúrate de que api.js esté cargado.');
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

    renderInvoicesTable();
    updateSummaryCards();

  } catch (error) {
    console.error('Error cargando facturas:', error);
    renderErrorState(error.message);
    showNotification(error.message || 'Error al cargar facturas', 'error');
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

    const result = await window.api.registerInvoiceVerifactu(invoiceId);

    // Actualizar factura con los datos devueltos
    if (invoice) {
      invoice.verifactuStatus = 'registered';
      invoice.verifactuCsv = result.invoice.verifactu_csv;
      invoice.verifactuQrCode = result.invoice.verifactu_qr_code;
      invoice.verifactuUrl = result.invoice.verifactu_url;
      invoice.verifactuHash = result.invoice.verifactu_hash;
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
            <p><strong>CSV:</strong> <code style="background: #f7fafc; padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace;">${invoice.verifactuCsv}</code></p>
          </div>
          <div style="display: flex; justify-content: center; margin-bottom: 1.5rem;">
            <img src="${invoice.verifactuQrCode}" alt="QR Verifactu" style="max-width: 300px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; background: white;">
          </div>
          <p style="font-size: 0.9rem; color: #718096;">
            Escanea este código QR para verificar la factura en la web de la Agencia Tributaria.
          </p>
          ${invoice.verifactuUrl ? `<p style="font-size: 0.85rem; margin-top: 1rem;"><a href="${invoice.verifactuUrl}" target="_blank" style="color: #4299e1;">Verificar en AEAT →</a></p>` : ''}
        </div>
        <footer class="modal__footer">
          <button class="btn-secondary" onclick="document.getElementById('verifactu-qr-modal').remove()">Cerrar</button>
          <a href="${invoice.verifactuQrCode}" download="qr-${invoice.number}.png" class="btn-primary" style="text-decoration: none; display: inline-block;">
            Descargar QR
          </a>
        </footer>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
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
          ${invoice.verifactuHash ? `
          <div style="margin-top: 1.5rem; font-size: 0.85rem;">
            <p><strong>Hash SHA-256:</strong></p>
            <p style="font-family: monospace; background: #f7fafc; padding: 0.5rem; border-radius: 4px; word-break: break-all; color: #4a5568;">
              ${invoice.verifactuHash}
            </p>
          </div>
          ` : ''}
          <p style="font-size: 0.9rem; color: #718096; margin-top: 1.5rem;">
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

    // Obtener detalles completos de la factura con items
    const invoice = await window.api.getInvoice(invoiceId);

    // Calcular subtotal de items
    const itemsSubtotal = invoice.items ? invoice.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) : 0;

    const modalHTML = `
      <div class="modal modal--open" id="view-invoice-modal">
        <div class="modal__backdrop" onclick="document.getElementById('view-invoice-modal').remove()"></div>
        <div class="modal__panel" style="max-width: 800px;">
          <header class="modal__head">
            <div>
              <h2 class="modal__title">Factura ${invoice.invoice_number}</h2>
              <p class="modal__subtitle">Detalles completos de la factura</p>
            </div>
            <button type="button" class="modal__close" onclick="document.getElementById('view-invoice-modal').remove()">×</button>
          </header>
          <div class="modal__body">
            <!-- Información general -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
              <div>
                <h3 style="font-size: 0.875rem; font-weight: 600; color: #4a5568; margin-bottom: 0.5rem;">Cliente</h3>
                <p style="font-size: 1rem; color: #1a202c;">${invoice.client?.name || invoice.client_name || 'Sin cliente'}</p>
                ${invoice.client?.email ? `<p style="font-size: 0.875rem; color: #718096;">${invoice.client.email}</p>` : ''}
              </div>
              <div>
                <h3 style="font-size: 0.875rem; font-weight: 600; color: #4a5568; margin-bottom: 0.5rem;">Estado</h3>
                <span class="badge badge--${statusMap[invoice.status]?.tone || 'neutral'}">
                  ${statusMap[invoice.status]?.label || invoice.status}
                </span>
              </div>
              <div>
                <h3 style="font-size: 0.875rem; font-weight: 600; color: #4a5568; margin-bottom: 0.5rem;">Fecha emisión</h3>
                <p style="font-size: 1rem; color: #1a202c;">${formatDate(invoice.issue_date)}</p>
              </div>
              <div>
                <h3 style="font-size: 0.875rem; font-weight: 600; color: #4a5568; margin-bottom: 0.5rem;">Fecha vencimiento</h3>
                <p style="font-size: 1rem; color: #1a202c;">${formatDate(invoice.due_date)}</p>
              </div>
            </div>

            <!-- Líneas de factura -->
            ${invoice.items && invoice.items.length > 0 ? `
              <div style="margin-bottom: 2rem;">
                <h3 style="font-size: 1rem; font-weight: 600; color: #1a202c; margin-bottom: 1rem;">Conceptos</h3>
                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #f7fafc; border-bottom: 2px solid #e2e8f0;">
                        <th style="padding: 0.75rem; text-align: left; font-size: 0.875rem; color: #4a5568;">Descripción</th>
                        <th style="padding: 0.75rem; text-align: center; font-size: 0.875rem; color: #4a5568;">Cantidad</th>
                        <th style="padding: 0.75rem; text-align: right; font-size: 0.875rem; color: #4a5568;">P. Unitario</th>
                        <th style="padding: 0.75rem; text-align: right; font-size: 0.875rem; color: #4a5568;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${invoice.items.map(item => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                          <td style="padding: 0.75rem; color: #1a202c;">${item.description}</td>
                          <td style="padding: 0.75rem; text-align: center; color: #718096;">${item.quantity} ${item.unit_type || ''}</td>
                          <td style="padding: 0.75rem; text-align: right; color: #718096;">${currencyFormatter.format(item.unit_price)}</td>
                          <td style="padding: 0.75rem; text-align: right; font-weight: 600; color: #1a202c;">${currencyFormatter.format(item.amount)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : ''}

            <!-- Totales -->
            <div style="border-top: 2px solid #e2e8f0; padding-top: 1.5rem;">
              <div style="display: flex; justify-content: flex-end;">
                <div style="width: 300px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: #718096;">Subtotal:</span>
                    <span style="color: #1a202c; font-weight: 500;">${currencyFormatter.format(invoice.subtotal)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: #718096;">IVA (${invoice.vat_percentage}%):</span>
                    <span style="color: #1a202c; font-weight: 500;">${currencyFormatter.format(invoice.vat_amount)}</span>
                  </div>
                  ${invoice.irpf_amount > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                      <span style="color: #718096;">IRPF (${invoice.irpf_percentage}%):</span>
                      <span style="color: #c53030; font-weight: 500;">-${currencyFormatter.format(invoice.irpf_amount)}</span>
                    </div>
                  ` : ''}
                  <div style="display: flex; justify-content: space-between; padding-top: 0.75rem; border-top: 2px solid #e2e8f0; margin-top: 0.75rem;">
                    <span style="color: #1a202c; font-weight: 700; font-size: 1.125rem;">Total:</span>
                    <span style="color: #1a202c; font-weight: 700; font-size: 1.125rem;">${currencyFormatter.format(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            ${invoice.notes ? `
              <div style="margin-top: 1.5rem; padding: 1rem; background-color: #f7fafc; border-radius: 0.5rem;">
                <h3 style="font-size: 0.875rem; font-weight: 600; color: #4a5568; margin-bottom: 0.5rem;">Notas</h3>
                <p style="color: #718096; white-space: pre-wrap;">${invoice.notes}</p>
              </div>
            ` : ''}
          </div>
          <footer class="modal__footer">
            <button class="btn-secondary" onclick="document.getElementById('view-invoice-modal').remove()">Cerrar</button>
            <button class="btn-primary" onclick="downloadInvoicePDF('${invoice.id}')">
              Descargar PDF
            </button>
          </footer>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Remover notificación de carga
    const notifications = document.querySelectorAll('.notification--info');
    notifications.forEach(n => n.remove());

  } catch (error) {
    console.error('Error viewing invoice:', error);
    showNotification(`Error al cargar la factura: ${error.message}`, 'error');
  }
}

// Editar factura
function editInvoice(invoiceId) {
  showNotification('Función de edición en desarrollo', 'info');
  // TODO: Implementar modal de edición completo
  console.log('Edit invoice:', invoiceId);
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
        <button type="button" class="table-action" title="Ver QR Verifactu" onclick="showVerifactuQRModal(${JSON.stringify(invoice).replace(/"/g, '&quot;')})">
          <span>🔲</span>
        </button>
        <button type="button" class="table-action" title="Ver CSV" onclick="showVerifactuCSVModal(${JSON.stringify(invoice).replace(/"/g, '&quot;')})">
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

    return `
      <tr data-invoice-id="${invoice.id}">
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
        <td data-column="Acciones" class="invoices-table__actions">
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
  window.downloadInvoicePDF = downloadInvoicePDF;

  // Cargar facturas automáticamente
  loadInvoices();

  // Configurar filtros
  setupFilters();
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
