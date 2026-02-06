# ⚓ Anclora Flow

[🇪🇸 Español](#español) | [🇬🇧 English](#english)

---

## 🇪🇸 Español

**Anclora Flow** es una plataforma CRM fiscal y financiera inteligente para autónomos digitales en España, con soporte multi-idioma (español/inglés), multi-proyecto y arquitectura modular escalable.

### 🛠️ Características principales

- Gestión inteligente de facturas, gastos, deducciones y métricas
- Dashboards modulares con navegación sidebar y accesibilidad avanzada
- Asistente IA orquestador + agentes especializados + RAG integrado
- Multiusuario, roles y autenticación social (Google/GitHub)
- Configuración avanzada y selección de idioma/tema
- Mobile first y responsive

### 🚀 Puertos asignados (multi-proyecto)

Este proyecto está configurado en el rango "proyecto-tres":

- **Frontend:** 3020
- **Backend/API:** 8020
- **Base de datos:** 5452
- **Servicios extra:** 8021, 8022...

Consulta el asignador de puertos en la raíz del workspace para evitar conflictos.

### 📦 Instalación y ejecución básica

**Requisitos:** Docker, Node.js 20+, Python 3.11+

Desde la raíz del proyecto:

```bash
docker-compose up --build
```

**Acceso a los servicios:**

- Frontend: http://localhost:3020
- Backend: http://localhost:8020
- IA: http://localhost:8021
- DB: puerto 5452

### 📚 Documentación adicional

- Manual de usuario: `docs/MANUAL-USUARIO.md`
- Arquitectura sistema: `docs/ARQUITECTURA.md`
- Licencia: `LICENSE.md`

### 🗃️ Estructura básica del repositorio

```
frontend/
backend/
ai-services/
infrastructure/
shared/
docs/
scripts/
tests/
.github/
```

### 💼 Stack tecnológico (open source)

- **Frontend:** Vite, Vanilla JS/React, TailwindCSS
- **Backend:** Node.js + Express
- **IA:** Python + FastAPI
- **Base de datos:** PostgreSQL/Supabase
- **Auth:** JWT/OAuth, Passport.js/Authlib

### 👤 Autor y soporte

Desarrollado por [ToniIAPro73](https://github.com/ToniIAPro73).  
Para soporte técnico, abre un issue en GitHub o consulta el manual en `/docs`.

---

## 🇬🇧 English

**Anclora Flow** is an intelligent fiscal and financial CRM platform for freelancers and digital entrepreneurs in Spain. It features multi-language support (English/Spanish), multi-project compatibility, and a scalable modular architecture.

### 🛠️ Key Features

- Smart management of invoices, expenses, deductions, and metrics
- Modular dashboards with sidebar navigation and advanced accessibility
- Orchestrator AI assistant + specialized agents + RAG integration
- Multi-user, roles, and social authentication (Google/GitHub)
- Advanced configuration & language/theme selector
- Mobile first and responsive by design

### 🚀 Assigned ports (multi-project)

This project uses the "project-three" range:

- **Frontend:** 3020
- **Backend/API:** 8020
- **Database:** 5452
- **Extra services:** 8021, 8022...

Check the workspace root port registry to avoid conflicts.

### 📦 Basic Installation & Usage

**Requirements:** Docker, Node.js 20+, Python 3.11+

From the project root:

```bash
docker-compose up --build
```

**Access services:**

- Frontend: http://localhost:3020
- Backend: http://localhost:8020
- AI: http://localhost:8021
- DB: port 5452

### 📚 Further Documentation

- User manual: `docs/USER-MANUAL_EN.md`
- Architecture: `docs/ARCHITECTURE_EN.md`
- License: `LICENSE.md`

### 🗃️ Project Structure Overview

```
frontend/
backend/
ai-services/
infrastructure/
shared/
docs/
scripts/
tests/
.github/
```

### 💼 Recommended Tech Stack (Open Source)

- **Frontend:** Vite, Vanilla JS/React, TailwindCSS
- **Backend:** Node.js + Express
- **AI:** Python + FastAPI
- **Database:** PostgreSQL/Supabase
- **Auth:** JWT/OAuth, Passport.js/Authlib

### 👤 Author & Support

Developed by [ToniIAPro73](https://github.com/ToniIAPro73).  
For tech support, open an issue on GitHub or see the documentation in `/docs`.

---

**License:** MIT - See [LICENSE.md](LICENSE.md)