# ANÁLISIS MODAL 2: CONSULTAR FACTURA
## Lectura - Read-Only

**Versión:** 1.0  
**Fecha:** 19 Enero 2026  
**Base:** invoices-with-api.js (líneas 1722-1810)  
**Estado:** 46% Implementado

---

## 📍 UBICACIÓN EN CÓDIGO

- **Función:** `viewInvoice(invoiceId)` (línea 1722)
- **Archivo:** `frontend/src/pages/invoices-with-api.js`
- **Modo:** Read-only (lectura únicamente)
- **Acceso:** Click en fila de tabla de facturas

---

## 🔍 CÓDIGO ACTUAL

```javascript
// LÍNEA 1722: Inicio viewInvoice()
async function viewInvoice(invoiceId) {
  try {
    showNotification('Cargando detalles de la factura...', 'info');

    // LÍNEA 1725: Obtener datos de API
    const invoice = await window.api.getInvoice(invoiceId);

    // Formatear fechas para mostrar
    const issueDateValue = formatDateForInput(invoice.issue_date || invoice.issueDate);
    const dueDateValue = formatDateForInput(invoice.due_date || invoice.dueDate);

    const modalHTML = `
      <div class="modal is-open invoice-modal" id="view-invoice-modal">
        <header class="modal__head">
          <h2>${invoice.invoiceNumber || invoice.invoice_number}</h2>
          <!-- Botones: Editar, Pagar, Cerrar -->
          <div class="modal__actions">
            ${invoice.status === 'draft' ? `
              <button onclick="editInvoice('${invoiceId}')" class="button button--secondary">
                Editar
              </button>
            ` : ''}
            
            ${['sent', 'partial', 'overdue'].includes(invoice.status) ? `
              <button onclick="openAddPaymentModal('${invoiceId}')" class="button button--primary">
                Registrar Pago
              </button>
            ` : ''}
          </div>
        </header>

        <div class="modal__body">
          <!-- LÍNEA ~1750: Datos básicos -->
          <section class="form-section">
            <h3>Datos de Factura</h3>

            <div class="form-row">
              <label class="form-field">
                <span>Número de Factura</span>
                <input 
                  type="text" 
                  value="${invoice.invoiceNumber || invoice.invoice_number}" 
                  disabled 
                />
              </label>

              <label class="form-field">
                <span>Estado</span>
                <div class="form-input form-input--readonly">
                  <span class="status-pill status-pill--${invoice.status}">
                    ${statusMap[invoice.status]?.label || invoice.status}
                  </span>
                </div>
              </label>
            </div>

            <!-- Cliente -->
            <label class="form-field">
              <span>Cliente</span>
              <input 
                type="text" 
                value="${invoice.client?.name || invoice.client_name || '-'}" 
                disabled 
              />
              ${invoice.client?.email ? `
                <small>${invoice.client.email}</small>
              ` : ''}
            </label>

            <!-- Fechas -->
            <div class="form-row">
              <label class="form-field">
                <span>Fecha Emisión</span>
                <input type="date" value="${issueDateValue}" disabled />
              </label>

              <label class="form-field">
                <span>Fecha Vencimiento</span>
                <input type="date" value="${dueDateValue}" disabled />
              </label>
            </div>
          </section>

          <!-- LÍNEA ~1800: Items editor en read-only -->
          <section class="form-section">
            <h3>Líneas de Factura</h3>
            <div id="view-invoice-items"></div>
          </section>

          <!-- LÍNEA ~1805: Totales -->
          <section class="form-section">
            <h3>Resumen Fiscal</h3>
            <div id="view-invoice-totals"></div>
          </section>

          <!-- ❌ FALTA: Sección de pagos -->
          <!-- ❌ FALTA: Sección de auditoría -->
        </div>

        <footer class="modal__foot">
          <button onclick="closeViewInvoiceModal()" class="button button--secondary">
            Cerrar
          </button>
        </footer>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // LÍNEA ~1810: Configurar editor en read-only
    setupItemsEditorWithTabs({
      editorKey: 'view',
      initialItems: invoice.items || [],
      containerId: 'view-invoice-items',
      totalContainerId: 'view-invoice-totals',
      editable: false,  // ⭐ CLAVE: read-only
      showTotals: true
    });

    setupInvoiceViewForm(invoice);

  } catch (error) {
    console.error('Error viewing invoice:', error);
    showNotification(`Error al cargar la factura: ${error.message}`, 'error');
  }
}

// LÍNEA 1812: setupInvoiceViewForm()
function setupInvoiceViewForm(invoice) {
  const modal = document.getElementById('view-invoice-modal');
  if (!modal) return;

  // Aquí se podrían agregar listeners para botones de acción
  // Actualmente: solo read-only display
}
```

---

## ✅ VALIDACIONES EXISTENTES

| # | Validación | Línea | Estado |
|---|-----------|-------|--------|
| 1 | Carga datos de API | 1725 | ✅ |
| 2 | Modo read-only | ~1810 | ✅ |
| 3 | Manejo de errores | 1810 | ✅ |
| 4 | Mostrar invoice number | ~1753 | ✅ |
| 5 | Mostrar estado | ~1760 | ✅ |
| 6 | Mostrar cliente | ~1766 | ✅ |
| 7 | Mostrar fechas | ~1773 | ✅ |
| 8 | Mostrar líneas | ~1800 | ✅ |
| 9 | Mostrar totales | ~1805 | ✅ |
| 10 | Botones contextuales (parcial) | ~1740 | ⚠️ |

**Implementación:** 9/20 validaciones = **45%**

---

## ❌ VALIDACIONES FALTANTES

### MOSTRAR INFORMACIÓN

#### 1. alreadyPaid (Monto Pagado)

**Especificación:** Mostrar cantidad ya pagada

```javascript
// 🔴 PROBLEMA CRÍTICO: Línea 2615 en submitAddPayment()
const alreadyPaid = 0;  // ❌ SIEMPRE CERO (HARDCODEADO)

// DEBERÍA SER:
const alreadyPaid = sanitizeNumber(invoice.paid_amount, 0);
```

**Solución Necesaria:**

```javascript
// En viewInvoice(), después de cargar invoice:
const totalInvoice = sanitizeNumber(invoice.total, 0);
const alreadyPaid = sanitizeNumber(invoice.paid_amount, 0);  // ✅ Usar paid_amount
const pendingAmount = totalInvoice - alreadyPaid;

// Agregar sección a modalHTML:
const modalHTML = `
  <!-- NUEVA SECCIÓN: RESUMEN DE PAGOS -->
  <section class="form-section">
    <h3>Estado de Pago</h3>
    
    <div class="payment-summary">
      <div class="payment-summary__item">
        <span>Total Factura:</span>
        <strong>${formatCurrency(totalInvoice)}</strong>
      </div>
      
      <div class="payment-summary__item">
        <span>Ya Pagado:</span>
        <strong class="text-success">${formatCurrency(alreadyPaid)}</strong>
      </div>
      
      <div class="payment-summary__item">
        <span>Pendiente:</span>
        <strong class="${pendingAmount > 0 ? 'text-warning' : 'text-success'}">
          ${formatCurrency(pendingAmount)}
        </strong>
      </div>
      
      <!-- Progress Bar -->
      <div class="progress-bar" style="margin-top: 1rem;">
        <div class="progress-bar__fill" style="width: ${(alreadyPaid / totalInvoice * 100).toFixed(2)}%"></div>
      </div>
      <small>${(alreadyPaid / totalInvoice * 100).toFixed(0)}% pagado</small>
    </div>
  </section>
`;
```

**Problema Actual:** Usuario NO sabe cuánto falta por cobrar  
**Impacto:** Riesgo de no recordar deuda pendiente

---

#### 2. Payment History Table

**Especificación:** Mostrar historial de pagos registrados

```javascript
// NUEVA FUNCIÓN EN viewInvoice():
async function loadPaymentHistory(invoiceId) {
  try {
    const response = await window.api.getInvoicePayments(invoiceId);
    const payments = response.payments || [];
    
    if (payments.length === 0) {
      return '<p>Sin pagos registrados</p>';
    }

    const paymentTable = `
      <table class="invoice-payments-table">
        <thead>
          <tr>
            <th>Fecha Pago</th>
            <th>Monto</th>
            <th>Método</th>
            <th>Transacción</th>
            <th>Registrado Por</th>
          </tr>
        </thead>
        <tbody>
          ${payments.map(p => `
            <tr>
              <td>${formatDate(p.payment_date)}</td>
              <td>${formatCurrency(p.amount)}</td>
              <td>${p.payment_method || '-'}</td>
              <td><code>${p.transaction_id || '-'}</code></td>
              <td>${p.created_by_name || p.user?.name || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    return paymentTable;
    
  } catch (error) {
    console.warn('Error loading payment history:', error);
    return '<p>Error al cargar historial de pagos</p>';
  }
}

// Agregar a modalHTML:
<section class="form-section">
  <h3>Historial de Pagos</h3>
  <div id="view-invoice-payments-history"></div>
</section>

// Cargar después de crear modal:
const paymentHistoryHTML = await loadPaymentHistory(invoiceId);
document.getElementById('view-invoice-payments-history').innerHTML = paymentHistoryHTML;
```

**Problema Actual:** NO existe historial de pagos  
**Impacto:** Imposible ver qué pagos se registraron, cuándo y quién los registró

---

#### 3. Audit Log (Historial de Cambios)

**Especificación:** Mostrar quién cambió qué y cuándo

```javascript
// NUEVA FUNCIÓN:
async function loadAuditLog(invoiceId) {
  try {
    const response = await window.api.getInvoiceAuditLog(invoiceId);
    const logs = response.auditLog || [];
    
    if (logs.length === 0) {
      return '<p>Sin cambios registrados</p>';
    }

    const auditTable = `
      <table class="invoice-audit-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Acción</th>
            <th>Usuario</th>
            <th>Valor Anterior</th>
            <th>Valor Nuevo</th>
            <th>Motivo</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(log => `
            <tr>
              <td>${formatDateTime(log.created_at)}</td>
              <td><span class="badge badge--${log.action}">${log.action}</span></td>
              <td>${log.user?.name || log.user_name || 'Sistema'}</td>
              <td><code class="text-small">${log.old_value || '-'}</code></td>
              <td><code class="text-small">${log.new_value || '-'}</code></td>
              <td>${log.change_reason || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    return auditTable;
    
  } catch (error) {
    console.warn('Error loading audit log:', error);
    return '<p>Error al cargar historial de cambios</p>';
  }
}

// Agregar a modalHTML:
<section class="form-section form-section--audit">
  <h3>Historial de Cambios</h3>
  <div id="view-invoice-audit-log"></div>
</section>

// Cargar después de crear modal:
const auditLogHTML = await loadAuditLog(invoiceId);
document.getElementById('view-invoice-audit-log').innerHTML = auditLogHTML;
```

**Problema Actual:** Sin tabla invoice_audit_log  
**Impacto:** Incumplimiento de normativa fiscal (imposible rastrear cambios)

---

#### 4. Days to Due (Días Hasta Vencimiento)

**Especificación:** Mostrar "5 días" o "Vencido hace 3 días"

```javascript
// FUNCIÓN AUXILIAR:
function calculateDaysToOrFromDue(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diff = due - today;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days > 0) {
    return {
      text: `Vence en ${days} día${days > 1 ? 's' : ''}`,
      class: 'text-warning',
      days: days
    };
  } else if (days === 0) {
    return {
      text: 'Vence hoy',
      class: 'text-danger',
      days: 0
    };
  } else {
    return {
      text: `Vencido hace ${Math.abs(days)} día${Math.abs(days) > 1 ? 's' : ''}`,
      class: 'text-danger',
      days: days
    };
  }
}

// En viewInvoice():
const daysInfo = calculateDaysToOrFromDue(invoice.dueDate);

// Agregar a header o sección:
<div class="invoice-due-status">
  <span class="${daysInfo.class}">${daysInfo.text}</span>
</div>
```

**Problema Actual:** Existe función `calculateDaysToOrFromDue()` pero NO se muestra  
**Impacto:** Usuario debe calcular manualmente cuándo vence

---

#### 5. Status-Based Action Buttons

**Especificación:** Botones contextuales según estado

```javascript
// REEMPLAZAR botones simples en header:

// ACTUAL (LÍNEA ~1740):
${invoice.status === 'draft' ? `
  <button onclick="editInvoice('${invoiceId}')">Editar</button>
` : ''}

// NECESARIO:
<div class="action-buttons">
  ${invoice.status === 'draft' ? `
    <button onclick="editInvoice('${invoiceId}')" class="button button--primary">
      ✏️ Editar
    </button>
    <button onclick="markAsInvoiceSent('${invoiceId}')" class="button button--secondary">
      📤 Enviar
    </button>
  ` : ''}
  
  ${invoice.status === 'sent' ? `
    <button onclick="openAddPaymentModal('${invoiceId}')" class="button button--success">
      💰 Registrar Pago
    </button>
    <button onclick="downloadInvoicePDF('${invoiceId}')" class="button button--secondary">
      📥 Descargar
    </button>
  ` : ''}
  
  ${invoice.status === 'partial' ? `
    <button onclick="openAddPaymentModal('${invoiceId}')" class="button button--success">
      💰 Agregar Pago
    </button>
  ` : ''}
  
  ${invoice.status === 'paid' ? `
    <button onclick="downloadInvoicePDF('${invoiceId}')" class="button button--secondary">
      📥 Descargar
    </button>
    <button onclick="printInvoice('${invoiceId}')" class="button button--secondary">
      🖨️ Imprimir
    </button>
  ` : ''}
  
  ${['draft', 'sent'].includes(invoice.status) ? `
    <button onclick="confirmDeleteInvoice('${invoiceId}')" class="button button--danger">
      🗑️ Eliminar
    </button>
  ` : ''}
</div>
```

**Problema Actual:** Botones muy básicos, no contextuales  
**Impacto:** Usuario debe saber qué acciones son válidas para cada estado

---

### BACKEND - ENDPOINTS FALTANTES

#### 6. GET /api/invoices/:id/payments

**Propósito:** Obtener historial de pagos

```typescript
// Ubicación: backend/src/api/invoices/routes.ts
router.get('/:id/payments', invoiceController.getPayments);

// Ubicación: backend/src/api/invoices/controller.ts
export const getPayments = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const invoiceId = req.params.id as string;

    // Verificar que factura pertenece al usuario
    const invoice = await db.query(
      'SELECT id FROM invoices WHERE id = $1 AND user_id = $2',
      [invoiceId, userId]
    );

    if (invoice.rows.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    // Obtener pagos
    const payments = await db.query(
      `SELECT p.*, u.name as created_by_name
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.invoice_id = $1
       ORDER BY p.payment_date DESC`,
      [invoiceId]
    );

    res.json({ payments: payments.rows });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
};
```

---

#### 7. GET /api/invoices/:id/audit-log

**Propósito:** Obtener historial de cambios

```typescript
// Ubicación: backend/src/api/invoices/routes.ts
router.get('/:id/audit-log', invoiceController.getAuditLog);

// Ubicación: backend/src/api/invoices/controller.ts
export const getAuditLog = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const invoiceId = req.params.id as string;

    // Verificar que factura pertenece al usuario
    const invoice = await db.query(
      'SELECT id FROM invoices WHERE id = $1 AND user_id = $2',
      [invoiceId, userId]
    );

    if (invoice.rows.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    // Obtener audit log
    const auditLog = await db.query(
      `SELECT al.*, u.name as user_name
       FROM invoice_audit_log al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.invoice_id = $1
       ORDER BY al.created_at DESC`,
      [invoiceId]
    );

    res.json({ auditLog: auditLog.rows });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};
```

---

## 📊 MATRIZ DE IMPLEMENTACIÓN

| # | Validación/Feature | Especificación | Implementado | ¿Falta? |
|----|------------------|----------------|--------------|---------|
| 1 | Mostrar número | ✅ | ✅ | |
| 2 | Mostrar estado | ✅ | ✅ | |
| 3 | Mostrar cliente | ✅ | ✅ | |
| 4 | Mostrar fechas | ✅ | ✅ | |
| 5 | Mostrar líneas | ✅ | ✅ | |
| 6 | Mostrar totales | ✅ | ✅ | |
| 7 | Mostrar ya pagado | ✅ | 🔴 NO | 🔴 |
| 8 | Mostrar pendiente | ✅ | 🔴 NO | 🔴 |
| 9 | Progress bar % | ✅ | 🔴 NO | 🔴 |
| 10 | Historial pagos | ✅ | 🔴 NO | 🔴 |
| 11 | Audit log | ✅ | 🔴 NO | 🔴 |
| 12 | Días hasta vence | ✅ | ⚠️ Existe función | ⚠️ |
| 13 | Botones contextuales | ✅ | ⚠️ Parcial | ⚠️ |
| 14 | Endpoint GET /payments | ✅ | 🔴 NO | 🔴 |
| 15 | Endpoint GET /audit-log | ✅ | 🔴 NO | 🔴 |

**Implementación TOTAL:** 6/15 = **40%**

---

## 🔴 VULNERABILIDADES

### V1: alreadyPaid HARDCODEADO A CERO

**Severidad:** 🔴 CRÍTICO  
**Ubicación:** Línea 2615  
**Problema:** `const alreadyPaid = 0;`

```javascript
// ESCENARIO:
// 1. Factura FAC-001 total €1000
// 2. Usuario registra pago €600
// 3. Modal VIEW muestra: "Ya Pagado: €0" (INCORRECTO)
// 4. Usuario registra otro pago €500
// 5. Sistema muestra: "Ya Pagado: €0" (SIGUE INCORRECTO)
// 6. Total de pagos registrados: €1100 > €1000 (FRAUDE)
```

**Solución:** Usar `invoice.paid_amount` desde BD

---

### V2: No Hay Auditoría

**Severidad:** 🔴 CRÍTICO  
**Tipo:** Compliance Violation  
**Requerimientos:**
- Ley 37/1988 (Trazabilidad)
- RD 1619/2012 (Factura electrónica)
- Decreto 80/2012 (Verifactu)

**Impacto:** Incumplimiento legal, multas €300-€10,000

---

## ✅ PLAN DE CORRECCIÓN

### P1 - ALTA (Semana 1)

```
1. Crear tabla invoice_audit_log
   Tiempo: 30 minutos
   
2. Fijar alreadyPaid a invoice.paid_amount
   Tiempo: 15 minutos
   
3. Agregar sección de estado de pago
   Tiempo: 45 minutos
   
4. Backend: Endpoint GET /api/invoices/:id/payments
   Tiempo: 1 hora
```

### P2 - MEDIA (Semana 2)

```
5. Backend: Endpoint GET /api/invoices/:id/audit-log
   Tiempo: 1 hora
   
6. Frontend: Cargar y mostrar payment history
   Tiempo: 1 hora
   
7. Frontend: Cargar y mostrar audit log
   Tiempo: 1 hora
   
8. Frontend: Mostrar días hasta vencimiento
   Tiempo: 30 minutos
   
9. Frontend: Mejorar botones contextuales
   Tiempo: 45 minutos
```

---

## 📋 CHECKLIST

- [ ] Crear tabla invoice_audit_log
- [ ] Fijar alreadyPaid en frontend
- [ ] Agregar sección estado de pago
- [ ] Backend: GET /payments
- [ ] Backend: GET /audit-log
- [ ] Frontend: Cargar payments
- [ ] Frontend: Mostrar audit log
- [ ] Frontend: Mostrar días vencimiento
- [ ] Frontend: Mejorar botones

**Tiempo Total:** ~6-7 horas
