# PROYECTO_Anclora-Flow

## Resumen
Anclora Flow es un CRM fiscal y financiero para autonomos y profesionales digitales en Espana. Combina dashboards, facturacion, gastos, deducciones y analitica con un stack multi-servicio (frontend, backend y AI services) y despliegue con Docker.

## Usuarios y objetivos
- Autonomos y freelancers que necesitan control fiscal, facturas y reportes.
- Equipos pequenos con multi-proyecto y multi-usuario.
- Operadores que requieren cumplimiento (p. ej. VeriFactu) y trazabilidad.

## Arquitectura funcional
- Frontend (Vite SPA): dashboards, tablas, filtros, configuracion, idioma/tema.
- Backend (Express): API de negocio, auth, roles, reglas fiscales, integraciones.
- AI services (FastAPI): orquestador de agentes y flujos RAG para asistencia.
- Infraestructura: docker-compose, puertos definidos, scripts de arranque y demo.
- Shared/tests/docs: utilidades comunes, pruebas y guias operativas.

## Funcionalidades (detalle)
- Gestion de clientes y proyectos con columnas dedicadas.
- Facturacion completa: creacion, edicion, estados, exportaciones.
- Gastos y deducciones con clasificacion fiscal.
- Analitica de ingresos y KPIs por periodo.
- Asistente AI con agentes especializados y contexto RAG.
- Configuracion de idioma, tema y preferencias de usuario.
- Flujo de acceso multi-usuario con roles y login social.
- Integracion fiscal documentada (VeriFactu) y guias de reinicio.
- Scripts de setup, datos demo y atajos de arranque.

## Datos e integraciones
- Base de datos relacional (Postgres recomendado por docker-compose).
- Integracion fiscal (VeriFactu) y futuras APIs contables.
- Logs y snapshots con capturas de UI para QA.

## Operacion y observabilidad
- Docker para levantar todo el stack.
- Puertos documentados y scripts de control.
- Guas rapidas en docs y notas de integracion.

## Areas de mejora
- Unificar contratos API entre frontend/backend/AI para reducir acoplamiento.
- Completar cobertura de pruebas por modulo (facturas, gastos, permisos).
- Endurecer validaciones fiscales y reglas de negocio (impuestos, estados).
- Estabilizar pipelines AI (contexto, prompt templates, logging de respuestas).
- Estandarizar configuracion por entorno con .env.example por servicio.

## Plan de mejora por fases

### Fase 1 - Fundacion y claridad operativa
Objetivo: reducir friccion de onboarding y asegurar consistencia de datos.
- Documentar contratos API y modelos de dominio (clientes, facturas, gastos).
- Consolidar variables de entorno y puertos en un solo lugar.
- Normalizar seed data y scripts de demo para QA repetible.
- Criterios de exito: entorno dev levanta con un comando y datos demo coherentes.

### Fase 2 - Calidad y cumplimiento fiscal
Objetivo: minimizar regresiones y riesgos legales.
- Suite de tests por modulo (backend + frontend) con casos fiscales criticos.
- Validadores de estados de factura, numeracion y reglas de impuestos.
- Logs de auditoria y trazabilidad de cambios en facturas.
- Criterios de exito: cobertura minima acordada y checks obligatorios en PR.

### Fase 3 - Valor AI y analitica avanzada
Objetivo: hacer que el asistente sea accionable y confiable.
- Pipeline RAG con fuentes contables internas y FAQ fiscal.
- Respuestas con citas y logging de decisiones AI.
- Panel de metricas y recomendaciones por periodo fiscal.
- Criterios de exito: mejoras medibles en ahorro de tiempo y calidad de respuesta.

### Fase 4 - Escala y operacion
Objetivo: operar con multiples clientes y mayor volumen.
- CI/CD con despliegues por ambiente y backups automatizados.
- Observabilidad (tracing, alertas) y cuotas por usuario.
- Evaluacion de multi-tenancy si el producto lo requiere.

## Top 3 mejoras priorizadas (impacto/esfuerzo)
1) Contratos API unificados y validadores de dominio (alto impacto / medio esfuerzo).
2) Suite de tests por modulo fiscal critico (alto impacto / alto esfuerzo).
3) Consola de observabilidad basica (medio impacto / medio esfuerzo).

## Riesgos tecnicos y dependencias externas
- Riesgo: inconsistencias de datos entre servicios si no se estandarizan contratos.
- Riesgo: reglas fiscales cambiantes (VeriFactu) pueden romper flujos.
- Dependencias: Postgres, Docker, servicios AI locales y posibles APIs fiscales.

## Matriz impacto/esfuerzo (detalle)
| Mejora | Impacto | Esfuerzo |
| --- | --- | --- |
| Contratos API unificados y validadores de dominio | Alto | Medio |
| Suite de tests por modulo fiscal critico | Alto | Alto |
| Consola de observabilidad basica | Medio | Medio |

## Dependencias por criticidad y mitigaciones
- Criticas: Docker/Compose, Postgres, servicios locales (backend/AI).
- Altas: Integracion fiscal (VeriFactu), validaciones fiscales.
- Medias/Bajas: Frontend Vite, tooling de scripts y docs.
- Mitigaciones: contratos API versionados, tests fiscales, backups y seeds.
