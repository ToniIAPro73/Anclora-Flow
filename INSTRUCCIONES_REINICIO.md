# Instrucciones para aplicar los cambios de CSS

## El problema
El navegador está usando CSS en caché. Los cambios que hemos hecho en `colors.css` no se están aplicando porque el servidor de desarrollo necesita reiniciarse.

## Solución

### 1. Detener el servidor de desarrollo
Si tienes un servidor corriendo (normalmente con `npm run dev`), deténlo con `Ctrl+C`.

### 2. Limpiar la caché del navegador
En tu navegador, haz una **recarga forzada**:
- **Chrome/Edge**: `Ctrl + Shift + R` (Windows/Linux) o `Cmd + Shift + R` (Mac)
- **Firefox**: `Ctrl + F5` (Windows/Linux) o `Cmd + Shift + R` (Mac)
- O abre las DevTools (F12) → pestaña Network → marca "Disable cache"

### 3. Reiniciar el servidor de desarrollo
```bash
cd /home/user/Anclora-Flow/frontend
npm run dev
```

### 4. Verificar los cambios
- Abre la aplicación en el navegador
- Ve a la tabla de Clientes
- Ve a la tabla de Facturas
- Verifica que el color de selección sea el mismo en ambas

## Qué cambios se hicieron

### Archivos modificados:
1. **frontend/src/styles/colors.css**:
   - Agregadas clases para todas las tablas (.clients-table, .budgets-table, .subscriptions-table)
   - Unificados todos los selectores CSS de tablas

2. **frontend/src/pages/clients.js**:
   - Cambiadas las clases de HTML para usar clases específicas de clientes

### Color de selección unificado:
- **Tema claro**: `rgba(51, 102, 255, 0.08)`
- **Tema oscuro**: `rgba(30, 64, 175, 0.25)`

Todos aplicados con `!important` para asegurar consistencia.
