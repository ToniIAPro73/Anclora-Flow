const state = {
  activeTab: "clients",
  clients: [],
  projects: [],
  clientSummary: {
    total_clients: 0,
    active_clients: 0,
  },
  projectSummary: {
    total_projects: 0,
    active_projects: 0,
  },
  clientFilters: {
    search: "",
    status: "all",
  },
  projectFilters: {
    search: "",
    status: "all",
  },
  loading: false,
  error: null,
};

const money = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function formatCurrency(value) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) return money.format(0);
  return money.format(parsed);
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function showToast(message, type = "info") {
  const wrapper = document.createElement("div");
  wrapper.className = `notification notification--${type}`;
  wrapper.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button type="button" class="notification__close" aria-label="Cerrar">×</button>
  `;
  wrapper
    .querySelector(".notification__close")
    .addEventListener("click", () => wrapper.remove());
  document.body.appendChild(wrapper);
  window.setTimeout(() => wrapper.remove(), 3500);
}

function setLoading(isLoading) {
  state.loading = isLoading;
  const spinner = document.querySelector("[data-clients-loading]");
  if (spinner) spinner.hidden = !isLoading;
}

function setError(message) {
  state.error = message;
  const errorBox = document.querySelector("[data-clients-error]");
  if (!errorBox) return;
  if (!message) {
    errorBox.hidden = true;
    errorBox.innerHTML = "";
    return;
  }
  errorBox.hidden = false;
  errorBox.innerHTML = `
    <div class="module-error__content">
      <span class="module-error__icon">⚠️</span>
      <div>
        <p class="module-error__title">No se pudieron cargar los datos</p>
        <p class="module-error__message">${escapeHtml(message)}</p>
      </div>
      <button type="button" class="btn btn-secondary" data-clients-retry>Reintentar</button>
    </div>
  `;
  errorBox
    .querySelector("[data-clients-retry]")
    ?.addEventListener("click", () => {
      void refreshClientsModule();
    });
}

function applyActiveTab(tab) {
  state.activeTab = tab;
  document
    .querySelectorAll("[data-clients-tab]")
    .forEach((button) => button.classList.toggle("active", button.dataset.clientsTab === tab));
  document
    .querySelectorAll("[data-clients-panel]")
    .forEach((panel) => {
      panel.hidden = panel.dataset.clientsPanel !== tab;
    });
}

function buildClientFilters() {
  const filters = {};
  if (state.clientFilters.search.trim()) {
    filters.search = state.clientFilters.search.trim();
  }
  if (state.clientFilters.status !== "all") {
    filters.isActive = state.clientFilters.status === "active";
  }
  return filters;
}

function buildProjectFilters() {
  const filters = {};
  if (state.projectFilters.search.trim()) {
    filters.search = state.projectFilters.search.trim();
  }
  if (state.projectFilters.status !== "all") {
    filters.status = state.projectFilters.status;
  }
  return filters;
}

async function loadClients() {
  const filters = buildClientFilters();
  const response = await window.api.getClients(filters);
  const { clients = [] } = response || {};
  state.clients = clients.map((client) => ({
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    nifCif: client.nif_cif,
    city: client.city,
    isActive: client.is_active,
    totalInvoiced: client.total_invoiced ?? 0,
    totalPending: client.total_pending ?? 0,
    projectsCount: client.projects_count ?? 0,
    createdAt: client.created_at,
  }));
}

async function loadProjects() {
  const filters = buildProjectFilters();
  const response = await window.api.getProjects(filters);
  const { projects = [] } = response || {};
  state.projects = projects.map((project) => ({
    id: project.id,
    name: project.name,
    clientName: project.client_name,
    status: project.status,
    budget: project.budget,
    totalInvoiced: project.total_invoiced,
    invoiceCount: project.invoice_count,
    startDate: project.start_date,
    endDate: project.end_date,
  }));
}

async function loadSummaries() {
  const [clientSummary, projectSummary] = await Promise.all([
    window.api.getClientSummary(),
    window.api.getProjectSummary(),
  ]);
  if (clientSummary) state.clientSummary = clientSummary;
  if (projectSummary) state.projectSummary = projectSummary;
}

function renderSummaryCards() {
  const clientTotal = document.getElementById("clients-summary-total");
  const clientActive = document.getElementById("clients-summary-active");
  const clientPending = document.getElementById("clients-summary-pending");
  const clientRevenue = document.getElementById("clients-summary-revenue");
  const projectTotal = document.getElementById("projects-summary-total");
  const projectActive = document.getElementById("projects-summary-active");
  const projectBudget = document.getElementById("projects-summary-budget");
  const projectRevenue = document.getElementById("projects-summary-revenue");

  if (clientTotal)
    clientTotal.textContent = state.clientSummary.total_clients ?? 0;
  if (clientActive)
    clientActive.textContent = state.clientSummary.active_clients ?? 0;
  if (clientPending)
    clientPending.textContent = formatCurrency(
      state.clientSummary.total_pending ?? 0
    );
  if (clientRevenue)
    clientRevenue.textContent = formatCurrency(
      state.clientSummary.total_billed ?? 0
    );

  if (projectTotal)
    projectTotal.textContent = state.projectSummary.total_projects ?? 0;
  if (projectActive)
    projectActive.textContent = state.projectSummary.active_projects ?? 0;
  if (projectBudget)
    projectBudget.textContent = formatCurrency(
      state.projectSummary.total_budget ?? 0
    );
  if (projectRevenue)
    projectRevenue.textContent = formatCurrency(
      state.projectSummary.total_invoiced ?? 0
    );
}

function renderClientsTable() {
  const tbody = document.querySelector("[data-clients-table]");
  if (!tbody) return;
  if (!state.clients.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <span class="empty-state__icon">🧾</span>
            <p>No hay clientes registrados todavía.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  tbody.innerHTML = state.clients
    .map(
      (client) => `
        <tr>
          <td>
            <div class="table-cell--main">
              <strong>${escapeHtml(client.name)}</strong>
              <span>${escapeHtml(client.email || "Sin email")}</span>
            </div>
          </td>
          <td>
            <span>${escapeHtml(client.phone || "—")}</span>
            <span class="meta">${escapeHtml(client.nifCif || "Sin NIF/CIF")}</span>
          </td>
          <td>
            <strong>${formatCurrency(client.totalInvoiced)}</strong>
            <span class="meta pending">${formatCurrency(client.totalPending)} pendientes</span>
          </td>
          <td>
            <span>${client.projectsCount}</span>
            <span class="meta">Proyectos</span>
          </td>
          <td>
            <span class="badge badge--${client.isActive ? "success" : "neutral"}">
              ${client.isActive ? "Activo" : "Inactivo"}
            </span>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-icon" data-client-edit="${client.id}" aria-label="Editar">✏️</button>
              <button type="button" class="btn-icon btn-icon--danger" data-client-delete="${client.id}" aria-label="Eliminar">🗑️</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderProjectsTable() {
  const tbody = document.querySelector("[data-projects-table]");
  if (!tbody) return;
  if (!state.projects.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <span class="empty-state__icon">📂</span>
            <p>No hay proyectos registrados todavía.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  tbody.innerHTML = state.projects
    .map(
      (project) => `
        <tr>
          <td>
            <div class="table-cell--main">
              <strong>${escapeHtml(project.name)}</strong>
              <span>${escapeHtml(project.clientName || "Sin cliente")}</span>
            </div>
          </td>
          <td>
            <span class="badge badge--${project.status === "completed" ? "success" : project.status === "cancelled" ? "danger" : project.status === "on-hold" ? "warning" : "info"}">
              ${
                project.status === "completed"
                  ? "Completado"
                  : project.status === "cancelled"
                  ? "Cancelado"
                  : project.status === "on-hold"
                  ? "En pausa"
                  : "Activo"
              }
            </span>
          </td>
          <td>
            <strong>${formatCurrency(project.totalInvoiced ?? 0)}</strong>
            <span class="meta">${formatCurrency(project.budget ?? 0)} presupuesto</span>
          </td>
          <td>
            <span>${project.invoiceCount ?? 0}</span>
            <span class="meta">Facturas</span>
          </td>
          <td>
            <span>${formatDate(project.startDate)}</span>
            <span class="meta">${formatDate(project.endDate)}</span>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-icon" data-project-edit="${project.id}" aria-label="Editar">✏️</button>
              <button type="button" class="btn-icon btn-icon--danger" data-project-delete="${project.id}" aria-label="Eliminar">🗑️</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

async function refreshClientsModule() {
  if (typeof window.api === "undefined") {
    setError("Servicio API no disponible. Verifica la carga de api.js");
    return;
  }

  if (!window.api.isAuthenticated()) {
    setError("Inicia sesión para gestionar tus clientes y proyectos.");
    return;
  }

  try {
    setLoading(true);
    setError(null);
    await Promise.all([loadClients(), loadProjects(), loadSummaries()]);
    renderSummaryCards();
    renderClientsTable();
    renderProjectsTable();
  } catch (error) {
    console.error("Error loading clients module", error);
    setError("Ocurrió un problema al cargar la información.");
  } finally {
    setLoading(false);
  }
}

function openModal(id) {
  document
    .querySelectorAll("[data-modal]")
    .forEach((modal) => modal.classList.toggle("is-open", modal.dataset.modal === id));
}

function closeModal(id) {
  const modal = document.querySelector(`[data-modal="${id}"]`);
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.querySelector("form")?.reset();
  modal.querySelector("form")?.removeAttribute("data-editing");
}

function fillClientForm(client) {
  const form = document.querySelector("[data-client-form]");
  if (!form) return;
  form.dataset.editing = client.id;
  form.querySelector("[name='name']").value = client.name || "";
  form.querySelector("[name='email']").value = client.email || "";
  form.querySelector("[name='phone']").value = client.phone || "";
  form.querySelector("[name='nifCif']").value = client.nifCif || "";
  form.querySelector("[name='city']").value = client.city || "";
  form.querySelector("[name='isActive']").checked = !!client.isActive;
}

function fillProjectForm(project) {
  const form = document.querySelector("[data-project-form]");
  if (!form) return;
  form.dataset.editing = project.id;
  form.querySelector("[name='name']").value = project.name || "";
  form.querySelector("[name='status']").value = project.status || "active";
  form.querySelector("[name='budget']").value =
    project.budget != null ? project.budget : "";
  form.querySelector("[name='startDate']").value =
    project.startDate ? project.startDate.split("T")[0] : "";
  form.querySelector("[name='endDate']").value =
    project.endDate ? project.endDate.split("T")[0] : "";
}

async function handleClientSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const payload = {
    name: data.get("name")?.toString().trim(),
    email: data.get("email")?.toString().trim() || undefined,
    phone: data.get("phone")?.toString().trim() || undefined,
    nifCif: data.get("nifCif")?.toString().trim() || undefined,
    city: data.get("city")?.toString().trim() || undefined,
    isActive: data.get("isActive") === "on",
  };

  try {
    if (form.dataset.editing) {
      await window.api.updateClient(form.dataset.editing, payload);
      showToast("Cliente actualizado correctamente", "success");
    } else {
      await window.api.createClient(payload);
      showToast("Cliente creado correctamente", "success");
    }
    closeModal("client");
    await refreshClientsModule();
  } catch (error) {
    console.error("Client submit failed", error);
    showToast("No se pudo guardar el cliente", "error");
  }
}

async function handleProjectSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const payload = {
    name: data.get("name")?.toString().trim(),
    status: data.get("status"),
    budget: data.get("budget") ? Number.parseFloat(data.get("budget")) : undefined,
    startDate: data.get("startDate") || undefined,
    endDate: data.get("endDate") || undefined,
  };

  try {
    if (form.dataset.editing) {
      await window.api.updateProject(form.dataset.editing, payload);
      showToast("Proyecto actualizado correctamente", "success");
    } else {
      await window.api.createProject(payload);
      showToast("Proyecto creado correctamente", "success");
    }
    closeModal("project");
    await refreshClientsModule();
  } catch (error) {
    console.error("Project submit failed", error);
    showToast("No se pudo guardar el proyecto", "error");
  }
}

async function handleClientDelete(id) {
  if (!window.confirm("¿Seguro que deseas eliminar este cliente?")) return;
  try {
    await window.api.deleteClient(id);
    showToast("Cliente eliminado", "success");
    await refreshClientsModule();
  } catch (error) {
    console.error("Client delete failed", error);
    showToast("No se pudo eliminar el cliente", "error");
  }
}

async function handleProjectDelete(id) {
  if (!window.confirm("¿Seguro que deseas eliminar este proyecto?")) return;
  try {
    await window.api.deleteProject(id);
    showToast("Proyecto eliminado", "success");
    await refreshClientsModule();
  } catch (error) {
    console.error("Project delete failed", error);
    showToast("No se pudo eliminar el proyecto", "error");
  }
}

function registerEventListeners() {
  document
    .querySelectorAll("[data-clients-tab]")
    .forEach((button) =>
      button.addEventListener("click", () => applyActiveTab(button.dataset.clientsTab))
    );

  document
    .querySelector("[data-clients-search]")
    ?.addEventListener("input", (event) => {
      state.clientFilters.search = event.target.value;
      window.clearTimeout(state.clientSearchDebounce);
      state.clientSearchDebounce = window.setTimeout(() => {
        void refreshClientsModule();
      }, 300);
    });

  document
    .querySelector("[data-clients-status]")
    ?.addEventListener("change", (event) => {
      state.clientFilters.status = event.target.value;
      void refreshClientsModule();
    });

  document
    .querySelector("[data-projects-search]")
    ?.addEventListener("input", (event) => {
      state.projectFilters.search = event.target.value;
      window.clearTimeout(state.projectSearchDebounce);
      state.projectSearchDebounce = window.setTimeout(() => {
        void refreshClientsModule();
      }, 300);
    });

  document
    .querySelector("[data-projects-status]")
    ?.addEventListener("change", (event) => {
      state.projectFilters.status = event.target.value;
      void refreshClientsModule();
    });

  document
    .querySelector("[data-open-modal='client']")
    ?.addEventListener("click", () => {
      document.querySelector("[data-client-form]")?.reset();
      document.querySelector("[data-client-form]")?.removeAttribute("data-editing");
      openModal("client");
    });

  document
    .querySelector("[data-open-modal='project']")
    ?.addEventListener("click", () => {
      document.querySelector("[data-project-form]")?.reset();
      document.querySelector("[data-project-form]")?.removeAttribute("data-editing");
      openModal("project");
    });

  document.querySelector("[data-client-form]")?.addEventListener("submit", handleClientSubmit);
  document.querySelector("[data-project-form]")?.addEventListener("submit", handleProjectSubmit);

  document
    .querySelectorAll("[data-close-modal]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        const modal = button.closest("[data-modal]");
        if (modal) closeModal(modal.dataset.modal);
      })
    );

  document.addEventListener("click", (event) => {
    const editClient = event.target.closest("[data-client-edit]");
    const deleteClient = event.target.closest("[data-client-delete]");
    const editProject = event.target.closest("[data-project-edit]");
    const deleteProject = event.target.closest("[data-project-delete]");

    if (editClient) {
      const id = editClient.dataset.clientEdit;
      const client = state.clients.find((item) => item.id === id);
      if (client) {
        fillClientForm(client);
        openModal("client");
      }
    }

    if (deleteClient) {
      const id = deleteClient.dataset.clientDelete;
      void handleClientDelete(id);
    }

    if (editProject) {
      const id = editProject.dataset.projectEdit;
      const project = state.projects.find((item) => item.id === id);
      if (project) {
        fillProjectForm(project);
        openModal("project");
      }
    }

    if (deleteProject) {
      const id = deleteProject.dataset.projectDelete;
      void handleProjectDelete(id);
    }
  });
}

export function initClients() {
  registerEventListeners();
  applyActiveTab(state.activeTab);
  window.requestAnimationFrame(() => {
    void refreshClientsModule();
  });
}

export default function renderClients() {
  return `
    <section class="module clients-module">
      <header class="module-header">
        <div class="module-title-section">
          <h1>Clientes &amp; Proyectos</h1>
          <p>Gestiona tu cartera comercial con métricas y acciones rápidas.</p>
        </div>
        <div class="module-actions">
          <button type="button" class="btn btn-secondary" data-open-modal="project">＋ Nuevo proyecto</button>
          <button type="button" class="btn btn-primary" data-open-modal="client">＋ Nuevo cliente</button>
        </div>
      </header>

      <div class="summary-cards">
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-primary-light);">👥</div>
          <div class="card-content">
            <span class="card-label">Clientes totales</span>
            <span class="card-value" id="clients-summary-total">0</span>
            <span class="card-trend">Registrados</span>
          </div>
        </article>
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-success-light);">✅</div>
          <div class="card-content">
            <span class="card-label">Clientes activos</span>
            <span class="card-value" id="clients-summary-active">0</span>
            <span class="card-trend">Con relación abierta</span>
          </div>
        </article>
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-warning-light);">💳</div>
          <div class="card-content">
            <span class="card-label">Pendiente de cobro</span>
            <span class="card-value" id="clients-summary-pending">€0</span>
            <span class="card-trend">Facturas abiertas</span>
          </div>
        </article>
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-info-light);">📈</div>
          <div class="card-content">
            <span class="card-label">Facturación total</span>
            <span class="card-value" id="clients-summary-revenue">€0</span>
            <span class="card-trend">Desde inicio</span>
          </div>
        </article>
      </div>

      <div class="summary-cards secondary">
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-secondary-light);">📂</div>
          <div class="card-content">
            <span class="card-label">Proyectos totales</span>
            <span class="card-value" id="projects-summary-total">0</span>
            <span class="card-trend">Histórico</span>
          </div>
        </article>
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-secondary-muted);">🚀</div>
          <div class="card-content">
            <span class="card-label">Proyectos activos</span>
            <span class="card-value" id="projects-summary-active">0</span>
            <span class="card-trend">En ejecución</span>
          </div>
        </article>
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-tertiary-light);">💰</div>
          <div class="card-content">
            <span class="card-label">Presupuesto asignado</span>
            <span class="card-value" id="projects-summary-budget">€0</span>
            <span class="card-trend">Total</span>
          </div>
        </article>
        <article class="card stat-card">
          <div class="card-icon" style="background: var(--color-tertiary-muted);">📊</div>
          <div class="card-content">
            <span class="card-label">Facturación proyectos</span>
            <span class="card-value" id="projects-summary-revenue">€0</span>
            <span class="card-trend">Emitida</span>
          </div>
        </article>
      </div>

      <div class="module-tabs">
        <button type="button" class="tab-button active" data-clients-tab="clients">Clientes</button>
        <button type="button" class="tab-button" data-clients-tab="projects">Proyectos</button>
      </div>

      <div class="module-body">
        <div class="module-main">
          <div class="module-toolbar" data-clients-panel="clients">
            <label class="input input--search">
              <span class="input__icon">🔍</span>
              <input type="search" placeholder="Buscar clientes..." data-clients-search />
            </label>
            <label class="input input--select">
              <span>Estado</span>
              <select data-clients-status>
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </label>
          </div>

          <div class="module-toolbar" data-clients-panel="projects" hidden>
            <label class="input input--search">
              <span class="input__icon">🔍</span>
              <input type="search" placeholder="Buscar proyectos..." data-projects-search />
            </label>
            <label class="input input--select">
              <span>Estado</span>
              <select data-projects-status>
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="on-hold">En pausa</option>
                <option value="completed">Completados</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </label>
          </div>

          <div class="table-wrapper" data-clients-panel="clients">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Facturación</th>
                  <th>Proyectos</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody data-clients-table></tbody>
            </table>
          </div>

          <div class="table-wrapper" data-clients-panel="projects" hidden>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Estado</th>
                  <th>Facturación</th>
                  <th>Facturas</th>
                  <th>Fechas</th>
                  <th></th>
                </tr>
              </thead>
              <tbody data-projects-table></tbody>
            </table>
          </div>

          <div class="module-loading" data-clients-loading hidden>
            <span class="spinner"></span>
            <p>Cargando datos...</p>
          </div>
          <div class="module-error" data-clients-error hidden></div>
        </div>
      </div>
    </section>

    <div class="modal" data-modal="client" aria-hidden="true">
      <div class="modal__overlay" data-close-modal></div>
      <div class="modal__content">
        <header class="modal__header">
          <h2>Cliente</h2>
          <button type="button" class="btn-icon" data-close-modal aria-label="Cerrar">×</button>
        </header>
        <form class="modal__body form-grid" data-client-form>
          <label>
            <span>Nombre *</span>
            <input type="text" name="name" required />
          </label>
          <label>
            <span>Email</span>
            <input type="email" name="email" />
          </label>
          <label>
            <span>Teléfono</span>
            <input type="tel" name="phone" />
          </label>
          <label>
            <span>NIF / CIF</span>
            <input type="text" name="nifCif" />
          </label>
          <label>
            <span>Ciudad</span>
            <input type="text" name="city" />
          </label>
          <label class="checkbox">
            <input type="checkbox" name="isActive" checked />
            <span>Cliente activo</span>
          </label>
          <footer class="modal__footer">
            <button type="button" class="btn btn-secondary" data-close-modal>Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar</button>
          </footer>
        </form>
      </div>
    </div>

    <div class="modal" data-modal="project" aria-hidden="true">
      <div class="modal__overlay" data-close-modal></div>
      <div class="modal__content">
        <header class="modal__header">
          <h2>Proyecto</h2>
          <button type="button" class="btn-icon" data-close-modal aria-label="Cerrar">×</button>
        </header>
        <form class="modal__body form-grid" data-project-form>
          <label>
            <span>Nombre *</span>
            <input type="text" name="name" required />
          </label>
          <label>
            <span>Estado</span>
            <select name="status">
              <option value="active">Activo</option>
              <option value="on-hold">En pausa</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </label>
          <label>
            <span>Presupuesto (€)</span>
            <input type="number" min="0" step="0.01" name="budget" />
          </label>
          <label>
            <span>Inicio</span>
            <input type="date" name="startDate" />
          </label>
          <label>
            <span>Entrega</span>
            <input type="date" name="endDate" />
          </label>
          <footer class="modal__footer">
            <button type="button" class="btn btn-secondary" data-close-modal>Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar</button>
          </footer>
        </form>
      </div>
    </div>
  `;
}
