# Integración con Verifactu

## ¿Qué es Verifactu?

Verifactu es el sistema de la Agencia Tributaria Española para la verificación y registro de facturas electrónicas. Este sistema garantiza la integridad, trazabilidad y autenticidad de las facturas mediante tecnología de cadena de bloques (blockchain).

## Características de la Integración

### 1. Cadena de Bloques de Facturas

Cada factura registrada en Verifactu contiene:
- **Hash de la factura actual**: Calculado con SHA-256 usando datos de la factura
- **Hash de la factura anterior**: Referencia a la factura previa en la cadena
- **Índice de cadena**: Posición secuencial en la cadena de facturas
- **Código Seguro de Verificación (CSV)**: Código único de 16 caracteres
- **Código QR**: Para verificación rápida desde dispositivos móviles

### 2. Estados de Verifactu

Las facturas pueden tener los siguientes estados:

| Estado | Descripción |
|--------|-------------|
| `not_registered` | Factura no registrada en Verifactu |
| `pending` | Registro en proceso |
| `registered` | Factura registrada correctamente |
| `error` | Error en el registro |
| `cancelled` | Factura anulada en Verifactu |

### 3. Modos de Operación

#### Modo Test (Desarrollo)
- No requiere certificados digitales
- Simula el registro en Verifactu
- Los QR y CSV son funcionales pero no oficiales
- URL base: `https://sede.agenciatributaria.gob.es/verifactu/test`

#### Modo Producción
- Requiere certificado digital válido
- Registro oficial en la Agencia Tributaria
- Los QR y CSV son oficiales y verificables
- URL base: `https://sede.agenciatributaria.gob.es/verifactu`

## Arquitectura Backend

### Base de Datos

#### Tabla `invoices` (campos Verifactu añadidos)
```sql
verifactu_enabled          BOOLEAN DEFAULT false
verifactu_status           VARCHAR(50) DEFAULT 'not_registered'
verifactu_hash             VARCHAR(255)
verifactu_previous_hash    VARCHAR(255)
verifactu_chain_index      INTEGER
verifactu_qr_code          TEXT
verifactu_csv              VARCHAR(16)
verifactu_signature        TEXT
verifactu_test_mode        BOOLEAN DEFAULT true
verifactu_registered_at    TIMESTAMP
verifactu_aeat_response    JSONB
verifactu_error_message    TEXT
verifactu_retry_count      INTEGER DEFAULT 0
verifactu_url              VARCHAR(500)
verifactu_cancelled_at     TIMESTAMP
```

#### Tabla `verifactu_logs`
Registro de auditoría de todas las operaciones:
- Registros exitosos
- Errores
- Cancelaciones
- Verificaciones

#### Tabla `verifactu_config`
Configuración por usuario:
- Modo test/producción
- Certificados digitales
- Configuración AEAT

### API Endpoints

Base URL: `/api/verifactu`

#### GET `/config`
Obtener configuración de Verifactu del usuario

**Response:**
```json
{
  "user_id": "uuid",
  "test_mode": true,
  "certificate_path": "/path/to/cert",
  "auto_register": false,
  "enabled": true
}
```

#### PUT `/config`
Actualizar configuración

**Request:**
```json
{
  "test_mode": true,
  "auto_register": false,
  "enabled": true
}
```

#### POST `/register/:invoiceId`
Registrar una factura en Verifactu

**Response:**
```json
{
  "success": true,
  "invoice": {
    "invoice_id": "uuid",
    "verifactu_status": "registered",
    "verifactu_hash": "abc123...",
    "verifactu_csv": "4A2F9E8B1C6D5A3E",
    "verifactu_qr_code": "data:image/png;base64,...",
    "verifactu_url": "https://..."
  }
}
```

#### POST `/cancel/:invoiceId`
Anular registro de una factura

#### GET `/status/:invoiceId`
Consultar estado de registro

#### GET `/statistics`
Obtener estadísticas de Verifactu

**Response:**
```json
{
  "total_enabled": 150,
  "total_registered": 142,
  "total_pending": 5,
  "total_errors": 3,
  "last_chain_index": 142
}
```

#### GET `/pending`
Listar facturas pendientes de registro

#### GET `/registered`
Listar facturas registradas

#### GET `/logs`
Obtener logs de auditoría

#### GET `/verify-chain`
Verificar integridad de la cadena

**Response:**
```json
{
  "valid": true,
  "total_invoices": 142,
  "chain_breaks": [],
  "message": "Cadena verificada correctamente"
}
```

#### POST `/batch-register`
Registro masivo de facturas

**Request:**
```json
{
  "invoice_ids": ["uuid1", "uuid2", "uuid3"]
}
```

## Servicio Verifactu

### `VerifactuService` (`backend/src/services/verifactu.service.js`)

#### Métodos Principales

##### `registerInvoice(invoiceId, userId, testMode)`
Registra una factura individual en Verifactu.

**Proceso:**
1. Obtiene los datos de la factura
2. Calcula el hash de la factura anterior
3. Genera el hash de la factura actual
4. Genera el CSV (Código Seguro de Verificación)
5. Genera el código QR
6. Envía a la AEAT (o simula en test mode)
7. Actualiza la factura con los datos de registro
8. Crea log de auditoría

##### `cancelInvoice(invoiceId, userId, reason)`
Anula el registro de una factura.

##### `verifyChain(userId, startIndex, endIndex)`
Verifica la integridad de la cadena de facturas.

**Verificaciones:**
- Hash de cada factura es correcto
- Hash anterior coincide con la factura previa
- Índices son secuenciales
- No hay facturas faltantes

##### `generateInvoiceHash(invoice, previousHash, chainIndex)`
Calcula el hash SHA-256 de una factura.

**Datos incluidos:**
- Número de factura
- Fecha de emisión
- Total
- Hash anterior
- Índice de cadena
- ID de usuario

##### `generateCSV(invoiceHash)`
Genera el Código Seguro de Verificación (16 caracteres hexadecimales).

##### `generateQRCode(invoice, csv, verifactuUrl)`
Genera código QR con los datos de verificación.

##### `sendToAEAT(invoice, hash, csv)`
Envía los datos a la Agencia Tributaria (modo producción).

## Frontend

### Interfaz de Usuario

#### Columna Verifactu en Tabla de Facturas

Muestra badges con el estado actual:
- ✅ **Registrada** (verde)
- ⏳ **Pendiente** (amarillo)
- ❌ **Error** (rojo)
- ⚪ **No registrada** (gris)

#### Acciones Disponibles

Para facturas **registradas**:
- 🔲 **Ver QR**: Muestra el código QR de verificación
- 🔐 **Ver CSV**: Muestra el Código Seguro de Verificación

Para facturas **no registradas**:
- 📋 **Registrar**: Inicia el proceso de registro

Para facturas con **error**:
- 🔄 **Reintentar**: Intenta registrar nuevamente

### Flujo de Registro

1. Usuario hace clic en "Registrar en Verifactu"
2. El sistema valida que la factura esté completa
3. Se calcula el hash y se encadena con la factura anterior
4. Se envía a la AEAT (o simula en test mode)
5. Se actualiza el estado en tiempo real
6. Se genera QR y CSV
7. Usuario puede descargar la factura con los datos de Verifactu

## Configuración

### Variables de Entorno

```env
# Verifactu Configuration
VERIFACTU_TEST_MODE=true
VERIFACTU_CERTIFICATE_PATH=/path/to/certificate.pfx
VERIFACTU_CERTIFICATE_PASSWORD=your_password
VERIFACTU_NIF=B12345678
VERIFACTU_AEAT_URL=https://sede.agenciatributaria.gob.es/verifactu
```

### Configuración Inicial

1. **Modo Test (Recomendado para desarrollo)**
   ```bash
   # No requiere certificados
   VERIFACTU_TEST_MODE=true
   ```

2. **Modo Producción**
   ```bash
   # Requiere certificado digital
   VERIFACTU_TEST_MODE=false
   VERIFACTU_CERTIFICATE_PATH=/path/to/cert.pfx
   VERIFACTU_CERTIFICATE_PASSWORD=password
   ```

## Migración de Base de Datos

Para habilitar Verifactu en una instalación existente:

```bash
# Ejecutar la migración
psql -d anclora_flow -f backend/src/database/migrations/001_add_verifactu_fields.sql
```

La migración añade:
- 15 columnas nuevas a la tabla `invoices`
- Tabla `verifactu_logs` para auditoría
- Tabla `verifactu_config` para configuración

## Seguridad

### Cadena de Bloques

La cadena de facturas garantiza:
- **Inmutabilidad**: No se pueden modificar facturas anteriores sin romper la cadena
- **Trazabilidad**: Cada factura está vinculada a la anterior
- **Integridad**: Cualquier alteración es detectable

### Auditoría

Todos los eventos se registran en `verifactu_logs`:
- Timestamp del evento
- Usuario que realizó la acción
- Tipo de operación
- Resultado (éxito/error)
- Respuesta de la AEAT

### Certificados Digitales

En modo producción:
- Los certificados deben estar en formato PKCS#12 (.pfx)
- Se requiere certificado reconocido por la AEAT
- Los certificados se almacenan de forma segura
- Las contraseñas nunca se guardan en logs

## Verificación de Integridad

### Verificación Manual

Endpoint: `GET /api/verifactu/verify-chain`

Verifica toda la cadena de facturas del usuario.

### Verificación Automática

El sistema puede configurarse para verificar automáticamente:
- Al registrar cada factura nueva
- Periódicamente mediante cron jobs
- Antes de generar informes fiscales

## Casos de Uso

### 1. Registro Individual
```javascript
POST /api/verifactu/register/invoice-uuid-here
```

### 2. Registro Masivo
```javascript
POST /api/verifactu/batch-register
{
  "invoice_ids": ["uuid1", "uuid2", "uuid3"]
}
```

### 3. Consulta de Estado
```javascript
GET /api/verifactu/status/invoice-uuid-here
```

### 4. Verificación de Cadena
```javascript
GET /api/verifactu/verify-chain
```

## Solución de Problemas

### Error: "Factura no encontrada"
- Verificar que el ID de factura sea correcto
- Verificar que la factura pertenezca al usuario

### Error: "Hash anterior no encontrado"
- Puede ser la primera factura (normal)
- Verificar integridad de la cadena con `/verify-chain`

### Error: "Certificado inválido"
- Verificar que el certificado esté vigente
- Verificar el password del certificado
- Verificar que el certificado esté reconocido por la AEAT

### Error en modo producción
- Revisar logs en `verifactu_logs`
- Verificar conectividad con la AEAT
- Verificar que los datos de la factura cumplan requisitos

## Testing

### Facturas de Prueba

El sistema incluye 5 facturas de ejemplo con diferentes estados Verifactu:
1. F2025-001: Registrada ✅
2. F2025-002: Registrada ✅
3. F2025-003: Pendiente ⏳
4. F2025-004: Error ❌
5. F2025-005: No registrada ⚪

### Tests Automáticos

```bash
# Backend tests
npm test -- verifactu

# Verificar cadena
curl http://localhost:8020/api/verifactu/verify-chain
```

## Roadmap

### Próximas Funcionalidades
- [ ] Integración con certificados en la nube
- [ ] Notificaciones automáticas de registro
- [ ] Exportación de informes fiscales
- [ ] Dashboard de estadísticas Verifactu
- [ ] Auto-registro configurable
- [ ] Integración con firma electrónica avanzada
- [ ] Backup de cadena en múltiples ubicaciones

## Recursos

- [Documentación oficial Verifactu](https://sede.agenciatributaria.gob.es/verifactu)
- [Especificaciones técnicas AEAT](https://sede.agenciatributaria.gob.es/verifactu/specs)
- [Guía de certificados digitales](https://sede.agenciatributaria.gob.es/certificados)

## Soporte

Para problemas o consultas sobre la integración Verifactu:
1. Revisar los logs en `verifactu_logs`
2. Verificar la configuración en `verifactu_config`
3. Consultar la documentación oficial de la AEAT
4. Contactar con el soporte técnico
