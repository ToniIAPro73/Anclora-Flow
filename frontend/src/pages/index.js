import { renderAuthModal } from "../components/AuthModal.js";
import renderTopbar from "../components/layout/Header.js";
import renderSidebar from "../components/layout/Sidebar.js";

export function renderApp(user) {
  return `
    <main class="app-shell">
      ${renderSidebar()}
      <div class="app-shell__workspace">
        ${renderTopbar(user)}
        <section id="page-content" class="page-content" aria-live="polite"></section>
      </div>
    </main>
    ${renderAuthModal()}
  `;
}

export default renderApp;
