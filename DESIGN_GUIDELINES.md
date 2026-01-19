# Guia de Diseno y Estilos - Anclora Flow

Este documento recopila las directrices de diseño UX/UI establecidas para el proyecto Anclora Flow, con especial énfasis en la consistencia visual, el comportamiento de los modales y el estilo de los componentes interactivos.

## 1. Principios Generales

- **Consistencia**: Todos los elementos deben mantener una apariencia uniforme en todas las pantallas.
- **Claridad**: La información debe ser legible y jerarquizada.
- **Espacio**: Priorizar el uso del espacio disponible para evitar scrolls innecesarios.
- **Tema**: Respetar el modo oscuro/claro definido por las variables CSS (temática principal oscura con acentos azules/verdes).

---

## 2. Modales (Ventanas Emergentes)

Los modales son componentes críticos y deben seguir estas reglas estrictas:

### Reglas de Diseño

1. **Cero Scroll Vertical**:
   - Siempre que el contenido lo permita, el modal debe adaptarse a la altura de la pantalla sin generar barras de desplazamiento verticales.
   - Ajustar paddings y márgenes para condensar la información si es necesario.
   - Si el contenido es dinámico y extenso (ej: muchas líneas de factura), el scroll debe ser interno en el cuerpo (`modal__body` con `overflow-y: auto`), nunca en la ventana completa.
2. **Tamaño y Dimensiones**:
   - Usar anchos generosos (ej: `max-width: 800px` o más) para aprovechar el espacio horizontal y evitar apiñamiento vertical.
   - El modal debe estar centrado perfectamente.
3. **Frame y Contenedor**:
   - Fondo del panel: Color de superficie sólido (ej: `var(--bg-surface)`).
   - Borde: Sutil o nulo si hay sombra.
   - Sombra: `box-shadow` suave para dar profundidad.

### Estructura del Modal

- **Cabecera (`modal__head`)**:
  - Título Grande y Claro (`1.75rem` o similar).
  - Subtítulo opcional para contexto (ej: Nº Factura).
  - Botón de cierre (X) en la esquina superior derecha.
- **Cuerpo (`modal__body`)**:
  - Espaciado interno (`padding`) equilibrado (recomendado `1.25rem` o ajustado para evitar cortes).
  - Los contenedores internos (frames de detalles) no deben cortarse visualmente.
- **Pie (`modal__footer`)**:
  - **Clase Obligatoria**: Usar siempre `modal__footer modal-form__footer`.
  - **Alineación**: Botones alineados estrictamente a la **derecha**.
  - **Sin Estilos Inline**: No aplicar estilos manuales (`style="..."`) al footer; confiar en la clase CSS para márgenes y bordes.

---

## 3. Botones y Acciones

### Estilos de Boton

- **Forma**: Esquinas redondeadas (Rounded Corners) uniformes en toda la aplicación (aprox. `border-radius: 6px` a `8px` o `0.375rem`). **Nunca botones cuadrados**.
- **Tamaño**: Evitar botones excesivamente grandes o con paddings desproporcionados. Mantener un tamaño compacto y estándar.

### Tipos de Boton

1. **Primario (`.btn-primary`)**:
   - Uso: Acción principal (Guardar, Descargar, Aceptar).
   - Color: Azul corporativo sólido o degradado sutil.
   - Texto: Blanco. Sin emojis (salvo excepciones muy justificadas). Texto conciso ("Descargar PDF", "Guardar").
2. **Secundario (`.btn-secondary`)**:
   - Uso: Acciones negativas o de cierre (Cancelar, Cerrar).
   - Color: Fondo transparente/gris oscuro o borde sutil. En algunos contextos (ej: Cerrar modal), puede tener un tono neutro o verde azulado oscuro según el tema.
   - Ubicación: Siempre a la izquierda del botón primario en los footers.

### Botones en Modales

- Siempre situados en el Footer, alineados a la derecha.
- Orden: [Cancelar/Cerrar] [Accion Principal].
- Ejemplo: `[Cerrar] [Descargar QR]`.

---

## 4. Tablas y Listados

- **Encabezados**: Claros y distinguibles del cuerpo.
- **Filas**: Altura suficiente para legibilidad.
- **Acciones de Fila**: Botones de iconos o menús contextuales discretos para editar/borrar.

---

## 5. Colores y Frames

- **Fondos**:
  - Principal: Oscuro profundo (`--bg-primary`).
  - Secundario/Frames: Un tono más claro (`--bg-secondary`) para diferenciar secciones (ej: Resumen de totales, lista de items).
- **Bordes**:
  - Uso de `border: 1px solid var(--border-color)` para delimitar secciones internas (como los recuadros de totales o datos del cliente).
- **Inputs**:
  - Fondos oscuros con texto claro.
  - Bordes visibles que resaltan al foco.

## 6. Formularios

- **Etiquetas (Labels)**: Siempre visibles encima del campo.
- **Campos Requeridos**: Claramente indicados (ej: asterisco o validación).
- **Nuevos Campos**:
  - Si se requiere añadir información visual que no tiene campo en BD (ej: "Descripción global"), se debe integrar de forma lógica (ej: concatenar a Notas) para no perder el dato, manteniendo la UX solicitada.
