# Script para encriptar/desencriptar archivo .env
# Uso:
#   .\env-crypto.ps1 -Action encrypt -Password "tu_clave_maestra"
#   .\env-crypto.ps1 -Action decrypt -Password "tu_clave_maestra"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("encrypt", "decrypt")]
    [string]$Action,

    [Parameter(Mandatory=$true)]
    [string]$Password
)

$EnvFile = "backend\.env"
$EncryptedFile = "backend\.env.encrypted"

function Encrypt-File {
    param([string]$FilePath, [string]$OutputPath, [string]$Key)

    if (-not (Test-Path $FilePath)) {
        Write-Host "Error: Archivo $FilePath no encontrado" -ForegroundColor Red
        return
    }

    # Leer contenido
    $Content = Get-Content $FilePath -Raw

    # Convertir password a clave segura
    $SecurePassword = ConvertTo-SecureString $Key -AsPlainText -Force

    # Encriptar
    $EncryptedContent = ConvertFrom-SecureString (ConvertTo-SecureString $Content -AsPlainText -Force) -SecureKey $SecurePassword

    # Guardar
    $EncryptedContent | Out-File $OutputPath

    Write-Host "✓ Archivo encriptado: $OutputPath" -ForegroundColor Green
    Write-Host "⚠ IMPORTANTE: Guarda la password '$Key' en un lugar seguro" -ForegroundColor Yellow
}

function Decrypt-File {
    param([string]$FilePath, [string]$OutputPath, [string]$Key)

    if (-not (Test-Path $FilePath)) {
        Write-Host "Error: Archivo $FilePath no encontrado" -ForegroundColor Red
        return
    }

    try {
        # Leer contenido encriptado
        $EncryptedContent = Get-Content $FilePath -Raw

        # Convertir password a clave segura
        $SecurePassword = ConvertTo-SecureString $Key -AsPlainText -Force

        # Desencriptar
        $SecureString = ConvertTo-SecureString $EncryptedContent -SecureKey $SecurePassword
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)
        $Content = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

        # Guardar
        $Content | Out-File $OutputPath -NoNewline

        Write-Host "✓ Archivo desencriptado: $OutputPath" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Error al desencriptar. ¿Password incorrecta?" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

# Ejecutar acción
if ($Action -eq "encrypt") {
    Encrypt-File -FilePath $EnvFile -OutputPath $EncryptedFile -Key $Password
    Write-Host "`nAhora puedes eliminar $EnvFile si quieres (guarda la password)" -ForegroundColor Yellow
}
else {
    Decrypt-File -FilePath $EncryptedFile -OutputPath $EnvFile -Key $Password
}
