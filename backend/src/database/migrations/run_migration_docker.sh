#!/bin/bash

# Script para ejecutar la migración usando Docker
# Útil si no tienes PostgreSQL instalado localmente

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Migración Verifactu (Docker) ===${NC}\n"

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗${NC} Docker no está instalado"
    echo -e "${YELLOW}ℹ${NC} Instala Docker desde: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker está instalado"

# Verificar si existe un contenedor PostgreSQL corriendo
CONTAINER_NAME="anclora-postgres"
RUNNING=$(docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}" 2>/dev/null)

if [ -z "$RUNNING" ]; then
    echo -e "${YELLOW}ℹ${NC} No hay contenedor PostgreSQL corriendo"
    echo -e "${YELLOW}¿Deseas iniciar uno?${NC} (s/n): "
    read -r RESPONSE

    if [[ "$RESPONSE" =~ ^[Ss]$ ]]; then
        echo -e "\n${YELLOW}Iniciando contenedor PostgreSQL...${NC}"

        # Cargar variables de entorno si existen
        if [ -f backend/.env ]; then
            export $(cat backend/.env | grep -v '^#' | xargs)
        fi

        DB_PASSWORD=${POSTGRES_PASSWORD:-anclora_password}
        DB_NAME=${POSTGRES_DB:-anclora_flow}
        DB_USER=${POSTGRES_USER:-postgres}
        DB_PORT=${POSTGRES_PORT:-5432}

        docker run -d \
            --name $CONTAINER_NAME \
            -e POSTGRES_PASSWORD=$DB_PASSWORD \
            -e POSTGRES_DB=$DB_NAME \
            -e POSTGRES_USER=$DB_USER \
            -p $DB_PORT:5432 \
            -v anclora-postgres-data:/var/lib/postgresql/data \
            postgres:15-alpine

        echo -e "${GREEN}✓${NC} Contenedor PostgreSQL iniciado"
        echo -e "${YELLOW}ℹ${NC} Esperando que PostgreSQL esté listo..."
        sleep 5
    else
        echo -e "${YELLOW}Operación cancelada${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}✓${NC} Contenedor PostgreSQL encontrado: $RUNNING"
fi

# Verificar que la base de datos esté lista
echo -e "\n${YELLOW}Verificando que PostgreSQL esté listo...${NC}"
MAX_RETRIES=30
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    if docker exec $CONTAINER_NAME pg_isready -U postgres &>/dev/null; then
        echo -e "${GREEN}✓${NC} PostgreSQL está listo"
        break
    fi
    RETRY=$((RETRY+1))
    echo -ne "  Intento $RETRY/$MAX_RETRIES\r"
    sleep 1
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo -e "\n${RED}✗${NC} PostgreSQL no respondió a tiempo"
    exit 1
fi

# Verificar que la base de datos exista
echo -e "\n${YELLOW}Verificando base de datos...${NC}"
DB_EXISTS=$(docker exec $CONTAINER_NAME psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='anclora_flow'")

if [ "$DB_EXISTS" != "1" ]; then
    echo -e "${YELLOW}ℹ${NC} Base de datos 'anclora_flow' no existe, creándola..."
    docker exec $CONTAINER_NAME psql -U postgres -c "CREATE DATABASE anclora_flow;"
    echo -e "${GREEN}✓${NC} Base de datos creada"

    echo -e "\n${YELLOW}ℹ${NC} Ejecutando script de inicialización..."
    docker exec -i $CONTAINER_NAME psql -U postgres -d anclora_flow < backend/src/database/init.sql
    echo -e "${GREEN}✓${NC} Base de datos inicializada"
fi

# Copiar archivo de migración al contenedor
echo -e "\n${YELLOW}Copiando archivo de migración...${NC}"
docker cp backend/src/database/migrations/001_add_verifactu_fields.sql $CONTAINER_NAME:/tmp/

# Ejecutar migración
echo -e "\n${YELLOW}Ejecutando migración Verifactu...${NC}"
if docker exec $CONTAINER_NAME psql -U postgres -d anclora_flow -f /tmp/001_add_verifactu_fields.sql; then
    echo -e "\n${GREEN}✓${NC} Migración ejecutada exitosamente"
else
    echo -e "\n${RED}✗${NC} Error al ejecutar la migración"
    exit 1
fi

# Limpiar archivo temporal
docker exec $CONTAINER_NAME rm /tmp/001_add_verifactu_fields.sql

# Verificar que las columnas se hayan agregado
echo -e "\n${YELLOW}Verificando migración...${NC}"
COLUMNS=$(docker exec $CONTAINER_NAME psql -U postgres -d anclora_flow -tAc "SELECT column_name FROM information_schema.columns WHERE table_name = 'invoices' AND column_name LIKE 'verifactu%';")

COLUMN_COUNT=$(echo "$COLUMNS" | grep -c "verifactu" || true)
echo -e "${GREEN}✓${NC} $COLUMN_COUNT columnas Verifactu agregadas"

# Verificar tablas nuevas
LOGS_EXISTS=$(docker exec $CONTAINER_NAME psql -U postgres -d anclora_flow -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'verifactu_logs');")
CONFIG_EXISTS=$(docker exec $CONTAINER_NAME psql -U postgres -d anclora_flow -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'verifactu_config');")

if [ "$LOGS_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓${NC} Tabla verifactu_logs creada"
fi

if [ "$CONFIG_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓${NC} Tabla verifactu_config creada"
fi

# Mostrar info de conexión
echo -e "\n${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  Migración completada exitosamente${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "\n${YELLOW}Información de conexión:${NC}"
echo "  Host: localhost"
echo "  Puerto: ${DB_PORT:-5432}"
echo "  Base de datos: anclora_flow"
echo "  Usuario: postgres"
echo ""
echo -e "${YELLOW}Comandos útiles:${NC}"
echo "  # Conectar a la base de datos:"
echo "  docker exec -it $CONTAINER_NAME psql -U postgres -d anclora_flow"
echo ""
echo "  # Ver logs del contenedor:"
echo "  docker logs $CONTAINER_NAME"
echo ""
echo "  # Detener el contenedor:"
echo "  docker stop $CONTAINER_NAME"
echo ""
echo "  # Iniciar el contenedor:"
echo "  docker start $CONTAINER_NAME"
echo ""
