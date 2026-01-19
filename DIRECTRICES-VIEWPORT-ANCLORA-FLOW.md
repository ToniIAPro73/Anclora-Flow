# DIRECTRICES VIEWPORT 100% - ANCLORA FLOW
## Para Agentes IA: Codex y Antigravity

**Versión:** 2.0  
**Fecha:** Enero 2026  
**Aplicación:** Anclora Flow  
**Stack:** React 19 + Vite 6 + TypeScript 5 + CSS Vanilla  
**Estado:** Documento Normativo - NO NEGOCIABLE

---

## TABLA DE CONTENIDOS

1. [Requisitos Inmutables](#requisitos-inmutables)
2. [Estructura de Archivos CSS](#estructura-de-archivos-css)
3. [Configuración CSS Base](#configuración-css-base)
4. [Configuración React/TypeScript](#configuración-reacttypescript)
5. [Validación Obligatoria](#validación-obligatoria)
6. [Protocolos de Entrega](#protocolos-de-entrega)
7. [Criterios de Aceptación](#criterios-de-aceptación)
8. [Troubleshooting](#troubleshooting)

---

## REQUISITOS INMUTABLES

### Especificación Visual

El diseño deberá cumplir **TODAS** estas condiciones simultáneamente:

| Condición | Especificación | Tolerancia |
|-----------|----------------|-----------|
| **Zoom navegador** | 100% | ±0% (exacto) |
| **Scrollbar horizontal** | Ausente | 0px sobrecarga |
| **Scrollbar vertical** | Ausente | 0px sobrecarga |
| **Viewport width** | 100vw | ≤ window.innerWidth |
| **Viewport height** | 100vh | ≤ window.innerHeight |
| **Margen mínimo contenido** | 10px | En todos los lados |
| **Resoluciones validadas** | 1920×1080, 1440×900, 1280×720, 1024×768 | Todas |
| **Redimensionamiento dinámico** | Sin scrollbars | Al cambiar tamaño ventana |

### Restricciones Arquitectónicas

1. **body y html**
   - `overflow: hidden` OBLIGATORIO
   - `margin: 0` y `padding: 0` OBLIGATORIO
   - `width: 100%` y `height: 100%` OBLIGATORIO

2. **Contenedor principal (.app-container)**
   - `width: 100vw` y `height: 100vh` OBLIGATORIO
   - `display: flex` o similar (que respete dimensiones) OBLIGATORIO
   - `overflow: hidden` OBLIGATORIO

3. **Contenedores secundarios**
   - Máximo 100% del contenedor padre (nunca exceder)
   - Si necesitan scroll, usar `overflow: auto` SOLO en ese elemento
   - Restar altura de elementos fijos con `calc()`

4. **Modales**
   - `max-width: calc(100vw - 40px)` OBLIGATORIO
   - `max-height: calc(100vh - 40px)` OBLIGATORIO
   - Contenedor overlay: `position: fixed` + 100vw/100vh OBLIGATORIO

---

## ESTRUCTURA DE ARCHIVOS CSS

### Disposición Requerida

```
src/
├── styles/
│   ├── globals.css          ← Reset y variables globales
│   ├── viewport.css         ← Configuración viewport
│   ├── modal.css            ← Estilos modales
│   ├── forms.css            ← Formularios (si aplica)
│   └── components/          ← Carpeta para estilos componentes
│       ├── header.css
│       ├── sidebar.css
│       └── [otros-componentes].css
├── components/
│   ├── Modal.tsx
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── [otros-componentes].tsx
├── utils/
│   └── viewport-validator.ts ← Script de validación
├── App.tsx
└── main.tsx
```

### Orden de Importación en main.tsx

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Importación de estilos EN ESTE ORDEN
import './styles/globals.css'
import './styles/viewport.css'
import './styles/modal.css'
import './styles/forms.css'
// Importar estilos de componentes solo cuando sea necesario

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

## CONFIGURACIÓN CSS BASE

### globals.css (Copia exacta)

```css
/* ============================================
   RESET GLOBAL Y CONFIGURACIÓN BASE
   ============================================ */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #ffffff;
  color: #1f2937;
}

body {
  display: flex;
  flex-direction: column;
}

#root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Scroll suave cuando sea necesario */
html {
  scroll-behavior: smooth;
}

/* Eliminar estilos por defecto de input, button, etc. */
button,
input,
select,
textarea {
  font-family: inherit;
  font-size: inherit;
  color: inherit;
}

button {
  border: none;
  background: none;
  cursor: pointer;
}

input,
textarea,
select {
  border: 1px solid #d1d5db;
  padding: 8px;
  border-radius: 4px;
}

a {
  color: inherit;
  text-decoration: none;
}
```

### viewport.css (Copia exacta)

```css
/* ============================================
   CONFIGURACIÓN VIEWPORT 100%
   ============================================ */

/* Contenedor principal de la aplicación */
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Layout base: header + main */
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Header */
.app-header {
  flex-shrink: 0;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  overflow: hidden;
  /* IMPORTANTE: Define altura del header */
  /* Ejemplo: height: 60px; */
  /* Reemplazar con altura real */
}

/* Main content area */
.app-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  width: 100%;
}

/* Sidebar (si existe) */
.app-sidebar {
  flex-shrink: 0;
  background-color: #f9fafb;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  overflow-x: hidden;
  /* IMPORTANTE: Define ancho del sidebar */
  /* Ejemplo: width: 250px; */
  /* Reemplazar con ancho real */
}

/* Área de contenido principal */
.app-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px;
  background-color: #fafafa;
}

/* Para scroll personalizado (opcional) */
.app-content::-webkit-scrollbar {
  width: 8px;
}

.app-content::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.app-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.app-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* ============================================
   MODALES
   ============================================ */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow: hidden;
}

.modal-content {
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 40px);
  background: white;
  border-radius: 8px;
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

/* ============================================
   ESTADOS Y UTILIDADES
   ============================================ */

.hidden {
  display: none !important;
}

.overflow-auto {
  overflow: auto;
}

.overflow-hidden {
  overflow: hidden;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### modal.css (Copia exacta)

```css
/* ============================================
   ESTILOS ESPECÍFICOS DE MODALES
   ============================================ */

.modal-header {
  flex-shrink: 0;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2,
.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.modal-close-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 24px;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.modal-close-button:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}

.modal-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
}

.modal-footer {
  flex-shrink: 0;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.modal-body > *:last-child {
  margin-bottom: 0;
}
```

---

## CONFIGURACIÓN REACT/TYPESCRIPT

### App.tsx (Estructura requerida)

```typescript
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { validateViewport } from './utils/viewport-validator'

function App() {
  useEffect(() => {
    // Validar viewport al montar componente
    const initialValidation = validateViewport()
    
    if (!initialValidation.is_valid) {
      console.warn('⚠ VIEWPORT INVÁLIDO AL INICIAR LA APLICACIÓN')
    }

    // Validar cada vez que cambie el tamaño de la ventana
    const handleResize = () => {
      const validation = validateViewport()
      if (!validation.is_valid) {
        console.warn('⚠ VIEWPORT INVÁLIDO DESPUÉS DE REDIMENSIONAMIENTO')
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="app-container">
      <BrowserRouter>
        <Routes>
          {/* Todas las rutas aquí */}
          {/* Patrón: <Route path="/" element={<Home />} /> */}
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
```

### utils/viewport-validator.ts (Copia exacta)

```typescript
/**
 * Validador de Viewport para Anclora Flow
 * Detecta si hay scrollbars en zoom 100%
 * 
 * Uso:
 * - import { validateViewport, getViewportReport } from './utils/viewport-validator'
 * - validateViewport() → ejecuta validación silenciosa
 * - getViewportReport() → genera reporte legible para consola
 */

export interface ViewportValidation {
  viewport_width: number
  viewport_height: number
  body_scroll_width: number
  body_scroll_height: number
  html_scroll_width: number
  html_scroll_height: number
  has_horizontal_scrollbar: boolean
  has_vertical_scrollbar: boolean
  is_valid: boolean
  timestamp: string
  details: {
    width_overflow: number
    height_overflow: number
  }
}

/**
 * Ejecuta validación de viewport
 * Retorna objeto con todas las métricas
 */
export function validateViewport(): ViewportValidation {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const bodyScrollWidth = document.body.scrollWidth
  const bodyScrollHeight = document.body.scrollHeight
  const htmlScrollWidth = document.documentElement.scrollWidth
  const htmlScrollHeight = document.documentElement.scrollHeight

  const widthOverflow = Math.max(
    htmlScrollWidth - viewportWidth,
    bodyScrollWidth - viewportWidth,
    0
  )
  const heightOverflow = Math.max(
    htmlScrollHeight - viewportHeight,
    bodyScrollHeight - viewportHeight,
    0
  )

  const validation: ViewportValidation = {
    viewport_width: viewportWidth,
    viewport_height: viewportHeight,
    body_scroll_width: bodyScrollWidth,
    body_scroll_height: bodyScrollHeight,
    html_scroll_width: htmlScrollWidth,
    html_scroll_height: htmlScrollHeight,
    has_horizontal_scrollbar: widthOverflow > 0,
    has_vertical_scrollbar: heightOverflow > 0,
    is_valid: widthOverflow === 0 && heightOverflow === 0,
    timestamp: new Date().toISOString(),
    details: {
      width_overflow: widthOverflow,
      height_overflow: heightOverflow,
    },
  }

  // Log automático
  if (validation.is_valid) {
    console.log('✓ VIEWPORT VÁLIDO', validation)
  } else {
    console.error('✗ VIEWPORT INVÁLIDO', validation)
  }

  return validation
}

/**
 * Genera reporte formateado para lectura en consola
 */
export function getViewportReport(): string {
  const validation = validateViewport()

  return `
╔════════════════════════════════════════════════════════════╗
║           VIEWPORT VALIDATION REPORT                       ║
╠════════════════════════════════════════════════════════════╣
║ Timestamp: ${validation.timestamp}
║ 
║ VIEWPORT DIMENSIONS:
║   Width:  ${validation.viewport_width}px
║   Height: ${validation.viewport_height}px
║
║ SCROLL DIMENSIONS:
║   Body scrollWidth:  ${validation.body_scroll_width}px
║   Body scrollHeight: ${validation.body_scroll_height}px
║   HTML scrollWidth:  ${validation.html_scroll_width}px
║   HTML scrollHeight: ${validation.html_scroll_height}px
║
║ SCROLLBAR STATUS:
║   Horizontal scrollbar: ${validation.has_horizontal_scrollbar ? '✗ PRESENTE (FALLA)' : '✓ AUSENTE (OK)'}
║   Vertical scrollbar:   ${validation.has_vertical_scrollbar ? '✗ PRESENTE (FALLA)' : '✓ AUSENTE (OK)'}
║
║ OVERFLOW DETECTED:
║   Width overflow:  ${validation.details.width_overflow}px
║   Height overflow: ${validation.details.height_overflow}px
║
║ VALIDATION RESULT:
║   ${validation.is_valid ? '✓ VÁLIDO - Cumple todos los requisitos' : '✗ INVÁLIDO - Revisar elementos sobrecargados'}
╚════════════════════════════════════════════════════════════╝
  `
}

/**
 * Detecta qué elemento está provocando el overflow
 * Uso: debugViewportOverflow()
 */
export function debugViewportOverflow(): void {
  const validation = validateViewport()

  if (validation.is_valid) {
    console.log('✓ No hay overflow detectado')
    return
  }

  console.warn('🔍 DEBUGGING VIEWPORT OVERFLOW...')

  // Buscar elemento más ancho
  if (validation.has_horizontal_scrollbar) {
    console.warn(`⚠ Overflow horizontal: ${validation.details.width_overflow}px`)
    const allElements = document.querySelectorAll('*')
    const problematicElements = Array.from(allElements).filter(
      (el) => el.scrollWidth > validation.viewport_width
    )

    if (problematicElements.length > 0) {
      console.warn(`📍 Elementos problemáticos (ancho):`)
      problematicElements.slice(0, 5).forEach((el) => {
        console.warn(
          `   - ${el.tagName}${el.id ? `#${el.id}` : ''}${el.className ? `.${el.className.split(' ')[0]}` : ''} (width: ${el.scrollWidth}px)`
        )
      })
    }
  }

  // Buscar elemento más alto
  if (validation.has_vertical_scrollbar) {
    console.warn(`⚠ Overflow vertical: ${validation.details.height_overflow}px`)
    const allElements = document.querySelectorAll('*')
    const problematicElements = Array.from(allElements).filter(
      (el) => el.scrollHeight > validation.viewport_height
    )

    if (problematicElements.length > 0) {
      console.warn(`📍 Elementos problemáticos (altura):`)
      problematicElements.slice(0, 5).forEach((el) => {
        console.warn(
          `   - ${el.tagName}${el.id ? `#${el.id}` : ''}${el.className ? `.${el.className.split(' ')[0]}` : ''} (height: ${el.scrollHeight}px)`
        )
      })
    }
  }
}

/**
 * Guarda snapshot de validación para comparar luego
 */
export function captureViewportSnapshot(label: string): ViewportValidation {
  const validation = validateViewport()
  
  // Guardar en sessionStorage para consultar después
  sessionStorage.setItem(`viewport_snapshot_${label}`, JSON.stringify(validation))
  
  console.log(`📸 Snapshot guardado: "${label}"`, validation)
  
  return validation
}

/**
 * Compara dos snapshots
 */
export function compareSnapshots(label1: string, label2: string): void {
  const snap1 = sessionStorage.getItem(`viewport_snapshot_${label1}`)
  const snap2 = sessionStorage.getItem(`viewport_snapshot_${label2}`)

  if (!snap1 || !snap2) {
    console.error('⚠ Uno o ambos snapshots no existen')
    return
  }

  const v1 = JSON.parse(snap1) as ViewportValidation
  const v2 = JSON.parse(snap2) as ViewportValidation

  console.log(`
📊 COMPARACIÓN: "${label1}" vs "${label2}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Viewport:  ${v1.viewport_width}×${v1.viewport_height} → ${v2.viewport_width}×${v2.viewport_height}
Scroll:    ${v1.html_scroll_width}×${v1.html_scroll_height} → ${v2.html_scroll_width}×${v2.html_scroll_height}
H-Scroll:  ${v1.has_horizontal_scrollbar ? '✗' : '✓'} → ${v2.has_horizontal_scrollbar ? '✗' : '✓'}
V-Scroll:  ${v1.has_vertical_scrollbar ? '✗' : '✓'} → ${v2.has_vertical_scrollbar ? '✗' : '✓'}
Válido:    ${v1.is_valid ? '✓' : '✗'} → ${v2.is_valid ? '✓' : '✗'}
  `)
}
```

### Componente Modal.tsx (Requerido)

```typescript
import { ReactNode } from 'react'
import '../styles/modal.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'calc(100vw - 80px)',
  md: 'calc(100vw - 120px)',
  lg: 'calc(100vw - 160px)',
}

export function Modal({ 
  isOpen, 
  onClose, 
  children, 
  title,
  size = 'md'
}: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content"
        style={{
          maxWidth: sizeMap[size],
          maxHeight: 'calc(100vh - 40px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button 
              className="modal-close-button" 
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
```

---

## VALIDACIÓN OBLIGATORIA

### Protocolo de Validación Antes de Entregar

**Este protocolo debe ejecutarse SIN EXCEPCIÓN antes de confirmar que cualquier feature está completa.**

#### Paso 1: Preparar Ambiente

```bash
# En terminal del frontend
cd anclora-flow-frontend
npm run dev

# Esperar a que Vite inicie
# Mensaje esperado: "Local: http://localhost:5173"
```

#### Paso 2: Abrir Navegador

1. Abrir navegador (Chrome, Firefox, Edge - preferir Chrome)
2. Navegar a `http://localhost:5173`
3. Pulsar `F12` para abrir DevTools
4. Ir a pestaña **Console**
5. Establecer zoom a **100%** (`Ctrl+0` o `Cmd+0`)

#### Paso 3: Ejecutar Validación en Consola

**Copiar exactamente este comando:**

```javascript
import { getViewportReport, debugViewportOverflow } from './src/utils/viewport-validator.js'; console.log(getViewportReport()); console.log('Si hay overflow, ejecuta: debugViewportOverflow()');
```

O alternativamente (más simple):

```javascript
window.__vp = { 
  test: () => {
    const v = window.innerWidth < document.documentElement.scrollWidth;
    const h = window.innerHeight < document.documentElement.scrollHeight;
    console.log(`Scrollbar H: ${v ? '✗ FALLA' : '✓ OK'} | Scrollbar V: ${h ? '✗ FALLA' : '✓ OK'} | Válido: ${!v && !h ? '✓ SÍ' : '✗ NO'}`);
    return { h_scrollbar: v, v_scrollbar: h, valid: !v && !h };
  }
};
window.__vp.test();
```

#### Paso 4: Revisar Resultado

**Salida esperada:**
```
✓ VIEWPORT VÁLIDO {
  viewport_width: 1920,
  viewport_height: 1080,
  body_scroll_width: 1920,
  body_scroll_height: 1080,
  has_horizontal_scrollbar: false,
  has_vertical_scrollbar: false,
  is_valid: true,
  timestamp: "2026-01-19T..."
}
```

**Si falla:**
```
✗ VIEWPORT INVÁLIDO {
  has_horizontal_scrollbar: true,    ← PROBLEMA
  has_vertical_scrollbar: false,
  is_valid: false,
  details: {
    width_overflow: 50,               ← Excede 50px
    height_overflow: 0
  }
}
```

#### Paso 5: Redimensionar Ventana

Probar en **4 resoluciones** diferentes:

1. **1920×1080** - Desktop grande
   ```
   Redimensionar ventana a 1920×1080
   Ejecutar: window.__vp.test()
   Resultado: ✓ válido
   ```

2. **1440×900** - Desktop mediano
   ```
   Redimensionar ventana a 1440×900
   Ejecutar: window.__vp.test()
   Resultado: ✓ válido
   ```

3. **1280×720** - Laptop
   ```
   Redimensionar ventana a 1280×720
   Ejecutar: window.__vp.test()
   Resultado: ✓ válido
   ```

4. **1024×768** - Monitor antiguo
   ```
   Redimensionar ventana a 1024×768
   Ejecutar: window.__vp.test()
   Resultado: ✓ válido
   ```

#### Paso 6: Redimensionamiento Dinámico

Sin cerrar DevTools:

1. Agarrar borde de ventana
2. Redimensionar lentamente de 1920×1080 a 1024×768
3. Ver que NO aparecen scrollbars en ningún momento
4. Ejecutar validación cada 5-10 segundos
5. Todos los tests deben pasar (`is_valid: true`)

#### Paso 7: Captura de Evidencia

Tomar screenshot de:
- Console con `is_valid: true` para cada resolución
- Modal (si aplica) sin scrollbars visibles
- Redimensionamiento dinámico (video o serie de screenshots)

---

## PROTOCOLOS DE ENTREGA

### Formato de Confirmación de Entrega

**El agente DEBE enviar exactamente este formato antes de considerar una tarea completa:**

```
✓ VALIDACIÓN COMPLETADA - [Nombre Feature]

RESOLUCIONES TESTEADAS:
  ✓ 1920×1080 - VÁLIDO
  ✓ 1440×900  - VÁLIDO
  ✓ 1280×720  - VÁLIDO
  ✓ 1024×768  - VÁLIDO

REDIMENSIONAMIENTO DINÁMICO:
  ✓ Sin scrollbars en proceso completo 1920→1024
  ✓ Validación ejecutada 8 veces durante redimensionamiento
  ✓ Todos los tests pasados

EVIDENCIA VISUAL:
  ✓ Screenshot consola (1920×1080): [adjuntar o describir]
  ✓ Screenshot consola (1440×900): [adjuntar o describir]
  ✓ Screenshot modal/pantalla: [adjuntar o describir]

ARCHIVOS MODIFICADOS:
  - src/styles/viewport.css (línea X-Y: cambio Z)
  - src/components/Modal.tsx (línea X-Y: cambio Z)
  - src/styles/modal.css (nueva sección: Z)

NOTA: Todos los cambios cumplen directrices de viewport 100%.
```

### Rechazo de Entregas

Las siguientes situaciones resultan en **RECHAZO AUTOMÁTICO**:

1. ❌ No ejecutó validación en todas 4 resoluciones
2. ❌ Presencia de scrollbars en zoom 100% en cualquier resolución
3. ❌ No testeó redimensionamiento dinámico
4. ❌ No adjuntó evidencia visual (screenshot/video)
5. ❌ Modificó estilos CSS sin actualizar viewport.css base
6. ❌ Elemento nuevo sin `calc()` para altura/ancho
7. ❌ `overflow: visible` en contenedor padre (debe ser `hidden` u `auto`)
8. ❌ Márgenes internos no respetan 10px mínimo

---

## CRITERIOS DE ACEPTACIÓN

### Checklist Técnico Obligatorio

Para cualquier commit o PR, validar:

- [ ] **globals.css**: `overflow: hidden` en html, body
- [ ] **viewport.css**: `.app-container` con 100vw/100vh
- [ ] **Altura dinámica**: Elementos con altura fija usan `calc(100vh - ...)`
- [ ] **Ancho dinámica**: Elementos con ancho fijo usan `calc(100vw - ...)`
- [ ] **Scroll selectivo**: Solo `.app-content` o `.modal-body` tienen `overflow: auto`
- [ ] **Modales**: `max-width: calc(100vw - 40px)` y `max-height: calc(100vh - 40px)`
- [ ] **Validación JS**: Ejecutada en mínimo 4 resoluciones
- [ ] **Sin errores consola**: Aparte de warnings normales de React Dev Tools
- [ ] **Responsive**: Probado en 1920×1080, 1440×900, 1280×720, 1024×768

### Criterios de Aceptación Visual

| Aspecto | Aceptado | Rechazado |
|---------|----------|-----------|
| Scrollbar horizontal | No visible | Visible |
| Scrollbar vertical | No visible | Visible |
| Contenido visible | 100% del viewport | Parcialmente fuera |
| Márgenes | Mínimo 10px | Pegado a bordes |
| Redimensionamiento | Suave, sin saltos | Scrollbars aparecen |
| Modal cerrado | Vuelve a viewport normal | Queda contenido abierto |

---

## TROUBLESHOOTING

### Problema: Aparece scrollbar horizontal

**Síntomas:**
- `has_horizontal_scrollbar: true`
- `width_overflow: [número positivo]`

**Solución paso a paso:**

1. Ejecutar en consola:
   ```javascript
   document.querySelectorAll('*').forEach(el => {
     if (el.scrollWidth > window.innerWidth) {
       console.log(`ELEMENTO PROBLEMA:`, el.tagName, el.className, el.scrollWidth)
     }
   })
   ```

2. Identificar elemento problemático (mensaje en consola)

3. Revisar CSS del elemento:
   - ¿Tiene `width: [valor fijo]` mayor a 100vw?
   - ¿Tiene `padding` o `margin` que lo expande?
   - ¿Es contenedor padre de algo más ancho?

4. Aplicar una de estas soluciones:
   ```css
   /* Opción A: Ancho dinámico */
   .element {
     width: 100%;
     max-width: calc(100vw - 20px);
   }

   /* Opción B: Permitir scroll solo en ese elemento */
   .element {
     overflow-x: auto;
     max-width: 100vw;
   }

   /* Opción C: Reducir contenido interno */
   .element .child {
     width: calc(100vw - 40px);
   }
   ```

5. Revalidar ejecutando script de validación

### Problema: Aparece scrollbar vertical

**Síntomas:**
- `has_vertical_scrollbar: true`
- `height_overflow: [número positivo]`

**Solución paso a paso:**

1. Ejecutar en consola:
   ```javascript
   document.querySelectorAll('*').forEach(el => {
     if (el.scrollHeight > window.innerHeight) {
       console.log(`ELEMENTO PROBLEMA:`, el.tagName, el.className, el.scrollHeight)
     }
   })
   ```

2. Identificar elemento problemático

3. Verificar estructura de layout:
   ```
   html/body (100vh)
     ├── app-container (100vh) ✓
     │   ├── app-header (60px) ✓
     │   └── app-main (calc(100vh - 60px)) ← VERIFICAR
     │       ├── app-sidebar (250px, overflow-y: auto) ✓
     │       └── app-content (flex: 1, overflow-y: auto) ✓
   ```

4. Aplicar altura dinámica en contenedores intermedios:
   ```css
   .app-main {
     height: calc(100vh - 60px); /* 60px = altura header */
     overflow: hidden;
   }

   .app-content {
     height: 100%; /* Heredará del padre */
     overflow-y: auto;
   }
   ```

5. Revalidar

### Problema: Redimensionamiento dinámico causa scrollbars

**Síntomas:**
- Válido en resolución A
- Al cambiar a resolución B, aparecen scrollbars
- Valores en consola varían incorrectamente

**Causa:** Elemento con altura/ancho fijo que no se adapta

**Solución:**

1. Revisar elementos con:
   - `height: [valor fijo]px` → cambiar a `height: calc(...)`
   - `width: [valor fijo]px` → cambiar a `width: calc(...)`
   - Contenedores padres sin `overflow: hidden`

2. Ejemplo de corrección:
   ```typescript
   // ❌ INCORRECTO
   <div style={{ height: '800px', width: '1400px' }}>
     Content
   </div>

   // ✅ CORRECTO
   <div style={{ 
     height: 'calc(100vh - 80px)',  // Restar headers, footers
     width: 'calc(100vw - 270px)',  // Restar sidebars
     overflow: 'auto'
   }}>
     Content
   </div>
   ```

3. Probar redimensionamiento dinámico nuevamente

### Problema: Modal no se ve completamente

**Síntomas:**
- Modal cortado arriba/abajo
- Contenido dentro del modal no es scrolleable
- `modal-content` no tiene altura suficiente

**Solución:**

```css
.modal-content {
  max-height: calc(100vh - 40px);  /* 20px margen arriba y abajo */
  overflow-y: auto;
  overflow-x: hidden;
}

.modal-body {
  max-height: calc(100vh - 100px);  /* Restar header y footer del modal */
  overflow-y: auto;
}
```

### Problema: El script de validación no funciona

**Síntomas:**
- ReferenceError: validateViewport is not defined
- El import no encuentra el archivo

**Solución:**

1. Verificar que archivo existe: `src/utils/viewport-validator.ts`

2. Verificar que App.tsx hace el import:
   ```typescript
   import { validateViewport } from './utils/viewport-validator'
   
   useEffect(() => {
     validateViewport()
   }, [])
   ```

3. Verificar que el proyecto está compilado (Vite):
   ```bash
   npm run dev
   ```

4. Limpiar caché del navegador:
   - `Ctrl+Shift+Delete` (Windows/Linux)
   - `Cmd+Shift+Delete` (Mac)

5. Recargar página: `Ctrl+F5` (hard refresh)

### Problema: Estilos no aplican correctamente

**Síntomas:**
- CSS está en globals.css pero no se ve
- Classes no tienen efecto
- Orden de imports incorrecto

**Solución:**

1. Verificar orden en `main.tsx`:
   ```typescript
   import './styles/globals.css'      // 1️⃣ PRIMERO
   import './styles/viewport.css'     // 2️⃣ SEGUNDO
   import './styles/modal.css'        // 3️⃣ TERCERO
   // Importar App después
   import App from './App.tsx'
   ```

2. Limpiar caché de Vite:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

3. Verificar que no hay conflictos de especificidad:
   - No usar `!important` salvo en casos de reset
   - No sobrescribir estilos globales con clases locales

4. Usar DevTools para debuguear:
   - Abrir Inspector (F12)
   - Seleccionar elemento
   - Ver qué reglas se aplican y cuáles se sobrescriben

---

---

## GUÍA DE DISEÑO VISUAL - ANCLORA FLOW

**Esta sección define la identidad visual, componentes y patrones de diseño de Anclora Flow.**

**Referencia Base:** Pantalla "Gastos & Deducciones"  
**Ejemplo de Inconsistencia:** Pantalla "Suscripciones" (NO debe replicarse este patrón)

### Paleta de Colores Oficial

#### Colores Primarios

| Color | Valor HEX | Uso | Ejemplo |
|-------|-----------|-----|---------|
| **Azul Primario** | `#2563eb` | Botones principales, acciones CTA | "Crear cliente", "Registrar gasto" |
| **Teal/Turquesa** | `#14b8a6` o `#06b6d4` | Botones secundarios, acciones alternas | "Cancelar", "Adjuntar justificante" |
| **Azul Oscuro (Dark)** | `#1e293b` | Fondos de modales, cards, contenedores | Modal "Nuevo cliente" |
| **Azul Aún Más Oscuro** | `#0f172a` o `#1a2332` | Fondo principal de la aplicación | Background general |

#### Colores de Gradiente (Hero Sections)

| Gradiente | Uso | Ejemplo |
|-----------|-----|---------|
| Azul → Teal | Headers/hero sections de contenido principal | "Gastos & Deducciones", card headers |
| Púrpura/Magenta → Púrpura más oscuro | SOLO para secciones especiales (NO usar en pantallas normales) | ⚠️ Evitar como en "Suscripciones" |

#### Colores Secundarios

| Color | Valor HEX | Uso |
|-------|-----------|-----|
| **Gris Claro** | `#f3f4f6` | Backgrounds secundarios, separadores |
| **Gris Medio** | `#9ca3af` | Texto deshabilitado, placeholders |
| **Gris Oscuro** | `#374151` | Texto secundario, labels |
| **Blanco** | `#ffffff` | Texto principal, backgrounds claros |
| **Verde (Success)** | `#10b981` | Estados positivos, confirmaciones |
| **Rojo (Error)** | `#ef4444` | Estados de error, alertas |

### Tipografía (Font Stack)

```css
/* Fuente base */
font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

/* Línea base de texto */
line-height: 1.5;
letter-spacing: 0.3px;
```

#### Escalas Tipográficas

| Tipo | Tamaño | Peso | Uso | Ejemplo |
|------|--------|------|-----|---------|
| **Título H1** | 32px | 700 (bold) | Títulos principales de secciones | "Gastos & Deducciones" |
| **Título H2** | 24px | 700 (bold) | Títulos de modales | "Nuevo cliente" |
| **Título H3** | 18px | 700 (bold) | Títulos de cards | Card headers en KPIs |
| **Título H4** | 16px | 600 (semibold) | Labels de campos | "Nombre", "Email" |
| **Texto normal** | 14px | 400 (regular) | Body text, descripciones | "Introduce la información..." |
| **Texto pequeño** | 12px | 400 (regular) | Helper text, dates, metadata | Subtítulos en cards |
| **Botón** | 14px | 500 (medium) | Texto de botones | "Crear cliente" |

### Especificación de Modales

**Basada en:** Modal "Nuevo cliente"

#### Anatomía Requerida

```
┌──────────────────────────────────────────────────────────┐
│  MODAL HEADER                                         [✕] │ ← Botón cerrar
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Título del Modal (H2, 24px, bold, blanco)               │
│  Descripción adicional (14px, gris claro)                │
│                                                            │
├──────────────────────────────────────────────────────────┤
│  MODAL BODY (scrollable si altura > viewport)            │
│                                                            │
│  [Contenido: campos, listas, etc.]                       │
│                                                            │
├──────────────────────────────────────────────────────────┤
│ MODAL FOOTER                                              │
│                                          [Botón] [Botón]  │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

#### CSS para Modal (Actualizado)

```css
/* Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);  /* 60% transparencia */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow: hidden;
}

/* Modal contenedor */
.modal-content {
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 40px);
  background: #1e293b;  /* Azul oscuro */
  border-radius: 12px;  /* Redondeado */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.3);
}

/* Header del modal */
.modal-header {
  flex-shrink: 0;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);  /* Separador sutil */
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  flex: 1;
}

.modal-header p {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #cbd5e1;
}

/* Botón cerrar */
.modal-close-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 24px;
  color: #94a3b8;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-left: 16px;
}

.modal-close-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

/* Body del modal */
.modal-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Footer del modal */
.modal-footer {
  flex-shrink: 0;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);  /* Separador */
  display: flex;
  justify-content: flex-end;  /* SIEMPRE a la derecha */
  gap: 12px;  /* Espacio entre botones */
  background: rgba(0, 0, 0, 0.2);  /* Fondo ligeramente diferente */
}
```

### Especificación de Botones

**Patrón Base:** Modal "Nuevo cliente"

#### Tipos de Botones

| Tipo | Color | Borde | Uso | Ejemplo |
|------|-------|-------|-----|---------|
| **Primary** | Azul `#2563eb` | Ninguno (solid) | Acciones principales | "Crear cliente" |
| **Secondary** | Teal `#14b8a6` | Ninguno (solid) | Acciones alternas | "Cancelar", "Adjuntar" |
| **Outlined** | Transparente | Gris `#6b7280` | Acciones no críticas | Botones alternativos |
| **Text** | Azul `#2563eb` | Ninguno | Links/acciones mínimas | Links en tablas |

#### Especificaciones CSS de Botones

```css
/* Botón base */
button {
  padding: 10px 20px;  /* vertical horizontal */
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  white-space: nowrap;
}

/* Primary button */
.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #1d4ed8;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-primary:active {
  background-color: #1e40af;
  transform: scale(0.98);
}

/* Secondary button */
.btn-secondary {
  background-color: #14b8a6;
  color: #ffffff;
}

.btn-secondary:hover {
  background-color: #0d9488;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
}

.btn-secondary:active {
  background-color: #0f766e;
  transform: scale(0.98);
}

/* Outlined button */
.btn-outlined {
  background-color: transparent;
  color: #6b7280;
  border: 1px solid #6b7280;
}

.btn-outlined:hover {
  background-color: rgba(107, 114, 128, 0.1);
  color: #1f2937;
}

/* Disabled state */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Size variants */
.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-lg {
  padding: 12px 24px;
  font-size: 16px;
}
```

#### Reglas de Posicionamiento en Modales

- ✅ **CORRECTO**: Botones en footer del modal, alineados a la DERECHA
- ✅ Mínimo 12px de espacio entre botones
- ✅ Botón "Cancelar" o "Cerrar" SIEMPRE a la izquierda
- ✅ Botón "Crear", "Guardar", "Enviar" SIEMPRE a la derecha
- ❌ **INCORRECTO**: Botones centrados
- ❌ **INCORRECTO**: Botones en header
- ❌ **INCORRECTO**: Botones sin separación clara

### Especificación de Cards (KPI, Información)

**Basada en:** Cards de "Gastos & Deducciones"

#### Estructura de Card

```
┌─────────────────────────────────────────┐
│  [ICON]  LABEL                          │
│  Valor numérico (grande)                │
│  Sublabel o período                     │
└─────────────────────────────────────────┘
```

#### CSS de Cards

```css
.card {
  background: linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%);  /* Azul a Teal */
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 8px;
}

.card-label {
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
}

.card-sublabel {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}
```

### Especificación de Tablas

**Basada en:** Tabla de "Gastos & Deducciones"

#### Estructura

```
┌─────────┬─────────┬─────────┬─────────┐
│ HEADER  │ HEADER  │ HEADER  │ HEADER  │
├─────────┼─────────┼─────────┼─────────┤
│ Data    │ Data    │ Data    │ Data    │
├─────────┼─────────┼─────────┼─────────┤
│ Data    │ Data    │ Data    │ Data    │
└─────────┴─────────┴─────────┴─────────┘
```

#### CSS de Tablas

```css
.table-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100vh - 300px);  /* Altura dinámica */
  border-radius: 8px;
  border: 1px solid #334155;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: #1e293b;
}

thead {
  background-color: #0f172a;
  position: sticky;
  top: 0;
  z-index: 10;
}

th {
  padding: 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #334155;
}

td {
  padding: 16px;
  font-size: 14px;
  color: #e2e8f0;
  border-bottom: 1px solid #334155;
}

tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.05);
  transition: background-color 0.2s;
}

tbody tr:last-child td {
  border-bottom: none;
}

/* Celdas especiales */
.table-date {
  font-size: 13px;
  color: #94a3b8;
}

.table-amount {
  font-weight: 600;
  color: #60a5fa;
  text-align: right;
}

.table-action {
  text-align: center;
}

.table-action button {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
}
```

### Especificación de Headers/Hero Sections

**Basada en:** Header de "Gastos & Deducciones"

#### Estructura

```
┌───────────────────────────────────────────────────────┐
│ Fondo gradiente (Azul → Teal)                         │
│                                                        │
│ Título (H1, 32px, blanco, bold)                       │
│ Descripción (14px, blanco, 70% opacidad)              │
│                                                        │
│                              [Botón] [Botón]          │
└───────────────────────────────────────────────────────┘
```

#### CSS de Hero Headers

```css
.hero-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%);  /* Azul a Teal */
  padding: 32px 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.hero-content {
  flex: 1;
}

.hero-title {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px 0;
}

.hero-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.hero-actions button {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}
```

### Especificación de Filtros

**Basada en:** Sección de filtros en "Gastos & Deducciones"

#### Estructura

```
┌─────────────┬──────────────┬────────────┬─────────────┐
│ [Input]     │ [Dropdown]   │ [Dropdown] │ [DateInput] │
├─────────────┼──────────────┼────────────┼─────────────┤
│ [Limpiar]                                              │
└─────────────┴──────────────┴────────────┴─────────────┘
```

#### CSS de Filtros

```css
.filter-section {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.filter-group {
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;
  min-width: 200px;
}

.filter-input,
.filter-select,
.filter-date {
  padding: 8px 12px;
  border: 1px solid #475569;
  border-radius: 6px;
  background-color: #0f172a;
  color: #e2e8f0;
  font-size: 14px;
  flex: 1;
}

.filter-input::placeholder {
  color: #6b7280;
}

.filter-clear-btn {
  padding: 8px 16px;
  background-color: transparent;
  border: 1px solid #6b7280;
  border-radius: 6px;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-clear-btn:hover {
  background-color: rgba(107, 114, 128, 0.1);
  color: #e2e8f0;
}
```

### Especificación de Campos de Formulario

**Basada en:** Modal "Nuevo cliente"

#### Estructura

```
┌────────────────────────────────────────┐
│ Label *                                │
│ [Placeholder text]                     │
│                                        │
│ Label *                                │
│ [Placeholder text]                     │
└────────────────────────────────────────┘
```

#### CSS de Campos

```css
.form-group {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 8px;
}

.form-label .required {
  color: #ef4444;
  margin-left: 4px;
}

.form-input,
.form-textarea,
.form-select {
  padding: 10px 12px;
  border: 1px solid #475569;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.2);
  color: #e2e8f0;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #6b7280;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #2563eb;
  background-color: rgba(37, 99, 235, 0.05);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-input:disabled {
  background-color: #1e293b;
  color: #6b7280;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

/* Checkbox */
.form-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.form-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #a855f7;  /* Púrpura para checkboxes */
}

.form-checkbox label {
  cursor: pointer;
  font-size: 14px;
  color: #e2e8f0;
  margin: 0;
}

/* Grid layout para campos múltiples */
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.form-row-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
```

---

## GUÍA DE CONSISTENCIA VISUAL ENTRE PANTALLAS

### Patrón de Pantalla Estándar

**Todas las pantallas nuevas DEBEN seguir este patrón (basado en "Gastos & Deducciones"):**

```
┌──────────────────────────────────────────────────────┐
│ HERO SECTION (Gradiente Azul → Teal)                │
│ ─────────────────────────────────────────────────────│
│ Título H1 (32px) + Descripción (14px)                │
│ [Botón Primario] [Botón Secundario]                 │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ KPI CARDS (Grid 2-4 columnas)                        │
│ ────────────────────────────────────────────────────│
│ [Card] [Card] [Card] [Card]                         │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ FILTROS & BÚSQUEDA                                   │
│ ────────────────────────────────────────────────────│
│ [Input] [Dropdown] [Dropdown] [Date] [Limpiar]     │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ TABLA/LISTADO (scrollable)                          │
│ ────────────────────────────────────────────────────│
│ [Header] [Header] [Header] [Header]                │
│ [Row] [Row] [Row] [Row]                            │
│ [Row] [Row] [Row] [Row]                            │
└──────────────────────────────────────────────────────┘
```

### Elementos Obligatorios en Cada Pantalla

- ✅ Hero header con gradiente Azul→Teal
- ✅ Mínimo 2 KPI cards
- ✅ Barra de filtros con inputs/selects
- ✅ Tabla con datos relacionados
- ✅ Botones con acciones contextuales
- ✅ Responsive: Cards en grid, tabla scrolleable
- ✅ Colores consistentes (Azul primario, Teal secundario)

### Ejemplo de INCONSTENCIA Visual (¿QUÉ NO HACER?)

**Pantalla "Suscripciones" - Problemas Identificados:**

| Problema | Localización | Solución |
|----------|--------------|----------|
| Colores diferentes (púrpura) | Header hero | Usar Azul→Teal siempre |
| Sidebar ocupando espacio | Lateral izquierda | Estructura diferente al estándar |
| Layout completamente diferente | Todo | Seguir patrón "Gastos & Deducciones" |
| Tipografía inconsistente | Headers | Mantener escala tipográfica |
| Grid de cards diferente | KPI section | 4 columnas máximo en una fila |

### Regla de Oro para Nuevas Pantallas

> **Si una pantalla no se parece visualmente a "Gastos & Deducciones", es incorrecta y será rechazada.**

**Excepciones permitidas:**
- Tablas con más/menos columnas (estructura base igual)
- Cards con diferentes datos (estilo visual igual)
- Leyendas o descripciones adicionales (sin cambiar estructura)

**Excepciones NO permitidas:**
- Cambiar colores de gradiente
- Usar fondos sólidos en hero sections
- Cambiar tipografía base
- Omitir KPI cards si son relevantes
- Añadir sidebars o layouts radicalmente diferentes

---

## INSTRUCCIONES FINALES PARA AGENTES IA

### Resumen Ejecutivo

1. **ANTES de desarrollar**: Leer secciones [Requisitos Inmutables](#requisitos-inmutables) + [Guía de Diseño Visual](#guía-de-diseño-visual---anclora-flow)
2. **DURANTE desarrollo**: Aplicar exactamente estructuras CSS de [Configuración CSS Base](#configuración-css-base) + [Componentes](#especificación-de-botones)
3. **DESPUÉS de desarrollar**: 
   - Validar viewport (sección [Validación Obligatoria](#validación-obligatoria))
   - Validar diseño visual (comparar con "Gastos & Deducciones")
4. **EN CASO DE FALLA**: Consultar [Troubleshooting](#troubleshooting)
5. **AL ENTREGAR**: Usar formato de [Protocolos de Entrega](#protocolos-de-entrega)

### Comando de Validación Rápido

Para verificar rápidamente si un feature cumple:

```bash
# En consola del navegador (F12)
(() => {
  const w = window.innerWidth, h = window.innerHeight;
  const sw = document.documentElement.scrollWidth, sh = document.documentElement.scrollHeight;
  return {
    válido: w === sw && h === sh,
    viewport: `${w}x${h}`,
    scroll: `${sw}x${sh}`,
    h_scroll: w < sw,
    v_scroll: h < sh
  };
})()
```

### Checklist Completo Antes de "Está Listo"

**VIEWPORT:**
- [ ] Ejecuté validación en 4 resoluciones
- [ ] Todos los tests dieron `is_valid: true`
- [ ] Testeé redimensionamiento dinámico sin scrollbars
- [ ] Revisé CSS para `overflow: hidden` en contenedor principal

**DISEÑO VISUAL:**
- [ ] Hero header con gradiente Azul→Teal (si aplica)
- [ ] KPI cards en grid 2-4 columnas (si aplica)
- [ ] Filtros con estructura consistente
- [ ] Tabla scrolleable con headers sticky
- [ ] Botones con colores correctos (Azul primario, Teal secundario)
- [ ] Modales con footer alineado derecha
- [ ] Tipografía consistente (escalas, pesos)
- [ ] Colores de paleta oficial (no otros)

**GENERAL:**
- [ ] No hay `position: fixed` o `absolute` sin consideración de viewport
- [ ] Documenté cambios en archivo CSS
- [ ] Adjunto evidence (screenshot/video) de validación visual
- [ ] Comparé visualmente con "Gastos & Deducciones"
- [ ] NO parece "Suscripciones" (ejemplo negativo)

---

**ESTA ES LA ÚNICA FUENTE DE VERDAD PARA VIEWPORT Y DISEÑO EN ANCLORA FLOW.**

**Versión:** 3.0 - Enero 2026 (Incluye Guía Visual Completa)  
**Aplicable a:** Codex, Antigravity y cualquier agente IA desarrollando para Anclora Flow  
**Estado:** VINCULANTE - Sin excepciones  
**Referencia de Diseño:** Pantalla "Gastos & Deducciones"  
**Ejemplo Negativo:** Pantalla "Suscripciones"
