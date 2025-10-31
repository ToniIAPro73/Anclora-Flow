# Guía De Tablas - Anclora Flow

Esta guía define cómo deben construirse, estilizarse y comportarse las tablas de la aplicación. Toma como referencia inmediata las vistas de **Facturas**, **Clientes** y **Gastos**, que comparten el mismo lenguaje visual.

---

## 1. Principios De Diseño

- **Consistencia visual**: todas las tablas comparten tipografías, alturas de fila, bordes verticales y colores de selección.
- **Lectura rápida**: la información clave (número, cliente, importes) va alineada y resaltada con clases utilitarias (`__number`, `__amount`, etc.).
- **Acciones contextualizadas**: la columna `ACCIONES` siempre está visible y alinea los botones en horizontal.
- **Sin scroll horizontal** en resoluciones ≥ 1280 px. Ajustar el orden y el ancho de columnas antes de habilitar un `overflow`.
- **Soporte oscuro/claro**: utilizar las variables de `colors.css`. Evitar estilos inline.

---

## 2. Anatomía

```
<section class="module">
  <header class="module__head">… filtros …</header>
  <div class="module-table">
    <table class="invoices-table | expenses-table | clients-table">
      <thead>…</thead>
      <tbody data-*-tbody>…</tbody>
    </table>
  </div>
  <footer class="module__footer">
    <p data-*-count>Mostrando…</p>
    <div data-pagination="*"></div>
  </footer>
</section>
```

### 2.1 Encabezados

- Utilizar `scope="col"` en todos los `<th>`.
- La última columna **siempre** se llama `ACCIONES` en mayúsculas.
- Evitar celdas vacías o `visually-hidden` en cabeceras.

### 2.2 Filtros

- Contenedores `.invoices__filters`/`.expenses__filters` comparten espaciado.
- Inputs con `label` accesible (`visually-hidden` permite ocultar el texto pero mantiene la asociación).
- Botones de acciones de filtro (`Recargar`, `Limpiar filtros`) usan estilos `btn-ghost` o `btn-secondary`.

### 2.3 Cuerpo

- Fila base `tr` con clase específica (`invoices-table__row`, `expenses-table__row`, etc.).
- Cada `td` puede tener atributos `data-column` cuando la tabla tenga vista responsive (ver tabla de facturas).
- Bordes verticales y horizontales los añade `colors.css`; no redefinirlos inline.

### 2.4 Paginación

- Usar `data-pagination="expenses"` (o equivalente) para construir la paginación dinámica.
- Ocultar el paginador cuando `filtered.length <= PAGE_SIZE`.
- Mostrar el contador con `data-*-count`.

---

## 3. Selección De Filas

### 3.1 Estado Inicial

- Al cargar datos, seleccionar la primera fila disponible.
- Si la tabla se vuelve a rellenar (filtro, creación) y el `selectedId` ya no existe, seleccionar el primer elemento del listado actual.

```javascript
if (data.length) {
  const exists = data.some(item => String(item.id) === String(selectedId));
  if (!exists) selectedId = String(data[0].id);
} else {
  selectedId = null;
}
```

### 3.2 Comportamiento

- La clase `is-selected` aplica la banda azul (`rgba(59, 130, 246, 0.15)` en claro / `rgba(37, 99, 235, 0.35)` en oscuro).
- El clic sobre una fila **no debe** deseleccionar; solo se actualiza cuando se hace clic sobre otra fila distinta.
- Ignorar clics que se produzcan sobre botones o enlaces dentro de la fila:

```javascript
tbody.addEventListener('click', event => {
  if (event.target.closest('button') || event.target.closest('a')) return;
  const row = event.target.closest('tr[data-expense-id]');
  if (!row) return;
  const id = String(row.dataset.expenseId);
  if (selectedExpenseId !== id) {
    selectedExpenseId = id;
    renderExpensesTable();
  }
});
```

### 3.3 Estado Visual

- Color de fondo y borde ya definido en `colors.css` para todas las tablas.
- Mantener `box-shadow: inset 0 0 0 1px` en celdas seleccionadas para reforzar el foco.

---

## 4. Columna De Acciones

| Aspecto              | Reglas                                                                                      |
|----------------------|---------------------------------------------------------------------------------------------|
| Contenedor           | `<div class="invoices-table__actions">` / `<div class="expenses-table__actions">` / `<div class="table-actions">` |
| Ubicación            | Dentro del `<td>`, nunca en el propio `<td>`                                                 |
| Botones              | `table-action` (facturas y gastos) / `btn-icon` (clientes/proyectos)                         |
| Fondo botón          | `rgba(51, 102, 255, 0.35)` con `border-radius: 12px`                                         |
| Align                | `display: inline-flex; gap: 0.4rem;`                                                         |
| Iconografía          | SVG o glifos unicode. Mantener título (`title`) para accesibilidad.                         |

**Ejemplo correcto**

```html
<td>
  <div class="expenses-table__actions">
    <button type="button" class="table-action" title="Ver gasto">👁️</button>
    <button type="button" class="table-action" title="Editar gasto">✏️</button>
    <button type="button" class="table-action" title="Eliminar gasto">🗑️</button>
  </div>
</td>
```

---

## 5. Estados

### 5.1 Empty State

- Mensaje dentro de `tbody` con `<td colspan="*">`.
- Incluir icono o texto guía (`Crea tu primer gasto para empezar.`).
- Mantener estilos de la clase `empty-state`.

### 5.2 Error

- Mostrar módulo de error (`module-error`) en vez de tabla.
- Botón “Reintentar” vinculando con la función de carga (`loadExpenses()`).

### 5.3 Loading

- Mostrar overlay `data-*-loading` con spinner y mensaje contextual.

---

## 6. Responsividad

- Para anchuras < 960 px:
  - Reducir número de columnas visibles (priorizar fecha, descripción, importe).
  - Convertir acciones en menú contextual si no caben.
  - Utilizar `data-column` + pseudo-elementos si hay que adaptar a diseño stacked (ver tabla de facturas).
- Mantener altura mínima de la fila (`min-height: 60px`) para evitar densidad excesiva.

---

## 7. Código Fuente Y Estilos

- **JS**:
  - `frontend/src/pages/invoices-with-api.js`
  - `frontend/src/pages/clients.js`
  - `frontend/src/pages/expenses.js`
- **CSS**: `frontend/src/styles/colors.css` (sección Tablas, alrededor de las líneas 1400–1600).
- **Componentes compartidos**: utilidades en `frontend/src/components/table`.

---

## 8. Checklist

- [ ] Tabla envuelta en `module-table` con contador y paginador.
- [ ] Columna `ACCIONES` con contenedor interno y botones horizontales.
- [ ] Primera fila seleccionada nada más cargar datos.
- [ ] Selección persistente tras filtros/acciones (reposicionada si desaparece la fila).
- [ ] Bordes verticales visibles, excepto en `td:last-child`.
- [ ] Mensajes de vacío, error y carga implementados.
- [ ] Pagination oculta cuando no es necesaria.
- [ ] Sin estilos inline (usar clases o estilos globales).
- [ ] Botones con `title`/`aria-label` y sin focus outline eliminado.
- [ ] Eventos de fila ignorando clics en botones/enlaces.

---

## 9. Referencias Visuales

- **Facturas** (`frontend/src/pages/invoices-with-api.js`): ejemplo completo de selección, filtros, acciones y estados Verifactu.
- **Clientes** (`frontend/src/pages/clients.js`): uso de `.table-actions` con iconos secundarios.
- **Gastos** (`frontend/src/pages/expenses.js`): referencia para tablas compactas con importes y deducciones.

---

**Última actualización:** 2025-10-31  
**Responsable:** Equipo Frontend Anclora Flow
