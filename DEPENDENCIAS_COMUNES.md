# DEPENDENCIAS_COMUNES

## Criticas (bloqueo operativo)
- Docker y Docker Compose (orquestacion local/dev)
- Postgres/SQLite (persistencia base segun proyecto)
- Redis (colas/estado donde aplica)
- Ollama (modelos locales de texto/analisis)
- Supabase (auth y perfiles donde aplica)

## Altas (afectan calidad o continuidad)
- Qdrant/ChromaDB (vectoriales en RAG/Cortex)
- Pandoc/Mammoth (import/export editorial en Press/Nexus)
- WhatsApp Web/Baileys (ingesta en Whatapp-Analizer)
- Evolution API (canal WhatsApp en Private Estates)
- OpenAI (IA en Impulso)
- OAuth providers (Kairon-Kiro)

## Medias/Bajas (mejoran UX/operacion)
- Next.js (App Router) en varios proyectos
- React + Vite en SPAs (Adapt, Cortex)
- Tailwind/shadcn/Radix (UI components)
- Express/Node y FastAPI/Flask (backends por servicio)
- Prisma (ORM en Press/Impulso)
- Playwright (scraping/QA en Whatapp-Analizer)
- Prometheus/Grafana (observabilidad en Private Estates)
- CI/CD GitHub Actions (Private Estates, RAG Generic)
