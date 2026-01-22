import React from "react";
import {
  SubscriptionsSummary,
  Subscription,
} from "../../../types/subscriptions";
import styles from "../Subscriptions.module.css";

interface MetricsPanelProps {
  type: "expense" | "revenue";
  revenueSummary?: SubscriptionsSummary | null;
  expenseList?: Subscription[];
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  type,
  revenueSummary,
  expenseList,
}) => {
  // Helpers de formato
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(val);

  // Lógica de visualización según tipo
  if (type === "revenue") {
    if (!revenueSummary)
      return (
        <div className={styles.metricsContainer}>Cargando métricas...</div>
      );

    return (
      <div
        className={styles.metricsContainer}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>MRR (Mensual)</div>
          <div className={styles.metricValue} style={{ color: "#10b981" }}>
            {/* Calculamos MRR total sumando el breakdown */}
            {formatCurrency(
              revenueSummary.mrrBreakdown.reduce(
                (acc, curr) => acc + Number(curr.mrr),
                0,
              ),
            )}
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>ARR (Anual)</div>
          <div className={styles.metricValue}>
            {formatCurrency(revenueSummary.totalArr)}
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Suscripciones Activas</div>
          <div className={styles.metricValue}>
            {revenueSummary.activeSubscriptions}
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Trials Expirando</div>
          <div
            className={styles.metricValue}
            style={{
              color:
                revenueSummary.expiringTrialsCount > 0 ? "#f59e0b" : "inherit",
            }}
          >
            {revenueSummary.expiringTrialsCount}
          </div>
        </div>
      </div>
    );
  }

  // Lógica para Expenses (Cálculo cliente-side por ahora)
  if (type === "expense" && expenseList) {
    const totalExpenses = expenseList.length;
    const monthlyCost = expenseList.reduce((acc, sub) => {
      // Normalización simple para visualización
      if (sub.status !== "active" && sub.status !== "trial") return acc;
      let amount = Number(sub.amount);
      if (sub.billing_frequency === "yearly") amount /= 12;
      if (sub.billing_frequency === "quarterly") amount /= 3;
      return acc + amount;
    }, 0);

    const activeTrials = expenseList.filter((s) => s.status === "trial").length;

    return (
      <div
        className={styles.metricsContainer}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Coste Mensual Est.</div>
          <div className={styles.metricValue} style={{ color: "#ef4444" }}>
            {formatCurrency(monthlyCost)}
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Suscripciones Activas</div>
          <div className={styles.metricValue}>{totalExpenses}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Trials Activos</div>
          <div
            className={styles.metricValue}
            style={{ color: activeTrials > 0 ? "#f59e0b" : "inherit" }}
          >
            {activeTrials}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
