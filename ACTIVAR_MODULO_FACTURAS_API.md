# 🚀 Activar Módulo de Facturas con API y Verifactu

Guía rápida para activar el nuevo módulo de facturas que conecta con la API real y tiene Verifactu completamente funcional.

## ✅ Lo Que Tienes Ahora

He creado un nuevo archivo: **`frontend/src/pages/invoices-with-api.js`**

Este módulo incluye:
- ✅ Conexión completa con el backend API
- ✅ Carga dinámica de facturas desde la base de datos
- ✅ Registro en Verifactu con un clic
- ✅ Modales para ver QR y CSV
- ✅ Notificaciones visuales
- ✅ Estados de carga
- ✅ Manejo de errores
- ✅ Filtros funcionales
- ✅ Actualización en tiempo real

## 🔧 Cómo Activarlo

### Opción 1: Reemplazar el Archivo Actual (Recomendado)

```powershell
# Desde el directorio raíz de Anclora-Flow

# 1. Hacer backup del archivo original
Copy-Item frontend\src\pages\invoices.js frontend\src\pages\invoices.js.backup

# 2. Reemplazar con el nuevo
Copy-Item frontend\src\pages\invoices-with-api.js frontend\src\pages\invoices.js -Force

# 3. Listo!
```

### Opción 2: Probar Sin Reemplazar

```powershell
# Edita frontend/src/main.js

# Cambia esta línea:
# import renderInvoices from "./pages/invoices.js";

# Por esta:
# import renderInvoices from "./pages/invoices-with-api.js";
```

## 📋 Prerequisitos

### 1. Backend Corriendo

```powershell
# Asegúrate de que el backend esté corriendo
cd backend
npm start

# Deberías ver:
# 🚀 Backend escuchando en http://localhost:8020
# ✅ Verifactu API: http://localhost:8020/api/verifactu
```

### 2. Base de Datos con Migración Aplicada

```powershell
# Verifica que la migración de Verifactu esté aplicada
docker exec anclora-postgres psql -U postgres -d anclora_flow -c "\d invoices" | Select-String "verifactu"

# Deberías ver columnas verifactu_*
```

### 3. Usuario Creado

Necesitas un usuario registrado. Dos opciones:

**Opción A: Crear desde el frontend**
```
1. Abre http://localhost:3020/register.html
2. Regístrate con tus datos
3. Serás redirigido automáticamente
```

**Opción B: Crear desde PowerShell**
```powershell
$body = @{
    name = "Usuario Test"
    email = "test@anclora.com"
    password = "password123"
    nif = "12345678A"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:8020/api/auth/register" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

$token = $response.token
Write-Host "Token guardado: $token"
```

## 🎯 Flujo Completo de Prueba

### Paso 1: Iniciar Backend

```powershell
cd backend
npm start
```

### Paso 2: Iniciar Frontend

```powershell
# En otra terminal
cd frontend
npm run dev
```

### Paso 3: Registrarte/Login

```
1. Abre http://localhost:3020/register.html
2. Crea una cuenta
3. Serás redirigido a http://localhost:3020/
```

### Paso 4: Ir al Módulo de Facturas

```
1. En el sidebar, haz clic en "Facturas"
2. Verás el módulo cargando facturas desde la API
```

### Paso 5: Crear Primera Factura (Desde API)

```powershell
# Usa el token de tu login
$token = "tu_token_aqui"  # Lo obtienes del localStorage en el navegador

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$invoice = @{
    invoice_number = "F2025-001"
    client_name = "Cliente Ejemplo SL"
    client_email = "cliente@ejemplo.com"
    client_nif = "B12345678"
    issue_date = "2025-01-15"
    due_date = "2025-02-15"
    subtotal = 1000.00
    tax = 210.00
    total = 1210.00
    status = "sent"
    notes = "Factura de prueba"
} | ConvertTo-Json

$newInvoice = Invoke-RestMethod `
    -Uri "http://localhost:8020/api/invoices" `
    -Method Post `
    -Headers $headers `
    -Body $invoice

Write-Host "Factura creada con ID: $($newInvoice.id)"
```

### Paso 6: Ver la Factura en el Frontend

```
1. Recarga la página de facturas (botón 🔄 Recargar)
2. Verás tu factura con estado: ⚪ No registrada
```

### Paso 7: Registrar en Verifactu

```
1. Haz clic en el botón 📋 de la factura
2. Verás notificación: "Registrando factura en Verifactu..."
3. Estado cambia a ⏳ Pendiente
4. Después cambia a ✅ Registrada
5. Verás notificación: "Factura registrada en Verifactu correctamente"
```

### Paso 8: Ver QR y CSV

```
1. Haz clic en el botón 🔲 (Ver QR)
   → Se abre modal mostrando código QR y CSV

2. Haz clic en el botón 🔐 (Ver CSV)
   → Se abre modal mostrando el CSV en grande
   → Puedes copiarlo al portapapeles
```

## 🎨 Qué Verás en la UI

### Estado Inicial (Sin Facturas)
```
┌────────────────────────────────────────────────────┐
│                                                    │
│         No hay facturas todavía                    │
│    Crea tu primera factura para empezar           │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Estado de Carga
```
┌────────────────────────────────────────────────────┐
│                                                    │
│              🔄 (animado)                          │
│           Cargando facturas...                     │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Con Facturas
```
┌─────────┬──────────┬─────────┬──────────┬───────────┐
│ Factura │ Cliente  │ Total   │ Estado   │ Verifactu │
├─────────┼──────────┼─────────┼──────────┼───────────┤
│ F2025-1 │ Cliente  │ 1.210€  │ Enviada  │ ⚪ No reg │
│         │          │         │          │ [📋 Reg]  │
└─────────┴──────────┴─────────┴──────────┴───────────┘
```

### Después de Registrar
```
┌─────────┬──────────┬─────────┬──────────┬───────────┐
│ Factura │ Cliente  │ Total   │ Estado   │ Verifactu │
├─────────┼──────────┼─────────┼──────────┼───────────┤
│ F2025-1 │ Cliente  │ 1.210€  │ Enviada  │ ✅ Regist │
│         │          │         │          │ [🔲][🔐]  │
└─────────┴──────────┴─────────┴──────────┴───────────┘
```

### Modal de QR
```
╔═══════════════════════════════════════╗
║   Código QR - Verifactu              ║
║   Factura F2025-001                  ║
╠═══════════════════════════════════════╣
║                                       ║
║   CSV: 4A2F9E8B1C6D5A3E              ║
║                                       ║
║   ┌─────────────────┐                ║
║   │                 │                ║
║   │   [Código QR]   │                ║
║   │                 │                ║
║   └─────────────────┘                ║
║                                       ║
║   Escanea para verificar en AEAT     ║
║                                       ║
╠═══════════════════════════════════════╣
║  [Cerrar]      [Descargar QR]        ║
╚═══════════════════════════════════════╝
```

### Notificaciones

```
Esquina superior derecha:
┌────────────────────────────────────┐
│ ✅ Factura registrada correctamente│
│                                [×] │
└────────────────────────────────────┘
```

## 🔍 Cómo Obtener el Token del Navegador

Si necesitas el token para hacer peticiones desde PowerShell:

```javascript
// Abre la consola del navegador (F12)
// Y ejecuta:
localStorage.getItem('auth_token')

// Copia el resultado
```

## 🐛 Troubleshooting

### Error: "Servicio API no disponible"

**Problema:** El archivo `api.js` no está cargado

**Solución:** Asegúrate de que en tu `index.html` o archivo principal tengas:

```html
<script type="module" src="/src/services/api.js"></script>
```

### Error: "No se pudo conectar con el servidor"

**Problema:** El backend no está corriendo

**Solución:**
```powershell
cd backend
npm start
```

### No veo mis facturas

**Problema:** No estás autenticado o no tienes facturas

**Solución:**
1. Verifica que estés logueado
2. Crea facturas desde la API (ver Paso 5 arriba)
3. Recarga el módulo

### El botón de registrar no hace nada

**Problema:** Errores de JavaScript en consola

**Solución:**
1. Abre consola del navegador (F12)
2. Mira los errores
3. Verifica que `window.api` esté definido: `typeof window.api`

### Estado se queda en "Pendiente"

**Problema:** Error en el backend durante el registro

**Solución:**
1. Revisa logs del backend
2. Verifica que la migración de Verifactu esté aplicada
3. Mira los logs: `GET /api/verifactu/logs`

## 📊 Funcionalidades Disponibles

### Desde la UI

✅ Ver lista de facturas desde DB
✅ Filtrar por texto/estado
✅ Ver estados de Verifactu en tiempo real
✅ Registrar factura con un clic
✅ Ver QR en modal
✅ Ver CSV en modal
✅ Copiar CSV al portapapeles
✅ Descargar QR como imagen
✅ Notificaciones de éxito/error
✅ Recargar lista
✅ Estados de carga

### Desde la API (PowerShell)

✅ Crear facturas
✅ Listar facturas
✅ Registrar en Verifactu
✅ Ver estadísticas
✅ Ver logs
✅ Verificar cadena blockchain

## 🎉 ¡Listo!

Ahora tienes el módulo de facturas **completamente funcional** con:
- Datos reales de la base de datos
- Verifactu funcionando al 100%
- UI moderna y responsiva
- Manejo completo de estados y errores

## 📝 Próximos Pasos (Opcional)

1. **Formulario de Nueva Factura:** Conectar el modal de "Nueva factura" con la API
2. **Edición de Facturas:** Implementar edición inline
3. **Dashboard con Estadísticas:** Mostrar métricas de Verifactu
4. **Exportación a PDF:** Generar PDFs con QR incluido
5. **Batch Registration:** Registrar múltiples facturas a la vez

---

**¿Necesitas ayuda?** Revisa los logs del navegador (F12) y del backend para diagnosticar problemas.
