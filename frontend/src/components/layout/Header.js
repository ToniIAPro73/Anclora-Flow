export function renderHeader(user = {}) {
  const { name = "Invitado", avatar = "" } = user;
  const avatarMarkup = avatar
    ? `<img src="${avatar}" alt="${name}" class="avatar" />`
    : `<div class="avatar placeholder" aria-hidden="true">${name.charAt(0).toUpperCase()}</div>`;

  return `
    <header class="app-header">
      <div class="logo">Anclora Flow</div>
      <nav>
        <button id="theme-switch" aria-label="Toggle theme">Light/Dark</button>
        <select id="lang-switch" aria-label="Change language">
          <option value="es">ES</option>
          <option value="en">EN</option>
        </select>
        <div class="user-menu">
          ${avatarMarkup}
          <ul class="dropdown">
            <li><a href="#/settings">Settings</a></li>
            <li><button id="logout-btn" type="button">Logout</button></li>
          </ul>
        </div>
      </nav>
    </header>
  `;
}

export default renderHeader;
