# Constitution — Anclora Flow

## Proposito
Definir las reglas de oro del proyecto Anclora Flow y el stack tecnologico para mantener coherencia, calidad y velocidad de desarrollo.

## Reglas de oro
- Mantener el codigo de cada servicio en su carpeta: `frontend/`, `backend/`, `ai-services/`.
- Reutilizar utilidades y constantes en `shared/` y documentar flujos complejos en `docs/`.
- Respetar la estructura de UI: paginas en `frontend/src/pages`, componentes en `frontend/src/components`, helpers en `frontend/src/utils`.
- No exponer secretos; usar `.env` a partir de `.env.example` y gestionar credenciales con Docker/CI.
- Alinear puertos con `PUERTOS.md` y documentar cualquier desviacion.
- Seguir convenciones de estilo: JS con 2 espacios, funciones camelCase, componentes PascalCase; Python PEP 8 con docstrings publicas.
- Mantener pruebas cerca del servicio: `*.test.js` en frontend/backend y `test_*.py` en `ai-services/tests`.
- Evitar cambios mezclados en commits y PRs; incluir comandos de prueba y evidencia.

## Stack tecnologico
- Frontend: Vite, JavaScript/TypeScript, CSS modular (componentes y estilos globales).
- Backend: Node.js + Express.
- AI Gateway: Python + FastAPI.
- Base de datos: PostgreSQL (local o gestionada).
- Auth: JWT/OAuth (segun proveedor integrado).
- Infraestructura: Docker Compose para orquestacion local.
- Pruebas: `node --test` para servicios Node y `pytest` para FastAPI.
