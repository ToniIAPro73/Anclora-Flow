# DEPENDENCIAS_POR_PROYECTO

## Anclora-Flow
- Criticas: Docker/Compose, Postgres, servicios locales (backend/AI).
- Altas: Integracion fiscal (VeriFactu), validaciones fiscales.
- Medias/Bajas: Frontend Vite, tooling de scripts y docs.
- Mitigaciones: contratos API versionados, tests fiscales, backups y seeds.

## Anclora_Private_Estates
- Criticas: Redis/BullMQ, Evolution API, CI/CD para despliegue.
- Altas: Observabilidad (Prometheus/Grafana), webhooks seguros.
- Medias/Bajas: UI Next.js, tooling de performance.
- Mitigaciones: fallback por canal, health checks, rate limits y DR runbooks.

## Anclora-Adapt
- Criticas: Ollama, endpoints locales de imagen/voz.
- Altas: Configuracion de modelos y prompts.
- Medias/Bajas: Vite/React, scripts de salud.
- Mitigaciones: health checks en arranque, contratos tipados, timeouts y fallback.

## Anclora-Whatapp-Analizer
- Criticas: WhatsApp Web/Baileys, Postgres, Playwright/Chromium.
- Altas: Scrapers por dominio y estabilidad de sesiones.
- Medias/Bajas: Scripts de stats y CLI.
- Mitigaciones: cola con reintentos, dedupe por URL, snapshots de scraping.

## Anclora-Press-GLM-4_6
- Criticas: Pandoc, Prisma/SQLite, Next.js.
- Altas: MDXEditor/Tiptap, pipeline import/export.
- Medias/Bajas: UI components y animaciones.
- Mitigaciones: fixtures de conversion, timeouts y limites de archivo.

## Anclora_Impulso
- Criticas: Postgres (Neon), API backend, auth JWT.
- Altas: OpenAI y calidad de rutinas.
- Medias/Bajas: UI Next.js, librerias de charts.
- Mitigaciones: validacion de rutinas, fallback sin IA, tests de seguridad.

## Anclora_Nexus
- Criticas: Librerias de conversion (Pandoc u otras), backend Python.
- Altas: Pipeline de conversion, manejo de archivos grandes.
- Medias/Bajas: UI React, tooling de docs.
- Mitigaciones: colas, validaciones comunes, snapshots por formato.

## Anclora_Cortex
- Criticas: Llama.cpp/LangChain, Supabase, Docker.
- Altas: ChromaDB, N8N, agentes especializados.
- Medias/Bajas: PWA y UI.
- Mitigaciones: cache, limites de carga, validacion de output.

## Anclora-RAG-Generic
- Criticas: Qdrant, Postgres, Redis, Docker.
- Altas: Ollama/embeddings, pipelines de ingestion.
- Medias/Bajas: Next.js dashboard, landing.
- Mitigaciones: backups, benchmarks de retrieval, limites por plan.

## Anclora-Kairon-Kiro
- Criticas: Supabase, Vite builds (landing/app), auth state compartido.
- Altas: OAuth providers y flujos de recuperacion.
- Medias/Bajas: UI components y estilos compartidos.
- Mitigaciones: fallback mock, reintentos, pruebas de integracion y monitoreo.
