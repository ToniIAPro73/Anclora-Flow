# Repository Guidelines

## Project Structure & Module Organization
- `frontend/` holds the Vite app; organize UI into `src/components`, `src/pages`, and keep reusable helpers in `src/utils`.
- `backend/` exposes the Express API from `src/server.js`; mirror feature modules under `src/` and colocate request fixtures in `tests/`.
- `ai-services/` contains the FastAPI orchestrator (`main.py`) plus future models and RAG pipelines; manage Python deps through `requirements.txt`.
- `shared/` stores cross-service constants, types, and utilities; prefer referencing these instead of duplicating values across apps.
- `infrastructure/`, `scripts/`, and root `docker-compose.yml` centralize deployment, local automation, and multi-service bootstrapping.

## Build, Test, and Development Commands
- `docker-compose up --build` boots all services with hot reload; match ports with `PUERTOS.md` before exposing new containers.
- `cd frontend && npm install && npm run dev -- --host 0.0.0.0 --port 3020` starts the SPA locally.
- `cd backend && npm install && npm run dev` serves the API on `http://localhost:8020`.
- `cd ai-services && pip install -r requirements.txt && uvicorn main:app --reload --port 8001` runs the AI gateway; ensure Python 3.11+.

## Coding Style & Naming Conventions
- JavaScript: use 2-space indentation, camelCase for functions, PascalCase for components, and prefer arrow functions for stateless logic.
- Python: follow PEP 8 with 4-space indentation; snake_case for modules and functions.
- Keep environment keys uppercased with underscores (see `.env.example` files) and describe non-obvious values in comments.

## Testing Guidelines
- Populate unit tests under each package's `tests/` directory using the `*.test.js` (frontend/backend) and `test_*.py` (AI) naming patterns.
- Keep integration and end-to-end scenarios under `tests/e2e/` or `tests/performance/`; document heavy data fixtures in `docs/`.
- Until runners are wired, include the exact test command in your PR (for example `node --test`, `pytest`) and add npm or pip scripts when introducing new suites.

## Commit & Pull Request Guidelines
- Follow the existing history: concise, present-tense summaries (for example `Add invoice dashboard layout`); scope one concern per commit.
- Prefix branches with the area (`frontend/feature-...`, `backend/fix-...`) so CI and agents can route reviews quickly.
- Pull requests must outline context, testing evidence, and linked issues; attach screenshots for UI changes and note env vars or migrations.

## Configuration Tips
- Copy `.env.example` to `.env` in each service and align exposed ports with the workspace registry.
- Store secrets outside the repo; use Docker overrides or GitHub Actions secrets for shared credentials.
