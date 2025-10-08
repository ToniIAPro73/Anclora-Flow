export function renderSettings(user = {}) {
  const { email = "", authProvider = "" } = user;
  return `
    <section class="module settings">
      <h2>Configuracion</h2>
      <form>
        <label>Idioma
          <select name="language">
            <option value="es">Espanol</option>
            <option value="en">English</option>
          </select>
        </label>
        <label>Tema
          <select name="theme">
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </label>
        <label>Email
          <input name="email" value="${email}" />
        </label>
        <label>Proveedor
          <input name="provider" value="${authProvider}" readonly />
        </label>
        <button type="submit">Guardar</button>
      </form>
    </section>
  `;
}

export default renderSettings;
