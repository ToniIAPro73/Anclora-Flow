// Modal de Autenticación (Login/Registro)
// Se abre desde el menú de usuario cuando no está autenticado

export function renderAuthModal() {
  return `
    <div id="auth-modal" class="modal" aria-hidden="true" role="dialog" aria-labelledby="auth-modal-title">
      <div class="modal__backdrop" data-modal-dismiss></div>
      <div class="modal__panel" role="document">
        <header class="modal__head">
          <h2 id="auth-modal-title">Iniciar Sesión</h2>
          <button class="modal__close" data-modal-dismiss aria-label="Cerrar modal">×</button>
        </header>

        <!-- Tabs para Login/Registro -->
        <div class="auth-tabs">
          <button class="auth-tab auth-tab--active" data-auth-tab="login">Iniciar Sesión</button>
          <button class="auth-tab" data-auth-tab="register">Crear Cuenta</button>
        </div>

        <!-- Formulario de Login -->
        <div id="login-form-container" class="auth-form-container">
          <div class="modal__body">
            <div id="auth-alert" class="alert" style="display: none;"></div>

            <form id="login-form">
              <div class="form-group">
                <label for="login-email">Correo electrónico</label>
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  placeholder="tu@email.com"
                  required
                  autocomplete="email"
                />
              </div>

              <div class="form-group">
                <label for="login-password">Contraseña</label>
                <input
                  type="password"
                  id="login-password"
                  name="password"
                  placeholder="••••••••"
                  required
                  autocomplete="current-password"
                />
              </div>

              <button type="submit" class="btn-primary btn-block" id="login-submit">
                Iniciar Sesión
              </button>
            </form>
          </div>
        </div>

        <!-- Formulario de Registro -->
        <div id="register-form-container" class="auth-form-container" style="display: none;">
          <div class="modal__body">
            <div id="register-alert" class="alert" style="display: none;"></div>

            <form id="register-form">
              <div class="form-group">
                <label for="register-name">Nombre completo</label>
                <input
                  type="text"
                  id="register-name"
                  name="name"
                  placeholder="Juan Pérez"
                  required
                  autocomplete="name"
                />
              </div>

              <div class="form-group">
                <label for="register-email">Correo electrónico</label>
                <input
                  type="email"
                  id="register-email"
                  name="email"
                  placeholder="tu@email.com"
                  required
                  autocomplete="email"
                />
              </div>

              <div class="form-group">
                <label for="register-nif">NIF / CIF (opcional)</label>
                <input
                  type="text"
                  id="register-nif"
                  name="nif"
                  placeholder="12345678A"
                  autocomplete="off"
                />
              </div>

              <div class="form-group">
                <label for="register-password">Contraseña</label>
                <input
                  type="password"
                  id="register-password"
                  name="password"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minlength="6"
                  autocomplete="new-password"
                />
              </div>

              <div class="form-group">
                <label for="register-confirm-password">Confirmar contraseña</label>
                <input
                  type="password"
                  id="register-confirm-password"
                  name="confirmPassword"
                  placeholder="Repite la contraseña"
                  required
                  autocomplete="new-password"
                />
              </div>

              <button type="submit" class="btn-primary btn-block" id="register-submit">
                Crear Cuenta
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <style>
      .auth-tabs {
        display: flex;
        border-bottom: 2px solid var(--color-border, #e2e8f0);
        margin-bottom: 1.5rem;
      }

      .auth-tab {
        flex: 1;
        padding: 1rem;
        background: none;
        border: none;
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text-secondary, #718096);
        cursor: pointer;
        transition: all 0.2s;
        border-bottom: 3px solid transparent;
        margin-bottom: -2px;
      }

      .auth-tab:hover {
        color: var(--color-primary, #667eea);
      }

      .auth-tab--active {
        color: var(--color-primary, #667eea);
        border-bottom-color: var(--color-primary, #667eea);
      }

      .auth-form-container {
        animation: fadeIn 0.3s ease-in;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .form-group {
        margin-bottom: 1.25rem;
      }

      .form-group label {
        display: block;
        font-weight: 600;
        color: var(--color-text, #2d3748);
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
      }

      .form-group input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid var(--color-border, #e2e8f0);
        border-radius: 8px;
        font-size: 1rem;
        transition: all 0.2s;
        background: var(--color-surface, white);
        color: var(--color-text, #2d3748);
      }

      .form-group input:focus {
        outline: none;
        border-color: var(--color-primary, #667eea);
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .btn-block {
        width: 100%;
        margin-top: 1rem;
      }

      .alert {
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }

      .alert--success {
        background-color: #c6f6d5;
        color: #2f855a;
        border: 1px solid #9ae6b4;
      }

      .alert--error {
        background-color: #fed7d7;
        color: #c53030;
        border: 1px solid #fc8181;
      }

      .spinner {
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top: 2px solid white;
        width: 16px;
        height: 16px;
        animation: spin 1s linear infinite;
        display: inline-block;
        margin-right: 0.5rem;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
}

export function initAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal || modal.dataset.initialized === 'true') return;

  const loginTab = modal.querySelector('[data-auth-tab="login"]');
  const registerTab = modal.querySelector('[data-auth-tab="register"]');
  const loginContainer = modal.querySelector('#login-form-container');
  const registerContainer = modal.querySelector('#register-form-container');
  const loginForm = modal.querySelector('#login-form');
  const registerForm = modal.querySelector('#register-form');

  // Cambio de tabs
  function showLoginForm() {
    loginTab.classList.add('auth-tab--active');
    registerTab.classList.remove('auth-tab--active');
    loginContainer.style.display = 'block';
    registerContainer.style.display = 'none';
    modal.querySelector('#auth-modal-title').textContent = 'Iniciar Sesión';
  }

  function showRegisterForm() {
    registerTab.classList.add('auth-tab--active');
    loginTab.classList.remove('auth-tab--active');
    registerContainer.style.display = 'block';
    loginContainer.style.display = 'none';
    modal.querySelector('#auth-modal-title').textContent = 'Crear Cuenta';
  }

  loginTab.addEventListener('click', showLoginForm);
  registerTab.addEventListener('click', showRegisterForm);

  // Función para mostrar alertas
  function showAlert(containerId, message, type = 'error') {
    const alert = document.getElementById(containerId);
    alert.textContent = message;
    alert.className = `alert alert--${type}`;
    alert.style.display = 'block';
    setTimeout(() => {
      alert.style.display = 'none';
    }, 5000);
  }

  // Manejar login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit');

    if (!email || !password) {
      showAlert('auth-alert', 'Por favor, completa todos los campos');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span>Iniciando sesión...';

    try {
      await window.api.login(email, password);

      showAlert('auth-alert', '¡Inicio de sesión exitoso!', 'success');

      // Recargar la página para actualizar la UI
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error) {
      console.error('Error de login:', error);

      let errorMessage = 'Error al iniciar sesión';

      if (error.status === 401) {
        errorMessage = 'Correo o contraseña incorrectos';
      } else if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor';
      } else if (error.data && error.data.error) {
        errorMessage = error.data.error;
      }

      showAlert('auth-alert', errorMessage);
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Iniciar Sesión';
    }
  });

  // Manejar registro
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const nif = document.getElementById('register-nif').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const submitBtn = document.getElementById('register-submit');

    // Validaciones
    if (!name || !email || !password) {
      showAlert('register-alert', 'Por favor, completa todos los campos obligatorios');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('register-alert', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      showAlert('register-alert', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span>Creando cuenta...';

    try {
      const userData = { name, email, password };
      if (nif) userData.nif = nif;

      await window.api.register(userData);

      showAlert('register-alert', '¡Cuenta creada exitosamente!', 'success');

      // Recargar la página para actualizar la UI
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error) {
      console.error('Error de registro:', error);

      let errorMessage = 'Error al crear la cuenta';

      if (error.status === 409) {
        errorMessage = 'El correo electrónico ya está registrado';
      } else if (error.status === 400) {
        errorMessage = 'Datos inválidos. Por favor, verifica la información';
      } else if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor';
      } else if (error.data && error.data.error) {
        errorMessage = error.data.error;
      }

      showAlert('register-alert', errorMessage);
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Crear Cuenta';
    }
  });

  modal.dataset.initialized = 'true';
}

export function openAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  initAuthModal();

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-lock-scroll');

  // Focus en el primer input
  const firstInput = modal.querySelector('input');
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 100);
  }
}

export function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-lock-scroll');
}

export default {
  renderAuthModal,
  initAuthModal,
  openAuthModal,
  closeAuthModal
};
