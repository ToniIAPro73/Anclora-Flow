# ⚓ Anclora Flow

**Anclora Flow** is an intelligent fiscal and financial CRM platform for freelancers and digital entrepreneurs in Spain. It features multi-language support (English/Spanish), multi-project compatibility, and a scalable modular architecture.

## 🛠️ Key Features

- Smart management of invoices, expenses, deductions, and metrics
- Modular dashboards with sidebar navigation and advanced accessibility
- Orchestrator AI assistant + specialized agents + RAG integration
- Multi-user, roles, and social authentication (Google/GitHub)
- Advanced configuration & language/theme selector
- Mobile first and responsive by design

## 🚀 Assigned ports (multi-project)

This project uses the "project-three" range:

- Frontend: **3020**
- Backend/API: **8020**
- Database: **5452**
- Extra services: 8021, 8022...

Check the workspace root port registry to avoid conflicts.

## 📦 Basic Installation & Usage

Requirements: Docker, Node.js 20+, Python 3.11+

From the project root (e.g., C:\Users\Usuario\Workspace\01_Proyectos\anclora-flow):

docker-compose up --build

Access services:

Frontend: <http://localhost:3020>
Backend: <http://localhost:8020>
AI: <http://localhost:8021>
DB: port 5452

## 📚 Further Documentation

- User manual: `docs/USER-MANUAL_EN.md`
- Architecture: `docs/ARCHITECTURE_EN.md`
- MIT License: `LICENSE_EN.md`

## 🗃️ Project Structure Overview

frontend/
backend/
ai-services/
infrastructure/
shared/
docs/
scripts/
tests/
.github/
PORTS.md (in global workspace)

## 💼 Recommended Tech Stack (Open Source)

- Frontend: Vite, Vanilla JS/React, TailwindCSS
- Backend: Node.js + Express
- AI: Python + FastAPI
- Database: PostgreSQL/Supabase
- Auth: JWT/OAuth, Passport.js/Authlib

## 👤 Author & Support

Developed by [your name or company].  
For tech support, open an issue on GitHub or see the documentation in `/docs`.

---

> For instructions in Spanish, see `README_ES.md`.
