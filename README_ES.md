# ⚓ Anclora Flow

**Anclora Flow** es una plataforma CRM fiscal y financiera inteligente para autónomos digitales en España, con soporte multi-idioma (español/inglés), multi-proyecto y arquitectura modular escalable.

## 🛠️ Características principales

- Gestión inteligente de facturas, gastos, deducciones y métricas
- Dashboards modulares con navegación sidebar y accesibilidad avanzada
- Asistente IA orquestador + agentes especializados + RAG integrado
- Multiusuario, roles y autenticación social (Google/GitHub)
- Configuración avanzada y selección de idioma/tema
- Mobile first y responsive

## 🚀 Puertos asignados (multi-proyecto)

Este proyecto está configurado en el rango "proyecto-tres":

- Frontend: **3020**
- Backend/API: **8020**
- Base de datos: **5452**
- Servicios extra: 8021, 8022...

Consulta el asignador de puertos en la raíz del workspace para evitar conflictos.

[image:1]  
Resumen técnico y de integración para Anclora Flow en entorno multi-proyecto.

## 📦 Instalación y ejecución básica

Requisitos: Docker, Node.js 20+, Python 3.11+

Desde la raíz del proyecto (por ejemplo, C:\Users\Usuario\Workspace\01_Proyectos\anclora-flow):

docker-compose up --build

Acceso a los servicios:

Frontend: <http://localhost:3020>
Backend: <http://localhost:8020>
IA: <http://localhost:8021>
DB: puerto: 5452

## 📚 Documentación adicional

- Manual de usuario: `docs/MANUAL-USUARIO.md`
- Arquitectura sistema: `docs/ARQUITECTURA.md`
- Licencia (MIT): `LICENSE.md`

## 🗃️ Estructura básica del repositorio

frontend/
backend/
ai-services/
infrastructure/
shared/
docs/
scripts/
tests/
.github/
PORTS.md (en workspace global)

## 💼 Stack tecnológico (open source recomendado)

- Frontend: Vite, Vanilla JS/React, TailwindCSS
- Backend: Node.js + Express
- IA: Python + FastAPI
- Base de datos: PostgreSQL/Supabase
- Auth: JWT/OAuth, Passport.js/Authlib

## 👤 Autor y soporte

Desarrollado por [tu nombre o empresa].  
Para soporte técnico, abrir un issue en GitHub o consulta el manual en `/docs`.

---

> Para instrucciones en inglés, consulta `README_EN.md`.
