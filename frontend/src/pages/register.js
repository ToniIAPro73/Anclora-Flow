import { openAuthModal } from "../components/AuthModal.js";

export function renderRegisterPage() {
  return `
    <div class="auth-page">
      <div class="auth-page__illustration">
        <div class="auth-page__gradient"></div>
        <div class="auth-page__content">
          <span class="auth-page__badge">Anclora Flow</span>
          <h1 class="auth-page__title">Crea tu espacio en minutos</h1>
          <p class="auth-page__subtitle">
            Centraliza facturación, gastos y clientes en una plataforma
            diseñada para profesionales.
          </p>
          <ul class="auth-page__features">
            <li>Resumen financiero en tiempo real</li>
            <li>Gestión integral de clientes y proyectos</li>
            <li>Cumplimiento Verifactu desde el primer día</li>
          </ul>
        </div>
      </div>
      <section class="auth-page__form">
        <div class="auth-page__card">
          <header class="auth-page__head">
            <h2>Crear cuenta</h2>
            <p>
              ¿Ya tienes usuario?
              <button type="button" class="auth-page__link" data-register-login>
                Inicia sesión
              </button>
            </p>
          </header>
          <div class="auth-page__social">
            <button type="button" class="auth-page__social-btn" data-register-provider="google">
              <span class="auth-page__social-icon auth-page__social-icon--google">G</span>
              Continuar con Google
            </button>
            <button type="button" class="auth-page__social-btn" data-register-provider="github">
              <span class="auth-page__social-icon auth-page__social-icon--github">GH</span>
              Continuar con GitHub
            </button>
          </div>
          <div class="auth-page__divider"><span>o con tu correo</span></div>
          <div class="auth-page__alert" data-register-alert hidden></div>
          <form id="register-page-form" novalidate>
            <div class="auth-page__grid">
              <div class="auth-page__field">
                <label for="register-page-first">Nombre</label>
                <input id="register-page-first" name="firstName" type="text" autocomplete="given-name" required placeholder="Nombre" />
              </div>
              <div class="auth-page__field">
                <label for="register-page-last">Apellidos</label>
                <input id="register-page-last" name="lastName" type="text" autocomplete="family-name" required placeholder="Apellidos" />
              </div>
            </div>
            <div class="auth-page__field">
              <label for="register-page-company">Empresa</label>
              <input id="register-page-company" name="company" type="text" autocomplete="organization" required placeholder="Nombre de tu empresa" />
            </div>
            <div class="auth-page__grid">
              <div class="auth-page__field">
                <label for="register-page-email">Correo electrónico</label>
                <input id="register-page-email" name="email" type="email" autocomplete="email" required placeholder="empresa@correo.com" />
              </div>
              <div class="auth-page__field">
                <label for="register-page-phone">Teléfono</label>
                <input id="register-page-phone" name="phone" type="tel" autocomplete="tel" required placeholder="+34 600 000 000" />
              </div>
            </div>
            <div class="auth-page__grid">
              <div class="auth-page__field">
                <label for="register-page-password">Contraseña</label>
                <input id="register-page-password" name="password" type="password" autocomplete="new-password" required minlength="8" placeholder="Mínimo 8 caracteres" />
              </div>
              <div class="auth-page__field">
                <label for="register-page-confirm">Confirmar contraseña</label>
                <input id="register-page-confirm" name="confirmPassword" type="password" autocomplete="new-password" required minlength="8" placeholder="Repite la contraseña" />
              </div>
            </div>
            <p class="auth-page__legal">
              Al registrarte aceptas recibir un correo para confirmar tu cuenta. No compartimos tus datos con terceros.
            </p>
            <button type="submit" class="auth-page__submit">Crear cuenta</button>
          </form>
        </div>
      </section>
    </div>
    <style>
      .auth-page {
        min-height: 100vh;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        background: linear-gradient(160deg, var(--primary-900), #0f172a 55%, #0b132b 100%);
        color: var(--text-primary);
      }

      .auth-page__illustration {
        position: relative;
        padding: 3rem;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .auth-page__gradient {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(51, 102, 255, 0.65), rgba(20, 184, 166, 0.6), rgba(217, 70, 239, 0.45));
        filter: blur(60px);
        opacity: 0.95;
      }

      .auth-page__content {
        position: relative;
        max-width: 540px;
        display: grid;
        gap: 1.5rem;
        color: #f8fafc;
        text-align: left;
      }

      .auth-page__badge {
        align-self: flex-start;
        display: inline-flex;
        padding: 0.4rem 0.9rem;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.25);
        font-size: 0.85rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .auth-page__title {
        margin: 0;
        font-size: clamp(2rem, 4vw, 2.8rem);
        font-weight: 700;
        line-height: 1.1;
      }

      .auth-page__subtitle {
        margin: 0;
        font-size: 1.05rem;
        color: rgba(241, 245, 249, 0.92);
        line-height: 1.7;
      }

      .auth-page__features {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 0.8rem;
        color: rgba(226, 232, 240, 0.9);
        font-size: 1rem;
      }

      .auth-page__features li::before {
        content: "•";
        margin-right: 0.5rem;
      }

      .auth-page__form {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 3rem;
      }

      .auth-page__card {
        width: min(520px, 100%);
        background: var(--bg-primary);
        border-radius: 24px;
        padding: 2.5rem;
        box-shadow: 0 30px 60px rgba(15, 23, 42, 0.25);
        display: grid;
        gap: 1.75rem;
      }

      .auth-page__head h2 {
        margin: 0;
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .auth-page__head p {
        margin: 0.5rem 0 0;
        font-size: 0.95rem;
        color: var(--text-secondary);
      }

      .auth-page__link {
        background: none;
        border: none;
        color: var(--primary-500);
        font-weight: 600;
        cursor: pointer;
        padding: 0;
      }

      .auth-page__social {
        display: grid;
        gap: 0.75rem;
      }

      .auth-page__social-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        padding: 0.85rem 1rem;
        border-radius: 14px;
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.2s ease;
      }

      .auth-page__social-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 24px rgba(15, 23, 42, 0.1);
      }

      .auth-page__social-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        font-weight: 700;
        font-size: 0.9rem;
      }

      .auth-page__social-icon--google {
        color: var(--primary-500);
        border: 1px solid rgba(51, 102, 255, 0.35);
        background: rgba(51, 102, 255, 0.08);
      }

      .auth-page__social-icon--github {
        color: var(--text-primary);
        border: 1px solid rgba(15, 23, 42, 0.2);
        background: rgba(15, 23, 42, 0.06);
      }

      .auth-page__divider {
        display: flex;
        align-items: center;
        gap: 1rem;
        color: var(--text-muted);
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .auth-page__divider::before,
      .auth-page__divider::after {
        content: "";
        flex: 1;
        height: 1px;
        background: var(--border-color);
      }

      .auth-page__alert {
        border-radius: 14px;
        padding: 0.9rem 1rem;
        font-size: 0.9rem;
        border: 1px solid transparent;
      }

      .auth-page__alert[data-variant="error"] {
        background: rgba(239, 68, 68, 0.12);
        border-color: rgba(239, 68, 68, 0.3);
        color: var(--danger);
      }

      .auth-page__alert[data-variant="success"] {
        background: rgba(20, 184, 166, 0.12);
        border-color: rgba(20, 184, 166, 0.35);
        color: var(--success);
      }

      .auth-page__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
      }

      .auth-page__field {
        display: grid;
        gap: 0.45rem;
      }

      .auth-page__field label {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-secondary);
      }

      .auth-page__field input {
        border-radius: 12px;
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
        padding: 0.85rem 1rem;
        font-size: 1rem;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .auth-page__field input:focus {
        outline: none;
        border-color: rgba(51, 102, 255, 0.6);
        box-shadow: 0 0 0 3px rgba(51, 102, 255, 0.18);
      }

      .auth-page__legal {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-muted);
      }

      .auth-page__submit {
        padding: 0.95rem 1rem;
        border-radius: 12px;
        border: none;
        background: var(--gradient-button);
        color: #fff;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.2s ease;
      }

      .auth-page__submit:hover {
        transform: translateY(-1px);
        box-shadow: 0 16px 32px rgba(51, 102, 255, 0.25);
      }

      .auth-page__submit[disabled] {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      @media (max-width: 1080px) {
        .auth-page {
          grid-template-columns: 1fr;
        }

        .auth-page__illustration {
          display: none;
        }

        .auth-page__form {
          padding: 2.5rem 1.5rem;
        }
      }

      @media (max-width: 640px) {
        .auth-page__card {
          padding: 2rem 1.5rem;
        }
      }
    </style>
  `;
}

export function initRegisterPage() {
  const form = document.getElementById("register-page-form");
  const alertBox = document.querySelector("[data-register-alert]");
  const loginButton = document.querySelector("[data-register-login]");
  const socialButtons = document.querySelectorAll("[data-register-provider]");

  function showAlert(message, variant = "error") {
    if (!alertBox) {
      return;
    }
    alertBox.hidden = false;
    alertBox.dataset.variant = variant;
    alertBox.textContent = message;
  }

  function clearAlert() {
    if (alertBox) {
      alertBox.hidden = true;
      alertBox.removeAttribute("data-variant");
      alertBox.textContent = "";
    }
  }

  if (loginButton) {
    loginButton.addEventListener("click", () => {
      window.location.hash = "#/dashboard";
      setTimeout(() => {
        openAuthModal("login");
      }, 60);
    });
  }

  socialButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const provider = button.dataset.registerProvider;
      if (!provider) {
        return;
      }
      const authBase = window.api?.getBaseUrl
        ? window.api.getBaseUrl().replace(/\/api$/, "/api/auth")
        : "http://localhost:8020/api/auth";
      window.location.href = `${authBase}/${provider}`;
    });
  });

  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAlert();

    const submitBtn = form.querySelector(".auth-page__submit");
    const formData = new FormData(form);
    const payload = {
      firstName: (formData.get("firstName") || "").toString().trim(),
      lastName: (formData.get("lastName") || "").toString().trim(),
      company: (formData.get("company") || "").toString().trim(),
      email: (formData.get("email") || "").toString().trim(),
      phone: (formData.get("phone") || "").toString().trim(),
      password: (formData.get("password") || "").toString(),
      confirmPassword: (formData.get("confirmPassword") || "").toString(),
    };

    if (!payload.firstName || !payload.lastName || !payload.company || !payload.email || !payload.phone) {
      showAlert("Revisa los campos obligatorios.");
      return;
    }

    if (payload.password.length < 8) {
      showAlert("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (payload.password !== payload.confirmPassword) {
      showAlert("Las contraseñas no coinciden.");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.dataset.originalText || submitBtn.textContent || "";
      submitBtn.textContent = "Creando cuenta...";
    }

    try {
      const response = await window.api.register(payload);
      showAlert(response.message || "Revisa tu correo para confirmar la cuenta.", "success");
      form.reset();
    } catch (error) {
      let message = "No se pudo crear la cuenta.";
      if (error instanceof window.APIError && error.data?.error) {
        message = error.data.error;
      }
      showAlert(message, "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText || "Crear cuenta";
      }
    }
  });
}

export default renderRegisterPage;
