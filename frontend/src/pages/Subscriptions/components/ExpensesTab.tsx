import React, { useEffect, useMemo, useState } from "react";
import { useSubscriptions } from "../../../hooks/useSubscriptions";
import { Subscription } from "../../../types/subscriptions";
import { ExpenseFormModal } from "./forms/ExpenseFormModal";
import styles from "../Subscriptions.module.css";

type ColumnId =
  | "id"
  | "service"
  | "provider"
  | "category"
  | "amount"
  | "frequency"
  | "nextBilling"
  | "status"
  | "actions";

const COLUMN_CONFIG_KEY = "table_config_expenses";
const PAGE_SIZE = 10;

const ALL_COLUMNS: { id: ColumnId; label: string; required?: boolean }[] = [
  { id: "id", label: "Número", required: true },
  { id: "service", label: "Servicio" },
  { id: "provider", label: "Proveedor" },
  { id: "category", label: "Categoría" },
  { id: "amount", label: "Importe" },
  { id: "frequency", label: "Frecuencia" },
  { id: "nextBilling", label: "Próximo Pago" },
  { id: "status", label: "Estado" },
  { id: "actions", label: "Acción", required: true },
];

export const ExpensesTab: React.FC = () => {
  const { fetchExpenses, loading, error } = useSubscriptions();
  const [expenses, setExpenses] = useState<Subscription[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [selected, setSelected] = useState<Subscription | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(() => {
    const stored = localStorage.getItem(COLUMN_CONFIG_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (_err) {
        return ["id", "service", "amount", "status", "actions"];
      }
    }
    return ["id", "service", "amount", "status", "actions"];
  });

  useEffect(() => {
    const required = ALL_COLUMNS.filter((c) => c.required).map((c) => c.id);
    setVisibleColumns((prev) => {
      const withRequired = Array.from(new Set([...required, ...prev]));
      localStorage.setItem(COLUMN_CONFIG_KEY, JSON.stringify(withRequired));
      return withRequired;
    });
  }, []);

  const loadData = async () => {
    const data = await fetchExpenses({
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
    });
    setExpenses(data);
  };

  useEffect(() => {
    loadData();
  }, [fetchExpenses, statusFilter, categoryFilter]);

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

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency,
    }).format(amount);

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString() : "-";

  const handleRowClick = (sub: Subscription) => {
    setSelected(sub);
    setIsDrawerOpen(true);
  };

  const toggleColumn = (id: ColumnId) => {
    if (ALL_COLUMNS.find((c) => c.id === id)?.required) return;
    setVisibleColumns((prev) => {
      const next = prev.includes(id)
        ? prev.filter((col) => col !== id)
        : [...prev, id];
      localStorage.setItem(COLUMN_CONFIG_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetColumns = () => {
    const defaults: ColumnId[] = ["id", "service", "amount", "status", "actions"];
    setVisibleColumns(defaults);
    localStorage.setItem(COLUMN_CONFIG_KEY, JSON.stringify(defaults));
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return expenses.filter((sub) => {
      const matchesSearch =
        !term ||
        sub.service_name.toLowerCase().includes(term) ||
        sub.provider.toLowerCase().includes(term) ||
        (sub.category || "").toLowerCase().includes(term);
      return matchesSearch;
    });
  }, [expenses, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={styles.contentArea}>
      <div className={styles.tableToolbar}>
        <button
          className={styles.btnConfigColumns}
          onClick={() => setIsConfigOpen(true)}
          title="Configurar columnas"
        >
          ⚙️ Configurar Columnas
        </button>
        <input
          className={styles.searchInput}
          placeholder="Buscar..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="Búsqueda en tabla"
        />
        <button
          className={styles.btnFilters}
          onClick={() => setShowFilters((prev) => !prev)}
          title="Abrir filtros"
        >
          🔍 Filtros
        </button>
        <button
          className={styles.primaryButton}
          onClick={() => setIsModalOpen(true)}
          title="Nuevo gasto"
        >
          + Nuevo Gasto
        </button>
      </div>

      {showFilters && (
        <div className={styles.filtersPanel}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Estado (todos)</option>
            <option value="active">Activo</option>
            <option value="trial">Trial</option>
            <option value="paused">Pausado</option>
            <option value="cancelled">Cancelado</option>
            <option value="expired">Expirado</option>
          </select>
          <input
            className={styles.searchInput}
            placeholder="Categoría..."
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {loading && <p>Cargando gastos...</p>}
      {error && <p className={styles.errorText}>Error: {error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
          No tienes suscripciones registradas. Añade la primera.
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className={styles.tableWrapper}>
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  {visibleColumns.includes("id") && <th>Número</th>}
                  {visibleColumns.includes("service") && <th>Servicio</th>}
                  {visibleColumns.includes("provider") && <th>Proveedor</th>}
                  {visibleColumns.includes("category") && <th>Categoría</th>}
                  {visibleColumns.includes("amount") && <th>Importe</th>}
                  {visibleColumns.includes("frequency") && <th>Frecuencia</th>}
                  {visibleColumns.includes("nextBilling") && (
                    <th>Próximo Pago</th>
                  )}
                  {visibleColumns.includes("status") && <th>Estado</th>}
                  {visibleColumns.includes("actions") && <th>Acción</th>}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((sub) => (
                  <tr
                    key={sub.id}
                    className={styles.rowClickable}
                    onClick={() => handleRowClick(sub)}
                  >
                    {visibleColumns.includes("id") && (
                      <td>{sub.id.slice(0, 8).toUpperCase()}</td>
                    )}
                    {visibleColumns.includes("service") && (
                      <td>{sub.service_name}</td>
                    )}
                    {visibleColumns.includes("provider") && (
                      <td>{sub.provider}</td>
                    )}
                    {visibleColumns.includes("category") && (
                      <td>{sub.category || "-"}</td>
                    )}
                    {visibleColumns.includes("amount") && (
                      <td>{formatCurrency(sub.amount, sub.currency)}</td>
                    )}
                    {visibleColumns.includes("frequency") && (
                      <td>{sub.billing_frequency}</td>
                    )}
                    {visibleColumns.includes("nextBilling") && (
                      <td>{formatDate(sub.next_billing_date)}</td>
                    )}
                    {visibleColumns.includes("status") && (
                      <td>
                        <span
                          className={`${styles.badge} ${getStatusBadgeClass(sub.status)}`}
                        >
                          {sub.status === "trial"
                            ? `trial (${sub.trial_days}d)`
                            : sub.status}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes("actions") && (
                      <td>
                        <button
                          className={styles.btnViewDetails}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(sub);
                          }}
                        >
                          Ver detalles →
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className={styles.pagination}>
              <button
                className={styles.btnPaginate}
                disabled={page === 1}
                onClick={() => setCurrentPage(page - 1)}
              >
                ← Anterior
              </button>
              <div className={styles.pageNumbers}>
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${
                      p === page ? styles.pageBtnActive : ""
                    }`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                className={styles.btnPaginate}
                disabled={page === totalPages}
                onClick={() => setCurrentPage(page + 1)}
              >
                Siguiente →
              </button>
              <span className={styles.paginationInfo}>
                Mostrando {pageItems.length} de {filtered.length} (página {page}{" "}
                de {totalPages})
              </span>
            </div>
          )}
        </div>
      )}

      {isConfigOpen && (
        <div className={styles.columnModalOverlay}>
          <div className={styles.columnModalContent}>
            <div className={styles.columnModalHeader}>
              <div>
                <h2 className={styles.columnModalTitle}>Configurar Columnas</h2>
                <p className={styles.columnModalDescription}>
                  Selecciona qué columnas mostrar en la tabla
                </p>
              </div>
              <button
                className={styles.btnModalClose}
                onClick={() => setIsConfigOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className={styles.columnModalBody}>
              <div className={styles.columnOptions}>
                {ALL_COLUMNS.map((col) => (
                  <label key={col.id} className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col.id)}
                      disabled={col.required}
                      onChange={() => toggleColumn(col.id)}
                    />
                    <span className={styles.checkboxLabel}>
                      {col.label}
                      {col.required ? " (Obligatoria)" : ""}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.columnModalFooter}>
              <button className={styles.secondaryButton} onClick={resetColumns}>
                Restablecer
              </button>
              <button
                className={styles.primaryButton}
                onClick={() => setIsConfigOpen(false)}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {isDrawerOpen && selected && (
        <div
          className={`${styles.drawerOverlay} ${styles.drawerOverlayOpen}`}
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className={`${styles.drawer} ${styles.drawerOpen}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.drawerHeader}>
              <h2 className={styles.drawerTitle}>Detalles del gasto</h2>
              <button
                className={styles.btnCloseDrawer}
                onClick={() => setIsDrawerOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.drawerBody}>
              {[
                ["ID", selected.id],
                ["Servicio", selected.service_name],
                ["Proveedor", selected.provider],
                ["Categoría", selected.category || "-"],
                ["Importe", formatCurrency(selected.amount, selected.currency)],
                ["Frecuencia", selected.billing_frequency],
                ["Estado", selected.status],
                ["Inicio", formatDate(selected.start_date)],
                ["Próximo pago", formatDate(selected.next_billing_date)],
                ["Trial", selected.has_trial ? "Sí" : "No"],
                ["Días trial", selected.trial_days || "-"],
                ["Inicio trial", formatDate(selected.trial_start_date)],
                ["Fin trial", formatDate(selected.trial_end_date)],
                ["URL cancelación", selected.cancellation_url || "-"],
                ["URL acceso", selected.login_url || "-"],
                ["Notas", selected.notes || "-"],
              ].map(([label, value]) => (
                <div key={label} className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>{label}</label>
                  <span className={styles.fieldValue}>{String(value)}</span>
                </div>
              ))}
            </div>
            <div className={styles.drawerFooter}>
              <button
                className={styles.secondaryButton}
                onClick={() => setIsDrawerOpen(false)}
              >
                Cerrar
              </button>
              <button className={styles.primaryButton}>Editar Registro</button>
            </div>
          </div>
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
