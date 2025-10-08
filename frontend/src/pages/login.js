let socialHandlersBound = false;

export function renderLogin() {
  if (!socialHandlersBound) {
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.id === "google-login") {
        window.location.href = "http://localhost:8020/api/auth/google";
      }
      if (target.id === "github-login") {
        window.location.href = "http://localhost:8020/api/auth/github";
      }
    });
    socialHandlersBound = true;
  }

  return `
    <div class="login-box">
      <h2>Login</h2>
      <form id="local-login">
        <input name="email" placeholder="Email" />
        <input name="password" type="password" placeholder="Password" />
        <button type="submit">Entrar</button>
      </form>
      <button id="google-login" type="button">Sign in with Google</button>
      <button id="github-login" type="button">Sign in with GitHub</button>
    </div>
  `;
}

export default renderLogin;
