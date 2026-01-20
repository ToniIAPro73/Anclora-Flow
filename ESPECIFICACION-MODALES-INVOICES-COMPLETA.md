# ESPECIFICACIÓN DE MODALES - Módulo Ingresos & Facturas

**Versión:** 1.0  
**Enfoque:** 4 modales + lógica de permisos + validaciones  
**Estado:** Definición clara de responsabilidades

---

## 📋 ÍNDICE

1. [Matriz de Modales](#matriz-de-modales)
2. [Modal 1: Crear Factura](#modal-1-crear-factura)
3. [Modal 2: Consultar Factura](#modal-2-consultar-factura)
4. [Modal 3: Editar Factura](#modal-3-editar-factura)
5. [Modal 4: Registrar Pago](#modal-4-registrar-pago)
6. [Flujo de Permisos](#flujo-de-permisos)
7. [Validaciones por Estatus](#validaciones-por-estatus)

---

## 📊 MATRIZ DE MODALES

```
┌─────────────────┬──────────┬──────────┬────────────┬─────────┐
│ Modal           │ Tipo     │ Modo     │ Editable   │ Acceso  │
├─────────────────┼──────────┼──────────┼────────────┼─────────┤
│ Crear Factura   │ FORM     │ Crear    │ ✅ Sí      │ Botón   │
│ Consultar       │ DRAWER   │ Lectura  │ ❌ No      │ Click   │
│ Editar          │ MODAL    │ Edición  │ ✅ Sí      │ Botón   │
│ Registrar Pago  │ MODAL    │ Crear    │ ✅ Sí      │ Botón   │
└─────────────────┴──────────┴──────────┴────────────┴─────────┘
```

---

## 🔄 FLUJO USUARIO

```
┌──────────────────┐
│ Tabla Facturas   │
└────────┬─────────┘
         │
    ┌────▼──────┐
    │ Click fila│
    └────┬──────┘
         │
    ┌────▼─────────────────────────────┐
    │ CONSULTAR (Read-only Drawer)     │
    │                                   │
    │ ├─ Ver todos los datos           │
    │ ├─ Ver histórico de cambios      │
    │ ├─ [Editar] si status='draft'   │
    │ ├─ [Pagar] si status='sent/part' │
    │ └─ [Cerrar]                      │
    └────┬─────────────────────────────┘
         │
    ┌────▼─────────────────┐
    │ Si [Editar]          │
    │ (solo si draft)      │
    │                      │
    │ EDITAR (Modal Form)  │
    │                      │
    │ ├─ Modificar campos  │
    │ ├─ Editar líneas     │
    │ ├─ [Cancelar]        │
    │ └─ [Guardar]         │
    └──────────────────────┘
```

---

## 🎨 MODAL 1: CREAR FACTURA

**Tipo:** Modal Form (Crear)  
**Estado Aplicable:** Inicial (no existe factura)  
**Modo:** 100% editable  
**Botón de Acceso:** "Nueva Factura" (header página)

### Estructura

```
┌─────────────────────────────────────────────────────────────┐
│ CREAR FACTURA                                         [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ DATOS BÁSICOS                                                │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Número de Factura *                                  │   │
│ │ [FAC-2025-001________________] ✓ Disponible         │   │
│ │ ⓘ Ej: FAC-2025-001, INV-001, etc.                  │   │
│ │                                                      │   │
│ │ Cliente * (requerido)                                │   │
│ │ [Selecciona cliente...         ▼]                   │   │
│ │ ✗ Campo requerido                                   │   │
│ │                                                      │   │
│ │ Proyecto (opcional)                                  │   │
│ │ [Selecciona proyecto...        ▼]                   │   │
│ │                                                      │   │
│ │ ┌─────────────────┬─────────────────┐               │   │
│ │ │ Fecha Emisión * │ Fecha Vencim. * │               │   │
│ │ │ [19/01/2026]    │ [19/02/2026]    │               │   │
│ │ │ ✓               │ ✓               │               │   │
│ │ └─────────────────┴─────────────────┘               │   │
│ │ ⓘ Vencimiento debe ser ≥ Emisión                   │   │
│ │                                                      │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ LÍNEAS DE FACTURA (mínimo 1)                                │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Descripción │ Cant. │ P.Unit. │ IVA │ Subtotal      │   │
│ ├──────────────────────────────────────────────────────┤   │
│ │ [________] │ [1] │ [1000] │ [21%] │ 1.210,00€     │   │
│ │ [________] │ [2] │ [ 100] │ [21%] │   242,00€     │   │
│ │                                                      │   │
│ │ [+ Agregar línea] [Eliminar línea]                 │   │
│ │                                                      │   │
│ │ ✗ Mínimo una línea requerida                        │   │
│ │                                                      │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ DESGLOSE FISCAL                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Subtotal:        1.200,00 €                         │   │
│ │ IVA 0%:              0,00 €                         │   │
│ │ IVA 5%:              0,00 €                         │   │
│ │ IVA 10%:             0,00 €                         │   │
│ │ IVA 21%:           252,00 €                         │   │
│ │ IRPF (si aplica):  -0,00 €                         │   │
│ │ ─────────────────────────────────────────────       │   │
│ │ TOTAL:           1.452,00 €                         │   │
│ │                                                      │   │
│ │ ⓘ Cálculo automático                               │   │
│ │                                                      │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ OBSERVACIONES (opcional)                                     │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ [Notas internas o para el cliente...       ]        │   │
│ │                                                      │   │
│ │                                                      │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ [Cancelar]                              [Crear Factura] ✓  │
└─────────────────────────────────────────────────────────────┘
```

### Validaciones en Tiempo Real

```typescript
const validations = {
  invoiceNumber: {
    required: true,
    pattern: /^[A-Z0-9\-\/]+$/,
    async: checkUnique,  // Llamada a backend
    messages: {
      required: 'Requerido',
      pattern: 'Solo A-Z, 0-9, -, /',
      duplicate: 'Ya existe'
    }
  },
  
  clientId: {
    required: true,
    messages: {
      required: 'Selecciona un cliente'
    }
  },
  
  dueDate: {
    compare: (dueDate >= issueDate),
    messages: {
      compare: 'No puede ser anterior a fecha de emisión'
    }
  },
  
  items: {
    minLength: 1,
    forEach: (item) => {
      if (item.quantity <= 0) throw 'Cantidad debe ser > 0';
      if (item.unitPrice < 0) throw 'Precio no puede ser negativo';
      if (![0, 5, 10, 21].includes(item.vatPercentage)) throw 'IVA inválido';
    },
    messages: {
      minLength: 'Mínimo una línea'
    }
  }
};

// Deshabilitar botón "Crear" si hay errores
<button disabled={Object.keys(errors).length > 0}>Crear Factura</button>
```

### Acciones del Backend

```typescript
POST /invoices

// Backend DEBE:
✅ Validar todos los campos (V1-V10 del análisis)
✅ Status = 'draft' (forzado)
✅ created_by = userId
✅ Registrar en audit_log: 'created'
✅ Retornar factura con id

// Si error:
❌ 400: validation errors
❌ 409: invoice_number_duplicate
❌ 404: client_not_found
❌ 400: client_inactive
```

---

## 🔍 MODAL 2: CONSULTAR FACTURA

**Tipo:** Drawer (Side Panel)  
**Estado Aplicable:** Cualquiera (draft, sent, paid, overdue, cancelled)  
**Modo:** 100% lectura (READ-ONLY)  
**Acceso:** Click en fila tabla o link desde detalles

### Estructura

```
SIDE PANEL (Right Drawer)
┌─────────────────────────────────────────────┐
│ FAC-2025-001                    [Estado]    │
│                                      ✓ Pagada
│ [X]
├─────────────────────────────────────────────┤
│                                              │
│ INFORMACIÓN GENERAL                          │
│ ├─ Cliente: María García López              │
│ │  Email: maria@example.com                 │
│ │  NIF: 12345678A                          │
│ │                                            │
│ ├─ Proyecto: (Consultoría Q1 2025)         │
│ │                                            │
│ ├─ Emisión: 15/01/2026                     │
│ ├─ Vencimiento: 15/02/2026 (28 días)      │
│ └─ Referencia Interna: PRY-001-001         │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│ LÍNEAS DE FACTURA                            │
│ ┌─────────────────────────────────────────┐ │
│ │ Descripción│Cant.│Precio│IVA│Subtotal│ │
│ ├─────────────────────────────────────────┤ │
│ │ Servicio A │  1  │ 500  │21% │ 605,00 │ │
│ │ Servicio B │  2  │ 250  │21% │ 605,00 │ │
│ └─────────────────────────────────────────┘ │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│ DESGLOSE FISCAL                              │
│ ├─ Subtotal:          1.000,00 €            │
│ ├─ IVA 0%:                0,00 €            │
│ ├─ IVA 5%:                0,00 €            │
│ ├─ IVA 10%:               0,00 €            │
│ ├─ IVA 21%:             210,00 €            │
│ ├─ IRPF (15%):           -50,00 €           │
│ │                                            │
│ ├─ TOTAL:            1.160,00 €             │
│ │                                            │
│ └─ Moneda: EUR                              │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│ ESTADO DE PAGO                               │
│ ├─ Pagado: 1.160,00 €     [████████████]    │
│ ├─ Pendiente: 0,00 €      [░░░░░░░░░░░░]    │
│ │                                            │
│ │ Progreso: 100%                            │
│ └─ Última actualización: 19/01/2026 10:30   │
│                                              │
│ PAGOS REGISTRADOS                            │
│ ┌─────────────────────────────────────────┐ │
│ │ Fecha    │ Importe │ Método    │ Ref   │ │
│ ├─────────────────────────────────────────┤ │
│ │ 19/01    │1.160€  │Transferen │TRX001│ │
│ └─────────────────────────────────────────┘ │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│ HISTÓRICO DE CAMBIOS                         │
│ ├─ 15/01 10:30 │ Creada       │ Toni      │ │
│ ├─ 15/01 11:00 │ Enviada      │ Toni      │ │
│ │              │ maria@ex.com │           │ │
│ ├─ 19/01 10:30 │ Pago recib. │ Sistema   │ │
│ │              │ 1.160€ TRX  │           │ │
│ └─ 19/01 10:31 │ Status→Paid │ Sistema   │ │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│ ACCIONES                                     │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Status: PAGADA → Acciones limitadas     │ │
│ │                                          │ │
│ │ [Descargar PDF] [Enviar Email]          │ │
│ │                                          │ │
│ └─────────────────────────────────────────┘ │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│ BOTONES CONTEXTUALES (según status)         │
│                                              │
│ Si status = 'draft':                        │
│ ├─ [Editar] → Modal EditInvoiceModal       │
│ ├─ [Eliminar] → Confirmación               │
│ └─ [Enviar] → POST /invoices/{id}/send    │
│                                              │
│ Si status = 'sent' o 'partial':            │
│ ├─ [Registrar Pago] → Modal RePaymentModal │
│ ├─ [Descargar PDF]                         │
│ └─ [Enviar Email]                          │
│                                              │
│ Si status = 'paid':                        │
│ ├─ [Descargar PDF]                         │
│ └─ [Enviar Email]                          │
│                                              │
│ [Cerrar Panel]                               │
│                                              │
└─────────────────────────────────────────────┘
```

### Características

```typescript
interface ConsultarModal {
  // READ-ONLY: Todos los campos son inputs deshabilitados
  invoiceNumber: { disabled: true, value: invoice.invoiceNumber },
  clientName: { disabled: true, value: invoice.client.name },
  issueDate: { disabled: true, value: invoice.issueDate },
  
  // Secciones especiales
  auditLog: {
    visible: true,
    content: histórico de cambios con usuario y fecha
  },
  
  paymentsList: {
    visible: true,
    showHistory: true,
    items: [
      { date, amount, method, reference, createdBy }
    ]
  },
  
  progressBar: {
    paid: invoice.paid_amount,
    total: invoice.total,
    percentage: (paid_amount / total) * 100
  },
  
  buttons: {
    edit: status === 'draft',
    pay: ['sent', 'partial'].includes(status),
    delete: status === 'draft',
    download: true,
    email: true,
    close: true
  }
}
```

### Sin Edición Directa

```typescript
// ❌ NO editar en este drawer
// ✅ Usar modal EditInvoiceModal si status='draft'

// El drawer es PURAMENTE para CONSULTA
```

---

## ✏️ MODAL 3: EDITAR FACTURA

**Tipo:** Modal Form (Edición)  
**Estado Aplicable:** SOLO 'draft'  
**Modo:** Editable (campos seleccionados)  
**Acceso:** Botón [Editar] en drawer consultar  
**Restricción:** Solo si status='draft'

### Estructura

```
┌─────────────────────────────────────────────────────────────┐
│ EDITAR FACTURA - FAC-2025-001                        [X]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ⚠️ AVISO: Solo se pueden editar borradores                 │
│    Esta factura está en estado: DRAFT (editable)            │
│                                                              │
│ DATOS BÁSICOS                                                │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Número de Factura *                                  │   │
│ │ [FAC-2025-001________________] (no editable)         │   │
│ │ ⓘ No se puede cambiar el número                     │   │
│ │                                                      │   │
│ │ Cliente * (requerido)                                │   │
│ │ [María García López      ▼] ✓                        │   │
│ │ ⓘ Puedes cambiar el cliente                          │   │
│ │                                                      │   │
│ │ Proyecto (opcional)                                  │   │
│ │ [(Sin Proyecto)              ▼]                      │   │
│ │                                                      │   │
│ │ ┌─────────────────┬─────────────────┐               │   │
│ │ │ Fecha Emisión * │ Fecha Vencim. * │               │   │
│ │ │ [15/01/2026]    │ [15/02/2026]    │               │   │
│ │ │ (editable)      │ (editable)      │               │   │
│ │ └─────────────────┴─────────────────┘               │   │
│ │                                                      │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ LÍNEAS DE FACTURA (puedes modificarlas)                     │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Descripción │ Cant. │ P.Unit. │ IVA │ Subtotal      │   │
│ ├──────────────────────────────────────────────────────┤   │
│ │ [Servicio A_] │ [1] │ [500]  │ [21%] │ 605,00€    │   │
│ │ [Servicio B_] │ [2] │ [250]  │ [21%] │ 605,00€    │   │
│ │                                                      │   │
│ │ [+ Agregar línea] [Eliminar línea]                 │   │
│ │                                                      │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ DESGLOSE FISCAL (se actualiza automáticamente)              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Subtotal:        1.200,00 €                         │   │
│ │ IVA 21%:           252,00 €                         │   │
│ │ IRPF (si aplica):  -50,00 €                         │   │
│ │ ─────────────────────────────────────────────       │   │
│ │ TOTAL:           1.402,00 €                         │   │
│ │                                                      │   │
│ │ ⓘ Cálculo automático en tiempo real                 │   │
│ │                                                      │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ OBSERVACIONES (opcional)                                     │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ [Notas actualizadas...                ]             │   │
│ │                                                      │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ MOTIVO DE CAMBIO (obligatorio si hay cambios)               │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ [Cambio de líneas, cliente solicitó descuento] │   │   │
│ │                                                      │   │
│ │ ⓘ Se registrará en histórico de auditoría          │   │
│ │                                                      │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ [Cancelar]                              [Guardar Cambios] ✓│
└─────────────────────────────────────────────────────────────┘
```

### Validaciones

```typescript
const editValidations = {
  // Campos NO editables:
  invoiceNumber: { disabled: true },  // ❌ No se puede cambiar
  
  // Campos editables:
  clientId: { required: true },
  issueDate: { required: true },
  dueDate: { 
    required: true,
    compare: (dueDate >= issueDate)
  },
  items: {
    minLength: 1,
    forEach: validarCadaLinea
  },
  changeReason: {
    required: true,  // ✅ OBLIGATORIO si hay cambios
    minLength: 10    // Al menos 10 caracteres
  }
};

// Si usuario NO hace cambios:
// ├─ Botón "Guardar" deshabilitado
// └─ changeReason no requerido

// Si usuario HACE cambios:
// ├─ changeReason requerido
// └─ Mostrar qué exactamente cambió
```

### Acciones del Backend

```typescript
PUT /invoices/{id}

// Backend DEBE validar:
✅ status === 'draft' (solo se puede editar si draft)
✅ changeReason existe si hay cambios
✅ Todos los campos obligatorios válidos
✅ Registrar ANTES vs DESPUÉS en audit_log
✅ change_type: 'updated'
✅ Guardar old_values y new_values

// Si error:
❌ 403: cannot_edit_non_draft_invoice
❌ 400: validation errors
❌ 400: change_reason_required
```

---

## 💰 MODAL 4: REGISTRAR PAGO

**Tipo:** Modal Form (Crear Pago)  
**Estado Aplicable:** 'sent' o 'partial'  
**Modo:** Editable  
**Acceso:** Botón [Registrar Pago] en drawer consultar

### Estructura

```
┌──────────────────────────────────────────────────┐
│ REGISTRAR PAGO - FAC-2025-001           [X]     │
├──────────────────────────────────────────────────┤
│                                                  │
│ INFORMACIÓN DE LA FACTURA                        │
│ ├─ Cliente: María García López                  │
│ ├─ Total: 1.160,00 €                            │
│ ├─ Pagado: 300,00 €                             │
│ ├─ Pendiente: 860,00 €  ← Máximo a pagar       │
│ │                                                │
│ │ Progress: [████░░░░░░░░░░░░░░░░] 26%        │
│ │                                                │
│ └─ Status: PARTIAL (con pagos parciales)       │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│ NUEVO PAGO                                       │
│ ┌──────────────────────────────────────────────┐│
│ │ Importe a Pagar *                            ││
│ │ [860,00 €_________________] €                ││
│ │ ⓘ Máximo: 860,00€ (pendiente)                ││
│ │ ✓ Disponible                                 ││
│ │                                              ││
│ │ Fecha de Pago *                              ││
│ │ [19/01/2026______] (Hoy)                     ││
│ │ ✓                                            ││
│ │                                              ││
│ │ Método de Pago *                             ││
│ │ [Selecciona método...    ▼]                  ││
│ │ ├─ Transferencia Bancaria                    ││
│ │ ├─ Efectivo                                  ││
│ │ ├─ Tarjeta de Crédito                        ││
│ │ ├─ Cheque                                    ││
│ │ └─ Otro                                      ││
│ │ ✗ Campo requerido                            ││
│ │                                              ││
│ │ Si selecciona "Transferencia":               ││
│ │ ├─ Cuenta Bancaria *                         ││
│ │ │ [ES9121 0418 4516 0005 1332 ▼]           ││
│ │ │ ⓘ Cuenta por defecto                       ││
│ │ │                                            ││
│ │ │ Referencia (IBAN del cliente)              ││
│ │ │ [ES1234567890_________]                    ││
│ │ │ ⓘ Opcional                                 ││
│ │ │                                            ││
│ │ └─ Número de Referencia                      ││
│ │   [TRX20250119001_________]                  ││
│ │   ⓘ ID de transferencia                      ││
│ │                                              ││
│ │ Si selecciona "Cheque":                      ││
│ │ ├─ Número de Cheque                          ││
│ │ │ [001234__________________]                 ││
│ │ │                                            ││
│ │ └─ Número de Banco                           ││
│ │   [3049_____________________]                ││
│ │                                              ││
│ │ Observaciones (opcional)                     ││
│ │ [Pago parcial, siguiente el 1/2/26]         ││
│ │                                              ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ PREVISUALIZACIÓN DE CAMBIOS                     │
│ ┌──────────────────────────────────────────────┐│
│ │ Después de registrar este pago:               ││
│ │ ├─ Pagado: 300€ + 860€ = 1.160€             ││
│ │ ├─ Pendiente: 0,00€                          ││
│ │ ├─ Status: PAID → Factura completamente pag.││
│ │ └─ Recibo: Se generará automáticamente       ││
│ │                                              ││
│ └──────────────────────────────────────────────┘│
│                                                  │
├──────────────────────────────────────────────────┤
│ [Cancelar]                    [Registrar Pago] ✓│
└──────────────────────────────────────────────────┘
```

### Validaciones

```typescript
const paymentValidations = {
  amount: {
    required: true,
    positive: true,
    max: invoice.remaining_amount,
    messages: {
      required: 'Requerido',
      positive: 'Debe ser > 0',
      max: `Máximo ${invoice.remaining_amount}€`
    }
  },
  
  paymentDate: {
    required: true,
    messages: {
      required: 'Requerido'
    }
  },
  
  paymentMethod: {
    required: true,
    enum: ['bank_transfer', 'cash', 'card', 'check', 'other'],
    messages: {
      required: 'Requerido',
      enum: 'Método inválido'
    }
  },
  
  bankAccount: {
    required: paymentMethod === 'bank_transfer',
    messages: {
      required: 'Requerida para transferencias'
    }
  },
  
  checkNumber: {
    required: paymentMethod === 'check',
    messages: {
      required: 'Requerido para cheques'
    }
  }
};
```

### Acciones del Backend

```typescript
POST /invoices/{id}/payments

// Backend DEBE:
✅ Validar status es 'sent' o 'partial'
✅ Validar amount ≤ remaining_amount
✅ Validar paymentDate válido
✅ Validar paymentMethod válido
✅ Crear entry en payments
✅ Crear entry en invoice_payment_allocations
✅ TRIGGER actualiza invoice.paid_amount
✅ TRIGGER actualiza invoice.status si paid_amount = total
✅ Registrar en audit_log: 'payment_recorded'
✅ Generar recibo automáticamente

// Si error:
❌ 403: cannot_pay_non_sent_invoice
❌ 400: payment_exceeds_remaining
❌ 400: validation errors
```

---

## 🔐 FLUJO DE PERMISOS

### Por Status

```
┌────────┬──────────┬────────┬────────────┬──────────┐
│ Status │ Consulta │ Editar │ Pagar      │ Eliminar │
├────────┼──────────┼────────┼────────────┼──────────┤
│ draft  │ ✅ Sí   │ ✅ Sí  │ ❌ No      │ ✅ Sí    │
│ sent   │ ✅ Sí   │ ❌ No  │ ✅ Sí      │ ❌ No    │
│ paid   │ ✅ Sí   │ ❌ No  │ ❌ No      │ ❌ No    │
│ partial│ ✅ Sí   │ ❌ No  │ ✅ Sí      │ ❌ No    │
│ overdue│ ✅ Sí   │ ❌ No  │ ✅ Sí      │ ❌ No    │
│ cancel │ ✅ Sí   │ ❌ No  │ ❌ No      │ ❌ No    │
└────────┴──────────┴────────┴────────────┴──────────┘
```

### En Frontend

```typescript
// En InvoiceDetailDrawer:

const actionButtons = {
  edit: {
    visible: invoice.status === 'draft',
    label: 'Editar',
    onClick: openEditModal,
    tooltip: 'Solo se pueden editar borradores'
  },
  
  pay: {
    visible: ['sent', 'partial', 'overdue'].includes(invoice.status),
    label: 'Registrar Pago',
    onClick: openPaymentModal,
    tooltip: 'Registra un nuevo pago para esta factura'
  },
  
  delete: {
    visible: invoice.status === 'draft',
    label: 'Eliminar',
    onClick: confirmDelete,
    tooltip: 'Solo se pueden eliminar borradores'
  },
  
  download: {
    visible: true,
    label: 'Descargar PDF',
    onClick: downloadPDF
  },
  
  email: {
    visible: true,
    label: 'Enviar Email',
    onClick: openEmailModal,
    disabled: !invoice.client?.email,
    tooltip: 'Cliente no tiene email'
  }
};

// Renderizar solo botones disponibles
{actionButtons.edit.visible && (
  <button onClick={actionButtons.edit.onClick}>
    {actionButtons.edit.label}
  </button>
)}
```

### En Backend

```typescript
// Middleware de autorización en cada endpoint

router.put('/invoices/:id', 
  authenticate,
  async (req, res) => {
    const invoice = await getInvoice(req.params.id, userId);
    
    // ✅ Verificar permiso
    if (invoice.status !== 'draft') {
      return res.status(403).json({
        error: 'cannot_edit_non_draft_invoice',
        current_status: invoice.status
      });
    }
    
    // ✅ Continuar con edición
    await updateInvoice(invoice, req.body);
  }
);

router.post('/invoices/:id/payments',
  authenticate,
  async (req, res) => {
    const invoice = await getInvoice(req.params.id, userId);
    
    // ✅ Verificar permiso
    if (!['sent', 'partial', 'overdue'].includes(invoice.status)) {
      return res.status(403).json({
        error: 'cannot_pay_this_invoice',
        current_status: invoice.status,
        allowed_statuses: ['sent', 'partial', 'overdue']
      });
    }
    
    // ✅ Continuar con pago
    await recordPayment(invoice, req.body);
  }
);
```

---

## 📊 VALIDACIONES POR ESTATUS

### Draft (Borrador)

```
✅ Editar: SÍ
✅ Pagar: NO (no se puede pagar un borrador)
✅ Eliminar: SÍ
✅ Enviar: SÍ

Razón: Factura en construcción, no se ha comunicado al cliente
```

### Sent (Enviada)

```
✅ Editar: NO (ya fue comunicada)
✅ Pagar: SÍ (cliente puede pagar)
✅ Eliminar: NO
✅ Cancelar: SÍ (solo si no tiene pagos)

Razón: Factura formal, no se puede alterar una vez enviada
```

### Paid (Pagada)

```
✅ Editar: NO
✅ Pagar: NO (ya pagada)
✅ Eliminar: NO
✅ Cancelar: NO

Razón: Cerrada, solo consulta y descarga de PDF
```

### Partial (Pagada Parcialmente)

```
✅ Editar: NO
✅ Pagar: SÍ (registrar más pagos)
✅ Eliminar: NO
✅ Cancelar: NO (tiene pagos)

Razón: En espera de más pagos, usuario puede registrar nuevos
```

### Overdue (Vencida)

```
✅ Editar: NO
✅ Pagar: SÍ (cobrar la deuda)
✅ Eliminar: NO
✅ Cancelar: NO

Razón: Vencida pero aún se puede cobrar
```

### Cancelled (Cancelada)

```
✅ Editar: NO
✅ Pagar: NO
✅ Eliminar: NO
✅ Visualizar: SÍ (solo lectura)

Razón: Cerrada definitivamente, solo auditoría
```

---

## 📱 RESUMEN MODAL Y ACCESO

```
┌─────────────────────┬──────────────┬────────────────────────┐
│ Modal               │ Acceso       │ Validaciones Clave     │
├─────────────────────┼──────────────┼────────────────────────┤
│ CREAR               │ Btn Principal│ ✅ Cliente obligatorio │
│                     │ (header)     │ ✅ Mínimo 1 línea     │
│                     │              │ ✅ Status='draft'      │
│                     │              │ ✅ Suma correcta       │
├─────────────────────┼──────────────┼────────────────────────┤
│ CONSULTAR           │ Click fila   │ ✅ Solo lectura        │
│ (Drawer)            │              │ ✅ Mostrar histórico   │
│                     │              │ ✅ Btn contextuales    │
├─────────────────────┼──────────────┼────────────────────────┤
│ EDITAR              │ [Editar] btn │ ✅ Solo si status      │
│                     │ (desde       │    ='draft'            │
│                     │  drawer)     │ ✅ Número no editable  │
│                     │              │ ✅ Motivo requerido    │
├─────────────────────┼──────────────┼────────────────────────┤
│ REGISTRAR PAGO      │ [Pagar] btn  │ ✅ Amount ≤ pending   │
│                     │ (desde       │ ✅ Válido si 'sent',   │
│                     │  drawer)     │    'partial', 'due'    │
│                     │              │ ✅ Banco si transfer   │
└─────────────────────┴──────────────┴────────────────────────┘
```

---

**Gracias por señalar esto. Ahora está completo y diferenciado:** 
✅ **Crear** (new invoice)  
✅ **Consultar** (read-only drawer)  
✅ **Editar** (edit modal, solo si draft)  
✅ **Pagar** (payment modal, con lógica de pagos parciales)
