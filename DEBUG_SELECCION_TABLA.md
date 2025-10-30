# Script de depuración para tabla de facturas

Abre la consola del navegador (F12) y ejecuta este código para depurar el problema:

```javascript
// 1. Verificar que existe el tbody
const tbody = document.querySelector('.invoices-table tbody');
console.log('¿Existe tbody?', tbody !== null);

// 2. Verificar que existe una fila
const row = document.querySelector('.invoices-table tbody tr[data-invoice-id]');
console.log('¿Existe una fila?', row !== null);
if (row) {
  console.log('  - ID de la fila:', row.dataset.invoiceId);
  console.log('  - Clases de la fila:', row.className);
}

// 3. Verificar el valor de selectedInvoiceId
// (esto solo funciona si la variable es global, que debería ser)
console.log('selectedInvoiceId actual:', window.selectedInvoiceId);

// 4. Simular un clic en la primera fila
if (row) {
  console.log('\n--- Simulando clic en la primera fila ---');
  row.click();

  // Esperar un momento y verificar de nuevo
  setTimeout(() => {
    console.log('Después del clic:');
    console.log('  - Clases de la fila:', row.className);
    console.log('  - ¿Tiene clase is-selected?', row.classList.contains('is-selected'));

    // Verificar estilos computados
    const styles = window.getComputedStyle(row);
    console.log('  - Color de fondo:', styles.backgroundColor);
  }, 500);
}

// 5. Verificar si el CSS tiene la regla .is-selected
const sheets = Array.from(document.styleSheets);
let foundRule = false;
sheets.forEach(sheet => {
  try {
    const rules = Array.from(sheet.cssRules || sheet.rules);
    rules.forEach(rule => {
      if (rule.selectorText && rule.selectorText.includes('is-selected')) {
        console.log('Regla CSS encontrada:', rule.selectorText, '->', rule.style.background);
        foundRule = true;
      }
    });
  } catch(e) {
    // Ignorar hojas de estilo de otros dominios
  }
});
console.log('¿Se encontró regla .is-selected en CSS?', foundRule);
```

## Resultado esperado

Si todo funciona correctamente, deberías ver:

- ✅ `¿Existe tbody?` = true
- ✅ `¿Existe una fila?` = true
- ✅ Después del clic, la fila debe tener la clase `is-selected`
- ✅ El color de fondo debe ser `rgba(37, 99, 235, 0.35)` en tema oscuro

## Si algo falla

Si ves que la clase `is-selected` NO se aplica después del clic, el problema está en el JavaScript.

Si ves que la clase SÍ se aplica pero el color NO cambia, el problema está en el CSS.

Copia y pega TODA la salida de la consola después de ejecutar este script.
