#!/bin/bash

# Script para revertir la migración de Verifactu
# ADVERTENCIA: Esto eliminará todas las columnas y datos de Verifactu

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${RED}=== ROLLBACK Migración Verifactu ===${NC}\n"
echo -e "${RED}ADVERTENCIA: Este script eliminará:${NC}"
echo "  - Todas las columnas verifactu_* de la tabla invoices"
echo "  - La tabla verifactu_logs (con todos sus datos)"
echo "  - La tabla verifactu_config (con todas las configuraciones)"
echo ""
read -p "¿Estás seguro que deseas continuar? (escribe 'SI' para confirmar): " CONFIRM

if [ "$CONFIRM" != "SI" ]; then
    echo -e "\n${YELLOW}Rollback cancelado${NC}"
    exit 0
fi

# Cargar variables de entorno
if [ -f backend/.env ]; then
    echo -e "\n${GREEN}✓${NC} Cargando variables de entorno"
    export $(cat backend/.env | grep -v '^#' | xargs)
fi

# Variables de conexión
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-anclora_flow}
DB_USER=${POSTGRES_USER:-postgres}

echo -e "\n${YELLOW}Ejecutando rollback...${NC}"

# Crear SQL de rollback
cat > /tmp/rollback_verifactu.sql <<'EOF'
-- Rollback de la migración Verifactu

-- Eliminar tablas
DROP TABLE IF EXISTS verifactu_logs CASCADE;
DROP TABLE IF EXISTS verifactu_config CASCADE;

-- Eliminar índices de la tabla invoices
DROP INDEX IF EXISTS idx_invoices_verifactu_status;
DROP INDEX IF EXISTS idx_invoices_verifactu_id;
DROP INDEX IF EXISTS idx_invoices_verifactu_chain_index;

-- Eliminar columnas de la tabla invoices
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_enabled;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_status;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_id;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_csv;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_qr_code;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_signature;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_hash;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_previous_hash;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_chain_index;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_registered_at;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_error_message;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_url;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_software_nif;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_software_name;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_software_version;
EOF

# Ejecutar rollback
if PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f /tmp/rollback_verifactu.sql; then
    echo -e "\n${GREEN}✓${NC} Rollback ejecutado exitosamente"
    echo -e "${GREEN}✓${NC} Todas las columnas y tablas de Verifactu han sido eliminadas"
else
    echo -e "\n${RED}✗${NC} Error al ejecutar el rollback"
    exit 1
fi

# Limpiar archivo temporal
rm -f /tmp/rollback_verifactu.sql

echo -e "\n${GREEN}Rollback completado${NC}"
