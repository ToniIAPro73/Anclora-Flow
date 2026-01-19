# DIRECTRICES: Tablas Responsivas con Columnas Configurables - Anclora Flow

**Versión:** 1.0  
**Fecha:** 19 Enero 2026  
**Aplicable a:** Todas las tablas de Anclora Flow  
**Responsables:** Codex, Antigravity  
**Estado:** Normativa Vinculante

---

## 🎯 Objetivo

Estandarizar todas las tablas de Anclora Flow para eliminar scroll horizontal innecesario, mejorar UX y proporcionar acceso rápido a datos completos.

**Beneficios:**
- ✅ Cero scroll horizontal obligatorio
- ✅ Usuario controla qué columnas ver
- ✅ Acceso a datos completos sin navegación horizontal
- ✅ Paginación estandarizada (10 registros)
- ✅ Flujo consistente en toda la app

---

## 📋 ESPECIFICACIÓN ARQUITECTURA

### Estructura Obligatoria de Tabla

Toda tabla DEBE estar compuesta de estos elementos en orden:

```
1. TOOLBAR (Configuración + Búsqueda + Filtros)
2. TABLA (Solo columnas seleccionadas)
3. PAGINACIÓN (10 registros por página)
4. DRAWER LATERAL (Detalles completos al click en fila)
```

### 1. TOOLBAR - Obligatorio en TOD AS las tablas

**Ubicación:** Arriba de la tabla  
**Contenido:** En orden horizontal (izquierda a derecha)

```html
<div class="table-toolbar">
  <!-- Elemento 1: Botón Configurar Columnas -->
  <button class="btn-config-columns" title="Configurar qué columnas mostrar">
    ⚙️ Configurar Columnas
  </button>

  <!-- Elemento 2: Campo de búsqueda -->
  <input 
    type="text" 
    class="search-input" 
    placeholder="Buscar..."
    aria-label="Búsqueda en tabla"
  >

  <!-- Elemento 3: Botón Filtros (opcional si hay filtros complejos) -->
  <button class="btn-filters" title="Abrir filtros avanzados">
    🔍 Filtros
  </button>
</div>
```

**CSS Obligatorio:**

```css
.table-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 16px;
}

.btn-config-columns,
.btn-filters {
  padding: 10px 16px;
  background: #14b8a6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-config-columns:hover,
.btn-filters:hover {
  background: #0d9488;
}

.search-input {
  flex: 1;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #475569;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 14px;
}

.search-input::placeholder {
  color: #94a3b8;
}

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
```

---

### 2. TABLA - Estructura y CSS

**Especificación HTML:**

```html
<table class="data-table">
  <thead>
    <tr>
      <!-- Las columnas visibles dependen de configuración del usuario -->
      <!-- SIEMPRE incluir: Identificador + Acciones -->
      <th>Número</th>
      <th>Cliente/Referencia</th>
      <th>Importe</th>
      <th>Estado</th>
      <th>Acción</th>
    </tr>
  </thead>
  <tbody>
    <!-- Máximo 10 registros -->
    <tr class="table-row-clickable" data-id="identificador-único">
      <td>FAC-2025-001</td>
      <td>María García López</td>
      <td>9.010,00 €</td>
      <td>
        <span class="badge badge-success">Cobrada</span>
      </td>
      <td>
        <button class="btn-view-details">Ver detalles →</button>
      </td>
    </tr>
    <!-- Resto de filas (máximo 10) -->
  </tbody>
</table>
```

**CSS Obligatorio:**

```css
/* Contenedor de tabla */
.table-container {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #1e293b;
}

/* Tabla base */
.data-table {
  width: 100%;
  table-layout: auto;
  border-collapse: collapse;
}

/* Headers */
.data-table thead {
  background: #0f172a;
  sticky: 0;
  z-index: 10;
}

.data-table thead th {
  padding: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #cbd5e1;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Body */
.data-table tbody tr {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background-color 0.2s;
}

.data-table tbody tr:last-child {
  border-bottom: none;
}

/* Filas normales */
.data-table tbody td {
  padding: 14px 16px;
  font-size: 14px;
  color: #e2e8f0;
  white-space: nowrap;  /* Evita wrapping */
}

/* Filas clickeables (abren drawer) */
.table-row-clickable {
  cursor: pointer;
}

.table-row-clickable:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* Badges (Estados) */
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.badge-success {
  background: #10b981;
  color: white;
}

.badge-warning {
  background: #f59e0b;
  color: white;
}

.badge-error {
  background: #ef4444;
  color: white;
}

.badge-info {
  background: #3b82f6;
  color: white;
}

/* Botón Ver Detalles */
.btn-view-details {
  padding: 6px 12px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-view-details:hover {
  background: #1d4ed8;
}
```

**RESTRICCIÓN CRÍTICA:**
- ✓ Ancho de tabla: 100% del contenedor
- ✓ NO hay overflow-x en tabla (se elimina scroll horizontal)
- ✓ Columnas se ajustan automáticamente al espacio disponible
- ✓ Máximo 10 registros por página

---

### 3. PAGINACIÓN - Obligatoria

**Ubicación:** Debajo de la tabla  
**Visibilidad:** Solo si hay más de 10 registros totales

**Especificación HTML:**

```html
<div class="pagination">
  <!-- Botón anterior -->
  <button class="btn-paginate btn-prev" aria-label="Página anterior">
    ← Anterior
  </button>

  <!-- Números de página -->
  <div class="page-numbers">
    <button class="page-btn" data-page="1">1</button>
    <button class="page-btn active" data-page="2">2</button>
    <button class="page-btn" data-page="3">3</button>
    <!-- ... más números -->
  </div>

  <!-- Botón siguiente -->
  <button class="btn-paginate btn-next" aria-label="Página siguiente">
    Siguiente →
  </button>

  <!-- Información de paginación -->
  <span class="pagination-info">
    Mostrando 10 de 45 registros (página 2 de 5)
  </span>
</div>
```

**CSS Obligatorio:**

```css
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  margin-top: 16px;
}

.btn-paginate {
  padding: 8px 16px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s;
}

.btn-paginate:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-paginate:disabled {
  background: #64748b;
  cursor: not-allowed;
  opacity: 0.5;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0;
  background: rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
  border: 1px solid #475569;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.page-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #64748b;
}

.page-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}

.pagination-info {
  font-size: 12px;
  color: #94a3b8;
  margin-left: auto;
}
```

---

### 4. DRAWER LATERAL - Detalles Completos

**Ubicación:** Se desliza desde la derecha al click en fila  
**Contenido:** TODOS los campos del registro (no visibles en tabla)

**Especificación HTML:**

```html
<!-- Drawer lateral - detalles -->
<div class="drawer-overlay" id="drawer-overlay" hidden>
  <div class="drawer" id="details-drawer">
    
    <!-- Header del drawer -->
    <div class="drawer-header">
      <h2 class="drawer-title" id="drawer-title">
        Detalles del Registro
      </h2>
      <button class="btn-close-drawer" aria-label="Cerrar detalles">
        ✕
      </button>
    </div>

    <!-- Body del drawer - Contenido dinámico -->
    <div class="drawer-body" id="drawer-body">
      <!-- Se rellena dinámicamente con todos los campos -->
      <div class="field-group">
        <label class="field-label">Número:</label>
        <span class="field-value">FAC-2025-001</span>
      </div>
      <div class="field-group">
        <label class="field-label">Cliente:</label>
        <span class="field-value">María García López</span>
      </div>
      <!-- ... más campos -->
    </div>

    <!-- Footer del drawer -->
    <div class="drawer-footer">
      <button class="btn-secondary" id="btn-drawer-close">
        Cerrar
      </button>
      <button class="btn-primary" id="btn-drawer-edit">
        Editar Registro
      </button>
    </div>

  </div>
</div>
```

**CSS Obligatorio:**

```css
/* Overlay oscuro detrás del drawer */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1050;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.drawer-overlay.open {
  opacity: 1;
}

/* Drawer mismo */
.drawer {
  position: fixed;
  right: 0;
  top: 0;
  width: 450px;  /* Ancho fijo */
  height: 100vh;
  background: #1e293b;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 1051;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.4);
}

.drawer.open {
  transform: translateX(0);
}

/* Header del drawer */
.drawer-header {
  flex-shrink: 0;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-title {
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin: 0;
}

.btn-close-drawer {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.btn-close-drawer:hover {
  color: white;
}

/* Body del drawer */
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.field-group {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.field-group:last-child {
  border-bottom: none;
}

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 8px;
}

.field-value {
  display: block;
  font-size: 14px;
  color: #e2e8f0;
  word-break: break-word;
}

/* Footer del drawer */
.drawer-footer {
  flex-shrink: 0;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-secondary,
.btn-primary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: transparent;
  color: #cbd5e1;
  border: 1px solid #475569;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: #64748b;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

/* Scroll personalizado en body del drawer */
.drawer-body::-webkit-scrollbar {
  width: 8px;
}

.drawer-body::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

.drawer-body::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}

.drawer-body::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
```

**Responsive (Mobiles):**

```css
@media (max-width: 768px) {
  .drawer {
    width: 100%;  /* Ocupa ancho completo */
  }
}
```

---

## 5. MODAL: Configurar Columnas

**Ubicación:** Se abre al click en botón "⚙️ Configurar Columnas"  
**Contenido:** Lista de checkboxes con todas las columnas disponibles

**Especificación HTML:**

```html
<!-- Modal Configurar Columnas -->
<div class="modal-overlay" id="column-config-modal" hidden>
  <div class="modal-content">
    
    <!-- Header -->
    <div class="modal-header">
      <div>
        <h2 class="modal-title">Configurar Columnas</h2>
        <p class="modal-description">Selecciona qué columnas mostrar en la tabla</p>
      </div>
      <button class="btn-modal-close">✕</button>
    </div>

    <!-- Body -->
    <div class="modal-body">
      <div class="column-options">
        
        <!-- Columnas obligatorias (siempre marcadas, deshabilitadas) -->
        <label class="checkbox-item">
          <input type="checkbox" value="numero" checked disabled>
          <span class="checkbox-label">Número / ID (Obligatoria)</span>
        </label>

        <!-- Columnas opcionales -->
        <label class="checkbox-item">
          <input type="checkbox" value="cliente" checked>
          <span class="checkbox-label">Cliente / Referencia</span>
        </label>

        <label class="checkbox-item">
          <input type="checkbox" value="fecha_emision">
          <span class="checkbox-label">Fecha de Emisión</span>
        </label>

        <label class="checkbox-item">
          <input type="checkbox" value="fecha_vencimiento">
          <span class="checkbox-label">Fecha de Vencimiento</span>
        </label>

        <label class="checkbox-item">
          <input type="checkbox" value="importe" checked>
          <span class="checkbox-label">Importe</span>
        </label>

        <label class="checkbox-item">
          <input type="checkbox" value="estado" checked>
          <span class="checkbox-label">Estado</span>
        </label>

        <!-- Agregar más según la tabla específica -->
      </div>
    </div>

    <!-- Footer -->
    <div class="modal-footer">
      <button class="btn-secondary" id="btn-reset-columns">
        Restablecer Predeterminados
      </button>
      <div style="flex: 1;"></div>
      <button class="btn-secondary" id="btn-cancel-columns">
        Cancelar
      </button>
      <button class="btn-primary" id="btn-apply-columns">
        Aplicar
      </button>
    </div>

  </div>
</div>
```

**CSS Obligatorio:**

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-overlay[hidden] {
  display: none;
}

.modal-content {
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 40px);
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.3);
}

.modal-header {
  flex-shrink: 0;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px 0;
}

.modal-description {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.btn-modal-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.column-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.checkbox-item:hover {
  background: rgba(0, 0, 0, 0.3);
}

.checkbox-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  accent-color: #a855f7;
  cursor: pointer;
}

.checkbox-item input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.checkbox-label {
  font-size: 14px;
  color: #e2e8f0;
  user-select: none;
}

.modal-footer {
  flex-shrink: 0;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
```

---

## 🔄 FLUJO DE FUNCIONAMIENTO

### Scenario 1: Usuario abre tabla

```
1. Tabla carga con configuración guardada
   (O columnas predeterminadas si es primera vez)

2. Se muestran MÁXIMO 10 registros
3. Paginación visible si hay más de 10 registros
4. Usuario VE columnas sin scroll horizontal
```

### Scenario 2: Usuario configura columnas

```
1. Click en "⚙️ Configurar Columnas"
2. Modal abre con checkboxes
3. Usuario selecciona/deselecciona columnas
4. Click "Aplicar"
5. Modal cierra
6. Tabla se redibuja con nuevas columnas
7. Configuración se GUARDA en localStorage/DB
```

### Scenario 3: Usuario click en fila para ver detalles

```
1. Click en cualquier fila (excepto botones)
2. Drawer lateral se abre desde derecha
3. Muestra TODOS los campos del registro (no visibles en tabla)
4. Usuario puede:
   - Leer todos los detalles
   - Hacer click "Editar Registro" (abre formulario/modal edit)
   - Cerrar drawer (click ✕ o "Cerrar")
5. Tabla permanece DETRÁS del drawer (no se cierra)
```

---

## 💾 ALMACENAMIENTO DE CONFIGURACIÓN

**Las preferencias del usuario DEBEN persistir:**

### Opción 1: localStorage (Recomendado para MVP)

```javascript
// Guardar configuración
function saveColumnConfiguration(tableName, selectedColumns) {
  const config = {
    timestamp: new Date().toISOString(),
    columns: selectedColumns
  };
  localStorage.setItem(`table_config_${tableName}`, JSON.stringify(config));
}

// Cargar configuración
function loadColumnConfiguration(tableName) {
  const stored = localStorage.getItem(`table_config_${tableName}`);
  return stored ? JSON.parse(stored).columns : getDefaultColumns(tableName);
}

// Estructura:
// Key: "table_config_facturas"
// Value: {
//   "timestamp": "2026-01-19T10:30:00Z",
//   "columns": ["numero", "cliente", "importe", "estado"]
// }
```

### Opción 2: Base de Datos (Para escala)

```sql
-- Tabla de preferencias
CREATE TABLE user_table_preferences (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  visible_columns JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, table_name)
);
```

---

## ✅ CHECKLIST DE VALIDACIÓN

Toda tabla DEBE cumplir TODOS estos puntos:

### Estructura

- [ ] Tiene `.table-toolbar` con botones configurar + búsqueda
- [ ] Tiene `.data-table` con máximo 10 registros
- [ ] Tiene `.pagination` (visible si >10 registros)
- [ ] Tiene `.drawer` para detalles completos
- [ ] Tiene modal `.column-config-modal`

### Funcionalidad

- [ ] Click "⚙️ Configurar Columnas" abre modal
- [ ] Modal checkbox permite seleccionar/deseleccionar columnas
- [ ] Click "Aplicar" actualiza tabla y GUARDA preferencia
- [ ] Click en fila abre drawer lateral
- [ ] Drawer muestra TODOS los campos
- [ ] Búsqueda filtra registros en tiempo real
- [ ] Paginación funciona correctamente (10 registros)
- [ ] Botones "Editar" en drawer abren formulario de edición

### CSS y Diseño

- [ ] SIN scroll horizontal en tabla
- [ ] Ancho 100% del contenedor
- [ ] Colores según paleta Anclora (Azul #2563eb, Teal #14b8a6)
- [ ] Badges con estados correctos (success, warning, error)
- [ ] Drawer se desliza desde derecha
- [ ] Modal centrado con overlay oscuro
- [ ] Responsive en resoluciones <768px

### UX y Accesibilidad

- [ ] Filas clickeables tienen hover visual
- [ ] Botones tienen títulos (title attribute)
- [ ] Inputs tienen labels (aria-label)
- [ ] Scrollbar personalizado en drawer/modal
- [ ] Teclado navigation funciona (Tab, Enter)
- [ ] Sin scroll horizontal obligatorio

### Performance

- [ ] Máximo 10 registros por página
- [ ] Tabla responde <200ms a cambios
- [ ] Configuración se guarda sin delay visible
- [ ] Drawer se abre sin lag

---

## 📍 APLICACIÓN POR TABLA

### Tabla: Facturas (Registrar/Consultar/Editar)

**Columnas OBLIGATORIAS:**
- Número (obligatoria)

**Columnas OPCIONALES:**
- Cliente
- Fecha Emisión
- Fecha Vencimiento
- Importe
- Estado
- Descripción

**Detalles en Drawer (TODO lo anterior + más):**
- IRPF
- IVA
- Subtotal
- Total
- Notas
- Líneas de factura

---

### Tabla: Gastos

**Columnas OBLIGATORIAS:**
- Número (obligatoria)

**Columnas OPCIONALES:**
- Categoría
- Descripción
- Importe
- Fecha
- Estado
- Proveedor

---

### Tabla: Ingresos

**Columnas OBLIGATORIAS:**
- Número (obligatoria)

**Columnas OPCIONALES:**
- Cliente
- Concepto
- Importe
- Fecha
- Estado
- Referencia

---

### Template para nuevas tablas

**Aplicar a CUALQUIER tabla nueva:**

1. Copiar estructura HTML (toolbar + tabla + paginación + drawer + modal)
2. Personalizar columnas según tipo de dato
3. Aplicar CSS obligatorio (sin modificaciones)
4. Implementar lógica de configuración de columnas
5. Pasar checklist de validación

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### Stack Requerido

- **Frontend:** React/Next.js (u otro SPA)
- **Estado:** Context API o Redux
- **Almacenamiento:** localStorage + DB
- **Estilos:** CSS personalizado (Anclora Flow palette)

### Componentes Reutilizables (Implementar)

```typescript
// components/Table/DataTable.tsx
interface DataTableProps {
  data: Record[];
  columns: ColumnConfig[];
  pageSize?: number;  // default: 10
  onRowClick?: (record: Record) => void;
  onConfigSave?: (columns: string[]) => void;
}

// components/Table/ColumnConfigModal.tsx
// components/Table/DetailsDrawer.tsx
// components/Table/Pagination.tsx
```

---

## ⚠️ RESTRICCIONES NO NEGOCIABLES

1. ✓ **Paginación obligatoria: máximo 10 registros por página**
2. ✓ **NO scroll horizontal en tabla** (resolver con columnas configurables)
3. ✓ **Header tabla STICKY** (permanece al scrollear body)
4. ✓ **Drawer SIEMPRE desde derecha** (no desde izquierda)
5. ✓ **Modal centrado en viewport** (no fixed en corners)
6. ✓ **Columnas obligatorias SIEMPRE visibles** (no se pueden desmarcar)
7. ✓ **Configuración se GUARDA automáticamente** (sin click "Guardar" extra)

---

## 📚 REFERENCIAS

- **Directrices Viewport:** @DIRECTRICES-VIEWPORT-ANCLORA-FLOW.md
- **Paleta de Colores:** Sección "Guía de Diseño Visual"
- **Especificación Modales:** Sección "Especificación de Modales"

---

## 🎯 RESPONSABLES

**Agentes IA (Codex, Antigravity):** Implementar estas directrices en TODAS las tablas

**QA:** Validar contra checklist de validación

**Toni:** Aprobación final antes de release

---

**ESTADO:** Normativa Vinculante v1.0  
**APLICABLE DESDE:** 19 Enero 2026  
**VERSIONADO:** Seguir en `/directrices` del repositorio  
**PRÓXIMA REVISIÓN:** Posterior a implementación en 5 tablas piloto
