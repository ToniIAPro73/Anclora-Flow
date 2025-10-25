# Script para matar procesos en el puerto especificado
# Uso: .\kill-port.ps1 -Port 8020

param(
    [Parameter(Mandatory=$true)]
    [int]$Port
)

Write-Host "🔍 Buscando procesos en el puerto $Port..." -ForegroundColor Cyan

# Obtener el PID del proceso que está usando el puerto
$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

if ($connections) {
    foreach ($connection in $connections) {
        $processId = $connection.OwningProcess

        if ($processId) {
            try {
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

                if ($process) {
                    Write-Host "🔪 Matando proceso: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
                    Stop-Process -Id $processId -Force
                    Write-Host "✅ Proceso eliminado exitosamente" -ForegroundColor Green
                    Start-Sleep -Seconds 1
                } else {
                    Write-Host "⚠️  No se pudo obtener información del proceso con PID: $processId" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "❌ Error al matar el proceso: $_" -ForegroundColor Red
            }
        }
    }
} else {
    Write-Host "✅ Puerto $Port está libre" -ForegroundColor Green
}
