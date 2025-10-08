import renderHeader from "../components/layout/Header.js";
import renderSidebar from "../components/layout/Sidebar.js";

export function renderApp(user) {
  return `
    ${renderHeader(user)}
    <main class="app-main">
      ${renderSidebar()}
      <section id="page-content" class="page-content" aria-live="polite"></section>
    </main>
  `;
}

export default renderApp;
