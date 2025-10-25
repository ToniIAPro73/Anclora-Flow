# 👤 Usuario Demo para Desarrollo

Este documento explica cómo usar el usuario de prueba preconfigurado en Anclora Flow.

## 🔑 Credenciales del Usuario Demo

```
Email:      demo@ancloraflow.com
Contraseña: demo123
NIF:        12345678A
```

---

## 🔧 Configuración Inicial (Solo Primera Vez)

**⚠️ IMPORTANTE:** Antes de usar el usuario demo por primera vez, ejecuta:

```powershell
.\setup-demo-user.ps1
```

Este script:
- ✅ Agrega la columna `nif` a la tabla `users` (si no existe)
- ✅ Crea/actualiza el usuario demo con las credenciales
- ✅ Verifica que todo esté correcto

**Solo necesitas ejecutarlo UNA VEZ** cuando configures el proyecto por primera vez.

---

## 🚀 Método 1: Script Automático de Login (Más Rápido)

### Paso 1: Asegúrate de que el backend esté corriendo

```powershell
cd backend
.\start.ps1
```

### Paso 2: Ejecuta el script de login automático

```powershell
# Desde la raíz del proyecto
.\login-demo.ps1
```

Este script:
- ✅ Hace login con el usuario demo
- ✅ Obtiene el token JWT
- ✅ Lo copia al portapapeles
- ✅ Te muestra el comando para pegarlo en el navegador

### Paso 3: Abre el navegador y pega el código

1. Abre: `http://localhost:5173`
2. Presiona **F12** (DevTools) > **Console**
3. Pega el comando que te mostró el script
4. Presiona **Enter**
5. ¡Listo! Ya estás logueado

---

## 🔧 Método 2: Login Manual desde PowerShell

### Hacer Login

```powershell
$loginBody = @{
    email = "demo@ancloraflow.com"
    password = "demo123"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:8020/api/auth/login" `
    -Method Post `
    -Body $loginBody `
    -ContentType "application/json"

$token = $response.token
Write-Host "Token: $token"
```

### Guardar en el Navegador

1. Abre `http://localhost:5173`
2. Presiona **F12** > **Console**
3. Ejecuta (reemplaza `YOUR_TOKEN`):

```javascript
localStorage.setItem('auth_token', 'YOUR_TOKEN');
localStorage.setItem('user_data', JSON.stringify({
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Usuario Demo',
    email: 'demo@ancloraflow.com',
    nif: '12345678A'
}));
location.reload();
```

---

## 🗄️ Verificar que el Usuario Existe en la Base de Datos

```powershell
docker exec anclora-postgres psql -U postgres -d anclora_flow -c "SELECT id, email, name, nif FROM users WHERE email='demo@ancloraflow.com';"
```

Deberías ver:

```
                  id                  |        email         |    name      |    nif
--------------------------------------+----------------------+--------------+------------
 00000000-0000-0000-0000-000000000001 | demo@ancloraflow.com | Usuario Demo | 12345678A
```

---

## 🔄 Recrear el Usuario Demo

Si el usuario no existe o tiene problemas, recréalo:

```powershell
# Copiar script actualizado
docker cp backend/src/database/init.sql anclora-postgres:/tmp/init.sql

# Ejecutar la parte de inserción de usuario
docker exec anclora-postgres psql -U postgres -d anclora_flow -c "
INSERT INTO users (id, email, name, password_hash, nif, auth_provider, language, theme)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@ancloraflow.com',
    'Usuario Demo',
    '\$2b\$10\$f84.n1jsCMZnFHRBU8uXXueQxu0TNT1Sm9HN8EyerXUQ2XQWY58ii',
    '12345678A',
    'local',
    'es',
    'light'
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    nif = EXCLUDED.nif;
"
```

---

## 🧪 Probar el Usuario Demo

### Test 1: Login desde PowerShell

```powershell
.\login-demo.ps1
```

Deberías ver:
```
✅ Login exitoso!
👤 Usuario:
   Nombre: Usuario Demo
   Email:  demo@ancloraflow.com
   NIF:    12345678A
```

### Test 2: Hacer una Petición Autenticada

```powershell
# Usar el token obtenido
$token = "TU_TOKEN_AQUI"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Ver tus facturas
Invoke-RestMethod `
    -Uri "http://localhost:8020/api/invoices" `
    -Headers $headers
```

---

## 📊 Crear Datos de Prueba

Una vez logueado, puedes crear facturas de prueba:

```powershell
$token = "TU_TOKEN_AQUI"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Crear factura de prueba
$invoice = @{
    invoice_number = "F2025-001"
    client_name = "Cliente Demo SL"
    client_email = "cliente@demo.com"
    client_nif = "B12345678"
    issue_date = "2025-01-20"
    due_date = "2025-02-20"
    subtotal = 1000.00
    tax = 210.00
    total = 1210.00
    status = "sent"
    notes = "Factura de demostración"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:8020/api/invoices" `
    -Method Post `
    -Headers $headers `
    -Body $invoice
```

---

## 🔐 Seguridad

**⚠️ IMPORTANTE:** Este usuario es **solo para desarrollo**.

En producción:
- ❌ NO uses este usuario
- ❌ NO uses la contraseña "demo123"
- ✅ Elimina este usuario del script `init.sql`
- ✅ Cambia el `JWT_SECRET` en `.env`

---

## 🐛 Solución de Problemas

### Error: "Credenciales incorrectas"

**Solución:** Verifica que el usuario exista en la base de datos:

```powershell
docker exec anclora-postgres psql -U postgres -d anclora_flow -c "SELECT email, name FROM users WHERE email='demo@ancloraflow.com';"
```

Si no existe, recréalo con los comandos de la sección "Recrear el Usuario Demo".

### Error: "No se pudo conectar con el servidor"

**Solución:** Asegúrate de que el backend esté corriendo:

```powershell
Invoke-RestMethod http://localhost:8020/api/health
```

### El token expira

Los tokens JWT expiran después de 7 días (configurado en `JWT_EXPIRES_IN`). Simplemente vuelve a ejecutar:

```powershell
.\login-demo.ps1
```

---

## 📚 Siguiente Paso

Una vez logueado, puedes:

1. **Ver Facturas:** Ir a `http://localhost:5173/#/invoices`
2. **Crear Facturas:** Usar el script de PowerShell arriba
3. **Registrar en Verifactu:** Click en el botón 📋 de cada factura
4. **Ver QR y CSV:** Botones 🔲 y 🔐

---

**¡Disfruta desarrollando con Anclora Flow!** 🚀
