# ANCLORA FLOW - GUÍA COMPLETA

**Última actualización:** 2026-01-17  
**Versión:** 1.0  
**Audiencia:** Consultores IA, Desarrolladores, Stakeholders

---

## TABLA DE CONTENIDOS

1. [¿Qué es Anclora Flow?](#qué-es-anclora-flow)
2. [Características Principales](#características-principales)
3. [Flujo de Usuario](#flujo-de-usuario)
4. [Arquitectura del Sistema](#arquitectura-del-sistema)
5. [Casos de Uso](#casos-de-uso)
6. [Roadmap](#roadmap)
7. [FAQ](#faq)

---

## ¿QUÉ ES ANCLORA FLOW?

**Anclora Flow** es una plataforma SaaS de fiscalidad inteligente para consultores de IA especializados en España.

### Propuesta de Valor

✅ **OCR Inteligente** - Procesa facturas y documentos automáticamente  
✅ **Asesor IA** - Claude especializado en fiscalidad española  
✅ **Análisis Contable** - Extrae datos estructurados lista para contabilidad  
✅ **Gestión Multiusuario** - Dashboard para consultores  
✅ **Seguridad Fiscal** - Cumplimiento normativo AEPD/GDPR  

---

## CARACTERÍSTICAS PRINCIPALES

### 1. Carga de Documentos

**Qué puedo subir:**
- 📄 Facturas (PDF, JPG, PNG)
- 🧾 Recibos de pago
- 📋 Documentos contables
- 🗂️ Estados de cuenta
- 📊 Reportes mensuales

**Límites:**
- Máximo 10 MB por archivo
- Procesamiento paralelo de múltiples documentos
- Almacenamiento ilimitado (según plan)

**Flujo:**
1. Drag & drop o seleccionar archivo
2. Validación automática (tipo MIME, tamaño)
3. Envío a servidor
4. OCR + Extracción de datos (background)
5. Resultado disponible en 2-30 segundos

---

### 2. Extracción de Datos con OCR

**Datos extraídos automáticamente:**
- Proveedor/Emisor
- Fecha de factura
- Número de documento
- Importe total + IVA desglosado
- Líneas de artículos (descripción, cantidad, precio)
- Métodos de pago

**Precisión OCR:**
- Tesseract: 70-80%
- PaddleOCR: 90%+
- RapidOCR: 88-92%

**Validación:**
- Score de confianza por campo
- Revisión manual disponible
- Corrección en tiempo real

---

### 3. Asesor IA Especializado

**4 Contextos de IA:**

#### 🟦 Tax Context - Impuestos
- Modelos fiscales (130, 303, 111)
- Retenciones (IRPF, Sociedades)
- IVA: intracomunitario vs doméstico
- Deducibilidad de gastos
- Base imponible y cuotas

#### 🟩 Accounting Context - Contabilidad
- Registros contables
- Plan General Contable (PGC)
- Márgenes de ganancia
- Provisiones y depreciaciones
- Reconciliaciones

#### 🟨 Invoicing Context - Facturación
- Facturación electrónica (Facturae)
- Control de pagos pendientes
- Gestión de clientes morosos
- Estrategias de cobranza
- Descuentos y promociones

#### 🟧 Payments Context - Pagos
- Gestión de tesorería
- Métodos de pago (transferencia, cheque, efectivo)
- Reconciliación bancaria
- Prevención de fraude
- Reportes de flujo de caja

---

### 4. Dashboard de Análisis

**Métricas Disponibles:**
- Total de documentos procesados
- Volumen económico registrado
- Precisión promedio OCR
- Clasificación de gastos
- Evolución mensual

**Exportaciones:**
- CSV para Excel
- PDF para presentación
- JSON para integración
- Consultas SQL personalizadas

---

## FLUJO DE USUARIO

### Caso 1: Consultor Fiscal Autónomo

```
1. REGISTRO
   ↓
2. LOGIN
   ↓
3. SUSCRIPCIÓN (Plan Pro: €29/mes)
   ↓
4. SUBIR FACTURAS
   - Octubre: 47 facturas
   - Noviembre: 52 facturas
   ↓
5. OCR PROCESA (background)
   - 2-5 segundos por documento
   - 99 documentos total
   ↓
6. REVISAR RESULTADOS
   - Validar datos extraídos
   - Corregir si es necesario
   - Score de confianza: 94%
   ↓
7. CONSULTAR IA
   - "¿Es deducible este gasto?"
   - "¿Qué modelo fiscal debo usar?"
   - Respuestas en contexto
   ↓
8. EXPORTAR A CONTABLE
   - Descargar CSV
   - Importar en software contable
   - Generar asiento contable
   ↓
9. GENERAR INFORME
   - Informe fiscal mensual
   - Gráficos y análisis
   - PDF listo para cliente
```

### Caso 2: Empresa con Múltiples Facturas

```
1. SUBIR EN LOTE (Bulk upload)
   - Carpeta: "Facturas Octubre"
   - 200+ archivos
   ↓
2. PROCESAMIENTO PARALELO
   - Workers: 5 procesos simultáneos
   - Tiempo total: ~2 minutos
   ↓
3. VALIDACIÓN AUTOMÁTICA
   - Detectar duplicados
   - Validar NIF/CIF
   - Verificar importes
   ↓
4. CLASIFICACIÓN IA
   - Categorizar gastos automáticamente
   - Sugerir códigos PGC
   - Aplicar reglas de negocio
   ↓
5. ANÁLISIS Y REPORTING
   - Dashboard de gastos
   - Comparativa vs presupuesto
   - Anomalías detectadas
```

---

## ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────┐
│                   USUARIO FINAL                      │
│            (Consultor / Empresa / Agencia)          │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐  ┌─────▼─────┐  ┌────▼────┐
   │ Frontend │  │ Mobile    │  │ Desktop │
   │  React   │  │   App     │  │ Web     │
   │  Web     │  │  (React   │  │         │
   │          │  │   Native) │  │         │
   └────┬─────┘  └─────┬─────┘  └────┬────┘
        │              │              │
        └──────────────┼──────────────┘
                       │ HTTPS/REST
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼──────────────────────────┐ │
   │      FAST API BACKEND         │ │
   │  (Python + Uvicorn)           │ │
   │  - Auth/JWT                   │ │
   │  - Upload Handler             │ │
   │  - OCR Pipeline               │ │
   │  - IA Integration             │ │
   │  - Business Logic             │ │
   └────┬───────────────────────────┘ │
        │                             │
        ├─────────────────────────────┤
        │                             │
   ┌────▼──────┐  ┌─────────────┐   │
   │PostgreSQL  │  │   Redis     │   │
   │ Database   │  │  Cache +    │   │
   │            │  │  Sessions   │   │
   └────────────┘  └─────────────┘   │
        │                             │
        ├─────────────────────────────┤
        │                             │
   ┌────▼──────────────────────────┐  │
   │   OCR ENGINES (Workers)       │  │
   │  - PaddleOCR                  │  │
   │  - Tesseract (fallback)       │  │
   │  - RapidOCR (batch)           │  │
   └────┬───────────────────────────┘  │
        │                              │
   ┌────▼──────────────────────────┐   │
   │   STORAGE LAYER               │   │
   │  - Local (dev)                │   │
   │  - Backblaze B2 (prod)        │   │
   │  - DigitalOcean Spaces (alt)  │   │
   └───────────────────────────────┘   │
        │                              │
        └──────────────────────────────┘
        │
   ┌────▼──────────────────────────┐
   │   AI INTEGRATION              │
   │  - Claude API                 │
   │  - Custom Context Prompts     │
   │  - Tax Knowledge Base         │
   │  - Response Caching           │
   └───────────────────────────────┘
```

---

## CASOS DE USO

### ✅ Caso 1: Gestoría Fiscal (10-50 empleados)

**Problema:** Procesamiento manual de 500+ facturas/mes

**Solución Anclora Flow:**
- Upload masivo: 5 minutos
- OCR automático: 100% facturas procesadas
- IA revisa deducibilidad: Ahorra 20 horas/mes
- Exporta a software contable: Integración directa

**ROI:** 
- Ahorro de tiempo: 40 horas/mes
- Coste abonado: €29/mes
- Valor: ~€2,000/mes

---

### ✅ Caso 2: Consultor IA Independiente

**Problema:** Asesorar a 15 clientes sobre fiscalidad

**Solución Anclora Flow:**
- Consulta IA en tiempo real
- Respuestas contextualizadas y actualizadas
- Base de conocimiento de 2026
- Documentación generada automáticamente

**ROI:**
- Tiempo por consulta: 5 minutos (vs 30 antes)
- Clientes adicionales: +5/mes
- Ingresos generados: €1,500/mes

---

### ✅ Caso 3: Empresa SaaS B2B

**Problema:** Agregar OCR + IA a plataforma existente

**Solución Anclora Flow:**
- API REST disponible
- Webhooks para procesamiento async
- SDKs en Python/Node.js
- Documentación OpenAPI

**Integración:**
```bash
curl -X POST https://api.anclora.flow/v1/receipts \
  -H "Authorization: Bearer token" \
  -F "file=@factura.pdf"
```

---

## ROADMAP

### Q1 2026 (ACTUAL)
- ✅ MVP con OCR básico
- ✅ IA Assistant v1
- ✅ Dashboard estadísticas
- ⏳ Autenticación multi-tenancy
- ⏳ Rate limiting + seguridad

### Q2 2026
- 🎯 Integración contabilidad (Debitoor, Odoo)
- 🎯 Facturación electrónica (Facturae)
- 🎯 Reconocimiento de patrones de fraude
- 🎯 Reportes fiscales automáticos

### Q3 2026
- 🎯 App móvil iOS/Android
- 🎯 Marketplace de plugins
- 🎯 Machine learning personalizado
- 🎯 Auditoría y compliance

### Q4 2026
- 🎯 Integración bancaria (Open Banking)
- 🎯 Predicción de impuestos
- 🎯 Asesor de optimización fiscal
- 🎯 Certificación de compliance

---

## FAQ

### P: ¿Cuánto cuesta?

**R:** Tres planes disponibles:
- **Starter:** €9/mes (100 documentos/mes)
- **Pro:** €29/mes (1.000 documentos/mes)
- **Enterprise:** Personalizado (contactar ventas)

---

### P: ¿Dónde se almacenan mis datos?

**R:** 
- Base de datos: Amazon RDS (Frankfurt, EU)
- Documentos: Backblaze B2 (EU)
- Cumplimiento: GDPR, AEPD, ISO 27001

---

### P: ¿Puedo integrar con mi software contable?

**R:** Sí, disponibles:
- Debitoor
- Odoo
- Sage
- Facturae
- Conexión SQL directa

---

### P: ¿Qué idiomas soporta?

**R:**
- 🟩 Español: 100% (prioritario)
- 🟨 Inglés: 95%
- 🟦 Catalán: 90%
- 🟥 Gallego: 85%

---

### P: ¿Cuánto tarda procesar un documento?

**R:**
- PDF simple: 2-5 segundos
- Factura compleja: 10-15 segundos
- Batch de 100: 2-3 minutos
- Procesamiento en background (no bloquea)

---

### P: ¿Qué precisión tiene el OCR?

**R:**
- Promedio general: 92-94%
- Campos críticos (total): 98%+
- Revisión manual disponible
- Mejora continua con feedback

---

### P: ¿Es seguro? ¿Hay respaldo?

**R:**
- ✅ Encriptación TLS/HTTPS
- ✅ Backup diario
- ✅ Redundancia multi-región
- ✅ Uptime SLA: 99.9%
- ✅ Auditoría 2FA

---

**Última actualización:** 2026-01-17  
**Versión:** 1.0.1
