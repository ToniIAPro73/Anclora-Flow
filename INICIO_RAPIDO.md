# 🚀 Guía de Inicio Rápido - Anclora Flow

Esta guía te ayudará a poner en marcha Anclora Flow con todas sus funcionalidades en pocos minutos.

> **💻 ¿Usas Windows?** Ve a [INICIO_RAPIDO_WINDOWS.md](./INICIO_RAPIDO_WINDOWS.md) para instrucciones específicas de PowerShell.

## 📋 Requisitos Previos

- Node.js 20+ instalado
- PostgreSQL 13+ (o Docker para ejecutar la base de datos en contenedor)
- Git

## 🔧 Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd Anclora-Flow
```

### 2. Configurar la Base de Datos

#### Opción A: Usar Docker (Recomendado)

**Linux/Mac:**
```bash
# Iniciar PostgreSQL en Docker
docker run -d \
  --name anclora-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=anclora_flow \
  -p 5452:5432 \
  postgres:13

# Verificar que está corriendo
docker ps | grep anclora-postgres
```

**Windows (PowerShell):**
```powershell
# Iniciar PostgreSQL en Docker (nota el backtick ` para continuar líneas)
docker run -d `
  --name anclora-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=anclora_flow `
  -p 5452:5432 `
  postgres:13

# Verificar que está corriendo
docker ps | Select-String anclora-postgres
```

#### Opción B: PostgreSQL Local

```bash
# Crear base de datos
psql -U postgres -c "CREATE DATABASE anclora_flow;"

# Inicializar las tablas
psql -U postgres -d anclora_flow -f backend/src/database/init.sql
```

### 3. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp backend/.env.example backend/.env

# Editar si es necesario (los valores por defecto funcionan)
nano backend/.env
```

**Contenido del .env:**
```env
FRONTEND_PORT=3020
BACKEND_PORT=8020
DB_PORT=5452

# Database Configuration
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=anclora_flow
DATABASE_URL=postgresql://postgres:postgres@localhost:5452/anclora_flow

# JWT Configuration
JWT_SECRET=anclora_flow_secret_key_change_in_production_2024
JWT_EXPIRES_IN=7d

# Application
NODE_ENV=development
FRONTEND_URL=http://localhost:3020
```

### 4. Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend (en otra terminal)
cd ../frontend
npm install
```

### 5. Iniciar los Servicios

#### Terminal 1: Backend
```bash
cd backend
npm start
```

Deberías ver:
```
🚀 Backend escuchando en http://localhost:8020
✅ Verifactu API: http://localhost:8020/api/verifactu
```

#### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

Deberías ver:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

## 🎯 Primeros Pasos

### 1. Registrar un Usuario

1. Abre tu navegador en: `http://localhost:5173/register.html`
2. Completa el formulario:
   - **Nombre:** Tu Nombre
   - **Email:** tu@email.com
   - **NIF:** 12345678A
   - **Contraseña:** password123
3. Haz clic en "Crear cuenta"

### 2. Acceder al Dashboard

Serás redirigido automáticamente a: `http://localhost:5173/#/dashboard`

### 3. Crear tu Primera Factura

#### Opción A: Desde la Interfaz (Próximamente)
El formulario de nueva factura estará disponible próximamente.

#### Opción B: Desde API (Actualmente)

```bash
# Primero, obtén tu token (desde la consola del navegador F12):
# localStorage.getItem('auth_token')

# Luego crea una factura (reemplaza YOUR_TOKEN):
curl -X POST http://localhost:8020/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "invoice_number": "F2025-001",
    "client_name": "Cliente Ejemplo SL",
    "client_email": "cliente@ejemplo.com",
    "client_nif": "B12345678",
    "issue_date": "2025-01-15",
    "due_date": "2025-02-15",
    "subtotal": 1000.00,
    "tax": 210.00,
    "total": 1210.00,
    "status": "sent",
    "notes": "Factura de prueba"
  }'
```

### 4. Ver tu Factura con Verifactu

1. En el sidebar, haz clic en "Facturas"
2. Verás tu factura con estado: **⚪ No registrada**
3. Haz clic en el botón **📋 Registrar** para registrarla en Verifactu
4. El estado cambiará a: **✅ Registrada**
5. Ahora puedes:
   - Ver el código QR (botón 🔲)
   - Ver el CSV (botón 🔐)

## 🔍 Verificar que Todo Funciona

### Health Check del Backend
```bash
curl http://localhost:8020/api/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "message": "Anclora Flow API está funcionando",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

### Verificar Base de Datos
```bash
# Con Docker:
docker exec -it anclora-postgres psql -U postgres -d anclora_flow -c "SELECT COUNT(*) FROM users;"

# Con PostgreSQL local:
psql -U postgres -d anclora_flow -c "SELECT COUNT(*) FROM users;"
```

## 🎨 Módulos Disponibles

Después de loguearte, tendrás acceso a:

1. **📊 Dashboard** - Vista general con métricas
2. **📄 Facturas** - Gestión completa de facturas con Verifactu
3. **💰 Gastos** - Control de gastos y deducciones
4. **👥 Clientes** - Base de datos de clientes
5. **📁 Proyectos** - Gestión de proyectos
6. **🔁 Suscripciones** - Facturación recurrente (próximamente)
7. **💵 Presupuesto** - Presupuesto inteligente (próximamente)
8. **📅 Calendario Fiscal** - Obligaciones tributarias (próximamente)
9. **📈 Informes** - Informes y métricas (próximamente)
10. **🤖 Asistente IA** - Asistente inteligente (próximamente)

## 🐛 Solución de Problemas

### Error: "connect ECONNREFUSED 127.0.0.1:5452"

**Problema:** PostgreSQL no está corriendo

**Solución:**
```bash
# Si usas Docker:
docker start anclora-postgres

# Si usas PostgreSQL local, verifica que esté corriendo:
sudo systemctl status postgresql
```

### Error: "CORS policy"

**Problema:** El backend no permite el origen del frontend

**Solución:** Ya está configurado para permitir tanto `http://localhost:3020` como `http://localhost:5173`. Asegúrate de reiniciar el backend después de cualquier cambio.

### Error: "Failed to load resource: net::ERR_FAILED"

**Problema:** El backend no está corriendo

**Solución:**
```bash
cd backend
npm start
```

### No puedo registrarme

**Problema:** Verifica que el backend esté corriendo y que la base de datos esté inicializada

**Solución:**
```bash
# Verificar backend
curl http://localhost:8020/api/health

# Verificar base de datos
docker exec -it anclora-postgres psql -U postgres -d anclora_flow -c "\dt"
```

## 📝 Usar Verifactu

### 1. Configurar Verifactu (Opcional)

Por defecto, Verifactu usa configuración de prueba. Para usar datos reales:

```bash
curl -X PUT http://localhost:8020/api/verifactu/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "nif": "TU_NIF_REAL",
    "company_name": "Tu Empresa SL",
    "software_name": "Anclora Flow",
    "software_version": "1.0.0",
    "software_nif": "TU_NIF",
    "aeat_test_mode": false
  }'
```

### 2. Registrar Factura

```bash
curl -X POST http://localhost:8020/api/verifactu/register/INVOICE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Ver Estadísticas

```bash
curl http://localhost:8020/api/verifactu/statistics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Respuesta:
```json
{
  "total_registered": 5,
  "total_pending": 2,
  "total_errors": 0,
  "total_not_registered": 3,
  "total_invoices": 10
}
```

### 4. Verificar Cadena Blockchain

```bash
curl http://localhost:8020/api/verifactu/verify-chain \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📚 Documentación Adicional

- `ACTIVAR_MODULO_FACTURAS_API.md` - Guía completa del módulo de facturas
- `INTEGRACION_FRONTEND_BACKEND.md` - Detalles de integración
- `VERIFACTU_INTEGRATION.md` - Documentación de Verifactu
- `DEVELOPMENT_UPDATE.md` - Estado actual del desarrollo

## 🎉 ¡Listo!

Ya tienes Anclora Flow corriendo con:
- ✅ Backend API funcionando
- ✅ Frontend con Vite
- ✅ PostgreSQL con datos iniciales
- ✅ Verifactu completamente funcional
- ✅ Autenticación JWT
- ✅ Módulos de Facturas, Gastos y Clientes

Para cualquier duda, consulta la documentación o los archivos de ayuda incluidos.

---

**Fecha:** Enero 2025
**Versión:** 2.1.0
**Estado:** Producción-ready
