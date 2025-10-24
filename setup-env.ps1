# Script para generar configuración segura de Anclora Flow
# Ejecutar como: .\setup-env.ps1

$ESC = [char]27
$Green = "$ESC[32m"
$Yellow = "$ESC[33m"
$Cyan = "$ESC[36m"
$Red = "$ESC[31m"
$Reset = "$ESC[0m"

Write-Host "${Cyan}🔐 Configuración Segura - Anclora Flow${Reset}`n"

# Verificar que Node.js esté instalado
Write-Host "Verificando Node.js..." -NoNewline
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ${Green}✓${Reset} Node.js $nodeVersion"
    } else {
        throw "Node.js no encontrado"
    }
} catch {
    Write-Host " ${Red}✗${Reset} Node.js no está instalado"
    Write-Host "${Yellow}ℹ${Reset} Instala Node.js desde: https://nodejs.org/"
    exit 1
}

# Generar JWT Secret
Write-Host "`n${Yellow}1. Generando JWT Secret seguro...${Reset}"
$jwtSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
Write-Host "${Green}✓${Reset} JWT Secret generado (128 caracteres hexadecimales)"

# Solicitar o generar password de base de datos
Write-Host "`n${Yellow}2. Configurando password de base de datos...${Reset}"
Write-Host "Opciones:"
Write-Host "  1. Usar password simple para desarrollo: ${Cyan}Anclora2024!Dev${Reset}"
Write-Host "  2. Generar password segura aleatoria"
Write-Host "  3. Introducir password personalizada"

$choice = Read-Host "`n¿Qué opción prefieres? (1/2/3)"

switch ($choice) {
    "1" {
        $dbPassword = "Anclora2024!Dev"
        Write-Host "${Green}✓${Reset} Usando password de desarrollo"
    }
    "2" {
        $dbPassword = -join ((48..57) + (65..90) + (97..122) + @(33,35,36,37,38,42,43,45,61,63,64) | Get-Random -Count 32 | ForEach-Object {[char]$_})
        Write-Host "${Green}✓${Reset} Password segura generada: ${Yellow}$dbPassword${Reset}"
        Write-Host "${Red}⚠${Reset} ${Yellow}IMPORTANTE: Guarda esta password, la necesitarás${Reset}"
    }
    "3" {
        $dbPassword = Read-Host "Introduce tu password"
        Write-Host "${Green}✓${Reset} Password personalizada configurada"
    }
    default {
        $dbPassword = "Anclora2024!Dev"
        Write-Host "${Yellow}⚠${Reset} Opción inválida, usando password de desarrollo"
    }
}

# NIF para Verifactu
Write-Host "`n${Yellow}3. Configurando Verifactu...${Reset}"
$nif = Read-Host "Introduce tu NIF/CIF (o presiona Enter para usar B12345678 de ejemplo)"
if ([string]::IsNullOrWhiteSpace($nif)) {
    $nif = "B12345678"
    Write-Host "${Yellow}ℹ${Reset} Usando NIF de ejemplo: $nif"
}

# Crear contenido del archivo .env
Write-Host "`n${Yellow}4. Generando archivo backend\.env...${Reset}"

$envContent = @"
# ============================================
# CONFIGURACIÓN ANCLORA FLOW
# Generado automáticamente el $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================

# Base de datos PostgreSQL (Docker en puerto 5433)
# IMPORTANTE: El puerto 5433 se usa porque el 5432 está ocupado por otra aplicación
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=anclora_flow
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$dbPassword

# Backend
BACKEND_PORT=8020
FRONTEND_URL=http://localhost:3020

# JWT Secret (autogenerado con crypto.randomBytes)
# NUNCA compartas este valor ni lo subas a Git
JWT_SECRET=$jwtSecret

# Verifactu - Sistema de verificación AEAT
VERIFACTU_TEST_MODE=true
VERIFACTU_NIF=$nif

# Opcional: Certificado digital (solo para modo producción)
# VERIFACTU_CERTIFICATE_PATH=/ruta/a/certificado.pfx
# VERIFACTU_CERTIFICATE_PASSWORD=password_del_certificado

# ============================================
# NOTAS DE SEGURIDAD:
# - Este archivo NO debe subirse a Git
# - Está protegido por .gitignore
# - Para compartir con equipo, usa env-crypto.ps1
# - Para producción, usa variables de entorno del servidor
# ============================================
"@

# Crear directorio backend si no existe
if (-not (Test-Path "backend")) {
    New-Item -ItemType Directory -Name "backend" -Force | Out-Null
}

# Guardar archivo .env
$envContent | Out-File -FilePath "backend\.env" -Encoding UTF8 -Force
Write-Host "${Green}✓${Reset} Archivo backend\.env creado exitosamente"

# Verificar y actualizar .gitignore
Write-Host "`n${Yellow}5. Verificando .gitignore...${Reset}"
$gitignoreContent = Get-Content .gitignore -ErrorAction SilentlyContinue

if ($gitignoreContent -match "\.env") {
    Write-Host "${Green}✓${Reset} .env ya está en .gitignore"
} else {
    $gitignoreAddition = @"

# Environment variables (contienen secretos)
.env
*.env
!.env.example
backend/.env
frontend/.env
"@
    Add-Content .gitignore $gitignoreAddition
    Write-Host "${Green}✓${Reset} Añadido .env a .gitignore"
}

# Crear archivo .env.example
Write-Host "`n${Yellow}6. Creando backend\.env.example (plantilla)...${Reset}"
$envExampleContent = @"
# ============================================
# PLANTILLA DE CONFIGURACIÓN ANCLORA FLOW
# Copia este archivo como .env y completa los valores
# ============================================

# Base de datos PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=anclora_flow
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_aqui

# Backend
BACKEND_PORT=8020
FRONTEND_URL=http://localhost:3020

# JWT Secret
# Genera uno con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=genera_tu_clave_secreta_aqui

# Verifactu
VERIFACTU_TEST_MODE=true
VERIFACTU_NIF=tu_nif_aqui

# Opcional: Certificado digital (solo producción)
# VERIFACTU_CERTIFICATE_PATH=/ruta/a/certificado.pfx
# VERIFACTU_CERTIFICATE_PASSWORD=password_del_certificado
"@

$envExampleContent | Out-File -FilePath "backend\.env.example" -Encoding UTF8 -Force
Write-Host "${Green}✓${Reset} Archivo backend\.env.example creado (este SÍ va a Git)"

# Mostrar resumen
Write-Host "`n${Green}═══════════════════════════════════════════${Reset}"
Write-Host "${Green}  ✅ Configuración completada exitosamente${Reset}"
Write-Host "${Green}═══════════════════════════════════════════${Reset}"

Write-Host "`n${Cyan}📋 Resumen de configuración:${Reset}"
Write-Host "  ${Yellow}Puerto PostgreSQL:${Reset} 5433 (evita conflicto con tu otra app en 5432)"
Write-Host "  ${Yellow}Base de datos:${Reset} anclora_flow"
Write-Host "  ${Yellow}Usuario DB:${Reset} postgres"
Write-Host "  ${Yellow}Password DB:${Reset} $dbPassword"
Write-Host "  ${Yellow}JWT Secret:${Reset} (128 caracteres, ver archivo .env)"
Write-Host "  ${Yellow}Verifactu NIF:${Reset} $nif"
Write-Host "  ${Yellow}Modo Verifactu:${Reset} TEST (desarrollo)"

Write-Host "`n${Yellow}⚠ IMPORTANTE - Guarda estos valores en lugar seguro:${Reset}"
Write-Host "  - Password DB: ${Cyan}$dbPassword${Reset}"
Write-Host "  - JWT Secret: ${Cyan}(ver backend\.env)${Reset}"

Write-Host "`n${Cyan}🚀 Próximos pasos:${Reset}"
Write-Host "  1. Ejecutar migración de base de datos:"
Write-Host "     ${Cyan}.\backend\src\database\migrations\run_migration_docker.ps1${Reset}"
Write-Host ""
Write-Host "  2. Instalar dependencias del backend:"
Write-Host "     ${Cyan}cd backend${Reset}"
Write-Host "     ${Cyan}npm install${Reset}"
Write-Host ""
Write-Host "  3. Iniciar el servidor backend:"
Write-Host "     ${Cyan}npm start${Reset}"
Write-Host ""
Write-Host "  4. (Opcional) Encriptar el archivo .env:"
Write-Host "     ${Cyan}.\env-crypto.ps1 -Action encrypt -Password 'tu_clave_maestra'${Reset}"
Write-Host ""

Write-Host "${Green}✨ ¡Todo listo para desarrollar!${Reset}`n"

# Preguntar si quiere ver el contenido del .env
$showEnv = Read-Host "¿Quieres ver el contenido del archivo .env generado? (S/N)"
if ($showEnv -match "^[Ss]$") {
    Write-Host "`n${Cyan}Contenido de backend\.env:${Reset}"
    Write-Host "----------------------------------------"
    Get-Content "backend\.env"
    Write-Host "----------------------------------------"
}

Write-Host "`n${Yellow}💡 Tip:${Reset} El archivo backend\.env contiene secretos y NO se subirá a Git"
Write-Host "${Yellow}💡 Tip:${Reset} El archivo backend\.env.example es una plantilla y SÍ va a Git"
