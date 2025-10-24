#!/bin/bash

# Script para ejecutar la migración de Verifactu
# Este script debe ejecutarse desde el directorio raíz del proyecto

set -e  # Salir si hay algún error

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Migración Verifactu para Anclora Flow ===${NC}\n"

# Cargar variables de entorno
if [ -f backend/.env ]; then
    echo -e "${GREEN}✓${NC} Cargando variables de entorno desde backend/.env"
    export $(cat backend/.env | grep -v '^#' | xargs)
else
    echo -e "${RED}✗${NC} No se encontró el archivo backend/.env"
    echo -e "${YELLOW}ℹ${NC} Usando valores por defecto"
fi

# Variables de conexión
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-anclora_flow}
DB_USER=${POSTGRES_USER:-postgres}

echo -e "\n${YELLOW}Configuración de conexión:${NC}"
echo "  Host: $DB_HOST"
echo "  Puerto: $DB_PORT"
echo "  Base de datos: $DB_NAME"
echo "  Usuario: $DB_USER"
echo ""

# Verificar que PostgreSQL esté instalado
if ! command -v psql &> /dev/null; then
    echo -e "${RED}✗${NC} PostgreSQL (psql) no está instalado"
    echo -e "${YELLOW}ℹ${NC} Instala PostgreSQL primero:"
    echo "  - Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "  - macOS: brew install postgresql"
    echo "  - Windows: Descarga desde https://www.postgresql.org/download/"
    exit 1
fi

echo -e "${GREEN}✓${NC} PostgreSQL está instalado"

# Verificar conexión a la base de datos
echo -e "\n${YELLOW}Verificando conexión a la base de datos...${NC}"
if PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Conexión exitosa a la base de datos"
else
    echo -e "${RED}✗${NC} No se pudo conectar a la base de datos"
    echo -e "${YELLOW}ℹ${NC} Verifica que:"
    echo "  1. PostgreSQL esté corriendo"
    echo "  2. La base de datos '$DB_NAME' exista"
    echo "  3. Las credenciales sean correctas"
    echo "  4. El archivo backend/.env tenga la configuración correcta"
    exit 1
fi

# Verificar que la tabla invoices exista
echo -e "\n${YELLOW}Verificando que la tabla 'invoices' exista...${NC}"
TABLE_EXISTS=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices');")

if [ "$TABLE_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓${NC} La tabla 'invoices' existe"
else
    echo -e "${RED}✗${NC} La tabla 'invoices' no existe"
    echo -e "${YELLOW}ℹ${NC} Ejecuta primero el script de inicialización: backend/src/database/init.sql"
    exit 1
fi

# Ejecutar la migración
echo -e "\n${YELLOW}Ejecutando migración de Verifactu...${NC}"
MIGRATION_FILE="backend/src/database/migrations/001_add_verifactu_fields.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}✗${NC} No se encontró el archivo de migración: $MIGRATION_FILE"
    exit 1
fi

if PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATION_FILE" 2>&1 | tee /tmp/migration.log; then
    echo -e "\n${GREEN}✓${NC} Migración ejecutada exitosamente"
else
    echo -e "\n${RED}✗${NC} Error al ejecutar la migración"
    echo -e "${YELLOW}ℹ${NC} Revisa el log en /tmp/migration.log"
    exit 1
fi

# Verificar que las columnas se hayan agregado
echo -e "\n${YELLOW}Verificando que las columnas se hayan agregado...${NC}"
COLUMNS=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT column_name FROM information_schema.columns WHERE table_name = 'invoices' AND column_name LIKE 'verifactu%';")

EXPECTED_COLUMNS=(
    "verifactu_enabled"
    "verifactu_status"
    "verifactu_id"
    "verifactu_csv"
    "verifactu_qr_code"
    "verifactu_signature"
    "verifactu_hash"
    "verifactu_previous_hash"
    "verifactu_chain_index"
    "verifactu_registered_at"
    "verifactu_error_message"
    "verifactu_url"
    "verifactu_software_nif"
    "verifactu_software_name"
    "verifactu_software_version"
)

COLUMNS_FOUND=0
for col in "${EXPECTED_COLUMNS[@]}"; do
    if echo "$COLUMNS" | grep -q "$col"; then
        echo -e "${GREEN}  ✓${NC} $col"
        ((COLUMNS_FOUND++))
    else
        echo -e "${RED}  ✗${NC} $col (no encontrada)"
    fi
done

if [ $COLUMNS_FOUND -eq ${#EXPECTED_COLUMNS[@]} ]; then
    echo -e "\n${GREEN}✓${NC} Todas las columnas se agregaron correctamente ($COLUMNS_FOUND/${#EXPECTED_COLUMNS[@]})"
else
    echo -e "\n${YELLOW}⚠${NC} Solo se encontraron $COLUMNS_FOUND de ${#EXPECTED_COLUMNS[@]} columnas"
fi

# Verificar que las tablas nuevas se hayan creado
echo -e "\n${YELLOW}Verificando que las tablas nuevas se hayan creado...${NC}"
VERIFACTU_LOGS_EXISTS=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'verifactu_logs');")
VERIFACTU_CONFIG_EXISTS=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'verifactu_config');")

if [ "$VERIFACTU_LOGS_EXISTS" = "t" ]; then
    echo -e "${GREEN}  ✓${NC} verifactu_logs"
else
    echo -e "${RED}  ✗${NC} verifactu_logs"
fi

if [ "$VERIFACTU_CONFIG_EXISTS" = "t" ]; then
    echo -e "${GREEN}  ✓${NC} verifactu_config"
else
    echo -e "${RED}  ✗${NC} verifactu_config"
fi

# Verificar índices
echo -e "\n${YELLOW}Verificando índices...${NC}"
INDEXES=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT indexname FROM pg_indexes WHERE tablename IN ('invoices', 'verifactu_logs', 'verifactu_config') AND indexname LIKE '%verifactu%';")

if [ -n "$INDEXES" ]; then
    echo -e "${GREEN}✓${NC} Índices creados:"
    echo "$INDEXES" | while read idx; do
        echo -e "  - $idx"
    done
else
    echo -e "${YELLOW}⚠${NC} No se encontraron índices Verifactu"
fi

# Contar usuarios existentes que ahora tienen configuración Verifactu
USER_COUNT=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM verifactu_config;")
echo -e "\n${GREEN}✓${NC} Configuración Verifactu creada para $USER_COUNT usuario(s)"

# Resumen final
echo -e "\n${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  Migración completada exitosamente${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "\n${YELLOW}Próximos pasos:${NC}"
echo "  1. Configura las variables de entorno para Verifactu en backend/.env:"
echo "     VERIFACTU_TEST_MODE=true"
echo "     VERIFACTU_NIF=tu_nif"
echo ""
echo "  2. Reinicia el servidor backend:"
echo "     cd backend && npm start"
echo ""
echo "  3. El sistema Verifactu estará disponible en:"
echo "     http://localhost:8020/api/verifactu"
echo ""
echo -e "${YELLOW}ℹ${NC} Por defecto, Verifactu está en modo TEST para todos los usuarios"
echo -e "${YELLOW}ℹ${NC} Los usuarios pueden habilitarlo desde la configuración"
echo ""
