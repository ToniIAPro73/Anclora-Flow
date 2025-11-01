# Guía de Diseño de Modales - Anclora Flow

Esta guía establece los estándares para crear modales consistentes, amigables y sin scroll innecesario en la aplicación Anclora Flow.

## 1. Principios de Diseño

### 1.1 Sin Scroll Vertical al Abrir
- Los modales **DEBEN** mostrar todo su contenido principal sin necesidad de scroll al abrirse
- El contenido inicial visible debe incluir:
  - Todos los campos del formulario principal
  - Primera línea de ítems (en caso de facturas/presupuestos)
  - Botones de acción (Cancelar, Crear/Guardar)
- El scroll **SOLO** debe aparecer cuando:
  - Se añaden líneas adicionales de ítems (2+)
  - El usuario añade contenido dinámico

### 1.2 Tamaño del Modal
- Usar tamaño apropiado según el contenido
- Preferir modales más anchos y altos para evitar scroll
- **Referencia**: Modal de clientes - tamaño compacto sin scroll
- **Para facturas/presupuestos**: Modal más grande (80-90% viewport) para acomodar líneas de ítems

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
<div class="modal-body">
  <div class="modal-form-grid">
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
- Validación visual de campos requeridos (*)

### 2.3 Grid Layout de Campos

**Para modales simples (clientes, gastos):**
```css
.modal-form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

/* Campos que ocupan más espacio */
.field-wide {
  grid-column: span 2;
}

.field-full {
  grid-column: span 3;
}
```

**Ejemplo de distribución (modal de clientes):**
- Fila 1: Nombre (1 col) | Email (1 col) | Teléfono (1 col)
- Fila 2: NIF/CIF (1 col) | Ciudad (1 col) | Notas (1 col)
- Fila 3: Checkbox "Cliente activo" (full width)

**Para modales complejos (facturas, presupuestos):**
```css
.modal-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.invoice-items-section {
  grid-column: span 2;
}
```

### 2.4 Pie del Modal (Botones)
```html
<div class="modal-footer">
  <button type="button" class="btn-cancel">Cancelar</button>
  <button type="submit" class="btn-primary">Crear/Guardar</button>
</div>
```

**Características:**
- **SIEMPRE** dos botones: Cancelar (izquierda) y Acción principal (derecha)
- Botón "Cancelar":
  - Color: Verde/Teal (`background: teal` o similar)
  - Posición: Izquierda
  - Cierra el modal sin guardar
- Botón de acción principal:
  - Color: Azul (`background: blue`)
  - Posición: Derecha
  - Texto descriptivo: "Crear cliente", "Crear factura", "Guardar cambios"
- Ambos botones del mismo tamaño visual
- Espaciado horizontal entre botones
- Fijos en la parte inferior del modal (no se mueven con scroll)

## 3. Estilos de Botones

### 3.1 Botón Cancelar
```css
.btn-cancel {
  padding: 0.75rem 2rem;
  background: #14b8a6; /* Teal */
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-cancel:hover {
  background: #0d9488;
}
```

### 3.2 Botón Acción Principal
```css
.btn-primary {
  padding: 0.75rem 2rem;
  background: #3b82f6; /* Blue */
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-primary:hover {
  background: #2563eb;
}
```

### 3.3 Layout del Footer
```css
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  position: sticky;
  bottom: 0;
}
```

## 4. Modales con Líneas de Ítems (Facturas, Presupuestos)

### 4.1 Sistema de Pestañas para Líneas
- Las líneas de factura se organizan en **pestañas** (tabs)
- Cada pestaña representa una línea de factura
- Solo se muestra **una pestaña a la vez** (evita scroll)
- Botones de navegación (← →) para moverse entre pestañas
- Primera pestaña seleccionada por defecto
- Pestañas numeradas: "Línea 1", "Línea 2", etc.

**Ventajas del sistema de pestañas:**
- ✅ Sin scroll vertical
- ✅ Campos de línea más espaciados y legibles
- ✅ Totales de línea visibles inmediatamente
- ✅ Navegación clara entre líneas
- ✅ Escalable (funciona con 1 línea o 100 líneas)

### 4.2 Sección de Líneas
- Título de sección: "Líneas de factura"
- Botón "+ Añadir línea" en esquina superior derecha
- Contenedor de pestañas con scroll horizontal si hay muchas
- Botones de navegación (← →) a los lados
- Área de contenido muestra solo la línea activa

### 4.3 Grid de Línea de Ítem (Una pestaña)
```css
.invoice-item-form {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.2fr 1fr auto;
  gap: 1rem;
  align-items: end;
}
```

**Campos de una línea:**
- Concepto (2 columnas de ancho) *
- Unidad (1 columna)
- Cantidad (1 columna)
- Precio unit. (1.2 columnas)
- IVA (%) (1 columna)
- Botón eliminar (auto, solo si hay >1 línea)

**Resumen de línea:** Debajo de los campos, mostrar:
- Subtotal de línea
- IVA de línea
- Total de línea

### 4.4 Resumen de Totales
- **SIEMPRE** visible al abrir el modal (parte del contenido inicial)
- Alineado a la derecha o en un grid
- Campos:
  - Subtotal (suma de todas las líneas)
  - IVA estimado
  - IRPF (%) si aplica
  - Total (destacado)
- Sin scroll para ver el total en el estado inicial

### 4.5 Navegación entre Pestañas
```html
<div style="display: flex; gap: 0.5rem; align-items: center;">
  <button id="prev-btn" class="invoice-tab-nav">←</button>
  <div id="tabs-container" style="display: flex; gap: 0.5rem; flex: 1; overflow-x: auto;">
    <!-- Pestañas generadas dinámicamente -->
  </div>
  <button id="next-btn" class="invoice-tab-nav">→</button>
</div>
```

**Comportamiento:**
- Pestaña activa: fondo azul, texto blanco
- Pestañas inactivas: fondo gris, texto gris
- Botón ← deshabilitado en primera pestaña
- Botón → deshabilitado en última pestaña
- Click en pestaña: cambia a esa línea
- Click en ← o →: navega secuencialmente

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
- **No usar altura fija** (`height: 800px` ❌)
- Usar `max-height` con viewport units (`max-height: 90vh` ✅)
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
- ✅ Al añadir líneas adicionales de ítems (2+)
- ✅ En pantallas pequeñas donde no cabe todo el contenido
- ❌ Al abrir el modal en su estado inicial en pantalla normal
- ❌ Para ver los botones de acción (siempre visibles)

## 8. Checklist para Nuevo Modal

Antes de implementar un nuevo modal, verificar:

- [ ] ✅ Título y descripción claros
- [ ] ✅ Botón de cierre (×) en esquina superior derecha
- [ ] ✅ Grid layout apropiado para los campos
- [ ] ✅ Campos organizados lógicamente (agrupados por tipo)
- [ ] ✅ Labels descriptivos para todos los campos
- [ ] ✅ Campos requeridos marcados con (*)
- [ ] ✅ Sin scroll vertical al abrir (estado inicial)
- [ ] ✅ Botón "Cancelar" (teal, izquierda)
- [ ] ✅ Botón de acción principal (azul, derecha)
- [ ] ✅ Botones en la misma posición que modal de referencia
- [ ] ✅ Footer fijo (no se mueve con scroll)
- [ ] ✅ Tamaño apropiado (`max-width` y `max-height`)
- [ ] ✅ Para facturas/presupuestos: primera línea visible sin scroll
- [ ] ✅ Para facturas/presupuestos: totales visibles sin scroll
- [ ] ✅ Sin solapamientos entre elementos
- [ ] ✅ Espaciado consistente

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

## 10. Errores Comunes a Evitar

❌ **No hacer:**
- Usar altura fija que cause scroll innecesario
- Poner botones dentro del área scrollable
- Amontonar campos sin organización visual
- Usar grid de 1 columna cuando caben 2-3
- Ocultar información importante (totales, primera línea) bajo scroll
- Usar colores diferentes para botones de acción
- Cambiar la posición de los botones entre modales

✅ **Hacer:**
- Usar `max-height` con vh units
- Mantener footer fijo con botones siempre visibles
- Organizar campos en grid lógico
- Aprovechar el ancho del modal (2-3 columnas)
- Mostrar todo el contenido esencial sin scroll inicial
- Mantener consistencia de colores (teal/blue)
- Posición de botones consistente: Cancelar (izq) | Acción (der)
