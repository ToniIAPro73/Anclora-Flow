// Utilidad centralizada para formateo de moneda
// Usar en TODOS los archivos del frontend para consistencia

export function formatCurrency(value) {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return '0,00 €';
  
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(parsed);
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '—';
  
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatNumber(value, decimals = 0) {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return '0';
  
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(parsed);
}
