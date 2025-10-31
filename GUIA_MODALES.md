# Guía de Diseño de Modales - Anclora Flow

Esta guía establece los estándares para crear modales consistentes, amigables y sin scroll innecesario en la aplicación Anclora Flow.

## 1. Principios de Diseño

### 1.1 Sin Scroll Vertical al Abrir

- Los modales **DEBEN** mostrar todo su contenido principal sin necesidad de scroll al abrirse
- El contenido inicial visible debe incluir:
  - Todos los campos del formulario principal
  - Primera línea de ítems (en caso de facturas/presupuestos)
  - Botones de acción (Cancelar, Crear/Guardar)
- Validar visualmente a **100 %, 110 % y 125 %** de zoom del navegador; el contenido debe seguir mostrándose completo sin scroll inicial.
- El scroll **SOLO** debe aparecer cuando:
  - Se añaden líneas adicionales de ítems (2+)
  - El usuario añade contenido dinámico

### 1.2 Tamaño del Modal

- Usar tamaño apropiado según el contenido
- Preferir modales más anchos y altos para evitar scroll
- **Referencia**: Modal de clientes - tamaño compacto sin scroll
- **Para facturas/presupuestos**: Modal más grande (80-90% viewport) para acomodar líneas de ítems
- Utiliza modificadores de panel: `.modal__panel--wide` (facturas/presupuestos), `.modal__panel--xl` (flujos especiales) y `.modal__panel--tall` para garantizar altura máxima sin forzar scroll inicial. Combínalos con `.modal__panel--flex` cuando el contenido incluya `form + footer` y se necesite que el cuerpo crezca sin desbordar.

### 1.3 Organización Clara

- Campos agrupados lógicamente
- Uso de grid layout para múltiples columnas
- Espaciado consistente entre campos
- Sin solapamientos entre elementos
- Jerarquía visual clara (títulos, secciones, campos)

## 2. Estructura del Modal

### 2.1 Cabecera del Modal

```html
<div class="modal-header">
  <h2>Título del Modal</h2>
  <p class="modal-description">Descripción breve de la acción</p>
  <button class="modal-close">×</button>
</div>
```

**Características:**

- Título claro y descriptivo (ej: "Nuevo cliente", "Nueva factura")
- Descripción opcional explicando el propósito
- Botón de cierre (×) en esquina superior derecha
- Fondo oscuro consistente

### 2.2 Cuerpo del Modal

```html
<div class="modal__body modal-form__body">
  <div class="modal-form__grid">
    <!-- Campos del formulario -->
  </div>

  <!-- Secciones adicionales si aplica -->
  <div class="modal-section">
    <h3>Título de Sección</h3>
    <!-- Contenido de sección -->
  </div>
</div>
```

**Características:**

- Grid layout para organizar campos en columnas
- Secciones claramente delimitadas
- Campos del mismo tamaño visual
- Labels descriptivos
- Validación visual de campos requeridos (\*)

### 2.3 Grid Layout de Campos

**Para modales simples (clientes, gastos):**

```css
.modal-form__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
}

/* Campos que ocupan más espacio */
.modal-form__field--span-2 {
  grid-column: span 2;
}

.modal-form__field--span-3 {
  grid-column: span 3;
}
```

**Ejemplo de distribución (modal de clientes):**

- Fila 1: Nombre (1 col) | Email (1 col) | Teléfono (1 col)
- Fila 2: NIF/CIF (1 col) | Ciudad (1 col) | Notas (1 col)
- Fila 3: Checkbox "Cliente activo" (full width)

**Para modales complejos (facturas, presupuestos):**

```css
.modal-form__grid--three {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
```

### 2.4 Pie del Modal (Botones)

```html
<footer class="modal__footer modal-form__footer">
  <button type="button" class="btn-secondary">Cancelar</button>
  <button type="submit" class="btn-primary">Crear/Guardar</button>
</footer>
```

**Características:**

- **SIEMPRE** dos botones: Cancelar (izquierda) y Acción principal (derecha)
- Botón "Cancelar":
  - Color: Verde/Teal (utilizar `btn-secondary`)
  - Posición: Izquierda
  - Cierra el modal sin guardar
- Botón de acción principal:
  - Color: Azul (utilizar `btn-primary`)
  - Posición: Derecha
  - Texto descriptivo: "Crear cliente", "Crear factura", "Guardar cambios"
- Ambos botones del mismo tamaño visual
- Espaciado horizontal entre botones
- Fijos en la parte inferior del modal (no se mueven con scroll)

### 2.5 Secciones de Contenido

- Wrapper recomendado: `modal-section` para agrupar campos o bloques relacionados.
- Añade `modal-section--card` cuando la sección requiera fondo propio (conceptos facturados, notas, adjuntos).
- Usa `modal-section__header` para alinear títulos y acciones contextuales (`modal-section__actions`).
- Mantén el cuerpo del formulario dentro de `modal__body modal-form__body` para que el `flex` gestione el alto.

### 2.6 Tablas y Totales Dentro del Modal

- Tablas internas reutilizan la clase `modal-table`, con modificadores `modal-table__cell--center`/`--numeric` para alineaciones.
- El resumen de importes utiliza `modal-totals`, con filas (`modal-totals__row`) y valores (`modal-totals__value`, `modal-totals__value--negative`).
- Garantizar que el bloque de totales esté visible sin scroll inicial; ubicarlo tras la tabla de conceptos.

### 2.7 Banners y Avisos Contextuales

- Mensajes informativos (ej. factura registrada en Verifactu) emplean `modal-banner`.
- Variantes disponibles: `modal-banner--info` (azul), y se puede extender con nuevos tonos según se necesite.
- Estructura interna: `modal-banner__icon` para el glifo leading y `modal-banner__content` para texto + subtítulo.
- Usa el atributo `hidden` en el banner para mostrar/ocultar mediante lógica JS (`element.hidden = true/false`). 

### 2.8 Pestañas en Secciones Repetibles

- Utiliza el patrón `.modal-tabs` para agrupar colecciones dinámicas (líneas de factura, partidas de presupuesto, etc.).
- El encabezado (`.modal-tabs__nav`) aloja botones `.modal-tabs__tab`; el elemento activo lleva la clase `.is-active` y nunca debe provocar salto vertical en el contenido.
- El cuerpo visible se renderiza dentro de `.modal-tabs__panel`. No apiles varios paneles a la vez: solo el activo permanece en el DOM o se muestra.
- En formularios editables, combina `.modal-tab__grid` con `modal-form__grid--two` y cierra el bloque con `.modal-tab__footer` para las acciones por línea (eliminar, duplicar, etc.).
- Para vistas de solo lectura reutiliza el mismo contenedor y muestra la información con `detail-list`. Los helpers de referencia (`renderInvoiceViewTabs` / `getViewItemPanelMarkup` en `invoices-with-api.js`) ilustran la implementación recomendada.
- Al añadir una nueva línea debe generarse automáticamente una pestaña adicional y activarse sin introducir scroll vertical ni horizontal.

## 3. Estilos de Botones

### 3.1 Botón Cancelar (`btn-secondary`)

- Utiliza el estilo global `btn-secondary` (degradado teal) definido en `frontend/src/styles/colors.css`.
- Mantiene esquinas redondeadas (`border-radius: 999px`) y paddings generosos.
- Debe conservar un ancho mínimo de 180px para alinearse con el botón primario.

### 3.2 Botón Acción Principal (`btn-primary`)

- Reutiliza `btn-primary` (degradado azul) ya existente en la base de estilos.
- Misma altura y ancho que el botón secundario para evitar saltos visuales.
- Texto en mayúsculas opcional, pero siempre con verbo claro: "Crear", "Guardar", "Editar".

### 3.3 Layout del Footer

- Usa el contenedor `modal-form__footer` para fijar botones y mantenerlos alineados a la derecha.
- El footer incorpora un borde superior suave y relleno vertical para separarlo del formulario.
- En pantallas pequeñas, el footer apila los botones (`flex-direction: column`) automáticamente.

## 4. Modales con Líneas de Ítems (Facturas, Presupuestos)

### 4.1 Sección de Conceptos

- Encapsula las líneas dentro de `modal-section modal-section--card`.
- La cabecera (`modal-section__header`) incluye el título y el CTA `Añadir línea` (`btn-secondary`).
- El cuerpo renderiza un único contenedor `.modal-tabs` con pestañas dinámicas (ver 2.8); nunca muestres varias líneas simultáneamente.
- La primera pestaña **DEBE** estar visible al abrir el modal sin provocar scroll.

### 4.2 Formulario de Línea

```html
<div class="modal-tab__grid modal-form__grid modal-form__grid--two">
  <label class="form-field modal-form__field--span-2">
    <span>Concepto *</span>
    <input type="text" name="description" required />
  </label>
  <label class="form-field">
    <span>Unidad</span>
    <input type="text" name="unitType" />
  </label>
  <label class="form-field">
    <span>Cantidad *</span>
    <input type="number" step="0.01" min="0" name="quantity" required />
  </label>
  <label class="form-field">
    <span>Precio unitario *</span>
    <input type="number" step="0.01" min="0" name="unitPrice" required />
  </label>
  <label class="form-field">
    <span>IVA (%)</span>
    <input type="number" step="0.1" min="0" max="100" name="vatPercentage" />
  </label>
  <div class="form-field">
    <span>Importe de la línea</span>
    <div class="modal-tab__line-total" data-field="line-total">€0,00</div>
  </div>
</div>
<div class="modal-tab__footer">
  <button type="button" class="btn-ghost" data-action="remove-item">Eliminar línea</button>
</div>
```

- El importe mostrado en `modal-tab__line-total` es de sólo lectura y se actualiza con JavaScript.
- En modo lectura, sustituye el formulario por un `detail-list` dentro de la misma pestaña para mantener la altura controlada.

### 4.3 Resumen de Totales

- Utiliza el bloque `modal-totals` y sus filas (`modal-totals__row`) para mostrar Subtotal, IVA, IRPF y Total.
- Cuando el IRPF es editable, incluye `modal-totals__control` con el input correspondiente y el valor en `modal-totals__value--negative`.
- El bloque debe permanecer siempre bajo las pestañas y ser visible sin scroll inicial.

## 5. Tipos de Modales

### 5.1 Modal de Creación

- Título: "Nuevo [entidad]"
- Campos vacíos o con valores por defecto
- Botón principal: "Crear [entidad]"

### 5.2 Modal de Edición

- Título: "Editar [entidad]"
- Campos pre-rellenados con datos existentes
- Botón principal: "Guardar cambios"

### 5.3 Modal de Consulta/Vista

- Título: "Detalles de [entidad]"
- Campos en modo solo lectura (disabled)
- Botón principal: "Cerrar" o "Editar"
- Opcional: Botón secundario para pasar a modo edición

## 6. Responsividad

### 6.1 Tamaños de Modal

```css
/* Modal pequeño (clientes, gastos) */
.modal-sm {
  max-width: 600px;
  width: 90%;
}

/* Modal mediano (proyectos) */
.modal-md {
  max-width: 800px;
  width: 90%;
}

/* Modal grande (facturas, presupuestos) */
.modal-lg {
  max-width: 1200px;
  width: 90%;
  max-height: 90vh;
}
```

### 6.2 Altura del Modal

- **No usar altura fija** (por ejemplo `height: 800px`).
- Usar `max-height` con viewport units (por ejemplo `max-height: 90vh`).
- Permitir que el contenido defina la altura
- El scroll interno solo aparece si el contenido excede `max-height`

## 7. Comportamiento de Scroll

### 7.1 Scroll en el Cuerpo

- El scroll aplica solo al `modal-body`
- El header y footer permanecen fijos
- Scroll suave y visible cuando es necesario

```css
.modal-body {
  max-height: calc(90vh - 200px); /* Resta header y footer */
  overflow-y: auto;
  padding: 2rem;
}
```

### 7.2 Cuándo Aparece el Scroll

- El scroll aparece al añadir líneas adicionales de ítems (segunda en adelante).
- El scroll aparece en pantallas pequeñas donde el contenido completo no cabe.
- El scroll no debe aparecer al abrir el modal en escritorio.
- El scroll no debe ser necesario para alcanzar el footer de acciones.

## 8. Checklist para Nuevo Modal

Antes de implementar un nuevo modal, verificar:

- [ ] Título y descripción claros.
- [ ] Botón de cierre (×) en esquina superior derecha.
- [ ] Grid layout apropiado para los campos.
- [ ] Campos organizados lógicamente (agrupados por tipo).
- [ ] Labels descriptivos para todos los campos.
- [ ] Campos requeridos marcados con (\*).
- [ ] Sin scroll vertical al abrir (estado inicial).
- [ ] Botón "Cancelar" (teal, izquierda).
- [ ] Botón de acción principal (azul, derecha).
- [ ] Botones en la misma posición que el modal de referencia.
- [ ] Footer fijo (no se mueve con scroll).
- [ ] Tamaño apropiado (`max-width` y `max-height`).
- [ ] Para facturas/presupuestos: primera línea visible sin scroll.
- [ ] Para facturas/presupuestos: totales visibles sin scroll.
- [ ] Sin solapamientos entre elementos.
- [ ] Espaciado consistente.

## 9. Ejemplos de Referencia

### 9.1 Modal Simple (Clientes)

- **Ubicación**: `frontend/src/pages/clients.js`
- **Características**:
  - Grid de 3 columnas
  - 6 campos principales + checkbox
  - Sin scroll
  - Botones: Cancelar (teal) | Crear cliente (azul)

### 9.2 Modal Complejo (Facturas)

- **Ubicación**: `frontend/src/pages/invoices-with-api.js`
- **Características**:
  - Grid de 2 columnas para campos principales
  - Sección de líneas de ítems (full width)
  - Primera línea visible sin scroll
  - Resumen de totales visible sin scroll
  - Botones: Cancelar (teal) | Crear factura (azul)

### 9.3 Modal de Gastos

- **Ubicación**: `frontend/src/pages/expenses.js`
- **Características**:
  - Grid de 3 columnas con campos extensibles mediante `modal-form__field--span-*`
  - Secciones diferenciadas para datos generales, importes, tratamiento fiscal y anexos
  - Sin scroll inicial en escritorio; solo aparece al añadir más contenido dinámico
  - Footer fijo reutilizando `btn-secondary` y `btn-primary` con el mismo ancho
  - Modal de detalle en modo lectura soportado por `detail-list` a dos columnas

## 10. Errores Comunes a Evitar

**No hacer:**

- Usar altura fija que cause scroll innecesario
- Poner botones dentro del área scrollable
- Amontonar campos sin organización visual
- Usar grid de 1 columna cuando caben 2-3
- Ocultar información importante (totales, primera línea) bajo scroll
- Usar colores diferentes para botones de acción
- Cambiar la posición de los botones entre modales

**Hacer:**

- Usar `max-height` con vh units
- Mantener footer fijo con botones siempre visibles
- Organizar campos en grid lógico
- Aprovechar el ancho del modal (2-3 columnas)
- Mostrar todo el contenido esencial sin scroll inicial
- Mantener consistencia de colores (teal/blue)
- Posición de botones consistente: Cancelar (izq) | Acción (der)
