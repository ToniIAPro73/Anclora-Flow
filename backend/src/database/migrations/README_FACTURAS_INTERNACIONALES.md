# Facturas Internacionales y Verifactu

Este módulo añade soporte completo para facturas internacionales (UE y exportación) con integración Verifactu según la normativa española.

## 📋 Contenido

- **002_add_international_invoice_fields.sql**: Migración SQL que añade campos para operaciones internacionales
- **create_test_invoices.sql**: Datos de prueba con 7 facturas que cubren todas las casuísticas
- **setup_international_invoices.ps1**: Script PowerShell que ejecuta todo automáticamente
- **run_international_migration.ps1**: Script PowerShell para ejecutar solo la migración

## 🚀 Inicio Rápido

### Opción 1: Setup Completo (Recomendado)

Ejecuta este script para configurar todo de una vez:

```powershell
cd backend/src/database/migrations
.\setup_international_invoices.ps1
```

Esto hará:
1. ✅ Ejecutar la migración de campos internacionales
2. ✅ Crear 6 clientes de prueba (España, Francia, Alemania, Italia, USA, UK)
3. ✅ Crear 7 facturas con diferentes casuísticas
4. ✅ Mostrar resumen y estadísticas

### Opción 2: Solo Migración

Si solo quieres añadir los campos sin datos de prueba:

```powershell
cd backend/src/database/migrations
.\run_international_migration.ps1
```

## 📊 Facturas de Prueba Creadas

El script `setup_international_invoices.ps1` crea 7 facturas de ejemplo:

### 🇪🇸 Facturas Nacionales (España)

| Número | Cliente | Importe | IVA | IRPF | Descripción |
|--------|---------|---------|-----|------|-------------|
| FAC-2025-001 | Acme Technologies España | 6.050,00€ | 1.050,00€ | - | Servicios de desarrollo web |
| FAC-2025-006 | Acme Technologies España | 4.240,00€ | 840,00€ | 600,00€ | Consultoría con retención IRPF |

**Verifactu:**
- ✅ Código operación: `01` (Nacional)
- ✅ IVA: 21% aplicable
- ✅ IRPF: 15% retención (opcional)

### 🇪🇺 Facturas Intracomunitarias (UE)

| Número | Cliente | País | NIF-IVA | Importe | IVA | Descripción |
|--------|---------|------|---------|---------|-----|-------------|
| FAC-2025-002 | TechCorp France | 🇫🇷 Francia | FR12345678901 | 8.000,00€ | 0€ | Consultoría técnica |
| FAC-2025-003 | Innovation GmbH | 🇩🇪 Alemania | DE987654321 | 3.500,00€ | 0€ | Venta equipamiento |
| FAC-2025-007 | Milano Digital | 🇮🇹 Italia | IT11223344556 | 15.000,00€ | 0€ | Desarrollo e-commerce |

**Verifactu:**
- ✅ Código operación: `02` (Intracomunitaria)
- ✅ IVA: 0% - Inversión del sujeto pasivo
- ✅ Motivo exención: "Art. 25 Ley 37/1992"
- ✅ Reverse Charge: Sí
- ✅ NIF-IVA cliente obligatorio

### 🌍 Facturas Exportación (Terceros Países)

| Número | Cliente | País | Importe | Moneda | IVA | Descripción |
|--------|---------|------|---------|--------|-----|-------------|
| FAC-2025-004 | Silicon Valley Corp | 🇺🇸 USA | 12.000,00 | USD | 0€ | Desarrollo software |
| FAC-2025-005 | British Tech Ltd | 🇬🇧 UK | 7.500,00 | GBP | 0€ | Venta hardware + DUA |

**Verifactu:**
- ✅ Código operación: `03` (Exportación)
- ✅ IVA: 0% - Exenta
- ✅ Motivo exención: "Art. 21 Ley 37/1992"
- ✅ Documento exportación (DUA/MRN) opcional
- ✅ Múltiples monedas soportadas (EUR, USD, GBP)

## 🗂️ Campos Añadidos

### Tabla `clients`

```sql
client_type             VARCHAR(50)     -- 'national', 'eu', 'international'
tax_id_type             VARCHAR(50)     -- 'nif', 'vat_id', 'tax_number'
country_code            VARCHAR(2)      -- ISO 3166-1 alpha-2
vat_validated           BOOLEAN         -- NIF-IVA validado con VIES
vat_validated_at        TIMESTAMP       -- Fecha validación
```

### Tabla `invoices`

```sql
operation_type          VARCHAR(50)     -- 'national', 'intra_eu', 'export'
verifactu_operation_code VARCHAR(10)    -- '01', '02', '03'
vat_exemption_reason    VARCHAR(255)    -- Base legal exención
reverse_charge          BOOLEAN         -- Inversión sujeto pasivo
client_vat_number       VARCHAR(50)     -- NIF-IVA cliente UE
destination_country_code VARCHAR(2)     -- País destino
goods_or_services       VARCHAR(20)     -- 'goods', 'services'
place_of_supply         VARCHAR(255)    -- Lugar prestación/entrega
export_document_number  VARCHAR(100)    -- DUA, MRN
export_date             DATE            -- Fecha exportación
```

## 📖 Normativa Verifactu

### Códigos de Operación AEAT

| Código | Tipo | IVA | Descripción |
|--------|------|-----|-------------|
| `01` | Nacional | 21% | Operaciones en España |
| `02` | Intracomunitaria | 0% | Operaciones UE - Inversión sujeto pasivo |
| `03` | Exportación | 0% | Exportaciones fuera UE |

### Exenciones de IVA

**Operaciones Intracomunitarias (UE):**
- Base legal: Art. 25 Ley 37/1992
- Inversión del sujeto pasivo: El cliente paga el IVA en su país
- Requisito: NIF-IVA del cliente validado en VIES

**Exportaciones (Terceros países):**
- Base legal: Art. 21 Ley 37/1992
- Exención completa de IVA
- Requisito opcional: Documento aduanero (DUA/MRN)

## 🔍 Consultas Útiles

### Ver todas las facturas por tipo

```sql
SELECT
    invoice_number,
    operation_type,
    verifactu_operation_code,
    total,
    vat_amount,
    vat_exemption_reason
FROM invoices
WHERE user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY operation_type, issue_date;
```

### Estadísticas por tipo de operación

```sql
SELECT
    operation_type,
    COUNT(*) as num_facturas,
    SUM(total) as total_facturado,
    SUM(vat_amount) as total_iva_recaudado
FROM invoices
WHERE user_id = '00000000-0000-0000-0000-000000000001'
GROUP BY operation_type;
```

### Clientes UE con NIF-IVA validado

```sql
SELECT
    name,
    country,
    nif_cif as vat_number,
    vat_validated,
    vat_validated_at
FROM clients
WHERE client_type = 'eu'
AND user_id = '00000000-0000-0000-0000-000000000001';
```

## 🎯 Casos de Uso

### Caso 1: Cliente Español (Nacional)

```sql
-- Cliente
client_type = 'national'
country_code = 'ES'
tax_id_type = 'nif'

-- Factura
operation_type = 'national'
verifactu_operation_code = '01'
vat_percentage = 21.00
vat_amount = (subtotal * 0.21)
```

### Caso 2: Cliente Francés (UE)

```sql
-- Cliente
client_type = 'eu'
country_code = 'FR'
tax_id_type = 'vat_id'
nif_cif = 'FR12345678901'  -- NIF-IVA

-- Factura
operation_type = 'intra_eu'
verifactu_operation_code = '02'
vat_percentage = 0.00
vat_amount = 0.00
reverse_charge = true
vat_exemption_reason = 'Art. 25 Ley 37/1992 - Operación intracomunitaria exenta'
client_vat_number = 'FR12345678901'
```

### Caso 3: Cliente Estadounidense (Exportación)

```sql
-- Cliente
client_type = 'international'
country_code = 'US'
tax_id_type = 'tax_number'

-- Factura
operation_type = 'export'
verifactu_operation_code = '03'
vat_percentage = 0.00
vat_amount = 0.00
reverse_charge = false
vat_exemption_reason = 'Art. 21 Ley 37/1992 - Exportación exenta'
destination_country_code = 'US'
```

## ⚠️ Importante

1. **Verifactu se aplica SOLO a facturas emitidas**, no a facturas recibidas (gastos)
2. **Todas las facturas** (nacionales, UE, exportación) deben registrarse en Verifactu
3. **NIF-IVA validación**: Se recomienda validar NIF-IVA UE con sistema VIES
4. **Documentos de exportación**: DUA/MRN recomendados pero no obligatorios en modo test
5. **Código software**: El `software_nif` debe ser el NIF de tu empresa registrado en AEAT

## 🔧 Troubleshooting

### Error: "No se puede registrar en Verifactu"

Verifica:
- ✅ Verifactu está habilitado en la configuración del usuario
- ✅ La factura tiene `operation_type` y `verifactu_operation_code`
- ✅ Para facturas UE: `client_vat_number` está relleno
- ✅ Para facturas UE/export: `vat_exemption_reason` está relleno

### Error: "NIF-IVA inválido"

Para clientes UE:
- ✅ Formato: 2 letras país + 8-12 dígitos (ej: FR12345678901)
- ✅ Validar con VIES: https://ec.europa.eu/taxation_customs/vies/

### Datos de prueba no aparecen

```powershell
# Verificar que los datos se crearon
docker exec anclora-postgres psql -U postgres -d anclora_flow -c "
    SELECT COUNT(*) FROM invoices WHERE invoice_number LIKE 'FAC-2025-%';
"

# Si devuelve 0, vuelve a ejecutar:
.\setup_international_invoices.ps1
```

## 📚 Referencias

- [Verifactu - AEAT](https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GI35.shtml)
- [Ley 37/1992 - IVA](https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740)
- [VIES - Validación NIF-IVA](https://ec.europa.eu/taxation_customs/vies/)
- [ISO 3166-1 - Códigos de país](https://www.iso.org/iso-3166-country-codes.html)

## 🆘 Soporte

Si tienes problemas:
1. Verifica que Docker está corriendo
2. Ejecuta `.\setup_international_invoices.ps1` de nuevo
3. Revisa los logs en consola
4. Verifica la base de datos con las consultas SQL de arriba

---

**Versión:** 1.0.0
**Fecha:** Octubre 2025
**Autor:** Anclora Flow Team
