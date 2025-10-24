# Migraciones de Base de Datos - Anclora Flow

Este directorio contiene las migraciones de base de datos para el proyecto Anclora Flow.

## Estructura

```
migrations/
├── README.md                           # Este archivo
├── 001_add_verifactu_fields.sql       # Migración SQL de Verifactu
├── run_migration.sh                    # Script para ejecutar migración (local)
├── run_migration_docker.sh             # Script para ejecutar migración (Docker)
└── rollback_verifactu.sh               # Script para revertir migración
```

## Migración 001: Verifactu

### ¿Qué hace esta migración?

Añade soporte completo para el sistema Verifactu de la Agencia Tributaria Española. Incluye:

**Tabla `invoices` (15 columnas nuevas):**
- `verifactu_enabled` - Habilitar/deshabilitar Verifactu para la factura
- `verifactu_status` - Estado del registro (not_registered, pending, registered, error, cancelled)
- `verifactu_id` - ID único asignado por la AEAT
- `verifactu_csv` - Código Seguro de Verificación
- `verifactu_qr_code` - Código QR en Base64
- `verifactu_signature` - Firma electrónica
- `verifactu_hash` - Hash SHA-256 de la factura
- `verifactu_previous_hash` - Hash de la factura anterior (blockchain)
- `verifactu_chain_index` - Índice en la cadena de facturas
- `verifactu_registered_at` - Timestamp de registro
- `verifactu_error_message` - Mensaje de error si falla
- `verifactu_url` - URL de verificación en la AEAT
- `verifactu_software_nif` - NIF del software
- `verifactu_software_name` - Nombre del software
- `verifactu_software_version` - Versión del software

**Tabla `verifactu_logs` (nueva):**
- Registro de auditoría de todas las operaciones
- Incluye requests/responses de la AEAT
- Timestamps de todas las acciones

**Tabla `verifactu_config` (nueva):**
- Configuración por usuario
- Certificados digitales
- Modo test/producción
- Auto-registro

**Índices:**
- 6 índices nuevos para optimizar consultas

## Requisitos Previos

1. **PostgreSQL instalado** (versión 12 o superior)
   ```bash
   # Verificar instalación
   psql --version
   ```

2. **Base de datos inicializada**
   ```bash
   # Si no lo has hecho, ejecuta primero:
   psql -U postgres -d anclora_flow -f backend/src/database/init.sql
   ```

3. **Archivo .env configurado**
   ```env
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=anclora_flow
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=tu_password
   ```

## Ejecutar la Migración

### Opción 1: Script Automatizado (Recomendado)

```bash
# Desde el directorio raíz del proyecto
chmod +x backend/src/database/migrations/run_migration.sh
./backend/src/database/migrations/run_migration.sh
```

El script:
- ✅ Verifica que PostgreSQL esté instalado
- ✅ Verifica la conexión a la base de datos
- ✅ Verifica que la tabla invoices exista
- ✅ Ejecuta la migración
- ✅ Verifica que todo se haya aplicado correctamente
- ✅ Muestra un resumen completo

### Opción 2: Con Docker (Si no tienes PostgreSQL instalado)

```bash
# Desde el directorio raíz del proyecto
chmod +x backend/src/database/migrations/run_migration_docker.sh
./backend/src/database/migrations/run_migration_docker.sh
```

El script:
- ✅ Verifica que Docker esté instalado
- ✅ Inicia un contenedor PostgreSQL si no existe
- ✅ Crea la base de datos si no existe
- ✅ Ejecuta el script de inicialización si es necesario
- ✅ Ejecuta la migración
- ✅ Verifica que todo se haya aplicado correctamente
- ✅ Muestra comandos útiles para trabajar con el contenedor

### Opción 3: Ejecución Manual

```bash
# Desde el directorio raíz del proyecto
psql -U postgres -d anclora_flow -f backend/src/database/migrations/001_add_verifactu_fields.sql
```

## Verificar la Migración

```bash
# Verificar que las columnas existan
psql -U postgres -d anclora_flow -c "\d invoices"

# Verificar las nuevas tablas
psql -U postgres -d anclora_flow -c "\dt verifactu*"

# Verificar índices
psql -U postgres -d anclora_flow -c "\di *verifactu*"

# Verificar configuraciones creadas
psql -U postgres -d anclora_flow -c "SELECT * FROM verifactu_config;"
```

## Rollback (Revertir Migración)

⚠️ **ADVERTENCIA**: El rollback eliminará **TODOS** los datos de Verifactu incluyendo:
- Todas las columnas verifactu_* de la tabla invoices
- La tabla verifactu_logs con todos sus registros
- La tabla verifactu_config con todas las configuraciones

```bash
# Desde el directorio raíz del proyecto
chmod +x backend/src/database/migrations/rollback_verifactu.sh
./backend/src/database/migrations/rollback_verifactu.sh
```

El script pedirá confirmación antes de ejecutar.

## Solución de Problemas

### Error: "psql: command not found"

PostgreSQL no está instalado. Instálalo:

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# Descarga desde https://www.postgresql.org/download/
```

### Error: "connection refused"

PostgreSQL no está corriendo:

```bash
# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl status postgresql

# macOS
brew services start postgresql

# Windows
# Inicia el servicio desde Servicios (services.msc)
```

### Error: "database does not exist"

La base de datos no ha sido creada:

```bash
# Crear la base de datos
createdb -U postgres anclora_flow

# Luego ejecuta el script de inicialización
psql -U postgres -d anclora_flow -f backend/src/database/init.sql
```

### Error: "relation invoices does not exist"

La tabla invoices no existe. Ejecuta primero el script de inicialización:

```bash
psql -U postgres -d anclora_flow -f backend/src/database/init.sql
```

### Error: "permission denied"

El usuario no tiene permisos:

```bash
# Conecta como superusuario y da permisos
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE anclora_flow TO tu_usuario;"
```

## Configuración Post-Migración

Después de ejecutar la migración, configura Verifactu en el archivo `.env`:

```env
# Modo de operación (true = test, false = producción)
VERIFACTU_TEST_MODE=true

# NIF del titular (requerido en producción)
VERIFACTU_NIF=B12345678

# Certificado digital (solo en producción)
VERIFACTU_CERTIFICATE_PATH=/path/to/certificate.pfx
VERIFACTU_CERTIFICATE_PASSWORD=your_password

# URL de la AEAT (opcional, tiene valores por defecto)
VERIFACTU_AEAT_URL=https://sede.agenciatributaria.gob.es/verifactu
```

## Testing

Para verificar que Verifactu funciona correctamente:

```bash
# Inicia el servidor
cd backend && npm start

# En otra terminal, prueba el endpoint de configuración
curl http://localhost:8020/api/verifactu/config

# Prueba las estadísticas
curl http://localhost:8020/api/verifactu/statistics

# Verifica la integridad de la cadena
curl http://localhost:8020/api/verifactu/verify-chain
```

## Próximas Migraciones

Las futuras migraciones seguirán el patrón:
- `002_nombre_descriptivo.sql` - Archivo SQL
- `run_002_migration.sh` - Script de ejecución
- `rollback_002.sh` - Script de rollback

## Recursos

- [Documentación Verifactu](../../../VERIFACTU_INTEGRATION.md)
- [Guía de Setup](../../../SETUP_GUIDE.md)
- [Documentación oficial AEAT](https://sede.agenciatributaria.gob.es/verifactu)

## Soporte

Si encuentras problemas:
1. Revisa esta documentación
2. Verifica los logs de PostgreSQL
3. Consulta la documentación de Verifactu
4. Abre un issue en el repositorio
