# Specification: Subscriptions Module (Anclora Flow)

## 1. Resumen Ejecutivo

Implementación de un módulo centralizado para la gestión financiera recurrente ("Suscripciones"). El sistema debe manejar una dualidad estricta:

1. **Mis Gastos (Outflow):** Control de herramientas SaaS, licencias y servicios que el usuario paga.
2. **Mis Ingresos (Inflow):** Gestión de planes vendidos a clientes, cálculo de MRR/ARR y control de facturación recurrente.

El objetivo es proporcionar visibilidad financiera a largo plazo, automatizar alertas de renovación/expiración de trials y facilitar la facturación recurrente.

## 2. Historias de Usuario

### Gestión de Gastos (Expenses)

- **Como** autónomo/empresa,
- **Quiero** registrar mis suscripciones recurrentes (Zoom, Adobe, AWS) y sus frecuencias de pago,
- **Para** visualizar mis costos fijos mensuales y anuales.

- **Como** usuario,
- **Quiero** recibir una alerta 7 días antes de que finalice un "Trial" gratuito,
- **Para** cancelar el servicio antes de que se efectúe el cobro si no deseo continuarlo.

### Gestión de Ingresos (Revenue)

- **Como** proveedor de servicios,
- **Quiero** asignar planes de suscripción a mis clientes (Ej. "Mantenimiento Web Mensual"),
- **Para** automatizar la generación de facturas y prever mis ingresos.

- **Como** administrador,
- **Quiero** visualizar KPIs financieros automáticos (MRR, ARR, Churn Rate),
- **Para** evaluar la salud financiera de mi negocio de suscripciones.

## 3. Requisitos Funcionales

### 3.1 Submódulo: Mis Gastos (`subscriptions`)

- **CRUD Completo:** Crear, Leer, Actualizar, Borrar (Soft Delete) suscripciones de gastos.

* **Campos Críticos:** Servicio, Proveedor, Importe, Frecuencia (Mensual, Trimestral, Anual), Estado (Trial, Active, Paused, Cancelled).
* **Lógica de Trial:** Si `has_trial` es true, debe requerir fecha de fin y días de duración.
* **Cálculo de Costes:** Normalización de costes a base mensual para métricas agregadas.

### 3.2 Submódulo: Mis Ingresos (`customer_subscriptions`)

- **Vinculación:** Cada suscripción debe estar vinculada obligatoriamente a un `client_id` existente.

* **Ciclo de Vida:** Gestión de estados (Trial -> Active -> Past Due -> Cancelled).
* **Facturación:** Configuración de `auto_invoice` (generación automática de borrador de factura) y `invoice_day`.
* **Métricas (KPIs):**
  - **MRR (Monthly Recurring Revenue):** Suma de ingresos normalizados a mes.
  - **ARR (Annual Recurring Revenue):** MRR \* 12.
  - **Churn:** Tasa de cancelación mensual.

### 3.3 Automatización y Alertas

- **Cron Jobs:**
  - Job diario para identificar trials que expiran en 7 días (gastos e ingresos).
  - Job diario para identificar renovaciones próximas (3 días antes).
  - Job para generación de facturas (según `invoice_day`).

### 3.4 Interfaz de Usuario (UI)

- **Layout:** Vista principal con pestañas (Tabs): "Mis Gastos" vs "Mis Ingresos".

* **Componentes:**
  - Panel de métricas (Cards) dinámico según la pestaña activa.
  - Tablas de datos con badges de estado coloreados.
  - Modales/Drawers para creación y edición detallada.

## 4. Criterios de Aceptación (Gherkin)

### Escenario: Registro de Gasto con Trial

**Dado** que el usuario está en la pestaña "Mis Gastos"
**Y** abre el modal de "Nueva Suscripción"
**Cuando** ingresa "Github Copilot" como servicio, precio "10 USD", y marca "Tiene período de prueba"
**Entonces** el sistema debe obligar a ingresar "Fecha fin del trial"
**Y** al guardar, el estado inicial debe ser "Trial"
**Y** se debe programar una alerta para 7 días antes de la fecha fin.

### Escenario: Cálculo de MRR (Ingresos)

**Dado** que existen 2 suscripciones activas mensuales de 50€
**Y** existe 1 suscripción activa anual de 1200€ (100€/mes normalizado)
**Cuando** el usuario consulta el dashboard de "Mis Ingresos"
**Entonces** el KPI de MRR debe mostrar "200€" (50 + 50 + 100).

### Escenario: Validación de Fechas

**Dado** una suscripción de cliente
**Cuando** intento establecer una `start_date` posterior a `current_period_end`
**Entonces** el sistema debe rechazar la operación con un error de validación "La fecha de inicio no puede ser posterior al fin del período".

## 5. Requisitos No Funcionales & Stack

- **Frontend:** React (Vite), CSS Modules. Componentes en `PascalCase`.

* **Backend:** Node.js + Express. Validación con `Zod`.
* **Base de Datos:** PostgreSQL. Uso de Vistas SQL para cálculos complejos de KPIs.
* **Seguridad:** Validación estricta de `user_id` en todas las consultas para asegurar aislamiento de datos (Multi-tenancy lógico).

## 6. Casos Borde (Edge Cases)

- **Cambio de Moneda:** El sistema base asume una moneda principal (EUR) o requiere conversión simple. Para v1.0, se asume moneda del usuario o visualización agnóstica si no hay conversor.

* **Eliminación de Cliente:** Si se elimina un cliente en el módulo de Contactos, las suscripciones deben manejarse vía `ON DELETE CASCADE` o bloquear la eliminación (preferido: Cascade).
* **Años Bisiestos:** El cálculo de "próximo mes" debe manejar correctamente el 29 de febrero.
