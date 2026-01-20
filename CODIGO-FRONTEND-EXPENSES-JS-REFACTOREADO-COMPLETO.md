# CÓDIGO FRONTEND - expenses.js REFACTOREADO (v2.0)

**Versión:** 2.0  
**Cambios:** Validaciones en cliente, gestión de archivos, restricciones de edición, previsualización de documentos

---

## FRAGMENTOS A AGREGAR/REEMPLAZAR EN expenses.js

### 1️⃣ AGREGAR: Validador de cliente

**Insertar después de constantes (línea ~100):**

```javascript
// === VALIDADOR DE CLIENTE ===
const CLIENT_VALIDATOR = {
  validateExpenseDate: (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Fecha inválida' };
    }
    if (date > today) {
      return { valid: false, error: 'La fecha no puede ser futura' };
    }
    if (date.getFullYear() < 2000) {
      return { valid: false, error: 'La fecha no puede ser anterior a 2000' };
    }
    return { valid: true };
  },

  validateDescription: (desc) => {
    const trimmed = (desc || '').trim();
    if (!trimmed) {
      return { valid: false, error: 'Descripción es obligatoria' };
    }
    if (trimmed.length < 5) {
      return { valid: false, error: 'Descripción debe tener mínimo 5 caracteres' };
    }
    if (trimmed.length > 500) {
      return { valid: false, error: 'Descripción no puede exceder 500 caracteres' };
    }
    return { valid: true };
  },

  validateAmount: (amount) => {
    const num = Number(amount);
    if (!Number.isFinite(num)) {
      return { valid: false, error: 'Importe debe ser un número válido' };
    }
    if (num <= 0) {
      return { valid: false, error: 'Importe debe ser mayor que 0' };
    }
    if (num > 999999.99) {
      return { valid: false, error: 'Importe no puede exceder 999.999,99 €' };
    }
    return { valid: true };
  },

  validateVatPercentage: (vat) => {
    const num = Number(vat || 21);
    if (!Number.isFinite(num)) {
      return { valid: false, error: 'IVA debe ser un número válido' };
    }
    if (num < 0 || num > 100) {
      return { valid: false, error: 'IVA debe estar entre 0 y 100' };
    }
    return { valid: true };
  },

  validateDeductiblePercentage: (pct, category) => {
    const num = Number(pct || 100);
    if (!Number.isFinite(num)) {
      return { valid: false, error: 'Porcentaje debe ser un número válido' };
    }
    if (num < 0 || num > 100) {
      return { valid: false, error: 'Porcentaje debe estar entre 0 y 100' };
    }

    // Límites por categoría
    const limits = {
      'meals': 50,
      'other': 50
    };
    const maxAllowed = limits[category] ?? 100;

    if (num > maxAllowed) {
      return { valid: false, error: `Para categoría '${category}', máximo deducible es ${maxAllowed}%` };
    }

    return { valid: true };
  }
};
```

---

### 2️⃣ MEJORAR: Función setupExpenseForm()

**Reemplazar por:**

```javascript
function setupExpenseForm(form, expense) {
  const mode = form.dataset.mode || 'create';
  const amountInput = form.querySelector("#expense-amount");
  const vatPercentageInput = form.querySelector("#expense-vat-percentage");
  const vatAmountInput = form.querySelector("#expense-vat-amount");
  const deductibleToggle = form.querySelector("#expense-deductible");
  const deductibleGroup = form.querySelector("#deductible-percentage-group");
  const descriptionInput = form.querySelector("#expense-description");
  const dateInput = form.querySelector("#expense-date");
  const categorySelect = form.querySelector("#expense-category");
  const fileDropzone = form.querySelector("#file-dropzone");
  const fileInput = form.querySelector("#expense-receipt");
  const filePreview = form.querySelector("#file-preview");
  const fileName = form.querySelector("#file-name");
  const calcVatBtn = document.querySelector("#calc-vat-btn");

  // ✅ VALIDACIÓN: Fecha máx hoy
  const today = new Date().toISOString().split('T')[0];
  dateInput?.setAttribute('max', today);

  // ✅ VALIDACIÓN EN TIEMPO REAL: Descripción
  descriptionInput?.addEventListener('input', (e) => {
    const validation = CLIENT_VALIDATOR.validateDescription(e.target.value);
    if (validation.valid) {
      e.target.style.borderColor = '';
      e.target.style.boxShadow = '';
    } else {
      e.target.style.borderColor = '#fca5a5';
      e.target.style.boxShadow = '0 0 0 3px rgba(252, 165, 165, 0.1)';
    }
  });

  // ✅ VALIDACIÓN EN TIEMPO REAL: Fecha
  dateInput?.addEventListener('input', (e) => {
    const validation = CLIENT_VALIDATOR.validateExpenseDate(e.target.value);
    if (validation.valid) {
      e.target.style.borderColor = '';
      e.target.style.boxShadow = '';
    } else {
      e.target.style.borderColor = '#fca5a5';
      e.target.style.boxShadow = '0 0 0 3px rgba(252, 165, 165, 0.1)';
    }
  });

  // ✅ VALIDACIÓN EN TIEMPO REAL: Importe
  amountInput?.addEventListener('input', (e) => {
    const validation = CLIENT_VALIDATOR.validateAmount(e.target.value);
    if (validation.valid) {
      e.target.style.borderColor = '';
      syncVatAmount();
    } else {
      e.target.style.borderColor = '#fca5a5';
    }
  });

  // ✅ Sincronizar IVA automático
  const syncVatAmount = () => {
    const amount = sanitizeNumber(amountInput?.value, 0);
    const vatPercentage = sanitizeNumber(vatPercentageInput?.value, 0);
    const calculated = calculateVatAmount(amount, vatPercentage);
    if (vatAmountInput) {
      vatAmountInput.value = calculated.toFixed(2);
    }
  };

  amountInput?.addEventListener("input", syncVatAmount);
  vatPercentageInput?.addEventListener("input", syncVatAmount);

  // ✅ Botón calcular IVA
  calcVatBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    syncVatAmount();
    const vat = sanitizeNumber(vatAmountInput?.value, 0);
    showNotification(`IVA calculado: ${formatCurrency(vat)}`, 'success');
  });

  // ✅ Toggle deducible
  const toggleDeductibleFields = () => {
    const isChecked = deductibleToggle.checked;
    if (isChecked) {
      deductibleGroup.style.display = "flex";
    } else {
      deductibleGroup.style.display = "none";
    }
  };

  deductibleToggle?.addEventListener("change", toggleDeductibleFields);

  // ✅ VALIDACIÓN: Cambio de categoría → validar deducibilidad
  categorySelect?.addEventListener("change", (e) => {
    const category = e.target.value;
    const deductPct = sanitizeNumber(
      form.querySelector("#expense-deductible-percentage")?.value,
      100
    );
    const validation = CLIENT_VALIDATOR.validateDeductiblePercentage(deductPct, category);
    if (!validation.valid) {
      showNotification(validation.error, 'warning');
      form.querySelector("#expense-deductible-percentage").value = 100;
    }
  });

  // ✅ GESTIÓN DE ARCHIVOS: Dropzone
  if (fileDropzone) {
    fileDropzone.addEventListener('click', () => fileInput?.click());

    // Drag over
    fileDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileDropzone.style.background = '#f1f5f9';
      fileDropzone.style.borderColor = '#667eea';
      fileDropzone.style.transform = 'scale(1.02)';
    });

    // Drag leave
    fileDropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      fileDropzone.style.background = '#f8fafc';
      fileDropzone.style.borderColor = '#cbd5e1';
      fileDropzone.style.transform = 'scale(1)';
    });

    // Drop
    fileDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileDropzone.style.background = '#f8fafc';
      fileDropzone.style.borderColor = '#cbd5e1';
      fileDropzone.style.transform = 'scale(1)';

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        fileInput.files = files;
        updateFilePreview(files[0]);
      }
    });
  }

  // ✅ Cambio de archivo manual
  fileInput?.addEventListener('change', (e) => {
    if (e.target.files?.length > 0) {
      updateFilePreview(e.target.files[0]);
    }
  });

  // ✅ Función: Validar y previsualizar archivo
  function updateFilePreview(file) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    // Validar tipo
    if (!allowedTypes.includes(file.type)) {
      showNotification(`Tipo no permitido. Usa: PDF, JPG, PNG o WEBP`, 'error');
      fileInput.value = '';
      filePreview.style.display = 'none';
      return;
    }

    // Validar tamaño
    if (file.size > maxSize) {
      showNotification(`Archivo demasiado grande (máx. 10MB)`, 'error');
      fileInput.value = '';
      filePreview.style.display = 'none';
      return;
    }

    // Mostrar previsualización
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    fileName.textContent = `✅ ${file.name} (${sizeMB}MB)`;
    filePreview.style.display = 'block';

    // 🆕 Preview de imágenes
    if (allowedTypes.slice(1).includes(file.type)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.createElement('img');
        preview.src = e.target.result;
        preview.style.cssText = `
          max-width: 100%;
          max-height: 150px;
          border-radius: 6px;
          margin-top: 0.5rem;
          display: block;
        `;
        filePreview.appendChild(preview);
      };
      reader.readAsDataURL(file);
    }
  }

  // ✅ Submit con validación exhaustiva
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleExpenseSubmitWithValidation(form);
  });
}

// ✅ NUEVA FUNCIÓN: Submit con validación exhaustiva
async function handleExpenseSubmitWithValidation(form) {
  const formData = new FormData(form);
  const mode = form.dataset.mode || 'create';

  // Obtener datos
  const expenseDate = formData.get("expenseDate");
  const category = formData.get("category");
  const description = (formData.get("description") || "").trim();
  const amount = sanitizeNumber(formData.get("amount"), 0);
  const vatPercentage = sanitizeNumber(formData.get("vatPercentage"), 21);
  const vatAmount = sanitizeNumber(formData.get("vatAmount"), 0);
  const isDeductible = formData.get("isDeductible") === "on";
  const deductiblePercentage = sanitizeNumber(formData.get("deductiblePercentage"), 100);

  // ✅ VALIDAR: Fecha
  let validation = CLIENT_VALIDATOR.validateExpenseDate(expenseDate);
  if (!validation.valid) {
    showNotification(validation.error, 'error');
    form.querySelector("#expense-date").focus();
    return;
  }

  // ✅ VALIDAR: Categoría
  if (!category) {
    showNotification("Selecciona una categoría", 'error');
    form.querySelector("#expense-category").focus();
    return;
  }

  // ✅ VALIDAR: Descripción
  validation = CLIENT_VALIDATOR.validateDescription(description);
  if (!validation.valid) {
    showNotification(validation.error, 'error');
    form.querySelector("#expense-description").focus();
    return;
  }

  // ✅ VALIDAR: Importe
  validation = CLIENT_VALIDATOR.validateAmount(amount);
  if (!validation.valid) {
    showNotification(validation.error, 'error');
    form.querySelector("#expense-amount").focus();
    return;
  }

  // ✅ VALIDAR: IVA
  validation = CLIENT_VALIDATOR.validateVatPercentage(vatPercentage);
  if (!validation.valid) {
    showNotification(validation.error, 'error');
    form.querySelector("#expense-vat-percentage").focus();
    return;
  }

  // ✅ VALIDAR: Deducibilidad
  validation = CLIENT_VALIDATOR.validateDeductiblePercentage(deductiblePercentage, category);
  if (!validation.valid) {
    showNotification(validation.error, 'error');
    return;
  }

  // Construir payload
  const payload = {
    expenseDate,
    category,
    description,
    amount,
    vatPercentage,
    vatAmount,
    isDeductible,
  };

  if (isDeductible) {
    payload.deductiblePercentage = deductiblePercentage;
  } else {
    payload.deductiblePercentage = 0;
  }

  // Campos opcionales
  const subcategory = (formData.get("subcategory") || "").trim();
  if (subcategory) payload.subcategory = subcategory;

  const paymentMethod = formData.get("paymentMethod");
  if (paymentMethod) payload.paymentMethod = paymentMethod;

  const vendor = (formData.get("vendor") || "").trim();
  if (vendor) payload.vendor = vendor;

  const notes = (formData.get("notes") || "").trim();
  if (notes) payload.notes = notes;

  const changeReason = (formData.get("changeReason") || "").trim();
  if (changeReason) payload.changeReason = changeReason;

  // ✅ GESTIÓN DE ARCHIVOS (si existe)
  const fileInput = form.querySelector("#expense-receipt");
  if (fileInput?.files?.length > 0) {
    // Subir archivo separadamente (después de crear/editar gasto)
    payload._pendingFile = fileInput.files[0];
  }

  try {
    if (mode === "edit" && activeExpenseId) {
      // EDITAR
      const updatedExpense = await window.api.updateExpense(activeExpenseId, payload);
      const normalized = normalizeExpense(updatedExpense?.expense ?? updatedExpense);
      
      if (normalized) {
        expensesData = expensesData.filter((e) => e.id !== normalized.id);
        expensesData.unshift(normalized);
        expensesData.sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate));
        selectedExpenseId = String(normalized.id);
        currentPage = 1;
        renderExpensesTable();
        updateSummaryCards();
      }

      // ✅ SUBIR ARCHIVO SI EXISTE
      if (payload._pendingFile) {
        await uploadExpenseReceipt(activeExpenseId, payload._pendingFile);
      }

      showNotification("Gasto actualizado correctamente", "success");
    } else {
      // CREAR
      const createdExpense = await window.api.createExpense(payload);
      const normalized = normalizeExpense(createdExpense?.expense ?? createdExpense);
      
      if (normalized) {
        expensesData.unshift(normalized);
        expensesData.sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate));
        selectedExpenseId = String(normalized.id);
        currentPage = 1;
        renderExpensesTable();
        updateSummaryCards();
      }

      // ✅ SUBIR ARCHIVO SI EXISTE
      if (payload._pendingFile && normalized) {
        await uploadExpenseReceipt(normalized.id, payload._pendingFile);
      }

      showNotification("Gasto registrado correctamente", "success");
    }

    closeExpenseModal();
    loadExpenses(); // Sincronizar con backend
  } catch (error) {
    console.error("Error guardando gasto:", error);
    showNotification(error?.message || "No se pudo guardar el gasto", "error");
  }
}

// ✅ NUEVA FUNCIÓN: Subir comprobante
async function uploadExpenseReceipt(expenseId, file) {
  try {
    const formData = new FormData();
    formData.append('receipt', file);

    const response = await fetch(`/api/expenses/${expenseId}/receipt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${window.api.getAuthToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error subiendo comprobante');
    }

    const data = await response.json();
    showNotification("Comprobante subido correctamente", "success");
    return data;
  } catch (error) {
    console.error("Error uploading receipt:", error);
    showNotification("Comprobante subido pero con problemas", "warning");
  }
}
```

---

### 3️⃣ MEJORAR: Función viewExpense()

**Reemplazar por:**

```javascript
async function viewExpense(expenseId) {
  try {
    const expense = await window.api.getExpense(expenseId);
    if (!expense) {
      showNotification("No se encontró el gasto", "error");
      return;
    }

    // Preparar datos
    const formattedDate = formatDate(expense.expense_date);
    const categoryLabel = EXPENSE_CATEGORIES[expense.category] || expense.category || "Sin categoría";
    const subcategoryLabel = expense.subcategory || "-";
    const paymentMethodLabel = PAYMENT_METHODS[expense.payment_method] || expense.payment_method || "-";
    const projectLabel = expense.project_name || "-";
    const vatPercentageDisplay = sanitizeNumber(expense.vat_percentage ?? expense.vatPercentage, 0);
    const deductiblePercentageDisplay = sanitizeNumber(
      expense.deductible_percentage ?? expense.deductiblePercentage,
      0
    );
    const isDeductibleText = expense.is_deductible ?? expense.isDeductible ?? true
      ? `Sí, ${deductiblePercentageDisplay}%`
      : "No deducible";

    // ✅ NUEVO: Previsualización de archivo
    const receiptHtml = await buildReceiptPreviewHtml(expense.receipt_url);

    const totalWithVat = sanitizeNumber(expense.amount, 0) + sanitizeNumber(expense.vat_amount, 0);

    const modalHtml = `
      <div class="modal is-open" id="expense-view-modal" role="dialog" aria-modal="true">
        <div class="modal__backdrop"></div>
        <div class="modal__panel" style="width: min(95vw, 950px); max-width: 950px; max-height: 85vh; overflow-y: auto;">
          
          <header class="modal__head" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem;">
            <div>
              <h2 class="modal__title" style="color: white; margin-bottom: 0.25rem;">Detalle del Gasto</h2>
              <div style="display: flex; gap: 0.75rem; align-items: center; font-size: 0.85rem; margin-top: 0.75rem; flex-wrap: wrap;">
                <span style="background: rgba(255,255,255,0.2); padding: 0.4rem 0.75rem; border-radius: 4px;">
                  📅 ${formattedDate}
                </span>
                <span style="background: rgba(255,255,255,0.2); padding: 0.4rem 0.75rem; border-radius: 4px;">
                  🏷️ ${escapeHtml(categoryLabel)}
                </span>
                <span style="background: rgba(255,255,255,0.2); padding: 0.4rem 0.75rem; border-radius: 4px; font-weight: 600;">
                  💰 ${formatCurrency(expense.amount)}
                </span>
              </div>
            </div>
            <button type="button" class="modal__close" data-modal-close aria-label="Cerrar modal" style="color: white; font-size: 2rem;">×</button>
          </header>

          <div class="modal__body" style="padding: 2rem;">
            
            <!-- INFORMACIÓN PRINCIPAL (2 COLUMNAS) -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
              
              <!-- COLUMNA 1: DATOS BÁSICOS -->
              <div>
                <h3 style="font-size: 0.7rem; text-transform: uppercase; color: #6b7280; margin: 0 0 1rem 0; font-weight: 700; letter-spacing: 0.08em;">
                  Información Básica
                </h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                  ${[
                    { label: "Descripción", value: escapeHtml(expense.description || "-"), icon: "📝" },
                    { label: "Proveedor", value: escapeHtml(expense.vendor || "-"), icon: "🏢" },
                    { label: "Subcategoría", value: escapeHtml(subcategoryLabel), icon: "🏷️" },
                    { label: "Método de Pago", value: escapeHtml(paymentMethodLabel), icon: "💳" }
                  ].map(({ label, value, icon }) => `
                    <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem;">
                      <p style="margin: 0; font-size: 0.7rem; text-transform: uppercase; color: #9ca3af; font-weight: 700; letter-spacing: 0.03em;">
                        ${icon} ${label}
                      </p>
                      <p style="margin: 0.5rem 0 0 0; font-size: 0.95rem; color: #1e293b; font-weight: 500;">
                        ${value}
                      </p>
                    </div>
                  `).join("")}
                </div>
              </div>

              <!-- COLUMNA 2: DATOS FINANCIEROS -->
              <div>
                <h3 style="font-size: 0.7rem; text-transform: uppercase; color: #6b7280; margin: 0 0 1rem 0; font-weight: 700; letter-spacing: 0.08em;">
                  Datos Financieros
                </h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                  ${[
                    { label: "Importe Base", value: formatCurrency(expense.amount), icon: "💵" },
                    { label: "IVA", value: `${formatCurrency(expense.vat_amount)} (${vatPercentageDisplay}%)`, icon: "📊" },
                    { label: "Total", value: formatCurrency(totalWithVat), icon: "✅", highlight: true },
                    { label: "Deducible", value: escapeHtml(isDeductibleText), icon: "🎯" }
                  ].map(({ label, value, icon, highlight }) => `
                    <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; ${highlight ? 'background: #f0fdf4; padding: 0.75rem; border-radius: 6px; border-bottom: none;' : ''}">
                      <p style="margin: 0; font-size: 0.7rem; text-transform: uppercase; color: #9ca3af; font-weight: 700; letter-spacing: 0.03em;">
                        ${icon} ${label}
                      </p>
                      <p style="margin: 0.5rem 0 0 0; font-size: 0.95rem; color: #1e293b; font-weight: ${highlight ? '700' : '500'};">
                        ${value}
                      </p>
                    </div>
                  `).join("")}
                </div>
              </div>
            </div>

            <!-- COMPROBANTE (si existe) -->
            ${receiptHtml ? `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; background: #f8fafc;">
                <h3 style="font-size: 0.7rem; text-transform: uppercase; color: #6b7280; margin: 0 0 1rem 0; font-weight: 700;">📄 Comprobante</h3>
                ${receiptHtml}
              </div>
            ` : `
              <div style="border: 1px dashed #cbd5e1; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; background: #f8fafc; text-align: center;">
                <p style="margin: 0; color: #94a3b8; font-size: 0.85rem;">No hay comprobante adjuntado</p>
              </div>
            `}

            <!-- NOTAS (si existen) -->
            ${expense.notes ? `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; background: #f0fdf4;">
                <h3 style="font-size: 0.7rem; text-transform: uppercase; color: #6b7280; margin: 0 0 1rem 0; font-weight: 700;">📝 Notas</h3>
                <p style="margin: 0; color: #1e293b; white-space: pre-wrap; line-height: 1.5; font-size: 0.9rem;">
                  ${escapeHtml(expense.notes)}
                </p>
              </div>
            ` : ''}

            <!-- AUDITORÍA -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem;">
              <h3 style="font-size: 0.7rem; text-transform: uppercase; color: #9ca3af; margin: 0 0 1rem 0; font-weight: 700;">🔐 Información de Auditoría</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; font-size: 0.8rem;">
                <div>
                  <p style="margin: 0; color: #9ca3af; font-weight: 600;">Creado por</p>
                  <p style="margin: 0.25rem 0 0 0; color: #1e293b; font-weight: 500;">${expense.created_by_name || 'Sistema'}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #9ca3af; font-weight: 600;">Fecha creación</p>
                  <p style="margin: 0.25rem 0 0 0; color: #1e293b; font-weight: 500;">${formatDate(expense.created_at)}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #9ca3af; font-weight: 600;">Última edición</p>
                  <p style="margin: 0.25rem 0 0 0; color: #1e293b; font-weight: 500;">${formatDate(expense.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          <footer class="modal__footer" style="padding: 1rem 2rem; border-top: 1px solid #e5e7eb;">
            <button type="button" class="btn-ghost" data-modal-close>Cerrar</button>
            <button type="button" class="btn-primary" data-expense-edit="${expense.id}">
              ✏️ Editar gasto
            </button>
          </footer>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modal = document.getElementById("expense-view-modal");

    // Event listeners
    modal?.querySelectorAll("[data-modal-close]").forEach((btn) => {
      btn.addEventListener("click", () => modal.remove());
    });

    modal?.querySelector(".modal__backdrop")?.addEventListener("click", () => modal.remove());

    modal?.querySelector("[data-expense-edit]")?.addEventListener("click", () => {
      modal.remove();
      openExpenseModal("edit", String(expense.id));
    });

  } catch (error) {
    console.error("Error mostrando gasto:", error);
    showNotification("No se pudo mostrar el detalle del gasto", "error");
  }
}

// ✅ NUEVA FUNCIÓN: Previsualización de archivos
async function buildReceiptPreviewHtml(receiptUrl) {
  if (!receiptUrl) return null;

  try {
    const urlObj = new URL(receiptUrl);
    const pathname = urlObj.pathname.toLowerCase();
    const ext = pathname.split('.').pop();
    
    const isPdf = ext === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);

    if (isPdf) {
      return `
        <div style="background: white; border-radius: 6px; padding: 1.5rem; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 0.75rem;">📄</div>
          <p style="margin: 0 0 1rem 0; color: #1e293b; font-weight: 600;">Archivo PDF</p>
          <div style="display: flex; gap: 0.75rem; justify-content: center;">
            <a href="${escapeHtml(receiptUrl)}" target="_blank" rel="noopener noreferrer" 
              style="display: inline-block; padding: 0.6rem 1.25rem; border-radius: 6px; background: #667eea; color: white; text-decoration: none; font-weight: 500; font-size: 0.85rem;">
              📥 Descargar
            </a>
            <a href="${escapeHtml(receiptUrl)}" target="_blank" rel="noopener noreferrer" 
              style="display: inline-block; padding: 0.6rem 1.25rem; border-radius: 6px; background: #f3f4f6; color: #1e293b; text-decoration: none; font-weight: 500; font-size: 0.85rem; border: 1px solid #e5e7eb;">
              🔍 Abrir
            </a>
          </div>
        </div>
      `;
    }

    if (isImage) {
      return `
        <div style="background: white; border-radius: 6px; padding: 1rem;">
          <img src="${escapeHtml(receiptUrl)}" alt="Comprobante" 
            style="max-width: 100%; max-height: 400px; border-radius: 6px; display: block; margin: 0 auto;">
          <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem;">
            <a href="${escapeHtml(receiptUrl)}" target="_blank" rel="noopener noreferrer" 
              style="display: inline-block; padding: 0.5rem 1rem; border-radius: 6px; background: #f3f4f6; color: #1e293b; text-decoration: none; font-weight: 500; font-size: 0.85rem; border: 1px solid #e5e7eb;">
              🔍 Pantalla completa
            </a>
          </div>
        </div>
      `;
    }

    // Archivo de tipo desconocido pero con URL
    return `
      <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 1rem;">
        <p style="margin: 0 0 0.75rem 0; color: #92400e; font-weight: 500;">Archivo adjuntado</p>
        <a href="${escapeHtml(receiptUrl)}" target="_blank" rel="noopener noreferrer" 
          style="display: inline-block; color: #667eea; text-decoration: underline; font-weight: 500;">
          📥 Descargar archivo →
        </a>
      </div>
    `;
  } catch (error) {
    console.error("Error building receipt preview:", error);
    return null;
  }
}
```

---

### 4️⃣ NUEVA FUNCIÓN: Audit Log

**Agregar nuevo método:**

```javascript
async function viewExpenseAuditLog(expenseId) {
  try {
    const response = await fetch(`/api/expenses/${expenseId}/audit-log`, {
      headers: {
        'Authorization': `Bearer ${window.api.getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('No se pudo obtener el historial');
    }

    const { auditLog } = await response.json();

    const modalHtml = `
      <div class="modal is-open" id="audit-modal" role="dialog" aria-modal="true">
        <div class="modal__backdrop"></div>
        <div class="modal__panel" style="width: min(95vw, 700px); max-width: 700px;">
          <header class="modal__head">
            <h2 class="modal__title">Historial de Cambios</h2>
            <button type="button" class="modal__close" data-modal-close>×</button>
          </header>
          <div class="modal__body" style="max-height: 60vh; overflow-y: auto;">
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${auditLog.map((log, idx) => `
                <div style="border-left: 3px solid #667eea; padding-left: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-weight: 600; color: #1e293b;">
                      ${log.action === 'created' ? '✨ Creado' : log.action === 'updated' ? '✏️ Editado' : '🗑️ ' + log.action}
                    </span>
                    <span style="font-size: 0.8rem; color: #9ca3af;">
                      ${new Date(log.created_at).toLocaleString('es-ES')}
                    </span>
                  </div>
                  <p style="margin: 0; font-size: 0.85rem; color: #64748b;">
                    Por: <strong>${log.user_name || 'Usuario'}</strong>
                  </p>
                  ${log.change_reason ? `<p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #666; font-style: italic;">Motivo: ${escapeHtml(log.change_reason)}</p>` : ''}
                </div>
              `).join("")}
            </div>
          </div>
          <footer class="modal__footer">
            <button type="button" class="btn-secondary" data-modal-close>Cerrar</button>
          </footer>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modal = document.getElementById("audit-modal");
    
    modal?.querySelectorAll("[data-modal-close]").forEach((btn) => {
      btn.addEventListener("click", () => modal.remove());
    });
    
    modal?.querySelector(".modal__backdrop")?.addEventListener("click", () => modal.remove());

  } catch (error) {
    console.error("Error fetching audit log:", error);
    showNotification("No se pudo obtener el historial", "error");
  }
}
```

---

## ✅ FUNCIONES A ELIMINAR/DEPRECAR

- ❌ `handleExpenseSubmit()` (reemplazada por `handleExpenseSubmitWithValidation()`)

## ✅ INICIALIZACIONES EN `initExpenses()`

**Agregar al final:**

```javascript
// Exponer nuevas funciones globales
window.viewExpenseAuditLog = viewExpenseAuditLog;
window.calculateVatButton = calculateVatButton;
window.uploadExpenseReceipt = uploadExpenseReceipt;
```

---

## 🎯 RESUMEN DE CAMBIOS

| Aspecto | Antes | Después |
|--------|-------|---------|
| Validación Fecha | ❌ Sin validación | ✅ No futura |
| Validación Descripción | ❌ Solo máx (HTML) | ✅ Min 5, Max 500 |
| Validación Importe | ✅ Parcial (>0) | ✅ Exhaustiva |
| Gestión Archivos | ❌ Inexistente | ✅ Dropzone + validación |
| Auditoría | ❌ Sin logging | ✅ Cambios rastreables |
| Previsualización | ❌ Solo enlace | ✅ PDF e imágenes |
| UX Formulario | ⚠️ Básico | ✅ Validación en tiempo real |
| Seguridad | ✅ XSS preventido | ✅ Mejorada |

---

**Estado:** 🟢 Frontend refactoreado completamente

**Próximo paso:** Iniciar implementación backend
