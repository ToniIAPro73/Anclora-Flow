// ==========================================
// MODAL: AÑADIR COBRO
// ==========================================

async function openAddPaymentModal(invoiceId = null) {
  try {
    showNotification('Preparando formulario de pago...', 'info');

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
    const alreadyPaid = 0; // TODO: Calcular de la suma de pagos existentes cuando tengamos la API
    const remainingAmount = totalInvoice - alreadyPaid;

    const today = formatDateForInput(new Date());

    const modalHTML = `
      <div class="modal is-open" id="add-payment-modal">
        <div class="modal__backdrop" onclick="closeAddPaymentModal()"></div>
        <div class="modal__panel" style="width: min(95vw, 700px); max-width: 700px; max-height: 85vh; display: flex; flex-direction: column;">
          <header class="modal__head" style="flex-shrink: 0; padding: 1.25rem 1.5rem;">
            <div>
              <h2 class="modal__title" style="margin: 0; font-size: 1.4rem; font-weight: 700;">💰 Registrar Pago</h2>
              <p class="modal__subtitle" style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">
                Factura: <strong>${escapeHtml(invoice.invoice_number || invoice.invoiceNumber)}</strong> 
                ${invoice.client_name || invoice.clientName ? `• Cliente: ${escapeHtml(invoice.client_name || invoice.clientName)}` : ''}
              </p>
            </div>
            <button type="button" class="modal__close" onclick="closeAddPaymentModal()">&times;</button>
          </header>
          
          <div class="modal__body" style="flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem;">
            <form id="add-payment-form">
              <!-- Información de la factura -->
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.9rem;">
                  <div>
                    <div style="opacity: 0.9; margin-bottom: 0.25rem; font-size: 0.8rem;">Total factura</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${formatCurrency(totalInvoice)}</div>
                  </div>
                  <div>
                    <div style="opacity: 0.9; margin-bottom: 0.25rem; font-size: 0.8rem;">Pendiente de pago</div>
                    <div style="font-size: 1.75rem; font-weight: 700; color: ${remainingAmount > 0 ? '#fbbf24' : '#34d399'};">
                      ${formatCurrency(remainingAmount)}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Campos del formulario -->
              <div style="display: grid; gap: 1.25rem;">
                <!-- Importe -->
                <div>
                  <label for="payment-amount" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem; color: var(--text-primary);">
                    Importe del pago <span style="color: #ef4444;">*</span>
                  </label>
                  <div style="position: relative;">
                    <input 
                      type="number" 
                      id="payment-amount" 
                      name="amount" 
                      class="form-input" 
                      value="${remainingAmount.toFixed(2)}"
                      step="0.01" 
                      min="0.01"
                      max="${remainingAmount}"
                      required 
                      style="width: 100%; padding: 0.75rem; font-size: 1.1rem; font-weight: 600; padding-right: 3rem;" 
                      placeholder="0.00"
                    />
                    <span style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-size: 1.1rem; font-weight: 600;">€</span>
                  </div>
                  <p style="margin: 0.4rem 0 0 0; font-size: 0.8rem; color: var(--text-secondary);">
                    💡 Importe máximo disponible: <strong>${formatCurrency(remainingAmount)}</strong>
                  </p>
                </div>

                <!-- Fecha y Método de pago en dos columnas -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <!-- Fecha de pago -->
                  <div>
                    <label for="payment-date" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem; color: var(--text-primary);">
                      Fecha del pago <span style="color: #ef4444;">*</span>
                    </label>
                    <input 
                      type="date" 
                      id="payment-date" 
                      name="payment_date" 
                      class="form-input" 
                      value="${today}" 
                      max="${today}"
                      required 
                      style="width: 100%; padding: 0.75rem; font-size: 0.95rem;" 
                    />
                  </div>

                  <!-- Método de pago -->
                  <div>
                    <label for="payment-method" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem; color: var(--text-primary);">
                      Método de pago <span style="color: #ef4444;">*</span>
                    </label>
                    <select 
                      id="payment-method" 
                      name="payment_method" 
                      class="form-input" 
                      required 
                      style="width: 100%; padding: 0.75rem; font-size: 0.95rem;"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="bank_transfer" selected>🏦 Transferencia Bancaria</option>
                      <option value="card">💳 Tarjeta</option>
                      <option value="cash">💵 Efectivo</option>
                      <option value="cheque">📝 Cheque</option>
                      <option value="paypal">🅿️ PayPal</option>
                      <option value="stripe">💠 Stripe</option>
                      <option value="other">📦 Otro</option>
                    </select>
                  </div>
                </div>

                <!-- ID de transacción (opcional) -->
                <div>
                  <label for="payment-transaction-id" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem; color: var(--text-primary);">
                    ID de Transacción <span style="font-weight: 400; color: var(--text-secondary); font-size: 0.85rem;">(opcional)</span>
                  </label>
                  <input 
                    type="text" 
                    id="payment-transaction-id" 
                    name="transaction_id" 
                    class="form-input" 
                    placeholder="Ej: TRX-2024-001234" 
                    maxlength="255"
                    style="width: 100%; padding: 0.75rem; font-size: 0.95rem;" 
                  />
                </div>

                <!-- Notas (opcional) -->
                <div>
                  <label for="payment-notes" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem; color: var(--text-primary);">
                    Notas <span style="font-weight: 400; color: var(--text-secondary); font-size: 0.85rem;">(opcional)</span>
                  </label>
                  <textarea 
                    id="payment-notes" 
                    name="notes" 
                    rows="3" 
                    class="form-input" 
                    placeholder="Observaciones sobre el pago..."
                    maxlength="500"
                    style="resize: vertical; width: 100%; padding: 0.75rem; font-size: 0.95rem;"
                  ></textarea>
                </div>
              </div>

              <input type="hidden" name="invoice_id" value="${targetInvoiceId}" />
            </form>
          </div>
          
          <footer class="modal__footer modal-form__footer" style="flex-shrink: 0; padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" class="btn-secondary" onclick="closeAddPaymentModal()" style="padding: 0.75rem 1.5rem;">
              Cancelar
            </button>
            <button type="button" class="btn-primary" onclick="submitAddPayment()" style="padding: 0.75rem 1.5rem; font-weight: 600;">
              💾 Registrar Pago
            </button>
          </footer>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Validación de importe en tiempo real
    const amountInput = document.getElementById('payment-amount');
    if (amountInput) {
      amountInput.addEventListener('input', () => {
        const value = sanitizeNumber(amountInput.value, 0);
        if (value > remainingAmount) {
          amountInput.setCustomValidity(`El importe no puede superar ${formatCurrency(remainingAmount)}`);
        } else if (value <= 0) {
          amountInput.setCustomValidity('El importe debe ser mayor que 0');
        } else {
          amountInput.setCustomValidity('');
        }
      });
    }

    // Validación de fecha (no puede ser futura)
    const dateInput = document.getElementById('payment-date');
    if (dateInput) {
      dateInput.addEventListener('change', () => {
        const selectedDate = new Date(dateInput.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate > today) {
          dateInput.setCustomValidity('La fecha de pago no puede ser futura');
          showNotification('La fecha de pago no puede ser futura', 'warning');
        } else {
          dateInput.setCustomValidity('');
        }
      });
    }

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

    // TODO: Llamar a la API cuando esté disponible
    // const response = await window.api.createPayment(paymentData);
    
    // TEMPORAL: Simular respuesta exitosa
    console.log('Datos del pago a registrar:', paymentData);
    
    await new Promise(resolve => setTimeout(resolve, 500));

    showNotification('✅ Pago registrado correctamente', 'success');
    closeAddPaymentModal();
    
    // Recargar la lista de facturas para reflejar el cambio
    await loadInvoices();

  } catch (error) {
    console.error('Error al registrar pago:', error);
    showNotification(
      error?.message || 'Error al registrar el pago. Por favor, inténtalo de nuevo.',
      'error'
    );
  }
}

// Exportar funciones para uso global
window.openAddPaymentModal = openAddPaymentModal;
window.closeAddPaymentModal = closeAddPaymentModal;
window.submitAddPayment = submitAddPayment;
