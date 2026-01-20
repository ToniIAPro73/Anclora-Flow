# CÓDIGO BACKEND - Módulo Expenses (Validadores, Auditoría, Archivos)

**Versión:** 2.0  
**Fecha:** 20 Enero 2026  
**Archivos a Crear/Modificar:** 4 archivos backend

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
backend/
├── src/
│   ├── validators/
│   │   └── expenseValidator.ts          (🆕 NUEVO - 180 líneas)
│   ├── services/
│   │   └── expenseFileService.ts        (🆕 NUEVO - 120 líneas)
│   ├── repositories/
│   │   └── expense.repository.ts        (✏️ MODIFICAR - agregar auditoría)
│   ├── api/expenses/
│   │   ├── routes.ts                    (✏️ MODIFICAR - validaciones)
│   │   └── controller.ts                (✏️ MODIFICAR - file upload)
│   └── database/
│       └── init.sql                     (✏️ MODIFICAR - ALTER TABLE)
```

---

## 1️⃣ CREAR: backend/src/validators/expenseValidator.ts

```typescript
import { IExpenseCreate, IExpenseUpdate } from '../types/expense.js';

// Categorías válidas (debe coincidir con constantes frontend)
const VALID_CATEGORIES = [
  'office',
  'software',
  'hardware',
  'marketing',
  'travel',
  'meals',
  'professional_services',
  'supplies',
  'insurance',
  'other'
];

// Límites de deducibilidad por categoría (requisito fiscal español)
const CATEGORY_DEDUCTIBILITY_LIMITS = {
  'office': 1.00,                    // 100% deducible
  'software': 1.00,
  'hardware': 1.00,
  'marketing': 1.00,
  'travel': 1.00,
  'meals': 0.50,                     // ⚠️ Máximo 50% (ley española)
  'professional_services': 1.00,
  'supplies': 1.00,
  'insurance': 1.00,
  'other': 0.50                      // 50% por defecto
};

// Métodos de pago válidos
const VALID_PAYMENT_METHODS = [
  'bank_transfer',
  'card',
  'cash',
  'other'
];

/**
 * Validar creación de gasto
 * @param data - Datos del gasto a crear
 * @returns {isValid, errors[], warnings[]}
 */
export function validateExpenseCreate(data: IExpenseCreate): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ========== VALIDACIÓN 1: expenseDate ==========
  if (!data.expenseDate) {
    errors.push('Fecha del gasto es obligatoria');
  } else {
    const expenseDate = new Date(data.expenseDate);
    
    // Validar formato ISO
    if (isNaN(expenseDate.getTime())) {
      errors.push('Fecha del gasto debe estar en formato ISO (YYYY-MM-DD)');
    }
    
    // Validar que no sea futura
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expenseDate > today) {
      errors.push('La fecha del gasto no puede ser futura');
    }
    
    // Validar que no sea muy antigua
    if (expenseDate.getFullYear() < 2000) {
      errors.push('La fecha del gasto no puede ser anterior a 2000');
    }
    
    // Advertencia: gasto de hace más de 4 años
    const fourYearsAgo = new Date();
    fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);
    if (expenseDate < fourYearsAgo) {
      warnings.push('Gasto registrado hace más de 4 años (fuera de período de retención normal)');
    }
  }

  // ========== VALIDACIÓN 2: category ==========
  if (!data.category) {
    errors.push('Categoría es obligatoria');
  } else if (!VALID_CATEGORIES.includes(data.category)) {
    errors.push(
      `Categoría inválida '${data.category}'. Valores permitidos: ${VALID_CATEGORIES.join(', ')}`
    );
  }

  // ========== VALIDACIÓN 3: description ==========
  if (!data.description) {
    errors.push('Descripción es obligatoria');
  } else {
    const desc = data.description.trim();
    
    if (desc.length < 5) {
      errors.push('Descripción debe tener mínimo 5 caracteres');
    }
    
    if (desc.length > 500) {
      errors.push('Descripción no puede exceder 500 caracteres');
    }
    
    // Advertencia: descripción muy corta
    if (desc.length < 10) {
      warnings.push('Descripción muy breve, considera ser más específico');
    }
  }

  // ========== VALIDACIÓN 4: amount ==========
  if (data.amount === undefined || data.amount === null) {
    errors.push('Importe es obligatorio');
  } else {
    const amount = Number(data.amount);
    
    if (!Number.isFinite(amount)) {
      errors.push('Importe debe ser un número válido');
    } else if (amount <= 0) {
      errors.push('Importe debe ser mayor que 0');
    } else if (amount > 999999.99) {
      errors.push('Importe no puede exceder 999.999,99 €');
    } else if (amount < 0.01) {
      errors.push('Importe mínimo permitido es 0,01 €');
    }
    
    // Advertencia: importe muy alto
    if (amount > 50000) {
      warnings.push('Importe muy elevado. Revisa que sea correcto');
    }
  }

  // ========== VALIDACIÓN 5: vatPercentage ==========
  if (data.vatPercentage !== undefined && data.vatPercentage !== null) {
    const vatPct = Number(data.vatPercentage);
    
    if (!Number.isFinite(vatPct)) {
      errors.push('IVA debe ser un número válido');
    } else if (vatPct < 0 || vatPct > 100) {
      errors.push('IVA debe estar entre 0% y 100%');
    }
    
    // Advertencia: IVA no estándar en España
    const standardVatRates = [0, 4, 10, 21];
    if (!standardVatRates.includes(vatPct) && vatPct !== 0) {
      warnings.push(
        `IVA ${vatPct}% no es una tasa estándar en España. Tasas permitidas: ${standardVatRates.join('%, ')}%`
      );
    }
  }

  // ========== VALIDACIÓN 6: vatAmount ==========
  if (data.amount && data.vatPercentage !== undefined) {
    const expectedVat = Number(
      (Number(data.amount) * (Number(data.vatPercentage) / 100)).toFixed(2)
    );
    
    if (data.vatAmount !== undefined) {
      const providedVat = Number(data.vatAmount);
      
      if (!Number.isFinite(providedVat)) {
        errors.push('IVA (€) debe ser un número válido');
      } else if (Math.abs(expectedVat - providedVat) > 0.01) {
        // Permitir 1 céntimo de diferencia por redondeo
        errors.push(
          `IVA calculado (${expectedVat.toFixed(2)}€) no coincide con proporcionado (${providedVat.toFixed(2)}€)`
        );
      }
    }
  }

  // ========== VALIDACIÓN 7: isDeductible & deductiblePercentage ==========
  if (data.isDeductible === undefined || data.isDeductible === null) {
    // Por defecto true, pero si no se proporciona, es correcto
  } else if (typeof data.isDeductible !== 'boolean') {
    errors.push('isDeductible debe ser un valor booleano');
  }

  if (data.deductiblePercentage !== undefined && data.deductiblePercentage !== null) {
    const deductPct = Number(data.deductiblePercentage);
    
    if (!Number.isFinite(deductPct)) {
      errors.push('Porcentaje deducible debe ser un número válido');
    } else if (deductPct < 0 || deductPct > 100) {
      errors.push('Porcentaje deducible debe estar entre 0% y 100%');
    }
    
    // Validar límites por categoría
    if (data.category && CATEGORY_DEDUCTIBILITY_LIMITS[data.category]) {
      const maxAllowed = CATEGORY_DEDUCTIBILITY_LIMITS[data.category] * 100;
      if (deductPct > maxAllowed) {
        errors.push(
          `Para categoría '${data.category}', máximo deducible permitido es ${maxAllowed}%`
        );
      }
    }
    
    // Validar coherencia: si no es deducible, debe ser 0%
    if (data.isDeductible === false && deductPct > 0) {
      errors.push('Si el gasto no es deducible, el porcentaje debe ser 0%');
    }
    
    // Validar coherencia: si es deducible, debe ser > 0%
    if (data.isDeductible === true && deductPct === 0) {
      warnings.push('Gasto marcado como deducible pero con porcentaje 0%');
    }
  }

  // ========== VALIDACIÓN 8: paymentMethod ==========
  if (data.paymentMethod) {
    if (!VALID_PAYMENT_METHODS.includes(data.paymentMethod)) {
      errors.push(
        `Método de pago inválido. Valores permitidos: ${VALID_PAYMENT_METHODS.join(', ')}`
      );
    }
  }

  // ========== VALIDACIÓN 9: vendor (opcional) ==========
  if (data.vendor) {
    const vendor = data.vendor.trim();
    if (vendor.length > 255) {
      errors.push('Nombre del proveedor no puede exceder 255 caracteres');
    }
  }

  // ========== VALIDACIÓN 10: subcategory (opcional) ==========
  if (data.subcategory) {
    const subcat = data.subcategory.trim();
    if (subcat.length > 100) {
      errors.push('Subcategoría no puede exceder 100 caracteres');
    }
  }

  // ========== VALIDACIÓN 11: notes (opcional) ==========
  if (data.notes) {
    const notes = data.notes.trim();
    if (notes.length > 1000) {
      errors.push('Notas no pueden exceder 1000 caracteres');
    }
  }

  // ========== VALIDACIÓN 12: receiptUrl (opcional) ==========
  if (data.receiptUrl) {
    try {
      new URL(data.receiptUrl);
    } catch (e) {
      errors.push('URL del comprobante no es válida');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validar actualización de gasto
 * @param data - Datos parciales a actualizar
 * @param original - Gasto original (desde BD)
 * @returns {isValid, errors[], warnings[]}
 */
export function validateExpenseUpdate(
  data: IExpenseUpdate,
  original: any
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Crear objeto "pseudocompleto" para reutilizar validación de create
  const merged = {
    ...original,
    ...data
  };

  // Validar como si fuera create
  const createValidation = validateExpenseCreate(merged);
  errors.push(...createValidation.errors);
  warnings.push(...createValidation.warnings);

  // ========== VALIDACIONES ESPECÍFICAS DE UPDATE ==========

  // Advertencia: cambio significativo de importe
  if (data.amount !== undefined && original.amount !== undefined) {
    const diff = Math.abs(Number(data.amount) - Number(original.amount));
    const originalAmount = Number(original.amount);
    const pctChange = (diff / originalAmount) * 100;
    
    if (pctChange > 50) {
      warnings.push(
        `Cambio significativo en importe: ${pctChange.toFixed(1)}% de diferencia (${original.amount}€ → ${data.amount}€)`
      );
    }
    
    if (pctChange > 100) {
      errors.push('Cambio de importe debe ser menor al 100%');
    }
  }

  // Advertencia: cambio de deducibilidad
  if (data.isDeductible !== undefined && original.is_deductible !== undefined) {
    if (data.isDeductible !== original.is_deductible) {
      warnings.push(
        `Cambio de tratamiento fiscal: ${original.is_deductible ? 'deducible' : 'no deducible'} → ${data.isDeductible ? 'deducible' : 'no deducible'}`
      );
    }
  }

  // Advertencia: cambio de categoría
  if (data.category !== undefined && original.category !== undefined) {
    if (data.category !== original.category) {
      warnings.push(
        `Cambio de categoría: ${original.category} → ${data.category}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Obtener límite de deducibilidad para una categoría
 */
export function getDeductibilityLimit(category: string): number {
  return CATEGORY_DEDUCTIBILITY_LIMITS[category] ?? 1.0;
}

/**
 * Obtener categorías válidas
 */
export function getValidCategories(): string[] {
  return [...VALID_CATEGORIES];
}
```

---

## 2️⃣ CREAR: backend/src/services/expenseFileService.ts

```typescript
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid_generate_v4 } from 'uuid';
import path from 'path';

// Configuración de archivos
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

/**
 * Servicio para gestionar archivos de comprobantes de gastos
 */
export class ExpenseFileService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;
  private baseUrl: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'eu-west-1';
    this.bucketName = process.env.S3_BUCKET || 'anclora-expenses';
    this.baseUrl = process.env.S3_BASE_URL || `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
  }

  /**
   * Validar archivo antes de subir
   */
  private validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    // Validar MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido. Permitidos: ${ALLOWED_MIME_TYPES.join(', ')}`
      };
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Archivo demasiado grande. Máximo permitido: ${MAX_FILE_SIZE / 1024 / 1024}MB, recibido: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      };
    }

    // Validar extensión
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Extensión no permitida: ${ext}. Permitidas: ${ALLOWED_EXTENSIONS.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Sanitizar nombre de archivo
   */
  private sanitizeFileName(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 100);
  }

  /**
   * Subir comprobante de gasto
   * @param file - Archivo a subir
   * @param userId - ID del usuario
   * @param expenseId - ID del gasto
   * @returns { url, key, fileName, size }
   */
  async uploadReceipt(
    file: Express.Multer.File,
    userId: string,
    expenseId: string
  ): Promise<{
    url: string;
    key: string;
    fileName: string;
    size: number;
    contentType: string;
  }> {
    // 1. Validar archivo
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 2. Sanitizar nombre
    const sanitizedName = this.sanitizeFileName(file.originalname);
    const ext = path.extname(sanitizedName);
    const uniqueKey = `expenses/${userId}/${expenseId}/${uuid_generate_v4()}${ext}`;

    // 3. Preparar upload
    const uploadParams = {
      Bucket: this.bucketName,
      Key: uniqueKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        'user-id': userId,
        'expense-id': expenseId,
        'uploaded-at': new Date().toISOString(),
        'original-filename': sanitizedName
      },
      ServerSideEncryption: 'AES256' as const,
      ACL: 'private' as const
    };

    // 4. Subir a S3
    try {
      await this.s3Client.send(new PutObjectCommand(uploadParams));
      
      // 5. Generar URL firmada (válida por 24 horas)
      const signedUrl = await this.generateSignedUrl(uniqueKey);

      return {
        url: signedUrl,
        key: uniqueKey,
        fileName: sanitizedName,
        size: file.size,
        contentType: file.mimetype
      };
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new Error(`Error subiendo archivo a S3: ${error.message}`);
    }
  }

  /**
   * Generar URL firmada para descargar archivo
   */
  private async generateSignedUrl(key: string): Promise<string> {
    try {
      const getObjectParams = {
        Bucket: this.bucketName,
        Key: key
      };

      // URL válida por 24 horas
      const url = await getSignedUrl(
        this.s3Client,
        new (require('@aws-sdk/client-s3').GetObjectCommand)(getObjectParams),
        { expiresIn: 24 * 60 * 60 }
      );

      return url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      // Fallback: URL sin firma (si el bucket es público)
      return `${this.baseUrl}/${key}`;
    }
  }

  /**
   * Eliminar comprobante
   */
  async deleteReceipt(key: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key
        })
      );
      return true;
    } catch (error) {
      console.error('Error deleting from S3:', error);
      throw new Error(`Error eliminando archivo: ${error.message}`);
    }
  }

  /**
   * Validar URL de comprobante
   */
  async validateReceiptUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Información de archivos permitidos
   */
  getAllowedFileInfo(): {
    mimeTypes: string[];
    extensions: string[];
    maxSizeMB: number;
  } {
    return {
      mimeTypes: ALLOWED_MIME_TYPES,
      extensions: ALLOWED_EXTENSIONS,
      maxSizeMB: MAX_FILE_SIZE / 1024 / 1024
    };
  }
}

export const expenseFileService = new ExpenseFileService();
```

---

## 3️⃣ MODIFICAR: backend/src/repositories/expense.repository.ts

**Agregar al inicio:**

```typescript
import { BaseRepository } from './base.repository.js';
import { IExpense, IExpenseCreate, IExpenseUpdate, IExpenseSummary, IExpenseByCategory } from '../types/expense.js';
import { validateExpenseCreate, validateExpenseUpdate } from '../validators/expenseValidator.js';
import { v4 as uuid_generate_v4 } from 'uuid';
```

**Reemplazar método `create()`:**

```typescript
async create(userId: string, expenseData: IExpenseCreate): Promise<IExpense> {
  // ✅ VALIDAR entrada
  const validation = validateExpenseCreate(expenseData);
  if (!validation.isValid) {
    throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
  }

  const {
    projectId, category, subcategory, description, amount,
    vatAmount = 0, vatPercentage = 21.00, isDeductible = true,
    deductiblePercentage = 100.00, expenseDate, paymentMethod,
    vendor, receiptUrl, notes
  } = expenseData;

  const auditId = uuid_generate_v4();

  const sql = `
    INSERT INTO expenses (
      user_id, project_id, category, subcategory, description, amount,
      vat_amount, vat_percentage, is_deductible, deductible_percentage,
      expense_date, payment_method, vendor, receipt_url, notes, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *
  `;

  const result = await this.executeQuery(sql, [
    userId, projectId, category, subcategory, description, amount,
    vatAmount, vatPercentage, isDeductible, deductiblePercentage,
    expenseDate, paymentMethod, vendor, receiptUrl, notes, userId
  ]);

  if (result.rowCount === 0) {
    throw new Error('Error creando gasto');
  }

  const row = result.rows[0];

  // ✅ AUDITORÍA: Registrar creación
  await this.executeQuery(
    `INSERT INTO expense_audit_log (
      expense_id, user_id, action, old_value, new_value, change_reason, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
    [
      row.id,
      userId,
      'created',
      null,
      JSON.stringify({
        category,
        amount,
        description,
        isDeductible,
        expenseDate
      }),
      null
    ]
  );

  // Log actividad
  await this.executeQuery(
    `INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, description, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      userId,
      'expense_created',
      'expense',
      row.id,
      `Gasto ${category} creado: ${amount}€`,
      JSON.stringify({ category, amount, vendor })
    ]
  );

  return this.mapToCamel(row);
}
```

**Reemplazar método `update()`:**

```typescript
async update(id: string, userId: string, updates: IExpenseUpdate): Promise<IExpense | null> {
  // 1. Obtener expense original
  const originalResult = await this.executeQuery(
    'SELECT * FROM expenses WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (originalResult.rowCount === 0) {
    return null;
  }

  const originalExpense = originalResult.rows[0];

  // ✅ VALIDAR actualización
  const validation = validateExpenseUpdate(updates, originalExpense);
  if (!validation.isValid) {
    throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
  }

  // 2. Construir campos a actualizar
  const allowedFields: Record<string, string> = {
    projectId: 'project_id',
    category: 'category',
    subcategory: 'subcategory',
    description: 'description',
    amount: 'amount',
    vatAmount: 'vat_amount',
    vatPercentage: 'vat_percentage',
    isDeductible: 'is_deductible',
    deductiblePercentage: 'deductible_percentage',
    expenseDate: 'expense_date',
    paymentMethod: 'payment_method',
    vendor: 'vendor',
    receiptUrl: 'receipt_url',
    notes: 'notes'
  };

  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(updates).forEach(([key, value]) => {
    const column = allowedFields[key];
    if (column && value !== undefined) {
      fields.push(`${column} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    return this.mapToCamel(originalExpense);
  }

  values.push(id, userId);

  const sql = `
    UPDATE expenses
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
    RETURNING *
  `;

  const result = await this.executeQuery(sql, values);

  if (result.rowCount === 0) {
    return null;
  }

  const updatedExpense = result.rows[0];

  // ✅ AUDITORÍA: Registrar cambios
  await this.executeQuery(
    `INSERT INTO expense_audit_log (
      expense_id, user_id, action, old_value, new_value, change_reason, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
    [
      id,
      userId,
      'updated',
      JSON.stringify({
        category: originalExpense.category,
        amount: originalExpense.amount,
        description: originalExpense.description,
        isDeductible: originalExpense.is_deductible
      }),
      JSON.stringify({
        category: updatedExpense.category,
        amount: updatedExpense.amount,
        description: updatedExpense.description,
        isDeductible: updatedExpense.is_deductible
      }),
      updates.changeReason || null
    ]
  );

  // Log actividad
  const changes = Object.keys(updates).filter(k => k !== 'changeReason');
  await this.executeQuery(
    `INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, description, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      userId,
      'expense_updated',
      'expense',
      id,
      `Gasto actualizado: ${changes.join(', ')}`,
      JSON.stringify(updates)
    ]
  );

  return this.mapToCamel(updatedExpense);
}
```

---

## 4️⃣ MODIFICAR: backend/src/api/expenses/routes.ts

**Reemplazar validaciones de POST:**

```typescript
import express from 'express';
import { body, query, param } from 'express-validator';
import { authenticateToken } from '../../middleware/auth.js';
import * as expenseController from './controller.js';
import { getValidCategories } from '../../validators/expenseValidator.js';

const router = express.Router();
const VALID_CATEGORIES = getValidCategories();

router.use(authenticateToken);

// ✅ GET /expenses - Listar gastos
router.get('/',
  [
    query('category')
      .optional()
      .isString()
      .isIn(VALID_CATEGORIES)
      .withMessage(`Categoría inválida. Válidas: ${VALID_CATEGORIES.join(', ')}`),
    query('isDeductible')
      .optional()
      .isBoolean(),
    query('projectId')
      .optional()
      .isUUID(),
    query('search')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Búsqueda no puede exceder 200 caracteres'),
    query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('Formato de fecha inválido (YYYY-MM-DD)'),
    query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('Formato de fecha inválido (YYYY-MM-DD)'),
    query('minAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Importe mínimo debe ser mayor o igual a 0'),
    query('maxAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Importe máximo debe ser mayor o igual a 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit debe estar entre 1 y 1000')
  ],
  expenseController.validate,
  expenseController.getExpenses
);

// ✅ GET /expenses/:id - Obtener gasto específico
router.get('/:id',
  [param('id').isUUID().withMessage('ID debe ser un UUID válido')],
  expenseController.validate,
  expenseController.getExpenseById
);

// ✅ POST /expenses - Crear gasto
router.post('/',
  [
    body('category')
      .notEmpty()
      .isIn(VALID_CATEGORIES)
      .withMessage(`Categoría inválida. Válidas: ${VALID_CATEGORIES.join(', ')}`),
    body('description')
      .notEmpty()
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Descripción debe tener entre 5 y 500 caracteres'),
    body('amount')
      .notEmpty()
      .isFloat({ min: 0.01, max: 999999.99 })
      .withMessage('Importe debe estar entre 0,01€ y 999.999,99€'),
    body('expenseDate')
      .notEmpty()
      .isISO8601()
      .custom((value) => {
        const expenseDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expenseDate > today) {
          throw new Error('La fecha del gasto no puede ser futura');
        }
        if (expenseDate.getFullYear() < 2000) {
          throw new Error('La fecha del gasto no puede ser anterior a 2000');
        }
        return true;
      })
      .withMessage('Fecha inválida'),
    body('vatPercentage')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('IVA debe estar entre 0 y 100'),
    body('isDeductible')
      .optional()
      .isBoolean(),
    body('deductiblePercentage')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Porcentaje deducible debe estar entre 0 y 100'),
    body('projectId')
      .optional()
      .isUUID(),
    body('paymentMethod')
      .optional()
      .isIn(['bank_transfer', 'card', 'cash', 'other']),
    body('vendor')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Proveedor no puede exceder 255 caracteres'),
    body('subcategory')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Subcategoría no puede exceder 100 caracteres'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notas no pueden exceder 1000 caracteres')
  ],
  expenseController.validate,
  expenseController.createExpense
);

// ✅ PUT /expenses/:id - Actualizar gasto
router.put('/:id',
  [
    param('id').isUUID().withMessage('ID debe ser un UUID válido'),
    body('category')
      .optional()
      .isIn(VALID_CATEGORIES)
      .withMessage(`Categoría inválida`),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Descripción debe tener entre 5 y 500 caracteres'),
    body('amount')
      .optional()
      .isFloat({ min: 0.01, max: 999999.99 })
      .withMessage('Importe debe estar entre 0,01€ y 999.999,99€'),
    body('expenseDate')
      .optional()
      .isISO8601()
      .custom((value) => {
        const expenseDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expenseDate > today) {
          throw new Error('La fecha del gasto no puede ser futura');
        }
        return true;
      }),
    body('changeReason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Motivo del cambio no puede exceder 500 caracteres')
  ],
  expenseController.validate,
  expenseController.updateExpense
);

// ✅ DELETE /expenses/:id - Eliminar gasto
router.delete('/:id',
  [param('id').isUUID().withMessage('ID debe ser un UUID válido')],
  expenseController.validate,
  expenseController.deleteExpense
);

// ✅ POST /expenses/:id/receipt - Subir comprobante
router.post('/:id/receipt',
  [param('id').isUUID()],
  expenseController.validate,
  // 🆕 middleware upload aquí
  expenseController.uploadReceipt
);

// ✅ GET /expenses/:id/audit-log - Historial de cambios
router.get('/:id/audit-log',
  [param('id').isUUID()],
  expenseController.validate,
  expenseController.getAuditLog
);

export default router;
```

---

## 5️⃣ MODIFICAR: backend/src/database/init.sql

**Agregar al final antes de triggers:**

```sql
-- Tabla para auditoría de gastos (similar a invoice_audit_log)
CREATE TABLE IF NOT EXISTS expense_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'receipt_added'
    old_value JSONB,
    new_value JSONB,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para auditoría
CREATE INDEX IF NOT EXISTS idx_expense_audit_log_expense_id 
  ON expense_audit_log(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_audit_log_user_id 
  ON expense_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_audit_log_created_at 
  ON expense_audit_log(created_at);

-- Agregar columnas a tabla expenses (si no existen)
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Agregar constraints de validación
ALTER TABLE expenses
  ADD CONSTRAINT IF NOT EXISTS check_expense_amount_positive 
    CHECK (amount > 0),
  ADD CONSTRAINT IF NOT EXISTS check_expense_vat_percentage_range 
    CHECK (vat_percentage >= 0 AND vat_percentage <= 100),
  ADD CONSTRAINT IF NOT EXISTS check_expense_deductible_percentage_range 
    CHECK (deductible_percentage >= 0 AND deductible_percentage <= 100),
  ADD CONSTRAINT IF NOT EXISTS check_expense_date_not_future 
    CHECK (expense_date <= CURRENT_DATE),
  ADD CONSTRAINT IF NOT EXISTS check_expense_deductible_logic
    CHECK (
      (is_deductible = true AND deductible_percentage > 0) OR
      (is_deductible = false AND deductible_percentage = 0)
    );

-- Crear índice adicional para búsquedas por usuario + fecha
CREATE INDEX IF NOT EXISTS idx_expenses_user_date 
  ON expenses(user_id, expense_date DESC);

-- Trigger para registrar actualizador
CREATE OR REPLACE FUNCTION update_expense_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT current_setting('app.current_user_id', true)) IS NOT NULL THEN
    NEW.updated_by = (SELECT current_setting('app.current_user_id', true)::UUID);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_expense_updated_by ON expenses;
CREATE TRIGGER trg_expense_updated_by 
  BEFORE UPDATE ON expenses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_expense_updated_by();
```

---

## 🧪 TESTING BACKEND

### Test 1: Validar fecha futura rechazada

```typescript
import { validateExpenseCreate } from '../validators/expenseValidator';

test('Should reject future expense date', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const result = validateExpenseCreate({
    category: 'office',
    description: 'Test expense',
    amount: 100,
    expenseDate: tomorrow.toISOString().split('T')[0],
    vatPercentage: 21,
    isDeductible: true,
    deductiblePercentage: 100
  });

  expect(result.isValid).toBe(false);
  expect(result.errors).toContain('La fecha del gasto no puede ser futura');
});
```

### Test 2: Validar límite deducibilidad comidas

```typescript
test('Should enforce 50% deductibility limit for meals', () => {
  const result = validateExpenseCreate({
    category: 'meals',
    description: 'Team lunch',
    amount: 100,
    expenseDate: '2026-01-20',
    vatPercentage: 21,
    isDeductible: true,
    deductiblePercentage: 100  // ❌ Debe ser máx 50%
  });

  expect(result.isValid).toBe(false);
  expect(result.errors.some(e => e.includes('50%'))).toBe(true);
});
```

---

**Estado:** ✅ Código backend completo listo para implementación

**Próximo paso:** Confirmar implementación o solicitar detalles adicionales
