# MODAL 3: EDITAR GASTO - ANÁLISIS

**Versión:** 1.0  
**Fecha:** 20 Enero 2026  
**Tipo:** Modal Form

---

## 🔍 RESTRICCIONES DE EDICIÓN
- Si el gasto ya ha sido incluido en un modelo tributario, la edición debe estar bloqueada o requerir un motivo de rectificación.
- **Campos bloqueados:** ID de transacción (si viene de banco).
- **Campos editables:** Categoría, Notas, Deducibilidad.

---

## 🛠️ AUDITORÍA
Cualquier cambio en el importe debe registrarse en la tabla de logs (similar a `invoice_audit_log`).
