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
    if (data.category && (CATEGORY_DEDUCTIBILITY_LIMITS as any)[data.category]) {
      const maxAllowed = (CATEGORY_DEDUCTIBILITY_LIMITS as any)[data.category] * 100;
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
  return (CATEGORY_DEDUCTIBILITY_LIMITS as any)[category] ?? 1.0;
}

/**
 * Obtener categorías válidas
 */
export function getValidCategories(): string[] {
  return [...VALID_CATEGORIES];
}
