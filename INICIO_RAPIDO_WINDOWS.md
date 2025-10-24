# 🚀 Inicio Rápido - Windows con Docker

Guía rápida para ejecutar Anclora Flow en Windows usando Docker.

## Requisitos Previos

- ✅ Windows 10/11
- ✅ PowerShell 5.1+ (viene con Windows)
- ✅ Docker Desktop para Windows

## Paso 1: Instalar Docker Desktop

1. Descarga Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Instala y reinicia tu PC si es necesario
3. Abre Docker Desktop y espera a que inicie completamente
4. Verifica que Docker esté corriendo: ícono de Docker en la bandeja del sistema debe estar verde

## Paso 2: Verificar Docker

Abre PowerShell y ejecuta:

```powershell
docker --version
docker ps
```

Deberías ver la versión de Docker y una lista vacía de contenedores (es normal).

## Paso 3: Clonar el Repositorio (si aún no lo has hecho)

```powershell
git clone https://github.com/ToniIAPro73/Anclora-Flow.git
cd Anclora-Flow
```

## Paso 4: Configurar Política de Ejecución de PowerShell

Si es la primera vez que ejecutas scripts PowerShell:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Escribe **Y** o **S** (Sí) cuando te lo pida.

## Paso 5: Ejecutar Migración con Docker

Desde el directorio raíz del proyecto:

```powershell
.\backend\src\database\migrations\run_migration_docker.ps1
```

El script automáticamente:
- ✅ Verificará que Docker esté corriendo
- ✅ Descargará la imagen PostgreSQL (primera vez)
- ✅ Creará un contenedor llamado `anclora-postgres`
- ✅ Creará la base de datos `anclora_flow`
- ✅ Ejecutará el script de inicialización
- ✅ Ejecutará la migración de Verifactu
- ✅ Verificará que todo funcionó correctamente

**Tiempo estimado:** 2-5 minutos (primera vez, por la descarga de la imagen)

### Qué Esperar

Verás output colorizado como este:

```
=== Migración Verifactu (Docker) ===

Verificando Docker... ✓ Docker está instalado
Verificando que Docker esté corriendo... ✓ Docker está corriendo

Buscando contenedor PostgreSQL... ℹ No hay contenedor PostgreSQL corriendo

¿Deseas iniciar uno? (S/N): S

Iniciando contenedor PostgreSQL...
✓ Contenedor PostgreSQL iniciado
ℹ Esperando que PostgreSQL esté listo...
✓ PostgreSQL está listo

✓ Base de datos creada
✓ Base de datos inicializada
✓ Archivo copiado

Ejecutando migración Verifactu...
✓ Migración ejecutada exitosamente

Verificando migración...
✓ 15 columnas Verifactu agregadas
✓ Tabla verifactu_logs creada
✓ Tabla verifactu_config creada
✓ Configuración Verifactu creada para 0 usuario(s)

═══════════════════════════════════════════
  Migración completada exitosamente
═══════════════════════════════════════════
```

## Paso 6: Configurar Variables de Entorno

Crea o edita el archivo `backend\.env`:

```powershell
# Navega a la carpeta backend
cd backend

# Crea el archivo .env (si no existe)
New-Item -ItemType File -Name .env -Force

# Edita con tu editor favorito (VS Code, Notepad++, etc.)
code .env  # Si tienes VS Code
# o
notepad .env
```

Contenido mínimo del archivo `.env`:

```env
# Base de datos (Docker)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=anclora_flow
POSTGRES_USER=postgres
POSTGRES_PASSWORD=anclora_password

# Backend
BACKEND_PORT=8020
FRONTEND_URL=http://localhost:3020

# JWT
JWT_SECRET=tu_clave_secreta_super_segura_cambiala

# Verifactu (modo test)
VERIFACTU_TEST_MODE=true
VERIFACTU_NIF=B12345678
```

**Importante:** Cambia `JWT_SECRET` por una clave secreta segura.

## Paso 7: Instalar Dependencias del Backend

Desde la carpeta `backend`:

```powershell
npm install
```

## Paso 8: Iniciar el Servidor Backend

```powershell
npm start
```

Deberías ver:

```
🔄 Iniciando Anclora Flow Backend...
✓ Base de datos conectada

🚀 Backend escuchando en http://localhost:8020
📊 Health check: http://localhost:8020/api/health
🔐 Auth API: http://localhost:8020/api/auth
📄 Invoices API: http://localhost:8020/api/invoices
💰 Expenses API: http://localhost:8020/api/expenses
👥 Clients API: http://localhost:8020/api/clients
📁 Projects API: http://localhost:8020/api/projects
✅ Verifactu API: http://localhost:8020/api/verifactu
```

## Paso 9: Probar que Verifactu Funciona

Abre otra terminal PowerShell y ejecuta:

```powershell
# Probar health check
curl http://localhost:8020/api/health

# Probar estadísticas Verifactu (requiere usuario autenticado)
# curl http://localhost:8020/api/verifactu/statistics
```

## Paso 10: Iniciar el Frontend

Abre otra terminal PowerShell:

```powershell
# Vuelve al directorio raíz
cd ..

# Navega a frontend
cd frontend

# Instala dependencias
npm install

# Inicia el servidor de desarrollo
npm run dev
```

El frontend estará disponible en: http://localhost:3020

## 🎉 ¡Listo!

Ya tienes Anclora Flow corriendo con:
- ✅ PostgreSQL en Docker
- ✅ Backend API corriendo
- ✅ Verifactu integrado
- ✅ Frontend de desarrollo

## Comandos Útiles de Docker

### Ver contenedores corriendo
```powershell
docker ps
```

### Detener el contenedor de PostgreSQL
```powershell
docker stop anclora-postgres
```

### Iniciar el contenedor de PostgreSQL
```powershell
docker start anclora-postgres
```

### Ver logs del contenedor
```powershell
docker logs anclora-postgres
```

### Conectar a la base de datos
```powershell
docker exec -it anclora-postgres psql -U postgres -d anclora_flow
```

Dentro de psql:
```sql
-- Ver todas las tablas
\dt

-- Ver estructura de la tabla invoices
\d invoices

-- Ver configuración Verifactu
SELECT * FROM verifactu_config;

-- Ver logs de Verifactu
SELECT * FROM verifactu_logs LIMIT 10;

-- Salir
\q
```

### Eliminar el contenedor y empezar de cero
```powershell
# Detener contenedor
docker stop anclora-postgres

# Eliminar contenedor
docker rm anclora-postgres

# Eliminar volumen (datos persistentes)
docker volume rm anclora-postgres-data

# Volver a ejecutar el script de migración
.\backend\src\database\migrations\run_migration_docker.ps1
```

## Solución de Problemas

### Error: "docker: command not found"
- Docker Desktop no está instalado
- Solución: Instala Docker Desktop desde https://www.docker.com/products/docker-desktop/

### Error: "Cannot connect to the Docker daemon"
- Docker Desktop no está corriendo
- Solución: Abre Docker Desktop y espera a que inicie

### Error: "The term 'npm' is not recognized"
- Node.js no está instalado
- Solución: Instala Node.js desde https://nodejs.org/ (versión LTS recomendada)

### Error: Script de PowerShell no se ejecuta
- Política de ejecución restrictiva
- Solución: Ejecuta `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Puerto 5432 ya está en uso
- Ya tienes PostgreSQL local corriendo
- Soluciones:
  1. Detén PostgreSQL local y usa Docker
  2. O cambia el puerto de Docker: `-p 5433:5432` en el script
  3. O usa el script `run_migration.ps1` para PostgreSQL local

### Error al conectar backend a la base de datos
- Verifica que el contenedor esté corriendo: `docker ps`
- Verifica las credenciales en `backend\.env`
- Verifica que el puerto sea 5432

## Próximos Pasos

1. **Crear un usuario**: Usa el endpoint `/api/auth/register`
2. **Crear clientes**: Usa el módulo de Clientes en el frontend
3. **Crear facturas**: Usa el módulo de Facturas
4. **Registrar facturas en Verifactu**: Desde el módulo de Facturas

## Documentación Adicional

- [Guía Completa de Setup](./SETUP_GUIDE.md)
- [Documentación Verifactu](./VERIFACTU_INTEGRATION.md)
- [Documentación de Migraciones](./backend/src/database/migrations/README.md)

## Soporte

Si tienes problemas:
1. Revisa esta guía
2. Revisa los logs de Docker: `docker logs anclora-postgres`
3. Revisa los logs del backend en la consola
4. Abre un issue en GitHub

---

**¡Bienvenido a Anclora Flow!** 🎉
