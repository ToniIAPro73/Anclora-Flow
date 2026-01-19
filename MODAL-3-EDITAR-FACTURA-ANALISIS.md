# ANÁLISIS MODAL 3: EDITAR FACTURA
## 🔴 VULNERABILIDAD CRÍTICA EN BACKEND

**Versión:** 1.0  
**Fecha:** 19 Enero 2026  
**Base:** invoices-with-api.js (líneas 1812-2100) + controller.ts  
**Estado:** 37.5% Implementado (CON RIESGO CRÍTICO)  
**Severidad:** 🔴 CRÍTICO - NO APTO PARA PRODUCCIÓN

---

## 📍 UBICACIÓN EN CÓDIGO

- **Función Apertura:** `editInvoice(invoiceId)` (línea 1812)
- **Función Guardado:** `saveInvoiceChanges(invoiceId)` (línea 2000)
- **Configuración:** `setupInvoiceEditForm(invoice)` (línea 1900)
- **Archivo:** `frontend/src/pages/invoices-with-api.js`
- **Backend:** `backend/src/api/invoices/controller.ts` línea ~95

---

## 🔍 CÓDIGO ACTUAL - Frontend

### editInvoice() - Línea 1812

```javascript
async function editInvoice(invoiceId) {
  try {
    showNotification('Cargando factura...', 'info');

    // LÍNEA 1815: Cargar factura
    const invoice = await window.api.getInvoice(invoiceId);

    const issueDateValue = formatDateForInput(invoice.issue_date || invoice.issueDate);
    const dueDateValue = formatDateForInput(invoice.due_date || invoice.dueDate);

    const modalHTML = `
      <div class="modal is-open invoice-modal" id="edit-invoice-modal">
        
        <!-- LÍNEA ~1825: BANNER SI NO ES DRAFT -->
        ${invoice.status === 'draft' ? '' : `
          <div class="modal-banner modal-banner--warning">
            <strong>⚠️ Edición Limitada</strong>
            <p>Para editar conceptos e importes, cambia el estado a Borrador.</p>
          </div>
        `}

        <div class="modal__body">
          <form id="edit-invoice-form">
            <input type="hidden" name="form_type" value="edit" />
            <input type="hidden" name="invoice_id" value="${invoiceId}" />

            <!-- STATUS SELECT -->
            <label class="form-field">
              <span>Estado</span>
              <select id="edit-status" name="status">
                <option value="draft" ${invoice.status === 'draft' ? 'selected' : ''}>Borrador</option>
                <option value="sent" ${invoice.status === 'sent' ? 'selected' : ''}>Enviada</option>
                <option value="pending" ${invoice.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                <option value="paid" ${invoice.status === 'paid' ? 'selected' : ''}>Cobrada</option>
                <option value="overdue" ${invoice.status === 'overdue' ? 'selected' : ''}>Vencida</option>
              </select>
            </label>

            <!-- CAMPO: Motivo del Cambio (❌ FALTA) -->

            <!-- Otros campos (todos disabled si NOT draft) -->
            <label class="form-field">
              <span>Fecha Emisión</span>
              <input 
                type="date" 
                name="issue_date" 
                value="${issueDateValue}"
                ${invoice.status === 'draft' ? '' : 'disabled'}
              />
            </label>

            <label class="form-field">
              <span>Fecha Vencimiento</span>
              <input 
                type="date" 
                name="due_date" 
                value="${dueDateValue}"
                ${invoice.status === 'draft' ? '' : 'disabled'}
              />
            </label>

            <!-- Items editor -->
            <div id="edit-invoice-items"></div>

            <!-- Totales -->
            <div id="edit-invoice-totals"></div>
          </form>
        </div>

        <footer class="modal__foot">
          <button onclick="closeEditInvoiceModal()">Cancelar</button>
          <button onclick="saveInvoiceChanges('${invoiceId}')" class="button--primary">
            Guardar Cambios
          </button>
        </footer>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    setupInvoiceEditForm(invoice);

  } catch (error) {
    console.error('Error loading invoice for edit:', error);
    showNotification(`Error al cargar la factura: ${error.message}`, 'error');
  }
}
```

### setupInvoiceEditForm() - Línea 1900

```javascript
function setupInvoiceEditForm(invoice) {
  invoiceEditState = { invoiceId: invoice.id };

  // ✅ LÍNEA 1905: Items editor editable solo si draft
  setupItemsEditorWithTabs({
    editorKey: 'edit',
    initialItems: invoice.items || [],
    containerId: 'edit-invoice-items',
    totalContainerId: 'edit-invoice-totals',
    editable: invoice.status === 'draft',  // ⭐ IMPORTANTE: VALIDACIÓN UI
    onTotalsChange: updateEditInvoiceTotals
  });

  const statusSelect = document.getElementById('edit-status');
  const lockMessage = document.getElementById('edit-lock-message');

  // LÍNEA ~1915: Listener para cambios de status
  if (statusSelect) {
    statusSelect.addEventListener('change', (event) => {
      const isDraft = event.target.value === 'draft';
      setItemsEditorEditable('edit', isDraft);  // ✅ Habilitar/deshabilitar editor
      if (lockMessage) {
        lockMessage.hidden = isDraft;
      }
    });
  }
}
```

### saveInvoiceChanges() - Línea 2000

```javascript
async function saveInvoiceChanges(invoiceId) {
  try {
    const form = document.getElementById('edit-invoice-form');
    if (!form) return;

    const formData = new FormData(form);

    const status = formData.get('status') || 'draft';
    const issueDate = formData.get('issue_date');
    const dueDate = formData.get('due_date');

    // LÍNEA ~2013: Preparar actualización
    const updates = { status };

    if (issueDate) {
      updates.issueDate = issueDate;
    }

    if (dueDate) {
      updates.dueDate = dueDate;
    }

    // LÍNEA ~2025: Si está en draft, permitir editar líneas
    const editorState = getItemsEditorState('edit');

    if (editorState && status === 'draft') {
      const preparedItems = editorState.items
        .map(item => ({
          description: item.description.trim(),
          quantity: sanitizeNumber(item.quantity, 0),
          unitType: item.unitType || 'unidad',
          unitPrice: sanitizeNumber(item.unitPrice, 0),
          vatPercentage: sanitizeNumber(item.vatPercentage, 0),
          amount: calculateLineTotal(item)
        }))
        .filter(item => item.description.length > 0);

      const totals = calculateInvoiceTotals(preparedItems, editorState.irpfPercentage);
      
      updates.items = preparedItems;
      updates.subtotal = totals.subtotal;
      updates.vatAmount = totals.vatAmount;
      updates.irpfAmount = totals.irpfAmount;
      updates.total = totals.total;
    }

    showNotification('Guardando cambios...', 'info');

    // LÍNEA ~2055: ENVIAR AL BACKEND (SIN VALIDACIONES)
    await window.api.updateInvoice(invoiceId, updates);
    await loadInvoices();
    closeEditInvoiceModal();

    showNotification('Factura actualizada correctamente', 'success');
  } catch (error) {
    console.error('Error saving invoice:', error);
    showNotification(`Error al guardar: ${error.message}`, 'error');
  }
}
```

---

## 🔍 CÓDIGO ACTUAL - Backend

### updateInvoice() Controller - Línea ~95

```typescript
// backend/src/api/invoices/controller.ts

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    
    // 🔴 LÍNEA ~98: RECIBE DATOS SIN VALIDAR
    const invoice = await invoiceRepository.update(
      req.params.id as string, 
      userId, 
      req.body  // ❌ req.body PUEDE CONTENER CUALQUIER COSA
    );

    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    // 🔴 LÍNEA ~106: RETORNA SIN VALIDACIONES
    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Error al actualizar la factura' });
  }
};
```

### invoiceRepository.update() - Presumido (~150)

```typescript
// backend/src/api/invoices/repository.ts (PRESUMIDO)

async update(id: string, userId: string, data: any) {
  // Probablemente usa UPDATE con MERGE directo
  // UPDATE invoices SET $1 WHERE id = $2 AND user_id = $3
  
  // ❌ PROBLEMA: NO valida que status === 'draft' antes de actualizar
  // ❌ PROBLEMA: Acepta ANY campo en data (total, paid_amount, etc.)
  // ❌ PROBLEMA: Sin audit trail
}
```

---

## ✅ VALIDACIONES EXISTENTES

| # | Validación | Línea | Estado |
|---|-----------|-------|--------|
| 1 | Mostrar banner si NOT draft | ~1825 | ✅ |
| 2 | Items editor editable solo si draft | ~1905 | ✅ |
| 3 | Deshabilitar inputs si NOT draft | ~1830 | ✅ |
| 4 | Solo procesar items si draft | 2025 | ✅ |
| 5 | Manejo de errores | 2090 | ✅ |

**Implementación Frontend:** 5/25 validaciones = **20%**

**Implementación Backend:** 0/25 validaciones = **0%** ⚠️

---

## 🔴 VULNERABILIDAD CRÍTICA: Backend NO Valida Status

### V1: updateInvoice() Acepta Cualquier Cambio

**Severidad:** 🔴 CRÍTICO  
**Tipo:** Authorization Bypass / Data Tampering  
**CVE Type:** CWE-434 (Unrestricted Upload of File with Dangerous Type)  
**Línea:** `controller.ts` línea ~98

```typescript
// ACTUAL - VULNERABLE
export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const invoice = await invoiceRepository.update(
      req.params.id as string, 
      userId, 
      req.body  // ❌ SIN VALIDACIÓN - ACEPTA TODO
    );
    res.json(invoice);
  } catch (error) { /* ... */ }
};

// El usuario puede enviar:
fetch('/api/invoices/abc-123', {
  method: 'PUT',
  body: JSON.stringify({
    total: 500,           // ❌ CAMBIAR TOTAL DE FACTURA PAGADA
    paid_amount: 0,       // ❌ RESETEAR PAGOS
    status: 'draft',      // ❌ CAMBIAR ESTADO
    issued_by: 'hacker'   // ❌ INYECTAR DATOS
  })
})
```

### ESCENARIO DE ATAQUE (13 PASOS)

```
PASO 1: Usuario 'Juan' crea factura FAC-2025-001
        Total: €1000
        Status: 'draft'
        Cliente: Empresa X

PASO 2: Usuario 'Juan' envía factura a cliente
        Status: 'sent'
        Verifactu registra: €1000

PASO 3: Cliente paga €1000
        Juan registra pago
        Status: 'paid'
        paid_amount: €1000

PASO 4: Días después... Contabilidad revisando
        Detectan error en factura (debería ser €500)

PASO 5: Juan abre navegador F12 (DevTools)

PASO 6: Ejecuta en consola:
        fetch('/api/invoices/FAC-2025-001', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            total: 500,
            subtotal: 500,
            paid_amount: 0
          })
        })

PASO 7: Request enviado al backend

PASO 8: Backend NO valida (línea ~98)
        Recibe request sin validaciones
        updateInvoice() NO comprueba status

PASO 9: Repository ejecuta:
        UPDATE invoices SET total = 500 WHERE id = ...

PASO 10: FACTURA MODIFICADA
         - Total: €500 (era €1000)
         - paid_amount: €0 (era €1000)
         - Status: 'paid' (pero sin pagos registrados)

PASO 11: DATOS INCONSISTENTES
         - Verifactu sigue diciendo: €1000
         - Base de datos ahora dice: €500
         - Auditoría: SIN REGISTRO (sin audit log)

PASO 12: Contabilidad registra €500 en lugar de €1000
         Pérdida: €500 en los registros
         Fraude: Facturas adulteradas

PASO 13: DELITO FISCAL
         - Falsificación de documentos mercantiles
         - Fraude contable
         - Evasión de impuestos
         Responsabilidad: Empresa + Usuario
         Multa: €3,000 - €300,000
         Prisión: Posible (si es flagrante)
```

---

## ❌ VALIDACIONES FALTANTES

### FRONTEND

#### 1. changeReason - Campo Obligatorio

**Especificación:** Motivo por el que se edita la factura

```javascript
// AGREGAR AL MODAL HTML:
<label class="form-field">
  <span>Motivo del Cambio *</span>
  <textarea 
    name="change_reason" 
    placeholder="Describe por qué estás editando esta factura"
    minlength="10"
    required
  ></textarea>
  <small>Mínimo 10 caracteres</small>
</label>

// VALIDACIÓN EN saveInvoiceChanges():
const changeReason = formData.get('change_reason')?.trim() || '';

if (!changeReason || changeReason.length < 10) {
  showNotification(
    'Motivo del cambio es obligatorio (mínimo 10 caracteres)',
    'warning'
  );
  return;
}

// Agregar a updates:
updates.changeReason = changeReason;
```

**Problema Actual:** Sin campo de motivo  
**Riesgo:** Sin explicación de cambios

---

#### 2. Diff Tracking - Comparar Old vs New

**Especificación:** Guardar qué exactamente cambió

```javascript
// FUNCIÓN: Detectar cambios
function detectInvoiceChanges(originalInvoice, updates) {
  const changes = [];
  
  if (updates.status && originalInvoice.status !== updates.status) {
    changes.push(`Status: ${originalInvoice.status} → ${updates.status}`);
  }
  
  if (updates.issueDate && originalInvoice.issue_date !== updates.issueDate) {
    changes.push(`Fecha emisión: ${originalInvoice.issue_date} → ${updates.issueDate}`);
  }
  
  if (updates.dueDate && originalInvoice.due_date !== updates.dueDate) {
    changes.push(`Fecha vencimiento: ${originalInvoice.due_date} → ${updates.dueDate}`);
  }
  
  if (updates.total !== undefined && originalInvoice.total !== updates.total) {
    changes.push(`Total: €${originalInvoice.total} → €${updates.total}`);
  }
  
  if (updates.items) {
    changes.push(`Items editados: ${updates.items.length} líneas`);
  }
  
  return changes;
}

// En saveInvoiceChanges():
const changes = detectInvoiceChanges(invoice, updates);
updates.diffSummary = changes.join('; ');  // Para registrar en backend
```

**Problema Actual:** Sin tracking de cambios  
**Riesgo:** Imposible auditar qué se modificó

---

### BACKEND - VALIDACIONES CRÍTICAS

#### 3. Validar status === 'draft' Antes de Editar

**Archivo:** `backend/src/api/invoices/controller.ts`  
**Severidad:** 🔴 CRÍTICO  
**Tiempo:** 30 minutos

```typescript
// REEMPLAZAR updateInvoice() completo:

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const invoiceId = req.params.id as string;
    
    // PASO 1: Obtener factura ACTUAL
    const currentInvoice = await db.query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [invoiceId, userId]
    );
    
    if (currentInvoice.rows.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
    const invoice = currentInvoice.rows[0];
    
    // 🔴 PASO 2: VALIDACIÓN CRÍTICA - Status DEBE ser 'draft'
    if (invoice.status !== 'draft') {
      return res.status(403).json({ 
        error: 'Solo se pueden editar facturas en estado "Borrador"',
        currentStatus: invoice.status,
        message: 'Para editar una factura enviada, cambia su estado a Borrador'
      });
    }
    
    // PASO 3: Validar changeReason si existe en request
    if (req.body.changeReason) {
      const reason = req.body.changeReason.trim();
      if (reason.length < 10) {
        return res.status(400).json({ 
          error: 'Motivo del cambio debe tener mínimo 10 caracteres' 
        });
      }
    }
    
    // PASO 4: Si cambia cliente, validar que existe y está activo
    if (req.body.clientId && req.body.clientId !== invoice.client_id) {
      const newClient = await db.query(
        'SELECT id, is_active FROM clients WHERE id = $1 AND user_id = $2',
        [req.body.clientId, userId]
      );
      
      if (newClient.rows.length === 0 || !newClient.rows[0].is_active) {
        return res.status(400).json({ error: 'Cliente no existe o está inactivo' });
      }
    }
    
    // PASO 5: Preparar UPDATE
    const updateFields: string[] = [];
    const updateValues: any[] = [invoiceId, userId];
    let paramIndex = 3;
    
    if (req.body.issueDate) {
      updateFields.push(`issue_date = $${paramIndex++}`);
      updateValues.push(req.body.issueDate);
    }
    
    if (req.body.dueDate) {
      updateFields.push(`due_date = $${paramIndex++}`);
      updateValues.push(req.body.dueDate);
    }
    
    if (req.body.total !== undefined) {
      updateFields.push(`total = $${paramIndex++}`);
      updateValues.push(req.body.total);
    }
    
    // ... agregar más campos según sea necesario
    
    updateFields.push(`updated_at = NOW()`);
    
    // PASO 6: Ejecutar UPDATE
    const updateQuery = `
      UPDATE invoices 
      SET ${updateFields.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, updateValues);
    
    // PASO 7: Registrar en audit_log
    const oldValue = JSON.stringify({
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      total: invoice.total
    });
    
    const newValue = JSON.stringify(result.rows[0]);
    
    await db.query(
      `INSERT INTO invoice_audit_log 
       (invoice_id, user_id, action, old_value, new_value, change_reason, created_at)
       VALUES ($1, $2, 'updated', $3, $4, $5, NOW())`,
      [
        invoiceId,
        userId,
        oldValue,
        newValue,
        req.body.changeReason || 'Cambios en borrador'
      ]
    );
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Error al actualizar la factura' });
  }
};
```

---

#### 4. Validar Cliente Sigue Activo

**Ubicación:** En updateInvoice(), durante validación (PASO 4 arriba)  
**Impacto:** Evita crear relaciones con clientes inactivos

---

#### 5. Registrar en invoice_audit_log

**Ubicación:** En updateInvoice(), PASO 7 (arriba)  
**Impacto:** Crear trazabilidad de cambios  
**Requerimiento:** Tabla `invoice_audit_log` debe existir

---

## 📊 MATRIZ DE IMPLEMENTACIÓN

| # | Validación | Especificación | Frontend | Backend | ¿Falta? | Severidad |
|----|-----------|----------------|----------|---------|---------|-----------|
| 1 | Status=draft requerido | ✅ | ⚠️ UI | 🔴 **NO** | 🔴 CRÍTICO | 🔴 |
| 2 | Mostrar banner limitada | ✅ | ✅ | N/A | | |
| 3 | Deshabilitar items si NOT draft | ✅ | ✅ | N/A | | |
| 4 | Procesar items solo si draft | ✅ | ✅ | ❌ | Backend | 🟠 |
| 5 | changeReason obligatorio | ✅ | ❌ | ❌ | Ambos | 🟠 |
| 6 | Diff tracking (old vs new) | ✅ | ❌ | ❌ | Ambos | 🟠 |
| 7 | Registrar en audit_log | ✅ | ❌ | ❌ | Backend | 🔴 |
| 8 | Cliente sigue activo | ✅ | ❌ | ❌ | Backend | 🟠 |
| 9 | Validar campos nuevos | ✅ | ❌ | ❌ | Backend | 🟠 |
| 10 | Validar totales recalculados | ✅ | ❌ | ❌ | Backend | 🟠 |

**Implementación Frontend:** 4/10 = **40%**  
**Implementación Backend:** 0/10 = **0%** ⚠️ CRÍTICO

---

## 🔴 RESUMEN DE RIESGOS

| Riesgo | Severidad | Tipo | Impacto |
|--------|-----------|------|---------|
| Backend NO valida status=draft | 🔴 CRÍTICO | Security | Editar facturas pagadas |
| Sin audit trail | 🔴 CRÍTICO | Compliance | Incumplimiento fiscal |
| Sin changeReason | 🟠 ALTA | Audit | Sin explicación de cambios |
| Sin diff tracking | 🟠 ALTA | Traceability | Imposible auditar qué cambió |
| Cliente puede estar inactivo | 🟠 ALTA | Data | Relación inválida |

---

## ✅ PLAN DE CORRECCIÓN

### P0 - CRÍTICO (INMEDIATO - Hoy)

```
1. Backend: Validar status='draft' en updateInvoice()
   Archivo: controller.ts línea ~95
   Código: Ver arriba - función completa reescrita
   Tiempo: 45 minutos
   
   ⭐ ESTO PREVIENE EL ATAQUE DE EDITAR FACTURAS PAGADAS
```

### P1 - ALTA (Semana 1)

```
2. Frontend: Agregar campo changeReason obligatorio
   Archivo: editInvoice() línea ~1850
   Tiempo: 30 minutos

3. Backend: Crear tabla invoice_audit_log (si no existe)
   Archivo: init.sql
   Tiempo: 15 minutos

4. Backend: Registrar en audit_log en updateInvoice()
   Archivo: controller.ts (incluido en P0-1)
   Tiempo: Incluido arriba

5. Backend: Validar cliente activo
   Archivo: controller.ts (incluido en P0-1)
   Tiempo: Incluido arriba
```

### P2 - MEDIA (Semana 2)

```
6. Frontend: Implementar diff tracking
   Archivo: saveInvoiceChanges() línea ~2000
   Tiempo: 1 hora

7. Frontend: Mostrar confirmación de cambios antes de guardar
   Archivo: saveInvoiceChanges()
   Tiempo: 45 minutos
```

---

## 📋 CHECKLIST CRÍTICO

- [ ] **P0-1:** Backend valida status='draft' en updateInvoice() ⭐ URGENTE
- [ ] **P1-1:** Frontend: campo changeReason
- [ ] **P1-2:** Backend: tabla invoice_audit_log
- [ ] **P1-3:** Backend: registrar en audit_log
- [ ] **P1-4:** Backend: validar cliente activo
- [ ] **P2-1:** Frontend: diff tracking

---

## ⚠️ RECOMENDACIÓN CRÍTICA

**NO DESPLEGAR A PRODUCCIÓN** hasta completar P0-1

La vulnerabilidad actual permite:
- ✗ Editar facturas pagadas
- ✗ Cambiar montos de facturas enviadas a Verifactu
- ✗ Crear inconsistencias entre BD local y Verifactu
- ✗ Fraude contable sin auditoría

**Tiempo de implementación de P0-1:** 45 minutos  
**Riesgo de no hacerlo:** CRÍTICO - Exposición legal

---

**Documento:** MODAL-3-EDITAR-FACTURA-ANALISIS.md  
**Clasificación:** CRÍTICO - RIESGO DE SEGURIDAD
