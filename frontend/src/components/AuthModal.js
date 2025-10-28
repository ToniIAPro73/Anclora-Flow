const VIEW_LOGIN = 'login';
const VIEW_REGISTER = 'register';
const VIEW_RECOVER = 'recover';
const VIEW_RESET = 'reset';

function getAuthBaseUrl() {
  if (window?.api?.getBaseUrl) {
    const base = window.api.getBaseUrl();
    return base.replace(/\/api$/, '/api/auth');
  }
  return 'http://localhost:8020/api/auth';
}

export function renderAuthModal() {
  return `
    <div id="auth-modal" class="auth-modal" aria-hidden="true" aria-labelledby="auth-modal-title" role="dialog">
      <div class="auth-modal__backdrop" data-modal-dismiss></div>
      <section class="auth-modal__panel" role="document">
        <button class="auth-modal__close" data-modal-dismiss aria-label="Cerrar">×</button>
        <aside class="auth-modal__hero">
          <div class="auth-modal__hero-gradient"></div>
          <div class="auth-modal__hero-content">
            <span class="auth-modal__hero-badge">Anclora Flow</span>
            <h2 id="auth-modal-title" class="auth-modal__title">Bienvenido a bordo</h2>
            <p class="auth-modal__subtitle" data-auth-subtitle>
              Gestiona tus ingresos y gastos con nuestra suite colaborativa.
            </p>
            <ul class="auth-modal__highlights">
              <li>Panel financiero en tiempo real</li>
              <li>Integraciones con clientes y proyectos</li>
              <li>Seguridad empresarial de extremo a extremo</li>
            </ul>
          </div>
        </aside>
        <div class="auth-modal__content">
          <header class="auth-modal__tabs" data-auth-tabs role="tablist">
            <button type="button" class="auth-modal__tab is-active" data-auth-tab="${VIEW_LOGIN}" aria-selected="true" role="tab">
              Iniciar sesión
            </button>
            <button type="button" class="auth-modal__tab" data-auth-tab="${VIEW_REGISTER}" aria-selected="false" role="tab">
              Crear cuenta
            </button>
          </header>

          <div class="auth-modal__alert" data-auth-alert hidden></div>

          <div class="auth-modal__social">
            <button type="button" class="auth-modal__social-btn" data-auth-provider="google">
              <span class="auth-modal__social-icon auth-modal__social-icon--google">G</span>
              Continuar con Google
            </button>
            <button type="button" class="auth-modal__social-btn" data-auth-provider="github">
              <span class="auth-modal__social-icon auth-modal__social-icon--github">GH</span>
              Continuar con GitHub
            </button>
          </div>

          <div class="auth-modal__divider"><span>o con tu correo</span></div>

          <form id="auth-login-form" data-auth-view="${VIEW_LOGIN}" novalidate>
            <div class="auth-modal__field">
              <label for="auth-login-email">Correo electrónico</label>
              <input id="auth-login-email" name="email" type="email" autocomplete="email" required placeholder="tu@email.com" />
            </div>
            <div class="auth-modal__field">
              <label for="auth-login-password">Contraseña</label>
              <input id="auth-login-password" name="password" type="password" autocomplete="current-password" required placeholder="••••••••" />
            </div>
            <div class="auth-modal__form-actions">
              <button type="submit" class="auth-modal__submit">Entrar</button>
              <button type="button" class="auth-modal__link" data-auth-switch="${VIEW_RECOVER}">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>

          <form id="auth-register-form" data-auth-view="${VIEW_REGISTER}" hidden novalidate>
            <div class="auth-modal__row">
              <div class="auth-modal__field">
                <label for="auth-register-first">Nombre</label>
                <input id="auth-register-first" name="firstName" type="text" autocomplete="given-name" required placeholder="Nombre" />
              </div>
              <div class="auth-modal__field">
                <label for="auth-register-last">Apellidos</label>
                <input id="auth-register-last" name="lastName" type="text" autocomplete="family-name" required placeholder="Apellidos" />
              </div>
            </div>
            <div class="auth-modal__field">
              <label for="auth-register-company">Empresa</label>
              <input id="auth-register-company" name="company" type="text" autocomplete="organization" required placeholder="Nombre de tu empresa" />
            </div>
            <div class="auth-modal__field">
              <label for="auth-register-email">Correo electrónico</label>
              <input id="auth-register-email" name="email" type="email" autocomplete="email" required placeholder="empresa@correo.com" />
            </div>
            <div class="auth-modal__field">
              <label for="auth-register-phone">Teléfono</label>
              <input id="auth-register-phone" name="phone" type="tel" autocomplete="tel" required placeholder="+34 600 000 000" />
            </div>
            <div class="auth-modal__row">
              <div class="auth-modal__field">
                <label for="auth-register-password">Contraseña</label>
                <input id="auth-register-password" name="password" type="password" autocomplete="new-password" required placeholder="Mínimo 8 caracteres" minlength="8" />
              </div>
              <div class="auth-modal__field">
                <label for="auth-register-confirm">Confirmar contraseña</label>
                <input id="auth-register-confirm" name="confirmPassword" type="password" autocomplete="new-password" required placeholder="Repite la contraseña" minlength="8" />
              </div>
            </div>
            <p class="auth-modal__legal">
              Al registrarte aceptas recibir un correo para confirmar tu cuenta.
            </p>
            <button type="submit" class="auth-modal__submit">Crear cuenta</button>
          </form>

          <form id="auth-recover-form" data-auth-view="${VIEW_RECOVER}" hidden novalidate>
            <div class="auth-modal__field">
              <label for="auth-recover-email">Correo electrónico</label>
              <input id="auth-recover-email" name="email" type="email" autocomplete="email" required placeholder="tu@email.com" />
            </div>
            <p class="auth-modal__hint">
              Te enviaremos un enlace temporal para crear una nueva contraseña.
            </p>
            <div class="auth-modal__form-actions">
              <button type="submit" class="auth-modal__submit">Enviar enlace</button>
              <button type="button" class="auth-modal__link" data-auth-switch="${VIEW_LOGIN}">
                Volver a iniciar sesión
              </button>
            </div>
          </form>

          <form id="auth-reset-form" data-auth-view="${VIEW_RESET}" hidden novalidate>
            <input type="hidden" data-reset-token />
            <div class="auth-modal__field">
              <label for="auth-reset-password">Nueva contraseña</label>
              <input id="auth-reset-password" name="password" type="password" autocomplete="new-password" required placeholder="Mínimo 8 caracteres" minlength="8" />
            </div>
            <div class="auth-modal__field">
              <label for="auth-reset-confirm">Confirmar contraseña</label>
              <input id="auth-reset-confirm" name="confirmPassword" type="password" autocomplete="new-password" required placeholder="Repite la contraseña" minlength="8" />
            </div>
            <p class="auth-modal__hint">
              El enlace expira en unos minutos. Usa una contraseña segura que no hayas empleado antes.
            </p>
            <div class="auth-modal__form-actions">
              <button type="submit" class="auth-modal__submit">Actualizar contraseña</button>
              <button type="button" class="auth-modal__link" data-auth-switch="${VIEW_LOGIN}">
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>

    <style>
      .auth-modal {
        position: fixed;
        inset: 0;
        z-index: 120;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 2rem;
      }

      .auth-modal.is-open {
        display: flex;
      }

      .auth-modal__backdrop {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.5);
        backdrop-filter: blur(6px);
      }

      .auth-modal__panel {
        position: relative;
        display: grid;
        grid-template-columns: minmax(260px, 320px) minmax(320px, 360px);
        background: var(--bg-primary);
        border-radius: 22px;
        overflow: hidden;
        box-shadow: var(--shadow-lg);
        z-index: 1;
        max-width: 840px;
        width: 100%;
      }

      .auth-modal__close {
        position: absolute;
        top: 16px;
        right: 16px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        color: #fff;
        font-size: 20px;
        cursor: pointer;
        transition: background 0.2s ease;
        z-index: 2;
      }

      .auth-modal__close:hover {
        background: rgba(255, 255, 255, 0.35);
      }

      .auth-modal__hero {
        position: relative;
        padding: 2.5rem;
        background: linear-gradient(160deg, var(--primary-600), var(--secondary-500) 55%, var(--accent-500));
        color: #fff;
        display: flex;
        flex-direction: column;
      }

      .auth-modal__hero-gradient {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.2), transparent 55%);
        opacity: 0.9;
      }

      .auth-modal__hero-content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
      }

      .auth-modal__hero-badge {
        display: inline-flex;
        align-self: flex-start;
        padding: 0.35rem 0.75rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.16);
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .auth-modal__title {
        margin: 0;
        font-size: 2rem;
        font-weight: 600;
        line-height: 1.2;
      }

      .auth-modal__subtitle {
        margin: 0;
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.9);
      }

      .auth-modal__highlights {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 0.6rem;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.85);
      }

      .auth-modal__highlights li::before {
        content: '•';
        margin-right: 0.4rem;
      }

      .auth-modal__content {
        padding: 2.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        background: var(--bg-primary);
      }

      .auth-modal__tabs {
        display: inline-flex;
        background: var(--bg-secondary);
        border-radius: 999px;
        padding: 0.25rem;
        gap: 0.25rem;
      }

      .auth-modal__tab {
        border: none;
        background: transparent;
      padding: 0.65rem 1.25rem;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--text-secondary);
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease;
    }

    .auth-modal__tab.is-active {
      background: var(--gradient-button);
      color: #fff;
      box-shadow: 0 8px 16px rgba(51, 102, 255, 0.25);
    }

    .auth-modal__tabs.is-disabled {
      opacity: 0.65;
      pointer-events: none;
    }

      .auth-modal__alert {
        border-radius: 14px;
        padding: 0.9rem 1rem;
        font-size: 0.9rem;
        font-weight: 500;
        border: 1px solid transparent;
      }

      .auth-modal__alert[data-variant="error"] {
        background: rgba(239, 68, 68, 0.12);
        border-color: rgba(239, 68, 68, 0.3);
        color: var(--danger);
      }

      .auth-modal__alert[data-variant="success"] {
        background: rgba(20, 184, 166, 0.12);
        border-color: rgba(20, 184, 166, 0.35);
        color: var(--success);
      }

      .auth-modal__alert[data-variant="info"] {
        background: rgba(51, 102, 255, 0.12);
        border-color: rgba(51, 102, 255, 0.3);
        color: var(--info);
      }

      .auth-modal__social {
        display: grid;
        gap: 0.65rem;
      }

      .auth-modal__social-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        width: 100%;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }

      .auth-modal__social-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
      }

      .auth-modal__social-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        font-size: 0.85rem;
        font-weight: 700;
      }

      .auth-modal__social-icon--google {
        color: var(--primary-500);
        border: 1px solid rgba(51, 102, 255, 0.35);
        background: rgba(51, 102, 255, 0.08);
      }

      .auth-modal__social-icon--github {
        color: var(--text-primary);
        border: 1px solid rgba(15, 23, 42, 0.2);
        background: rgba(15, 23, 42, 0.06);
      }

      .auth-modal__divider {
        display: flex;
        align-items: center;
        gap: 1rem;
        color: var(--text-muted);
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .auth-modal__divider::before,
      .auth-modal__divider::after {
        content: "";
        flex: 1;
        height: 1px;
        background: var(--border-color);
      }

      form[data-auth-view] {
        display: grid;
        gap: 1rem;
      }

      [hidden] {
        display: none !important;
      }

      .auth-modal__row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
      }

      .auth-modal__field {
        display: grid;
        gap: 0.4rem;
      }

      .auth-modal__field label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-secondary);
      }

      .auth-modal__field input {
        border-radius: 12px;
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
        padding: 0.75rem 1rem;
        font-size: 0.95rem;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .auth-modal__field input:focus {
        outline: none;
        border-color: rgba(51, 102, 255, 0.6);
        box-shadow: 0 0 0 3px rgba(51, 102, 255, 0.18);
      }

      .auth-modal__submit {
        padding: 0.85rem 1rem;
        border-radius: 12px;
        border: none;
        background: var(--gradient-button);
        color: #fff;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.2s ease;
      }

      .auth-modal__submit:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 20px rgba(51, 102, 255, 0.25);
      }

      .auth-modal__submit[disabled] {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      .auth-modal__link {
        border: none;
        background: none;
        color: var(--primary-500);
        font-weight: 600;
        cursor: pointer;
        padding: 0;
        font-size: 0.9rem;
      }

      .auth-modal__form-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }

      .auth-modal__legal {
        margin: 0;
        font-size: 0.8rem;
        color: var(--text-muted);
      }

      .auth-modal__hint {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-secondary);
      }

      .auth-modal__spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-top-color: #fff;
        border-radius: 50%;
        animation: auth-spin 0.9s linear infinite;
        display: inline-block;
        vertical-align: middle;
        margin-right: 0.5rem;
      }

      @keyframes auth-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 880px) {
        .auth-modal__panel {
          grid-template-columns: 1fr;
          max-width: 420px;
        }

        .auth-modal__hero {
          display: none;
        }
      }

      @media (max-width: 520px) {
        .auth-modal {
          padding: 1rem;
        }

        .auth-modal__panel {
          border-radius: 18px;
        }

        .auth-modal__row {
          grid-template-columns: 1fr;
        }

        .auth-modal__form-actions {
          flex-direction: column;
          align-items: stretch;
        }
      }
    </style>
  `;
}

function toggleLoading(button, loading, text) {
  if (!button) {
    return;
  }

  if (loading) {
    button.dataset.originalText = button.dataset.originalText || button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="auth-modal__spinner"></span>${text}`;
  } else {
    const original = button.dataset.originalText;
    if (original) {
      button.innerHTML = original;
    }
    button.disabled = false;
  }
}

export function initAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal || modal.dataset.initialized === 'true') {
    return;
  }

  const tabs = Array.from(modal.querySelectorAll('[data-auth-tab]'));
  const forms = {
    [VIEW_LOGIN]: modal.querySelector(`#auth-${VIEW_LOGIN}-form`),
    [VIEW_REGISTER]: modal.querySelector(`#auth-${VIEW_REGISTER}-form`),
    [VIEW_RECOVER]: modal.querySelector(`#auth-${VIEW_RECOVER}-form`),
    [VIEW_RESET]: modal.querySelector(`#auth-${VIEW_RESET}-form`),
  };
  const alertBox = modal.querySelector('[data-auth-alert]');
  const subtitle = modal.querySelector('[data-auth-subtitle]');
  const closeButtons = modal.querySelectorAll('[data-modal-dismiss]');
  const socialButtons = modal.querySelectorAll('[data-auth-provider]');
  const tabContainer = modal.querySelector('[data-auth-tabs]');

  let activeView = VIEW_LOGIN;
  let lastLoginEmail = '';
  let resetToken = null;

  const subtitles = {
    [VIEW_LOGIN]: 'Gestiona tus ingresos y gastos con nuestra suite colaborativa.',
    [VIEW_REGISTER]: 'Activa tu espacio profesional e invita a tu equipo cuando quieras.',
    [VIEW_RECOVER]: 'Recupera el acceso a tu cuenta con un enlace seguro.',
    [VIEW_RESET]: 'Define una nueva contraseña para continuar trabajando sin interrupciones.',
  };

  function clearAlert() {
    if (!alertBox) {
      return;
    }
    alertBox.hidden = true;
    alertBox.removeAttribute('data-variant');
    alertBox.innerHTML = '';
  }

  function showAlert(variant, message) {
    if (!alertBox) {
      return;
    }
    alertBox.hidden = false;
    alertBox.dataset.variant = variant;
    alertBox.innerHTML = message;
  }

  function setView(view) {
    if (!forms[view]) {
      return;
    }

    activeView = view;
    clearAlert();

    Object.entries(forms).forEach(([key, form]) => {
      if (!form) {
        return;
      }
      if (key === view) {
        form.removeAttribute('hidden');
      } else {
        form.setAttribute('hidden', 'true');
      }
    });

    tabs.forEach((tab) => {
      const isActive = tab.dataset.authTab === view;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    if (tabContainer) {
      const disableTabs = view === VIEW_RECOVER || view === VIEW_RESET;
      tabContainer.classList.toggle('is-disabled', disableTabs);
    }

    if (subtitle) {
      subtitle.textContent = subtitles[view] || subtitles[VIEW_LOGIN];
    }
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-lock-scroll');
    clearAlert();
    setView(VIEW_LOGIN);
  }

  function handleSocialLogin(provider) {
    const base = getAuthBaseUrl();
    const url = `${base}/${provider}`;
    window.location.href = url;
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.authTab;
      if (view && view !== activeView) {
        setView(view);
      }
    });
  });

  modal.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const switchView = target.dataset.authSwitch;
    if (switchView) {
      event.preventDefault();
      setView(switchView);
    }
  });

  closeButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      closeModal();
    });
  });

  socialButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const provider = button.dataset.authProvider;
      if (provider) {
        handleSocialLogin(provider);
      }
    });
  });

  const loginForm = forms[VIEW_LOGIN];
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearAlert();

      const submitBtn = loginForm.querySelector('.auth-modal__submit');
      const emailInput = loginForm.querySelector('input[name="email"]');
      const passwordInput = loginForm.querySelector('input[name="password"]');

      const email = emailInput?.value.trim();
      const password = passwordInput?.value || '';
      lastLoginEmail = email || '';

      if (!email || !password) {
        showAlert('error', 'Introduce tu correo y contraseña.');
        return;
      }

      toggleLoading(submitBtn, true, 'Entrando...');

      try {
        const response = await window.api.login(email, password);
        showAlert('success', response.message || 'Sesión iniciada correctamente.');
        window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: response.user } }));
        setTimeout(() => {
          closeModal();
        }, 400);
      } catch (error) {
        let message = 'No se pudo iniciar sesión.';

        if (error instanceof window.APIError) {
          if (error.status === 401) {
            message = 'Correo o contraseña incorrectos.';
          } else if (error.status === 0) {
            message = 'No podemos conectar con el servidor. Inténtalo más tarde.';
          } else if (error.data?.error) {
            message = error.data.error;
          }
          if (error.data?.requiresVerification && lastLoginEmail) {
            message += ` <button type="button" class="auth-modal__link" data-auth-resend="${lastLoginEmail}">Reenviar verificación</button>`;
          }
        }

        showAlert('error', message);
      } finally {
        toggleLoading(submitBtn, false);
      }
    });
  }

  modal.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const resendEmail = target.dataset.authResend;
    if (resendEmail) {
      event.preventDefault();
      try {
        const response = await window.api.resendVerification(resendEmail);
        showAlert('info', response.message || 'Hemos reenviado el correo de verificación.');
      } catch (error) {
        showAlert('error', 'No pudimos reenviar el correo. Inténtalo más tarde.');
      }
    }
  });

  const registerForm = forms[VIEW_REGISTER];
  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearAlert();

      const submitBtn = registerForm.querySelector('.auth-modal__submit');

      const formData = new FormData(registerForm);
      const payload = {
        firstName: (formData.get('firstName') || '').toString().trim(),
        lastName: (formData.get('lastName') || '').toString().trim(),
        company: (formData.get('company') || '').toString().trim(),
        email: (formData.get('email') || '').toString().trim(),
        phone: (formData.get('phone') || '').toString().trim(),
        password: (formData.get('password') || '').toString(),
        confirmPassword: (formData.get('confirmPassword') || '').toString(),
      };

      if (!payload.firstName || !payload.lastName || !payload.company || !payload.email || !payload.phone) {
        showAlert('error', 'Revisa los campos obligatorios.');
        return;
      }

      if (payload.password.length < 8) {
        showAlert('error', 'La contraseña debe tener al menos 8 caracteres.');
        return;
      }

      if (payload.password !== payload.confirmPassword) {
        showAlert('error', 'Las contraseñas no coinciden.');
        return;
      }

      toggleLoading(submitBtn, true, 'Creando cuenta...');

      try {
        const response = await window.api.register(payload);
        showAlert('success', response.message || 'Revisa tu correo para confirmar la cuenta.');
        registerForm.reset();
        setTimeout(() => {
          setView(VIEW_LOGIN);
        }, 600);
      } catch (error) {
        let message = 'No se pudo crear la cuenta.';
        if (error instanceof window.APIError && error.data?.error) {
          message = error.data.error;
        }
        showAlert('error', message);
      } finally {
        toggleLoading(submitBtn, false);
      }
    });
  }

  const recoverForm = forms[VIEW_RECOVER];
  if (recoverForm) {
    recoverForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearAlert();

      const submitBtn = recoverForm.querySelector('.auth-modal__submit');
      const emailInput = recoverForm.querySelector('input[name="email"]');
      const email = emailInput?.value.trim();

      if (!email) {
        showAlert('error', 'Introduce tu correo electrónico.');
        return;
      }

      toggleLoading(submitBtn, true, 'Enviando enlace...');

      try {
        const response = await window.api.requestPasswordReset(email);
        showAlert('success', response.message || 'Si el correo existe, enviaremos un enlace en minutos.');
      } catch (_error) {
        showAlert('error', 'No pudimos enviar el enlace. Inténtalo más tarde.');
      } finally {
        toggleLoading(submitBtn, false);
      }
    });
  }

  const resetForm = forms[VIEW_RESET];
  if (resetForm) {
    resetForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearAlert();

      if (!resetToken) {
        showAlert('error', 'El enlace de restablecimiento no es válido o ha caducado.');
        return;
      }

      const submitBtn = resetForm.querySelector('.auth-modal__submit');
      const passwordInput = resetForm.querySelector('input[name="password"]');
      const confirmInput = resetForm.querySelector('input[name="confirmPassword"]');

      const password = passwordInput?.value || '';
      const confirmPassword = confirmInput?.value || '';

      if (password.length < 8) {
        showAlert('error', 'La contraseña debe tener al menos 8 caracteres.');
        return;
      }

      if (password !== confirmPassword) {
        showAlert('error', 'Las contraseñas no coinciden.');
        return;
      }

      toggleLoading(submitBtn, true, 'Actualizando...');

      try {
        const response = await window.api.resetPassword(resetToken, password);
        resetToken = null;
        showAlert('success', response.message || 'Contraseña actualizada correctamente. Estamos iniciando tu sesión.');
        window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: response.user } }));
        setTimeout(() => {
          closeModal();
          window.location.hash = "#/dashboard";
        }, 500);
      } catch (error) {
        let message = 'No se pudo actualizar la contraseña.';
        if (error instanceof window.APIError && error.data?.error) {
          message = error.data.error;
        }
        showAlert('error', message);
      } finally {
        toggleLoading(submitBtn, false);
      }
    });
  }

  modal.addEventListener('auth:set-view', (event) => {
    const view = event.detail;
    if (view && forms[view]) {
      setView(view);
    }
  });

  modal.addEventListener('auth:set-reset-token', (event) => {
    const token = typeof event.detail === 'string' ? event.detail : null;
    resetToken = token;
    const tokenInput = forms[VIEW_RESET]?.querySelector('[data-reset-token]');
    if (tokenInput) {
      tokenInput.value = token || '';
    }
  });

  modal.dataset.initialized = 'true';
}

export function openAuthModal(initialView = VIEW_LOGIN, options = {}) {
  const modal = document.getElementById('auth-modal');
  if (!modal) {
    return;
  }

  initAuthModal();

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-lock-scroll');

  modal.dispatchEvent(new CustomEvent('auth:set-view', { detail: initialView }));

  if (options.resetToken) {
    modal.dispatchEvent(new CustomEvent('auth:set-reset-token', { detail: options.resetToken }));
  }

  const firstInput = modal.querySelector(`form[data-auth-view="${initialView}"] input`);
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 120);
  }
}

export function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) {
    return;
  }

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-lock-scroll');
}

export default {
  renderAuthModal,
  initAuthModal,
  openAuthModal,
  closeAuthModal,
};
