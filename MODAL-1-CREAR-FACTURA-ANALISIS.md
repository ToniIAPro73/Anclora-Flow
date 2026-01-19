# ANÁLISIS MODAL 1: CREAR FACTURA
## Código Real vs Especificación

**Versión:** 1.0  
**Fecha:** 19 Enero 2026  
**Base:** invoices-with-api.js (líneas 1990-2230) + controller.ts  
**Estado:** 20% Implementado

---

## 📍 UBICACIÓN EN CÓDIGO

- **Función Apertura:** `openNewInvoiceModal()` (línea 1990)
- **Función Envío:** `submitNewInvoice()` (línea 2130)
- **Archivo:** `frontend/src/pages/invoices-with-api.js`
- **Controlador Backend:** `backend/src/api/invoices/controller.ts` línea ~82

---

## 🔍 CÓDIGO ACTUAL

### openNewInvoiceModal() - Línea 1990

```javascript
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
    const dueDefaultDate = formatDateForInput(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );

    const modalHTML = `
      <div class="modal is-open invoice-modal" id="new-invoice-modal">
        <div class="modal__panel">
          <!-- FORM: línea ~2010 -->
          <form id="new-invoice-form">
            <input type="hidden" name="form_type" value="create" />
            
            <!-- INVOICE NUMBER -->
            <label class="form-field">
              <span>Número de Factura *</span>
              <input 
                type="text" 
                name="invoice_number" 
                placeholder="Ej: FAC-2025-001"
                required 
              />
            </label>

            <!-- STATUS (línea ~2017) -->
            <label class="form-field">
              <span>Estado</span>
              <select name="status">
                <option value="draft" selected>Borrador</option>
                <option value="sent">Enviada</option>
                <option value="pending">Pendiente</option>
              </select>
            </label>

            <!-- ISSUE DATE -->
            <label class="form-field">
              <span>Fecha Emisión *</span>
              <input 
                type="date" 
                name="issue_date" 
                value="${today}"
                required 
              />
            </label>

            <!-- DUE DATE -->
            <label class="form-field">
              <span>Fecha Vencimiento *</span>
              <input 
                type="date" 
                name="due_date" 
                value="${dueDefaultDate}"
                required 
              />
            </label>

            <!-- CLIENT SELECT -->
            <label class="form-field">
              <span>Cliente</span>
              <select name="client_id">
                <option value="">-- Seleccionar cliente --</option>
                ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </label>

            <!-- NOTES -->
            <label class="form-field">
              <span>Observaciones</span>
              <textarea name="notes" placeholder="Notas internas o para el cliente"></textarea>
            </label>

            <!-- ITEMS EDITOR -->
            <div id="new-invoice-items"></div>

            <!-- FISCAL BREAKDOWN -->
            <div id="new-invoice-totals"></div>
          </form>
        </div>

        <footer class="modal__foot">
          <button onclick="closeNewInvoiceModal()">Cancelar</button>
          <button onclick="submitNewInvoice()" class="button--primary">Crear Factura</button>
        </footer>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    setupItemsEditorWithTabs({
      editorKey: 'create',
      containerId: 'new-invoice-items',
      totalContainerId: 'new-invoice-totals',
      editable: true,
      onTotalsChange: updateNewInvoiceTotals
    });

  } catch (error) {
    console.error('Error opening new invoice modal:', error);
    showNotification(`Error al preparar la factura: ${error.message}`, 'error');
  }
}
```

### submitNewInvoice() - Línea 2130

```javascript
async function submitNewInvoice() {
  try {
    const form = document.getElementById('new-invoice-form');
    if (!form) {
      showNotification('No se encontró el formulario.', 'error');
      return;
    }

    const formData = new FormData(form);
    const invoiceNumber = (formData.get('invoice_number') || '').trim();  // LÍNEA 2140

    // ✅ VALIDACIÓN 1: invoiceNumber no vacío
    if (!invoiceNumber) {
      showNotification('El numero de factura es obligatorio.', 'warning');
      return;
    }

    const issueDate = formData.get('issue_date');
    const dueDate = formData.get('due_date');
    const status = formData.get('status') || 'draft';
    const clientId = formData.get('client_id') || null;  // ⚠️ OPCIONAL (PROBLEMA)
    const notes = formData.get('notes') || null;

    // ✅ VALIDACIÓN 2-3: Fechas requeridas
    if (!issueDate || !dueDate) {
      showNotification('Las fechas de emisión y vencimiento son obligatorias.', 'warning');
      return;
    }

    // Obtener editor state
    const editorState = getItemsEditorState('create');
    
    // ✅ VALIDACIÓN 4: Mínimo 1 línea
    if (!editorState || !editorState.items || editorState.items.length === 0) {
      showNotification('Añade al menos una línea de concepto.', 'warning');
      return;
    }

    // Procesar items (LÍNEA ~2165)
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

    // ✅ VALIDACIÓN 5: Items con descripción
    if (items.length === 0) {
      showNotification('Añade al menos una línea con descripción.', 'warning');
      return;
    }

    // Calcular totales
    const totals = calculateInvoiceTotals(items, editorState.irpfPercentage);

    // Preparar payload (LÍNEA ~2200)
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

    await window.api.createInvoice(payload);  // LÍNEA ~2220
    await loadInvoices();
    closeNewInvoiceModal();

    showNotification('Factura creada correctamente', 'success');
  } catch (error) {
    console.error('Error creating invoice:', error);
    showNotification(`Error al crear la factura: ${error.message}`, 'error');
  }
}
```

---

## ✅ VALIDACIONES EXISTENTES

| # | Validación | Línea | Tipo | Estado |
|---|-----------|-------|------|--------|
| 1 | invoiceNumber no vacío | 2145 | Frontend JS | ✅ |
| 2 | issueDate requerido | 2151 | Frontend HTML + JS | ✅ |
| 3 | dueDate requerido | 2151 | Frontend HTML + JS | ✅ |
| 4 | Mínimo 1 línea | 2158 | Frontend JS | ✅ |
| 5 | Items con descripción | 2190 | Frontend JS | ✅ |

**Implementación:** 5/35 validaciones = **14%**

---

## ❌ VALIDACIONES FALTANTES

### FRONTEND

#### 1. invoiceNumber - Validar Patrón

**Especificación:** `/^[A-Z0-9\-\/]+$/`

```javascript
// UBICACIÓN: submitNewInvoice() línea ~2148 (después de !invoiceNumber)

const invoiceNumberPattern = /^[A-Z0-9\-\/]+$/;
if (!invoiceNumberPattern.test(invoiceNumber)) {
  showNotification(
    'El número debe contener solo letras mayúsculas, números, guiones y barras. Ej: FAC-2025-001',
    'warning'
  );
  return;
}
```

**Problema Actual:** Acepta `!@#$%`, caracteres especiales peligrosos  
**Riesgo:** Inyección de datos malformados

---

#### 2. invoiceNumber - Validar Unicidad Asíncrona

**Especificación:** Verificar disponibilidad en tiempo real

```javascript
// UBICACIÓN: submitNewInvoice() línea ~2150

let invoiceNumberIsAvailable = false;
try {
  const checkResult = await window.api.checkInvoiceNumberAvailable(invoiceNumber);
  invoiceNumberIsAvailable = checkResult.available;
} catch (error) {
  // Opción: continuar o rechazar. Recomendado: rechazar para no duplicar
  showNotification('No se pudo verificar si el número está disponible', 'warning');
  return;
}

if (!invoiceNumberIsAvailable) {
  showNotification(`El número ${invoiceNumber} ya existe. Elige otro.`, 'warning');
  return;
}
```

**Problema Actual:** Solo se valida en BD al INSERT (UNIQUE violation)  
**Riesgo:** Usuario crea todo, da a guardar, y recibe error genérico

---

#### 3. clientId - Obligatorio

**Especificación:** Cliente es REQUERIDO

```javascript
// UBICACIÓN: submitNewInvoice() línea ~2155

if (!clientId) {
  showNotification('El cliente es obligatorio. Selecciona uno antes de continuar.', 'warning');
  return;
}
```

**Problema Actual:** `clientId = formData.get('client_id') || null;` (OPCIONAL)  
**Riesgo:** Crear factura sin cliente viola normativa (Verifactu requiere cliente)  
**Impacto:** Factura inválida para declaración fiscal

---

#### 4. dueDate >= issueDate

**Especificación:** Fecha vencimiento debe ser >= emisión

```javascript
// UBICACIÓN: submitNewInvoice() línea ~2160 (después de validar fechas existen)

const issueDateObj = new Date(issueDate);
const dueDateObj = new Date(dueDate);

if (dueDateObj < issueDateObj) {
  showNotification('La fecha de vencimiento debe ser igual o posterior a la emisión', 'warning');
  return;
}
```

**Problema Actual:** Sin validación cruzada  
**Riesgo:** Factura con vencimiento en el pasado respecto a emisión (ilógico)

---

#### 5. quantity > 0

**Especificación:** Cantidad debe ser positiva

```javascript
// UBICACIÓN: Dentro del .map() en línea ~2169

items.map((item) => {
  const quantity = sanitizeNumber(item.quantity, 0);
  
  // ❌ AGREGAR:
  if (quantity <= 0) {
    throw new Error(`Cantidad inválida en línea: debe ser > 0, recibido: ${quantity}`);
  }
  
  // ... resto del código
})

// Envolver en try-catch:
try {
  const items = editorState.items.map(/*...*/);
} catch (error) {
  showNotification(`Error en líneas: ${error.message}`, 'warning');
  return;
}
```

**Problema Actual:** Acepta cantidad = 0 o negativa  
**Riesgo:** Líneas con montos inválidos

---

#### 6. unitPrice >= 0

**Especificación:** Precio unitario no puede ser negativo

```javascript
// UBICACIÓN: Dentro del .map() en línea ~2169

items.map((item) => {
  const unitPrice = sanitizeNumber(item.unitPrice, 0);
  
  // ❌ AGREGAR:
  if (unitPrice < 0) {
    throw new Error(`Precio inválido: no puede ser negativo`);
  }
  
  // ... resto del código
})
```

**Problema Actual:** Acepta precios negativos  
**Riesgo:** Descuentos sin control, montos inválidos

---

#### 7. vatPercentage ∈ [0, 5, 10, 21]

**Especificación:** Solo valores válidos en España

```javascript
// UBICACIÓN: Dentro del .map() en línea ~2169

items.map((item) => {
  const vatPercentage = sanitizeNumber(item.vatPercentage, 0);
  
  // ❌ AGREGAR:
  const validVAT = [0, 5, 10, 21];
  if (!validVAT.includes(vatPercentage)) {
    throw new Error(
      `IVA inválido: ${vatPercentage}%. Valores permitidos: 0, 5, 10, 21`
    );
  }
  
  // ... resto del código
})
```

**Problema Actual:** Acepta cualquier porcentaje (15%, 25%, -5%, etc.)  
**Riesgo:** Inconsistencia fiscal, rechazo de Verifactu

---

#### 8. status Debe Ser 'draft'

**Especificación:** Nueva factura siempre comienza en 'draft'

```javascript
// UBICACIÓN: submitNewInvoice() línea ~2141

const status = 'draft';  // ❌ CAMBIAR DE:
// const status = formData.get('status') || 'draft';

// O si se quiere permitir selección:
const status = formData.get('status') || 'draft';
if (status !== 'draft') {
  showNotification('Las nuevas facturas siempre comienzan en "Borrador".', 'warning');
  return;
}
```

**Problema Actual:** Usuario puede elegir status 'sent' o 'pending' al crear  
**Riesgo:** Factura "nueva" pero ya enviada (inconsistente)

---

### BACKEND

#### 9. Backend - createInvoice() NO Valida NADA

**Archivo:** `backend/src/api/invoices/controller.ts` línea ~82

```typescript
// ACTUAL - SIN VALIDACIONES
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const invoice = await invoiceRepository.create(userId, req.body);
    res.status(201).json(invoice);
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'El número de factura ya existe' });
    }
    res.status(500).json({ error: 'Error al crear la factura' });
  }
};

// NECESARIO - CON VALIDACIONES
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const { invoiceNumber, clientId, issueDate, dueDate, items, total, subtotal, vatAmount } = req.body;

    // V1: invoiceNumber obligatorio
    if (!invoiceNumber || typeof invoiceNumber !== 'string') {
      return res.status(400).json({ error: 'invoiceNumber es obligatorio y debe ser texto' });
    }

    // V2: invoiceNumber patrón
    const invoiceNumberPattern = /^[A-Z0-9\-\/]+$/;
    if (!invoiceNumberPattern.test(invoiceNumber)) {
      return res.status(400).json({ 
        error: 'invoiceNumber debe contener solo letras mayúsculas, números, guiones y barras' 
      });
    }

    // V3: clientId obligatorio
    if (!clientId) {
      return res.status(400).json({ error: 'clientId es obligatorio' });
    }

    // V4: Verificar cliente existe y está activo
    const client = await db.query(
      'SELECT id, is_active FROM clients WHERE id = $1 AND user_id = $2',
      [clientId, userId]
    );
    if (client.rows.length === 0 || !client.rows[0].is_active) {
      return res.status(400).json({ error: 'Cliente no existe o está inactivo' });
    }

    // V5: Fechas requeridas
    if (!issueDate || !dueDate) {
      return res.status(400).json({ error: 'issueDate y dueDate son obligatorios' });
    }

    // V6: dueDate >= issueDate
    const issueObj = new Date(issueDate);
    const dueObj = new Date(dueDate);
    if (dueObj < issueObj) {
      return res.status(400).json({ 
        error: 'dueDate debe ser mayor o igual a issueDate' 
      });
    }

    // V7: Items mínimo 1
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Mínimo 1 línea de factura requerida' });
    }

    // V8: Validar cada item
    for (const item of items) {
      if (!item.description || item.description.trim().length === 0) {
        return res.status(400).json({ error: 'Todas las líneas requieren descripción' });
      }
      
      const quantity = parseFloat(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ error: `Cantidad inválida: ${item.quantity}` });
      }

      const unitPrice = parseFloat(item.unitPrice);
      if (isNaN(unitPrice) || unitPrice < 0) {
        return res.status(400).json({ error: `Precio unitario inválido: ${item.unitPrice}` });
      }

      const vat = parseFloat(item.vatPercentage);
      const validVAT = [0, 5, 10, 21];
      if (!validVAT.includes(vat)) {
        return res.status(400).json({ error: `IVA inválido: ${vat}. Válidos: 0, 5, 10, 21` });
      }
    }

    // V9: Validar totales
    if (typeof subtotal !== 'number' || subtotal <= 0) {
      return res.status(400).json({ error: 'Subtotal debe ser positivo' });
    }

    if (typeof total !== 'number' || total <= 0) {
      return res.status(400).json({ error: 'Total debe ser positivo' });
    }

    // V10: Validar suma de líneas = total
    const calculatedTotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice * (1 + item.vatPercentage / 100));
    }, 0);
    
    const tolerance = 0.01; // Tolerancia para redondeos
    if (Math.abs(calculatedTotal - total) > tolerance) {
      return res.status(400).json({ 
        error: 'Total no coincide con suma de líneas',
        expected: total,
        calculated: calculatedTotal
      });
    }

    // V11: Forzar status a 'draft'
    const payload = {
      ...req.body,
      status: 'draft' // ⭐ SIEMPRE draft
    };

    const invoice = await invoiceRepository.create(userId, payload);
    
    // V12: Registrar en audit_log
    await db.query(
      `INSERT INTO invoice_audit_log (invoice_id, user_id, action, new_value, created_at)
       VALUES ($1, $2, 'created', $3, NOW())`,
      [invoice.id, userId, JSON.stringify({ invoiceNumber, total })]
    );

    res.status(201).json(invoice);

  } catch (error: any) {
    console.error('Error creating invoice:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El número de factura ya existe' });
    }
    res.status(500).json({ error: 'Error al crear la factura' });
  }
};
```

---

## 📊 MATRIZ DE IMPLEMENTACIÓN

| # | Validación | Especificación | Frontend | Backend | ¿Falta? |
|----|-----------|----------------|----------|---------|---------|
| 1 | invoiceNumber obligatorio | ✅ | ✅ | ❌ | Backend |
| 2 | invoiceNumber patrón | ✅ | ❌ | ❌ | Ambos |
| 3 | invoiceNumber único (async) | ✅ | ❌ | ✅ DB | Frontend |
| 4 | clientId obligatorio | ✅ | ❌ | ❌ | Ambos |
| 5 | clientId existe | ✅ | ❌ | ❌ | Ambos |
| 6 | clientId activo | ✅ | ❌ | ❌ | Ambos |
| 7 | issueDate requerido | ✅ | ✅ | ❌ | Backend |
| 8 | dueDate requerido | ✅ | ✅ | ❌ | Backend |
| 9 | dueDate >= issueDate | ✅ | ❌ | ❌ | Ambos |
| 10 | items >= 1 | ✅ | ✅ | ❌ | Backend |
| 11 | items.quantity > 0 | ✅ | ❌ | ❌ | Ambos |
| 12 | items.unitPrice >= 0 | ✅ | ❌ | ❌ | Ambos |
| 13 | items.vatPercentage ∈ [0,5,10,21] | ✅ | ❌ | ❌ | Ambos |
| 14 | items.description obligatorio | ✅ | ✅ | ❌ | Backend |
| 15 | Suma líneas = total | ✅ | ⚠️ Calcula | ❌ | Backend |
| 16 | status = 'draft' | ✅ | ⚠️ Default | ❌ | Backend |

**Implementación TOTAL:** 5/16 = **31.25%**

---

## 🔴 VULNERABILIDADES

### V1: Backend NO Valida Nada

**Severidad:** 🔴 CRÍTICO  
**Tipo:** Input Validation Bypass  
**Riesgo:** Usuario puede crear factura con datos inválidos

```
ESCENARIO:
1. Frontend falla/se cierra
2. Usuario hace POST /api/invoices directamente con curl:
   curl -X POST /api/invoices \
     -H "Content-Type: application/json" \
     -d '{
       "invoiceNumber": null,
       "clientId": null,
       "total": -5000,
       "items": []
     }'
3. Backend ACEPTA (sin validar)
4. BD rechaza (UNIQUE violation) pero info entra parcial
5. Datos inconsistentes
```

### V2: clientId NO Obligatorio (Frontend)

**Severidad:** 🟠 ALTA  
**Tipo:** Business Logic Error  
**Riesgo:** Crear factura sin cliente

```javascript
const clientId = formData.get('client_id') || null;  // ⚠️ Puede ser null

// Debería ser:
const clientId = formData.get('client_id');
if (!clientId) {
  showNotification('Cliente es obligatorio', 'warning');
  return;
}
```

### V3: status Permite 'sent' al Crear

**Severidad:** 🟠 MEDIA  
**Tipo:** Business Logic Error  
**Riesgo:** Factura "nueva" pero ya enviada

```javascript
const status = formData.get('status') || 'draft';
// Usuario selecciona 'sent' y crea factura "enviada" desde cero
```

---

## ✅ PLAN DE CORRECCIÓN

### P0 - CRÍTICO (Inmediato)

```
1. Backend - Agregar validaciones en createInvoice()
   Tiempo: 1.5 horas
   
2. Frontend - clientId obligatorio
   Tiempo: 30 minutos
   
3. Frontend - invoiceNumber patrón
   Tiempo: 30 minutos
```

### P1 - ALTA (Semana 1)

```
4. Frontend - dueDate >= issueDate
   Tiempo: 30 minutos
   
5. Frontend - Validar quantity > 0
   Tiempo: 45 minutos
   
6. Frontend - Validar vatPercentage
   Tiempo: 30 minutos
```

### P2 - MEDIA (Semana 2)

```
7. Frontend - Async uniqueness check para invoiceNumber
   Tiempo: 1 hora
   
8. Backend - Registrar en audit_log
   Tiempo: 1 hora
```

---

## 📋 CHECKLIST

- [ ] P0-1: Backend validaciones createInvoice()
- [ ] P0-2: Frontend clientId obligatorio
- [ ] P0-3: Frontend invoiceNumber patrón
- [ ] P1-1: Frontend dueDate >= issueDate
- [ ] P1-2: Frontend validar quantity
- [ ] P1-3: Frontend validar VAT
- [ ] P2-1: Frontend async uniqueness
- [ ] P2-2: Backend audit_log

**Tiempo Total:** ~6-7 horas
