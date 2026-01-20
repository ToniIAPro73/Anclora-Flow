A continuación tienes el documento completo unificado, listo para pegar tal cual en `docs/ESPECIFICACIONES-FUNCIONALES-ANCLORA-FLOW.md`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***

# ESPECIFICACIONES FUNCIONALES – ANCLORA FLOW

> Versión: 1.0 (borrador funcional inicial)  
> Destino: `docs/ESPECIFICACIONES-FUNCIONALES-ANCLORA-FLOW.md`  
> Alcance: definición funcional por módulos + validaciones necesarias (BD, backend, frontend) para garantizar consistencia de datos y UX sin fisuras. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***

## 1. Visión general

### 1.1. Objetivo de la aplicación

Anclora Flow es una aplicación de gestión de **flujos económico‑administrativos** para autónomos y pequeñas empresas. Se centra en: [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

- Controlar **facturas emitidas** y **pagos/ingresos** asociados. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Registrar y analizar **gastos y deducciones fiscales**. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Gestionar **clientes y proyectos** para analizar rentabilidad. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Ofrecer un **dashboard financiero** y **módulo de informes** con KPIs clave. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Integrar un **Asistente IA** para interpretación de datos y apoyo a la toma de decisiones. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Arquitectura:

- **Frontend** (`/frontend`): SPA en React + Vite (TypeScript), con punto de entrada `src/main.js` / `src/App.tsx`, páginas en `src/pages`, componentes en `src/components`, servicios HTTP en `src/services` y estilos en `src/styles`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- **Backend** (`/backend`): Node/Express en TypeScript (`src/server.ts`), módulos `api`, `models`, `repositories`, `services`, `middleware`, `database`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- **Base de datos**: PostgreSQL (contenedor `anclora-postgres`, BD `anclora_flow`). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- **Infra**: `docker-compose.yml`, scripts PowerShell de setup y arranque (`start-all.ps1`, `setup-demo-data.ps1`, etc.). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Documentación ya existente relevante (no se replica, se extiende):

- `docs/anclora-flow-guide.md`  
- `docs/ANÁLISIS COMPLETO INTEGRACIÓN EN ANCLORA FLOW.md`  
- `docs/dashboard-mock.md`  
- `docs/DASHBOARD DE INGRESOS & FACTURAS.md`  
- Guías de UI:  
  - `DIRECTRICES-TABLAS-RESPONSIVAS-ANCLORA-FLOW.md`  
  - `DIRECTRICES-VIEWPORT-ANCLORA-FLOW.md`  
  - `GUIA_MODALES.md`  
  - `GUIA_TABLAS.md`  
  - `SOLUCION_COLORES_TABLAS.md`  
  - `ANALISIS-MODAL-FACTURA-INCUMPLIDOR-v2.md` [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Este documento define **qué hace cada módulo**, **cómo se traduce en BD, servicios y pantallas**, y qué **validaciones** se necesitan para garantizar:

- Coherencia de datos entre tablas y estados. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Comportamiento predecible (sin estados “imposibles”). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- UX clara y sencilla, comparable a otras apps de facturación/gestión. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***

## 2. Módulo Usuarios y Autenticación

### 2.1. Funcionalidad principal

- **Registro / alta de usuario** (real y demo). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- **Login** con email + contraseña. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- **Gestión de sesión** (token, middleware de autenticación). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Diferenciar al menos:
  - `ADMIN` (propietario / superusuario). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - `USER` (uso normal). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - `READONLY` (solo lectura). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 2.2. Especificaciones funcionales

#### 2.2.1. Alta de usuario

Entradas:

- `email` (obligatorio, formato email). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `password` (obligatorio). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `name` (obligatorio). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `role` (opcional, por defecto `USER`). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Reglas:

- No se permite duplicar `email`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- La contraseña se guarda como `password_hash` usando hash fuerte (bcrypt u otro). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `role` solo puede ser uno de los valores permitidos. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

#### 2.2.2. Login

Entradas:

- `email`, `password`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Reglas:

- Si `email` no existe o la contraseña es incorrecta → error genérico de credenciales. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Si `is_active = FALSE` → denegar acceso con mensaje específico. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Generar token (JWT u otro) y devolver datos básicos de usuario. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

#### 2.2.3. Control de sesión

Backend:

- Middleware que:
  - Lee token de cabecera/cookie. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Valida firma, expiración y existencia de usuario. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Verifica `is_active`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Frontend:

- Si no hay token válido → redirigir a login. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Si hay token → cargar layout principal. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 2.3. Modelo de datos y validaciones

#### 2.3.1. Base de datos

Tabla `users` (esquema recomendado):

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('ADMIN', 'USER', 'READONLY')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  is_demo       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Motivos:

- Garantizar unicidad de email. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Evitar roles arbitrarios. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Poder desactivar usuarios sin borrarlos. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Distinguir usuario demo. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

#### 2.3.2. Backend

- Validar DTOs (Zod/Joi/class-validator):
  - Email: string, patrón de email. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Password:
    - Longitud mínima 8–10 caracteres. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
    - Al menos un dígito y una letra. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Role: solo valores permitidos. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Rate limiting en login (ej. 5 intentos / 5 min / IP+email). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

#### 2.3.3. Frontend

- Formularios de login y registro con:
  - `required` en campos. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Validación en cliente de email y password (fortaleza mínima). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Mensajes de error claros y consistentes. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***

## 3. Módulo de Navegación y Selección de Tabla

### 3.1. Funcionalidad principal

- Permitir al usuario cambiar entre distintas **tablas de trabajo**:
  - Facturas, Pagos/Ingresos, Gastos, Clientes, Proyectos, Dashboard, etc. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Mostrar tablas **responsive** con columnas definidas por tipo de dato. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Gestionar estado global:
  - `selectedTable`, `filters`, `pagination`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Directrices en:

- `DIRECTRICES-TABLAS-RESPONSIVAS-ANCLORA-FLOW.md`  
- `GUIA_TABLAS.md`  
- `SOLUCION_COLORES_TABLAS.md`  
- `DEBUG_SELECCION_TABLA.md` [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 3.2. Especificaciones funcionales

#### 3.2.1. Selección de tabla

Entradas:

- Click en menú / navegación. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Parámetro en URL (`?table=invoices`). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Reglas:

- Solo se aceptan IDs de tabla en una lista cerrada (`TABLES = ['invoices', 'payments', 'expenses', 'clients', 'projects', 'dashboard']`). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Si llega un valor no reconocido:
  - No se cambia `selectedTable`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Se usa una tabla por defecto (`invoices`). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Se muestra aviso no intrusivo. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

#### 3.2.2. Filtros y paginación

- Cada tabla tiene sus filtros propios (fechas, estados, cliente, proyecto, etc.). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Al cambiar de tabla:
  - `filters` se resetea a `DEFAULT_FILTERS[tabla]`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - `page` vuelve a 1. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

#### 3.2.3. Estados de carga y error

- Por tabla:
  - `isLoading`, `error`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Spinner/skeleton en carga. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Mensaje y botón “Reintentar” en error. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 3.3. Validaciones recomendadas

Frontend:

- Tipo `TableId` restringiendo valores válidos. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Validar parámetro `table` de la URL antes de aplicarlo. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Reset explícito de filtros/paginación al cambiar de tabla. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Backend:

- Validar `table` en endpoints parametrizados. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Validar filtros:
  - `from_date <= to_date`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - `min_amount <= max_amount`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Estados dentro de set permitido. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***

## 4. Módulo Facturas e Ingresos (incluye Incumplidores)

### 4.1. Objetivos funcionales

- Registrar y gestionar **facturas**: [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Datos de cliente, fechas, importes. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Estado de ciclo de vida (borrador, emitida, vencida, cobrada, incumplida, anulada). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Registrar **ingresos / cobros** asociados (pagos totales o parciales). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Identificar **facturas incumplidas** (incumplidores). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Alimentar el dashboard y los informes. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Integrar el **modal de Factura Incumplidor** descrito en `ANALISIS-MODAL-FACTURA-INCUMPLIDOR-v2.md`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 4.2. Modelo funcional de datos

#### 4.2.1. Tabla `invoices`

Campos mínimos:

- `id` (PK). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `user_id` (FK). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `customer_id` (FK a `customers`). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `project_id` (FK opcional a `projects`). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `invoice_number` (único por usuario/año/serie). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `issue_date`, `due_date`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `gross_amount`, `tax_amount`, `total_amount`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `status`:
  - `DRAFT`, `ISSUED`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `DEFAULTED`, `CANCELLED`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `is_manually_defaulted` (boolean). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `created_at`, `updated_at`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Validaciones BD:

- `total_amount > 0`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `due_date >= issue_date`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `status` con CHECK sobre la lista anterior. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

#### 4.2.2. Tabla `payments`

Campos:

- `id` (PK). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `invoice_id` (FK a `invoices`). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `amount`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `payment_date`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `method` (`BANK_TRANSFER`, `CASH`, `CARD`, `BIZUM`, `OTHER`). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `status` (`PENDING_CONFIRMATION`, `CONFIRMED`, `CANCELLED`). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `confirmed_by` (FK a `users`, nullable). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `confirmed_at` (nullable). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `created_at`, `updated_at`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Validaciones BD:

- `amount > 0`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `method` y `status` con CHECKs. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

#### 4.2.3. Derivaciones

- `paid_amount = SUM(payments.amount WHERE status = 'CONFIRMED')`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- `pending_amount = total_amount - paid_amount`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Cálculo funcional de estado recomendado:

- Si `status = CANCELLED` → `CANCELLED`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Si `total_amount = 0` → `ZERO_AMOUNT`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Si `paid_amount >= total_amount` → `PAID`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Si `0 < paid_amount < total_amount` y `today <= due_date` → `PARTIALLY_PAID`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Si `0 < paid_amount < total_amount` y `today > due_date` → `OVERDUE`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Si `paid_amount = 0` y `today <= due_date` → `ISSUED`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Si `paid_amount = 0` y `today > due_date` → `OVERDUE`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Definición de incumplidor (regla base):

- `today > due_date + 30 días` AND `paid_amount < 0.5 * total_amount`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 4.3. Vista de facturas con estado calculado

Se recomienda crear una vista:

```sql
CREATE VIEW invoices_with_calculated_status AS
SELECT 
  i.id,
  i.user_id,
  i.customer_id,
  i.project_id,
  i.invoice_number,
  i.issue_date,
  i.due_date,
  i.gross_amount,
  i.tax_amount,
  i.total_amount,
  COALESCE(SUM(CASE WHEN p.status = 'CONFIRMED' THEN p.amount ELSE 0 END), 0) AS paid_amount,
  i.total_amount - COALESCE(SUM(CASE WHEN p.status = 'CONFIRMED' THEN p.amount ELSE 0 END), 0) AS pending_amount,
  CASE
    WHEN i.status = 'CANCELLED' THEN 'CANCELLED'
    WHEN i.total_amount = 0 THEN 'ZERO_AMOUNT'
    WHEN COALESCE(SUM(CASE WHEN p.status = 'CONFIRMED' THEN p.amount ELSE 0 END), 0) >= i.total_amount THEN 'PAID'
    WHEN COALESCE(SUM(CASE WHEN p.status = 'CONFIRMED' THEN p.amount ELSE 0 END), 0) > 0 
         AND CURRENT_DATE <= i.due_date THEN 'PARTIALLY_PAID'
    WHEN COALESCE(SUM(CASE WHEN p.status = 'CONFIRMED' THEN p.amount ELSE 0 END), 0) > 0 
         AND CURRENT_DATE > i.due_date THEN 'OVERDUE'
    WHEN COALESCE(SUM(CASE WHEN p.status = 'CONFIRMED' THEN p.amount ELSE 0 END), 0) = 0 
         AND CURRENT_DATE <= i.due_date THEN 'ISSUED'
    WHEN COALESCE(SUM(CASE WHEN p.status = 'CONFIRMED' THEN p.amount ELSE 0 END), 0) = 0 
         AND CURRENT_DATE > i.due_date THEN 'OVERDUE'
    ELSE i.status
  END AS calculated_status,
  CASE
    WHEN CURRENT_DATE > (i.due_date + INTERVAL '30 days') 
         AND COALESCE(SUM(CASE WHEN p.status = 'CONFIRMED' THEN p.amount ELSE 0 END), 0) < (i.total_amount * 0.5)
    THEN TRUE
    ELSE FALSE
  END AS is_auto_defaulted,
  i.is_manually_defaulted,
  (i.is_manually_defaulted OR (
    CURRENT_DATE > (i.due_date + INTERVAL '30 days') 
    AND COALESCE(SUM(CASE WHEN p.status = 'CONFIRMED' THEN p.amount ELSE 0 END), 0) < (i.total_amount * 0.5)
  )) AS is_defaulted
FROM invoices i
LEFT JOIN payments p ON i.id = p.invoice_id
GROUP BY i.id;
```

Esta vista debe ser la fuente principal para:

- Listados de facturas. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Dashboard. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Informes. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Modal de incumplidores. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 4.4. Validaciones adicionales clave

#### 4.4.1. Control de sobrepago

Backend:

- Antes de crear un pago, comprobar:
  - `amount <= pending_amount`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Frontend:

- En el modal de cobro, mostrar `pending_amount` y no permitir introducir valor superior. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

#### 4.4.2. Definición de “Incumplidor”

Se recomienda enfoque híbrido:

- Regla automática (`is_auto_defaulted`) según vista. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Posibilidad de marcar manualmente (`is_manually_defaulted`) vía modal con motivo. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Auditoría en tabla `invoice_defaults_audit`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

#### 4.4.3. Auditoría de pagos

- Al confirmar un pago (`status = CONFIRMED`):
  - Guardar `confirmed_by`, `confirmed_at`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Solo rol `ADMIN` puede confirmar. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***

## 5. Módulo Dashboard de Ingresos & Facturas

### 5.1. Objetivos

- Mostrar KPIs sobre facturas e ingresos: [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Total emitido, cobrado, pendiente. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - % de cobro. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Nº facturas por estado. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Nº facturas incumplidas / en riesgo. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Visualizar gráficos de tendencias y distribución. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 5.2. Especificaciones

Endpoint `GET /dashboard/summary` devuelve:

```json
{
  "filters": { "from_date": "...", "to_date": "...", "customer_id": null },
  "summary": {
    "total_issued": 0,
    "total_paid": 0,
    "total_pending": 0,
    "payment_percentage": 0,
    "active_invoices_count": 0,
    "defaulted_invoices_count": 0,
    "at_risk_invoices_count": 0
  },
  "charts": {
    "monthly_trend": [
      { "month": "2025-01", "issued": 0, "paid": 0 }
    ],
    "status_distribution": [
      { "status": "PAID", "count": 0 }
    ],
    "cobranza_vs_vencimientos": [
      { "date": "2025-01-15", "overdue_count": 0, "payments_count": 0 }
    ]
  }
}
```

Datos basados en `invoices_with_calculated_status`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Validaciones:

- Filtros `from_date <= to_date`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Excluir facturas `CANCELLED`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

UI:

- KPIs en cards. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Gráficos (líneas, barras, pie) coherentes con colores de `SOLUCION_COLORES_TABLAS.md`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***

## 6. Módulo Configuración y Parámetros Globales

### 6.1. Objetivos

- Configurar datos de empresa y parámetros funcionales: [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Serie y numeración de facturas. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Días de vencimiento por defecto. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Criterios de incumplidor (días y %). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Métodos de pago activos. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Integraciones (p. ej. Verifactu). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 6.2. Modelo de datos

Tabla `company_settings` (por usuario/empresa):

```sql
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  company_name TEXT NOT NULL,
  company_cif TEXT NOT NULL UNIQUE,
  company_address TEXT,
  company_email TEXT,
  company_phone TEXT,
  invoice_series TEXT NOT NULL DEFAULT 'INV',
  invoice_next_number INTEGER NOT NULL DEFAULT 1,
  invoice_number_format TEXT NOT NULL DEFAULT '{series}-{year}-{number:05d}',
  default_days_to_due INTEGER NOT NULL DEFAULT 30,
  minimum_payment_percentage NUMERIC(3, 2) NOT NULL DEFAULT 0.95,
  days_to_defaulted INTEGER NOT NULL DEFAULT 30,
  active_payment_methods TEXT[] NOT NULL DEFAULT '{"BANK_TRANSFER", "CASH", "CARD", "BIZUM"}',
  verifactu_api_key TEXT,
  verifactu_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Solo `ADMIN` puede editar. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***

## 7. Módulo Clientes

### 7.1. Objetivos

- Gestionar catálogo de **clientes**. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Usar clientes en facturas, proyectos, informes. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 7.2. Modelo de datos

Tabla `customers`:

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  cif_nif TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'ES',
  billing_email TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, cif_nif)
);
```

Validaciones:

- `name` y `cif_nif` obligatorios. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- CIF/NIF único por usuario. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

UI:

- CRUD de clientes + filtros. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Desactivar en lugar de borrar (mantener histórico). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***

## 8. Módulo Proyectos

### 8.1. Objetivos

- Asociar facturas y gastos a **proyectos** para analizar rentabilidad. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 8.2. Modelo de datos

Tabla `projects`:

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  name TEXT NOT NULL,
  code TEXT,
  status TEXT NOT NULL CHECK (status IN ('PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED')),
  start_date DATE,
  end_date DATE,
  budget_amount NUMERIC(12, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, code)
);
```

Relaciones:

- `invoices.project_id` y `expenses.project_id` como FK opcionales. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

UI:

- Listado, alta/edición, vista de detalle con ingresos, gastos y rentabilidad. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***

## 9. Módulo Gastos y Deducciones

### 9.1. Objetivos

- Registrar **gastos**. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Marcar parte **deducible**. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Asociar gastos a clientes/proyectos si aplica. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 9.2. Modelo de datos

Tabla `expenses`:

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('RENT', 'UTILITIES', 'SOFTWARE', 'TRAVEL', 'MEALS', 'OTHER')),
  gross_amount NUMERIC(12, 2) NOT NULL,
  deductible_amount NUMERIC(12, 2) NOT NULL,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  supplier_name TEXT,
  supplier_tax_id TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (gross_amount > 0),
  CHECK (deductible_amount >= 0 AND deductible_amount <= gross_amount),
  CHECK (tax_rate >= 0)
);
```

UI:

- Listado por fecha/categoría/proyecto. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Formulario de alta con % deducible opcional (calcula `deductible_amount`). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Opcional: upload de justificante + OCR. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***

## 10. Módulo Gestión de Suscripciones

### 10.1. Objetivos

- Gestionar los **planes de suscripción** de Anclora Flow (Free, Pro, etc.) o servicios recurrentes. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 10.2. Modelo de datos

`subscription_plans`:

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_monthly NUMERIC(12, 2) NOT NULL,
  price_yearly NUMERIC(12, 2),
  features JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);
```

`user_subscriptions`:

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL CHECK (status IN ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED')),
  start_date DATE NOT NULL,
  end_date DATE,
  next_billing_date DATE,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('MONTHLY', 'YEARLY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Reglas:

- Un usuario solo tiene una suscripción `ACTIVE` a la vez. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Transiciones de estado controladas. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

UI:

- Pantalla “Mi suscripción” con plan actual, histórico, upgrades/downgrades. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***

## 11. Módulo Presupuesto Inteligente

### 11.1. Objetivos

- Proponer un **presupuesto mensual** basado en históricos de ingresos y gastos. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Sugerir cuánto reservar para impuestos, ahorro y gasto operativo. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 11.2. Lógica funcional

Inputs:

- Ingresos mensuales (facturas cobradas). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Gastos mensuales (deducibles y totales). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Parámetros de usuario:
  - % de ahorro deseado. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - % de reserva para impuestos. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Outputs:

- Presupuesto recomendado por mes:
  - Gastos operativos máximos. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Reserva para impuestos. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Reserva para ahorro. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

UI:

- Gráfico de barras de presupuesto vs gasto real. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Alertas cuando se supera el presupuesto. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Integración:

- Asistente IA explica y ajusta recomendaciones. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***

## 12. Módulo Calendario y Calculadora Fiscal

### 12.1. Objetivos

- Mostrar **calendario fiscal** con fechas clave (IVA, IRPF, etc.). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Estimar importes de impuestos trimestrales/anuales de forma orientativa. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 12.2. Calendario

- Eventos predefinidos (para España, adaptables): trimestres de IVA/IRPF, modelos 130/131/303/390. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Cada evento: nombre, descripción, rango de fechas, tipo de obligación. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 12.3. Calculadora Fiscal

Inputs:

- Ingresos cobrados del período. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Gastos deducibles. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Parámetros fiscales (tipos de IVA/IRPF). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Outputs:

- Estimación de IVA a ingresar/devolver. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Estimación de IRPF (para autónomos en estimación simple). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

UI:

- Formularios con rangos de fechas y límites claros. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Avisos legales: “Estimación no vinculante, revisar con asesoría especializada”. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***

## 13. Módulo Informes y Métricas

### 13.1. Objetivos

- Generar informes en distintos ejes: [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Por cliente. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Por proyecto. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Por categoría de gasto. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Por estado de facturas (incluyendo incumplidores). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 13.2. Tipos de informe

- **Rentabilidad por cliente**: ingresos – gastos asociados. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- **Rentabilidad por proyecto**. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- **Evolución mensual de ingresos y gastos**. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- **Informe de incumplidores**: listado con días de retraso e importe pendiente. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Salida:

- Visualización en UI. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Exportación a PDF/CSV. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

Validaciones:

- Filtros coherentes y compartidos con dashboard. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Uso de `invoices_with_calculated_status` como fuente de verdad. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***

## 14. Módulo Asistente IA

### 14.1. Objetivos

- Asistente conversacional dentro de Anclora Flow que: [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Interpreta datos financieros. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Explica informes y KPIs. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Propone acciones (contactar incumplidores, ajustar presupuesto, etc.). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 14.2. Fuentes de contexto

- Facturas, pagos, clientes, proyectos. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Gastos y deducciones. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Eventos de calendario fiscal. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Parámetros de presupuesto e informes. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 14.3. Casos de uso

Ejemplos:

- “¿Cuánto tengo pendiente de cobrar este trimestre y cuántas facturas están en riesgo?” [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- “¿Cuál es mi cliente más rentable este año?” [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- “Proponme un presupuesto mensual para los próximos 3 meses basado en mis datos.” [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- “Explícame por qué esta factura aparece como incumplida.” [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 14.4. Validaciones y seguridad

- El Asistente IA **no modifica datos** sin confirmación explícita del usuario. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Acciones que cambian estado (confirmar pago, marcar incumplidor, etc.) se realizan siempre vía endpoints protegidos. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- Registro de logs de:
  - Preguntas. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Respuestas. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - Acciones ejecutadas. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***

## 15. Checklist de Validaciones

### 15.1. Base de datos

- [ ] `users.role` con CHECK (`ADMIN`, `USER`, `READONLY`). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] `users.is_active`, `users.is_demo`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] `invoices.status` con CHECK. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] `invoices` importes positivos. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] `payments.amount > 0`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] `payments.method` y `payments.status` con CHECK. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] `payments.confirmed_by`, `payments.confirmed_at`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] Vista `invoices_with_calculated_status`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] `expenses` con `deductible_amount <= gross_amount`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] `customers` con CIF/NIF único por usuario. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 15.2. Backend

- [ ] DTOs estrictos (email, password, roles, estados, métodos). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] Rate limiting en login. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] Middleware valida `is_active`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] Servicios:
  - `createPayment` valida que no haya sobrepago. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
  - `markAsDefaulted` según criterios y auditoría. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] Endpoints de dashboard e informes usan vistas coherentes. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] Logs de operaciones críticas. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 15.3. Frontend

- [ ] Formulario de login/registro con validaciones de email/password. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] Selección de tabla con IDs validados. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] Modales de cobro e incumplidor con validaciones en vivo. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] Tablas con estados visuales coherentes (colores y badges). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] Dashboard con filtros validados y estados de carga/error claros. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
- [ ] Pantallas de configuración/suscripción protegidas solo para ADMIN. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***

## 16. Priorización de Implementación

### 16.1. CRÍTICO (coherencia y UX básica)

1. Vista `invoices_with_calculated_status` + CHECKs de estados e importes. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
2. Validaciones de pagos (sin sobrepago, métodos y estados). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
3. Modal de cobro y modal de incumplidor con validaciones en frontend. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
4. Rate limiting en login y `is_active`. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 16.2. IMPORTANTE (producto completo)

5. Módulos de Gastos, Clientes, Proyectos, Dashboard, Informes (mínimo viable). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
6. Asistente IA integrado con lectura (solo lectura) de datos y acciones bajo confirmación. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

### 16.3. AVANZADO

7. Presupuesto Inteligente integrado con Asistente IA. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
8. Calendario y Calculadora Fiscal con parametrización por país. [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)
9. Gestión de Suscripciones y límites de plan (capacidad, features). [perplexity](https://www.perplexity.ai/search/54036821-2736-4ba5-a914-c6f1bdafb6c6)

***