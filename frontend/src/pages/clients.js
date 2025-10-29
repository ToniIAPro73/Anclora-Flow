const sidebarViews = {
  CLIENT_DETAIL: 'client-detail',
  CLIENT_FORM: 'client-form',
  CLIENT_EMPTY: 'client-empty',
  PROJECT_DETAIL: 'project-detail',
  PROJECT_FORM: 'project-form',
  PROJECT_EMPTY: 'project-empty',
};

const clientsState = {
  activeTab: 'clients',
  clients: [],
  projects: [],
  clientSummary: {
    total_clients: 0,
    active_clients: 0,
    total_pending: 0,
    total_billed: 0,
  },
  projectSummary: {
    total_projects: 0,
    active_projects: 0,
    total_budget: 0,
    total_invoiced: 0,
  },
  recentClients: [],
  upcomingDeadlines: [],
  statusMetrics: [],
  clientFilters: {
    search: '',
    status: 'all',
  },
  projectFilters: {
    search: '',
    status: 'all',
  },
  selectedClientId: null,
  selectedProjectId: null,
  sidebarView: sidebarViews.CLIENT_DETAIL,
  clientFormEditingId: null,
  projectFormEditingId: null,
  projectPrefillClientId: null,
  loading: false,
  error: null,
};

const money = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

function formatCurrency(value) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) return money.format(0);
  return money.format(parsed);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let debounceTimer = null;
function debounce(callback, delay = 320) {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(callback, delay);
}

function setLoading(isLoading) {
  clientsState.loading = isLoading;
  const spinner = document.querySelector('[data-clients-loading]');
  if (spinner) spinner.hidden = !isLoading;
}

function setError(message) {
  clientsState.error = message;
  const errorBox = document.querySelector('[data-clients-error]');
  if (!errorBox) return;
  if (!message) {
    errorBox.hidden = true;
    errorBox.innerHTML = '';
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
      <button type="button" class="btn btn-secondary" data-action="retry-clients">Reintentar</button>
    </div>
  `;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `notification notification--${type}`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button type="button" class="notification__close" aria-label="Cerrar">×</button>
  `;

  toast.querySelector('.notification__close').addEventListener('click', () => {
    toast.remove();
  });

  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

function ensureSelection() {
  if (clientsState.clients.length) {
    if (
      !clientsState.selectedClientId ||
      !clientsState.clients.some((client) => client.id === clientsState.selectedClientId)
    ) {
      clientsState.selectedClientId = clientsState.clients[0].id;
    }
    if (clientsState.sidebarView === sidebarViews.CLIENT_EMPTY) {
      clientsState.sidebarView = sidebarViews.CLIENT_DETAIL;
    }
  } else {
    clientsState.selectedClientId = null;
    if (
      clientsState.sidebarView === sidebarViews.CLIENT_DETAIL ||
      clientsState.sidebarView === sidebarViews.CLIENT_FORM
    ) {
      clientsState.sidebarView = sidebarViews.CLIENT_EMPTY;
    }
  }

  if (clientsState.projects.length) {
    if (
      !clientsState.selectedProjectId ||
      !clientsState.projects.some((project) => project.id === clientsState.selectedProjectId)
    ) {
      clientsState.selectedProjectId = clientsState.projects[0].id;
    }
    if (clientsState.sidebarView === sidebarViews.PROJECT_EMPTY) {
      clientsState.sidebarView = sidebarViews.PROJECT_DETAIL;
    }
  } else {
    clientsState.selectedProjectId = null;
    if (
      clientsState.sidebarView === sidebarViews.PROJECT_DETAIL ||
      clientsState.sidebarView === sidebarViews.PROJECT_FORM
    ) {
      clientsState.sidebarView = sidebarViews.PROJECT_EMPTY;
    }
  }
}

async function loadClientSummary() {
  try {
    const summary = await window.api.getClientSummary();
    if (summary) {
      clientsState.clientSummary = summary;
    }
  } catch (error) {
    console.error('Error loading client summary', error);
  }
}

async function loadProjectSummary() {
  try {
    const summary = await window.api.getProjectSummary();
    if (summary) {
      clientsState.projectSummary = summary;
    }
  } catch (error) {
    console.error('Error loading project summary', error);
  }
}

async function loadRecentClients() {
  try {
    const recent = await window.api.getRecentClients(5);
    clientsState.recentClients = Array.isArray(recent) ? recent : [];
  } catch (error) {
    clientsState.recentClients = [];
  }
}

async function loadProjectInsights() {
  try {
    const [deadlines, metrics] = await Promise.all([
      window.api.getProjectUpcomingDeadlines(5),
      window.api.getProjectStatusMetrics(),
    ]);
    clientsState.upcomingDeadlines = Array.isArray(deadlines) ? deadlines : [];
    clientsState.statusMetrics = Array.isArray(metrics) ? metrics : [];
  } catch (error) {
    clientsState.upcomingDeadlines = [];
    clientsState.statusMetrics = [];
  }
}

function buildClientFilters() {
  const filters = {};
  if (clientsState.clientFilters.search.trim()) {
    filters.search = clientsState.clientFilters.search.trim();
  }
  if (clientsState.clientFilters.status !== 'all') {
    filters.isActive = clientsState.clientFilters.status === 'active';
  }
  return filters;
}

function buildProjectFilters() {
  const filters = {};
  if (clientsState.projectFilters.search.trim()) {
    filters.search = clientsState.projectFilters.search.trim();
  }
  if (clientsState.projectFilters.status !== 'all') {
    filters.status = clientsState.projectFilters.status;
  }
  return filters;
}

async function loadClients() {
  const response = await window.api.getClients(buildClientFilters());
  const { clients = [] } = response || {};
  clientsState.clients = clients.map((client) => ({
    id: String(client.id),
    name: client.name,
    email: client.email,
    phone: client.phone,
    nifCif: client.nif_cif,
    city: client.city,
    notes: client.notes,
    isActive: client.is_active,
    totalInvoiced: client.total_invoiced ?? 0,
    totalPending: client.total_pending ?? 0,
    projectsCount: client.projects_count ?? 0,
    subscriptionsCount: client.subscriptions_count ?? 0,
    invoiceCount: client.invoice_count ?? 0,
    createdAt: client.created_at,
  }));
}

async function loadProjects() {
  const response = await window.api.getProjects(buildProjectFilters());
  const { projects = [] } = response || {};
  clientsState.projects = projects.map((project) => ({
    id: String(project.id),
    clientId: project.client_id ? String(project.client_id) : null,
    clientName: project.client_name,
    name: project.name,
    status: project.status,
    budget: project.budget,
    totalInvoiced: project.total_invoiced ?? 0,
    invoiceCount: project.invoice_count ?? 0,
    startDate: project.start_date,
    endDate: project.end_date,
    description: project.description,
    color: project.color,
  }));
}

function renderSummaryCards() {
  const clientTotals = document.getElementById('clients-summary-total');
  const clientActive = document.getElementById('clients-summary-active');
  const clientPending = document.getElementById('clients-summary-pending');
  const clientRevenue = document.getElementById('clients-summary-revenue');

  const projectTotals = document.getElementById('projects-summary-total');
  const projectActive = document.getElementById('projects-summary-active');
  const projectBudget = document.getElementById('projects-summary-budget');
  const projectRevenue = document.getElementById('projects-summary-revenue');

  if (clientTotals) clientTotals.textContent = clientsState.clientSummary.total_clients ?? 0;
  if (clientActive) clientActive.textContent = clientsState.clientSummary.active_clients ?? 0;
  if (clientPending) clientPending.textContent = formatCurrency(clientsState.clientSummary.total_pending ?? 0);
  if (clientRevenue) clientRevenue.textContent = formatCurrency(clientsState.clientSummary.total_billed ?? 0);

  if (projectTotals) projectTotals.textContent = clientsState.projectSummary.total_projects ?? 0;
  if (projectActive) projectActive.textContent = clientsState.projectSummary.active_projects ?? 0;
  if (projectBudget) projectBudget.textContent = formatCurrency(clientsState.projectSummary.total_budget ?? 0);
  if (projectRevenue) projectRevenue.textContent = formatCurrency(clientsState.projectSummary.total_invoiced ?? 0);
}

function renderClientsTable() {
  const tbody = document.querySelector('[data-clients-table]');
  if (!tbody) return;

  if (!clientsState.clients.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <span class="empty-state__icon">🧾</span>
            <h3>Sin clientes registrados</h3>
            <p>Crea tu primer cliente para empezar a registrar proyectos y facturas.</p>
            <button class="btn btn-primary" type="button" data-open-client>Nuevo cliente</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = clientsState.clients
    .map((client) => {
      const isSelected = client.id === clientsState.selectedClientId;
      return `
        <tr data-client-row="${client.id}" class="${isSelected ? 'is-selected' : ''}">
          <td>
            <div class="table-cell--main">
              <strong>${escapeHtml(client.name)}</strong>
              <span>${escapeHtml(client.email || 'Sin email')}</span>
            </div>
          </td>
          <td>
            <span>${escapeHtml(client.phone || '—')}</span>
            <span class="meta">${escapeHtml(client.nifCif || 'Sin NIF/CIF')}</span>
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
            <span class="badge badge--${client.isActive ? 'success' : 'neutral'}">
              ${client.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-icon" data-client-edit="${client.id}" aria-label="Editar cliente">✏️</button>
              <button type="button" class="btn-icon btn-icon--danger" data-client-delete="${client.id}" aria-label="Eliminar cliente">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderProjectsTable() {
  const tbody = document.querySelector('[data-projects-table]');
  if (!tbody) return;

  if (!clientsState.projects.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <span class="empty-state__icon">📂</span>
            <h3>Sin proyectos activos</h3>
            <p>Registra un proyecto para organizar tareas, presupuestos y facturación.</p>
            <button class="btn btn-primary" type="button" data-open-project>Nuevo proyecto</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = clientsState.projects
    .map((project) => {
      const isSelected = project.id === clientsState.selectedProjectId;
      const statusBadge =
        project.status === 'completed'
          ? 'success'
          : project.status === 'cancelled'
          ? 'danger'
          : project.status === 'on-hold'
          ? 'warning'
          : 'info';

      return `
        <tr data-project-row="${project.id}" class="${isSelected ? 'is-selected' : ''}">
          <td>
            <div class="table-cell--main">
              <strong>${escapeHtml(project.name)}</strong>
              <span>${escapeHtml(project.clientName || 'Sin cliente')}</span>
            </div>
          </td>
          <td>
            <span class="badge badge--${statusBadge}">
              ${
                project.status === 'completed'
                  ? 'Completado'
                  : project.status === 'cancelled'
                  ? 'Cancelado'
                  : project.status === 'on-hold'
                  ? 'En pausa'
                  : 'Activo'
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
              <button type="button" class="btn-icon" data-project-edit="${project.id}" aria-label="Editar proyecto">✏️</button>
              <button type="button" class="btn-icon btn-icon--danger" data-project-delete="${project.id}" aria-label="Eliminar proyecto">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderInsights() {
  const recentList = document.querySelector('[data-recent-clients]');
  const upcomingList = document.querySelector('[data-upcoming-projects]');
  const statusList = document.querySelector('[data-status-metrics]');

  if (recentList) {
    if (!clientsState.recentClients.length) {
      recentList.innerHTML = '<li class="empty">Sin actividad reciente</li>';
    } else {
      recentList.innerHTML = clientsState.recentClients
        .map(
          (client) => `
            <li>
              <span class="title">${escapeHtml(client.name)}</span>
              <span class="meta">${formatCurrency(client.total_billed ?? 0)}</span>
            </li>
          `
        )
        .join('');
    }
  }

  if (upcomingList) {
    if (!clientsState.upcomingDeadlines.length) {
      upcomingList.innerHTML = '<li class="empty">Sin hitos próximos</li>';
    } else {
      upcomingList.innerHTML = clientsState.upcomingDeadlines
        .map(
          (project) => `
            <li>
              <span class="title">${escapeHtml(project.name)}</span>
              <span class="meta">${formatDate(project.end_date)}</span>
            </li>
          `
        )
        .join('');
    }
  }

  if (statusList) {
    if (!clientsState.statusMetrics.length) {
      statusList.innerHTML = '<li class="empty">Sin métricas registradas</li>';
    } else {
      statusList.innerHTML = clientsState.statusMetrics
        .map(
          (metric) => `
            <li>
              <span class="title">${escapeHtml(metric.status)}</span>
              <span class="meta">${metric.count} proyectos</span>
            </li>
          `
        )
        .join('');
    }
  }
}

function populateFilterControls() {
  const statusSelect = document.querySelector('[data-clients-status]');
  if (statusSelect) {
    statusSelect.value = clientsState.clientFilters.status;
  }
  const projectStatusSelect = document.querySelector('[data-projects-status]');
  if (projectStatusSelect) {
    projectStatusSelect.value = clientsState.projectFilters.status;
  }
}

function buildClientFormHTML(client = {}) {
  return `
    <form class="sidebar-form" data-form-type="client">
      <header class="sidebar-form__header">
        <h3>${client.id ? 'Editar cliente' : 'Nuevo cliente'}</h3>
        <button type="button" class="btn-ghost" data-action="cancel-form">Cancelar</button>
      </header>
      <div class="form-grid">
        <label>
          <span>Nombre *</span>
          <input type="text" name="name" value="${escapeHtml(client.name || '')}" required />
        </label>
        <label>
          <span>Email</span>
          <input type="email" name="email" value="${escapeHtml(client.email || '')}" />
        </label>
        <label>
          <span>Teléfono</span>
          <input type="tel" name="phone" value="${escapeHtml(client.phone || '')}" />
        </label>
        <label>
          <span>NIF / CIF</span>
          <input type="text" name="nifCif" value="${escapeHtml(client.nifCif || '')}" />
        </label>
        <label>
          <span>Ciudad</span>
          <input type="text" name="city" value="${escapeHtml(client.city || '')}" />
        </label>
        <label class="checkbox">
          <input type="checkbox" name="isActive" ${client.isActive !== false ? 'checked' : ''} />
          <span>Cliente activo</span>
        </label>
        <label class="wide">
          <span>Notas</span>
          <textarea name="notes" rows="3">${escapeHtml(client.notes || '')}</textarea>
        </label>
      </div>
      <footer class="sidebar-form__footer">
        <button type="submit" class="btn btn-primary">${client.id ? 'Guardar cambios' : 'Crear cliente'}</button>
      </footer>
    </form>
  `;
}

function buildProjectFormHTML(project = {}) {
  const selectedClientId = project.id
    ? project.clientId
    : clientsState.projectPrefillClientId || null;

  const clientOptions = [
    '<option value="">Sin asignar</option>',
    ...clientsState.clients.map(
      (client) =>
        `<option value="${client.id}" ${
          selectedClientId === client.id ? 'selected' : ''
        }>${escapeHtml(client.name)}</option>`
    ),
  ].join('');

  return `
    <form class="sidebar-form" data-form-type="project">
      <header class="sidebar-form__header">
        <h3>${project.id ? 'Editar proyecto' : 'Nuevo proyecto'}</h3>
        <button type="button" class="btn-ghost" data-action="cancel-form">Cancelar</button>
      </header>
      <div class="form-grid">
        <label>
          <span>Nombre *</span>
          <input type="text" name="name" value="${escapeHtml(project.name || '')}" required />
        </label>
        <label>
          <span>Cliente</span>
          <select name="clientId">
            ${clientOptions}
          </select>
        </label>
        <label>
          <span>Estado</span>
          <select name="status">
            <option value="active" ${project.status === 'active' ? 'selected' : ''}>Activo</option>
            <option value="on-hold" ${project.status === 'on-hold' ? 'selected' : ''}>En pausa</option>
            <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Completado</option>
            <option value="cancelled" ${project.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
          </select>
        </label>
        <label>
          <span>Presupuesto (€)</span>
          <input type="number" min="0" step="0.01" name="budget" value="${project.budget != null ? project.budget : ''}" />
        </label>
        <label>
          <span>Inicio</span>
          <input type="date" name="startDate" value="${project.startDate ? project.startDate.split('T')[0] : ''}" />
        </label>
        <label>
          <span>Entrega prevista</span>
          <input type="date" name="endDate" value="${project.endDate ? project.endDate.split('T')[0] : ''}" />
        </label>
        <label class="wide">
          <span>Descripción</span>
          <textarea name="description" rows="3">${escapeHtml(project.description || '')}</textarea>
        </label>
      </div>
      <footer class="sidebar-form__footer">
        <button type="submit" class="btn btn-primary">${project.id ? 'Guardar cambios' : 'Crear proyecto'}</button>
      </footer>
    </form>
  `;
}

function buildClientDetailHTML(client) {
  if (!client) {
    return `
      <div class="sidebar-empty">
        <span class="sidebar-empty__icon">👥</span>
        <p>Selecciona un cliente para revisar su actividad.</p>
      </div>
    `;
  }

  return `
    <article class="sidebar-card">
      <header class="sidebar-card__header">
        <div>
          <h3>${escapeHtml(client.name)}</h3>
          <p>${escapeHtml(client.email || 'Sin email principal')}</p>
        </div>
        <span class="badge badge--${client.isActive ? 'success' : 'neutral'}">
          ${client.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </header>
      <dl class="detail-grid">
        <div>
          <dt>Teléfono</dt>
          <dd>${escapeHtml(client.phone || 'Sin teléfono')}</dd>
        </div>
        <div>
          <dt>NIF / CIF</dt>
          <dd>${escapeHtml(client.nifCif || '—')}</dd>
        </div>
        <div>
          <dt>Ciudad</dt>
          <dd>${escapeHtml(client.city || '—')}</dd>
        </div>
        <div>
          <dt>Proyectos</dt>
          <dd>${client.projectsCount}</dd>
        </div>
        <div>
          <dt>Facturación</dt>
          <dd>${formatCurrency(client.totalInvoiced)}</dd>
        </div>
        <div>
          <dt>Pendiente de cobro</dt>
          <dd>${formatCurrency(client.totalPending)}</dd>
        </div>
      </dl>
      <footer class="sidebar-card__footer">
        <button type="button" class="btn btn-secondary" data-client-edit="${client.id}">Editar cliente</button>
        <button type="button" class="btn btn-outline" data-open-project data-rel-client="${client.id}">
          Nuevo proyecto
        </button>
      </footer>
    </article>
  `;
}

function buildProjectDetailHTML(project) {
  if (!project) {
    return `
      <div class="sidebar-empty">
        <span class="sidebar-empty__icon">📁</span>
        <p>Selecciona un proyecto para visualizar su estado.</p>
      </div>
    `;
  }

  const statusBadge =
    project.status === 'completed'
      ? 'success'
      : project.status === 'cancelled'
      ? 'danger'
      : project.status === 'on-hold'
      ? 'warning'
      : 'info';

  return `
    <article class="sidebar-card">
      <header class="sidebar-card__header">
        <div>
          <h3>${escapeHtml(project.name)}</h3>
          <p>${escapeHtml(project.clientName || 'Sin cliente')}</p>
        </div>
        <span class="badge badge--${statusBadge}">
          ${
            project.status === 'completed'
              ? 'Completado'
              : project.status === 'cancelled'
              ? 'Cancelado'
              : project.status === 'on-hold'
              ? 'En pausa'
              : 'Activo'
          }
        </span>
      </header>
      <dl class="detail-grid">
        <div>
          <dt>Presupuesto</dt>
          <dd>${formatCurrency(project.budget ?? 0)}</dd>
        </div>
        <div>
          <dt>Facturación</dt>
          <dd>${formatCurrency(project.totalInvoiced ?? 0)}</dd>
        </div>
        <div>
          <dt>Facturas emitidas</dt>
          <dd>${project.invoiceCount ?? 0}</dd>
        </div>
        <div>
          <dt>Inicio</dt>
          <dd>${formatDate(project.startDate)}</dd>
        </div>
        <div>
          <dt>Entrega</dt>
          <dd>${formatDate(project.endDate)}</dd>
        </div>
      </dl>
      <footer class="sidebar-card__footer">
        <button type="button" class="btn btn-secondary" data-project-edit="${project.id}">
          Editar proyecto
        </button>
      </footer>
    </article>
  `;
}

function renderSidebar() {
  const container = document.querySelector('[data-sidebar]');
  if (!container) return;

  let html = '';

  if (clientsState.sidebarView === sidebarViews.CLIENT_EMPTY) {
    html = `
      <div class="sidebar-empty">
        <span class="sidebar-empty__icon">🧾</span>
        <p>No hay clientes registrados todavía.</p>
        <button type="button" class="btn btn-primary" data-open-client>Crear cliente</button>
      </div>
    `;
  } else if (clientsState.sidebarView === sidebarViews.PROJECT_EMPTY) {
    html = `
      <div class="sidebar-empty">
        <span class="sidebar-empty__icon">📂</span>
        <p>No hay proyectos registrados todavía.</p>
        <button type="button" class="btn btn-primary" data-open-project>Crear proyecto</button>
      </div>
    `;
  } else if (clientsState.sidebarView === sidebarViews.CLIENT_FORM) {
    const client =
      clientsState.clientFormEditingId &&
      clientsState.clients.find((item) => item.id === clientsState.clientFormEditingId);
    html = buildClientFormHTML(client);
  } else if (clientsState.sidebarView === sidebarViews.PROJECT_FORM) {
    const project =
      clientsState.projectFormEditingId &&
      clientsState.projects.find((item) => item.id === clientsState.projectFormEditingId);
    html = buildProjectFormHTML(project);
  } else if (clientsState.sidebarView === sidebarViews.PROJECT_DETAIL) {
    const project = clientsState.projects.find(
      (item) => item.id === clientsState.selectedProjectId
    );
    html = buildProjectDetailHTML(project);
  } else {
    const client = clientsState.clients.find(
      (item) => item.id === clientsState.selectedClientId
    );
    html = buildClientDetailHTML(client);
  }

  container.innerHTML = html;
}

async function refreshClientsModule(options = {}) {
  if (options.focusClientId) {
    clientsState.selectedClientId = String(options.focusClientId);
  }
  if (options.focusProjectId) {
    clientsState.selectedProjectId = String(options.focusProjectId);
  }

  if (typeof window.api === 'undefined') {
    setError('Servicio API no disponible. Comprueba la carga de api.js');
    return;
  }

  if (!window.api.isAuthenticated()) {
    setError('Inicia sesión para gestionar tus clientes y proyectos.');
    return;
  }

  try {
    setLoading(true);
    setError(null);
    await Promise.all([
      loadClients(),
      loadProjects(),
      loadClientSummary(),
      loadProjectSummary(),
      loadRecentClients(),
      loadProjectInsights(),
    ]);
    ensureSelection();
    renderSummaryCards();
    renderClientsTable();
    renderProjectsTable();
    renderInsights();
    populateFilterControls();
    renderSidebar();
  } catch (error) {
    console.error('Error loading clients module', error);
    setError('Ocurrió un problema al cargar los datos.');
  } finally {
    setLoading(false);
  }
}

function setActiveTab(tab) {
  if (clientsState.activeTab === tab) return;
  clientsState.activeTab = tab;

  document
    .querySelectorAll('[data-clients-tab]')
    .forEach((button) => button.classList.toggle('active', button.dataset.clientsTab === tab));

  document
    .querySelectorAll('[data-clients-panel]')
    .forEach((panel) => {
      panel.hidden = panel.dataset.clientsPanel !== tab;
    });

  if (tab === 'clients') {
    if (clientsState.sidebarView === sidebarViews.PROJECT_DETAIL) {
      clientsState.sidebarView = sidebarViews.CLIENT_DETAIL;
    }
    if (clientsState.sidebarView === sidebarViews.PROJECT_FORM) {
      clientsState.sidebarView = sidebarViews.CLIENT_FORM;
    }
    if (clientsState.sidebarView === sidebarViews.PROJECT_EMPTY) {
      clientsState.sidebarView = sidebarViews.CLIENT_DETAIL;
    }
  } else {
    if (clientsState.sidebarView === sidebarViews.CLIENT_DETAIL) {
      clientsState.sidebarView = sidebarViews.PROJECT_DETAIL;
    }
    if (clientsState.sidebarView === sidebarViews.CLIENT_FORM) {
      clientsState.sidebarView = sidebarViews.PROJECT_FORM;
    }
    if (clientsState.sidebarView === sidebarViews.CLIENT_EMPTY) {
      clientsState.sidebarView = sidebarViews.PROJECT_DETAIL;
    }
  }

  renderSidebar();
}

function handleClick(event) {
  const tabButton = event.target.closest('[data-clients-tab]');
  if (tabButton) {
    event.preventDefault();
    setActiveTab(tabButton.dataset.clientsTab);
    return;
  }

  const retryButton = event.target.closest('[data-action="retry-clients"]');
  if (retryButton) {
    void refreshClientsModule();
    return;
  }

  const newClientBtn = event.target.closest('[data-open-client]');
  if (newClientBtn) {
    clientsState.clientFormEditingId = null;
    clientsState.sidebarView = sidebarViews.CLIENT_FORM;
    renderSidebar();
    return;
  }

  const newProjectBtn = event.target.closest('[data-open-project]');
  if (newProjectBtn) {
    clientsState.projectFormEditingId = null;
    const relClient = newProjectBtn.dataset.relClient;
    clientsState.projectPrefillClientId = relClient ? String(relClient) : null;
    clientsState.sidebarView = sidebarViews.PROJECT_FORM;
    renderSidebar();
    return;
  }

  const cancelBtn = event.target.closest('[data-action="cancel-form"]');
  if (cancelBtn) {
    clientsState.clientFormEditingId = null;
    clientsState.projectFormEditingId = null;
    clientsState.projectPrefillClientId = null;
    if (clientsState.activeTab === 'clients') {
      clientsState.sidebarView = clientsState.clients.length
        ? sidebarViews.CLIENT_DETAIL
        : sidebarViews.CLIENT_EMPTY;
    } else {
      clientsState.sidebarView = clientsState.projects.length
        ? sidebarViews.PROJECT_DETAIL
        : sidebarViews.PROJECT_EMPTY;
    }
    renderSidebar();
    return;
  }

  const clientEditBtn = event.target.closest('[data-client-edit]');
  if (clientEditBtn) {
    event.stopPropagation();
    clientsState.clientFormEditingId = String(clientEditBtn.dataset.clientEdit);
    clientsState.sidebarView = sidebarViews.CLIENT_FORM;
    renderSidebar();
    return;
  }

  const clientDeleteBtn = event.target.closest('[data-client-delete]');
  if (clientDeleteBtn) {
    event.stopPropagation();
    void handleClientDelete(clientDeleteBtn.dataset.clientDelete);
    return;
  }

  const projectEditBtn = event.target.closest('[data-project-edit]');
  if (projectEditBtn) {
    event.stopPropagation();
    clientsState.projectFormEditingId = String(projectEditBtn.dataset.projectEdit);
    clientsState.sidebarView = sidebarViews.PROJECT_FORM;
    renderSidebar();
    return;
  }

  const projectDeleteBtn = event.target.closest('[data-project-delete]');
  if (projectDeleteBtn) {
    event.stopPropagation();
    void handleProjectDelete(projectDeleteBtn.dataset.projectDelete);
    return;
  }

  const clientRow = event.target.closest('[data-client-row]');
  if (clientRow) {
    clientsState.selectedClientId = String(clientRow.dataset.clientRow);
    clientsState.sidebarView = sidebarViews.CLIENT_DETAIL;
    renderClientsTable();
    renderSidebar();
    return;
  }

  const projectRow = event.target.closest('[data-project-row]');
  if (projectRow) {
    clientsState.selectedProjectId = String(projectRow.dataset.projectRow);
    clientsState.sidebarView = sidebarViews.PROJECT_DETAIL;
    renderProjectsTable();
    renderSidebar();
  }
}

function handleInput(event) {
  if (event.target.matches('[data-clients-search]')) {
    clientsState.clientFilters.search = event.target.value;
    debounce(() => void refreshClientsModule());
    return;
  }

  if (event.target.matches('[data-projects-search]')) {
    clientsState.projectFilters.search = event.target.value;
    debounce(() => void refreshClientsModule());
  }
}

function handleChange(event) {
  if (event.target.matches('[data-clients-status]')) {
    clientsState.clientFilters.status = event.target.value;
    void refreshClientsModule();
    return;
  }

  if (event.target.matches('[data-projects-status]')) {
    clientsState.projectFilters.status = event.target.value;
    void refreshClientsModule();
  }
}

async function handleClientFormSubmit(event) {
  event.preventDefault();
  const form = event.target.closest('form');
  if (!form) return;
  const data = new FormData(form);

  const payload = {
    name: data.get('name')?.toString().trim(),
    email: data.get('email')?.toString().trim() || undefined,
    phone: data.get('phone')?.toString().trim() || undefined,
    nifCif: data.get('nifCif')?.toString().trim() || undefined,
    city: data.get('city')?.toString().trim() || undefined,
    notes: data.get('notes')?.toString().trim() || undefined,
    isActive: data.get('isActive') === 'on',
  };

  const editingId = clientsState.clientFormEditingId;

  try {
    let response;
    if (editingId) {
      response = await window.api.updateClient(editingId, payload);
      clientsState.selectedClientId = String(editingId);
      showToast('Cliente actualizado correctamente', 'success');
    } else {
      response = await window.api.createClient(payload);
      if (response?.id) {
        clientsState.selectedClientId = String(response.id);
      }
      showToast('Cliente creado correctamente', 'success');
    }
    clientsState.clientFormEditingId = null;
    clientsState.sidebarView = sidebarViews.CLIENT_DETAIL;
    await refreshClientsModule({
      focusClientId: clientsState.selectedClientId || response?.id,
    });
  } catch (error) {
    console.error('Error saving client', error);
    showToast('No se pudo guardar el cliente', 'error');
  }
}

async function handleProjectFormSubmit(event) {
  event.preventDefault();
  const form = event.target.closest('form');
  if (!form) return;
  const data = new FormData(form);

  const payload = {
    name: data.get('name')?.toString().trim(),
    clientId: data.get('clientId') || undefined,
    status: data.get('status') || 'active',
    budget: data.get('budget') ? Number.parseFloat(data.get('budget')) : undefined,
    startDate: data.get('startDate') || undefined,
    endDate: data.get('endDate') || undefined,
    description: data.get('description')?.toString().trim() || undefined,
  };

  const editingId = clientsState.projectFormEditingId;

  try {
    let response;
    if (editingId) {
      response = await window.api.updateProject(editingId, payload);
      clientsState.selectedProjectId = String(editingId);
      showToast('Proyecto actualizado correctamente', 'success');
    } else {
      response = await window.api.createProject(payload);
      if (response?.id) {
        clientsState.selectedProjectId = String(response.id);
      }
      showToast('Proyecto creado correctamente', 'success');
    }
    clientsState.projectFormEditingId = null;
    clientsState.projectPrefillClientId = null;
    clientsState.sidebarView = sidebarViews.PROJECT_DETAIL;
    await refreshClientsModule({
      focusProjectId: clientsState.selectedProjectId || response?.id,
    });
  } catch (error) {
    console.error('Error saving project', error);
    showToast('No se pudo guardar el proyecto', 'error');
  }
}

function handleSubmit(event) {
  if (event.target.matches('[data-form-type="client"]')) {
    void handleClientFormSubmit(event);
  } else if (event.target.matches('[data-form-type="project"]')) {
    void handleProjectFormSubmit(event);
  }
}

async function handleClientDelete(id) {
  if (!window.confirm('¿Seguro que deseas eliminar este cliente?')) return;
  try {
    await window.api.deleteClient(id);
    showToast('Cliente eliminado', 'success');
    if (clientsState.selectedClientId === id) {
      clientsState.selectedClientId = null;
    }
    await refreshClientsModule();
  } catch (error) {
    console.error('Error deleting client', error);
    showToast('No se pudo eliminar el cliente', 'error');
  }
}

async function handleProjectDelete(id) {
  if (!window.confirm('¿Seguro que deseas eliminar este proyecto?')) return;
  try {
    await window.api.deleteProject(id);
    showToast('Proyecto eliminado', 'success');
    if (clientsState.selectedProjectId === id) {
      clientsState.selectedProjectId = null;
    }
    await refreshClientsModule();
  } catch (error) {
    console.error('Error deleting project', error);
    showToast('No se pudo eliminar el proyecto', 'error');
  }
}


export function initClients() {
  const module = document.querySelector('.clients-module');
  if (!module) return;

  module.addEventListener('click', handleClick);
  module.addEventListener('input', handleInput);
  module.addEventListener('change', handleChange);
  module.addEventListener('submit', handleSubmit);

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
          <p>Visión 360º de tu cartera y estado de ejecución.</p>
        </div>
        <div class="module-actions">
          <button type="button" class="btn btn-secondary" data-open-project>＋ Nuevo proyecto</button>
          <button type="button" class="btn btn-primary" data-open-client>＋ Nuevo cliente</button>
        </div>
      </header>

      <div class="summary-wrap">
        <div class="summary-grid summary-grid--compact">
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-primary-light);">👥</div>
            <div class="card-content">
              <span class="card-label">Clientes totales</span>
              <span class="card-value" id="clients-summary-total">0</span>
            </div>
          </article>
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-success-light);">✅</div>
            <div class="card-content">
              <span class="card-label">Clientes activos</span>
              <span class="card-value" id="clients-summary-active">0</span>
            </div>
          </article>
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-warning-light);">💳</div>
            <div class="card-content">
              <span class="card-label">Pendiente de cobro</span>
              <span class="card-value" id="clients-summary-pending">€0</span>
            </div>
          </article>
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-info-light);">📈</div>
            <div class="card-content">
              <span class="card-label">Facturación total</span>
              <span class="card-value" id="clients-summary-revenue">€0</span>
            </div>
          </article>
        </div>
        <div class="summary-grid summary-grid--compact">
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-tertiary-light);">📂</div>
            <div class="card-content">
              <span class="card-label">Proyectos totales</span>
              <span class="card-value" id="projects-summary-total">0</span>
            </div>
          </article>
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-secondary-light);">🚀</div>
            <div class="card-content">
              <span class="card-label">Proyectos activos</span>
              <span class="card-value" id="projects-summary-active">0</span>
            </div>
          </article>
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-tertiary-muted);">💰</div>
            <div class="card-content">
              <span class="card-label">Presupuesto asignado</span>
              <span class="card-value" id="projects-summary-budget">€0</span>
            </div>
          </article>
          <article class="card stat-card stat-card--compact">
            <div class="card-icon" style="background: var(--color-secondary-muted);">📊</div>
            <div class="card-content">
              <span class="card-label">Facturación proyectos</span>
              <span class="card-value" id="projects-summary-revenue">€0</span>
            </div>
          </article>
        </div>
      </div>

      <div class="module-tabs module-tabs--pill">
        <button type="button" class="tab-button active" data-clients-tab="clients">Clientes</button>
        <button type="button" class="tab-button" data-clients-tab="projects">Proyectos</button>
      </div>

      <div class="module-body module-body--split">
        <div class="module-main">
          <div class="module-toolbar" data-clients-panel="clients">
            <label class="input input--search">
              <span class="input__icon">🔍</span>
              <input type="search" data-clients-search placeholder="Buscar clientes..." autocomplete="off" />
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
              <input type="search" data-projects-search placeholder="Buscar proyectos..." autocomplete="off" />
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
            <table class="data-table data-table--compact">
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
            <table class="data-table data-table--compact">
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
            <p>Cargando información...</p>
          </div>
          <div class="module-error" data-clients-error hidden></div>
        </div>

        <aside class="module-sidebar" data-sidebar></aside>
      </div>

      <footer class="module-footer">
        <section>
          <h4>Clientes recientes</h4>
          <ul class="insight-list" data-recent-clients></ul>
        </section>
        <section>
          <h4>Hitos de proyectos</h4>
          <ul class="insight-list" data-upcoming-projects></ul>
        </section>
        <section>
          <h4>Estado por proyectos</h4>
          <ul class="insight-list" data-status-metrics></ul>
        </section>
      </footer>
    </section>
  `;
}
