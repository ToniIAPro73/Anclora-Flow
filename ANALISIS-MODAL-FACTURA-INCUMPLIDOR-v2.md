# ANÁLISIS: Modal de Factura - Incumplimiento Crítico de Viewport

**Fecha:** 19 Enero 2026  
**Zoom:** 100%  
**Resolución:** ~1280×720  
**Estado:** ❌ RECHAZADO - Modal EXCEDE VIEWPORT sin capacidad de visualización completa

---

## 📸 Problema Real Identificado

El modal de "Registrar Factura" **EXCEDE AMPLIAMENTE EL VIEWPORT en altura**.

### Lo que sucede actualmente

1. ✗ **Modal es FÍSICAMENTE más grande que el viewport** (900px modal vs 720px viewport)
2. ✗ **Parte superior del modal está FUERA DE VISTA** (cortada arriba)
3. ✗ **Parte inferior del modal está FUERA DE VISTA** (cortada abajo)
4. ✗ **Usuario NO puede ver header, footer, ni botones de acción**
5. ✗ **NO hay scrollbar en el modal** (correcto en concepto, pero el problema persiste)
6. ✓ El scrollbar visible en la captura = de la página (Ingresos & Facturas), NO del modal

### Validación Técnica

```javascript
// En DevTools, zoom 100%
const modal = document.querySelector('.modal-content')

console.log({
  modal_altura_real: modal.offsetHeight,        // ~900px ← PROBLEMA
  viewport_altura: window.innerHeight,          // 720px
  excede_viewport: modal.offsetHeight > window.innerHeight,  // true
  px_fuera_pantalla: modal.offsetHeight - window.innerHeight // ~180px
})

// RESULTADO ACTUAL:
{
  modal_altura_real: 900,
  viewport_altura: 720,
  excede_viewport: true,              ✗ INCUMPLE
  px_fuera_pantalla: 180,             ✗ 25% FUERA
}

// RESULTADO REQUERIDO:
{
  modal_altura_real: 680,             // max-height: calc(100vh - 40px)
  viewport_altura: 720,
  excede_viewport: false,             ✓ CUMPLE
  px_fuera_pantalla: 0,               ✓ COMPLETAMENTE VISIBLE
}
```

---

## 🔴 Diagnóstico: Por qué sucede esto

### El Modal NO tiene límite de altura

**Código INCORRECTO (probable):**

```css
/* ❌ INCORRECTO - Sin límite de altura */
.modal-content {
  max-width: calc(100vw - 40px);
  
  /* FALTA: max-height: calc(100vh - 40px); */
  
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
}
```

**Resultado:** El modal crece hasta que todo su contenido cabe, sin importar si excede el viewport.

```
┌────────────────────────────────────┐
│ PANTALLA (720px)                   │
│                                    │
│ Modal Header (80px)          ← ✓ VISIBLE
│ ─────────────────────────────────  │
│ Modal Body (550px)           ← ✓ VISIBLE
│ [Contenido]                        │
│ [Contenido]                        │
│ [Contenido]                        │
│ ─────────────────────────────────  │
│ Modal Footer (últimos 30px)  ← ⚠️ PARCIAL
│ ─────────────────────────────────  │
└────────────────────────────────────┘
      ⬇️ INVISIBLE - FUERA DE PANTALLA
┌────────────────────────────────────┐
│ Modal Footer (últimos 40px)  ← ✗ NO VISIBLE
│ [Botones: Cancelar | Guardar]      │
└────────────────────────────────────┘
```

**El usuario NO puede:**
- ✗ Ver el modal completamente
- ✗ Hacer scroll porque NO hay scrollbar
- ✗ Acceder a los botones inferiores
- ✗ Usar el modal sin redimensionar ventana

---

## ✅ SOLUCIÓN OBLIGATORIA

### Paso 1: Agregar Límite de Altura al Modal

**DEBE cumplir esta especificación exacta:**

```css
/* ✅ CORRECTO - Con límite de altura */
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
  overflow: hidden;
}

.modal-content {
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 40px);  ← ⭐ CRÍTICO: AGREGAR ESTA LÍNEA
  
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.3);
}

/* Header y Footer deben tener altura fija */
.modal-header {
  flex-shrink: 0;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  /* Altura aproximada: 70px */
}

.modal-footer {
  flex-shrink: 0;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  /* Altura aproximada: 70px */
}

/* Body ocupa el espacio disponible */
.modal-body {
  flex: 1;                           ← CRÍTICO
  overflow-y: auto;                  ← CRÍTICO
  overflow-x: hidden;
  padding: 24px;
}
```

### Por qué funciona esta solución

```
ANTES (❌ Incorrecto):
.modal-content {
  /* SIN max-height */
  /* Crece a 900px */
}
Resultado: Modal excede viewport

DESPUÉS (✅ Correcto):
.modal-content {
  max-height: calc(100vh - 40px);  /* 680px máximo */
}

Distribución dentro del modal (680px):
  Header:         70px (fixed)
  Separador:       1px
  Body:          538px (flex: 1, scrollable)
  Separador:       1px
  Footer:         70px (fixed)
  ──────────────────
  TOTAL:         680px ✓ Cabe en viewport
```

### Paso 2: Verificar en DevTools

```javascript
// Ejecutar en consola con modal visible, zoom 100%

const modal = document.querySelector('.modal-content')
const computed = window.getComputedStyle(modal)

console.log({
  maxHeight: computed.maxHeight,                    // "680px" o "calc(100vh - 40px)"
  height: computed.height,                          // Debe ser ≤ 680px
  overflow: computed.overflow,                      // "hidden"
  flexDirection: computed.flexDirection,            // "column"
  fitsInViewport: modal.offsetHeight <= window.innerHeight,  // true
})

// ESPERADO:
{
  maxHeight: "680px",
  height: "680px",
  overflow: "hidden",
  flexDirection: "column",
  fitsInViewport: true         ✓
}
```

### Paso 3: Verificación Visual

**Zoom 100%, Resolución 1280×720:**

1. ✓ **Modal Header completamente visible**
   - Título "Registrar Factura"
   - Descripción
   - Botón cerrar [✕]

2. ✓ **Modal Body visible con contenido**
   - Sección de datos básicos
   - Sección de líneas (scrolleable si es necesario)
   - Sección de totales

3. ✓ **Modal Footer completamente visible**
   - Botón "Cancelar"
   - Botón "Guardar Factura"

4. ✓ **Si body excede 538px disponibles:**
   - Aparece scrollbar en lado derecho (SOLO del body)
   - Scrollbar es gris oscuro (#475569)
   - Header y Footer permanecen FIJOS al scrollear

5. ✓ **Sin scrollbar horizontal**

6. ✓ **Modal NO sale del viewport en ninguna dirección**

---

## 📋 Checklist de Corrección

Antes de entregar el modal:

- [ ] `.modal-content` tiene `max-height: calc(100vh - 40px)`
- [ ] `.modal-overlay` tiene `overflow: hidden`
- [ ] `.modal-header` tiene `flex-shrink: 0`
- [ ] `.modal-footer` tiene `flex-shrink: 0`
- [ ] `.modal-body` tiene `flex: 1`
- [ ] `.modal-body` tiene `overflow-y: auto` (si contenido lo requiere)
- [ ] `.modal-content` tiene `display: flex` y `flex-direction: column`
- [ ] Probado en resolución 1280×720 zoom 100%
- [ ] Modal completamente visible (header + body + footer)
- [ ] Botones inferiores completamente accesibles

---

## 🚨 Razón de esta directriz

### Incumplimiento de Viewport = Producto Inutilizable

Un modal que excede el viewport:

1. **Es invisible parcialmente** → Usuario no ve todo
2. **No es accesible** → Usuario no puede usar botones
3. **Viola accesibilidad** → WCAG incumple
4. **Rompe UX** → Experiencia del usuario degradada
5. **No es responsive** → Falla en zoom 100%

Esta directriz existe para **garantizar usabilidad completa** en cualquier viewport.

---

## 📐 Matemáticas de Altura

```
VIEWPORT: 100vh = 720px (resolución 1280×720)

MODAL-CONTENT:
  max-height: calc(100vh - 40px) = 680px

DENTRO DEL MODAL (680px total):
  HEADER:      70px (flex-shrink: 0)
  SEPARATOR:    1px
  BODY:       538px (flex: 1)
  SEPARATOR:    1px
  FOOTER:      70px (flex-shrink: 0)
  ────────────────
  TOTAL:      680px ✓ CABE EXACTAMENTE

Si BODY necesita más espacio:
  overflow-y: auto → Scrollea solo el body
  Header y Footer permanecen FIJOS
  Usuario puede ver TODO el contenido
```

---

## 🎓 Lección Clave

> **TODO modal DEBE caber completamente en 100vh - 40px**

**Regla de oro:**
```css
.modal-content {
  max-width: calc(100vw - 40px);   /* Ancho máximo */
  max-height: calc(100vh - 40px);  /* ALTURA MÁXIMA - CRÍTICA */
  overflow: hidden;                 /* Recorta si excede */
  display: flex;                    /* Estructura flexible */
  flex-direction: column;           /* Distribución vertical */
}
```

Sin esto, el modal es **innavegable a zoom 100%**.

---

**ESTADO:** Análisis Técnico - Incumplimiento de Viewport  
**SEVERIDAD:** CRÍTICA  
**ACCIÓN:** Aplicar `max-height: calc(100vh - 40px)` al `.modal-content`  
**REFERENCIA:** Directrices Viewport v3.0
