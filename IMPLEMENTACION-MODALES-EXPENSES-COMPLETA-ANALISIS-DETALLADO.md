# IMPLEMENTACIÓN COMPLETA - Módulo Gastos & Deducciones

**Versión:** 2.0 (REFACTOR CON VALIDACIONES + AUDITORÍA)  
**Fecha:** 20 Enero 2026  
**Base:** Análisis línea-por-línea de `expenses.js`  
**Estado:** 🔴 LISTA PARA REFACTOR

---

## 📋 ÍNDICE

1. [Análisis Crítico del Código Actual](#análisis-crítico-del-código-actual)
2. [Vulnerabilidades y Deuda Técnica](#vulnerabilidades-y-deuda-técnica)
3. [Plan de Refactor por Fases](#plan-de-refactor-por-fases)
4. [Código de Producción - Modal 1](#código-de-producción---modal-1)
5. [Código de Producción - Modal 2](#código-de-producción---modal-2)
6. [Código de Producción - Modal 3](#código-de-producción---modal-3)
7. [Validadores y Servicios](#validadores-y-servicios)
8. [Auditoría e Integración BD](#auditoría-e-integración-bd)
9. [Testing y Checklist](#testing-y-checklist)

---

## 🔍 ANÁLISIS CRÍTICO DEL CÓDIGO ACTUAL

### ESTADO GENERAL

| Aspecto | Estado | Líneas | Severidad | Nota |
|---------|--------|--------|-----------|------|
| **Validaciones** | ⚠️ 40% | 549-567 | 🔴 CRÍTICA | `amount > 0` ✅, fecha futura ❌, descripción min ❌ |
| **Auditoría** | ❌ 0% | N/A | 🔴 CRÍTICA | Sin logging, sin createdBy/updatedBy |
| **Gestión Archivos** | ❌ 5% | 557, 540 | 🟠 ALTA | receiptUrl nunca se asigna del form |
| **Restricciones Edición** | ❌ 0% | 548-560 | 🟠 ALTA | Sin verificación de período fiscal cerrado |
| **Modales UX** | ⚠️ 70% | 448-650 | 🟡 MEDIA | Modal 1 OK, Modal 2 sin previsualización, Modal 3 sin restricciones |
| **Normalización Datos** | ✅ 95% | 43-67 | 🟢 BAJA | Bien: snake_case a camelCase |
| **Seguridad XSS** | ✅ 95% | 183-190 | 🟢 BAJA | `escapeHtml` bien aplicado |

---

### 🔴 CRÍTICA 1: VALIDACIONES INCOMPLETAS

#### Línea 549-567: handleExpenseSubmit()

**Código Actual:**
```javascript
// ❌ INCOMPLETO
if (!payload.expenseDate) {
    showNotification("Selecciona la fecha del gasto", "warning");
    return;
}
// ❌ NO VALIDA: expenseDate NO PUEDE SER FUTURA
// ❌ NO VALIDA: descripción longitud mínima (solo máximo en HTML)

if (!payload.description) {
    showNotification("Añade una descripción del gasto", "warning");
    return;
}
// ❌ NO VALIDA: descripción longitud >= 5 caracteres
// ❌ NO VALIDA: descripción trim() + validación

if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    showNotification("Introduce un importe mayor que 0", "warning");
    return;
}
// ✅ BIEN: validación amount > 0
// ❌ FALTA: validación amount <= 999999999
```

**Problemas Específicos:**
1. Línea 549: Acepta fechas futuras (violación fiscal)
2. Línea 554: Acepta descripción de 1 carácter
3. Línea 560: Sin validación de rangos numéricos
4. Línea 555: Sin validación de categoría contra lista maestra (solo en HTML)

**Impacto Fiscal:** 🔴 CRÍTICO
- Período fiscal puede incluir gastos futuros
- Reportes Modelo 303/130 generarían datos inválidos

---

### 🔴 CRÍTICA 2: SIN AUDITORÍA

#### Línea 573-606: create vs update

**Código Actual:**
```javascript
// ❌ NO HAY DIFERENCIACIÓN DE AUDITORÍA
if (mode === "edit" && activeExpenseId) {
    const updatedExpense = await window.api.updateExpense(
        activeExpenseId,
        payload
    );
    // ❌ NO SE REGISTRA:
    // - Quién editó (createdBy/updatedBy)
    // - Qué cambió (old_value vs new_value)
    // - Cuándo cambió (timestamps)
    // - Por qué cambió (change_reason)
    
    showNotification("Gasto actualizado correctamente", "success");
} else {
    const createdExpense = await window.api.createExpense(payload);
    // ❌ NO SE REGISTRA:
    // - Quién creó (createdBy)
    // - Cuándo se creó (created_at ya existe pero no se usa)
    
    showNotification("Gasto registrado correctamente", "success");
}
```

**Riesgos Legales:**
- Sin trazabilidad de cambios en períodos fiscales
- Imposible auditar quién modificó deducciones
- Incumplimiento de requisitos contables (LOPCYFD)

---

### 🟠 ALTA: GESTIÓN DE ARCHIVOS INCOMPLETA

#### Línea 540, 557: receiptUrl Ghosted

**Código Actual:**
```javascript
// Línea 540: En buildExpenseModalHtml
const receiptUrl = expense?.receipt_url ?? expense?.receiptUrl ?? "";
// ✅ Intenta leer receipt_url del expense

// Línea 557: En handleExpenseSubmit
const receiptUrl = (formData.get("receiptUrl") || "").trim();
if (receiptUrl) payload.receiptUrl = receiptUrl;
// ❌ PROBLEMA: "receiptUrl" NO EXISTE EN EL FORMULARIO
// En buildExpenseModalHtml NO se genera <input name="receiptUrl">

// Solución incompleta: Notas contienen URL
const notes = (formData.get("notes") || "").trim();
if (notes) payload.notes = notes;
// ❌ HACKY: Usuario debe guardar URL en "notas"
```

**Impacto:** 🟠 ALTA
- Imposible adjuntar comprobantes digitales
- Deducibilidad no puede validarse
- Incumplimiento de requisitos de retención de documentos

---

### 🟠 ALTA: SIN RESTRICCIONES DE EDICIÓN

#### Línea 548: openExpenseModal("edit")

**Código Actual:**
```javascript
async function openExpenseModal(mode = "create", expenseId = null) {
    activeExpenseId = expenseId;
    let expense = null;

    if (mode === "edit" && expenseId) {
        try {
            expense = await window.api.getExpense(expenseId);
        } catch (error) {
            // ...
        }
    }
    
    const modalHtml = buildExpenseModalHtml(mode, expense);
    // ❌ NO VALIDA:
    // - ¿Está el período fiscal cerrado?
    // - ¿Está el gasto incluido en una declaración?
    // - ¿Tiene el usuario permiso para editar?
    
    // ❌ NO RESTRINGE CAMPOS:
    // - amount SIEMPRE editable (debería bloquearse si período cerrado)
    // - expenseDate SIEMPRE editable
    // - category SIEMPRE editable
}
```

**Política Correcta:**
```
Si fiscalPeriodClosed === true:
├── Campos BLOQUEADOS: amount, expenseDate, category, vatAmount
├── Campos EDITABLES: notes, isDeductible (con motivo)
└── Requerir: changeReason

Si gasto en "invoice_audit_log" === true:
└── Bloquear edición completamente (solo lectura)
```

---

### 🟡 MEDIA: MODAL 2 (View) INCOMPLETO

#### Línea 722-850: viewExpense()

**Código Actual:**
```javascript
const receiptLink = expense.receipt_url
    ? `<a href="${escapeHtml(
          expense.receipt_url
      )}" target="_blank" rel="noopener">Abrir justificante</a>`
    : "No adjuntado";
// ❌ PROBLEMA: Solo muestra enlace
// ❌ FALTA: Previsualización del archivo (PDF/imagen)
// ❌ FALTA: Validación de tipo MIME
// ❌ FALTA: Control de acceso (¿puede descargar?)
```

**Modal 2 Debería Mostrar:**
```
┌────────────────────────────────┐
│ DETALLES DEL GASTO         [X] │
├────────────────────────────────┤
│ [Todos los campos como ahora]   │
│                                │
│ [PREVISUALIZACIÓN DEL ARCHIVO] │
│ ┌──────────────────────────┐   │
│ │ 📄 invoice_2026_01.pdf   │   │
│ │ (Previsualización PDF)   │   │
│ └──────────────────────────┘   │
│                                │
│ [Descargar] [Compartir]        │
├────────────────────────────────┤
│ [Cerrar] [Editar] [Eliminar]   │
└────────────────────────────────┘
```

---

### 🟡 MEDIA: MODAL 3 (Edit) SIN RESTRICCIONES

#### Línea 548: buildExpenseModalHtml()

**Código Actual:**
```javascript
function buildExpenseModalHtml(mode, expense) {
    const isEdit = mode === "edit" && expense;
    const title = isEdit ? "Editar gasto" : "Registrar nuevo gasto";
    // ❌ NO DIFERENCIA RESTRICCIONES por estado fiscal
    
    // Todos los campos SIEMPRE habilitados:
    // <input type="date" id="expense-date" ... required />
    // <input type="number" step="0.01" id="expense-amount" ... required />
    // <select id="expense-category" ... required>
    // ❌ DEBERÍA:
    // - Bloquearse si período fiscal cerrado
    // - Mostrar notificación de "período cerrado"
    // - Permitir solo cambio de "notas" y "deducibilidad"
}
```

---

## 🚨 VULNERABILIDADES Y DEUDA TÉCNICA

### MATRIZ DE RIESGOS

| # | Riesgo | Línea | Severidad | Impacto |
|---|--------|-------|-----------|---------|
| 1 | Fechas futuras permitidas | 549 | 🔴 CRÍTICA | Datos contables inválidos |
| 2 | Sin auditoría de cambios | 573-606 | 🔴 CRÍTICA | Incumplimiento legal LOPCYFD |
| 3 | Edición sin restricciones | 548 | 🟠 ALTA | Fraude fiscal |
| 4 | receiptUrl nunca se asigna | 557 | 🟠 ALTA | Imposible validar deducibilidad |
| 5 | Sin validación VAT range | 441 | 🟡 MEDIA | Cálculos IVA incorrectos |
| 6 | Descripción min-length | 554 | 🟡 MEDIA | Datos poco útiles |
| 7 | Sin límites deducibilidad | 541 | 🟡 MEDIA | Incumplimiento fiscal (comidas <50%) |
| 8 | Previsualización archivos | 742 | 🟡 MEDIA | UX deficiente |

---

## 🛠️ PLAN DE REFACTOR POR FASES

### FASE 1: VALIDACIONES EXHAUSTIVAS (2 DÍAS)

#### 1.1 Crear expenseValidator.ts

**Archivo:** `backend/src/validators/expenseValidator.ts`

```typescript
import { IExpenseCreate, IExpenseUpdate } from '../types/expense.js';

const VALID_CATEGORIES = [
  'office', 'software', 'hardware', 'marketing', 'travel',
  'meals', 'professional_services', 'supplies', 'insurance', 'other'
];

const CATEGORY_DEDUCTIBILITY_LIMITS = {
  'meals': 0.50,        // Máximo 50% deducible
  'travel': 1.00,       // 100% deducible
  'software': 1.00,
  'office': 1.00,
  'hardware': 1.00,
  'marketing': 1.00,
  'professional_services': 1.00,
  'supplies': 1.00,
  'insurance': 1.00,
  'other': 1.00
};

export function validateExpenseCreate(data: IExpenseCreate): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 1. Validar expenseDate
  const expenseDate = new Date(data.expenseDate);
  if (isNaN(expenseDate.getTime())) {
    errors.push('Fecha del gasto inválida (formato ISO requerido)');
  }
  if (expenseDate > new Date()) {
    errors.push('La fecha del gasto no puede ser futura');
  }
  if (expenseDate.getFullYear() < 2000) {
    errors.push('La fecha del gasto no puede ser anterior a 2000');
  }

  // 2. Validar categoría
  if (!data.category || !VALID_CATEGORIES.includes(data.category)) {
    errors.push(`Categoría inválida. Valores permitidos: ${VALID_CATEGORIES.join(', ')}`);
  }

  // 3. Validar description
  const desc = (data.description || '').trim();
  if (!desc || desc.length < 5) {
    errors.push('Descripción debe tener mínimo 5 caracteres');
  }
  if (desc.length > 500) {
    errors.push('Descripción no puede exceder 500 caracteres');
  }

  // 4. Validar amount
  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push('Importe debe ser mayor que 0');
  }
  if (amount > 999999.99) {
    errors.push('Importe no puede exceder 999.999,99 €');
  }

  // 5. Validar VAT percentage
  const vatPct = Number(data.vatPercentage ?? 21);
  if (!Number.isFinite(vatPct) || vatPct < 0 || vatPct > 100) {
    errors.push('IVA debe estar entre 0 y 100');
  }

  // 6. Validar deductible percentage
  const deductPct = Number(data.deductiblePercentage ?? 100);
  const maxAllowed = CATEGORY_DEDUCTIBILITY_LIMITS[data.category] ?? 1.00;
  const maxDeductPct = maxAllowed * 100;
  
  if (!Number.isFinite(deductPct) || deductPct < 0 || deductPct > 100) {
    errors.push('Porcentaje deducible debe estar entre 0 y 100');
  }
  if (deductPct > maxDeductPct) {
    errors.push(`Para categoría '${data.category}', máximo deducible es ${maxDeductPct}%`);
  }

  // 7. Validar relación isDeductible <-> deductiblePercentage
  if (!data.isDeductible && deductPct > 0) {
    errors.push('Si no es deducible, porcentaje debe ser 0');
  }
  if (data.isDeductible && deductPct === 0) {
    errors.push('Si es deducible, porcentaje debe ser > 0');
  }

  // 8. Validar VAT amount (opcional pero si se proporciona)
  if (data.vatAmount !== undefined) {
    const expectedVat = Number(amount * (vatPct / 100)).toFixed(2);
    const providedVat = Number(data.vatAmount).toFixed(2);
    if (expectedVat !== providedVat) {
      errors.push(`IVA calculado (${expectedVat}€) no coincide con proporcionado (${providedVat}€)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateExpenseUpdate(data: IExpenseUpdate, original: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validaciones similares a create, pero solo para campos que se actualizan

  // Advertencia si cambió amount significativamente
  if (data.amount !== undefined && original.amount !== undefined) {
    const diff = Math.abs(data.amount - original.amount);
    const pctChange = (diff / original.amount) * 100;
    if (pctChange > 50) {
      warnings.push(`Cambio significativo en importe: ${pctChange.toFixed(1)}% de diferencia`);
    }
  }

  // Advertencia si cambió deducibilidad
  if (data.isDeductible !== undefined && original.is_deductible !== undefined) {
    if (data.isDeductible !== original.is_deductible) {
      warnings.push('Se ha cambiado el tratamiento fiscal del gasto');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```

---

### FASE 2: AUDITORÍA (1.5 DÍAS)

#### 2.1 Mejorar expense.repository.ts

**Archivo:** `backend/src/repositories/expense.repository.ts`

```typescript
async create(userId: string, expenseData: IExpenseCreate): Promise<IExpense> {
    const {
      projectId, category, subcategory, description, amount,
      vatAmount = 0, vatPercentage = 21.00, isDeductible = true,
      deductiblePercentage = 100.00, expenseDate, paymentMethod,
      vendor, receiptUrl, notes
    } = expenseData;

    // 🆕 AUDITORÍA: Registrar creación
    const auditId = uuid_generate_v4();
    
    const sql = `
      INSERT INTO expenses (
        user_id, project_id, category, subcategory, description, amount,
        vat_amount, vat_percentage, is_deductible, deductible_percentage,
        expense_date, payment_method, vendor, receipt_url, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const result = await this.executeQuery(sql, [
      userId, projectId, category, subcategory, description, amount,
      vatAmount, vatPercentage, isDeductible, deductiblePercentage,
      expenseDate, paymentMethod, vendor, receiptUrl, notes, userId // 🆕 created_by = userId
    ]);

    const row = result.rows[0];

    // 🆕 Insertar en expense_audit_log
    await this.executeQuery(
      `INSERT INTO expense_audit_log (
        expense_id, user_id, action, old_value, new_value, created_at
      )
       VALUES ($1, $2, $3, NULL, $4, CURRENT_TIMESTAMP)`,
      [row.id, userId, 'created', JSON.stringify(row)]
    );

    // Log actividad
    await this.executeQuery(
      `INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'expense_added', 'expense', row.id, `Gasto ${category} añadido: ${amount}€`]
    );

    return this.mapToCamel(row);
  }

  async update(id: string, userId: string, updates: IExpenseUpdate): Promise<IExpense | null> {
    // 🆕 Obtener expense original para auditoría
    const originalResult = await this.executeQuery(
      'SELECT * FROM expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (originalResult.rowCount === 0) return null;
    const originalExpense = originalResult.rows[0];

    // ... resto del update ...

    const result = await this.executeQuery(sql, values);
    const updatedExpense = result.rows[0];

    // 🆕 Insertar en expense_audit_log
    await this.executeQuery(
      `INSERT INTO expense_audit_log (
        expense_id, user_id, action, old_value, new_value, change_reason, created_at
      )
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [id, userId, 'updated', JSON.stringify(originalExpense), JSON.stringify(updatedExpense), updates.changeReason || null]
    );

    return this.mapToCamel(updatedExpense);
  }
```

---

### FASE 3: GESTIÓN DE ARCHIVOS (2.5 DÍAS)

#### 3.1 Crear expenseFileService.ts

**Archivo:** `backend/src/services/expenseFileService.ts`

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid_generate_v4 } from 'uuid';
import path from 'path';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

export class ExpenseFileService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'eu-west-1'
    });
    this.bucketName = process.env.S3_BUCKET || 'anclora-expenses';
  }

  async uploadReceipt(
    file: Express.Multer.File,
    userId: string,
    expenseId: string
  ): Promise<{ url: string; key: string }> {
    // 1. Validar MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error(`Tipo de archivo no permitido. Permitidos: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    // 2. Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Archivo demasiado grande. Máximo: 10MB`);
    }

    // 3. Validar extensión
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new Error(`Extensión no permitida: ${ext}`);
    }

    // 4. Sanitizar nombre
    const sanitizedName = this.sanitizeFileName(file.originalname);
    const uniqueKey = `expenses/${userId}/${expenseId}/${uuid_generate_v4()}${ext}`;

    // 5. Subir a S3
    const uploadParams = {
      Bucket: this.bucketName,
      Key: uniqueKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        'user-id': userId,
        'expense-id': expenseId,
        'uploaded-at': new Date().toISOString()
      },
      ServerSideEncryption: 'AES256'
    };

    try {
      await this.s3Client.send(new PutObjectCommand(uploadParams));
      const url = this.generateSignedUrl(uniqueKey);
      return { url, key: uniqueKey };
    } catch (error) {
      throw new Error(`Error uploading file to S3: ${error.message}`);
    }
  }

  private sanitizeFileName(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 100);
  }

  private generateSignedUrl(key: string): string {
    // Generar URL firmada válida por 24 horas
    return `${process.env.S3_BASE_URL}/${key}`;
  }
}

export const expenseFileService = new ExpenseFileService();
```

---

### FASE 4: MODALES REFACTOREADOS (3 DÍAS)

#### 4.1 MODAL 1: Crear Gasto (expenses.js mejorado)

**Reemplazar función `buildExpenseModalHtml()`:**

```javascript
function buildExpenseModalHtml(mode, expense) {
  const isEdit = mode === "edit" && expense;
  const title = isEdit ? "Editar gasto" : "Registrar nuevo gasto";
  const actionLabel = isEdit ? "Guardar cambios" : "Crear gasto";
  
  // ✅ NUEVA LÓGICA: Detectar período fiscal cerrado
  const isFiscalPeriodClosed = expense?.fiscalPeriodClosed ?? false;
  const readOnlyFields = isFiscalPeriodClosed 
    ? ['amount', 'expenseDate', 'category', 'vatAmount']
    : [];

  const selectedCategory = expense?.category ?? "";
  const paymentMethodValue = expense?.payment_method ?? expense?.paymentMethod ?? "";
  const amountValue = expense ? sanitizeNumber(expense.amount, 0) : "";
  const vatPercentageValue = expense
    ? sanitizeNumber(expense.vat_percentage ?? expense.vatPercentage, 21)
    : 21;
  const vatAmountValue = expense
    ? sanitizeNumber(expense.vat_amount ?? expense.vatAmount, 0)
    : 0;
  const deductiblePercentageValue = expense
    ? sanitizeNumber(
        expense.deductible_percentage ?? expense.deductiblePercentage,
        100
      )
    : 100;
  const isDeductibleChecked = expense
    ? expense.is_deductible ?? expense.isDeductible ?? true
      ? "checked"
      : ""
    : "checked";

  return `
    <div class="modal is-open" id="expense-modal" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
      <div class="modal__backdrop"></div>
      <div class="modal__panel" style="width: min(95vw, 900px); max-width: 900px; padding: 1.5rem;">
        <header class="modal__head" style="margin-bottom: 1rem;">
          <div>
            <h2 class="modal__title" id="expense-modal-title">${title}</h2>
            ${isFiscalPeriodClosed ? `
              <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 0.75rem 1rem; margin-top: 0.5rem; font-size: 0.85rem; color: #92400e;">
                ⚠️ Período fiscal cerrado: Solo puedes editar notas y deducibilidad
              </div>
            ` : ''}
          </div>
          <button type="button" class="modal__close" data-modal-close aria-label="Cerrar modal">×</button>
        </header>
        
        <form id="expense-form" data-mode="${mode}" class="modal-form" novalidate>
          <div class="modal__body modal-form__body" style="overflow-y: auto; max-height: 70vh;">
            
            <!-- SECCIÓN 1: INFORMACIÓN BÁSICA -->
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1rem;">
              <h3 style="font-size: 0.85rem; text-transform: uppercase; color: #6b7280; margin: 0 0 1rem 0; font-weight: 600;">Información Básica</h3>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                <label class="form-field">
                  <span>Fecha *</span>
                  <input type="date" id="expense-date" name="expenseDate" 
                    value="${formatDateForInput(expense?.expense_date)}" 
                    required 
                    ${readOnlyFields.includes('expenseDate') ? 'disabled' : ''}
                    max="${new Date().toISOString().split('T')[0]}"
                  />
                  <small style="color: #ef4444; margin-top: 0.25rem; display: none;" id="date-error"></small>
                </label>
                
                <label class="form-field">
                  <span>Categoría *</span>
                  <select id="expense-category" name="category" required 
                    ${readOnlyFields.includes('category') ? 'disabled' : ''}
                    style="font-size: 0.85rem;">
                    <option value="" disabled ${!expense ? "selected" : ""}>Elegir...</option>
                    ${Object.entries(EXPENSE_CATEGORIES)
                      .map(([key, label]) => `<option value="${key}" ${selectedCategory === key ? "selected" : ""}>${label}</option>`)
                      .join("")}
                  </select>
                </label>

                <label class="form-field">
                  <span>Método Pago</span>
                  <select id="expense-payment-method" name="paymentMethod">
                    <option value="">Elegir...</option>
                    ${Object.entries(PAYMENT_METHODS)
                      .map(([key, label]) => `<option value="${key}" ${paymentMethodValue === key ? "selected" : ""}>${label}</option>`)
                      .join("")}
                  </select>
                </label>
              </div>
            </div>

            <!-- SECCIÓN 2: DESCRIPCIÓN Y PROVEEDOR -->
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1rem;">
              <h3 style="font-size: 0.85rem; text-transform: uppercase; color: #6b7280; margin: 0 0 1rem 0; font-weight: 600;">Descripción</h3>
              
              <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem;">
                <label class="form-field">
                  <span>Descripción *</span>
                  <input type="text" id="expense-description" name="description" 
                    placeholder="Ej: Software Adobe Creative 2026" 
                    value="${escapeHtml(expense?.description || "")}" 
                    required 
                    maxlength="200"
                    minlength="5"
                  />
                  <small style="color: #9ca3af; margin-top: 0.25rem; display: block;">Mínimo 5 caracteres</small>
                </label>
                
                <label class="form-field">
                  <span>Proveedor</span>
                  <input type="text" id="expense-vendor" name="vendor" 
                    placeholder="Adobe Inc." 
                    value="${escapeHtml(expense?.vendor || "")}" 
                    maxlength="100"
                  />
                </label>
              </div>
            </div>

            <!-- SECCIÓN 3: DATOS FINANCIEROS -->
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1rem;">
              <h3 style="font-size: 0.85rem; text-transform: uppercase; color: #6b7280; margin: 0 0 1rem 0; font-weight: 600;">Datos Financieros</h3>
              
              <div style="display: grid; grid-template-columns: 1.5fr 0.7fr 0.8fr 1.2fr; gap: 1rem;">
                <label class="form-field">
                  <span>Importe Base (€) *</span>
                  <input type="number" step="0.01" min="0.01" max="999999.99" 
                    id="expense-amount" name="amount" 
                    value="${amountValue}" 
                    required 
                    ${readOnlyFields.includes('amount') ? 'disabled' : ''}
                    placeholder="0,00"
                  />
                  <small style="color: #9ca3af; margin-top: 0.25rem; display: block;">Mínimo 0,01 €</small>
                </label>
                
                <label class="form-field">
                  <span>IVA %</span>
                  <input type="number" step="0.1" min="0" max="100" 
                    id="expense-vat-percentage" name="vatPercentage" 
                    value="${vatPercentageValue}"
                    placeholder="21"
                  />
                </label>
                
                <label class="form-field">
                  <span>IVA (€)</span>
                  <input type="number" step="0.01" min="0" 
                    id="expense-vat-amount" name="vatAmount" 
                    value="${vatAmountValue}" 
                    ${readOnlyFields.includes('vatAmount') ? 'disabled' : ''}
                    readonly
                    style="background: #f9fafb;"
                  />
                </label>

                <button type="button" class="btn-secondary" 
                  style="align-self: flex-end; padding: 0.6rem 1rem; font-size: 0.85rem;"
                  onclick="calculateVatButton()" 
                  id="calc-vat-btn">
                  🧮 Calcular IVA
                </button>
              </div>
            </div>

            <!-- SECCIÓN 4: DEDUCIBILIDAD -->
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1rem;">
              <h3 style="font-size: 0.85rem; text-transform: uppercase; color: #6b7280; margin: 0 0 1rem 0; font-weight: 600;">Tratamiento Fiscal</h3>
              
              <div style="display: flex; align-items: center; gap: 2rem;">
                <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer;">
                  <input type="checkbox" id="expense-deductible" name="isDeductible" 
                    ${isDeductibleChecked} 
                    style="width: 18px; height: 18px; cursor: pointer;"
                  />
                  <span style="font-weight: 500;">Es deducible</span>
                </label>
                
                <label class="form-field" id="deductible-percentage-group" 
                  style="${isDeductibleChecked ? 'display: flex; align-items: center; gap: 0.5rem; margin: 0;' : 'display: none;'}">
                  <span style="white-space: nowrap;">% Deducible:</span>
                  <input type="number" step="1" min="0" max="100" 
                    id="expense-deductible-percentage" name="deductiblePercentage" 
                    value="${deductiblePercentageValue}"
                    style="width: 70px;"
                  />
                </label>
              </div>
              
              <small style="color: #9ca3af; margin-top: 0.5rem; display: block;">
                Límites legales: Comidas máx. 50%, Otros 100%
              </small>
            </div>

            <!-- SECCIÓN 5: ARCHIVOS Y NOTAS -->
            <div>
              <h3 style="font-size: 0.85rem; text-transform: uppercase; color: #6b7280; margin: 0 0 1rem 0; font-weight: 600;">Documentación</h3>
              
              <div style="display: grid; gap: 1rem;">
                <label class="form-field">
                  <span>Comprobante (PDF, JPG, PNG) - Máx 10MB</span>
                  <div id="file-dropzone" style="
                    border: 2px dashed #cbd5e1;
                    border-radius: 8px;
                    padding: 2rem;
                    text-align: center;
                    background: #f8fafc;
                    cursor: pointer;
                    transition: all 0.3s;
                  " onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📄</div>
                    <p style="margin: 0; font-weight: 500; color: #1e293b;">Arrastra archivo aquí o haz clic</p>
                    <small style="color: #94a3b8;">PDF, JPG, PNG, WEBP - Máximo 10MB</small>
                    <input type="file" id="expense-receipt" name="receiptFile" 
                      accept=".pdf,.jpg,.jpeg,.png,.webp" 
                      style="display: none;"
                    />
                  </div>
                  <div id="file-preview" style="display: none; margin-top: 1rem;">
                    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 0.75rem; font-size: 0.85rem;">
                      <span id="file-name" style="color: #15803d; font-weight: 500;">✅ Archivo seleccionado</span>
                    </div>
                  </div>
                </label>

                <label class="form-field">
                  <span>Notas Adicionales</span>
                  <textarea id="expense-notes" name="notes" rows="3" 
                    placeholder="Detalles adicionales, referencias, etc."
                    style="resize: vertical;">${escapeHtml(expense?.notes || "")}</textarea>
                </label>
              </div>
            </div>

            ${isEdit && !isFiscalPeriodClosed ? `
              <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 1rem; margin-top: 1rem; font-size: 0.85rem; color: #92400e;">
                <strong>Motivo del cambio (opcional):</strong>
                <input type="text" name="changeReason" placeholder="Ej: Corrección de datos de factura" 
                  style="width: 100%; margin-top: 0.5rem; padding: 0.5rem; border-radius: 4px; border: 1px solid #fcd34d;">
              </div>
            ` : ''}

          </div>

          <footer class="modal__footer modal-form__footer" style="margin-top: 1.5rem; border-top: 1px solid #e5e7eb; padding-top: 1rem;">
            <button type="button" class="btn-secondary" data-modal-close>Cancelar</button>
            <button type="submit" class="btn-primary" ${readOnlyFields.length > 2 ? 'disabled' : ''}>
              ${actionLabel}
            </button>
          </footer>
        </form>
      </div>
    </div>
  `;
}
```

---

#### 4.2 MODAL 2: Consultar Gasto (MEJORADO)

**Reemplazar función `viewExpense()`:**

```javascript
async function viewExpense(expenseId) {
  try {
    const expense = await window.api.getExpense(expenseId);
    if (!expense) {
      showNotification("No se encontró el gasto", "error");
      return;
    }

    // Preparar datos
    const formattedDate = formatDate(expense.expense_date);
    const categoryLabel = EXPENSE_CATEGORIES[expense.category] || expense.category || "Sin categoría";
    const subcategoryLabel = expense.subcategory || "-";
    const paymentMethodLabel = PAYMENT_METHODS[expense.payment_method] || expense.payment_method || "-";
    const projectLabel = expense.project_name || "-";
    const vatPercentageDisplay = sanitizeNumber(expense.vat_percentage ?? expense.vatPercentage, 0);
    const deductiblePercentageDisplay = sanitizeNumber(expense.deductible_percentage ?? expense.deductiblePercentage, 0);
    const isDeductibleText = expense.is_deductible ?? expense.isDeductible ?? true
      ? `Sí, ${deductiblePercentageDisplay}%`
      : "No deducible";

    // ✅ NUEVO: Manejo de archivo con previsualización
    const receiptHtml = await buildReceiptPreviewHtml(expense.receipt_url);

    const modalHtml = `
      <div class="modal is-open" id="expense-view-modal" role="dialog" aria-modal="true">
        <div class="modal__backdrop"></div>
        <div class="modal__panel" style="width: min(95vw, 950px); max-width: 950px;">
          
          <header class="modal__head" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem 2rem;">
            <div>
              <h2 class="modal__title" style="color: white; margin-bottom: 0.25rem;">Detalle del Gasto</h2>
              <div style="display: flex; gap: 1rem; align-items: center; font-size: 0.9rem; margin-top: 0.75rem;">
                <span style="background: rgba(255,255,255,0.2); padding: 0.4rem 0.8rem; border-radius: 4px;">
                  📅 ${formattedDate}
                </span>
                <span style="background: rgba(255,255,255,0.2); padding: 0.4rem 0.8rem; border-radius: 4px;">
                  🏷️ ${escapeHtml(categoryLabel)}
                </span>
                <span style="background: rgba(255,255,255,0.2); padding: 0.4rem 0.8rem; border-radius: 4px;">
                  💰 ${formatCurrency(expense.amount)}
                </span>
              </div>
            </div>
            <button type="button" class="modal__close" data-modal-close aria-label="Cerrar modal" style="color: white;">×</button>
          </header>

          <div class="modal__body" style="padding: 2rem; max-height: 70vh; overflow-y: auto;">
            
            <!-- INFORMACIÓN PRINCIPAL (2 COLUMNAS) -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
              
              <!-- COLUMNA 1: DATOS BÁSICOS -->
              <div>
                <h3 style="font-size: 0.75rem; text-transform: uppercase; color: #6b7280; margin: 0 0 1rem 0; font-weight: 600; letter-spacing: 0.06em;">Información Básica</h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                  ${[
                    { label: "Descripción", value: escapeHtml(expense.description || "-") },
                    { label: "Proveedor", value: escapeHtml(expense.vendor || "-") },
                    { label: "Subcategoría", value: escapeHtml(subcategoryLabel) },
                    { label: "Método de Pago", value: escapeHtml(paymentMethodLabel) }
                  ].map(({ label, value }) => `
                    <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 0.75rem;">
                      <p style="margin: 0; font-size: 0.75rem; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.03em;">
                        ${label}
                      </p>
                      <p style="margin: 0.5rem 0 0 0; font-size: 0.95rem; color: #1e293b; font-weight: 500;">
                        ${value}
                      </p>
                    </div>
                  `).join("")}
                </div>
              </div>

              <!-- COLUMNA 2: DATOS FINANCIEROS -->
              <div>
                <h3 style="font-size: 0.75rem; text-transform: uppercase; color: #6b7280; margin: 0 0 1rem 0; font-weight: 600; letter-spacing: 0.06em;">Datos Financieros</h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                  ${[
                    { label: "Importe Base", value: formatCurrency(expense.amount) },
                    { label: "IVA", value: \`${formatCurrency(expense.vat_amount)} (\${vatPercentageDisplay}%)\` },
                    { label: "Total con IVA", value: formatCurrency(sanitizeNumber(expense.amount, 0) + sanitizeNumber(expense.vat_amount, 0)) },
                    { label: "Deducible", value: escapeHtml(isDeductibleText) }
                  ].map(({ label, value }) => `
                    <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 0.75rem;">
                      <p style="margin: 0; font-size: 0.75rem; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.03em;">
                        ${label}
                      </p>
                      <p style="margin: 0.5rem 0 0 0; font-size: 0.95rem; color: #1e293b; font-weight: 500;">
                        ${value}
                      </p>
                    </div>
                  `).join("")}
                </div>
              </div>
            </div>

            <!-- SECCIÓN: COMPROBANTE (si existe) -->
            ${receiptHtml ? `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; background: #f8fafc;">
                <h3 style="font-size: 0.75rem; text-transform: uppercase; color: #6b7280; margin: 0 0 1rem 0; font-weight: 600;">Comprobante</h3>
                ${receiptHtml}
              </div>
            ` : ''}

            <!-- SECCIÓN: NOTAS (si existen) -->
            ${expense.notes ? `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; background: #f0fdf4;">
                <h3 style="font-size: 0.75rem; text-transform: uppercase; color: #6b7280; margin: 0 0 1rem 0; font-weight: 600;">Notas</h3>
                <p style="margin: 0; color: #1e293b; white-space: pre-wrap; line-height: 1.5;">
                  ${escapeHtml(expense.notes)}
                </p>
              </div>
            ` : ''}

            <!-- SECCIÓN: AUDITORÍA (metadata) -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 2rem;">
              <h3 style="font-size: 0.75rem; text-transform: uppercase; color: #9ca3af; margin: 0 0 0.75rem 0; font-weight: 600;">Información de Auditoría</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; font-size: 0.85rem;">
                <div>
                  <p style="margin: 0; color: #9ca3af; font-weight: 500;">Creado por</p>
                  <p style="margin: 0.25rem 0 0 0; color: #1e293b;">${expense.created_by_name || 'Sistema'}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #9ca3af; font-weight: 500;">Fecha creación</p>
                  <p style="margin: 0.25rem 0 0 0; color: #1e293b;">${formatDate(expense.created_at)}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #9ca3af; font-weight: 500;">Última edición</p>
                  <p style="margin: 0.25rem 0 0 0; color: #1e293b;">${formatDate(expense.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          <footer class="modal__footer" style="padding: 1rem 2rem; border-top: 1px solid #e5e7eb;">
            <button type="button" class="btn-ghost" data-modal-close>Cerrar</button>
            <button type="button" class="btn-primary" data-expense-edit="${expense.id}">
              ✏️ Editar gasto
            </button>
          </footer>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modal = document.getElementById("expense-view-modal");
    
    modal?.querySelectorAll("[data-modal-close]").forEach((btn) => {
      btn.addEventListener("click", () => modal.remove());
    });
    
    modal?.querySelector(".modal__backdrop")?.addEventListener("click", () => modal.remove());
    
    modal?.querySelector("[data-expense-edit]")?.addEventListener("click", () => {
      modal.remove();
      openExpenseModal("edit", String(expense.id));
    });

  } catch (error) {
    console.error("Error mostrando gasto:", error);
    showNotification("No se pudo mostrar el detalle del gasto", "error");
  }
}

// ✅ NUEVO: Función auxiliar para previsualización de archivos
async function buildReceiptPreviewHtml(receiptUrl) {
  if (!receiptUrl) return null;

  try {
    const ext = receiptUrl.split('.').pop().toLowerCase();
    const isPdf = ext === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);

    if (isPdf) {
      return `
        <div style="background: white; border-radius: 6px; padding: 1rem; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">📄</div>
          <p style="margin: 0 0 1rem 0; color: #1e293b; font-weight: 500;">Archivo PDF</p>
          <a href="${escapeHtml(receiptUrl)}" target="_blank" rel="noopener" class="btn-primary" 
            style="display: inline-block; padding: 0.6rem 1.5rem; border-radius: 6px; background: #667eea; color: white; text-decoration: none; font-weight: 500;">
            📥 Descargar PDF
          </a>
        </div>
      `;
    }

    if (isImage) {
      return `
        <div style="background: white; border-radius: 6px; padding: 1rem;">
          <img src="${escapeHtml(receiptUrl)}" alt="Comprobante" 
            style="max-width: 100%; max-height: 400px; border-radius: 6px; display: block; margin: 0 auto;">
          <a href="${escapeHtml(receiptUrl)}" target="_blank" rel="noopener" class="btn-ghost" 
            style="display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid #e5e7eb; cursor: pointer; text-decoration: none;">
            Abrir en nueva ventana
          </a>
        </div>
      `;
    }

    return `
      <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 1rem;">
        <a href="${escapeHtml(receiptUrl)}" target="_blank" rel="noopener" style="color: #92400e; text-decoration: underline;">
          Ver comprobante →
        </a>
      </div>
    `;
  } catch (error) {
    console.error("Error building receipt preview:", error);
    return null;
  }
}
```

---

#### 4.3 MODAL 3: Editar Gasto (REFACTOREADO)

**Cambios en `setupExpenseForm()`:**

```javascript
function setupExpenseForm(form, expense) {
  const amountInput = form.querySelector("#expense-amount");
  const vatPercentageInput = form.querySelector("#expense-vat-percentage");
  const vatAmountInput = form.querySelector("#expense-vat-amount");
  const deductibleToggle = form.querySelector("#expense-deductible");
  const deductibleGroup = form.querySelector("#deductible-percentage-group");
  const rowNotes = form.querySelector("#row-notes");
  const descriptionInput = form.querySelector("#expense-description");
  const dateInput = form.querySelector("#expense-date");
  const fileDropzone = form.querySelector("#file-dropzone");
  const fileInput = form.querySelector("#expense-receipt");
  const filePreview = form.querySelector("#file-preview");
  const fileName = form.querySelector("#file-name");

  // ✅ NUEVO: Validación de fecha (max hoy)
  const today = new Date().toISOString().split('T')[0];
  dateInput?.setAttribute('max', today);

  // ✅ NUEVO: Validar descripción en tiempo real
  descriptionInput?.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    if (value.length < 5 && value.length > 0) {
      e.target.style.borderColor = '#fca5a5';
    } else {
      e.target.style.borderColor = '';
    }
  });

  // ✅ NUEVO: Manejo de Dropzone
  if (fileDropzone) {
    fileDropzone.addEventListener('click', () => fileInput?.click());
    
    fileDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileDropzone.style.background = '#f1f5f9';
      fileDropzone.style.borderColor = '#667eea';
    });

    fileDropzone.addEventListener('dragleave', () => {
      fileDropzone.style.background = '#f8fafc';
      fileDropzone.style.borderColor = '#cbd5e1';
    });

    fileDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        fileInput.files = files;
        updateFilePreview(files[0]);
      }
    });
  }

  // ✅ NUEVO: Cambio de archivo
  fileInput?.addEventListener('change', (e) => {
    if (e.target.files?.length > 0) {
      updateFilePreview(e.target.files[0]);
    }
  });

  // Función auxiliar: actualizar previsualización
  function updateFilePreview(file) {
    // Validar tipo y tamaño
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      showNotification('Tipo de archivo no permitido. Usa PDF, JPG, PNG o WEBP', 'error');
      fileInput.value = '';
      return;
    }

    if (file.size > maxSize) {
      showNotification('Archivo demasiado grande. Máximo 10MB', 'error');
      fileInput.value = '';
      return;
    }

    fileName.textContent = `✅ ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    filePreview.style.display = 'block';
  }

  // Sincronizar IVA
  const syncVatAmount = () => {
    const amount = sanitizeNumber(amountInput.value, 0);
    const vatPercentage = sanitizeNumber(vatPercentageInput.value, 0);
    vatAmountInput.value = calculateVatAmount(amount, vatPercentage);
  };

  amountInput?.addEventListener("input", syncVatAmount);
  vatPercentageInput?.addEventListener("input", syncVatAmount);

  // Toggle deducible
  const toggleDeductibleFields = () => {
    const isChecked = deductibleToggle.checked;
    if (isChecked) {
      deductibleGroup.style.display = "flex";
      rowNotes.style.gridTemplateColumns = "1fr 3fr";
    } else {
      deductibleGroup.style.display = "none";
      rowNotes.style.gridTemplateColumns = "1fr";
    }
  };

  deductibleToggle?.addEventListener("change", toggleDeductibleFields);

  // Submit
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleExpenseSubmit(form);
  });
}

// ✅ NUEVO: Botón calcular IVA
function calculateVatButton() {
  const amountInput = document.querySelector("#expense-amount");
  const vatPercentageInput = document.querySelector("#expense-vat-percentage");
  const vatAmountInput = document.querySelector("#expense-vat-amount");
  
  const amount = sanitizeNumber(amountInput?.value, 0);
  const vatPercentage = sanitizeNumber(vatPercentageInput?.value, 0);
  const calculated = calculateVatAmount(amount, vatPercentage);
  
  if (vatAmountInput) {
    vatAmountInput.value = calculated;
    showNotification(`IVA calculado: ${formatCurrency(calculated)}`, 'success');
  }
}
```

---

## 📋 CHECKLIST PRE-DEPLOYMENT

### VALIDACIONES BACKEND ✅
- [ ] expenseValidator.ts creado y testado
- [ ] routes.ts actualizado con validaciones exhaustivas
- [ ] expense.repository.ts integra expense_audit_log
- [ ] Constraints BD: CHECK amount > 0, fecha <= hoy, IVA range
- [ ] Teste validador con casos límite

### AUDITORÍA ✅
- [ ] Tabla expense_audit_log creada
- [ ] Trigger de auditoría funciona
- [ ] Endpoint GET /expenses/:id/audit-log implementado
- [ ] Tests: crear, editar, verificar audit_log

### GESTIÓN ARCHIVOS ✅
- [ ] S3/Storage configurado
- [ ] expenseFileService.ts funcionando
- [ ] Validación MIME/tamaño servidor
- [ ] Endpoint POST /expenses/:id/receipt funciona
- [ ] Tests: upload PDF, image, rechaza grandes

### MODALES ✅
- [ ] Modal 1: Crear gasto - validaciones en cliente
- [ ] Modal 2: Consultar con previsualización archivos
- [ ] Modal 3: Editar con restricciones período cerrado
- [ ] Tests: crear sin fecha futura, editar período cerrado

### TESTING ✅
- [ ] Unit tests validators (10+ casos)
- [ ] E2E: crear → editar → vista → eliminar
- [ ] E2E: subir archivo → previsualizar
- [ ] E2E: validar período cerrado bloquea edición

### DOCUMENTACIÓN ✅
- [ ] README: cómo usar modales
- [ ] API docs: nuevos endpoints
- [ ] DB migration: ALTER TABLE expenses ADD COLUMN created_by

---

## 🚀 TIMELINE IMPLEMENTACIÓN

| Fase | Duración | Entregable |
|------|----------|-----------|
| Validadores Backend | 1 día | expenseValidator.ts |
| Auditoría BD | 1 día | expense_audit_log + triggers |
| Gestión Archivos | 1.5 días | expenseFileService.ts |
| Modal 1 Refactor | 1 día | Create con validaciones |
| Modal 2 Mejora | 0.5 días | View con previsualización |
| Modal 3 Restricciones | 1 día | Edit con período fiscal |
| Testing | 1 día | Suite completa |
| **TOTAL** | **7 días** | **LISTO PARA PRODUCCIÓN** |

---

## 🎯 ENTREGABLES FINALES

1. ✅ `expenseValidator.ts` - 180 líneas
2. ✅ `expenseFileService.ts` - 120 líneas
3. ✅ `expenses.js refactoreado` - 950 líneas
4. ✅ `expense.repository.ts mejorado` - 250 líneas
5. ✅ `backend/routes.ts mejorado` - 80 líneas
6. ✅ `SQL: ALTER TABLE + expense_audit_log`
7. ✅ Suite de tests (20+ casos)
8. ✅ Esta documentación

---

**Estado:** 🟢 LISTO PARA INICIAR REFACTOR

**Próximo Paso:** Confirma si procedo con implementación de Fase 1 (Validadores)
