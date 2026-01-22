import React, { useEffect, useState } from "react";
import { useSubscriptions } from "../../../hooks/useSubscriptions";
import {
  CustomerSubscription,
  SubscriptionsSummary,
} from "../../../types/subscriptions";
import { MetricsPanel } from "./MetricsPanel";
import { RevenueFormModal } from "./forms/RevenueFormModal";
import styles from "../Subscriptions.module.css";

export const RevenueTab: React.FC = () => {
  const {
    fetchRevenue,
    fetchSummary,
    convertTrial,
    cancelRevenue,
    loading,
    error,
  } = useSubscriptions();

  const [revenueList, setRevenueList] = useState<CustomerSubscription[]>([]);
  const [summary, setSummary] = useState<SubscriptionsSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    // Carga paralela de lista y resumen
    const [listData, summaryData] = await Promise.all([
      fetchRevenue(),
      fetchSummary(),
    ]);
    setRevenueList(listData);
    setSummary(summaryData);
  };

  useEffect(() => {
    loadData();
  }, [fetchRevenue, fetchSummary]);

  const handleConvertTrial = async (id: string) => {
    if (confirm("¿Confirmar conversión de trial a activo?")) {
      await convertTrial(id);
      loadData();
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm("¿Seguro que deseas cancelar esta suscripción?")) {
      await cancelRevenue(id);
      loadData();
    }
  };

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(
      amount,
    );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return styles.badgeActive;
      case "trial":
        return styles.badgeTrial;
      case "past_due":
        return styles.badgeTrial; // Reutilizamos color warning
      case "cancelled":
        return styles.badgeCancelled;
      default:
        return styles.badgeCancelled;
    }
  };

  return (
    <div>
      <MetricsPanel type="revenue" revenueSummary={summary} />

      <div className={styles.header} style={{ marginBottom: "1rem" }}>
        <h3>Suscripciones de Clientes</h3>
        <button
          className={styles.primaryButton}
          onClick={() => setIsModalOpen(true)}
        >
          + Asignar Plan
        </button>
      </div>

      {loading && <p>Cargando datos...</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      {!loading && revenueList.length > 0 && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Plan</th>
                <th>Importe</th>
                <th>Periodo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {revenueList.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {sub.client_name || "Cliente Desconocido"}
                    </div>
                    <small style={{ color: "#9ca3af" }}>
                      {sub.client_id.slice(0, 8)}...
                    </small>
                  </td>
                  <td>
                    <div>{sub.plan_name}</div>
                    <small style={{ fontFamily: "monospace" }}>
                      {sub.plan_code}
                    </small>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {formatCurrency(sub.amount, sub.currency)}
                    <span style={{ fontSize: "0.7em", color: "#6b7280" }}>
                      {" "}
                      / {sub.billing_frequency}
                    </span>
                  </td>
                  <td>
                    {new Date(sub.current_period_end).toLocaleDateString()}
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${getStatusBadge(sub.status)}`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {sub.status === "trial" && !sub.trial_converted && (
                        <button
                          onClick={() => handleConvertTrial(sub.id)}
                          className={styles.secondaryButton}
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.5rem",
                          }}
                        >
                          Convertir
                        </button>
                      )}
                      {sub.status === "active" && (
                        <button
                          onClick={() => handleCancel(sub.id)}
                          className={styles.secondaryButton}
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.5rem",
                            color: "#ef4444",
                            borderColor: "#fee2e2",
                          }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RevenueFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
