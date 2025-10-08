import renderSidebarToggleIcon from "./sidebarToggleIcon.js";

export function renderHeader(user = {}) {
  const { name = "Invitado", avatar = "" } = user;
  const displayName = name || "Invitado";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2) || "AF";

  const avatarMarkup = avatar
    ? `<img src="${avatar}" alt="${displayName}" class="avatar" />`
    : `<span class="avatar placeholder" aria-hidden="true">${initials}</span>`;

  return `
    <div class="app-topbar" role="region" aria-label="Controles de cuenta y preferencias">
      <div class="app-topbar__start">
        <button
          type="button"
          class="sidebar-toggle sidebar-toggle--ghost"
          data-sidebar-trigger="topbar"
          aria-expanded="false"
          aria-label="Mostrar u ocultar la navegacion"
          title="Mostrar u ocultar la navegacion"
        >
          ${renderSidebarToggleIcon()}
        </button>
      </div>
      <nav class="app-topbar__nav" aria-label="Opciones de la cuenta">
        <div class="app-topbar__preferences" aria-label="Preferencias">
          <div class="theme-switch" role="radiogroup" aria-label="Tema de la interfaz">
            <button type="button" class="theme-switch__btn" data-theme="light" aria-pressed="false" aria-label="Tema claro"></button>
            <button type="button" class="theme-switch__btn" data-theme="dark" aria-pressed="false" aria-label="Tema oscuro"></button>
          </div>
          <div class="lang-switch" role="radiogroup" aria-label="Idioma de la aplicacion">
            <button type="button" class="lang-switch__btn" data-lang="es" aria-pressed="false">ES</button>
            <button type="button" class="lang-switch__btn" data-lang="en" aria-pressed="false">EN</button>
          </div>
        </div>
        <div class="user-menu">
          <button type="button" class="user-chip" aria-haspopup="true" aria-expanded="false">
            ${avatarMarkup}
            <span class="user-chip__label">${displayName}</span>
          </button>
          <ul class="dropdown" role="menu">
            <li role="none"><a role="menuitem" href="#/settings">Configuracion</a></li>
            <li role="none"><button role="menuitem" id="logout-btn" type="button">Cerrar sesion</button></li>
          </ul>
        </div>
      </nav>
    </div>
  `;
}

export default renderHeader;
