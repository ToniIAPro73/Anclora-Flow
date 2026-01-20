# INSTRUCCIÓN PARA AGENTE ANTIGRAVITY: IMPLEMENTAR MÓDULO EXPENSES v2.0

## CONTEXTO

Se han generado 4 documentos de análisis y especificación técnica para refactorizar y completar el módulo **Gastos & Deducciones** de Anclora Flow.

**Documentos de referencia:**
1. `IMPLEMENTACION-MODALES-EXPENSES-COMPLETA-ANALISIS-DETALLADO.md`
2. `CODIGO-BACKEND-EXPENSES-VALIDADORES-AUDITORIA-ARCHIVOS.md`
3. `CODIGO-FRONTEND-EXPENSES-JS-REFACTOREADO-COMPLETO.md`
4. `ANALISIS-EXPENSES.JS-PROFUNDO.md`

**Directrices a cumplir:**
1. `DIRECTRICES-VIEWPORT-ANCLORA-FLOW.md`
2. `DIRECTRICES-TABLAS-RESPONSIVAS-ANCLORA-FLOW.md`

---

## MISIÓN

Implementar **COMPLETAMENTE** las 4 fases de refactor del módulo Expenses en Anclora Flow.

**Resultado Final:** Módulo production-ready con validaciones exhaustivas, auditoría, gestión de archivos y modales mejorados.

---

## FASES DE IMPLEMENTACIÓN

### FASE 1: BACKEND - VALIDADORES Y AUDITORÍA

**Objetivo:** Crear capa de validación y auditoría en backend

**Tareas:**

1. **Crear archivo:** `backend/src/validators/expenseValidator.ts`
   - Copiar contenido de sección "CREAR: backend/src/validators/expenseValidator.ts" del documento #2
   - Validar que todas las funciones estén completas
   - Ajustar imports según estructura real del proyecto

2. **Crear archivo:** `backend/src/services/expenseFileService.ts`
   - Copiar contenido de sección "CREAR: backend/src/services/expenseFileService.ts" del documento #2
   - Configurar variables de entorno S3 en `.env`
   - Asegurar que bucketName sea `anclora-expenses` o configurable

3. **Modificar:** `backend/src/repositories/expense.repository.ts`
   - Agregar imports del validador
   - Reemplazar método `create()` con versión mejorada
   - Reemplazar método `update()` con versión mejorada
   - Agregar auditoría automática en ambos métodos

4. **Modificar:** `backend/src/api/expenses/routes.ts`
   - Reemplazar validaciones de rutas POST y PUT
   - Agregar validaciones exhaustivas con express-validator
   - Ajustar según estructura de archivos real del proyecto

5. **Ejecutar SQL:** `backend/src/database/init.sql`
   - Agregar tabla `expense_audit_log`
   - Agregar constraints CHECK en tabla `expenses`
   - Agregar índices de performance
   - Crear trigger para auditoría automática

**Validación de Éxito:**
- ✅ Archivo `expenseValidator.ts` existe y exports funciones
- ✅ Tabla `expense_audit_log` creada en BD
- ✅ Rutas POST/PUT validan completamente
- ✅ Test: POST gasto con fecha futura → rechazado
- ✅ Test: PUT gasto → auditoría registrada

---

### FASE 2: FRONTEND - VALIDADORES Y COMPONENTES

**Objetivo:** Implementar validación en cliente y componentes mejorados

**Tareas:**

1. **Agregar a `frontend/src/pages/expenses.js`:**
   - Insertar sección "AGREGAR: Validador de cliente" (CLIENT_VALIDATOR object)
   - Reemplazar función `setupExpenseForm()` por versión mejorada
   - Reemplazar función `handleExpenseSubmit()` por `handleExpenseSubmitWithValidation()`
   - Agregar función `uploadExpenseReceipt()`
   - Mejorar función `viewExpense()` con previsualización
   - Agregar función `buildReceiptPreviewHtml()`
   - Agregar función `viewExpenseAuditLog()`

2. **Reemplazar en `buildExpenseModalHtml()`:**
   - Modal 1 (Create/Edit) - usar versión mejorada del documento #3
   - Incluir secciones clara: Básica, Descripción, Financiera, Deducibilidad, Documentación
   - Agregar validación tiempo real con estilos
   - Agregar dropzone para archivos

3. **Reemplazar en `openExpenseModal()`:**
   - Incluir notificación si período fiscal está cerrado
   - Deshabilitar campos si período cerrado (amount, date, category, vatAmount)
   - Permitir solo edición de notes y deducibilidad si período cerrado

4. **Actualizar `initExpenses()`:**
   - Exponer funciones globales requeridas
   - Asegurar que todos los event listeners funcionen

**Validación de Éxito:**
- ✅ Modal abre con validación tiempo real
- ✅ Fecha futura rechazada con mensaje
- ✅ Dropzone funciona (drag & drop + click)
- ✅ Previsualización de PDF/imagen funciona
- ✅ Toggle deducible fuerza deductiblePercentage a 0 si false

---

### FASE 3: BACKEND - GESTIÓN DE ARCHIVOS

**Objetivo:** Endpoint funcional para upload de comprobantes

**Tareas:**

1. **Crear middleware de upload:**
   - Crear `backend/src/middleware/upload.ts`
   - Configurar multer para validar archivos
   - Limit tamaño: 10MB
   - Permitir: PDF, JPG, PNG, WEBP

2. **Crear endpoint POST `/expenses/:id/receipt`:**
   - Validar que expense existe y pertenece al usuario
   - Llamar a `expenseFileService.uploadReceipt()`
   - Guardar URL en campo `receipt_url` de expenses
   - Registrar en auditoría como acción 'receipt_added'
   - Retornar URL firmada

3. **Crear endpoint GET `/expenses/:id/audit-log`:**
   - Retornar historial completo de expense_audit_log
   - Filtrar por expense_id
   - Ordenar por created_at DESC
   - Incluir información del usuario (name) en cada registro

**Validación de Éxito:**
- ✅ POST /expenses/123/receipt con archivo → URL retornada
- ✅ Archivo inválido rechazado (tipo o tamaño)
- ✅ GET /expenses/123/audit-log retorna historial
- ✅ S3 bucket tiene archivos organizados por usuario/expense

---

### FASE 4: FRONTEND - CONEXIÓN FINAL

**Objetivo:** Frontend totalmente conectado con backend mejorado

**Tareas:**

1. **Ajustar `window.api.createExpense()` y `updateExpense()`:**
   - Asegurar que enviamos todos los campos validados
   - Incluir `changeReason` si existe
   - Manejar errores de validación backend

2. **Implementar upload de archivos:**
   - Función `uploadExpenseReceipt()` ya creada
   - Llamar después de guardar expense
   - Mostrar progreso al usuario
   - Manejar errores de upload

3. **Conectar auditoría visual:**
   - Botón "Ver historial" en Modal 2 (view expense)
   - Llamar a `viewExpenseAuditLog()`
   - Mostrar quién creó, quién editó, cuándo, por qué

4. **Testing manual:**
   - Crear gasto → verificar en BD
   - Editar gasto → verificar auditoría
   - Subir archivo → verificar en S3
   - Ver historial → verificar cambios rastreados

**Validación de Éxito:**
- ✅ Crear gasto completo (con archivo) funciona
- ✅ Editar gasto restringe campos si período cerrado
- ✅ Historial de cambios visible y completo
- ✅ Archivo descargable desde Modal 2

---

### FASE 5: TESTING

**Objetivo:** Suite de tests

**Tareas:**

1. **Crear tests unitarios:**
   - Backend: `test/validators/expenseValidator.test.ts`
   - Backend: `test/services/expenseFileService.test.ts`
   - Frontend: `test/validators/clientValidator.test.ts`

2. **Crear tests E2E:**
   - Test: Crear gasto con validación
   - Test: Editar gasto con auditoría
   - Test: Subir archivo y previsualizar
   - Test: Período fiscal cerrado bloquea edición

3. **Documentación:**
   - Actualizar README con nuevas features
   - Crear guía de usuario (validaciones, auditoría, archivos)
   - Documentar API endpoints (POST /receipt, GET /audit-log)


**Validación de Éxito:**
- ✅ Todos los tests pasan (>80% cobertura)
- ✅ No hay errores en logs
- ✅ Performance aceptable (<200ms queries)
- ✅ Documentación completa

---

## ESTRUCTURA DE ARCHIVOS A CREAR/MODIFICAR
```
backend/
├── src/
│   ├── validators/
│   │   └── expenseValidator.ts          (🆕 NUEVO)
│   ├── services/
│   │   └── expenseFileService.ts        (🆕 NUEVO)
│   ├── repositories/
│   │   └── expense.repository.ts        (✏️ MODIFICAR - agregar auditoría)
│   ├── api/expenses/
│   │   ├── routes.ts                    (✏️ MODIFICAR - validaciones)
│   │   └── controller.ts                (✏️ MODIFICAR - file upload)
│   ├── middleware/
│   │   └── upload.ts                    (🆕 NUEVO - opcional si no existe)
│   └── database/
│       └── init.sql                     (✏️ MODIFICAR - ALTER TABLE + tabla audit)
└── .env                                 (✏️ MODIFICAR - S3 config)

frontend/
├── src/
│   └── pages/
│       └── expenses.js                  (✏️ MODIFICAR - validaciones + modales)
└── test/
    └── validators/
        └── clientValidator.test.ts      (🆕 NUEVO)
```

---

## CONFIGURACIÓN REQUERIDA

**Variables de Entorno (`.env`):**
```bash
# S3 Configuration
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
S3_BUCKET=anclora-expenses
S3_BASE_URL=https://anclora-expenses.s3.eu-west-1.amazonaws.com
```

**Base de Datos:**
- PostgreSQL 12+ (si no está actualizado)
- UUID extension habilitada
- Acceso para crear tablas e índices

---

## CRITERIOS DE ÉXITO

✅ **TODOS DEBEN SER VERDADERO:**

- [ ] Crear gasto con validación completa
- [ ] Fecha futura es rechazada
- [ ] Descripción < 5 caracteres es rechazada
- [ ] IVA fuera de rango es rechazada
- [ ] Deducibilidad validada por categoría (comidas máx 50%)
- [ ] Período fiscal cerrado bloquea amount/date/category
- [ ] Editar gasto registra cambios en auditoría
- [ ] Upload de archivo funciona (PDF, JPG, PNG)
- [ ] Archivo inválido es rechazado
- [ ] Previsualización de PDF/imagen funciona
- [ ] Historial de cambios es visible y completo
- [ ] Tests pasan con >80% cobertura
- [ ] No hay errores en logs de producción
- [ ] Performance aceptable (<200ms)

---

## PREGUNTAS A RESOLVER ANTES DE INICIAR

1. ¿Cuál es la estructura real del backend? (Node/Express, etc.)
2. ¿Usa S3 o almacenamiento local?
3. ¿Existe tabla `activity_log` para eventos?
4. ¿Cuál es el modelo actual de autenticación/autorización?
5. ¿Hay restricciones de permisos (admin/user)?
6. ¿Existe concepto de "período fiscal cerrado" o es nuevo?

---

## CONTACTO SI HAY DUDAS

Consultar documentos #1-4 generados. Están completos con:
- Código listo para copiar-pegar
- Explicaciones línea-por-línea
- Ejemplos de tests
- Comparativas antes/después

---

**COMIENZA CUANDO HAYA CONFIRMACIÓN.**
