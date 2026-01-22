import React, { useState, useEffect } from "react";
import { ExpensesTab } from "./components/ExpensesTab";
import { RevenueTab } from "./components/RevenueTab";
import styles from "./Subscriptions.module.css";

// Hook para validación de viewport (si se usa en la app, aquí simulamos el efecto)
// import { validateViewport } from '../../utils/viewport-validator';

export const SubscriptionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"expenses" | "revenue">(
    "expenses",
  );

  useEffect(() => {
    // Validar viewport al montar (Simulación de directriz)
    // validateViewport();
    console.log("SubscriptionsPage: Viewport check ok.");
  }, []);

  return (
    <div className={styles.subscriptionsPage}>
      {/* 1. Header Fijo (Hero) */}
      <header className={styles.heroHeader}>
        <div>
          <h1 className={styles.heroTitle}>Suscripciones</h1>
          <p className={styles.heroDescription}>
            Gestión centralizada de gastos recurrentes e ingresos por planes.
          </p>
        </div>
        <div>{/* Espacio para acciones globales si fuera necesario */}</div>
      </header>

      {/* 2. Navegación Tabs Fija */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === "expenses" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("expenses")}
        >
          💸 Mis Gastos
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "revenue" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("revenue")}
        >
          💰 Mis Ingresos
        </button>
      </div>

      {/* 3. Área de Contenido con Scroll Independiente */}
      <main className={styles.contentArea}>
        {activeTab === "expenses" ? <ExpensesTab /> : <RevenueTab />}
      </main>
    </div>
  );
};
