# 🚀 Inicio Automático en Windows - Anclora Flow

Esta guía te muestra cómo iniciar Anclora Flow en Windows con scripts automáticos que **matan procesos en puertos ocupados** antes de iniciar.

## ✨ Características

Los scripts automáticos:
- ✅ Matan automáticamente procesos en puertos 8020 y 5173
- ✅ Inician PostgreSQL si no está corriendo
- ✅ Verifican que la base de datos esté inicializada
- ✅ Inician backend y frontend en los puertos correctos
- ✅ Nunca más "port already in use"

---

## 🎯 Método 1: Script Maestro (Recomendado)

### Paso 1: Ejecutar el Script Maestro

```powershell
# Desde el directorio raíz de Anclora-Flow
.\start-all.ps1
```

Este script automáticamente:
1. ✅ Verifica que Docker esté instalado
2. ✅ Inicia PostgreSQL (o usa el contenedor existente)
3. ✅ Verifica/inicializa la base de datos
4. ✅ **Mata cualquier proceso en puerto 8020**
5. ✅ **Mata cualquier proceso en puerto 5173**
6. ✅ Inicia el backend

### Paso 2: Iniciar el Frontend

Abre **otra ventana de PowerShell** y ejecuta:

```powershell
cd frontend
.\start.ps1
```

O usa npm:

```powershell
cd frontend
npm run start:win
```

---

## 🎯 Método 2: Scripts Individuales

### Backend

```powershell
cd backend
.\start.ps1
```

O:

```powershell
cd backend
npm run start:win
```

**Qué hace:**
- 🔪 Mata cualquier proceso en puerto 8020
- 🚀 Inicia el backend en puerto 8020

### Frontend

```powershell
cd frontend
.\start.ps1
```

O:

```powershell
cd frontend
npm run start:win
```

**Qué hace:**
- 🔪 Mata cualquier proceso en puerto 5173
- 🔪 Mata cualquier proceso en puerto 3020
- 🚀 Inicia Vite en puerto 5173

---

## 🔧 Scripts Disponibles

### Desde la Raíz

```powershell
# Iniciar todo (PostgreSQL + Backend, luego pide que inicies Frontend)
.\start-all.ps1
```

### Desde Backend

```powershell
# Matar puerto 8020 e iniciar backend
.\start.ps1

# O con npm
npm run start:win

# Solo matar puerto 8020
.\kill-port.ps1 -Port 8020
# O
npm run kill-port
```

### Desde Frontend

```powershell
# Matar puertos 5173 y 3020, e iniciar frontend
.\start.ps1

# O con npm
npm run start:win

# Solo matar puerto 5173
.\kill-port.ps1 -Port 5173
# O
npm run kill-port
```

---

## 🐛 Solución de Problemas

### Error: "No se puede ejecutar scripts en este sistema"

**Solución:**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Escribe `S` o `Y` cuando te lo pida.

### Los scripts no matan el proceso

Ejecuta PowerShell **como Administrador** y vuelve a intentar.

### Puerto sigue ocupado después de ejecutar el script

Verifica manualmente qué proceso lo está usando:

```powershell
# Ver qué proceso usa el puerto 8020
Get-NetTCPConnection -LocalPort 8020 | Select-Object -Property LocalPort, OwningProcess
```

Luego mata el proceso:

```powershell
# Reemplaza XXXX con el PID que viste arriba
Stop-Process -Id XXXX -Force
```

---

## 📝 Ejemplo de Uso Diario

### Mañana (Primera vez)

```powershell
# Terminal 1: Iniciar todo
.\start-all.ps1
# (presiona ENTER cuando te lo pida)

# Terminal 2: Iniciar frontend
cd frontend
.\start.ps1
```

### Durante el día (reinicios)

Si el backend se quedó colgado:

```powershell
cd backend
.\start.ps1   # Mata el proceso viejo e inicia uno nuevo
```

Si el frontend se quedó colgado:

```powershell
cd frontend
.\start.ps1   # Mata el proceso viejo e inicia uno nuevo
```

---

## 🔍 Verificar que Todo Funciona

### Backend

```powershell
Invoke-RestMethod http://localhost:8020/api/health
```

Resultado esperado:
```
status    : ok
message   : Anclora Flow API está funcionando
```

### Frontend

Abre en el navegador:
```
http://localhost:5173
```

---

## 📦 Estructura de Scripts

```
Anclora-Flow/
├── start-all.ps1              # Script maestro (inicia todo)
├── backend/
│   ├── start.ps1             # Inicia backend (mata puerto 8020)
│   └── kill-port.ps1         # Mata proceso en puerto especificado
└── frontend/
    ├── start.ps1             # Inicia frontend (mata puertos 5173 y 3020)
    └── kill-port.ps1         # Mata proceso en puerto especificado
```

---

## ⚡ Comandos Rápidos

```powershell
# Matar y reiniciar backend
cd backend; .\start.ps1

# Matar y reiniciar frontend
cd frontend; .\start.ps1

# Matar solo el puerto 8020
cd backend; .\kill-port.ps1 -Port 8020

# Matar solo el puerto 5173
cd frontend; .\kill-port.ps1 -Port 5173

# Ver qué proceso usa un puerto
Get-NetTCPConnection -LocalPort 8020
```

---

## 🎉 Ventajas

- ✅ **Nunca más "port already in use"**
- ✅ Scripts con colores y mensajes claros
- ✅ Un solo comando para iniciar todo
- ✅ Compatible con npm scripts
- ✅ Mata procesos automáticamente

---

## 📚 Siguiente Paso

Una vez que todo esté corriendo:

1. Abre http://localhost:5173/register.html
2. Crea tu usuario
3. Accede al dashboard
4. Crea tu primera factura
5. Regístrala en Verifactu

---

**¡Disfruta desarrollando con Anclora Flow!** 🚀
