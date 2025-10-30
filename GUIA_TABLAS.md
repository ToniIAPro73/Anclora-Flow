# Guía de Mejores Prácticas para Tablas

Esta guía documenta los estándares y requisitos para crear y mantener tablas en Anclora Flow.

## 1. Estructura de Columna de Acciones

### ✅ Requisitos Obligatorios

#### 1.1 Encabezado de la Columna
- **DEBE** incluir una columna de encabezado visible con el texto "ACCIONES"
- **NO** usar `visually-hidden` en esta columna

```html
<!-- ✅ CORRECTO -->
<th scope="col">ACCIONES</th>

<!-- ❌ INCORRECTO -->
<th scope="col"><span class="visually-hidden">Acciones</span></th>
<th scope="col"></th>
```

#### 1.2 Contenedor de Botones
- **DEBE** usar un contenedor con clase apropiada para los botones
- Opciones válidas:
  - `.invoices-table__actions` para tabla de facturas
  - `.expenses-table__actions` para tabla de gastos
  - `.table-actions` para otras tablas (clientes, proyectos)

```html
<!-- ✅ CORRECTO -->
<td class="invoices-table__actions">
  <button type="button" class="table-action">...</button>
  <button type="button" class="table-action">...</button>
</td>

<td>
  <div class="table-actions">
    <button type="button" class="btn-icon">...</button>
    <button type="button" class="btn-icon">...</button>
  </div>
</td>

<!-- ❌ INCORRECTO -->
<td>
  <button type="button" class="table-action">...</button>
  <button type="button" class="table-action">...</button>
</td>
```

#### 1.3 Alineación de Botones
- Los botones **DEBEN** aparecer horizontalmente (uno al lado del otro)
- Se logra mediante `display: inline-flex` en el contenedor
- **NO** apilar botones verticalmente

#### 1.4 Bordes
- El contenedor de botones **NO DEBE** tener bordes visibles
- Los bordes deben ajustarse exactamente al espacio de la celda
- Si la celda crece o disminuye, el contenedor debe hacerlo igual

```css
.table-actions,
.invoices-table__actions {
  display: inline-flex;
  gap: 0.4rem;
  border-bottom: none !important;
  border-right: none !important;
}
```

## 2. Estilos de Botones

### 2.1 Clases de Botones
- `.table-action` - Para botones en facturas, gastos
- `.btn-icon` - Para botones en clientes, proyectos

### 2.2 Fondo de Botones
- **DEBE** usar fondo azul claro unificado
- Valor: `rgba(51, 102, 255, 0.35)`

```css
.table-action,
.btn-icon {
  background: rgba(51, 102, 255, 0.35);
  /* Otros estilos... */
}
```

## 3. Selección de Filas

### 3.1 Color de Selección
- **DEBE** ser consistente en todas las tablas
- Tema claro: `rgba(59, 130, 246, 0.15)`
- Tema oscuro: `rgba(37, 99, 235, 0.35)`

### 3.2 Comportamiento de Selección
- Primera fila **DEBE** estar seleccionada por defecto al cargar
- Al hacer clic en una fila, **DEBE** cambiar la selección
- Al hacer clic en la misma fila seleccionada, **NO DEBE** deseleccionarla
- Ignorar clics en botones/enlaces dentro de las filas

```javascript
// Ejemplo de implementación correcta
function ensureSelection() {
  if (data.length > 0) {
    const isValid = data.some(item => String(item.id) === String(selectedId));
    if (!isValid) {
      selectedId = String(data[0].id);
    }
  } else {
    selectedId = null;
  }
}

// Event listener
tbody.addEventListener('click', (e) => {
  if (e.target.closest('button') || e.target.closest('a')) {
    return; // Ignorar clics en botones
  }

  const row = e.target.closest('tr[data-id]');
  if (row) {
    const id = String(row.dataset.id);
    // Solo cambiar si es diferente (no deseleccionar)
    if (selectedId !== id) {
      selectedId = id;
      renderTable();
    }
  }
});
```

## 4. Bordes Verticales entre Columnas

- Todas las celdas **DEBEN** tener bordes verticales excepto la última
- Valor: `border-right: 1px solid rgba(148, 163, 184, 0.15)`

```css
.table tbody td {
  border-right: 1px solid rgba(148, 163, 184, 0.15);
}

.table tbody td:last-child {
  border-right: none !important;
  border-bottom: none !important;
}
```

## 5. Checklist para Nueva Tabla

Antes de crear una nueva tabla, verifica:

- [ ] ✅ Columna "ACCIONES" con encabezado visible
- [ ] ✅ Contenedor de botones con clase apropiada
- [ ] ✅ Botones alineados horizontalmente
- [ ] ✅ Sin bordes en contenedor de botones
- [ ] ✅ Fondo azul claro en botones
- [ ] ✅ Bordes verticales entre columnas (excepto última)
- [ ] ✅ Primera fila seleccionada por defecto
- [ ] ✅ Color de selección unificado
- [ ] ✅ No deseleccionar al re-clicar
- [ ] ✅ Ignorar clics en botones al seleccionar

## 6. Ejemplos de Referencia

### Tabla de Facturas (invoices-with-api.js)
- Mejor práctica para estructura de botones
- Usar como referencia para nuevas tablas

### Tabla de Clientes (clients.js)
- Ejemplo de uso de `.table-actions`
- Referencia para selección de filas

## 7. Archivos Importantes

- `frontend/src/styles/colors.css` - Estilos globales de tablas
- `frontend/src/pages/invoices-with-api.js` - Tabla de facturas (referencia)
- `frontend/src/pages/clients.js` - Tabla de clientes (referencia)
- `frontend/src/pages/expenses.js` - Tabla de gastos
- `GUIA_TABLAS.md` - Este documento

---

**Última actualización:** 2025-10-30
**Versión:** 1.0
