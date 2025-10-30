# PowerShell script to create a Pull Request to master branch

# Set variables
$SourceBranch = "claude/unify-table-selection-colors-011CUdEgYjQs3rS7yFscFkr4"
$TargetBranch = "master"
$PRTitle = "Unificar colores de selección y estilos de tablas"
$PRBody = @"
## Resumen

Este PR unifica completamente los colores de selección y estilos visuales de todas las tablas de la aplicación (facturas, clientes, gastos, presupuestos y suscripciones) para que tengan una apariencia consistente.

## Problema identificado

Las tablas de la aplicación tenían estilos inconsistentes:

1. **Colores de selección diferentes**: La tabla de clientes mostraba un color de selección distinto al resto de tablas
2. **Barras verticales faltantes**: Solo la tabla de clientes tenía bordes verticales entre columnas
3. **Clases CSS mezcladas**: Algunas tablas usaban clases de otras tablas (ej: clientes usando `invoices-table__surface`)

## Cambios realizados

### 1. Unificación de clases CSS

**Archivos modificados:**
- `frontend/src/styles/colors.css` - Agregadas todas las clases de tabla a los selectores CSS
- `frontend/src/pages/clients.js` - Cambiadas clases para usar las específicas de clientes
- `frontend/src/pages/budget.js` - Clase `invoices-table__row` → `budgets-table__row`
- `frontend/src/pages/subscriptions.js` - Clase `invoices-table__row` → `subscriptions-table__row`
- `frontend/src/pages/expenses.js` - Simplificado a solo `expenses-table__row`

### 2. Barras verticales entre columnas

Agregado `border-right` a todas las celdas de todas las tablas:
```css
.invoices-table tbody td,
.clients-table tbody td,
.expenses-table tbody td,
.budgets-table tbody td,
.subscriptions-table tbody td {
  border-right: 1px solid rgba(148, 163, 184, 0.15);
}

td:last-child {
  border-right: none;
}
```

### 3. Color de selección unificado

Definido un color específico aplicado a TODAS las tablas:
- **Tema claro**: `rgba(59, 130, 246, 0.15)` - Azul brillante con 15% opacidad
- **Tema oscuro**: `rgba(37, 99, 235, 0.35)` - Azul brillante con 35% opacidad

## Test plan

- [ ] Reiniciar servidor de desarrollo (`npm run dev`)
- [ ] Limpiar caché del navegador (Ctrl+Shift+R)
- [ ] Verificar tabla de **Facturas**: color de selección y barras verticales
- [ ] Verificar tabla de **Clientes**: mismo color y barras verticales
- [ ] Verificar tabla de **Gastos**: mismo color y barras verticales
- [ ] Verificar tabla de **Presupuestos**: mismo color y barras verticales
- [ ] Verificar tabla de **Suscripciones**: mismo color y barras verticales
- [ ] Comprobar en **tema claro** y **tema oscuro**
- [ ] Todas las tablas deben verse idénticas en términos de:
  - Color de fila seleccionada
  - Barras verticales entre columnas
  - Estilos de superficie y paginación

## Resultado esperado

✅ Todas las tablas con el mismo color de selección azul brillante  
✅ Todas las tablas con barras verticales entre columnas  
✅ Apariencia visual 100% uniforme en toda la aplicación  
✅ Clases CSS específicas para cada tabla sin mezclas

## Commits incluidos

- `c4854fd` - fix: Corregir clases CSS de tablas para unificar colores de selección
- `215b9e5` - fix: Unificar completamente las clases CSS de todas las tablas
- `e6458ac` - docs: Agregar instrucciones para aplicar cambios CSS
- `8368251` - feat: Agregar barras verticales y color de selección intenso a todas las tablas
- `8a5002f` - fix: Unificar color de selección de filas en todas las tablas
"@

# Check if gh CLI is available
try {
    $null = Get-Command gh -ErrorAction Stop
    Write-Host "GitHub CLI detected. Creating PR..." -ForegroundColor Green
    
    # Create PR using gh CLI
    $prCommand = gh pr create `
        --title $PRTitle `
        --body $PRBody `
        --base $TargetBranch `
        --head $SourceBranch `
        --web
    
    if ($prCommand) {
        Write-Host "PR created successfully!" -ForegroundColor Green
        Write-Host "Opening PR in browser..." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "GitHub CLI not found. Please install it or create PR manually." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual steps to create PR:" -ForegroundColor Cyan
    Write-Host "1. Go to GitHub repository" -ForegroundColor White
    Write-Host "2. Click 'New pull request'" -ForegroundColor White
    Write-Host "3. Select base: $TargetBranch" -ForegroundColor White
    Write-Host "4. Select compare: $SourceBranch" -ForegroundColor White
    Write-Host "5. Title: $PRTitle" -ForegroundColor White
    Write-Host "6. Copy the above description" -ForegroundColor White
    Write-Host "7. Click 'Create pull request'" -ForegroundColor White
    
    # Try to open GitHub in browser
    try {
        Start-Process "https://github.com/new"
        Write-Host "GitHub page opened in browser" -ForegroundColor Green
    }
    catch {
        Write-Host "Could not open browser automatically" -ForegroundColor Red
    }
}