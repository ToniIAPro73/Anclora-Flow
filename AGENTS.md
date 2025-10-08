# Repository Guidelines

## Project Structure & Module Organization
- Services live under `frontend/`, `backend/`, and `ai-services/`; keep feature code within its owning service folder.
- Shared utilities and constants belong in `shared/`, while repository-level end-to-end flows reside in `tests/`.
- Frontend pages go in `frontend/src/pages`, reusable UI in `frontend/src/components`, and helpers in `frontend/src/utils`.
- Express code runs from `backend/src/server.js` with feature folders under `backend/src`; FastAPI starts at `ai-services/main.py` with orchestrators, pipelines, and models under `ai-services/src`.
- Place HTTP fixtures in `backend/tests` and Python suites in `ai-services/tests`; document complex workflows in `docs/`.

## Build, Test, and Development Commands
- `docker-compose up --build`: boots all services with hot reload; confirm ports in `PUERTOS.md`.
- `cd frontend && npm install && npm run dev -- --host 0.0.0.0 --port 3020`: starts the Vite SPA.
- `cd backend && npm install && npm run dev`: serves the Express API on `http://localhost:8020`.
- `cd ai-services && pip install -r requirements.txt && uvicorn main:app --reload --port 8001`: launches the AI gateway (Python 3.11+).

## Coding Style & Naming Conventions
- JavaScript: 2-space indentation, camelCase functions, PascalCase components/hooks, arrow functions for stateless helpers, and side effects inside service modules.
- Python: PEP 8 with 4 spaces, snake_case modules, and docstrings for public endpoints.
- Store shared literals and environment keys (SCREAMING_SNAKE_CASE) in `shared/`; comment only on non-obvious behavior.

## Testing Guidelines
- Co-locate unit tests in each service’s `tests/` folder; name frontend/backend specs `*.test.js` and Python suites `test_*.py`.
- Run Node suites with `node --test` from the service root and FastAPI suites with `pytest`; record the command in PRs.
- Keep integration or performance suites in `tests/e2e` or `tests/performance`, documenting heavy fixtures in `docs/`.

## Commit & Pull Request Guidelines
- Write present-tense, scoped commits (e.g., `frontend/add-auth-modal`) and avoid mixing unrelated changes.
- PRs must include context, testing evidence (commands + results), linked issues, and screenshots for UI updates.
- Call out new env vars, migrations, or manual steps so reviewers can reproduce locally.

## Security & Configuration Tips
- Copy `.env.example` to `.env` for each service; never commit secrets.
- Align ports with `PUERTOS.md`; document deviations in `docs/`.
- Prefer Docker overrides or CI secrets for credentials and review dependency upgrades promptly.
