(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function s(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerPolicy&&(n.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?n.credentials="include":a.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(a){if(a.ep)return;a.ep=!0;const n=s(a);fetch(a.href,n)}})();function $(e={}){const{name:t="Invitado",avatar:s=""}=e,i=t||"Invitado",a=i.split(/\s+/).filter(Boolean).map(r=>r.charAt(0).toUpperCase()).join("").slice(0,2)||"AF";return`
    <header class="app-header" role="banner">
      <div class="logo" aria-label="Anclora Flow">
        <span class="logo__icon" aria-hidden="true"></span>
        <span class="logo__text">Anclora Flow</span>
      </div>
      <nav class="app-header__nav" aria-label="Opciones de la cuenta">
        <div class="app-header__preferences" aria-label="Preferencias">
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
            ${s?`<img src="${s}" alt="${i}" class="avatar" />`:`<span class="avatar placeholder" aria-hidden="true">${a}</span>`}
            <span class="user-chip__label">${i}</span>
          </button>
          <ul class="dropdown" role="menu">
            <li role="none"><a role="menuitem" href="#/settings">Configuracion</a></li>
            <li role="none"><button role="menuitem" id="logout-btn" type="button">Cerrar sesion</button></li>
          </ul>
        </div>
      </nav>
    </header>
  `}const S=[{path:"/dashboard",label:"Dashboard"},{path:"/invoices",label:"Ingresos y Facturas"},{path:"/expenses",label:"Gastos y Deducciones"},{path:"/clients",label:"Clientes y Proyectos"},{path:"/subscriptions",label:"Gestion Suscripciones"},{path:"/budget",label:"Presupuesto Inteligente"},{path:"/calendar",label:"Calendario y Calculadora Fiscal"},{path:"/reports",label:"Informes y Metricas"},{path:"/assistant",label:"Asistente IA"}];function P(){return`
    <aside class="sidebar">
      <nav>
        <ul>${S.map(t=>`<li><a href="#${t.path}">${t.label}</a></li>`).join("")}</ul>
      </nav>
    </aside>
  `}function M(e){return`
    ${$(e)}
    <main class="app-main">
      ${P()}
      <section id="page-content" class="page-content" aria-live="polite"></section>
    </main>
  `}let g=!1;function x(){return g||(document.addEventListener("click",e=>{const t=e.target;t instanceof HTMLElement&&(t.id==="google-login"&&(window.location.href="http://localhost:8020/api/auth/google"),t.id==="github-login"&&(window.location.href="http://localhost:8020/api/auth/github"))}),g=!0),`
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
  `}const f=new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"});function y(e={}){const{name:t="Demo"}=e,s=t.split(/\s+/)[0]||"Demo",i=[{id:"deadline",icon:"⏳",title:"Dias hasta vencimiento",value:"14",helper:"Revisa tus obligaciones",tone:"warning"},{id:"iva",icon:"💰",title:"Proximo pago IVA",value:f.format(6600),helper:"Corresponde al T3 2025",tone:"info"},{id:"forecast",icon:"📊",title:"Estimacion anual",value:f.format(40050),helper:"Objetivo al 72%",tone:"success"},{id:"days",icon:"✅",title:"Dias sin incidencias",value:"387",helper:"Declaraciones al dia",tone:"neutral"}],a=[{icon:"🧾",title:"Nueva factura",description:"Crear facturas",href:"#/invoices"},{icon:"📉",title:"Gastos del mes",description:"Revisar gastos",href:"#/expenses"},{icon:"📆",title:"Proximas obligaciones",description:"Vencimientos fiscales",href:"#/calendar"},{icon:"🧮",title:"Calculadora IRPF",description:"Calcular impuestos",href:"#/assistant"},{icon:"📑",title:"Informes",description:"Analisis y metricas",href:"#/reports"},{icon:"🤖",title:"Asistente IA",description:"Ayuda inteligente",href:"#/assistant"}],n=[{label:"Modelo 303 - IVA",date:"20 ene 2025"},{label:"IRPF Q4 2024",date:"30 ene 2025"},{label:"Modelo 111",date:"20 feb 2025"}],r=[{label:"Factura #2025-001 creada",time:"Hace 2 horas",href:"#/invoices"},{label:"Gasto registrado: material oficina",time:"Hace 4 horas",href:"#/expenses"},{label:"Recordatorio: Modelo 303 proximo",time:"Hace 1 dia",href:"#/calendar"}],I=i.map(o=>`
        <article class="dashboard__kpi-card dashboard__kpi-card--${o.tone}" role="listitem">
          <span class="dashboard__kpi-icon" aria-hidden="true">${o.icon}</span>
          <div class="dashboard__kpi-copy">
            <p class="dashboard__kpi-label">${o.title}</p>
            <p class="dashboard__kpi-value">${o.value}</p>
            <p class="dashboard__kpi-helper">${o.helper}</p>
          </div>
        </article>
      `).join(""),k=a.map(o=>`
        <article class="dashboard__quick-card" role="listitem">
          <div class="dashboard__quick-icon" aria-hidden="true">${o.icon}</div>
          <div class="dashboard__quick-copy">
            <h3>${o.title}</h3>
            <p>${o.description}</p>
            <a class="dashboard__quick-link" href="${o.href}">Acceder</a>
          </div>
        </article>
      `).join(""),C=n.map(o=>`
        <li class="dashboard__timeline-item">
          <span class="dashboard__timeline-dot" aria-hidden="true"></span>
          <div class="dashboard__timeline-copy">
            <p class="dashboard__timeline-label">${o.label}</p>
            <p class="dashboard__timeline-date">${o.date}</p>
          </div>
        </li>
      `).join(""),L=r.map(o=>`
        <li class="dashboard__activity-item">
          <div class="dashboard__activity-copy">
            <p class="dashboard__activity-label">${o.label}</p>
            <p class="dashboard__activity-time">${o.time}</p>
          </div>
          <a class="dashboard__activity-link" href="${o.href}">Acceder</a>
        </li>
      `).join("");return`
    <section class="dashboard" aria-labelledby="dashboard-title">
      <header class="dashboard__hero">
        <div class="dashboard__hero-content">
          <p class="dashboard__hero-greeting">Hola ${s}</p>
          <p class="dashboard__hero-subtitle">Este es tu resumen fiscal del dia.</p>
        </div>
        <div class="dashboard__hero-badge" role="status">
          <span class="dashboard__hero-badge-label">Siguiente obligacion en</span>
          <span class="dashboard__hero-badge-value">14 dias</span>
        </div>
      </header>

      <section class="dashboard__section" aria-labelledby="dashboard-metrics">
        <div class="dashboard__section-head">
          <h2 id="dashboard-metrics">Resumen de metricas</h2>
          <p>Datos sincronizados con tus ultimas operaciones</p>
        </div>
        <div class="dashboard__kpi-list" role="list">
          ${I}
        </div>
      </section>

      <section class="dashboard__section" aria-labelledby="dashboard-quick">
        <div class="dashboard__section-head">
          <h2 id="dashboard-quick">Acciones rapidas</h2>
          <p>Gestiona tareas habituales desde un solo lugar</p>
        </div>
        <div class="dashboard__quick-list" role="list">
          ${k}
        </div>
      </section>

      <section class="dashboard__grid" aria-labelledby="dashboard-grid">
        <article class="dashboard__panel" aria-labelledby="dashboard-dates">
          <div class="dashboard__panel-head">
            <h2 id="dashboard-dates">Proximas fechas</h2>
            <p>Preparate para los vencimientos claves</p>
          </div>
          <ol class="dashboard__timeline">
            ${C}
          </ol>
        </article>
        <article class="dashboard__panel" aria-labelledby="dashboard-activity">
          <div class="dashboard__panel-head">
            <h2 id="dashboard-activity">Actividad reciente</h2>
            <p>Ultimas acciones registradas</p>
          </div>
          <ul class="dashboard__activity" role="list">
            ${L}
          </ul>
        </article>
      </section>
    </section>
  `}function T(){return`
    <section class="module invoices">
      <h2>Ingresos y Facturas</h2>
      <button id="new-invoice" type="button">Nueva factura</button>
      <div id="invoice-list"></div>
    </section>
  `}function q(){return`
    <section class="module expenses">
      <h2>Gastos y Deducciones</h2>
      <button id="new-expense" type="button">Anadir gasto</button>
      <div id="expense-list"></div>
    </section>
  `}function F(){return`
    <section class="module clients">
      <h2>Clientes y Proyectos</h2>
      <button id="new-client" type="button">Nuevo cliente</button>
      <div id="client-list"></div>
    </section>
  `}function G(){return`
    <section class="module subscriptions">
      <h2>Gestion Inteligente de Suscripciones</h2>
      <button id="add-subscription" type="button">Suscribirse</button>
      <div id="subscription-list"></div>
    </section>
  `}function H(){return`
    <section class="module budget">
      <h2>Presupuesto Personal Inteligente</h2>
      <div id="budget-chart"></div>
    </section>
  `}function O(){return`
    <section class="module calendar">
      <h2>Calendario Fiscal y Calculadora Avanzada</h2>
      <div id="calendar-widget"></div>
      <div id="tax-calculator"></div>
    </section>
  `}function R(){return`
    <section class="module reports">
      <h2>Informes y Metricas</h2>
      <button id="generate-report" type="button">Generar informe</button>
      <div id="report-list"></div>
    </section>
  `}function B(){return`
    <section class="module assistant">
      <h2>Asistente IA Integrado</h2>
      <div id="assistant-chat"></div>
    </section>
  `}function N(e={}){const{email:t="",authProvider:s=""}=e;return`
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
          <input name="email" value="${t}" />
        </label>
        <label>Proveedor
          <input name="provider" value="${s}" readonly />
        </label>
        <button type="submit">Guardar</button>
      </form>
    </section>
  `}const j={"/dashboard":y,"/invoices":T,"/expenses":q,"/clients":F,"/subscriptions":G,"/budget":H,"/calendar":O,"/reports":R,"/assistant":B,"/settings":N},w={name:"Demo",email:"demo@demo.com",avatar:"",authProvider:"local"},c={theme:"anclora-theme",language:"anclora-language"},h=document.documentElement;let p=[],b=[],v=!1,_=!1;function z(){return window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}let l=localStorage.getItem(c.theme)||z(),d=localStorage.getItem(c.language)||"es";function u(e=[],t,s){e.forEach(i=>{const a=i.dataset[t]===s;i.classList.toggle("is-active",a),i.setAttribute("aria-pressed",String(a))})}function m(e){l=e==="dark"?"dark":"light",l==="dark"?h.setAttribute("data-theme","dark"):h.removeAttribute("data-theme"),u(p,"theme",l)}function D(e){d=e==="en"?"en":"es",h.setAttribute("lang",d),u(b,"lang",d)}m(l);D(d);function E(){const e=Array.from(document.querySelectorAll(".theme-switch__btn")),t=Array.from(document.querySelectorAll(".lang-switch__btn"));!e.length||!t.length||(p=e,b=t,v||(e.forEach(s=>{s.addEventListener("click",i=>{const a=i.currentTarget.dataset.theme;!a||a===l||(m(a),localStorage.setItem(c.theme,l))})}),t.forEach(s=>{s.addEventListener("click",i=>{const a=i.currentTarget.dataset.lang;!a||a===d||(D(a),localStorage.setItem(c.language,d))})}),v=!0),u(p,"theme",l),u(b,"lang",d))}function U(){const e=document.querySelector(".user-menu");if(!e)return;const t=e.querySelector(".user-chip"),s=e.querySelector(".dropdown");if(!t||!s)return;const i=()=>{e.classList.remove("is-open"),t.setAttribute("aria-expanded","false")};_||(t.addEventListener("click",a=>{a.preventDefault();const n=!e.classList.contains("is-open");n?e.classList.add("is-open"):e.classList.remove("is-open"),t.setAttribute("aria-expanded",String(n))}),document.addEventListener("click",a=>{e.contains(a.target)||i()}),t.addEventListener("keydown",a=>{a.key==="Escape"&&(i(),t.blur())}),_=!0)}function V(){E(),U()}if(window.matchMedia){const e=window.matchMedia("(prefers-color-scheme: dark)"),t=s=>{localStorage.getItem(c.theme)||(m(s.matches?"dark":"light"),E())};e.addEventListener?e.addEventListener("change",t):e.addListener&&e.addListener(t)}function K(){document.getElementById("page-content")||(document.body.innerHTML=M(w))}function A(){const e=window.location.hash||"",s=(e.startsWith("#")?e.slice(1):e)||"/dashboard";if(s==="/login"){document.body.innerHTML=x();return}K(),V();const i=j[s]||y,a=document.getElementById("page-content");a&&(a.innerHTML=i(w))}window.addEventListener("hashchange",A);document.addEventListener("DOMContentLoaded",A);
