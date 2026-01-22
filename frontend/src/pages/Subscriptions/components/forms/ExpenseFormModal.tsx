import React, { useState } from "react";
import {
  CreateSubscriptionDTO,
  BillingFrequency,
} from "../../../../types/subscriptions";
import { useSubscriptions } from "../../../../hooks/useSubscriptions";
import styles from "../../Subscriptions.module.css";

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const INITIAL_STATE: CreateSubscriptionDTO = {
  serviceName: "",
  provider: "",
  amount: 0,
  billingFrequency: "monthly",
  startDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD para input date
  hasTrial: false,
  currency: "EUR",
};

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createExpense, loading, error: apiError } = useSubscriptions();
  const [formData, setFormData] =
    useState<CreateSubscriptionDTO>(INITIAL_STATE);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateSubscriptionDTO, string>>
  >({});

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!formData.serviceName) newErrors.serviceName = "Nombre requerido";
    if (!formData.provider) newErrors.provider = "Proveedor requerido";
    if (formData.amount < 0) newErrors.amount = "Importe inválido";

    if (formData.hasTrial) {
      if (!formData.trialDays || formData.trialDays <= 0)
        newErrors.trialDays = "Días requeridos";
      if (!formData.trialEndDate)
        newErrors.trialEndDate = "Fecha fin requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createExpense(formData);
      setFormData(INITIAL_STATE);
      onSuccess();
      onClose();
    } catch (err) {
      // Error manejado por el hook, pero podemos loguear o mostrar toast extra
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    let val: any = value;

    if (type === "number") {
      val = parseFloat(value);
    } else if (type === "checkbox") {
      val = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Nueva Suscripción (Gasto)</h2>
          <button onClick={onClose} className={styles.closeButton}>
            &times;
          </button>
        </div>

        {apiError && (
          <div className={styles.errorText} style={{ marginBottom: "1rem" }}>
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Fila 1 */}
          <div className={styles.row}>
            <div className={`${styles.col} ${styles.formGroup}`}>
              <label className={styles.label}>Servicio *</label>
              <input
                name="serviceName"
                value={formData.serviceName}
                onChange={handleChange}
                className={styles.input}
                placeholder="Ej. Netflix"
              />
              {errors.serviceName && (
                <span className={styles.errorText}>{errors.serviceName}</span>
              )}
            </div>
            <div className={`${styles.col} ${styles.formGroup}`}>
              <label className={styles.label}>Proveedor *</label>
              <input
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                className={styles.input}
                placeholder="Ej. Netflix Inc."
              />
              {errors.provider && (
                <span className={styles.errorText}>{errors.provider}</span>
              )}
            </div>
          </div>

          {/* Fila 2 */}
          <div className={styles.row}>
            <div className={`${styles.col} ${styles.formGroup}`}>
              <label className={styles.label}>Importe *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className={styles.input}
                min="0"
                step="0.01"
              />
              {errors.amount && (
                <span className={styles.errorText}>{errors.amount}</span>
              )}
            </div>
            <div className={`${styles.col} ${styles.formGroup}`}>
              <label className={styles.label}>Frecuencia</label>
              <select
                name="billingFrequency"
                value={formData.billingFrequency}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          </div>

          {/* Fecha Inicio */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Fecha de Inicio *</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          {/* Trial Logic */}
          <div
            className={styles.formGroup}
            style={{
              marginTop: "1.5rem",
              borderTop: "1px solid #eee",
              paddingTop: "1rem",
            }}
          >
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="hasTrial"
                name="hasTrial"
                checked={formData.hasTrial}
                onChange={handleChange}
              />
              <label
                htmlFor="hasTrial"
                className={styles.label}
                style={{ marginBottom: 0 }}
              >
                ¿Tiene período de prueba?
              </label>
            </div>
          </div>

          {formData.hasTrial && (
            <div className={styles.row}>
              <div className={`${styles.col} ${styles.formGroup}`}>
                <label className={styles.label}>Días de prueba *</label>
                <input
                  type="number"
                  name="trialDays"
                  value={formData.trialDays || ""}
                  onChange={handleChange}
                  className={styles.input}
                />
                {errors.trialDays && (
                  <span className={styles.errorText}>{errors.trialDays}</span>
                )}
              </div>
              <div className={`${styles.col} ${styles.formGroup}`}>
                <label className={styles.label}>Fin del trial *</label>
                <input
                  type="date"
                  name="trialEndDate"
                  value={formData.trialEndDate || ""}
                  onChange={handleChange}
                  className={styles.input}
                />
                {errors.trialEndDate && (
                  <span className={styles.errorText}>
                    {errors.trialEndDate}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.secondaryButton}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar Suscripción"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
