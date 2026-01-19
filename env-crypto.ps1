# Script para encriptar/desencriptar archivo .env
# Uso:
#   $securePass = Read-Host -AsSecureString -Prompt "Ingresa tu clave maestra"
#   .\env-crypto.ps1 -Action encrypt -SecurePassword $securePass
#   .\env-crypto.ps1 -Action decrypt -SecurePassword $securePass

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("encrypt", "decrypt")]
    [string]$Action,

    [Parameter(Mandatory=$true)]
    [SecureString]$SecurePassword
)

$EnvFile = "backend\.env"
$EncryptedFile = "backend\.env.encrypted"

function Protect-EnvFile {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$FilePath,
        
        [Parameter(Mandatory=$true)]
        [string]$OutputPath,
        
        [Parameter(Mandatory=$true)]
        [SecureString]$Key
    )

    if (-not (Test-Path $FilePath)) {
        Write-Host "Error: Archivo $FilePath no encontrado" -ForegroundColor Red
        return
    }

    # Leer contenido
    $Content = Get-Content $FilePath -Raw

    # Encriptar
    $EncryptedContent = ConvertFrom-SecureString (ConvertTo-SecureString $Content -AsPlainText -Force) -SecureKey $Key

    # Guardar
    $EncryptedContent | Out-File $OutputPath

    Write-Host "✓ Archivo encriptado: $OutputPath" -ForegroundColor Green
    Write-Host "⚠ IMPORTANTE: Guarda la password en un lugar seguro" -ForegroundColor Yellow
}

function Unprotect-EnvFile {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$FilePath,
        
        [Parameter(Mandatory=$true)]
        [string]$OutputPath,
        
        [Parameter(Mandatory=$true)]
        [SecureString]$Key
    )

    if (-not (Test-Path $FilePath)) {
        Write-Host "Error: Archivo $FilePath no encontrado" -ForegroundColor Red
        return
    }

    try {
        # Leer contenido encriptado
        $EncryptedContent = Get-Content $FilePath -Raw

        # Desencriptar
        $SecureString = ConvertTo-SecureString $EncryptedContent -SecureKey $Key
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
    Protect-EnvFile -FilePath $EnvFile -OutputPath $EncryptedFile -Key $SecurePassword
    Write-Host "`nAhora puedes eliminar $EnvFile si quieres (guarda la password)" -ForegroundColor Yellow
}
else {
    Unprotect-EnvFile -FilePath $EncryptedFile -OutputPath $EnvFile -Key $SecurePassword
}
