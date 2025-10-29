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

const modalFocusableSelectors =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
let activeClientsModal = null;
let clientsModalLastFocus = null;

function getClientsModal(type) {
  if (type === 'client') {
    return document.getElementById('client-modal');
  }
  if (type === 'project') {
    return document.getElementById('project-modal');
  }
  return null;
}

function trapClientsModalFocus(event) {
  if (event.key !== 'Tab' || !activeClientsModal) return;

  const focusable = Array.from(
    activeClientsModal.querySelectorAll(modalFocusableSelectors)
  ).filter((node) => !node.hasAttribute('disabled') && node.getAttribute('tabindex') !== '-1');

  if (!focusable.length) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const isShift = event.shiftKey;
  const active = document.activeElement;

  if (!isShift && active === last) {
    event.preventDefault();
    first.focus();
  } else if (isShift && active === first) {
    event.preventDefault();
    last.focus();
  }
}

function handleClientsModalKeydown(event) {
  if (!activeClientsModal) return;

  if (event.key === 'Escape' && !event.defaultPrevented) {
    event.preventDefault();
    closeClientsModal(activeClientsModal.dataset.modalType);
    return;
  }

  trapClientsModalFocus(event);
}

function openClientsModal(type) {
  const modal = getClientsModal(type);
  if (!modal) return;

  clientsModalLastFocus = document.activeElement;
  activeClientsModal = modal;
  modal.dataset.modalType = type;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-lock-scroll');
  modal.addEventListener('keydown', handleClientsModalKeydown);

  const focusable = Array.from(
    modal.querySelectorAll(modalFocusableSelectors)
  ).filter((node) => !node.hasAttribute('disabled') && node.getAttribute('tabindex') !== '-1');

  if (focusable.length) {
    window.requestAnimationFrame(() => {
      focusable[0].focus();
    });
  }
}

function closeClientsModal(type) {
  const modal = type ? getClientsModal(type) : activeClientsModal;
  if (!modal || !modal.classList.contains('is-open')) return;

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  modal.removeEventListener('keydown', handleClientsModalKeydown);

  if (activeClientsModal === modal) {
    activeClientsModal = null;
  }

  if (!document.querySelector('.modal.is-open')) {
    document.body.classList.remove('is-lock-scroll');
  }

  if (clientsModalLastFocus && typeof clientsModalLastFocus.focus === 'function') {
    clientsModalLastFocus.focus();
  }
  clientsModalLastFocus = null;

  if (modal.dataset.modalType === 'client') {
    clientsState.clientFormEditingId = null;
  }
  if (modal.dataset.modalType === 'project') {
    clientsState.projectFormEditingId = null;
    clientsState.projectPrefillClientId = null;
  }
}

function toInputDate(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) {
      return isoMatch[1];
    }
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function populateClientModal(client) {
  const modal = getClientsModal('client');
  if (!modal) return;

  const resolvedClient = client || {};
  const form = modal.querySelector('form[data-form-type="client"]');
  if (!form) return;

  form.reset();

  const title = modal.querySelector('[data-client-modal-title]');
  const submit = modal.querySelector('[data-client-submit]');

  if (title) {
    title.textContent = resolvedClient.id ? 'Editar cliente' : 'Nuevo cliente';
  }
  if (submit) {
    submit.textContent = resolvedClient.id ? 'Guardar cambios' : 'Crear cliente';
  }

  const nameInput = form.querySelector('[name="name"]');
  const emailInput = form.querySelector('[name="email"]');
  const phoneInput = form.querySelector('[name="phone"]');
  const nifInput = form.querySelector('[name="nifCif"]');
  const cityInput = form.querySelector('[name="city"]');
  const notesInput = form.querySelector('[name="notes"]');
  const activeCheckbox = form.querySelector('[name="isActive"]');

  if (nameInput) nameInput.value = resolvedClient.name || '';
  if (emailInput) emailInput.value = resolvedClient.email || '';
  if (phoneInput) phoneInput.value = resolvedClient.phone || '';
  if (nifInput) nifInput.value = resolvedClient.nifCif || '';
  if (cityInput) cityInput.value = resolvedClient.city || '';
  if (notesInput) notesInput.value = resolvedClient.notes || '';
  if (activeCheckbox) activeCheckbox.checked = resolvedClient.isActive !== false;
}

function populateProjectModal(project) {
  const modal = getClientsModal('project');
  if (!modal) return;

  const resolvedProject = project || {};
  const form = modal.querySelector('form[data-form-type="project"]');
  if (!form) return;

  form.reset();

  const title = modal.querySelector('[data-project-modal-title]');
  const submit = modal.querySelector('[data-project-submit]');

  if (title) {
    title.textContent = resolvedProject.id ? 'Editar proyecto' : 'Nuevo proyecto';
  }
  if (submit) {
    submit.textContent = resolvedProject.id ? 'Guardar cambios' : 'Crear proyecto';
  }

  const nameInput = form.querySelector('[name="name"]');
  const clientSelect = form.querySelector('[name="clientId"]');
  const statusSelect = form.querySelector('[name="status"]');
  const budgetInput = form.querySelector('[name="budget"]');
  const startDateInput = form.querySelector('[name="startDate"]');
  const endDateInput = form.querySelector('[name="endDate"]');
  const descriptionInput = form.querySelector('[name="description"]');

  if (nameInput) nameInput.value = resolvedProject.name || '';

  if (clientSelect) {
    const options = [
      '<option value="">Sin asignar</option>',
      ...clientsState.clients.map(
        (client) =>
          `<option value="${client.id}">${escapeHtml(client.name || 'Cliente sin nombre')}</option>`
      ),
    ].join('');
    clientSelect.innerHTML = options;

    const preferredClient =
      resolvedProject.clientId ||
      (resolvedProject.id ? null : clientsState.projectPrefillClientId);
    clientSelect.value = preferredClient ? String(preferredClient) : '';
  }

  if (statusSelect) {
    const status = resolvedProject.status || 'active';
    statusSelect.value = status;
  }

  if (budgetInput) {
    budgetInput.value =
      resolvedProject.budget === 0 || resolvedProject.budget
        ? String(resolvedProject.budget)
        : '';
  }

  if (startDateInput) startDateInput.value = toInputDate(resolvedProject.startDate);
  if (endDateInput) endDateInput.value = toInputDate(resolvedProject.endDate);
  if (descriptionInput) descriptionInput.value = resolvedProject.description || '';
}

function openClientModal(options = {}) {
  const clientId = options.clientId ? String(options.clientId) : null;
  const client = clientId ? clientsState.clients.find((item) => item.id === clientId) : null;
  populateClientModal(client);
  openClientsModal('client');
}

function openProjectModal(options = {}) {
  const projectId = options.projectId ? String(options.projectId) : null;
  const project = projectId ? clientsState.projects.find((item) => item.id === projectId) : null;
  populateProjectModal(project);
  openClientsModal('project');
}

function ensureSelection() {
  if (clientsState.clients.length) {
    const isValidSelection = clientsState.clients.some(
      (client) => client.id === clientsState.selectedClientId
    );
    if (!isValidSelection) {
      clientsState.selectedClientId = clientsState.clients[0].id;
    }
  } else {
    clientsState.selectedClientId = null;
  }

  if (clientsState.projects.length) {
    const isValidProject = clientsState.projects.some(
      (project) => project.id === clientsState.selectedProjectId
    );
    if (!isValidProject) {
      clientsState.selectedProjectId = clientsState.projects[0].id;
    }
  } else {
    clientsState.selectedProjectId = null;
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

  document.querySelectorAll('[data-clients-tab]').forEach((button) => {
    const isActive = button.dataset.clientsTab === tab;
    button.classList.toggle('active', isActive);
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  document
    .querySelectorAll('[data-clients-panel]')
    .forEach((panel) => {
      panel.hidden = panel.dataset.clientsPanel !== tab;
    });

  renderClientsTable();
  renderProjectsTable();
}

function handleClick(event) {
  const modalDismiss = event.target.closest('[data-modal-dismiss]');
  if (modalDismiss) {
    event.preventDefault();
    closeClientsModal(modalDismiss.dataset.modalDismiss);
    return;
  }

  const modalCloseBtn = event.target.closest('[data-modal-close]');
  if (modalCloseBtn) {
    event.preventDefault();
    closeClientsModal(modalCloseBtn.dataset.modalClose);
    return;
  }

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

  const refreshClients = event.target.closest('[data-action="refresh-clients"]');
  if (refreshClients) {
    event.preventDefault();
    void refreshClientsModule();
    return;
  }

  const refreshProjects = event.target.closest('[data-action="refresh-projects"]');
  if (refreshProjects) {
    event.preventDefault();
    void refreshClientsModule();
    return;
  }

  const newClientBtn = event.target.closest('[data-open-client]');
  if (newClientBtn) {
    event.preventDefault();
    clientsState.clientFormEditingId = null;
    openClientModal();
    return;
  }

  const newProjectBtn = event.target.closest('[data-open-project]');
  if (newProjectBtn) {
    event.preventDefault();
    clientsState.projectFormEditingId = null;
    const relClient = newProjectBtn.dataset.relClient;
    clientsState.projectPrefillClientId = relClient ? String(relClient) : null;
    openProjectModal();
    return;
  }

  const clientEditBtn = event.target.closest('[data-client-edit]');
  if (clientEditBtn) {
    event.stopPropagation();
    event.preventDefault();
    const clientId = String(clientEditBtn.dataset.clientEdit);
    clientsState.clientFormEditingId = clientId;
    clientsState.selectedClientId = clientId;
    openClientModal({ clientId });
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
    event.preventDefault();
    const projectId = String(projectEditBtn.dataset.projectEdit);
    clientsState.projectFormEditingId = projectId;
    clientsState.selectedProjectId = projectId;
    openProjectModal({ projectId });
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
    renderClientsTable();
    return;
  }

  const projectRow = event.target.closest('[data-project-row]');
  if (projectRow) {
    clientsState.selectedProjectId = String(projectRow.dataset.projectRow);
    renderProjectsTable();
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
    closeClientsModal('client');
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
    closeClientsModal('project');
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
  const module = document.querySelector('.clients-page');
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
    <section class="clients-page" aria-labelledby="clients-title">
      <header class="clients-page__hero">
        <div class="clients-page__hero-copy">
          <h1 id="clients-title">Clientes &amp; Proyectos</h1>
          <p>Visión 360º de tu cartera y estado de ejecución.</p>
        </div>
        <div class="clients-page__hero-actions">
          <button type="button" class="btn-primary" data-open-client>Nuevo cliente</button>
          <button type="button" class="btn-secondary" data-open-project>Nuevo proyecto</button>
        </div>
      </header>

      <section class="clients-page__metrics" aria-label="Resumen general">
        <article class="clients-metric">
          <span class="clients-metric__label">Clientes totales</span>
          <span class="clients-metric__value" id="clients-summary-total">0</span>
          <span class="clients-metric__hint">Registrados</span>
        </article>
        <article class="clients-metric">
          <span class="clients-metric__label">Clientes activos</span>
          <span class="clients-metric__value" id="clients-summary-active">0</span>
          <span class="clients-metric__hint">Con actividad</span>
        </article>
        <article class="clients-metric">
          <span class="clients-metric__label">Pendiente de cobro</span>
          <span class="clients-metric__value" id="clients-summary-pending">€0</span>
          <span class="clients-metric__hint">Facturas abiertas</span>
        </article>
        <article class="clients-metric">
          <span class="clients-metric__label">Facturación total</span>
          <span class="clients-metric__value" id="clients-summary-revenue">€0</span>
          <span class="clients-metric__hint">Acumulado</span>
        </article>
        <article class="clients-metric">
          <span class="clients-metric__label">Proyectos totales</span>
          <span class="clients-metric__value" id="projects-summary-total">0</span>
          <span class="clients-metric__hint">Activos + cerrados</span>
        </article>
        <article class="clients-metric">
          <span class="clients-metric__label">Proyectos activos</span>
          <span class="clients-metric__value" id="projects-summary-active">0</span>
          <span class="clients-metric__hint">En curso</span>
        </article>
        <article class="clients-metric">
          <span class="clients-metric__label">Presupuesto asignado</span>
          <span class="clients-metric__value" id="projects-summary-budget">€0</span>
          <span class="clients-metric__hint">Importe planificado</span>
        </article>
        <article class="clients-metric">
          <span class="clients-metric__label">Facturación proyectos</span>
          <span class="clients-metric__value" id="projects-summary-revenue">€0</span>
          <span class="clients-metric__hint">Ingresos vinculados</span>
        </article>
      </section>

      <div class="clients-page__tabs" role="tablist">
        <button type="button" class="clients-tab is-active" data-clients-tab="clients" aria-pressed="true">
          Clientes
        </button>
        <button type="button" class="clients-tab" data-clients-tab="projects" aria-pressed="false">
          Proyectos
        </button>
      </div>

      <div class="clients-page__filters" data-clients-panel="clients">
        <label class="visually-hidden" for="clients-search">Buscar clientes</label>
        <div class="clients-filter">
          <span class="clients-filter__icon">🔍</span>
          <input
            type="search"
            id="clients-search"
            placeholder="Buscar clientes..."
            autocomplete="off"
            data-clients-search
          />
        </div>
        <div class="clients-filter">
          <label class="visually-hidden" for="clients-status">Estado de cliente</label>
          <select id="clients-status" data-clients-status>
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
        <button type="button" class="btn-ghost" data-action="refresh-clients">
          Recargar
        </button>
      </div>

      <div class="clients-page__filters" data-clients-panel="projects" hidden>
        <label class="visually-hidden" for="projects-search">Buscar proyectos</label>
        <div class="clients-filter">
          <span class="clients-filter__icon">🔍</span>
          <input
            type="search"
            id="projects-search"
            placeholder="Buscar proyectos..."
            autocomplete="off"
            data-projects-search
          />
        </div>
        <div class="clients-filter">
          <label class="visually-hidden" for="projects-status">Estado de proyecto</label>
          <select id="projects-status" data-projects-status>
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="on-hold">En pausa</option>
            <option value="completed">Completados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
        <button type="button" class="btn-ghost" data-action="refresh-projects">
          Recargar
        </button>
      </div>

      <section class="clients-page__table" data-clients-panel="clients">
        <div class="clients-table__surface">
          <table class="data-table data-table--compact">
            <thead>
              <tr>
                <th scope="col">Cliente</th>
                <th scope="col">Contacto</th>
                <th scope="col">Facturación</th>
                <th scope="col">Proyectos</th>
                <th scope="col">Estado</th>
                <th scope="col"><span class="visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody data-clients-table></tbody>
          </table>
        </div>
        <div class="clients-table__footer">
          <div class="module-loading" data-clients-loading hidden>
            <span class="spinner"></span>
            <p>Cargando información...</p>
          </div>
          <div class="module-error" data-clients-error hidden></div>
        </div>
      </section>

      <section class="clients-page__table" data-clients-panel="projects" hidden>
        <div class="clients-table__surface">
          <table class="data-table data-table--compact">
            <thead>
              <tr>
                <th scope="col">Proyecto</th>
                <th scope="col">Estado</th>
                <th scope="col">Facturación</th>
                <th scope="col">Facturas</th>
                <th scope="col">Fechas</th>
                <th scope="col"><span class="visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody data-projects-table></tbody>
          </table>
        </div>
      </section>

      <section class="clients-page__insights" aria-label="Actividad reciente">
        <article class="clients-insight">
          <header class="clients-insight__header">
            <h3>Clientes recientes</h3>
          </header>
          <ul class="clients-insight__list" data-recent-clients></ul>
        </article>
        <article class="clients-insight">
          <header class="clients-insight__header">
            <h3>Hitos de proyectos</h3>
          </header>
          <ul class="clients-insight__list" data-upcoming-projects></ul>
        </article>
        <article class="clients-insight">
          <header class="clients-insight__header">
            <h3>Estado por proyectos</h3>
          </header>
          <ul class="clients-insight__list" data-status-metrics></ul>
        </article>
      </section>

      <div class="modal" id="client-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="client-modal-title">
        <div class="modal__backdrop" data-modal-dismiss="client"></div>
        <div class="modal__panel" role="document">
          <header class="modal__head">
            <div>
              <h2 id="client-modal-title" data-client-modal-title>Nuevo cliente</h2>
              <p class="modal__subtitle">Introduce la información fiscal del cliente.</p>
            </div>
            <button type="button" class="modal__close" data-modal-close="client" aria-label="Cerrar modal">
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <form class="modal-form" data-form-type="client" novalidate>
            <div class="modal__body">
              <div class="form-grid">
                <label class="form-field">
                  <span>Nombre *</span>
                  <input type="text" name="name" required placeholder="Razón social o nombre comercial" />
                </label>
                <label class="form-field">
                  <span>Email</span>
                  <input type="email" name="email" placeholder="cliente@empresa.com" />
                </label>
                <label class="form-field">
                  <span>Teléfono</span>
                  <input type="tel" name="phone" placeholder="+34 600 000 000" />
                </label>
                <label class="form-field">
                  <span>NIF / CIF</span>
                  <input type="text" name="nifCif" placeholder="B12345678" />
                </label>
                <label class="form-field">
                  <span>Ciudad</span>
                  <input type="text" name="city" placeholder="Madrid, Barcelona..." />
                </label>
                <label class="form-field">
                  <span>Notas</span>
                  <textarea name="notes" rows="4" placeholder="Información adicional para el equipo"></textarea>
                </label>
              </div>
              <label class="checkbox">
                <input type="checkbox" name="isActive" checked />
                <span>Cliente activo</span>
              </label>
            </div>
            <footer class="modal__footer">
              <button type="button" class="btn-secondary" data-modal-close="client">Cancelar</button>
              <button type="submit" class="btn-primary" data-client-submit>Crear cliente</button>
            </footer>
          </form>
        </div>
      </div>

      <div class="modal" id="project-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="project-modal-title">
        <div class="modal__backdrop" data-modal-dismiss="project"></div>
        <div class="modal__panel" role="document">
          <header class="modal__head">
            <div>
              <h2 id="project-modal-title" data-project-modal-title>Nuevo proyecto</h2>
              <p class="modal__subtitle">Planifica el proyecto y vincúlalo a un cliente existente.</p>
            </div>
            <button type="button" class="modal__close" data-modal-close="project" aria-label="Cerrar modal">
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <form class="modal-form" data-form-type="project" novalidate>
            <div class="modal__body">
              <div class="form-grid">
                <label class="form-field">
                  <span>Nombre *</span>
                  <input type="text" name="name" required placeholder="Nombre interno del proyecto" />
                </label>
                <label class="form-field">
                  <span>Cliente</span>
                  <select name="clientId">
                    <option value="">Sin asignar</option>
                  </select>
                </label>
                <label class="form-field">
                  <span>Estado</span>
                  <select name="status">
                    <option value="active">Activo</option>
                    <option value="on-hold">En pausa</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </label>
                <label class="form-field">
                  <span>Presupuesto (€)</span>
                  <input type="number" name="budget" min="0" step="0.01" placeholder="0,00" />
                </label>
                <label class="form-field">
                  <span>Inicio</span>
                  <input type="date" name="startDate" />
                </label>
                <label class="form-field">
                  <span>Entrega prevista</span>
                  <input type="date" name="endDate" />
                </label>
                <label class="form-field">
                  <span>Descripción</span>
                  <textarea name="description" rows="4" placeholder="Resumen del alcance y entregables"></textarea>
                </label>
              </div>
            </div>
            <footer class="modal__footer">
              <button type="button" class="btn-secondary" data-modal-close="project">Cancelar</button>
              <button type="submit" class="btn-primary" data-project-submit>Crear proyecto</button>
            </footer>
          </form>
        </div>
      </div>
    </section>
  `;
}
