import React, { useEffect, useState } from "react";
import { useSubscriptions } from "../../../hooks/useSubscriptions";
import { Subscription } from "../../../types/subscriptions";
import { ExpenseFormModal } from "./forms/ExpenseFormModal";
import styles from "../Subscriptions.module.css";

export const ExpensesTab: React.FC = () => {
  const { fetchExpenses, loading, error } = useSubscriptions();
  const [expenses, setExpenses] = useState<Subscription[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    const data = await fetchExpenses();
    setExpenses(data);
  };

  useEffect(() => {
    loadData();
  }, [fetchExpenses]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return styles.badgeActive;
      case "trial":
        return styles.badgeTrial;
      case "cancelled":
        return styles.badgeCancelled;
      default:
        return styles.badgeCancelled;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency,
    }).format(amount);
  };

  return (
    <div>
      <div className={styles.header} style={{ marginBottom: "1rem" }}>
        <h3>Mis Gastos Recurrentes</h3>
        <button
          className={styles.primaryButton}
          onClick={() => setIsModalOpen(true)}
        >
          + Nuevo Gasto
        </button>
      </div>

      {loading && <p style={{ color: "#6b7280" }}>Cargando gastos...</p>}
      {error && <p className={styles.errorText}>Error: {error}</p>}

      {!loading && !error && expenses.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
          No tienes suscripciones registradas. Añade la primera.
        </div>
      )}

      {!loading && expenses.length > 0 && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Proveedor</th>
                <th>Importe</th>
                <th>Frecuencia</th>
                <th>Próximo Pago</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{sub.service_name}</div>
                    {sub.category && (
                      <small style={{ color: "#9ca3af" }}>{sub.category}</small>
                    )}
                  </td>
                  <td>{sub.provider}</td>
                  <td style={{ fontWeight: 600 }}>
                    {formatCurrency(sub.amount, sub.currency)}
                  </td>
                  <td style={{ textTransform: "capitalize" }}>
                    {sub.billing_frequency}
                  </td>
                  <td>
                    {sub.next_billing_date
                      ? new Date(sub.next_billing_date).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${getStatusBadgeClass(sub.status)}`}
                    >
                      {sub.status === "trial"
                        ? `Trial (${sub.trial_days}d)`
                        : sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ExpenseFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
