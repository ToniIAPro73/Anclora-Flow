/**
 * UTILIDADES CENTRALIZADAS DE FORMATO
 * Usar estas funciones en TODA la aplicación para consistencia
 */

/**
 * Formatea un número como moneda EUR con separador de miles
 * @param {number|string} value - Valor a formatear
 * @returns {string} - Valor formateado como "1.234,56 €"
 */
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

/**
 * Formatea una fecha en formato español
 * @param {string|Date} value - Fecha a formatear 
 * @returns {string} - Fecha formateada como "15 ene 2024"
 */
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

/**
 * Formatea una fecha en formato corto
 * @param {string|Date} value - Fecha a formatear
 * @returns {string} - Fecha formateada como "15/01/2024"
 */
export function formatDateShort(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '—';
  
  return date.toLocaleDateString('es-ES');
}

/**
 * Formatea un número con separador de miles
 * @param {number|string} value - Valor a formatear
 * @param {number} decimals - Número de decimales (por defecto 0)
 * @returns {string} - Número formateado como "1.234" o "1.234,56"
 */
export function formatNumber(value, decimals = 0) {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return '0';
  
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(parsed);
}

/**
 * Formatea un porcentaje
 * @param {number|string} value - Valor a formatear (0-100)
 * @returns {string} - Porcentaje formateado como "21,00%"
 */
export function formatPercent(value) {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return '0%';
  
  return new Intl.NumberFormat('es-ES', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(parsed / 100);
}

/**
 * Sanitiza un número (convierte string a número)
 * @param {any} value - Valor a sanitizar
 * @param {number} fallback - Valor por defecto si no es válido
 * @returns {number} - Número sanitizado
 */
export function sanitizeNumber(value, fallback = 0) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Formatea una fecha para input type="date"
 * @param {string|Date} dateValue - Fecha a formatear
 * @returns {string} - Fecha en formato ISO "2024-01-15"
 */
export function formatDateForInput(dateValue) {
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
}

// Exportar versión legacy para compatibilidad
if (typeof window !== 'undefined') {
  window.formatCurrency = formatCurrency;
  window.formatDate = formatDate;
  window.formatNumber = formatNumber;
  window.sanitizeNumber = sanitizeNumber;
  window.formatDateForInput = formatDateForInput;
}
