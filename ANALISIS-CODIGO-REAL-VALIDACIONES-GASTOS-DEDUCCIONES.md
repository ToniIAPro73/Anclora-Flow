# ANÁLISIS REAL: Validaciones Módulo Gastos & Deducciones - Anclora Flow

**Versión:** 1.0 (ANÁLISIS REAL DE CÓDIGO)  
**Fecha:** 20 Enero 2026  
**Método:** Análisis directo de código fuente del repositorio  
**Base de Análisis:**
- ✅ backend/src/database/init.sql (esquema BD)
- ✅ frontend/src/pages/expenses.js (lógica actual JS)
- ✅ frontend/src/pages/Expenses/Expenses.tsx (UI React)

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de Base de Datos](#análisis-de-base-de-datos)
3. [Análisis de frontend](#análisis-de-frontend)
4. [Problemas Críticos](#problemas-críticos)
5. [Plan de Acción](#plan-de-acción)

---

## 🎯 RESUMEN EJECUTIVO

### Estado Actual: 🟡 EN DESARROLLO

| Componente | Estado | Validaciones | Auditoría | Riesgo |
|-----------|--------|--------------|-----------|--------|
| **BD** | ✅ Estructura OK | 15% | ❌ No | 🟡 MEDIO |
| **Frontend JS** | ⚠️ Muy Básico | 5% | ❌ No | 🔴 ALTO |
| **Frontend React** | ⚠️ Básico | 10% | ❌ No | 🟡 MEDIO |

---

## 🏗️ ANÁLISIS DE BASE DE DATOS

### ✅ LO QUE EXISTE

#### Tabla: expenses (REAL)

```sql
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL, -- 'office', 'software', etc.
    subcategory VARCHAR(100),
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    vat_amount DECIMAL(12, 2) DEFAULT 0,
    vat_percentage DECIMAL(5, 2) DEFAULT 21.00,
    is_deductible BOOLEAN DEFAULT true,
    deductible_percentage DECIMAL(5, 2) DEFAULT 100.00,
    expense_date DATE NOT NULL,
    payment_method VARCHAR(50), -- 'bank_transfer', 'card', 'cash', 'other'
    vendor VARCHAR(255),
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Análisis:**
- ✅ Estructura base completa para gastos simples.
- ✅ Soporta deducibilidad y porcentajes.
- ❌ SIN auditoría (created_by, updated_by).
- ❌ SIN CHECK constraints (amount > 0).
- ❌ Subcategoría sin validación contra lista maestra.

---

## 📱 ANÁLISIS DE FRONTEND

### Archivo: expenses.js (Análisis Real)

**Funcionalidades ACTUALES:**
- ✅ Renderizado de tabla de gastos.
- ✅ Modal de "Nuevo Gasto" básico.
- ❌ Sin validaciones de tipos de datos en inputs.
- ❌ Sin validación de archivos (receipts).

### Archivo: Expenses.tsx (React)

**Funcionalidades ACTUALES:**
- ✅ Integración con React Query.
- ✅ Columnas: Fecha, Categoría, Descripción, Proveedor, Importe, Estado.
- ✅ Uso de StatusBadge para visualización.

---

## 🔴 PROBLEMAS CRÍTICOS

### CRISIS 1: SIN VALIDACIÓN DE IMPORTES 🔴
El backend y el frontend permiten registrar gastos con importe 0 o negativo, lo cual es contablemente incorrecto para un gasto.

### CRISIS 2: GESTIÓN DE DOCUMENTOS (RECEIPTS) 🔴
No hay validación del tamaño o tipo de archivo al subir comprobantes, lo que puede llenar el almacenamiento con archivos inválidos o peligrosos.

### CRISIS 3: CATEGORIZACIÓN LIBRE 🟠
Al no haber una validación estricta de categorías, los reportes de gastos pueden volverse inconsistentes.

---

## 🛠️ PLAN DE ACCIÓN

1. **Implementar Validaciones en Frontend:**
   - Importe > 0.
   - Fecha de gasto no futura (opcional según política).
   - Categoría obligatoria.
2. **Mejorar UI de Modales:**
   - Seguir directrices de Viewport (Anclora Flow).
   - Implementar Tablas Responsivas para desgloses si aplica.
3. **Auditoría:**
   - Añadir campos de auditoría similares a los de facturas.
