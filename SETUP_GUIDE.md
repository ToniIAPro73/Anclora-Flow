# Guía de Instalación y Setup de Anclora Flow

## 📋 Requisitos Previos

- Node.js 20+ instalado
- PostgreSQL 13+ instalado
- npm o yarn

---

## 🗄️ Paso 1: Instalación de PostgreSQL

### En Ubuntu/Debian

```bash
# Actualizar repositorios
sudo apt update

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Iniciar el servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar instalación
psql --version
```

### En macOS

```bash
# Con Homebrew
brew install postgresql@15

# Iniciar el servicio
brew services start postgresql@15

# Verificar instalación
psql --version
```

### En Windows

1. Descargar el instalador desde: https://www.postgresql.org/download/windows/
2. Ejecutar el instalador (incluye pgAdmin 4)
3. Durante la instalación:
   - Puerto por defecto: 5432
   - Crear contraseña para usuario 'postgres'
4. Agregar PostgreSQL al PATH del sistema

### Con Docker (Recomendado para desarrollo)

```bash
# Iniciar PostgreSQL con Docker
docker run --name anclora-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=anclora_flow \
  -p 5452:5432 \
  -d postgres:15

# Verificar que está corriendo
docker ps | grep anclora-postgres
```

---

## 🔧 Paso 2: Crear y Configurar la Base de Datos

### Opción A: Usando el usuario postgres (Ubuntu/Debian/macOS)

```bash
# Cambiar al usuario postgres
sudo -u postgres psql

# Dentro de psql, ejecutar:
CREATE DATABASE anclora_flow;
\q
```

### Opción B: Usando psql directamente

```bash
# Crear la base de datos
createdb -U postgres anclora_flow

# O con psql:
psql -U postgres -c "CREATE DATABASE anclora_flow;"
```

### Opción C: Con Docker

```bash
# La base de datos ya se creó con el contenedor
# Verificar la conexión:
docker exec -it anclora-postgres psql -U postgres -d anclora_flow
```

---

## 📊 Paso 3: Inicializar el Esquema de la Base de Datos

```bash
# Desde el directorio raíz del proyecto
cd /ruta/a/Anclora-Flow

# Ejecutar el script de inicialización
psql -U postgres -d anclora_flow -f backend/src/database/init.sql

# O con Docker:
docker exec -i anclora-postgres psql -U postgres -d anclora_flow < backend/src/database/init.sql
```

### Verificar que las tablas se crearon correctamente

```bash
# Conectarse a la base de datos
psql -U postgres -d anclora_flow

# Ver las tablas creadas
\dt

# Deberías ver 11 tablas:
# users, clients, projects, invoices, invoice_items,
# expenses, subscriptions, payments, tax_events, budgets, activity_log

# Salir
\q
```

---

## 📦 Paso 4: Instalar Dependencias del Backend

```bash
cd backend

# Instalar dependencias
npm install

# Las dependencias principales instaladas:
# - express (servidor web)
# - pg (PostgreSQL driver)
# - bcrypt (encriptación de contraseñas)
# - jsonwebtoken (autenticación JWT)
# - express-validator (validación)
# - dotenv (variables de entorno)
```

---

## ⚙️ Paso 5: Configurar Variables de Entorno del Backend

```bash
# Copiar el archivo de ejemplo
cp backend/.env.example backend/.env

# Editar el archivo .env con tus configuraciones
nano backend/.env  # o usa tu editor favorito
```

### Configuración recomendada para desarrollo:

```env
# Puertos
FRONTEND_PORT=3020
BACKEND_PORT=8020
DB_PORT=5452

# Base de datos (ajustar si usas diferentes valores)
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=anclora_flow
DATABASE_URL=postgresql://postgres:postgres@localhost:5452/anclora_flow

# JWT (cambiar en producción)
JWT_SECRET=tu_clave_secreta_muy_segura_aqui_cambiar_en_produccion
JWT_EXPIRES_IN=7d

# OAuth (opcional - configurar cuando sea necesario)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Aplicación
NODE_ENV=development
FRONTEND_URL=http://localhost:3020
```

**IMPORTANTE:** Si PostgreSQL está en el puerto por defecto (5432), cambiar `DB_PORT=5432` en el .env

---

## 🎨 Paso 6: Instalar Dependencias del Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Las dependencias principales:
# - vite (build tool)
# - vanilla JavaScript (sin frameworks pesados)
```

---

## 🚀 Paso 7: Ejecutar la Aplicación

### Opción A: Ejecutar Backend y Frontend por separado

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev

# Debería mostrar:
# 🚀 Backend escuchando en http://localhost:8020
# ✅ Conectado a PostgreSQL
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev

# Debería mostrar:
# ➜  Local:   http://localhost:3020/
```

### Opción B: Con Docker Compose (si está configurado)

```bash
# Desde el directorio raíz
docker-compose up -d

# Ver logs
docker-compose logs -f
```

---

## ✅ Paso 8: Verificar que Todo Funciona

### 1. Verificar Backend API

```bash
# Health check
curl http://localhost:8020/api/health

# Debería retornar:
# {"status":"ok","message":"Anclora Flow API está funcionando","timestamp":"..."}
```

### 2. Verificar Frontend

Abrir en el navegador: `http://localhost:3020`

Deberías ver:
- ✅ Página de login
- ✅ Dashboard (si estás logueado)
- ✅ Módulo de Gastos funcionando
- ✅ Módulo de Clientes funcionando

### 3. Verificar Base de Datos

```bash
# Conectarse a PostgreSQL
psql -U postgres -d anclora_flow

# Ver el usuario demo creado
SELECT * FROM users;

# Deberías ver 1 usuario demo creado automáticamente
```

---

## 🔍 Troubleshooting

### Error: "listen EADDRINUSE :::8020"
**Problema:** El puerto 8020 ya está en uso
**Solución:**
```bash
# Ver qué proceso está usando el puerto
lsof -i :8020

# Matar el proceso (reemplazar PID)
kill -9 PID

# O cambiar el puerto en backend/.env
BACKEND_PORT=8021
```

### Error: "connection to server failed"
**Problema:** No se puede conectar a PostgreSQL
**Solución:**
```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# Iniciar PostgreSQL si está detenido
sudo systemctl start postgresql

# Verificar la configuración de conexión en backend/.env
```

### Error: "FATAL: password authentication failed"
**Problema:** Contraseña incorrecta de PostgreSQL
**Solución:**
```bash
# Cambiar contraseña del usuario postgres
sudo -u postgres psql
\password postgres
# Ingresar nueva contraseña
\q

# Actualizar backend/.env con la nueva contraseña
DB_PASSWORD=tu_nueva_contraseña
```

### Error: "relation 'users' does not exist"
**Problema:** Las tablas no se crearon
**Solución:**
```bash
# Ejecutar el script de inicialización nuevamente
psql -U postgres -d anclora_flow -f backend/src/database/init.sql
```

### Error: "Cannot find module 'pg'"
**Problema:** Dependencias no instaladas
**Solución:**
```bash
cd backend
rm -rf node_modules
npm install
```

---

## 🔐 Seguridad para Producción

Antes de desplegar en producción, asegúrate de:

1. **Cambiar JWT_SECRET** a un valor fuerte y aleatorio:
   ```bash
   # Generar un secret aleatorio
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Usar contraseñas fuertes** para PostgreSQL

3. **Habilitar HTTPS** en producción

4. **Configurar CORS** correctamente:
   ```javascript
   // backend/src/server.js
   app.use(cors({
     origin: 'https://tu-dominio-produccion.com',
     credentials: true
   }));
   ```

5. **Variables de entorno de producción:**
   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://usuario:password@host:puerto/database?ssl=true
   ```

---

## 📚 Recursos Adicionales

- **Documentación completa:** Ver `DEVELOPMENT_UPDATE.md`
- **Esquema de BD:** `backend/src/database/init.sql`
- **APIs disponibles:** Ver sección de rutas en `DEVELOPMENT_UPDATE.md`

---

## 🆘 Soporte

Si encuentras problemas:
1. Revisar logs del backend: `backend/logs/` (si existe)
2. Verificar consola del navegador (F12) para errores del frontend
3. Verificar logs de PostgreSQL: `sudo tail -f /var/log/postgresql/postgresql-*.log`

---

**¡Listo!** Tu aplicación Anclora Flow debería estar funcionando correctamente. 🎉
