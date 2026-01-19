# ANÁLISIS MODAL 4: REGISTRAR PAGO
## 🔴 ENDPOINT FALTANTE - Sistema de Pagos INCOMPLETO

**Versión:** 1.0  
**Fecha:** 19 Enero 2026  
**Base:** invoices-with-api.js (líneas 2550-2700)  
**Estado:** 25% Implementado (CRÍTICAS FALLAS)  
**Severidad:** 🔴 CRÍTICO - Pagos NO se guardan en BD

---

## 📍 UBICACIÓN EN CÓDIGO

- **Función Apertura:** `openAddPaymentModal(invoiceId)` (línea 2550)
- **Función Envío:** `submitAddPayment()` (línea 2700)
- **Archivo:** `frontend/src/pages/invoices-with-api.js`
- **Backend:** `backend/src/api/invoices/routes.ts` - ENDPOINT FALTA
- **Backend:** `backend/src/api/invoices/controller.ts` - Función createPayment FALTA

---

## 🔍 CÓDIGO ACTUAL - Frontend

### openAddPaymentModal() - Línea 2550

```javascript
async function openAddPaymentModal(invoiceId = null) {
  try {
    // showNotification('Preparando formulario de pago...', 'info');

    // LÍNEA 2554: Obtener ID de factura
    const targetInvoiceId = invoiceId || selectedInvoiceId;
    
    if (!targetInvoiceId) {
      showNotification('Por favor, selecciona una factura para registrar el pago', 'warning');
      return;
    }

    let invoice = null;
    try {
      // LÍNEA 2562: Cargar factura
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

    // 🔴 LÍNEA 2575: BUG CRÍTICO - alreadyPaid HARDCODEADO A CERO
    const totalInvoice = sanitizeNumber(invoice.total, 0);
    const alreadyPaid = 0;  // ⚠️ SIEMPRE CERO!!!
    const remainingAmount = totalInvoice - alreadyPaid;  // LÍNEA 2576

    // DEBERÍA SER:
    // const alreadyPaid = sanitizeNumber(invoice.paid_amount, 0);

    const today = new Date().toISOString().split('T')[0];

    const modalHTML = `
      <div class="modal is-open" id="add-payment-modal">
        <div class="modal__head">
          <h2>Registrar Pago - ${invoice.invoiceNumber}</h2>
        </div>

        <div class="modal__body">
          <form id="add-payment-form">
            <input type="hidden" name="invoice_id" value="${targetInvoiceId}" />

            <!-- Mostrar resumen -->
            <div class="payment-summary">
              <div class="payment-summary__row">
                <span>Total Factura:</span>
                <strong>${formatCurrency(totalInvoice)}</strong>
              </div>
              <div class="payment-summary__row">
                <span>Ya Pagado:</span>
                <strong>${formatCurrency(alreadyPaid)}</strong>
              </div>
              <div class="payment-summary__row">
                <span>Pendiente:</span>
                <strong>${formatCurrency(remainingAmount)}</strong>
              </div>
            </div>

            <!-- IMPORTE -->
            <label class="form-field">
              <span>Importe del Pago *</span>
              <input 
                type="number" 
                id="payment-amount" 
                name="amount"
                step="0.01"
                min="0.01"
                max="${remainingAmount}" 
                value="${remainingAmount.toFixed(2)}" 
                required
              />
              <small>Máximo: ${formatCurrency(remainingAmount)}</small>
            </label>

            <!-- FECHA -->
            <label class="form-field">
              <span>Fecha Pago *</span>
              <input 
                type="date" 
                id="payment-date" 
                name="payment_date"
                value="${today}" 
                max="${today}" 
                required
              />
            </label>

            <!-- MÉTODO -->
            <label class="form-field">
              <span>Método de Pago *</span>
              <select id="payment-method" name="payment_method" required>
                <option value="">-- Seleccionar --</option>
                <option value="bank_transfer" selected>Transferencia Bancaria</option>
                <option value="card">Tarjeta de Crédito</option>
                <option value="cash">Efectivo</option>
                <option value="check">Cheque</option>
                <option value="other">Otro</option>
              </select>
            </label>

            <!-- ID TRANSACCIÓN (opcional) -->
            <label class="form-field">
              <span>ID Transacción (opcional)</span>
              <input 
                type="text" 
                id="payment-transaction-id" 
                name="transaction_id"
                placeholder="Ej: TRN-2025-001"
              />
            </label>

            <!-- NOTAS (opcional) -->
            <label class="form-field">
              <span>Notas (opcional)</span>
              <textarea 
                id="payment-notes" 
                name="notes"
                placeholder="Observaciones sobre el pago"
              ></textarea>
            </label>
          </form>
        </div>

        <footer class="modal__foot">
          <button onclick="closeAddPaymentModal()" class="button button--secondary">
            Cancelar
          </button>
          <button onclick="submitAddPayment()" class="button--primary">
            Registrar Pago
          </button>
        </footer>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // LÍNEA ~2640: Validación de importe máximo
    const amountInput = document.getElementById('payment-amount');
    if (amountInput) {
      amountInput.addEventListener('input', () => {
        const value = sanitizeNumber(amountInput.value, 0);
        if (value > remainingAmount) {
          amountInput.setCustomValidity(
            `Máximo permitido: ${formatCurrency(remainingAmount)}`
          );
        } else if (value <= 0) {
          amountInput.setCustomValidity('Debe ser positivo');
        } else {
          amountInput.setCustomValidity('');
        }
      });
    }

  } catch (error) {
    console.error('Error al abrir modal de pago:', error);
    showNotification('Error al abrir el formulario de pago', 'error');
  }
}
```

### submitAddPayment() - Línea 2700

```javascript
async function submitAddPayment() {
  const form = document.getElementById('add-payment-form');
  if (!form) return;

  const formData = new FormData(form);
  
  // LÍNEA ~2708: Validaciones HTML5
  const amountInput = document.getElementById('payment-amount');
  const dateInput = document.getElementById('payment-date');
  const methodSelect = document.getElementById('payment-method');

  if (!amountInput.checkValidity() || !dateInput.checkValidity() || !methodSelect.checkValidity()) {
    amountInput.reportValidity() || dateInput.reportValidity() || methodSelect.reportValidity();
    return;
  }

  const paymentData = {  // LÍNEA ~2720
    invoice_id: formData.get('invoice_id'),
    amount: sanitizeNumber(formData.get('amount'), 0),
    payment_date: formData.get('payment_date'),
    payment_method: formData.get('payment_method'),
    transaction_id: formData.get('transaction_id') || null,
    notes: formData.get('notes') || null
  };

  // LÍNEA ~2731: Validación importe > 0
  if (paymentData.amount <= 0) {
    showNotification('El importe del pago debe ser mayor que 0', 'error');
    return;
  }

  // LÍNEA ~2737: Validación método
  if (!paymentData.payment_method) {
    showNotification('Selecciona un método de pago', 'error');
    return;
  }

  try {
    showNotification('Registrando pago...', 'info');

    // 🔴 LÍNEA ~2745: ENDPOINT NO EXISTE
    // const response = await window.api.createPayment(paymentData);
    
    // TEMPORAL: Simular respuesta exitosa
    console.log('Datos del pago a registrar:', paymentData);
    
    // 🔴 Esperar silenciosamente para simular éxito
    await new Promise(resolve => setTimeout(resolve, 500));

    // 🔴 MOSTRAR COMO SI FUNCIONARA
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
```

---

## ✅ VALIDACIONES EXISTENTES

| # | Validación | Línea | Estado |
|---|-----------|-------|--------|
| 1 | invoiceId requerido | 2554 | ✅ |
| 2 | Factura cargada | 2562 | ✅ |
| 3 | Importe <= pendiente | 2640 | ✅ |
| 4 | Importe > 0 | 2731 | ✅ |
| 5 | Método seleccionado | 2737 | ✅ |

**Implementación:** 5/20 validaciones = **25%**

**PERO:** El endpoint NO existe, por lo que NADA se persiste

---

## 🔴 VULNERABILIDAD CRÍTICA 1: alreadyPaid Hardcodeado

**Severidad:** 🔴 CRÍTICO  
**Línea:** 2575  
**Tipo:** Logic Error / Data Inconsistency

```javascript
// ACTUAL
const alreadyPaid = 0;  // ⚠️ SIEMPRE CERO
const remainingAmount = totalInvoice - alreadyPaid;

// ESCENARIO
// Factura: €1000
// Usuario paga €600 (se registra)
// Vuelve a abrir modal de pago
// Modal muestra: "Ya Pagado: €0" (INCORRECTO)
// Pendiente: €1000 (INCORRECTO, debería ser €400)
// Usuario paga otro €500
// Sistema muestra €1100 pagado en factura de €1000
```

**Solución Necesaria:**

```javascript
// CORRECCIÓN
const alreadyPaid = sanitizeNumber(invoice.paid_amount, 0);
const remainingAmount = totalInvoice - alreadyPaid;

// PERO REQUIERE:
// 1. invoice.paid_amount debe existir en schema (ADD COLUMN)
// 2. paid_amount debe actualizarse cada vez que registren pago
// 3. No es automático - requiere endpoint que actualice
```

---

## 🔴 VULNERABILIDAD CRÍTICA 2: Endpoint NO Existe

**Severidad:** 🔴 CRÍTICO  
**Archivo Faltante:** `backend/src/api/invoices/routes.ts`  
**Función Faltante:** `controller.ts` - `createPayment()`

### Búsqueda en routes.ts

```typescript
// backend/src/api/invoices/routes.ts - ACTUAL

router.get('/:id', invoiceController.getInvoiceById);
router.post('/', invoiceController.createInvoice);
router.put('/:id', invoiceController.updateInvoice);
router.post('/:id/mark-paid', invoiceController.markAsPaid);  // ✅ EXISTE
router.delete('/:id', invoiceController.deleteInvoice);

// 🔴 FALTANTE:
// router.post('/:id/payments', invoiceController.createPayment);
// router.get('/:id/payments', invoiceController.getPayments);
// router.get('/:id/audit-log', invoiceController.getAuditLog);
```

### Impacto del Endpoint Faltante

```javascript
// Frontend intenta:
await window.api.createPayment(paymentData);

// Pero routes.ts NO tiene:
router.post('/invoices/:id/payments', ...)

// Resultado:
// 1. Request cae en void
// 2. Frontend simula éxito (await new Promise)
// 3. Usuario cree que fue registrado
// 4. BD NO registra NADA
// 5. Siguiente apertura del modal: alreadyPaid sigue en 0
// 6. Usuario registra pago "nuevo" (es el mismo)
// 7. Pagos duplicados o perdidos
```

---

## ❌ VALIDACIONES FALTANTES

### FRONTEND

#### 1. Validar Amount <= Remaining

**Ubicación:** submitAddPayment() línea ~2731  
**Estado:** ✅ Existe (línea 2640)

---

#### 2. Validar Fecha <= Hoy

**Especificación:** No puede registrar pago futuro

```javascript
// AGREGAR VALIDACIÓN EN submitAddPayment():
const paymentDate = new Date(paymentData.payment_date);
const today = new Date();
today.setHours(0, 0, 0, 0);

if (paymentDate > today) {
  showNotification('La fecha del pago no puede ser futura', 'warning');
  return;
}
```

---

#### 3. Confirmar Detalles Antes de Guardar

**Especificación:** Mostrar resumen de lo que se va a registrar

```javascript
// AGREGAR CONFIRMACIÓN:
const confirm = window.confirm(
  `Confirmar registro de pago:\n` +
  `Factura: ${paymentData.invoice_id}\n` +
  `Importe: ${formatCurrency(paymentData.amount)}\n` +
  `Fecha: ${paymentData.payment_date}\n` +
  `Método: ${paymentData.payment_method}\n\n` +
  `¿Deseas continuar?`
);

if (!confirm) {
  showNotification('Operación cancelada', 'info');
  return;
}
```

---

### BACKEND - ENDPOINTS FALTANTES

#### 4. POST /api/invoices/:id/payments

**Archivo:** `backend/src/api/invoices/routes.ts`  
**Nuevo Endpoint:** router.post('/:id/payments', createPayment)  
**Tiempo Estimado:** 2-3 horas  
**Severidad:** 🔴 CRÍTICO

```typescript
// backend/src/api/invoices/routes.ts - AGREGAR:
router.post('/:id/payments',
  [
    body('amount').isFloat({ min: 0.01 }).custom(value => {
      if (value > 999999.99) throw new Error('Monto máximo excedido');
      return true;
    }),
    body('payment_date').isISO8601(),
    body('payment_method').isString().trim(),
    body('transaction_id').optional().isString().trim(),
    body('notes').optional().isString().trim()
  ],
  invoiceController.validate,
  invoiceController.createPayment
);

// backend/src/api/invoices/controller.ts - NUEVA FUNCIÓN:
export const createPayment = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const invoiceId = req.params.id as string;
    
    // PASO 1: Obtener factura
    const invoiceResult = await db.query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [invoiceId, userId]
    );
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
    const invoice = invoiceResult.rows[0];
    
    // PASO 2: Validar status (sent, partial, overdue, pero NO draft/cancelled)
    const validStatuses = ['sent', 'partial', 'overdue', 'paid'];
    if (!validStatuses.includes(invoice.status)) {
      return res.status(400).json({ 
        error: 'No se pueden registrar pagos en esta factura',
        currentStatus: invoice.status
      });
    }
    
    // PASO 3: Calcular monto ya pagado
    const previousPaymentsResult = await db.query(
      'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE invoice_id = $1',
      [invoiceId]
    );
    
    const alreadyPaid = parseFloat(previousPaymentsResult.rows[0].total_paid);
    const remaining = invoice.total - alreadyPaid;
    
    // PASO 4: Validar monto del pago
    const paymentAmount = parseFloat(req.body.amount);
    
    if (paymentAmount > remaining) {
      return res.status(400).json({ 
        error: 'El pago excede el monto pendiente',
        pendingAmount: remaining,
        attemptedAmount: paymentAmount
      });
    }
    
    if (paymentAmount <= 0) {
      return res.status(400).json({ error: 'El pago debe ser positivo' });
    }
    
    // PASO 5: Validar fecha
    const paymentDate = new Date(req.body.payment_date);
    const today = new Date();
    if (paymentDate > today) {
      return res.status(400).json({ error: 'No se pueden registrar pagos futuros' });
    }
    
    // PASO 6: Crear pago
    const paymentId = uuid();
    const insertResult = await db.query(
      `INSERT INTO payments 
       (id, user_id, invoice_id, amount, payment_date, payment_method, transaction_id, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        paymentId,
        userId,
        invoiceId,
        paymentAmount,
        req.body.payment_date,
        req.body.payment_method,
        req.body.transaction_id || null,
        req.body.notes || null
      ]
    );
    
    const payment = insertResult.rows[0];
    
    // PASO 7: Actualizar invoice.paid_amount y status
    const newPaidAmount = alreadyPaid + paymentAmount;
    const newStatus = Math.abs(newPaidAmount - invoice.total) < 0.01 ? 'paid' : 'partial';
    
    await db.query(
      `UPDATE invoices 
       SET paid_amount = $1, status = $2, updated_at = NOW()
       WHERE id = $3`,
      [newPaidAmount, newStatus, invoiceId]
    );
    
    // PASO 8: Registrar en audit_log
    await db.query(
      `INSERT INTO invoice_audit_log 
       (invoice_id, user_id, action, old_value, new_value, change_reason, created_at)
       VALUES ($1, $2, 'payment_received', $3, $4, $5, NOW())`,
      [
        invoiceId,
        userId,
        alreadyPaid.toString(),
        newPaidAmount.toString(),
        `Pago de €${paymentAmount} por ${req.body.payment_method}`
      ]
    );
    
    // PASO 9: Retornar respuesta
    res.status(201).json({
      payment,
      invoice: {
        id: invoiceId,
        newPaidAmount,
        newStatus,
        remaining: invoice.total - newPaidAmount
      }
    });
    
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Error al registrar el pago' });
  }
};
```

---

#### 5. GET /api/invoices/:id/payments

**Propósito:** Obtener historial de pagos

```typescript
// backend/src/api/invoices/routes.ts - AGREGAR:
router.get('/:id/payments', invoiceController.getPayments);

// backend/src/api/invoices/controller.ts - NUEVA FUNCIÓN:
export const getPayments = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const invoiceId = req.params.id as string;

    // Verificar que factura existe
    const invoiceCheck = await db.query(
      'SELECT id FROM invoices WHERE id = $1 AND user_id = $2',
      [invoiceId, userId]
    );

    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    // Obtener pagos
    const paymentsResult = await db.query(
      `SELECT p.*, u.name as created_by_name
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.invoice_id = $1
       ORDER BY p.payment_date DESC, p.created_at DESC`,
      [invoiceId]
    );

    res.json({ 
      payments: paymentsResult.rows,
      total: paymentsResult.rows.reduce((sum, p) => sum + p.amount, 0)
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
};
```

---

#### 6. Database - Agregar Columna paid_amount

**Archivo:** `backend/src/database/init.sql`  
**Tiempo:** 15 minutos

```sql
-- Agregar columna a tabla invoices (si no existe)
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12, 2) DEFAULT 0;

-- Crear índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_invoices_paid_amount ON invoices(paid_amount);

-- Crear trigger para actualizar status automáticamente
CREATE OR REPLACE FUNCTION update_invoice_status_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_total DECIMAL(12, 2);
  v_paid DECIMAL(12, 2);
BEGIN
  SELECT total INTO v_total FROM invoices WHERE id = NEW.invoice_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_paid FROM payments WHERE invoice_id = NEW.invoice_id;
  
  UPDATE invoices 
  SET status = CASE 
    WHEN v_paid >= v_total THEN 'paid'
    WHEN v_paid > 0 THEN 'partial'
    ELSE status
  END,
  paid_amount = v_paid
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Registrar trigger
DROP TRIGGER IF EXISTS invoice_status_on_payment ON payments;
CREATE TRIGGER invoice_status_on_payment
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_status_on_payment();
```

---

## 📊 MATRIZ DE IMPLEMENTACIÓN

| # | Validación | Especificación | Frontend | Backend | ¿Falta? |
|----|-----------|----------------|----------|---------|---------|
| 1 | invoiceId obligatorio | ✅ | ✅ | N/A | |
| 2 | Factura cargada | ✅ | ✅ | N/A | |
| 3 | Importe > 0 | ✅ | ✅ | ❌ | Backend |
| 4 | Importe <= pendiente | ✅ | ✅ | ❌ | Backend |
| 5 | Método obligatorio | ✅ | ✅ | ❌ | Backend |
| 6 | Fecha <= hoy | ✅ | ❌ | ❌ | Ambos |
| 7 | Persistir en BD | ✅ | ❌ | 🔴 **NO** | 🔴 |
| 8 | Crear tabla payments | ✅ | N/A | ✅ | |
| 9 | Actualizar paid_amount | ✅ | ❌ | 🔴 **NO** | 🔴 |
| 10 | Transición a 'partial' | ✅ | ❌ | 🔴 **NO** | 🔴 |
| 11 | Transición a 'paid' | ✅ | ❌ | 🔴 **NO** | 🔴 |
| 12 | Audit log | ✅ | ❌ | 🔴 **NO** | 🔴 |
| 13 | GET /payments | ✅ | ❌ | 🔴 **NO** | 🔴 |
| 14 | Mostrar historial | ✅ | ❌ | ❌ | Frontend |
| 15 | Mostrar paid vs pending | ✅ | ❌ | ❌ | Frontend |

**Implementación TOTAL:** 5/15 = **33%**

**CRÍTICO:** Endpoint para guardar NO existe (0% backend)

---

## 🔴 RESUMEN DE RIESGOS

| Riesgo | Severidad | Impacto |
|--------|-----------|---------|
| Endpoint POST /payments NO existe | 🔴 CRÍTICO | Pagos NO se guardan |
| alreadyPaid hardcodeado a 0 | 🔴 CRÍTICO | Monto incorrecto mostrado |
| Sin actualización de paid_amount | 🔴 CRÍTICO | Status inconsistente |
| Sin transición de status | 🔴 CRÍTICO | Pagos parciales NO funcionan |
| Sin audit log | 🟠 ALTA | Sin trazabilidad |
| Sin validación fecha futura | 🟠 ALTA | Pagos backdated |

---

## ✅ PLAN DE CORRECCIÓN

### P0 - CRÍTICO (INMEDIATO)

```
1. Database: Agregar paid_amount a invoices
   Tiempo: 15 minutos
   
2. Backend: Crear POST /api/invoices/:id/payments
   Tiempo: 2-3 horas
   Archivo: routes.ts + controller.ts
   
3. Backend: Crear GET /api/invoices/:id/payments
   Tiempo: 45 minutos
   
4. Frontend: Fijar alreadyPaid a invoice.paid_amount
   Tiempo: 15 minutos
   
5. Frontend: Validar fecha <= hoy
   Tiempo: 30 minutos
   
TOTAL P0: ~5 horas
```

### P1 - ALTA (Semana 1)

```
6. Frontend: Confirmación de pago antes de guardar
   Tiempo: 45 minutos
   
7. Frontend: Mostrar payment history en modal VIEW
   Tiempo: 1 hora
   
8. Frontend: Recargar modal después de registrar pago
   Tiempo: 30 minutos
```

### P2 - MEDIA (Semana 2)

```
9. Frontend: Mostrar progreso de pago (paid/total)
   Tiempo: 45 minutos
   
10. Backend: Implementar trigger para actualizar status
    Tiempo: 30 minutos
```

---

## 📋 CHECKLIST CRÍTICO

- [ ] **P0-1:** Agregar paid_amount a BD
- [ ] **P0-2:** Backend POST /api/invoices/:id/payments ⭐ URGENTE
- [ ] **P0-3:** Backend GET /api/invoices/:id/payments
- [ ] **P0-4:** Frontend fijar alreadyPaid
- [ ] **P0-5:** Frontend validar fecha
- [ ] **P1-1:** Frontend confirmación
- [ ] **P1-2:** Frontend payment history
- [ ] **P2-1:** Frontend progress bar
- [ ] **P2-2:** Backend trigger status

---

## ⚠️ RECOMENDACIÓN CRÍTICA

**NO HABILITAR** sistema de pagos en producción hasta P0-1, P0-2, P0-3

**Riesgo Actual:**
- ✗ Usuarios registran pagos
- ✗ Pagos NO se guardan en BD
- ✗ Usuarios ven "éxito" en pantalla
- ✗ Datos se pierden silenciosamente
- ✗ Contabilidad descubre discrepancias después

**Tiempo de Implementación de P0:** ~5 horas  
**Tiempo de Testing:** ~2 horas  
**Total Recomendado:** 1 día completo

---

**Documento:** MODAL-4-REGISTRAR-PAGO-ANALISIS.md  
**Clasificación:** CRÍTICO - SISTEMA INCOMPLETO
