# MODAL 1: CREAR GASTO - ANÁLISIS

**Versión:** 1.0  
**Fecha:** 20 Enero 2026  
**Base:** expenses.js + Expenses.tsx  
**Estado:** 30% Implementado

---

## 🔍 CÓDIGO ACTUAL VS ESPECIFICACIÓN

### Campos Existentes
- **Categoría:** Input básico (debería ser selector).
- **Descripción:** Textarea.
- **Importe:** Input number.

### Validaciones Faltantes (ESPECIFICACIÓN)
- ✅ **Importe > 0:** El código actual no lo valida estrictamente.
- ✅ **Categoría Obligatoria:** Falta control visual.
- ✅ **Comprobante:** No hay zona de "Dropzone" o "Upload" funcional en la versión JS.

---

## 🛠️ RECOMENDACIONES TÉCNICAS
1. Usar el mismo sistema de `SetupForm` que se usa en facturas para mantener la consistencia.
2. Aplicar `DIRECTRICES-VIEWPORT-ANCLORA-FLOW.md` para el centrado de campos y footer.
