// Datos de demostración - Clientes
const demoClients = [
  {
    id: '1',
    name: 'Tech Solutions SL',
    email: 'contacto@techsolutions.es',
    phone: '+34 91 123 4567',
    nifCif: 'B12345678',
    address: 'Calle Mayor 123',
    city: 'Madrid',
    postalCode: '28001',
    country: 'España',
    notes: 'Cliente principal, pago puntual',
    isActive: true,
    created_at: '2024-01-15'
  },
  {
    id: '2',
    name: 'Innovate Digital',
    email: 'admin@innovatedigital.com',
    phone: '+34 93 987 6543',
    nifCif: 'B87654321',
    address: 'Av. Diagonal 456',
    city: 'Barcelona',
    postalCode: '08008',
    country: 'España',
    notes: '',
    isActive: true,
    created_at: '2024-02-20'
  },
  {
    id: '3',
    name: 'Creative Agency',
    email: 'hello@creativeagency.es',
    phone: '+34 96 555 1234',
    nifCif: 'B11223344',
    address: 'Calle Colón 789',
    city: 'Valencia',
    postalCode: '46004',
    country: 'España',
    notes: 'Requiere facturación mensual',
    isActive: true,
    created_at: '2024-03-10'
  },
  {
    id: '4',
    name: 'StartUp Hub',
    email: 'info@startuphub.com',
    phone: '+34 95 444 7890',
    nifCif: 'B99887766',
    address: 'Parque Tecnológico',
    city: 'Sevilla',
    postalCode: '41092',
    country: 'España',
    notes: 'Cliente nuevo, en periodo de prueba',
    isActive: true,
    created_at: '2024-11-01'
  },
  {
    id: '5',
    name: 'Old Client Corp',
    email: 'old@client.com',
    phone: '+34 91 999 8888',
    nifCif: 'B55443322',
    address: 'Calle Antigua 1',
    city: 'Madrid',
    postalCode: '28002',
    country: 'España',
    notes: 'Cliente inactivo desde 2023',
    isActive: false,
    created_at: '2023-05-10'
  }
];

// Datos de demostración - Proyectos
const demoProjects = [
  {
    id: '1',
    clientId: '1',
    clientName: 'Tech Solutions SL',
    name: 'Desarrollo Web Corporativa',
    description: 'Rediseño completo de la web corporativa con WordPress',
    status: 'active',
    budget: 15000,
    startDate: '2024-11-01',
    endDate: '2025-02-28',
    color: '#3B82F6'
  },
  {
    id: '2',
    clientId: '1',
    clientName: 'Tech Solutions SL',
    name: 'App Móvil iOS',
    description: 'Desarrollo de aplicación móvil nativa para iOS',
    status: 'active',
    budget: 25000,
    startDate: '2024-10-15',
    endDate: '2025-03-31',
    color: '#10B981'
  },
  {
    id: '3',
    clientId: '2',
    clientName: 'Innovate Digital',
    name: 'Campaña Marketing Digital',
    description: 'Estrategia y ejecución de campaña en redes sociales',
    status: 'completed',
    budget: 8000,
    startDate: '2024-09-01',
    endDate: '2024-11-30',
    color: '#8B5CF6'
  },
  {
    id: '4',
    clientId: '3',
    clientName: 'Creative Agency',
    name: 'Identidad Corporativa',
    description: 'Diseño de logo, branding y manual de identidad',
    status: 'active',
    budget: 5000,
    startDate: '2024-12-01',
    endDate: '2025-01-31',
    color: '#F59E0B'
  }
];

export function renderClients() {
  return `
    <section class="module clients">
      <!-- Tabs para alternar entre Clientes y Proyectos -->
      <div class="module-tabs">
        <button
          id="tab-clients"
          class="tab-button active"
          data-tab="clients"
          type="button"
        >
          Clientes
        </button>
        <button
          id="tab-projects"
          class="tab-button"
          data-tab="projects"
          type="button"
        >
          Proyectos
        </button>
      </div>

      <!-- Panel de Clientes -->
      <div id="clients-panel" class="tab-panel active">
        <div class="module-header">
          <div class="module-title-section">
            <h2>Clientes</h2>
            <p class="module-subtitle">Gestiona tu cartera de clientes</p>
          </div>
          <button id="new-client-btn" class="btn btn-primary" type="button">
            <span class="icon">+</span> Nuevo Cliente
          </button>
        </div>

        <!-- Tarjetas de resumen -->
        <div class="summary-cards">
          <div class="card stat-card">
            <div class="card-icon" style="background: var(--color-primary-light);">👥</div>
            <div class="card-content">
              <span class="card-label">Total Clientes</span>
              <span class="card-value" id="total-clients">0</span>
              <span class="card-trend positive">Activos</span>
            </div>
          </div>

          <div class="card stat-card">
            <div class="card-icon" style="background: var(--color-success-light);">✓</div>
            <div class="card-content">
              <span class="card-label">Clientes Activos</span>
              <span class="card-value" id="active-clients">0</span>
              <span class="card-trend">En este mes</span>
            </div>
          </div>

          <div class="card stat-card">
            <div class="card-icon" style="background: var(--color-info-light);">📊</div>
            <div class="card-content">
              <span class="card-label">Nuevos este mes</span>
              <span class="card-value" id="new-clients">0</span>
              <span class="card-trend">Crecimiento</span>
            </div>
          </div>

          <div class="card stat-card">
            <div class="card-icon" style="background: var(--color-warning-light);">💰</div>
            <div class="card-content">
              <span class="card-label">Facturación Media</span>
              <span class="card-value" id="avg-revenue">€0</span>
              <span class="card-trend">Por cliente</span>
            </div>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filters-section">
          <div class="filters-row">
            <div class="filter-group">
              <label for="client-search">Buscar</label>
              <input
                type="text"
                id="client-search"
                class="filter-input"
                placeholder="Nombre, email, NIF/CIF..."
              />
            </div>

            <div class="filter-group">
              <label for="client-status-filter">Estado</label>
              <select id="client-status-filter" class="filter-select">
                <option value="">Todos</option>
                <option value="true" selected>Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>

            <button id="reset-client-filters" class="btn btn-secondary" type="button">
              Limpiar filtros
            </button>
          </div>
          <div class="filter-results">
            <span id="client-filter-result-count">0 clientes encontrados</span>
          </div>
        </div>

        <!-- Grid de clientes -->
        <div id="clients-grid" class="clients-grid">
          <!-- Los clientes se cargarán aquí -->
        </div>
      </div>

      <!-- Panel de Proyectos -->
      <div id="projects-panel" class="tab-panel" style="display: none;">
        <div class="module-header">
          <div class="module-title-section">
            <h2>Proyectos</h2>
            <p class="module-subtitle">Gestiona tus proyectos activos</p>
          </div>
          <button id="new-project-btn" class="btn btn-primary" type="button">
            <span class="icon">+</span> Nuevo Proyecto
          </button>
        </div>

        <!-- Tarjetas de resumen de proyectos -->
        <div class="summary-cards">
          <div class="card stat-card">
            <div class="card-icon" style="background: var(--color-primary-light);">📁</div>
            <div class="card-content">
              <span class="card-label">Total Proyectos</span>
              <span class="card-value" id="total-projects">0</span>
              <span class="card-trend">En total</span>
            </div>
          </div>

          <div class="card stat-card">
            <div class="card-icon" style="background: var(--color-success-light);">⚡</div>
            <div class="card-content">
              <span class="card-label">Proyectos Activos</span>
              <span class="card-value" id="active-projects">0</span>
              <span class="card-trend">En progreso</span>
            </div>
          </div>

          <div class="card stat-card">
            <div class="card-icon" style="background: var(--color-info-light);">✅</div>
            <div class="card-content">
              <span class="card-label">Completados</span>
              <span class="card-value" id="completed-projects">0</span>
              <span class="card-trend">Este año</span>
            </div>
          </div>

          <div class="card stat-card">
            <div class="card-icon" style="background: var(--color-warning-light);">💰</div>
            <div class="card-content">
              <span class="card-label">Presupuesto Total</span>
              <span class="card-value" id="total-budget">€0</span>
              <span class="card-trend">Activos</span>
            </div>
          </div>
        </div>

        <!-- Filtros de proyectos -->
        <div class="filters-section">
          <div class="filters-row">
            <div class="filter-group">
              <label for="project-search">Buscar</label>
              <input
                type="text"
                id="project-search"
                class="filter-input"
                placeholder="Nombre del proyecto..."
              />
            </div>

            <div class="filter-group">
              <label for="project-status-filter">Estado</label>
              <select id="project-status-filter" class="filter-select">
                <option value="">Todos</option>
                <option value="active" selected>Activos</option>
                <option value="completed">Completados</option>
                <option value="on-hold">En pausa</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="project-client-filter">Cliente</label>
              <select id="project-client-filter" class="filter-select">
                <option value="">Todos los clientes</option>
              </select>
            </div>

            <button id="reset-project-filters" class="btn btn-secondary" type="button">
              Limpiar filtros
            </button>
          </div>
          <div class="filter-results">
            <span id="project-filter-result-count">0 proyectos encontrados</span>
          </div>
        </div>

        <!-- Grid de proyectos -->
        <div id="projects-grid" class="projects-grid">
          <!-- Los proyectos se cargarán aquí -->
        </div>
      </div>
    </section>

    <!-- Modal para añadir/editar cliente -->
    <div id="client-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="client-modal-title">Nuevo Cliente</h3>
          <button class="modal-close" id="close-client-modal" type="button">&times;</button>
        </div>
        <div class="modal-body">
          <form id="client-form">
            <div class="form-section">
              <h4>Datos del Cliente</h4>

              <div class="form-group">
                <label for="client-name">Nombre *</label>
                <input
                  type="text"
                  id="client-name"
                  required
                  placeholder="Nombre de la empresa o persona"
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="client-email">Email</label>
                  <input type="email" id="client-email" placeholder="contacto@cliente.com" />
                </div>

                <div class="form-group">
                  <label for="client-phone">Teléfono</label>
                  <input type="tel" id="client-phone" placeholder="+34 XXX XXX XXX" />
                </div>
              </div>

              <div class="form-group">
                <label for="client-nif">NIF/CIF</label>
                <input type="text" id="client-nif" placeholder="B12345678" />
              </div>
            </div>

            <div class="form-section">
              <h4>Dirección</h4>

              <div class="form-group">
                <label for="client-address">Dirección</label>
                <input type="text" id="client-address" placeholder="Calle, número, piso..." />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="client-city">Ciudad</label>
                  <input type="text" id="client-city" placeholder="Madrid" />
                </div>

                <div class="form-group">
                  <label for="client-postal">Código Postal</label>
                  <input type="text" id="client-postal" placeholder="28001" />
                </div>
              </div>

              <div class="form-group">
                <label for="client-country">País</label>
                <input type="text" id="client-country" value="España" />
              </div>
            </div>

            <div class="form-section">
              <h4>Información Adicional</h4>

              <div class="form-group">
                <label for="client-notes">Notas</label>
                <textarea
                  id="client-notes"
                  rows="3"
                  placeholder="Información adicional sobre el cliente..."
                ></textarea>
              </div>

              <div class="form-group checkbox-group">
                <label>
                  <input type="checkbox" id="client-is-active" checked />
                  Cliente activo
                </label>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" id="cancel-client-btn" class="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary">
                Guardar Cliente
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal para añadir/editar proyecto -->
    <div id="project-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="project-modal-title">Nuevo Proyecto</h3>
          <button class="modal-close" id="close-project-modal" type="button">&times;</button>
        </div>
        <div class="modal-body">
          <form id="project-form">
            <div class="form-section">
              <h4>Datos del Proyecto</h4>

              <div class="form-group">
                <label for="project-name">Nombre del Proyecto *</label>
                <input
                  type="text"
                  id="project-name"
                  required
                  placeholder="Ej: Desarrollo Web Corporativa"
                />
              </div>

              <div class="form-group">
                <label for="project-client">Cliente *</label>
                <select id="project-client" required>
                  <option value="">Seleccionar cliente</option>
                </select>
              </div>

              <div class="form-group">
                <label for="project-description">Descripción</label>
                <textarea
                  id="project-description"
                  rows="3"
                  placeholder="Describe el proyecto..."
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="project-status">Estado</label>
                  <select id="project-status">
                    <option value="active" selected>Activo</option>
                    <option value="completed">Completado</option>
                    <option value="on-hold">En pausa</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="project-budget">Presupuesto (€)</label>
                  <input
                    type="number"
                    id="project-budget"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div class="form-section">
              <h4>Fechas</h4>

              <div class="form-row">
                <div class="form-group">
                  <label for="project-start-date">Fecha de inicio</label>
                  <input type="date" id="project-start-date" />
                </div>

                <div class="form-group">
                  <label for="project-end-date">Fecha de finalización</label>
                  <input type="date" id="project-end-date" />
                </div>
              </div>
            </div>

            <div class="form-section">
              <h4>Visual</h4>

              <div class="form-group">
                <label for="project-color">Color del Proyecto</label>
                <input type="color" id="project-color" value="#3B82F6" />
                <small>Selecciona un color para identificar visualmente el proyecto</small>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" id="cancel-project-btn" class="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary">
                Guardar Proyecto
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

// Inicializar la página de clientes
export function initClients() {
  attachTabEventListeners();
  loadClients();
  loadProjects();
  attachClientEventListeners();
  attachProjectEventListeners();
  updateClientSummaryCards();
  updateProjectSummaryCards();
  populateClientFilters();
}

// Event listeners para tabs
function attachTabEventListeners() {
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const tab = e.target.dataset.tab;
      switchTab(tab);
    });
  });
}

// Cambiar entre tabs
function switchTab(tabName) {
  // Actualizar botones
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Actualizar paneles
  document.getElementById('clients-panel').style.display = tabName === 'clients' ? 'block' : 'none';
  document.getElementById('projects-panel').style.display = tabName === 'projects' ? 'block' : 'none';
}

// Cargar clientes
function loadClients() {
  renderClientsGrid(demoClients);
  updateClientFilterCount(demoClients.length);
}

// Renderizar grid de clientes
function renderClientsGrid(clients) {
  const grid = document.getElementById('clients-grid');
  if (!grid) return;

  if (clients.length === 0) {
    grid.innerHTML = `
      <div class="empty-state-card">
        <h3>No hay clientes</h3>
        <p>Añade tu primer cliente para empezar a gestionar tu cartera.</p>
        <button class="btn btn-primary" onclick="document.getElementById('new-client-btn').click()">
          Añadir Cliente
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = clients.map(client => `
    <div class="client-card" data-client-id="${client.id}">
      <div class="client-card-header">
        <div class="client-avatar">${client.name.charAt(0)}</div>
        <div class="client-info">
          <h3>${client.name}</h3>
          <p>${client.email || 'Sin email'}</p>
        </div>
        <div class="client-status">
          ${client.isActive ?
            '<span class="badge badge-success">Activo</span>' :
            '<span class="badge badge-error">Inactivo</span>'
          }
        </div>
      </div>
      <div class="client-card-body">
        <div class="client-detail">
          <span class="detail-label">NIF/CIF:</span>
          <span class="detail-value">${client.nifCif || '-'}</span>
        </div>
        <div class="client-detail">
          <span class="detail-label">Teléfono:</span>
          <span class="detail-value">${client.phone || '-'}</span>
        </div>
        <div class="client-detail">
          <span class="detail-label">Ciudad:</span>
          <span class="detail-value">${client.city || '-'}</span>
        </div>
        ${client.notes ? `
          <div class="client-detail">
            <span class="detail-label">Notas:</span>
            <span class="detail-value">${client.notes}</span>
          </div>
        ` : ''}
      </div>
      <div class="client-card-footer">
        <button
          class="btn btn-sm btn-secondary"
          data-action="view-client"
          data-id="${client.id}"
        >
          Ver Detalles
        </button>
        <button
          class="btn btn-sm btn-secondary"
          data-action="edit-client"
          data-id="${client.id}"
        >
          Editar
        </button>
        <button
          class="btn btn-sm btn-danger"
          data-action="delete-client"
          data-id="${client.id}"
        >
          Eliminar
        </button>
      </div>
    </div>
  `).join('');
}

// Cargar proyectos
function loadProjects() {
  renderProjectsGrid(demoProjects);
  updateProjectFilterCount(demoProjects.length);
}

// Renderizar grid de proyectos
function renderProjectsGrid(projects) {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  if (projects.length === 0) {
    grid.innerHTML = `
      <div class="empty-state-card">
        <h3>No hay proyectos</h3>
        <p>Crea tu primer proyecto para empezar a organizar tu trabajo.</p>
        <button class="btn btn-primary" onclick="document.getElementById('new-project-btn').click()">
          Crear Proyecto
        </button>
      </div>
    `;
    return;
  }

  const statusLabels = {
    active: 'Activo',
    completed: 'Completado',
    'on-hold': 'En pausa',
    cancelled: 'Cancelado'
  };

  const statusColors = {
    active: 'success',
    completed: 'info',
    'on-hold': 'warning',
    cancelled: 'error'
  };

  grid.innerHTML = projects.map(project => `
    <div class="project-card" data-project-id="${project.id}">
      <div class="project-color-bar" style="background: ${project.color}"></div>
      <div class="project-card-header">
        <h3>${project.name}</h3>
        <span class="badge badge-${statusColors[project.status]}">${statusLabels[project.status]}</span>
      </div>
      <div class="project-card-body">
        <p class="project-client">Cliente: <strong>${project.clientName}</strong></p>
        <p class="project-description">${project.description || 'Sin descripción'}</p>
        <div class="project-meta">
          <div class="meta-item">
            <span class="meta-label">Presupuesto:</span>
            <span class="meta-value">€${project.budget?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Inicio:</span>
            <span class="meta-value">${formatDate(project.startDate)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Fin:</span>
            <span class="meta-value">${formatDate(project.endDate)}</span>
          </div>
        </div>
      </div>
      <div class="project-card-footer">
        <button
          class="btn btn-sm btn-secondary"
          data-action="view-project"
          data-id="${project.id}"
        >
          Ver Detalles
        </button>
        <button
          class="btn btn-sm btn-secondary"
          data-action="edit-project"
          data-id="${project.id}"
        >
          Editar
        </button>
        <button
          class="btn btn-sm btn-danger"
          data-action="delete-project"
          data-id="${project.id}"
        >
          Eliminar
        </button>
      </div>
    </div>
  `).join('');
}

// Actualizar tarjetas de resumen de clientes
function updateClientSummaryCards() {
  const totalClients = demoClients.length;
  const activeClients = demoClients.filter(c => c.isActive).length;

  const currentMonth = new Date().getMonth();
  const newClients = demoClients.filter(c => {
    const clientMonth = new Date(c.created_at).getMonth();
    return clientMonth === currentMonth;
  }).length;

  document.getElementById('total-clients').textContent = totalClients;
  document.getElementById('active-clients').textContent = activeClients;
  document.getElementById('new-clients').textContent = newClients;
  document.getElementById('avg-revenue').textContent = '€2,450';
}

// Actualizar tarjetas de resumen de proyectos
function updateProjectSummaryCards() {
  const totalProjects = demoProjects.length;
  const activeProjects = demoProjects.filter(p => p.status === 'active').length;
  const completedProjects = demoProjects.filter(p => p.status === 'completed').length;
  const totalBudget = demoProjects
    .filter(p => p.status === 'active')
    .reduce((sum, p) => sum + (p.budget || 0), 0);

  document.getElementById('total-projects').textContent = totalProjects;
  document.getElementById('active-projects').textContent = activeProjects;
  document.getElementById('completed-projects').textContent = completedProjects;
  document.getElementById('total-budget').textContent = `€${totalBudget.toFixed(2)}`;
}

// Poblar filtros de clientes en el formulario de proyectos
function populateClientFilters() {
  const projectClientSelect = document.getElementById('project-client');
  const projectClientFilter = document.getElementById('project-client-filter');

  if (projectClientSelect) {
    projectClientSelect.innerHTML = '<option value="">Seleccionar cliente</option>' +
      demoClients.filter(c => c.isActive).map(client =>
        `<option value="${client.id}">${client.name}</option>`
      ).join('');
  }

  if (projectClientFilter) {
    projectClientFilter.innerHTML = '<option value="">Todos los clientes</option>' +
      demoClients.map(client =>
        `<option value="${client.id}">${client.name}</option>`
      ).join('');
  }
}

// Event listeners para clientes
function attachClientEventListeners() {
  // Nuevo cliente
  document.getElementById('new-client-btn')?.addEventListener('click', openClientModal);

  // Cerrar modal
  document.getElementById('close-client-modal')?.addEventListener('click', closeClientModal);
  document.getElementById('cancel-client-btn')?.addEventListener('click', closeClientModal);

  // Formulario
  document.getElementById('client-form')?.addEventListener('submit', handleClientSubmit);

  // Filtros
  document.getElementById('client-search')?.addEventListener('input', applyClientFilters);
  document.getElementById('client-status-filter')?.addEventListener('change', applyClientFilters);
  document.getElementById('reset-client-filters')?.addEventListener('click', resetClientFilters);

  // Acciones
  document.getElementById('clients-grid')?.addEventListener('click', handleClientAction);
}

// Event listeners para proyectos
function attachProjectEventListeners() {
  // Nuevo proyecto
  document.getElementById('new-project-btn')?.addEventListener('click', openProjectModal);

  // Cerrar modal
  document.getElementById('close-project-modal')?.addEventListener('click', closeProjectModal);
  document.getElementById('cancel-project-btn')?.addEventListener('click', closeProjectModal);

  // Formulario
  document.getElementById('project-form')?.addEventListener('submit', handleProjectSubmit);

  // Filtros
  document.getElementById('project-search')?.addEventListener('input', applyProjectFilters);
  document.getElementById('project-status-filter')?.addEventListener('change', applyProjectFilters);
  document.getElementById('project-client-filter')?.addEventListener('change', applyProjectFilters);
  document.getElementById('reset-project-filters')?.addEventListener('click', resetProjectFilters);

  // Acciones
  document.getElementById('projects-grid')?.addEventListener('click', handleProjectAction);
}

// Modals
function openClientModal(client = null) {
  const modal = document.getElementById('client-modal');
  const title = document.getElementById('client-modal-title');
  const form = document.getElementById('client-form');

  if (!modal || !form) return;

  if (client) {
    title.textContent = 'Editar Cliente';
    // TODO: Rellenar formulario
  } else {
    title.textContent = 'Nuevo Cliente';
    form.reset();
  }

  modal.style.display = 'flex';
}

function closeClientModal() {
  document.getElementById('client-modal').style.display = 'none';
}

function openProjectModal(project = null) {
  const modal = document.getElementById('project-modal');
  const title = document.getElementById('project-modal-title');
  const form = document.getElementById('project-form');

  if (!modal || !form) return;

  if (project) {
    title.textContent = 'Editar Proyecto';
    // TODO: Rellenar formulario
  } else {
    title.textContent = 'Nuevo Proyecto';
    form.reset();
  }

  modal.style.display = 'flex';
}

function closeProjectModal() {
  document.getElementById('project-modal').style.display = 'none';
}

// Formularios
function handleClientSubmit(e) {
  e.preventDefault();

  const clientData = {
    name: document.getElementById('client-name').value,
    email: document.getElementById('client-email').value,
    phone: document.getElementById('client-phone').value,
    nifCif: document.getElementById('client-nif').value,
    address: document.getElementById('client-address').value,
    city: document.getElementById('client-city').value,
    postalCode: document.getElementById('client-postal').value,
    country: document.getElementById('client-country').value,
    notes: document.getElementById('client-notes').value,
    isActive: document.getElementById('client-is-active').checked
  };

  console.log('Nuevo cliente:', clientData);
  // TODO: Enviar a la API

  alert('Cliente añadido correctamente (Demo)');
  closeClientModal();
}

function handleProjectSubmit(e) {
  e.preventDefault();

  const projectData = {
    clientId: document.getElementById('project-client').value,
    name: document.getElementById('project-name').value,
    description: document.getElementById('project-description').value,
    status: document.getElementById('project-status').value,
    budget: parseFloat(document.getElementById('project-budget').value),
    startDate: document.getElementById('project-start-date').value,
    endDate: document.getElementById('project-end-date').value,
    color: document.getElementById('project-color').value
  };

  console.log('Nuevo proyecto:', projectData);
  // TODO: Enviar a la API

  alert('Proyecto creado correctamente (Demo)');
  closeProjectModal();
}

// Filtros
function applyClientFilters() {
  const search = document.getElementById('client-search')?.value.toLowerCase() || '';
  const status = document.getElementById('client-status-filter')?.value || '';

  const filtered = demoClients.filter(client => {
    const matchesSearch = !search ||
      client.name.toLowerCase().includes(search) ||
      client.email?.toLowerCase().includes(search) ||
      client.nifCif?.toLowerCase().includes(search);

    const matchesStatus = !status || client.isActive.toString() === status;

    return matchesSearch && matchesStatus;
  });

  renderClientsGrid(filtered);
  updateClientFilterCount(filtered.length);
}

function resetClientFilters() {
  document.getElementById('client-search').value = '';
  document.getElementById('client-status-filter').value = '';
  applyClientFilters();
}

function updateClientFilterCount(count) {
  const countElement = document.getElementById('client-filter-result-count');
  if (countElement) {
    countElement.textContent = `${count} cliente${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
  }
}

function applyProjectFilters() {
  const search = document.getElementById('project-search')?.value.toLowerCase() || '';
  const status = document.getElementById('project-status-filter')?.value || '';
  const clientId = document.getElementById('project-client-filter')?.value || '';

  const filtered = demoProjects.filter(project => {
    const matchesSearch = !search ||
      project.name.toLowerCase().includes(search) ||
      project.description?.toLowerCase().includes(search);

    const matchesStatus = !status || project.status === status;
    const matchesClient = !clientId || project.clientId === clientId;

    return matchesSearch && matchesStatus && matchesClient;
  });

  renderProjectsGrid(filtered);
  updateProjectFilterCount(filtered.length);
}

function resetProjectFilters() {
  document.getElementById('project-search').value = '';
  document.getElementById('project-status-filter').value = '';
  document.getElementById('project-client-filter').value = '';
  applyProjectFilters();
}

function updateProjectFilterCount(count) {
  const countElement = document.getElementById('project-filter-result-count');
  if (countElement) {
    countElement.textContent = `${count} proyecto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
  }
}

// Acciones
function handleClientAction(e) {
  const button = e.target.closest('[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const clientId = button.dataset.id;

  switch (action) {
    case 'view-client':
      alert(`Ver detalles del cliente ${clientId}`);
      break;
    case 'edit-client':
      const client = demoClients.find(c => c.id === clientId);
      openClientModal(client);
      break;
    case 'delete-client':
      if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
        console.log('Eliminar cliente:', clientId);
        // TODO: Implementar eliminación
      }
      break;
  }
}

function handleProjectAction(e) {
  const button = e.target.closest('[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const projectId = button.dataset.id;

  switch (action) {
    case 'view-project':
      alert(`Ver detalles del proyecto ${projectId}`);
      break;
    case 'edit-project':
      const project = demoProjects.find(p => p.id === projectId);
      openProjectModal(project);
      break;
    case 'delete-project':
      if (confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
        console.log('Eliminar proyecto:', projectId);
        // TODO: Implementar eliminación
      }
      break;
  }
}

// Utilidades
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default renderClients;
