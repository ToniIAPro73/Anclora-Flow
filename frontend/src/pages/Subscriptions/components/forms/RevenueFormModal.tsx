import React, { useState } from "react";
import { CreateCustomerSubscriptionDTO } from "../../../../types/subscriptions";
import { useSubscriptions } from "../../../../hooks/useSubscriptions";
import styles from "../../Subscriptions.module.css";

interface RevenueFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const INITIAL_STATE: CreateCustomerSubscriptionDTO = {
  clientId: "", // TODO: Integrar selector de clientes real
  planName: "",
  planCode: "",
  amount: 0,
  billingFrequency: "monthly",
  startDate: new Date().toISOString().split("T")[0],
  currentPeriodStart: new Date().toISOString().split("T")[0],
  currentPeriodEnd: "", // Se calculará o pedirá
  autoInvoice: true,
  hasTrial: false,
};

export const RevenueFormModal: React.FC<RevenueFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createRevenue, loading, error: apiError } = useSubscriptions();
  const [formData, setFormData] =
    useState<CreateCustomerSubscriptionDTO>(INITIAL_STATE);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateCustomerSubscriptionDTO, string>>
  >({});

  if (!isOpen) return null;

  const validate = (data: CreateCustomerSubscriptionDTO) => {
    const newErrors: typeof errors = {};
    if (!data.clientId) newErrors.clientId = "Cliente requerido (UUID)";
    if (!data.planName) newErrors.planName = "Nombre del plan requerido";
    if (!data.planCode) newErrors.planCode = "Código requerido";
    if (data.amount < 0) newErrors.amount = "Importe inválido";
    if (!data.currentPeriodEnd)
      newErrors.currentPeriodEnd = "Fin del periodo requerido";

    if (data.hasTrial) {
      if (!data.trialDays) newErrors.trialDays = "Días requeridos";
      if (!data.trialEndDate)
        newErrors.trialEndDate = "Fin trial requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized: CreateCustomerSubscriptionDTO = {
      ...formData,
      trialStartDate: formData.trialStartDate || formData.startDate,
    };
    if (!validate(normalized)) return;

    try {
      // Formateo de fechas a ISO
      const payload = {
        ...normalized,
        startDate: new Date(normalized.startDate).toISOString(),
        currentPeriodStart: new Date(
          normalized.currentPeriodStart,
        ).toISOString(),
        currentPeriodEnd: new Date(normalized.currentPeriodEnd).toISOString(),
        trialStartDate: normalized.trialStartDate
          ? new Date(normalized.trialStartDate).toISOString()
          : undefined,
        trialEndDate: normalized.trialEndDate
          ? new Date(normalized.trialEndDate).toISOString()
          : undefined,
      };

      await createRevenue(payload);
      setFormData(INITIAL_STATE);
      onSuccess();
      onClose();
    } catch (err) {
      // Error manejado por UI
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    let val: any = value;

    if (type === "number") val = parseFloat(value);
    else if (type === "checkbox") val = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Nuevo Ingreso Recurrente</h2>
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
          {/* Cliente & Plan */}
          <div className={styles.row}>
            <div className={`${styles.col} ${styles.formGroup}`}>
              <label className={styles.label}>Cliente (ID) *</label>
              <input
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                className={styles.input}
                placeholder="UUID del cliente"
              />
              {errors.clientId && (
                <span className={styles.errorText}>{errors.clientId}</span>
              )}
            </div>
          </div>

          <div className={styles.row}>
            <div className={`${styles.col} ${styles.formGroup}`}>
              <label className={styles.label}>Nombre Plan *</label>
              <input
                name="planName"
                value={formData.planName}
                onChange={handleChange}
                className={styles.input}
              />
              {errors.planName && (
                <span className={styles.errorText}>{errors.planName}</span>
              )}
            </div>
            <div className={`${styles.col} ${styles.formGroup}`}>
              <label className={styles.label}>Código *</label>
              <input
                name="planCode"
                value={formData.planCode}
                onChange={handleChange}
                className={styles.input}
              />
              {errors.planCode && (
                <span className={styles.errorText}>{errors.planCode}</span>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className={styles.row}>
            <div className={`${styles.col} ${styles.formGroup}`}>
              <label className={styles.label}>Importe *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className={styles.input}
              />
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

          {/* Periodos */}
          <div className={styles.row}>
            <div className={`${styles.col} ${styles.formGroup}`}>
              <label className={styles.label}>Inicio Periodo</label>
              <input
                type="date"
                name="currentPeriodStart"
                value={formData.currentPeriodStart}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            <div className={`${styles.col} ${styles.formGroup}`}>
              <label className={styles.label}>Fin Periodo</label>
              <input
                type="date"
                name="currentPeriodEnd"
                value={formData.currentPeriodEnd}
                onChange={handleChange}
                className={styles.input}
              />
              {errors.currentPeriodEnd && (
                <span className={styles.errorText}>
                  {errors.currentPeriodEnd}
                </span>
              )}
            </div>
          </div>

          {/* Trial Logic Simplificada */}
          <div
            className={styles.formGroup}
            style={{
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid #eee",
            }}
          >
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="hasTrialRev"
                name="hasTrial"
                checked={formData.hasTrial}
                onChange={handleChange}
              />
              <label
                htmlFor="hasTrialRev"
                className={styles.label}
                style={{ marginBottom: 0 }}
              >
                Incluir Trial
              </label>
            </div>
          </div>

          {formData.hasTrial && (
            <div className={styles.row}>
              <div className={`${styles.col} ${styles.formGroup}`}>
                <label className={styles.label}>Días</label>
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
                <label className={styles.label}>Fin Trial</label>
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
              {/* Necesario para validacion Zod: trialStartDate */}
              <input
                type="hidden"
                name="trialStartDate"
                value={formData.trialStartDate || formData.startDate}
              />
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
              {loading ? "Guardando..." : "Crear Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
