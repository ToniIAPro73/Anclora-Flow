# Solución: Unificación de colores de selección en tablas

## Problema identificado

El CSS compilado (`frontend/src/dist/assets/index-BxiOHdOH.css`) contiene estilos antiguos y **no incluye** los nuevos estilos `.is-selected` que se agregaron al archivo fuente `frontend/src/styles/colors.css`.

### Diagnóstico
- **Archivo fuente**: `frontend/src/styles/colors.css` (3,307 líneas) ✅ Contiene estilos correctos
- **Archivo compilado**: `frontend/src/dist/assets/index-BxiOHdOH.css` (1 línea minificada) ❌ **NO contiene** `.is-selected`

El navegador carga el CSS compilado viejo, por eso:
- ✅ Tabla de clientes funciona (tiene estilos propios o inline)
- ❌ Tabla de facturas NO funciona (depende de los estilos `.is-selected` que no están en el compilado)

## Solución

### Método automático (Recomendado)

Ejecuta el script PowerShell incluido:

```powershell
.\REBUILD_CSS.ps1
```

Este script:
1. Elimina `frontend\src\dist` (directorio con CSS compilado viejo)
2. Elimina `frontend\node_modules\.vite` (caché de Vite)
3. Proporciona instrucciones para reiniciar el servidor

### Método manual

Si prefieres hacerlo manualmente:

```powershell
# 1. Eliminar dist compilado
Remove-Item -Recurse -Force frontend\src\dist

# 2. Eliminar caché de Vite
Remove-Item -Recurse -Force frontend\node_modules\.vite

# 3. Reiniciar servidor
cd frontend
npm run dev
```

### Pasos finales (Ambos métodos)

Después de ejecutar la limpieza:

1. **Reinicia el servidor** si aún no lo has hecho
2. **Limpia el caché del navegador**: Ctrl+Shift+Delete
3. **Recarga forzada**: Ctrl+F5

## Cambios implementados

### 1. CSS unificado (frontend/src/styles/colors.css)

- Bordes verticales entre columnas para todas las tablas
- Colores de selección uniformes:
  - Tema claro: `rgba(59, 130, 246, 0.15)`
  - Tema oscuro: `rgba(37, 99, 235, 0.35)`
- Selectores aplicados a: invoices, clients, expenses, budgets, subscriptions

### 2. Funcionalidad de selección (frontend/src/pages/invoices.js)

- Variable de estado: `selectedInvoiceId`
- Clase `.is-selected` aplicada dinámicamente
- Event listener para clics en filas

### 3. Corrección de clases CSS en HTML

- `clients.js`: Cambiado a `.clients-table__row`
- `budget.js`: Cambiado a `.budgets-table__row`
- `subscriptions.js`: Cambiado a `.subscriptions-table__row`
- `expenses.js`: Simplificado a `.expenses-table__row`

## Verificación

Una vez aplicada la solución, todas las tablas deberían:
- Tener el mismo color de fila seleccionada
- Mostrar bordes verticales entre columnas
- Mantener consistencia visual en temas claro y oscuro
