# Anclora Flow - Actualización de Desarrollo

## Resumen de Cambios

Este documento detalla las actualizaciones implementadas en la aplicación Anclora Flow, incluyendo la arquitectura completa del backend, base de datos, y el desarrollo completo de los módulos de Gastos y Clientes.

---

## 🗄️ Base de Datos

### Estructura Implementada

Se ha diseñado e implementado una base de datos PostgreSQL completa con las siguientes tablas:

#### Tablas Principales

1. **users** - Gestión de usuarios con autenticación local y OAuth
2. **clients** - Registro de clientes con información fiscal
3. **projects** - Proyectos asociados a clientes
4. **invoices** - Facturas con cálculos fiscales (IVA, IRPF)
5. **invoice_items** - Líneas de detalle de facturas
6. **expenses** - Gastos deducibles con categorización
7. **subscriptions** - Facturación recurrente
8. **payments** - Pagos parciales y múltiples por factura
9. **tax_events** - Calendario de obligaciones fiscales
10. **budgets** - Presupuestos por categoría
11. **activity_log** - Registro de actividad del usuario

#### Características de la Base de Datos

- **UUID** como identificadores primarios
- **Timestamps automáticos** (created_at, updated_at)
- **Triggers** para actualización de updated_at
- **Índices optimizados** para queries frecuentes
- **Relaciones con integridad referencial**
- **Soft deletes** con campos de estado
- **Datos de demostración** incluidos

### Archivo de Inicialización

**Ubicación**: `backend/src/database/init.sql`

El script SQL incluye:
- Creación de todas las tablas con sus relaciones
- Índices para optimización de consultas
- Triggers para campos automáticos
- Extensión UUID para generación de IDs
- Datos de ejemplo para desarrollo

---

## 🔧 Backend API

### Arquitectura

Se ha implementado una arquitectura RESTful completa con:

- **Framework**: Express.js 4.18.2
- **ORM/Query Builder**: pg (PostgreSQL native driver)
- **Autenticación**: JWT + Passport.js (OAuth2)
- **Validación**: express-validator
- **Seguridad**: bcrypt para passwords

### Modelos de Datos

Ubicación: `backend/src/models/`

#### 1. User.js
- Creación de usuarios (local + OAuth)
- Autenticación y verificación de contraseñas
- Gestión de preferencias (tema, idioma)
- Actualización de last_login

#### 2. Client.js
- CRUD completo de clientes
- Filtros y búsqueda
- Estadísticas por cliente
- Top clientes por facturación

#### 3. Invoice.js
- CRUD completo con transacciones
- Gestión de items de factura
- Cálculos fiscales automáticos (IVA, IRPF)
- Marcar facturas como pagadas
- Actualización automática de facturas vencidas
- Estadísticas e informes
- Ingresos mensuales

#### 4. Expense.js
- CRUD completo de gastos
- Categorización y subcategorización
- Gastos deducibles (porcentajes)
- IVA recuperable
- Estadísticas por categoría
- Gastos mensuales
- Top proveedores

#### 5. Project.js
- CRUD completo de proyectos
- Asociación con clientes
- Estados del proyecto (activo, completado, en pausa, cancelado)
- Presupuestos y fechas
- Estadísticas de proyecto

### Rutas API

Ubicación: `backend/src/api/`

#### Autenticación (`/api/auth`)

```
POST   /register                    - Registro de usuario local
POST   /login                       - Login con email/password
GET    /me                          - Obtener usuario actual
PUT    /me                          - Actualizar usuario actual
GET    /google                      - Iniciar OAuth con Google
GET    /google/callback             - Callback de Google
GET    /github                      - Iniciar OAuth con GitHub
GET    /github/callback             - Callback de GitHub
```

#### Facturas (`/api/invoices`)

```
GET    /                            - Listar facturas (con filtros)
GET    /statistics                  - Estadísticas de facturas
GET    /monthly                     - Ingresos mensuales
GET    /:id                         - Obtener factura por ID
POST   /                            - Crear nueva factura
PUT    /:id                         - Actualizar factura
DELETE /:id                         - Eliminar factura
POST   /:id/mark-paid               - Marcar como pagada
POST   /update-overdue              - Actualizar facturas vencidas
```

#### Gastos (`/api/expenses`)

```
GET    /                            - Listar gastos (con filtros)
GET    /statistics                  - Estadísticas de gastos
GET    /by-category                 - Gastos agrupados por categoría
GET    /monthly                     - Gastos mensuales
GET    /top-vendors                 - Top proveedores
GET    /:id                         - Obtener gasto por ID
POST   /                            - Crear nuevo gasto
PUT    /:id                         - Actualizar gasto
DELETE /:id                         - Eliminar gasto
```

#### Clientes (`/api/clients`)

```
GET    /                            - Listar clientes (con filtros)
GET    /top                         - Top clientes por facturación
GET    /:id                         - Obtener cliente por ID
GET    /:id/statistics              - Estadísticas del cliente
POST   /                            - Crear nuevo cliente
PUT    /:id                         - Actualizar cliente
DELETE /:id                         - Eliminar cliente
```

#### Proyectos (`/api/projects`)

```
GET    /                            - Listar proyectos (con filtros)
GET    /:id                         - Obtener proyecto por ID
GET    /:id/statistics              - Estadísticas del proyecto
POST   /                            - Crear nuevo proyecto
PUT    /:id                         - Actualizar proyecto
DELETE /:id                         - Eliminar proyecto
```

### Middleware

#### auth.js
- **authenticateToken**: Verificación de JWT en rutas protegidas
- **generateToken**: Generación de tokens JWT con expiración

### Validaciones

Todas las rutas incluyen validación de entrada con `express-validator`:
- Tipos de datos correctos
- Rangos válidos
- Formato de emails, URLs, fechas
- Campos requeridos
- Sanitización de entrada

---

## 🎨 Frontend

### Módulos Completados

#### 1. Módulo de Gastos y Deducciones

**Archivo**: `frontend/src/pages/expenses.js` (825 líneas)

**Características:**
- ✅ Tarjetas de resumen con KPIs
  - Gastos totales
  - Gastos deducibles
  - IVA recuperable
  - Promedio por gasto

- ✅ Filtros avanzados
  - Búsqueda por descripción/proveedor
  - Filtro por categoría (10 categorías)
  - Filtro por deducibilidad
  - Rango de fechas
  - Rango de importes

- ✅ Tabla de gastos
  - Ordenación y paginación
  - Estados visuales por categoría
  - Indicadores de deducibilidad
  - Acciones por gasto (ver, editar, eliminar)

- ✅ Formulario completo
  - Categorización y subcategorización
  - Cálculo automático de IVA
  - Porcentaje de deducibilidad ajustable
  - Métodos de pago
  - Adjuntar recibos (URL)
  - Notas adicionales

- ✅ Gráficos y visualizaciones
  - Gastos por categoría (barras horizontales)
  - Evolución mensual
  - Top 5 proveedores

- ✅ Datos de demostración
  - 5 gastos de ejemplo con diferentes categorías
  - Categorías: Software, Oficina, Viajes, Comidas, Hardware

#### 2. Módulo de Clientes y Proyectos

**Archivo**: `frontend/src/pages/clients.js` (1057 líneas)

**Características:**

##### Tab de Clientes

- ✅ Tarjetas de resumen
  - Total de clientes
  - Clientes activos
  - Nuevos este mes
  - Facturación media

- ✅ Filtros
  - Búsqueda por nombre, email, NIF/CIF
  - Filtro por estado (activos/inactivos)

- ✅ Grid de clientes (cards)
  - Avatar con inicial
  - Información de contacto
  - Datos fiscales (NIF/CIF)
  - Estado visual (activo/inactivo)
  - Notas del cliente
  - Acciones: Ver, Editar, Eliminar

- ✅ Formulario de cliente
  - Datos básicos (nombre, email, teléfono, NIF/CIF)
  - Dirección completa (calle, ciudad, CP, país)
  - Notas adicionales
  - Estado activo/inactivo

##### Tab de Proyectos

- ✅ Tarjetas de resumen
  - Total de proyectos
  - Proyectos activos
  - Proyectos completados
  - Presupuesto total

- ✅ Filtros
  - Búsqueda por nombre
  - Filtro por estado (activo, completado, en pausa, cancelado)
  - Filtro por cliente

- ✅ Grid de proyectos (cards)
  - Barra de color identificativa
  - Estado con badge
  - Información del cliente
  - Descripción del proyecto
  - Presupuesto y fechas
  - Acciones: Ver, Editar, Eliminar

- ✅ Formulario de proyecto
  - Nombre y descripción
  - Selección de cliente
  - Estado del proyecto (4 estados)
  - Presupuesto
  - Fechas de inicio y fin
  - Selector de color para identificación visual

- ✅ Datos de demostración
  - 5 clientes de ejemplo
  - 4 proyectos vinculados a clientes

---

## 📝 Configuración y Variables de Entorno

### Backend (.env)

```env
FRONTEND_PORT=3020
BACKEND_PORT=8020
DB_PORT=5452

# Database Configuration
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=anclora_flow
DATABASE_URL=postgresql://postgres:postgres@localhost:5452/anclora_flow

# JWT Configuration
JWT_SECRET=anclora_flow_secret_key_change_in_production_2024
JWT_EXPIRES_IN=7d

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Application
NODE_ENV=development
FRONTEND_URL=http://localhost:3020
```

---

## 🚀 Cómo Ejecutar el Proyecto

### Requisitos Previos

- Node.js 20+ instalado
- PostgreSQL 13+ instalado y corriendo
- npm o yarn

### Instalación

#### 1. Backend

```bash
cd backend
npm install
```

#### 2. Base de Datos

```bash
# Crear la base de datos
createdb anclora_flow

# O con psql:
psql -U postgres -c "CREATE DATABASE anclora_flow;"

# Inicializar las tablas
psql -U postgres -d anclora_flow -f src/database/init.sql
```

#### 3. Frontend

```bash
cd frontend
npm install
```

### Ejecución

#### Backend (Puerto 8020)

```bash
cd backend
npm run dev
```

El servidor estará disponible en `http://localhost:8020`

Endpoints disponibles:
- Health check: `http://localhost:8020/api/health`
- Auth API: `http://localhost:8020/api/auth`
- Invoices API: `http://localhost:8020/api/invoices`
- Expenses API: `http://localhost:8020/api/expenses`
- Clients API: `http://localhost:8020/api/clients`
- Projects API: `http://localhost:8020/api/projects`

#### Frontend (Puerto 3020)

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:3020`

---

## 📊 Estado del Proyecto

### ✅ Completado

1. **Base de Datos**
   - [x] Diseño completo del esquema
   - [x] Script de inicialización
   - [x] Configuración de conexión
   - [x] Modelos de datos

2. **Backend API**
   - [x] Servidor Express configurado
   - [x] Middleware de autenticación JWT
   - [x] API de Autenticación (local + OAuth)
   - [x] API de Facturas (CRUD completo)
   - [x] API de Gastos (CRUD completo)
   - [x] API de Clientes (CRUD completo)
   - [x] API de Proyectos (CRUD completo)
   - [x] Validaciones con express-validator
   - [x] Manejo de errores

3. **Frontend**
   - [x] Dashboard principal
   - [x] Módulo de Facturas (completado previamente)
   - [x] **Módulo de Gastos (NUEVO - COMPLETO)**
   - [x] **Módulo de Clientes y Proyectos (NUEVO - COMPLETO)**
   - [x] Sistema de diseño y temas
   - [x] Autenticación OAuth

### ⏳ Pendiente

1. **Integración Frontend-Backend**
   - [ ] Conectar módulo de Facturas con API
   - [ ] Conectar módulo de Gastos con API
   - [ ] Conectar módulo de Clientes con API
   - [ ] Sistema de autenticación completo

2. **Funcionalidades Avanzadas**
   - [ ] Gestión de pagos en facturas
   - [ ] Exportación PDF/Excel
   - [ ] Módulo de Suscripciones
   - [ ] Presupuesto Inteligente
   - [ ] Calendario Fiscal con fechas españolas
   - [ ] Informes y Métricas avanzadas
   - [ ] Asistente IA

3. **Testing**
   - [ ] Tests unitarios del backend
   - [ ] Tests de integración
   - [ ] Tests E2E del frontend

4. **Deployment**
   - [ ] Configuración de Docker Compose completa
   - [ ] Variables de entorno de producción
   - [ ] CI/CD pipeline

---

## 🔐 Seguridad

### Implementado

- ✅ Hashing de contraseñas con bcrypt (10 rounds)
- ✅ Autenticación JWT con expiración
- ✅ Middleware de autenticación en rutas protegidas
- ✅ Validación y sanitización de entrada
- ✅ CORS configurado
- ✅ Variables de entorno para secretos
- ✅ Prepared statements (SQL injection prevention)

### Recomendaciones para Producción

- [ ] Cambiar JWT_SECRET a un valor fuerte y aleatorio
- [ ] Habilitar HTTPS
- [ ] Rate limiting en endpoints de autenticación
- [ ] Configurar helmet.js para headers de seguridad
- [ ] Implementar CSRF protection
- [ ] Auditoría de dependencias regular (npm audit)
- [ ] Backup automático de base de datos
- [ ] Logging y monitoreo

---

## 📁 Estructura de Archivos Actualizada

```
/home/user/Anclora-Flow/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── routes.js          (185 líneas) ✨ ACTUALIZADO
│   │   │   ├── invoices/
│   │   │   │   └── routes.js          (231 líneas) ✨ NUEVO
│   │   │   ├── expenses/
│   │   │   │   └── routes.js          (199 líneas) ✨ NUEVO
│   │   │   ├── clients/
│   │   │   │   └── routes.js          (126 líneas) ✨ NUEVO
│   │   │   └── projects/
│   │   │       └── routes.js          (119 líneas) ✨ NUEVO
│   │   ├── database/
│   │   │   ├── init.sql               (316 líneas) ✨ NUEVO
│   │   │   └── config.js              (82 líneas) ✨ NUEVO
│   │   ├── middleware/
│   │   │   └── auth.js                (45 líneas) ✨ NUEVO
│   │   ├── models/
│   │   │   ├── User.js                (92 líneas) ✨ NUEVO
│   │   │   ├── Client.js              (148 líneas) ✨ NUEVO
│   │   │   ├── Invoice.js             (341 líneas) ✨ NUEVO
│   │   │   ├── Expense.js             (225 líneas) ✨ NUEVO
│   │   │   └── Project.js             (126 líneas) ✨ NUEVO
│   │   └── server.js                  (92 líneas) ✨ ACTUALIZADO
│   ├── .env                           ✨ NUEVO
│   ├── .env.example                   ✨ ACTUALIZADO
│   └── package.json                   ✨ ACTUALIZADO (+6 dependencias)
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── expenses.js            (825 líneas) ✨ COMPLETADO
│   │   │   └── clients.js             (1057 líneas) ✨ COMPLETADO
│   │   └── main.js                    ✨ ACTUALIZADO (nuevas importaciones)
│   └── package.json
│
└── DEVELOPMENT_UPDATE.md              ✨ NUEVO (este archivo)
```

---

## 🎯 Próximos Pasos Recomendados

### Corto Plazo (1-2 semanas)

1. **Conectar Frontend con Backend**
   - Implementar servicio API en frontend
   - Reemplazar datos demo con llamadas API
   - Gestión de estados de carga y errores

2. **Sistema de Autenticación Completo**
   - Login funcional con JWT
   - Persistencia de sesión
   - Protección de rutas
   - Refresh tokens

3. **Gestión de Pagos**
   - Implementar modal de añadir pago
   - Registro de pagos parciales
   - Actualización de estado de factura
   - Histórico de pagos

### Medio Plazo (3-4 semanas)

1. **Exportación de Documentos**
   - Generación de PDF de facturas
   - Exportación Excel de informes
   - Plantillas personalizables

2. **Módulo de Suscripciones**
   - Facturación recurrente
   - Renovación automática
   - Gestión de ciclos

3. **Calendario Fiscal Español**
   - Modelos 303, 130, 111
   - Alertas de vencimientos
   - Cálculo automático

### Largo Plazo (2-3 meses)

1. **Asistente IA**
   - Integración con servicios de IA
   - Sistema RAG para documentos fiscales
   - Recomendaciones inteligentes

2. **Informes Avanzados**
   - Dashboard analítico completo
   - Exportación personalizada
   - Gráficos interactivos

3. **Multi-tenant**
   - Soporte para múltiples empresas
   - Roles y permisos
   - Facturación por usuario

---

## 🐛 Problemas Conocidos

1. **Dependencias del Backend**
   - Warnings de deprecación en algunas dependencias (inflight, glob, etc.)
   - No afectan la funcionalidad actual
   - Considerar actualización en el futuro

2. **Vulnerabilidades**
   - 2 vulnerabilidades de severidad moderada detectadas
   - Revisar con `npm audit` y actualizar si es necesario

3. **OAuth**
   - Configuración de Google/GitHub OAuth pendiente de credenciales reales
   - Actualmente usa placeholders en .env

---

## 📞 Soporte

Para dudas o problemas con la implementación:

1. Revisar este documento de actualización
2. Consultar README_ES.md o README_EN.md
3. Verificar logs del servidor backend
4. Comprobar configuración de .env

---

## 📝 Notas del Desarrollador

### Decisiones de Arquitectura

1. **Base de Datos**
   - Se optó por PostgreSQL por su robustez y soporte para tipos de datos complejos
   - UUID como IDs para escalabilidad y seguridad
   - Soft deletes en lugar de borrados físicos

2. **Backend**
   - Express.js por su simplicidad y ecosistema maduro
   - pg driver nativo en lugar de ORM para mayor control
   - Patrón de modelos para encapsular lógica de datos

3. **Frontend**
   - Vanilla JS mantenido para consistencia con el código existente
   - Modales para formularios (mejor UX que páginas separadas)
   - Datos demo incluidos para testing sin backend

### Testing Recomendado

Antes de hacer commit, verificar:

```bash
# Backend
cd backend
npm run dev
# Verificar que inicia sin errores
# Probar endpoints con curl o Postman

# Frontend
cd frontend
npm run dev
# Navegar a /expenses y /clients
# Verificar que los módulos cargan correctamente
# Probar filtros y formularios
```

---

**Fecha de Actualización**: Diciembre 2024
**Versión**: 2.0.0-dev
**Desarrollador**: Claude (Anthropic)
