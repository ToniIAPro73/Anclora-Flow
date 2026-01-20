# ANÁLISIS REAL: Validaciones Módulo Ingresos & Facturas - Anclora Flow

**Versión:** 3.0 (ANÁLISIS REAL DE CÓDIGO)  
**Fecha:** 19 Enero 2026  
**Método:** Análisis directo de código fuente del repositorio  
**Base de Análisis:**
- ✅ backend/src/database/init.sql (esquema BD)
- ✅ backend/src/api/invoices/controller.ts (lógica backend)
- ✅ backend/src/models/Invoice.ts (modelo)
- ✅ backend/src/types/invoice.ts (tipos TypeScript)
- ✅ frontend/src/pages/Invoices/Invoices.tsx (UI actual)

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de Base de Datos](#análisis-de-base-de-datos)
3. [Análisis de Backend](#análisis-de-backend)
4. [Análisis de Frontend](#análisis-de-frontend)
5. [Problemas Críticos](#problemas-críticos)
6. [Plan de Acción](#plan-de-acción)

---

## 🎯 RESUMEN EJECUTIVO

### Estado Actual: 🔴 CRÍTICO

| Componente | Estado | Validaciones | Auditoría | Pagos Parciales | Riesgo |
|-----------|--------|--------------|-----------|-----------------|--------|
| **BD** | ⚠️ Incompleta | 10% | ❌ No | ❌ No | 🔴 CRÍTICO |
| **Backend** | 🔴 Muy Básico | 5% | ❌ No | ❌ No | 🔴 CRÍTICO |
| **Frontend** | 🔴 Muy Básico | 0% | ❌ No | ❌ No | 🔴 CRÍTICO |

### Riesgo Inmediato
```
❌ Usuario puede crear facturas sin validación
❌ Números de factura duplicados no se detectan (confían en BD UNIQUE)
❌ No hay auditoría: imposible investigar cambios
❌ No hay gestión de pagos parciales
❌ No se valida nada en frontend (usuario puede enviar datos basura)
❌ Controller no valida nada (confía en BD)
❌ Posible eliminar facturas pagadas
```

---

## 🏗️ ANÁLISIS DE BASE DE DATOS

### ✅ LO QUE EXISTE

#### Tabla: invoices (REAL)

```sql
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,       -- ✅ Bien: UNIQUE
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',              -- ⚠️ DEFAULT 'pending' (debería ser 'draft')
    
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    vat_percentage DECIMAL(5, 2) DEFAULT 21.00,       -- ⚠️ Solo un porcentaje global
    vat_amount DECIMAL(12, 2) DEFAULT 0,
    irpf_percentage DECIMAL(5, 2) DEFAULT 15.00,
    irpf_amount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    
    currency VARCHAR(10) DEFAULT 'EUR',
    notes TEXT,
    payment_method VARCHAR(50),                        -- ❌ Aquí NO debería estar
    payment_date DATE,                                 -- ❌ Aquí NO debería estar
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    
    -- ❌ FALTA: created_by UUID REFERENCES users(id)
    -- ❌ FALTA: updated_by UUID REFERENCES users(id)
    -- ❌ FALTA: paid_amount DECIMAL(12,2) DEFAULT 0
    -- ❌ FALTA: remaining_amount DECIMAL(12,2) GENERATED
    -- ❌ FALTA: change_reason TEXT
);
```

**Análisis:**
- ✅ Estructura base OK
- ✅ Foreign keys OK
- ✅ invoice_number UNIQUE OK
- ⚠️ Status DEFAULT 'pending' (INCORRECTO)
- ⚠️ Solo un vat_percentage (no desglose)
- ❌ SIN auditoría (created_by, updated_by)
- ❌ SIN tracking de pagos (paid_amount, remaining_amount)
- ❌ payment_date y payment_method en lugar incorrecto

#### Tabla: invoice_items (REAL)

```sql
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_type VARCHAR(50) DEFAULT 'hours',
    unit_price DECIMAL(12, 2) NOT NULL,
    vat_percentage DECIMAL(5, 2) DEFAULT 21.00,
    amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Análisis:**
- ✅ Estructura OK
- ❌ SIN CHECK constraint (quantity > 0)
- ❌ SIN CHECK constraint (unit_price >= 0)
- ❌ FALTA: discount_percentage
- ❌ FALTA: discount_amount
- ❌ FALTA: unit_code (kg, ud, hrs, etc.)
- ❌ SIN validación de que unit_type es válido

#### Tabla: payments (REAL)

```sql
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    
    -- ❌ FALTA: created_by UUID REFERENCES users(id)
    -- ❌ FALTA: CHECK (amount > 0)
);
```

**Análisis:**
- ✅ Existe tabla (bien)
- ✅ Foreign key a invoice (bien)
- ❌ SIN created_by (auditoría)
- ❌ SIN CHECK (amount > 0)
- ❌ NO sincroniza con invoices.paid_amount
- ❌ NO actualiza invoices.status automáticamente

### ❌ LO QUE FALTA

| Tabla | Propósito | Criticidad |
|-------|-----------|-----------|
| `invoice_audit_log` | Registrar cambios en facturas | 🔴 CRÍTICA |
| `invoice_payment_allocations` | Asignar pagos a facturas | 🔴 CRÍTICA |
| `invoice_status_transitions` | Validar transiciones de estado | 🟠 ALTA |

**Nota:** Existe tabla `activity_log` pero es muy genérica (no específica para invoices)

---

## 🔧 ANÁLISIS DE BACKEND

### Archivo: controller.ts (Análisis Real)

#### 1️⃣ Función: createInvoice()

```typescript
// CÓDIGO ACTUAL
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
```

**Validaciones ACTUALES:**
- ✅ Captura error UNIQUE violation (23505) - invoice_number duplicado
- ✅ Extrae userId del token
- ✅ Pasa datos a repository

**Validaciones FALTANTES:**

```typescript
❌ NO valida que req.body tiene campos obligatorios
❌ NO valida: invoiceNumber
❌ NO valida: clientId existe y está activo
❌ NO valida: issueDate < dueDate
❌ NO valida: subtotal, total > 0
❌ NO valida: vat_percentage ∈ {0, 5, 10, 21}
❌ NO valida: irpf_percentage ∈ [0, 15]
❌ NO valida: items (mínimo 1 línea)
❌ NO valida: suma de líneas = total
❌ NO valida: status es 'draft'
❌ NO registra en audit_log
❌ NO valida formato de fecha
❌ NO valida cliente no está deletizado
```

**Riesgo:** 🔴 CRÍTICO
- Usuario puede crear factura con:
  - Sin cliente
  - Sin líneas
  - Montos incorrectos
  - Fechas inválidas
  - Status incorrecto
- Factura "válida" en BD pero "inválida" para VeriFactu

---

#### 2️⃣ Función: updateInvoice()

```typescript
// CÓDIGO ACTUAL
export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const invoice = await invoiceRepository.update(req.params.id as string, userId, req.body);

    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Error al actualizar la factura' });
  }
};
```

**Validaciones ACTUALES:**
- ✅ Verifica que factura existe
- ✅ Verifica pertenencia (userId)

**Validaciones FALTANTES:**

```typescript
❌ NO valida que factura está en 'draft' (solo se puede editar borradores)
❌ NO valida cambios en líneas
❌ NO valida que suma de líneas actualizada es correcta
❌ NO registra qué cambió (old_values vs new_values)
❌ NO registra en audit_log
❌ NO valida que cliente sigue activo (si cambió)
```

**Riesgo:** 🟠 ALTA
- Usuario puede editar factura ya enviada/pagada
- Imposible saber qué fue modificado

---

#### 3️⃣ Función: markAsPaid()

```typescript
// CÓDIGO ACTUAL
export const markAsPaid = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const invoice = await invoiceRepository.markAsPaid(req.params.id as string, userId, req.body);

    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    res.status(500).json({ error: 'Error al marcar la factura como pagada' });
  }
};
```

**Validaciones ACTUALES:**
- ✅ Verifica que factura existe

**Validaciones FALTANTES:**

```typescript
❌ NO valida que status actual es 'sent' o 'partial'
❌ NO valida que remaining_amount = 0 (pagada completamente)
❌ NO crea entry en payments
❌ NO crea entry en invoice_payment_allocations
❌ NO actualiza paid_amount en invoice
❌ NO crea entry en audit_log
❌ NO valida que pago coincide con monto adeudado
```

**Riesgo:** 🔴 CRÍTICO
- Pagos parciales NO se registran correctamente
- paid_amount NO se actualiza
- Status inconsistente

---

#### 4️⃣ Función: deleteInvoice()

```typescript
// CÓDIGO ACTUAL
export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const success = await invoiceRepository.delete(req.params.id as string, userId);

    if (!success) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    res.json({ message: 'Factura eliminada correctamente', id: req.params.id });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Error al eliminar la factura' });
  }
};
```

**Validaciones ACTUALES:**
- ❌ NINGUNA validación

**Validaciones FALTANTES:**

```typescript
❌ NO valida que status es 'draft' (NO puede eliminar factura enviada/pagada)
❌ NO valida que NO tiene pagos asociados
❌ NO es "soft delete" (elimina permanentemente, sin auditoría)
❌ NO registra en audit_log
```

**Riesgo:** 🔴 CRÍTICO
- Usuario puede eliminar factura pagada
- Pérdida de datos sin posibilidad de recuperación
- NO cumple normativa fiscal (debe haber trazabilidad)

---

#### 5️⃣ Función: updateOverdueStatus()

```typescript
// CÓDIGO ACTUAL
export const updateOverdueStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const updated = await invoiceRepository.updateOverdueStatus(userId);
    res.json({ message: 'Facturas vencidas actualizadas', count: updated.length, invoices: updated });
  } catch (error) {
    console.error('Error updating overdue invoices:', error);
    res.status(500).json({ error: 'Error al actualizar facturas vencidas' });
  }
};
```

**Validaciones ACTUALES:**
- ✅ Busca facturas vencidas

**Validaciones FALTANTES:**

```typescript
❌ NO valida estado previo (¿cuál era antes de 'overdue'?)
❌ NO registra en audit_log que cambió
❌ NO notifica al usuario
```

**Riesgo:** 🟠 MEDIA
- Cambio de estado "silencioso" sin auditoría

---

### Tipos TypeScript (invoice.ts)

```typescript
// CÓDIGO ACTUAL
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface IInvoice {
  id: string;
  userId: string;
  clientId?: string | null;
  projectId?: string | null;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  subtotal: number;
  vatPercentage: number;
  vatAmount: number;
  irpfPercentage: number;
  irpfAmount: number;
  total: number;
  currency: string;
  notes?: string | null;
  paymentMethod?: string | null;
  paymentDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Verifactu fields (...)
  items?: IInvoiceItem[];
  clientName?: string;
  clientEmail?: string;
  clientNif?: string;
  daysLate?: number;
}
```

**Análisis:**
- ✅ InvoiceStatus bien definido
- ✅ Estructura básica OK
- ❌ SIN paid_amount
- ❌ SIN remaining_amount
- ❌ SIN created_by
- ❌ SIN updated_by
- ❌ SIN change_reason
- ❌ SIN audit_log

---

## 📱 ANÁLISIS DE FRONTEND

### Componente: Invoices.tsx (Análisis Real)

```typescript
// CÓDIGO ACTUAL
const Invoices: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices', search],
    queryFn: () => api.get<Invoice[]>('/invoices' + (search ? `?search=${search}` : '')),
  });

  const columns: Column<Invoice>[] = [
    { key: 'number', header: 'Factura', ... },
    { key: 'clientName', header: 'Cliente', ... },
    { key: 'total', header: 'Total', ... },
    { key: 'status', header: 'Estado', ... },
    { key: 'actions', header: '', ... }
  ];

  return (
    <div className="ag-invoices-page">
      <header className="ag-page-header">
        {/* Título y botón "Nueva Factura" */}
        <Button variant="primary" leftIcon={<Plus size={18} />}>Nueva Factura</Button>
      </header>

      {/* Mini stats */}
      {/* Tabla */}
      <Table columns={columns} data={invoices} isLoading={isLoading} />
    </div>
  );
};
```

**Funcionalidades ACTUALES:**
- ✅ Muestra tabla con búsqueda
- ✅ StatusBadge con colores
- ✅ Botón "Nueva Factura" (visual)
- ✅ Mini stats (hardcoded: 45.230€, 8.120€, 9.498€)
- ✅ Acciones (Eye, Download, MoreHorizontal) - pero sin funcionalidad

**Funcionalidades FALTANTES:**

```typescript
❌ NO hay modal/drawer de crear factura
❌ NO hay validaciones en tiempo real
❌ NO hay selector de cliente
❌ NO hay editor de líneas
❌ NO hay validación de campos obligatorios
❌ NO hay cálculo de impuestos
❌ NO hay validación de invoice_number único
❌ NO hay formulario de edición
❌ NO hay pantalla de detalles
❌ NO hay gestión de pagos
❌ NO hay vista de histórico
❌ NO tiene funcionalidad el botón "Nueva Factura"
❌ NO tiene funcionalidad los botones de acciones
❌ Filtros hardcodeados como variables (no son funcionales)
```

**Riesgo:** 🔴 CRÍTICO
- Página es solo "shell" visual, sin funcionalidad real
- Usuario no puede crear facturas desde UI
- No hay feedback de validaciones
- Botones decorativos sin funcionalidad

---

## 🔴 PROBLEMAS CRÍTICOS

### CRISIS 1: SIN VALIDACIONES EN NINGÚN NIVEL 🔴

```
Backend:  ❌ createInvoice() NO valida nada (confía en BD UNIQUE)
Frontend: ❌ Invoices.tsx NO tiene formulario ni validaciones
BD:       ❌ Solo UNIQUE en invoice_number, sin CHECKs

Resultado:
├─ Usuario: envía datos basura
├─ Frontend: los acepta (sin validaciones)
├─ Backend: los acepta (sin validaciones)
└─ BD: los almacena (UNIQUE es la única protección)

PROBLEMA: Si el usuario envía:
{
  invoiceNumber: "FAC-001",
  clientId: null,          // ❌ Sin cliente
  issueDate: "2025-01-20",
  dueDate: "2025-01-10",   // ❌ Anterior a issue_date
  items: [],               // ❌ Sin líneas
  subtotal: -500,          // ❌ Negativo
  total: 1000              // ❌ No coincide con cálculos
}

¿QUÉ PASA?
✅ Se crea la factura (SIN errores)
❌ Factura inválida en BD
❌ VeriFactu la rechaza
❌ Usuario confundido
```

**Solución:** Implementar validaciones en 3 niveles:
1. Frontend (UX)
2. Backend (seguridad)
3. BD (integridad)

---

### CRISIS 2: SIN AUDITORÍA COMPLETA 🔴

```
ACTUAL: NO hay forma de saber:
├─ ¿Quién creó la factura?
├─ ¿Quién la modificó y cuándo?
├─ ¿Qué exactamente cambió?
└─ ¿Por qué fue modificada?

IMPACTO:
❌ Incumplimiento normativo (obligatorio en fiscal)
❌ Imposible investigar fraudes
❌ Hacienda podría rechazar facturas
❌ NO cumple RGPD
```

**Falta:**
- Tabla `invoice_audit_log`
- Campos `created_by`, `updated_by` en invoices
- Trigger para registrar cambios automáticamente
- Endpoint `/invoices/{id}/audit-log` en backend

---

### CRISIS 3: GESTIÓN DE PAGOS PARCIALES ROTA 🔴

```
ACTUAL:
├─ invoices.payment_date (UNA sola fecha)
├─ invoices.payment_method (UN solo método)
├─ payments (tabla existe pero NO sincronizada)
└─ NO hay invoices.paid_amount

ESCENARIO:
Factura 1000€
├─ Pago 1 (300€ transferencia, 20/01)
├─ Pago 2 (500€ efectivo, 25/01)
└─ Pago 3 (200€ tarjeta, 30/01)

¿Qué se guarda?
├─ invoices.payment_date = 30/01 (ÚLTIMO pago)
├─ invoices.payment_method = 'tarjeta' (ÚLTIMO método)
├─ invoices.paid_amount = ??? (NO EXISTE)
└─ invoices.remaining_amount = ??? (NO EXISTE)

RESULTADO: ❌ DATOS INCONSISTENTES
```

**Falta:**
- Campos: `paid_amount`, `remaining_amount` en invoices
- Tabla: `invoice_payment_allocations`
- Lógica: actualizar `paid_amount` cuando se registra pago
- Lógica: cambiar `status` según `remaining_amount`

---

### CRISIS 4: STATUS INCONSISTENTE 🔴

```
ACTUAL:
├─ Status DEFAULT: 'pending' (INCORRECTO)
├─ Debería ser: 'draft'
├─ Resultado: Factura recién creada parece "lista"
└─ Realidad: Aún está en edición, con errores

IMPACTO:
❌ UX confusa
❌ Usuario cree que factura está completa
❌ Posible envío de facturas incompletas
```

**Solución:**
- Cambiar DEFAULT a 'draft'
- Validar en controller que status = 'draft' en create

---

### CRISIS 5: DESGLOSE DE IMPUESTOS INCOMPLETO 🟠

```
ACTUAL:
├─ invoices.vat_percentage = 21.00 (global)
├─ invoices.vat_amount = 210.00 (global)
└─ NO hay desglose por tipo

PROBLEMA: Factura con líneas:
├─ 3 líneas al 21%
├─ 2 líneas al 10%
└─ 1 línea al 0%

¿Cómo se calcula vat_amount?
❌ NO HAY FORMA DE SABERLO
❌ VeriFactu requiere desglose
❌ Hacienda podría rechazarla
```

**Solución:**
- Agregar desglose en invoices
- Usar invoice_items.vat_percentage para calcular por línea

---

### CRISIS 6: ELIMINACIÓN DE FACTURAS PAGADAS 🔴

```
CÓDIGO ACTUAL:
export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const success = await invoiceRepository.delete(req.params.id as string, userId);
    // ❌ SIN VALIDACIONES
    res.json({ message: 'Factura eliminada correctamente', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la factura' });
  }
};

RESULTADO:
✅ Usuario puede eliminar factura pagada (INCORRECTO)
❌ Pérdida de datos fiscal
❌ NO cumple normativa
❌ Datos irrecuperables
```

**Solución:**
- Validar: status === 'draft' (solo borradores)
- Validar: NO tiene pagos asociados
- Implementar "soft delete" (marcar como deleted, no eliminar)
- Registrar en audit_log

---

## 🛠️ PLAN DE ACCIÓN DETALLADO

### FASE 1: BASE DE DATOS (3-4 días) 🏗️

**Prioridad:** 🔴 CRÍTICA

#### Paso 1.1: Agregar Campos de Auditoría
```sql
ALTER TABLE invoices 
  ADD COLUMN created_by UUID REFERENCES users(id),
  ADD COLUMN updated_by UUID REFERENCES users(id),
  ADD COLUMN change_reason TEXT;

ALTER TABLE payments 
  ADD COLUMN created_by UUID REFERENCES users(id);
```

#### Paso 1.2: Crear Tabla de Auditoría
```sql
CREATE TABLE invoice_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES users(id),
  change_type VARCHAR(50) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_audit_invoice_id ON invoice_audit_log(invoice_id);
CREATE INDEX idx_invoice_audit_created_at ON invoice_audit_log(created_at);
```

#### Paso 1.3: Crear Trigger de Auditoría
```sql
CREATE OR REPLACE FUNCTION audit_invoice_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO invoice_audit_log (
    invoice_id, changed_by, change_type, 
    old_values, new_values, change_reason
  ) VALUES (
    NEW.id,
    COALESCE(NEW.updated_by, OLD.updated_by),
    CASE WHEN OLD.status != NEW.status THEN 'status_changed' ELSE 'updated' END,
    to_jsonb(OLD),
    to_jsonb(NEW),
    NEW.change_reason
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_audit_trigger AFTER UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION audit_invoice_changes();
```

#### Paso 1.4: Agregar Campos de Pagos Parciales
```sql
ALTER TABLE invoices 
  ADD COLUMN paid_amount DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN remaining_amount DECIMAL(12,2) 
    GENERATED ALWAYS AS (total - paid_amount) STORED;

CREATE TABLE invoice_payment_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  allocated_amount DECIMAL(12,2) NOT NULL CHECK (allocated_amount > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(invoice_id, payment_id)
);
```

#### Paso 1.5: Agregar Constraints
```sql
ALTER TABLE invoices 
  ADD CONSTRAINT chk_total_positive CHECK (total > 0),
  ADD CONSTRAINT chk_due_date_geq_issue CHECK (due_date >= issue_date),
  ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE invoice_items 
  ADD CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
  ADD CONSTRAINT chk_unit_price_nonnegative CHECK (unit_price >= 0);

ALTER TABLE payments 
  ADD CONSTRAINT chk_payment_amount_positive CHECK (amount > 0);
```

---

### FASE 2: BACKEND API (5-7 días) 💻

**Prioridad:** 🔴 CRÍTICA

#### Paso 2.1: Actualizar Tipos TypeScript

**Archivo:** backend/src/types/invoice.ts

```typescript
export interface IInvoice extends IInvoiceBase {
  paid_amount: number;
  remaining_amount: number;
  created_by?: string;
  updated_by?: string;
  change_reason?: string;
}

export interface IAuditLog {
  id: string;
  invoice_id: string;
  changed_by: string;
  change_type: 'created' | 'updated' | 'status_changed' | 'payment_recorded';
  old_values?: any;
  new_values?: any;
  change_reason?: string;
  created_at: Date;
}
```

#### Paso 2.2: Crear Validador de Facturas

**Archivo Nuevo:** backend/src/validators/invoice.validator.ts

```typescript
export class InvoiceValidator {
  static validateCreateInvoice(data: IInvoiceCreate): string[] {
    const errors: string[] = [];

    // V1: invoice_number
    if (!data.invoiceNumber || typeof data.invoiceNumber !== 'string' || data.invoiceNumber.trim().length === 0) {
      errors.push('invoice_number_required');
    } else if (!/^[A-Z0-9\-\/]+$/.test(data.invoiceNumber)) {
      errors.push('invoice_number_format_invalid');
    }

    // V2: clientId (si se proporciona)
    if (data.clientId && typeof data.clientId !== 'string') {
      errors.push('client_id_format_invalid');
    }

    // V3: fechas
    const issueDate = new Date(data.issueDate);
    const dueDate = new Date(data.dueDate);
    
    if (isNaN(issueDate.getTime())) {
      errors.push('issue_date_invalid');
    }
    if (isNaN(dueDate.getTime())) {
      errors.push('due_date_invalid');
    }
    if (!isNaN(issueDate.getTime()) && !isNaN(dueDate.getTime()) && dueDate < issueDate) {
      errors.push('due_date_before_issue_date');
    }

    // V4: items
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push('invoice_needs_min_1_line');
    } else {
      data.items.forEach((item, idx) => {
        if (!item.description || typeof item.description !== 'string') {
          errors.push(`line_${idx}_description_required`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`line_${idx}_quantity_must_be_positive`);
        }
        if (item.unitPrice === undefined || item.unitPrice < 0) {
          errors.push(`line_${idx}_unit_price_nonnegative`);
        }
        if (![0, 5, 10, 21].includes(item.vatPercentage)) {
          errors.push(`line_${idx}_vat_percentage_invalid`);
        }
      });
    }

    // V5: montos
    if (data.total <= 0) {
      errors.push('total_must_be_positive');
    }

    // V6: vat
    if (data.vatPercentage && ![0, 5, 10, 21].includes(data.vatPercentage)) {
      errors.push('vat_percentage_invalid');
    }

    // V7: irpf
    if (data.irpfAmount < 0 || data.irpfAmount > data.total * 0.15) {
      errors.push('irpf_out_of_range');
    }

    return errors;
  }
}
```

#### Paso 2.3: Reescribir createInvoice()

**Archivo:** backend/src/api/invoices/controller.ts

```typescript
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const { clientId, invoiceNumber, issueDate, dueDate, items, total, vatPercentage, irpfAmount } = req.body;

    // V1: Validaciones básicas
    const errors = InvoiceValidator.validateCreateInvoice(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // V2: Validar cliente existe y activo (si se proporciona)
    if (clientId) {
      const client = await clientRepository.findById(clientId, userId);
      if (!client) return res.status(404).json({ error: 'client_not_found' });
      if (!client.is_active) return res.status(400).json({ error: 'client_inactive' });
    }

    // V3: Validar suma de líneas
    const calculatedTotal = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice * (1 + item.vatPercentage / 100));
    }, 0);

    if (Math.abs(calculatedTotal - total) > 0.01) {
      return res.status(400).json({
        error: 'total_mismatch',
        calculated: calculatedTotal,
        provided: total
      });
    }

    // V4: Crear factura con status='draft' y auditoría
    const invoice = await invoiceRepository.create(userId, {
      ...req.body,
      status: 'draft',
      created_by: userId,
      updated_by: userId,
      paid_amount: 0
    });

    // V5: Registrar en auditoría
    await auditLogRepository.create({
      invoice_id: invoice.id,
      changed_by: userId,
      change_type: 'created',
      new_values: invoice
    });

    res.status(201).json(invoice);
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'invoice_number_duplicate' });
    }
    res.status(500).json({ error: 'Error al crear la factura' });
  }
};
```

#### Paso 2.4: Implementar recordPayment()

**Nuevo Endpoint:** POST `/invoices/:id/payments`

```typescript
export const recordPayment = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const { invoiceId, amount, paymentDate, paymentMethod, reference } = req.body;

    // V1: Factura existe
    const invoice = await invoiceRepository.findById(invoiceId, userId);
    if (!invoice) return res.status(404).json({ error: 'invoice_not_found' });

    // V2: Monto válido
    if (amount <= 0) return res.status(400).json({ error: 'payment_amount_must_be_positive' });
    if (amount > invoice.remaining_amount) {
      return res.status(400).json({
        error: 'payment_exceeds_remaining',
        remaining: invoice.remaining_amount
      });
    }

    // V3: Fecha válida
    const pDate = new Date(paymentDate);
    if (isNaN(pDate.getTime())) {
      return res.status(400).json({ error: 'invalid_payment_date' });
    }

    // V4: Crear pago
    const payment = await paymentRepository.create({
      invoice_id: invoiceId,
      user_id: userId,
      amount,
      payment_date: pDate,
      payment_method: paymentMethod,
      transaction_id: reference,
      created_by: userId
    });

    // V5: Asignar a factura
    await invoicePaymentAllocationRepository.create({
      invoice_id: invoiceId,
      payment_id: payment.id,
      allocated_amount: amount
    });
    // (TRIGGER actualiza invoice.paid_amount)

    // V6: Actualizar estado
    let newStatus = invoice.status;
    if (invoice.remaining_amount === 0) {
      newStatus = 'paid';
    } else if (invoice.paid_amount > 0) {
      newStatus = 'partial';
    }

    if (newStatus !== invoice.status) {
      await invoiceRepository.update(invoiceId, userId, {
        status: newStatus,
        updated_by: userId
      });

      // Auditoría
      await auditLogRepository.create({
        invoice_id: invoiceId,
        changed_by: userId,
        change_type: 'status_changed',
        old_values: { status: invoice.status },
        new_values: { status: newStatus },
        change_reason: 'Auto-updated after payment'
      });
    }

    // V7: Auditoría del pago
    await auditLogRepository.create({
      invoice_id: invoiceId,
      changed_by: userId,
      change_type: 'payment_recorded',
      new_values: { payment_id: payment.id, amount }
    });

    res.json({ payment, invoice });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Error al registrar pago' });
  }
};
```

#### Paso 2.5: Mejorar deleteInvoice()

```typescript
export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const invoice = await invoiceRepository.findById(req.params.id as string, userId);

    if (!invoice) {
      return res.status(404).json({ error: 'invoice_not_found' });
    }

    // V1: Solo se pueden eliminar borradores
    if (invoice.status !== 'draft') {
      return res.status(400).json({
        error: 'cannot_delete_non_draft_invoice',
        current_status: invoice.status
      });
    }

    // V2: No puede tener pagos
    if (invoice.paid_amount && invoice.paid_amount > 0) {
      return res.status(400).json({
        error: 'cannot_delete_invoice_with_payments',
        paid_amount: invoice.paid_amount
      });
    }

    // V3: Soft delete (marcar como deleted, no eliminar)
    await invoiceRepository.softDelete(req.params.id as string, userId);

    // V4: Registrar en auditoría
    await auditLogRepository.create({
      invoice_id: req.params.id as string,
      changed_by: userId,
      change_type: 'deleted',
      old_values: invoice
    });

    res.json({ message: 'Factura eliminada correctamente', id: req.params.id });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Error al eliminar la factura' });
  }
};
```

#### Paso 2.6: Nuevo Endpoint: Histórico de Cambios

```typescript
export const getInvoiceAuditLog = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const { invoiceId } = req.params;

    // Verificar que factura pertenece al usuario
    const invoice = await invoiceRepository.findById(invoiceId, userId);
    if (!invoice) {
      return res.status(404).json({ error: 'invoice_not_found' });
    }

    const auditLog = await auditLogRepository.findByInvoice(invoiceId);
    res.json(auditLog);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Error al obtener histórico' });
  }
};
```

---

### FASE 3: FRONTEND (5-7 días) 📱

**Prioridad:** 🔴 CRÍTICA

#### Paso 3.1: Crear Modal CreateInvoiceModal.tsx

```typescript
// ESTRUCTURA:
├─ Datos básicos (invoice_number, cliente, fechas)
├─ Validaciones en tiempo real
├─ Editor de líneas
├─ Desglose fiscal
└─ Botones [Cancelar] [Crear]
```

#### Paso 3.2: Crear Drawer InvoiceDetailDrawer.tsx

```typescript
// ESTRUCTURA:
├─ Información general
├─ Desglose fiscal
├─ Estado de pago (progress bar)
├─ Líneas de factura
├─ Acciones (según estado)
├─ Histórico de cambios
└─ [Cerrar]
```

#### Paso 3.3: Crear Modal RecordPaymentModal.tsx

```typescript
// ESTRUCTURA:
├─ Info de factura (total, pagado, pendiente)
├─ Monto a pagar [input]
├─ Fecha [date picker]
├─ Método [select]
├─ Referencia [input]
└─ [Cancelar] [Guardar]
```

#### Paso 3.4: Actualizar Invoices.tsx

```typescript
// CAMBIOS:
├─ Agregar botón "Nueva Factura" funcional (abre modal)
├─ Agregar acciones funcionales en tabla
├─ Integrar CreateInvoiceModal
├─ Integrar InvoiceDetailDrawer
├─ Integrar RecordPaymentModal
└─ Refrescar tabla después de cambios
```

---

### FASE 4: QA y Docs (3-4 días) 🧪

**Prioridad:** 🟠 ALTA

- Tests unitarios (target: 85% coverage)
- Tests de integración (BD + Backend + Frontend)
- Tests e2e (crear, pagar, cancelar)
- Documentación API
- Documentación usuario

---

## ✅ CHECKLIST IMPLEMENTACIÓN

```
FASE 1: BD
[ ] Migración auditoría
[ ] Migración pagos parciales
[ ] Constraints
[ ] Índices
[ ] Triggers

FASE 2: BACKEND
[ ] InvoiceValidator
[ ] createInvoice() con validaciones
[ ] recordPayment() nuevo
[ ] deleteInvoice() mejorado
[ ] getInvoiceAuditLog() nuevo
[ ] Tipos TypeScript actualizados
[ ] Tests unitarios

FASE 3: FRONTEND
[ ] CreateInvoiceModal.tsx
[ ] InvoiceDetailDrawer.tsx
[ ] RecordPaymentModal.tsx
[ ] Invoices.tsx actualizado
[ ] Validaciones en tiempo real
[ ] Tests e2e

FASE 4: QA
[ ] Tests de integración
[ ] Documentación
[ ] Casos de uso críticos
```

---

## 📊 MÉTRICAS DE ÉXITO

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| **Validaciones Backend** | 5% | 95% |
| **Auditoría** | 0% | 100% |
| **Pagos Parciales** | 0% | 100% |
| **Test Coverage** | 0% | 85% |
| **UI Completa** | 20% | 100% |

---

**ESTADO:** Análisis Completo + Plan Detallado  
**TIEMPO ESTIMADO:** 16-22 días (4 fases)  
**CRITICIDAD:** 🔴 CRÍTICA  
**ACCIÓN RECOMENDADA:** Comenzar Fase 1 inmediatamente
