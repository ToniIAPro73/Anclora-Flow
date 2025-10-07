# 🏗️ Arquitectura de la aplicación — Anclora Flow

## 🔹 Visión general

Anclora Flow es una aplicación modular pensada para ser desplegada bajo arquitectura multi-servicio, escalable y portable para freelances y agencias digitales, apoyada en stack open source y costes operacionales mínimos.

## 🚦 Componentes principales

- **Frontend:** SPA moderna (Vite, JS/React, Tailwind), UI mobile-first, sidebar navegación, header configurable, i18n.
- **Backend/API:** Node.js + Express, endpoints RESTful, JWT/OAuth, gestión multiusuario y seguridad.
- **AI Services:** Python + FastAPI, orquestador de agentes, subagentes especializados, acceso RAG vía API, ingest API abierta a contribuyentes.
- **Base de datos:** PostgreSQL (Supabase/Neon), estructura multi-tenant posible.
- **Infraestructura:** Docker Compose para orquestación, envs configurables, integración con workflows CI/CD bajo GitHub Actions.
- **Documentación & tests:** Repositorio dividido limpia y profesionalmente, tests multi-nivel y documentación bilingüe.

## 🔹 Asignación de puertos

- Frontend: 3020
- Backend/API: 8020
- AI Services: 8021... (expandible)
- Base datos: 5452

(El archivo PORTS.md se ubica en la raíz del workspace para coordinar todos los proyectos activos.)

## 🔹 Autenticación y roles

- Email/contraseña y login social (Google/GitHub vía OAuth)
- Roles: usuario, contributor (edita RAG vía API), admin (panel avanzado)
- Refresh tokens y JWT protegidos en cookies HttpOnly

## 🔹 Asistente IA orquestador

- Orquestador principal accede a subagentes especializados (finanzas, suscripciones, calendario, BI, automatisación, RAG agent)
- Acceso documental vía RAG API, ingest abierto para usuarios contributor
- Sugerencias proactivas y flujos automáticos generados por IA

## 🔹 Stack recomendado (open source, presupuesto mínimo)

- **Frontend**: Vite, Vanilla JS/React, TailwindCSS
- **Backend**: Node.js + Express, Passport.js/JWT
- **IA**: Python + FastAPI, LLM local vía Ollama, embeddings Sentence-Transformers
- **DB**: PostgreSQL, Supabase, TimescaleDB opcional
- **Infra**: Docker, Docker Compose, GitHub Actions, Traefik si es necesario

## 🛡️ Seguridad y buenas prácticas

- Variables de entorno en archivos `.env` y `.env.example`
- Roles documentados, logs cifrados, protección GDPR
- Tests automatizados por componente y e2e

## 📦 Estructura recomendada

Consultar README.md para el árbol de carpetas y archivos principales.

## 🖥️ Ejemplo de integración

- Ejecutar `docker-compose up --build`
- Acceso por puertos: 3020 (frontend), 8020 (backend), 8021 (ai), 5452 (DB)
- Consultar PORTS.md del workspace antes de desplegar nuevos proyectos.

---

Esta arquitectura favorece la integración continua y la independencia entre módulos, permitiendo, además, evolución progresiva (React/Vue para componentes, microservicios para escalar, etc.).
