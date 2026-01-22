# **Tasks: Subscriptions Module — Anclora Flow**

Estado: Pendiente  
Fase: 3 \- Tareas  
Referencia: plan.md

## **Fase 1: Base de Datos & Cimientos**

- \[ \] **TASK-01: Migración de Tablas Principales**
  - **Descripción:** Crear scripts de migración SQL para las tablas subscriptions y customer_subscriptions con todas las constraints definidas en el Plan (checks de frecuencia, claves foráneas).
  - **Archivos:** backend/src/database/migrations/00X_create_subscriptions.sql
  - **Verificación:** Ejecutar migración y verificar esquema:  
    docker compose exec db psql \-U user \-d anclora \-c "\\d subscriptions"

- \[ \] **TASK-02: Migración de Vistas Financieras (KPIs)**
  - **Descripción:** Crear scripts SQL para las vistas mrr_summary, arr_summary, upcoming_invoicing y expiring_customer_trials.
  - **Archivos:** backend/src/database/migrations/00Y_create_subscription_views.sql
  - **Verificación:** Consultar vista vacía sin errores:  
    docker compose exec db psql \-U user \-d anclora \-c "SELECT \* FROM mrr_summary LIMIT 1;"

## **Fase 2: Backend \- Mis Gastos (Expenses)**

- \[ \] **TASK-03: Lógica Core de Gastos (Service \+ Schemas)**
  - **Descripción:** Implementar esquemas Zod (subscription.schema.ts) y servicio (subscription.service.ts) con CRUD básico.
  - **Test:** Crear subscription.service.test.ts cubriendo validación de fechas (start \< end) y cálculo de estados.
  - **Verificación:**  
    node \--test backend/src/api/subscriptions/subscription.service.test.ts

- \[ \] **TASK-04: API REST de Gastos**
  - **Descripción:** Implementar subscription.controller.ts y montar rutas en subscription.routes.ts. Conectar con Express app principal.
  - **Verificación:** Curl manual o test de integración:  
    curl \-X POST <http://localhost:3000/api/subscriptions> \-d '{"serviceName": "Test"}' \-H "Content-Type: application/json"  
    \# Debe devolver 400 Bad Request (Zod validation) o 401 (Auth)

## **Fase 3: Backend \- Mis Ingresos (Revenue)**

- \[ \] **TASK-05: Lógica Core de Ingresos (Service \+ Schemas)**
  - **Descripción:** Implementar esquemas Zod (customer-subscription.schema.ts) y lógica de negocio (conversión trial, cancelación).
  - **Test:** customer-subscription.service.test.ts verificando lógica de Trial.
  - **Verificación:**  
    node \--test backend/src/api/customer-subscriptions/customer-subscription.service.test.ts

- \[ \] **TASK-06: API REST de Ingresos & KPIs**
  - **Descripción:** Implementar controlador y rutas. Incluir endpoint especial /summary que consulte las vistas SQL.
  - **Verificación:** Curl al endpoint summary:  
    curl <http://localhost:3000/api/customer-subscriptions/summary>

## **Fase 4: Frontend \- Componentes & Integración**

- \[ \] **TASK-07: Definiciones e Integración API (Hooks)**
  - **Descripción:** Definir interfaces TypeScript en frontend/src/types/subscriptions.ts y crear hook useSubscriptions.ts con fetch o axios.
  - **Archivos:** frontend/src/hooks/useSubscriptions.ts
  - **Verificación:** Comprobar que TypeScript compila sin errores de tipos.
- \[ \] **TASK-08: Componentes UI \- Mis Gastos**
  - **Descripción:** Crear ExpensesTab.tsx (Tabla) y ExpenseFormModal.tsx.
  - **Estilos:** Usar CSS Modules (Subscriptions.module.css).
  - **Verificación:** Renderizar componente aislado o verificar en navegador.
- \[ \] **TASK-09: Componentes UI \- Mis Ingresos & Panel Métricas**
  - **Descripción:** Crear RevenueTab.tsx, RevenueFormModal.tsx y el MetricsPanel.tsx (que cambia según la tab activa).
  - **Verificación:** Verificar visualización de datos mockeados en las tarjetas de métricas.
- \[ \] **TASK-10: Página Principal y Navegación**
  - **Descripción:** Ensamblar SubscriptionsPage.tsx con gestión de estado local para Tabs. Añadir ruta al router principal.
  - **Verificación:** Navegar a /subscriptions, cambiar tabs y verificar que la URL/vista responde.

## **Fase 5: Automatización (Final)**

- \[ \] **TASK-11: Cron Jobs de Alertas**
  - **Descripción:** Implementar script en backend/src/jobs/checkTrials.ts que consulte la vista de trials expirando y loguee la alerta (simulación de email).
  - **Verificación:** Ejecutar script manualmente:  
    npx ts-node backend/src/jobs/checkTrials.ts
