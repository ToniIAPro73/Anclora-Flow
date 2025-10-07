#!/bin/bash

echo "🚀 Configurando entorno Anclora Flow (puertos 3020/8020/5452)"

# 1. Check dependencies
command -v docker >/dev/null 2>&1 || { echo "❌ Falta Docker."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Falta Node.js."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Falta Python 3."; exit 1; }

# 2. Copiar env por defecto
cp .env.example .env 2>/dev/null
cp frontend/.env.example frontend/.env 2>/dev/null
cp backend/.env.example backend/.env 2>/dev/null

# 3. Ajuste rápido de PUERTOS para el rango proyecto-tres
sed -i 's/^FRONTEND_PORT=.*/FRONTEND_PORT=3020/' .env frontend/.env 2>/dev/null
sed -i 's/^BACKEND_PORT=.*/BACKEND_PORT=8020/' .env backend/.env 2>/dev/null
sed -i 's/^DB_PORT=.*/DB_PORT=5452/' .env backend/.env 2>/dev/null

echo "📦 Instalando dependencias..."
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
cd ai-services && pip3 install -r requirements.txt && cd ..

echo "🐳 Levantando infraestructura Docker..."
docker-compose up -d

echo "✅ Entorno listo:"
echo "- Frontend: http://localhost:3020"
echo "- Backend:  http://localhost:8020"
echo "- AI:       http://localhost:8021 (si lo incluyes en docker-compose)"
echo "- BBDD:     puerto 5452"

echo "ℹ️ Revisa PORTS.md en el workspace para evitar solapamientos multi-proyecto."

exit 0
