# Documento técnico‑funcional (paso a paso) — Envío de facturas a Verifactu

Basado en análisis real del repo. Referencias clave:
- Backend Verifactu: backend/src/api/verifactu/controller.ts, backend/src/api/verifactu/routes.ts, backend/src/services/verifactu.service.ts
- Backend Invoices: backend/src/api/invoices/controller.ts, backend/src/api/invoices/routes.ts, backend/src/repositories/invoice.repository.ts, backend/src/types/invoice.ts, backend/src/database/migrations/001_add_verifactu_fields.sql
- Frontend actual (React): frontend/src/pages/Invoices/Invoices.tsx, frontend/src/services/api.js
- Frontend legacy con flujo completo Verifactu (referencia UX): frontend/src/pages/invoices-with-api.js, frontend/src/pages/invoices.js.backup_2
- Documento interno: VERIFACTU_INTEGRATION.md

---

## 1) Objetivo funcional
Permitir que el usuario registre (“envíe”) una factura en Verifactu desde el módulo de Ingresos & Facturas, y que pueda:
- Ver el estado Verifactu en la tabla.
- Lanzar el registro (y reintentar en error).
- Consultar QR/CSV una vez registrada.

---

## 2) Estado actual del sistema (ya existe)
### Backend
- Endpoint para registrar: POST /api/verifactu/register/:invoiceId
- Servicio de registro y generación de hash/QR/CSV: backend/src/services/verifactu.service.ts
- Persistencia de campos Verifactu en invoices (migración): backend/src/database/migrations/001_add_verifactu_fields.sql
- Configuración por usuario en verifactu_config
- Logs en verifactu_logs

### Frontend
- Cliente API con método: api.registerInvoiceVerifactu(id)
- UI React actual NO integra acciones Verifactu (solo tabla básica)
- Existe un flujo funcional completo en archivos legacy (JS puro) para guiar la UX:
  - frontend/src/pages/invoices-with-api.js
  - frontend/src/pages/invoices.js.backup_2

---

## 3) Modelo de datos y estados
### Invoice.status (negocio)
- draft | sent | paid | overdue | cancelled

### Invoice.verifactu_status (BD)
- not_registered | pending | registered | error | cancelled

### Nota de tipado
En backend/src/types/invoice.ts el tipo VerifactuStatus solo incluye: pending | registered | error.
Recomendación: añadir not_registered y cancelled para alinear con BD y UI.

---

## 4) Contrato API real
### Registro Verifactu
POST /api/verifactu/register/:invoiceId

Respuesta real:
{
  "message": "Factura registrada en Verifactu correctamente",
  "data": {
    "success": true,
    "verifactuId": "...",
    "csv": "...",
    "qrCode": "...",
    "url": "...",
    "hash": "...",
    "chainIndex": 12
  }
}

El endpoint NO devuelve la factura actualizada.
El frontend debe refetch con:
- GET /api/invoices/:id
- o GET /api/verifactu/status/:invoiceId

---

## 5) Flujo funcional (usuario)
1. Usuario entra a Ingresos & Facturas (lista).
2. Ve una columna “Verifactu” con estado: No registrada / Pendiente / Registrada / Error.
3. En una factura elegible, pulsa “Registrar en Verifactu”.
4. Sistema valida:
   - Verifactu habilitado en config del usuario.
   - Factura no está en draft ni cancelled.
5. Si OK:
   - Se envía la factura.
   - UI muestra “Pendiente” mientras la llamada está en curso.
6. Éxito:
   - Estado pasa a “Registrada”.
   - Se habilitan acciones “Ver QR” y “Ver CSV”.
7. Error:
   - Estado “Error” con tooltip del mensaje.
   - Permitir “Reintentar”.

---

## 6) Flujo técnico (paso a paso para Claude Code)

### Paso 1 — Verifica backend disponible
- POST /api/verifactu/register/:invoiceId existe y funciona.
- GET /api/verifactu/status/:invoiceId devuelve estado.
- Migración 001_add_verifactu_fields.sql aplicada en el entorno.

### Paso 2 — Ajusta modelo y typings (si tocas frontend TS)
- Añadir estados faltantes al tipo VerifactuStatus (not_registered, cancelled).
- Asegurar mapeo camelCase desde la API (verifactu_status -> verifactuStatus).

### Paso 3 — UI en React
En frontend/src/pages/Invoices/Invoices.tsx:
- Añadir columna “Verifactu” con badge/estado.
- Añadir acciones contextuales:
  - Registrar en Verifactu
  - Ver QR
  - Ver CSV
  - Reintentar (si error)
- Integrar react-query para mutación registerInvoiceVerifactu + refetch.

### Paso 4 — Integración de acciones
- Registrar:
  - Llamar api.registerInvoiceVerifactu(invoice.id)
  - Estado pending en UI mientras ejecuta
  - On success: refetch invoice o lista
- Reintentar:
  - Igual que registrar si status error
- Ver QR/CSV:
  - Modal con verifactuQrCode, verifactuCsv, verifactuUrl
  - Si falta QR, generar fallback usando verifactuUrl o verifactuHash
  - Referencia funcional: frontend/src/pages/invoices-with-api.js

### Paso 5 — Validaciones previas en UI
Deshabilitar registro si:
- invoice.status === 'draft'
- invoice.status === 'cancelled'

### Paso 6 — Configuración Verifactu (opcional pero recomendado)
- Usar api.getVerifactuConfig() y api.updateVerifactuConfig()
- Si enabled === false, bloquear registro y mostrar CTA de configuración
- Referencia funcional completa en frontend/src/pages/invoices-with-api.js

---

## 7) Reglas de negocio clave (backend las aplica)
- No se pueden registrar facturas en draft ni cancelled.
- Debe existir config y estar enabled.
- Si ya está registered, el service lanza error.

---

## 8) Mensajes UX recomendados
- “Registrando factura en Verifactu…” (info)
- “Factura registrada en Verifactu correctamente” (success)
- “Verifactu no está habilitado. Configura el módulo.” (warning)
- “No se pueden registrar borradores” (warning)
- “Error al registrar. Reintenta.” (error)

---

## 9) Testing mínimo sugerido
1) Factura draft → botón registrar deshabilitado.
2) Factura sent → registrar OK → estado registered.
3) Config disabled → mostrar error y permitir reintento.
4) Ver QR/CSV en factura registrada.

---

## 10) Notas técnicas
- El endpoint de registro no devuelve la factura actualizada; siempre refetch.
- El tipo VerifactuStatus actual en TS no incluye not_registered.
- En el React actual, la tabla usa number; la API devuelve invoiceNumber.
  Recomendar normalizar o mapear antes de renderizar.
