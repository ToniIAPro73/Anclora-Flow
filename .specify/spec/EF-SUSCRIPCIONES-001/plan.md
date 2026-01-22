# **Technical Plan: Subscriptions Module — Anclora Flow**

Estado: Aprobado  
Fase: 2 \- Planificación Técnica  
Referencia: EF-SUSCRIPCIONES-001

## **1\. Arquitectura del Sistema**

### **1.1 Estructura de Directorios**

Cumpliendo con la segregación estricta de servicios (Frontend/Backend):

/ (root)  
├── backend/  
│ ├── src/  
│ │ ├── api/  
│ │ │ ├── subscriptions/ \# Módulo Mis Gastos (Expenses)  
│ │ │ │ ├── subscription.controller.ts  
│ │ │ │ ├── subscription.routes.ts  
│ │ │ │ ├── subscription.service.ts  
│ │ │ │ └── subscription.schema.ts \# Validaciones Zod  
│ │ │ └── customer-subscriptions/ \# Módulo Mis Ingresos (Revenue)  
│ │ │ │ ├── customer-subscription.controller.ts  
│ │ │ │ ├── customer-subscription.routes.ts  
│ │ │ │ ├── customer-subscription.service.ts  
│ │ │ │ └── customer-subscription.schema.ts  
│ │ ├── database/  
│ │ │ ├── migrations/ \# SQL Scripts (Tablas y Vistas)  
│ │ │ └── views/ \# Definiciones de vistas KPIs  
│ │ └── jobs/ \# Cron jobs (Alertas/Facturación)  
├── frontend/  
│ ├── src/  
│ │ ├── pages/  
│ │ │ └── Subscriptions/ \# Página Principal (Tabs)  
│ │ │ ├── SubscriptionsPage.tsx  
│ │ │ ├── Subscriptions.module.css  
│ │ │ ├── components/  
│ │ │ │ ├── ExpensesTab.tsx  
│ │ │ │ ├── RevenueTab.tsx  
│ │ │ │ ├── MetricsPanel.tsx \# Reutilizable  
│ │ │ │ └── forms/  
│ │ │ │ ├── ExpenseFormModal.tsx  
│ │ │ │ └── RevenueFormModal.tsx  
│ │ │ └── hooks/  
│ │ │ └── useSubscriptions.ts

## **2\. Estrategia de Base de Datos (PostgreSQL)**

### **2.1 Tablas Principales (DDL)**

Se implementarán las tablas definidas en la especificación funcional:

1. **subscriptions**: Gastos del usuario.
   - _PK:_ id (UUID)
   - _FK:_ user_id, client_id (opcional)
   - _Constraints:_ billing_frequency IN ('monthly', 'quarterly', 'yearly')
2. **customer_subscriptions**: Ingresos recurrentes de clientes.
   - _PK:_ id (UUID)
   - _FK:_ user_id, client_id (obligatorio)
   - _Logica Trial:_ has_trial, trial_start_date, trial_end_date

### **2.2 Vistas de Negocio (KPIs)**

Delegación de cálculos financieros a la base de datos para optimizar rendimiento:

1. mrr_summary: Agrupación por plan y cálculo de MRR normalizado.
2. arr_summary: Proyección anual basada en MRR (MRR \* 12).
3. upcoming_invoicing: Filtro de suscripciones activas próximas a facturar (7 días).
4. expiring_customer_trials: Monitor de conversión de trials (status trial \+ fechas).

### **2.3 Seguridad de Datos**

- **Aislamiento Lógico:** Todas las consultas SQL deben incluir obligatoriamente WHERE user_id \= $1.
- **Protección de Cascada:** La eliminación de un cliente (Client) disparará ON DELETE CASCADE en customer_subscriptions para mantener integridad referencial.

## **3\. Contrato de API (REST)**

### **3.1 Endpoints: Mis Gastos (/api/subscriptions)**

| Método | Ruta | Acción                                | Validación (Zod)         |
| :----- | :--- | :------------------------------------ | :----------------------- |
| GET    | /    | Listar con filtros (status, category) | querySchema              |
| POST   | /    | Crear gasto                           | createSubscriptionSchema |
| PUT    | /:id | Editar gasto                          | updateSubscriptionSchema |
| DELETE | /:id | Soft delete (status: cancelled)       | N/A                      |

### **3.2 Endpoints: Mis Ingresos (/api/customer-subscriptions)**

| Método | Ruta             | Acción                         | Validación (Zod)        |
| :----- | :--------------- | :----------------------------- | :---------------------- |
| GET    | /                | Listar ingresos                | querySchema             |
| GET    | /summary         | Obtener KPIs (MRR, ARR, Churn) | N/A                     |
| GET    | /expiring-trials | Listar trials por vencer       | N/A                     |
| POST   | /                | Asignar plan a cliente         | createCustomerSubSchema |
| POST   | /:id/convert     | Convertir Trial a Active       | N/A                     |
| POST   | /:id/cancel      | Cancelar (calcular fecha fin)  | cancelReasonSchema      |

## **4\. Lógica de Negocio & Validación**

### **4.1 Validaciones Zod (Backend)**

Esquemas estrictos para garantizar integridad de datos antes de tocar la DB:

- **Frecuencias:** Solo 'monthly', 'quarterly', 'yearly'.
- **Fechas:** startDate debe ser anterior a endDate. trialEndDate obligatorio si hasTrial es true.
- **Importes:** Valores no negativos.

### **4.2 Automatización (Jobs)**

Uso de cron o programador de tareas en Node.js:

1. **Daily Trial Check:** Consulta la vista expiring_customer_trials \-\> Prepara notificaciones.
2. **Daily Renewal Check:** Consulta upcoming_invoicing \-\> Genera logs o borradores de facturas.

## **5\. Estrategia de Pruebas**

Conforme a la Constitución (Node.js backend, Vite frontend):

- **Backend (node \--test):**
  - **Unitarios:** subscription.service.test.ts (cálculo de fechas, lógica de conversión de trial).
  - **Integración:** Tests de endpoints API simulando peticiones HTTP y verificando respuestas JSON y códigos de estado.
- **Frontend:**
  - Validación de formularios (React Hook Form / Zod resolver).
  - Renderizado condicional de Tabs (Gastos vs Ingresos).

## **6\. Plan de Seguridad**

- **Input Sanitization:** Zod eliminará (strip) cualquier campo no reconocido en el body de las peticiones.
- **Auth:** JWT Middleware requerido en todas las rutas /api/\*.
- **IDOR Protection:** Verificar siempre que resource.user_id \=== current_user.id antes de cualquier operación de escritura (UPDATE/DELETE).
