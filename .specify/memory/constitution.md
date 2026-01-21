# Constitution — Anclora Flow

## Proposito

Definir principios inmutables (hard guardrails) para anclar decisiones tecnicas, seguridad y calidad durante especificacion, planificacion e implementacion.

## Principios inmutables

### 1) Stack tecnologico (innegociable)

- Frontend: Vite con JavaScript/TypeScript. No introducir frameworks alternativos ni migraciones parciales.
- Backend API: Node.js + Express. No implementar servicios backend en otros lenguajes.
- AI Gateway: Python 3.11+ con FastAPI. No reemplazar por Node u otros frameworks.
- Base de datos: PostgreSQL para persistencia primaria. No incorporar motores no aprobados.
- Infraestructura local: Docker Compose para orquestacion. No depender de despliegues manuales.

### 2) Seguridad y cumplimiento (hard guardrails)

- Cero secretos en codigo o logs: usar `.env` desde `.env.example` y gestores de secretos en CI.
- No implementar autenticacion propia; usar proveedores OIDC/OAuth/JWT aprobados.
- No enviar datos sensibles a servicios externos sin cifrado y aprobacion explicita.

### 3) Calidad y pruebas (validable)

- Todo cambio funcional debe incluir pruebas del servicio correspondiente.
- Frontend/Backend: `node --test` debe pasar sin errores.
- AI services: `pytest` debe pasar sin errores.
- El codigo debe cumplir con los linters del proyecto sin advertencias.

### 4) Arquitectura y UX (consistencia)

- Mantener la estructura: `frontend/`, `backend/`, `ai-services/`, `shared/`, `tests/`, `docs/`.
- UI: paginas en `frontend/src/pages`, componentes en `frontend/src/components`, utilidades en `frontend/src/utils`.
- Documentar flujos complejos en `docs/` y evitar duplicacion de logica entre servicios.

### 5) Gobernanza SDD (Spec Kit)

- La Constitucion es la fuente suprema; si una solicitud la viola, se debe adaptar o rechazar.
- La planificacion debe validar cumplimiento con esta Constitucion antes de ejecutar cambios.
- La implementacion debe incluir una verificacion explicita de estos principios.

## Ubicacion canonica

- Ruta esperada por Spec Kit: `.specify/memory/constitution.md`.
- Este archivo es la version operativa para Anclora Flow y debe mantenerse sincronizada si se copia a la ruta canonica.
