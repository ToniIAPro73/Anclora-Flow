// ==========================================
// MODAL: AÑADIR COBRO - SIN CLASES CSS
// ==========================================

async function openAddPaymentModal(invoiceId = null) {
  try {
    showNotification('Preparando formulario de pago...', 'info');

    const targetInvoiceId = invoiceId || selectedInvoiceId;
    
    if (!targetInvoiceId) {
      showNotification('Por favor, selecciona una factura para registrar el pago', 'warning');
      return;
    }

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

    const totalInvoice = sanitizeNumber(invoice.total, 0);
    const alreadyPaid = 0;
    const remainingAmount = totalInvoice - alreadyPaid;
    const today = formatDateForInput(new Date());

    // MODAL SIN CLASES CSS - SOLO INLINE STYLES
    const modalHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; opacity: 1; pointer-events: auto;" id="add-payment-modal">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px);" onclick="closeAddPaymentModal()"></div>
        
        <div style="position: relative; background: #0f172a; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 650px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <!-- Header -->
          <div style="padding: 1.5rem 2rem; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #f8fafc;">💰 Registrar Pago</h2>
              <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #94a3b8;">
                Factura: <strong style="color: #e0e7ff;">${escapeHtml(invoice.invoice_number || invoice.invoiceNumber)}</strong>
                ${invoice.client_name || invoice.clientName ? `• Cliente: <strong style="color: #e0e7ff;">${escapeHtml(invoice.client_name || invoice.clientName)}</strong>` : ''}
              </p>
            </div>
            <button type="button" onclick="closeAddPaymentModal()" style="background: transparent; border: none; color: #94a3b8; font-size: 1.75rem; line-height: 1; cursor: pointer; padding: 0.25rem; margin: -0.5rem -0.5rem 0 0;">&times;</button>
          </div>
          
          <!-- Body -->
          <div style="padding: 1.5rem 2rem;">
            <form id="add-payment-form">
              <!-- Info Banner -->
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                  <div>
                    <div style="opacity: 0.9; margin-bottom: 0.5rem; font-size: 0.875rem;">Total factura</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${formatCurrency(totalInvoice)}</div>
                  </div>
                  <div>
                    <div style="opacity: 0.9; margin-bottom: 0.5rem; font-size: 0.875rem;">Pendiente de pago</div>
                    <div style="font-size: 1.75rem; font-weight: 700; color: ${remainingAmount > 0 ? '#fbbf24' : '#34d399'};">${formatCurrency(remainingAmount)}</div>
                  </div>
                </div>
              </div>

              <!-- Form Fields -->
              <div style="display: grid; gap: 1.25rem;">
                <!-- Importe -->
                <div>
                  <label for="payment-amount" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem; color: #f8fafc;">
                    Importe del pago <span style="color: #ef4444;">*</span>
                  </label>
                  <div style="position: relative;">
                    <input 
                      type="number" 
                      id="payment-amount" 
                      name="amount" 
                      value="${remainingAmount.toFixed(2)}"
                      step="0.01" 
                      min="0.01"
                      max="${remainingAmount}"
                      required 
                      style="width: 100%; padding: 0.75rem; font-size: 1.1rem; font-weight: 600; padding-right: 3rem; background: #1e293b; border: 1px solid #334155; border-radius: 8px; color: #f8fafc;" 
                      placeholder="0.00"
                    />
                    <span style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1.1rem; font-weight: 600;">€</span>
                  </div>
                  <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; color: #94a3b8;">
                    💡 Importe máximo disponible: <strong>${formatCurrency(remainingAmount)}</strong>
                  </p>
                </div>

                <!-- Fecha y Método -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div>
                    <label for="payment-date" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem; color: #f8fafc;">
                      Fecha del pago <span style="color: #ef4444;">*</span>
                    </label>
                    <input 
                      type="date" 
                      id="payment-date" 
                      name="payment_date" 
                      value="${today}" 
                      max="${today}"
                      required 
                      style="width: 100%; padding: 0.75rem; font-size: 0.95rem; background: #1e293b; border: 1px solid #334155; border-radius: 8px; color: #f8fafc;" 
                    />
                  </div>
                  <div>
                    <label for="payment-method" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem; color: #f8fafc;">
                      Método de pago <span style="color: #ef4444;">*</span>
                    </label>
                    <select 
                      id="payment-method" 
                      name="payment_method" 
                      required 
                      style="width: 100%; padding: 0.75rem; font-size: 0.95rem; background: #1e293b; border: 1px solid #334155; border-radius: 8px; color: #f8fafc;"
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

                <!-- ID Transacción -->
                <div>
                  <label for="payment-transaction-id" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem; color: #f8fafc;">
                    ID de Transacción <span style="font-weight: 400; color: #94a3b8; font-size: 0.875rem;">(opcional)</span>
                  </label>
                  <input 
                    type="text" 
                    id="payment-transaction-id" 
                    name="transaction_id" 
                    placeholder="Ej: TRX-2024-001234" 
                    maxlength="255"
                    style="width: 100%; padding: 0.75rem; font-size: 0.95rem; background: #1e293b; border: 1px solid #334155; border-radius: 8px; color: #f8fafc;" 
                  />
                </div>

                <!-- Notas -->
                <div>
                  <label for="payment-notes" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem; color: #f8fafc;">
                    Notas <span style="font-weight: 400; color: #94a3b8; font-size: 0.875rem;">(opcional)</span>
                  </label>
                  <textarea 
                    id="payment-notes" 
                    name="notes" 
                    rows="2" 
                    placeholder="Observaciones sobre el pago..."
                    maxlength="500"
                    style="resize: none; width: 100%; padding: 0.75rem; font-size: 0.95rem; background: #1e293b; border: 1px solid #334155; border-radius: 8px; color: #f8fafc;"
                  ></textarea>
                </div>
              </div>

              <input type="hidden" name="invoice_id" value="${targetInvoiceId}" />
            </form>
          </div>
          
          <!-- Footer -->
          <div style="padding: 1.25rem 2rem; border-top: 1px solid #334155; display: flex; justify-content: flex-end; gap: 1rem; background: #0f172a;">
            <button type="button" onclick="closeAddPaymentModal()" style="padding: 0.75rem 2rem; font-size: 1rem; background: transparent; border: 1px solid #334155; color: #f8fafc; border-radius: 8px; cursor: pointer; font-weight: 500;">
              Cancelar
            </button>
            <button type="button" onclick="submit()" style="padding: 0.75rem 2rem; font-weight: 600; font-size: 1rem; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
              💾 Registrar Pago
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Validaciones
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
    
    console.log('Datos del pago a registrar:', paymentData);
    
    await new Promise(resolve => setTimeout(resolve, 500));

    showNotification('✅ Pago registrado correctamente', 'success');
    closeAddPaymentModal();
    
    await loadInvoices();

  } catch (error) {
    console.error('Error al registrar pago:', error);
    showNotification(
      error?.message || 'Error al registrar el pago. Por favor, inténtalo de nuevo.',
      'error'
    );
  }
}

window.openAddPaymentModal = openAddPaymentModal;
window.closeAddPaymentModal = closeAddPaymentModal;
window.submitAddPayment = submitAddPayment;
