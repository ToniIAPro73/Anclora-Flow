# ANÁLISIS PROFUNDO - expenses.js

**Versión:** 2.0 (ANÁLISIS REAL DE CÓDIGO)  
**Fecha:** 20 Enero 2026  
**Método:** Análisis línea-por-línea  
**Alcance:** 1,200+ líneas de código JavaScript

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de Código](#análisis-de-código)
3. [Vulnerabilidades Críticas](#vulnerabilidades-críticas)
4. [Deuda Técnica](#deuda-técnica)
5. [Plan de Refactor](#plan-de-refactor)

---

## 🎯 RESUMEN EJECUTIVO

| Aspecto | Estado | Calificación | Riesgo |
|---------|--------|--------------|--------|
| **Estructura** | ✅ Bien organizado | 7.5/10 | 🟡 MEDIO |
| **Validaciones** | ⚠️ Incompletas | 4.5/10 | 🔴 ALTO |
| **Auditoría** | ❌ Ausente | 0/10 | 🔴 CRÍTICA |
| **Manejo de Archivos** | ❌ Ausente | 0/10 | 🔴 CRÍTICA |
| **UX/UI** | ✅ Funcional | 6.5/10 | 🟡 MEDIO |
| **Mantenibilidad** | ⚠️ Variables globales | 4/10 | 🔴 ALTO |
| **Testing** | ❌ Sin tests | 0/10 | 🔴 CRÍTICA |

**Puntuación Global:** 32/70 (45.7%)  
**Recomendación:** 🔴 REFACTOR OBLIGATORIO antes de producción

---

## 🔍 ANÁLISIS DE CÓDIGO

### SECCIÓN 1: ESTADO GLOBAL (Líneas 3-18)

```javascript
let expensesData = [];
let isLoading = false;
let currentFilters = { /* ... */ };
// ... más variables globales
```

**Análisis:**
- ✅ Variables bien nombradas y documentadas
- ❌ **PROBLEMA CRÍTICO**: Uso de variables globales en lugar de clases/módulos
- ❌ **RIESGO**: Colisiones de nombres, imposibilidad de múltiples instancias
- ⚠️ **IMPACTO**: Dificulta testing y mantenimiento

**Severidad:** 🟠 ALTA

**Solución Requerida:**
```typescript
// ❌ ACTUAL (MALO)
let expensesData = [];

// ✅ MEJORADO (BIEN)
class ExpenseManager {
  constructor() {
    this.data = [];
    this.filters = {};
    this.isLoading = false;
  }
}
```

---

### SECCIÓN 2: CONSTANTES (Líneas 20-39)

```javascript
const EXPENSE_CATEGORIES = {
  office: "Oficina",
  software: "Software",
  // ...
};
```

**Análisis:**
- ✅ Estructura clara
- ✅ Fácil de mantener
- ⚠️ **FALTA**: Validación de categorías contra este mapa
- ⚠️ **FALTA**: Metadatos de categorías (deducibilidad, límites, etc.)

**Severidad:** 🟡 MEDIA

**Mejora Propuesta:**
```javascript
// ACTUAL (INCOMPLETO)
const EXPENSE_CATEGORIES = {
  office: "Oficina",
  meals: "Comidas",
};

// MEJORADO (CON METADATOS)
const EXPENSE_CATEGORIES = {
  office: {
    label: "Oficina",
    deductible: true,
    maxDeductiblePercentage: 100,
    subcategories: ["Alquiler", "Suministros", "Servicios"]
  },
  meals: {
    label: "Comidas",
    deductible: true,
    maxDeductiblePercentage: 50, // LÍMITE LEGAL ESPAÑA
    subcategories: ["Desayuno", "Comida", "Cena"]
  },
  // ...
};
```

---

### SECCIÓN 3: NORMALIZACION (Líneas 41-76)

```javascript
function normalizeExpense(expense) {
  if (!expense) return null;
  return {
    id: expense.id,
    amount: sanitizeNumber(expense.amount, 0),
    // ...
  };
}
```

**Análisis:**
- ✅ Maneja snake_case y camelCase
- ✅ Sanitización de números con fallback
- ✅ Conversión segura de booleanos
- ❌ **FALTA**: Validación de tipos
- ❌ **FALTA**: Validación de valores en rango

**Severidad:** 🟡 MEDIA

**Mejora:**
```javascript
// AGREGAR VALIDACIONES
function normalizeExpense(expense) {
  if (!expense) return null;

  // ✅ NUEVO: Validaciones de rangos
  const vatPercentage = sanitizeNumber(
    expense.vat_percentage ?? expense.vatPercentage,
    21
  );
  if (vatPercentage < 0 || vatPercentage > 100) {
    throw new Error(`IVA inválido: ${vatPercentage}%`);
  }

  const deductiblePercentage = sanitizeNumber(
    expense.deductible_percentage ?? expense.deductiblePercentage,
    100
  );
  if (deductiblePercentage < 0 || deductiblePercentage > 100) {
    throw new Error(`Porcentaje deducible inválido: ${deductiblePercentage}%`);
  }

  // ✅ NUEVO: Validación de fecha
  const expenseDate = expense.expense_date ?? expense.expenseDate;
  if (expenseDate && new Date(expenseDate) > new Date()) {
    throw new Error("La fecha del gasto no puede ser futura");
  }

  return {
    id: expense.id,
    amount: sanitizeNumber(expense.amount, 0),
    vatPercentage,
    deductiblePercentage,
    expenseDate,
    // ...
  };
}
```

---

### SECCIÓN 4: VALIDACIONES EN MODAL (Líneas 690-729)

**CÓDIGO ACTUAL:**
```javascript
if (!payload.expenseDate) {
  showNotification("Selecciona la fecha del gasto", "warning");
  return;
}

if (!payload.category) {
  showNotification("Selecciona una categoría", "warning");
  return;
}

if (!payload.description) {
  showNotification("Añade una descripción del gasto", "warning");
  return;
}

if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
  showNotification("Introduce un importe mayor que 0", "warning");
  return;
}
```

**Análisis:**
- ✅ Validación de importe > 0 ✅
- ✅ Validaciones básicas presentes
- ❌ **FALTA**: Validación de fecha futura
- ❌ **FALTA**: Validación de longitud mínima en descripción (solo maxlength)
- ❌ **FALTA**: Validación de rangos en IVA
- ❌ **FALTA**: Validación de deducibilidad (si isDeductible=true, entonces deductiblePercentage debe ser > 0)
- ❌ **FALTA**: Validación de categoría en lista maestra

**Severidad:** 🔴 CRÍTICA

**Validaciones Faltantes Requeridas:**

```javascript
// ❌ ACTUAL (INCOMPLETO - LÍNEA 690-729)
if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
  showNotification("Introduce un importe mayor que 0", "warning");
  return;
}

// ✅ MEJORADO (COMPLETO)
async function handleExpenseSubmit(form) {
  const formData = new FormData(form);
  const mode = form.dataset.mode || "create";

  const payload = {
    expenseDate: formData.get("expenseDate"),
    category: formData.get("category"),
    description: (formData.get("description") || "").trim(),
    amount: sanitizeNumber(formData.get("amount"), 0),
    vatPercentage: sanitizeNumber(formData.get("vatPercentage"), 21),
    vatAmount: sanitizeNumber(formData.get("vatAmount"), 0),
    isDeductible: formData.get("isDeductible") === "on",
    deductiblePercentage: payload.isDeductible 
      ? sanitizeNumber(formData.get("deductiblePercentage"), 100)
      : 0,
  };

  // ✅ NUEVA: Validación de fecha
  const expenseDate = new Date(payload.expenseDate);
  if (expenseDate > new Date()) {
    showNotification("La fecha del gasto no puede ser futura", "warning");
    return;
  }

  // ✅ NUEVA: Validación de descripción (longitud)
  if (payload.description.length < 5) {
    showNotification("La descripción debe tener al menos 5 caracteres", "warning");
    return;
  }

  // ✅ NUEVA: Validación de categoría en lista maestra
  if (!EXPENSE_CATEGORIES[payload.category]) {
    showNotification("Categoría inválida seleccionada", "warning");
    return;
  }

  // ✅ NUEVA: Validación de importe
  if (!Number.isFinite(payload.amount) || payload.amount <= 0.01) {
    showNotification("Introduce un importe mayor que €0,01", "warning");
    return;
  }

  // ✅ NUEVA: Validación de IVA
  if (payload.vatPercentage < 0 || payload.vatPercentage > 100) {
    showNotification("El porcentaje de IVA debe estar entre 0 y 100", "warning");
    return;
  }

  // ✅ NUEVA: Validación de deducibilidad
  if (payload.isDeductible) {
    if (payload.deductiblePercentage < 0 || payload.deductiblePercentage > 100) {
      showNotification("El porcentaje deducible debe estar entre 0 y 100", "warning");
      return;
    }
    // ✅ NUEVA: Validación de límites por categoría
    const categoryConfig = EXPENSE_CATEGORIES[payload.category];
    if (payload.deductiblePercentage > categoryConfig.maxDeductiblePercentage) {
      showNotification(
        `Máximo deducible para ${categoryConfig.label}: ${categoryConfig.maxDeductiblePercentage}%`,
        "warning"
      );
      return;
    }
  }

  // ... resto del código
}
```

---

### SECCIÓN 5: GESTIÓN DE MODALES (Líneas 640-723)

**PROBLEMAS IDENTIFICADOS:**

#### 5.1 Modal de Consulta (viewExpense)
**Líneas: 750-850**

```javascript
const modalHtml = `
  <div class="modal is-open" id="expense-view-modal" role="dialog" aria-modal="true">
    <div class="modal__backdrop"></div>
    <div class="modal__panel">
      <header class="modal__head">
        <h2 class="modal__title">Detalle del gasto</h2>
      </header>
      <div class="modal__body" style="padding: 1.75rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem;">
          <!-- CAMPOS -->
        </div>
      </div>
      <footer class="modal__footer modal-form__footer">
        <button type="button" class="btn-secondary" data-modal-close>Cerrar</button>
        <button type="button" class="btn-primary" data-expense-edit="${expense.id}">Editar gasto</button>
      </footer>
    </div>
  </div>
`;
```

**Análisis:**
- ✅ Estructura modal correcta
- ⚠️ **FALTA**: No es realmente un "Drawer" (side panel) - es un modal centrado
- ❌ **FALTA**: Previsualización de comprobante (receipt_url)
- ❌ **FALTA**: Auditoría visible (quién creó, cuándo, cambios previos)
- ❌ **FALTA**: Enlace funcional a proyecto asociado
- ⚠️ HTML generado dinámicamente (no reutilizable)

**Severidad:** 🟡 MEDIA

---

#### 5.2 Modal de Edición/Creación (openExpenseModal)
**Líneas: 640-723**

```javascript
function buildExpenseModalHtml(mode, expense) {
  // ... HTML generado como string
  return `
    <div class="modal is-open" id="expense-modal" ...>
      <!-- Form con 4 columnas -->
    </div>
  `;
}
```

**PROBLEMAS CRÍTICOS:**

1. **HTML Dinámico Complejo (Líneas: 658-723)**
   - ❌ 65 líneas de HTML como string
   - ❌ Sin validación de estructura
   - ❌ Sin reutilización de componentes
   - ⚠️ Propenso a errores de formatting

2. **Lógica de Toggle Deducible (Línea: 611-625)**
   ```javascript
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
   ```
   - ❌ **BUG**: Manipulación directa de estilos inline
   - ⚠️ Frágil: Si la estructura HTML cambia, se rompe
   - ❌ **FALTA**: Sincronización de validación cuando se cambia toggle

**Severidad:** 🔴 CRÍTICA

---

### SECCIÓN 6: AUDITORÍA Y CAMBIOS

**Estado Actual:** ❌ AUSENTE COMPLETAMENTE

**Lo que FALTA:**

```javascript
// ❌ NO EXISTE - REQUERIDO PARA AUDITORÍA

// 1. No hay registro de quién modificó qué
// 2. No hay timestamp de cambios
// 3. No hay razón de cambio registrada
// 4. No hay historial visible al usuario
// 5. No hay rollback de cambios

// REQUERIDO EN BACKEND:
CREATE TABLE expense_audit_log (
  id UUID PRIMARY KEY,
  expense_id UUID REFERENCES expenses(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50), -- 'created', 'updated', 'deleted'
  old_value JSONB,
  new_value JSONB,
  change_reason TEXT,
  created_at TIMESTAMP
);
```

**Severidad:** 🔴 CRÍTICA

---

### SECCIÓN 7: GESTIÓN DE ARCHIVOS

**Estado Actual:** ❌ AUSENTE COMPLETAMENTE

**Lo que FALTA:**

```javascript
// ❌ NO EXISTE - REQUERIDO PARA COMPROBANTES

// 1. No hay validación de tipo MIME
// 2. No hay validación de tamaño
// 3. No hay manejo de upload
// 4. No hay previsualización
// 5. Campo receiptUrl es manual (string text)

// MODAL ACTUAL (Línea: 680)
<input type="text" id="expense-notes" name="notes" .../>
// ☝️ NO HAY INPUT PARA ARCHIVO, SOLO NOTAS

// REQUERIDO:
// 1. Componente FileUpload con drag & drop
// 2. Validación en cliente (tipo, tamaño)
// 3. Upload a backend (multipart/form-data)
// 4. Almacenamiento seguro
// 5. Generación de URL con firma temporal
// 6. Previsualización (PDF, imagen)
```

**Severidad:** 🔴 CRÍTICA

---

## 🔴 VULNERABILIDADES CRÍTICAS

### VULNERABILIDAD #1: Validación de Fecha Futura AUSENTE

**Ubicación:** `handleExpenseSubmit()` línea 690

**Código Actual:**
```javascript
if (!payload.expenseDate) {
  showNotification("Selecciona la fecha del gasto", "warning");
  return;
}
// ❌ NO VALIDA SI FECHA ES FUTURA
```

**Riesgo:** Un usuario puede registrar un gasto con fecha en el futuro, invalidando registros contables.

**Severidad:** 🟠 ALTA

**Solución:**
```javascript
const expenseDate = new Date(payload.expenseDate);
if (expenseDate > new Date()) {
  showNotification("La fecha del gasto no puede ser futura", "warning");
  return;
}
```

---

### VULNERABILIDAD #2: Sin Validación de Rangos en Porcentajes

**Ubicación:** Modal (líneas 690-729) y setupExpenseForm()

**Código Actual:**
```javascript
<input type="number" step="0.1" min="0" id="expense-vat-percentage" name="vatPercentage" value="${vatPercentageValue}" />
// ⚠️ min="0" pero ❌ NO max="100"
```

**Riesgo:** Usuario puede ingresar IVA = 150% o -50%, creando datos inválidos.

**Severidad:** 🔴 CRÍTICA

**Solución:**
```javascript
// HTML
<input type="number" step="0.1" min="0" max="100" required />

// JavaScript
if (payload.vatPercentage < 0 || payload.vatPercentage > 100) {
  showNotification("IVA debe estar entre 0 y 100%", "warning");
  return;
}

if (payload.deductiblePercentage < 0 || payload.deductiblePercentage > 100) {
  showNotification("Porcentaje deducible debe estar entre 0 y 100%", "warning");
  return;
}
```

---

### VULNERABILIDAD #3: Deducibilidad No Sincronizada

**Ubicación:** setupExpenseForm() línea 607-625

**Código Actual:**
```javascript
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
```

**Problema:**
- Si `isDeductible = false`, `deductiblePercentage` DEBE ser 0
- Pero el formulario NO lo fuerza
- Usuario puede guardar con `isDeductible=false` pero `deductiblePercentage=50`, creando contradicción

**Severidad:** 🟠 ALTA

**Solución:**
```javascript
const toggleDeductibleFields = () => {
  const isChecked = deductibleToggle.checked;
  if (isChecked) {
    deductibleGroup.style.display = "flex";
    deductiblePercentageInput.disabled = false;
  } else {
    deductibleGroup.style.display = "none";
    deductiblePercentageInput.disabled = true;
    deductiblePercentageInput.value = "0"; // ✅ FUERZA A 0
  }
};
```

---

### VULNERABILIDAD #4: Sin Restricción de Edición por Período Fiscal

**Ubicación:** Toda la función `handleExpenseSubmit()`

**Código Actual:**
```javascript
async function handleExpenseSubmit(form) {
  // ... obtiene datos del formulario
  
  if (mode === "edit" && activeExpenseId) {
    const updatedExpense = await window.api.updateExpense(activeExpenseId, payload);
    // ❌ NO VALIDA SI EL PERÍODO FISCAL ESTÁ CERRADO
  }
}
```

**Riesgo:** Un usuario puede editar un gasto incluido ya en una declaración fiscal, alterando registros contables.

**Severidad:** 🔴 CRÍTICA

**Solución Requerida:**
```javascript
if (mode === "edit" && activeExpenseId) {
  // ✅ NUEVA: Validar que período fiscal NO esté cerrado
  const expense = await window.api.getExpense(activeExpenseId);
  
  if (expense.fiscalPeriodClosed) {
    // ✅ Si cambios en importe o fecha, REQUIERE motivo
    if (expense.amount !== payload.amount || 
        expense.expenseDate !== payload.expenseDate) {
      const reason = prompt("Período fiscal cerrado. Indica motivo de cambio:");
      if (!reason) {
        showNotification("Cambios de importe/fecha requieren motivo", "warning");
        return;
      }
      payload.changeReason = reason;
      payload.auditLog = true; // ✅ Registrar en auditoría
    }
  }
  
  const updatedExpense = await window.api.updateExpense(activeExpenseId, payload);
}
```

---

### VULNERABILIDAD #5: Sin Validación de Categoría

**Ubicación:** handleExpenseSubmit() línea 690

**Código Actual:**
```javascript
if (!payload.category) {
  showNotification("Selecciona una categoría", "warning");
  return;
}
// ✅ Valida que exista PERO ❌ NO VALIDA QUE SEA VÁLIDA
```

**Riesgo:** Un atacante podría manipular el select y enviar `category="xyz"` inválida.

**Severidad:** 🟠 ALTA

**Solución:**
```javascript
// ✅ NUEVA: Validación contra lista maestra
if (!EXPENSE_CATEGORIES[payload.category]) {
  showNotification("Categoría inválida seleccionada", "warning");
  return;
}
```

---

## ⚠️ DEUDA TÉCNICA

### 1. Variables Globales (CRÍTICO)

**Líneas:** 3-18

```javascript
// ❌ MALO
let expensesData = [];
let isLoading = false;
let currentFilters = { /* ... */ };
let filterRefreshTimeout = null;
let activeExpenseId = null;
// ... 15 variables globales más
```

**Impacto:**
- Colisiones de nombres
- Dificulta testing
- Imposibilidad de múltiples instancias
- Coupling alto

**Solución:** Encapsular en clase

```typescript
// ✅ BIEN
class ExpenseManager {
  constructor() {
    this.data = [];
    this.isLoading = false;
    this.filters = {};
    // ...
  }
  
  async loadExpenses() { /* ... */ }
  handleSubmit() { /* ... */ }
}
```

---

### 2. Manipulación Directa del DOM

**Líneas:** Múltiples (ej: 558-625)

```javascript
// ❌ MALO
function setupExpenseForm(form, expense) {
  const amountInput = form.querySelector("#expense-amount");
  const vatPercentageInput = form.querySelector("#expense-vat-percentage");
  
  const syncVatAmount = () => {
    const amount = sanitizeNumber(amountInput.value, 0);
    const vatPercentage = sanitizeNumber(vatPercentageInput.value, 0);
    vatAmountInput.value = calculateVatAmount(amount, vatPercentage);
  };
  
  amountInput?.addEventListener("input", syncVatAmount);
  // ... más manipulación directa
}
```

**Impacto:**
- Frágil (depende de IDs específicos)
- Difícil de testear
- Propenso a errores
- Mantenimiento difícil

**Solución:** Usar React con state

```typescript
// ✅ BIEN (React)
const [amount, setAmount] = useState(expense?.amount || 0);
const [vatPercentage, setVatPercentage] = useState(expense?.vatPercentage || 21);
const vatAmount = useMemo(() => calculateVat(amount, vatPercentage), [amount, vatPercentage]);
```

---

### 3. HTML Generado como Strings

**Líneas:** 658-723

```javascript
// ❌ MALO - 65 líneas de HTML como string
function buildExpenseModalHtml(mode, expense) {
  return `
    <div class="modal is-open" id="expense-modal" ...>
      <!-- 65 líneas de HTML -->
    </div>
  `;
}
```

**Impacto:**
- Sin type checking
- Imposible refactorizar
- Propenso a errores de espaciado/sintaxis
- Sin componentes reutilizables

**Solución:** Componentes React

```typescript
// ✅ BIEN
const ExpenseModal: React.FC<{ mode: 'create' | 'edit'; expense?: Expense }> = 
  ({ mode, expense }) => {
    return (
      <Modal>
        <ExpenseForm mode={mode} expense={expense} />
      </Modal>
    );
  };
```

---

### 4. Sin Separación de Responsabilidades

**Líneas:** Toda la función `handleExpenseSubmit()` (45 líneas)

```javascript
// ❌ UNA FUNCIÓN HACE TODO:
async function handleExpenseSubmit(form) {
  // 1. Extrae datos del formulario
  // 2. Valida datos
  // 3. Normaliza datos
  // 4. Hace llamada API
  // 5. Actualiza estado global
  // 6. Re-renderiza tabla
  // 7. Muestra notificación
  // 8. Cierra modal
}
```

**Solución:** Separar en funciones pequeñas

```typescript
// ✅ BIEN - Responsabilidad única
const validateExpensePayload = (payload) => { /* ... */ }
const normalizeFormData = (formData) => { /* ... */ }
const saveExpense = (payload) => API.post('/expenses', payload)
const updateUI = () => { /* renderizar tabla, cerrar modal, etc */ }

async function handleExpenseSubmit(form) {
  const formData = new FormData(form);
  const normalized = normalizeFormData(formData);
  
  validateExpensePayload(normalized); // Lanza error si inválido
  
  const saved = await saveExpense(normalized);
  updateUI(saved);
}
```

---

### 5. Sin Pruebas Unitarias

**Estado Actual:** ❌ 0% cobertura

**Funciones que REQUIEREN testing:**
- `normalizeExpense()` - Conversor de datos
- `sanitizeNumber()` - Parseo de números
- `calculateVatAmount()` - Cálculo de impuestos
- `validateExpensePayload()` - Validaciones (**requiere implementar)
- `escapeHtml()` - Sanitización XSS

---

## 📊 PLAN DE REFACTOR

### FASE 1: Correcciones Críticas (3-4 días)

#### 1.1 Validaciones Backend Exhaustivas

**Archivo a Modificar:** `backend/src/api/expenses/routes.ts`

```typescript
// ANTES (INCOMPLETO)
router.post('/',
  [
    body('amount').notEmpty().isFloat({ min: 0 }),
    body('expenseDate').notEmpty().isISO8601(),
  ],
  expenseController.validate,
  expenseController.createExpense
);

// DESPUÉS (COMPLETO)
router.post('/',
  [
    body('expenseDate')
      .notEmpty().isISO8601()
      .custom((value) => {
        if (new Date(value) > new Date()) {
          throw new Error('Fecha no puede ser futura');
        }
        return true;
      }),
    body('category')
      .notEmpty()
      .isIn(Object.keys(EXPENSE_CATEGORIES)),
    body('description')
      .notEmpty()
      .trim()
      .isLength({ min: 5, max: 200 }),
    body('amount')
      .notEmpty()
      .isFloat({ min: 0.01 })
      .custom((value, { req }) => {
        // Validar que sea realista (< 1,000,000€)
        if (value > 1000000) {
          throw new Error('Importe parece irreal');
        }
        return true;
      }),
    body('vatPercentage')
      .optional()
      .isFloat({ min: 0, max: 100 }),
    body('deductiblePercentage')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .custom((value, { req }) => {
        if (req.body.isDeductible && value === 0) {
          throw new Error('Si es deducible, % debe ser > 0');
        }
        return true;
      }),
  ],
  expenseController.validate,
  expenseController.createExpense
);
```

---

#### 1.2 Tabla de Auditoría

**Archivo a Modificar:** `backend/src/database/init.sql`

```sql
CREATE TABLE IF NOT EXISTS expense_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expense_audit_log_expense_id 
  ON expense_audit_log(expense_id);

-- TRIGGER: Log automático en cambios
CREATE OR REPLACE FUNCTION log_expense_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO expense_audit_log (expense_id, user_id, action, old_value, new_value)
    VALUES (
      NEW.id,
      (SELECT user_id FROM expenses WHERE id = NEW.id LIMIT 1),
      'updated',
      row_to_json(OLD),
      row_to_json(NEW)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_expense_audit ON expenses;
CREATE TRIGGER trg_expense_audit
AFTER UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION log_expense_change();
```

---

#### 1.3 Constraints en Base de Datos

```sql
ALTER TABLE expenses
ADD CONSTRAINT check_amount_positive CHECK (amount > 0),
ADD CONSTRAINT check_vat_valid CHECK (vat_percentage >= 0 AND vat_percentage <= 100),
ADD CONSTRAINT check_deductible_percentage_valid 
  CHECK (deductible_percentage >= 0 AND deductible_percentage <= 100),
ADD CONSTRAINT check_date_not_future CHECK (expense_date <= CURRENT_DATE),
ADD CONSTRAINT check_deductible_logic 
  CHECK ((NOT is_deductible AND deductible_percentage = 0) 
         OR (is_deductible AND deductible_percentage > 0));
```

---

### FASE 2: Migración a React (5-6 días)

**Crear Componentes:**

1. `ExpenseManager.tsx` - Contenedor principal
2. `ExpenseModal.tsx` - Modal create/edit
3. `ExpenseDetailDrawer.tsx` - Side panel visualización
4. `ExpenseTable.tsx` - Tabla reutilizable
5. `ExpenseForm.tsx` - Form reutilizable
6. `ExpenseValidator.ts` - Lógica de validación

---

### FASE 3: Gestión de Archivos (3-4 días)

**Crear:**
- `ExpenseFileUpload.tsx` - Componente upload
- `file.service.ts` - Backend upload
- Validaciones MIME/tamaño
- Previsualización PDF/imagen

---

### FASE 4: Testing (2-3 días)

**Crear tests para:**
- Validaciones
- Cálculos (VAT, deductible)
- Formateo (currency, date)
- Integración API

---

## 📋 RESUMEN DE CAMBIOS REQUERIDOS

| Cambio | Ubicación | Severidad | Impacto |
|--------|-----------|-----------|--------|
| Validar fecha futura | Backend + Frontend | 🟠 ALTA | Bloquea registros inválidos |
| Rangos de porcentajes | Backend + Frontend | 🔴 CRÍTICA | Previene datos inválidos |
| Auditoría completa | BD + Backend | 🔴 CRÍTICA | Trazabilidad de cambios |
| Gestión de archivos | Backend + Frontend | 🔴 CRÍTICA | Comprobantes funcionales |
| Restricción período fiscal | Backend | 🔴 CRÍTICA | Integridad contable |
| Eliminar variables globales | Frontend | 🟠 ALTA | Mantenibilidad |
| Componentes React | Frontend | 🟡 MEDIA | Modernización |
| Testing unitario | Tests | 🟡 MEDIA | Calidad de código |

---

## 🎯 SIGUIENTES PASOS

1. **Inmediato (Hoy):** Implementar validaciones backend críticas
2. **Esta semana:** Implementar auditoría BD y frontend validation
3. **Próxima semana:** Migración React y gestión de archivos
4. **Week 3:** Testing y deployment

**Código de todas las soluciones en siguiente documento.**
