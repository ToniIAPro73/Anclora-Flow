(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function o(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(a){if(a.ep)return;a.ep=!0;const s=o(a);fetch(a.href,s)}})();function g(t={}){const{name:i="Invitado",avatar:o=""}=t;return`
    <header class="app-header">
      <div class="logo">Anclora Flow</div>
      <nav>
        <button id="theme-switch" aria-label="Toggle theme">Light/Dark</button>
        <select id="lang-switch" aria-label="Change language">
          <option value="es">ES</option>
          <option value="en">EN</option>
        </select>
        <div class="user-menu">
          ${o?`<img src="${o}" alt="${i}" class="avatar" />`:`<div class="avatar placeholder" aria-hidden="true">${i.charAt(0).toUpperCase()}</div>`}
          <ul class="dropdown">
            <li><a href="#/settings">Settings</a></li>
            <li><button id="logout-btn" type="button">Logout</button></li>
          </ul>
        </div>
      </nav>
    </header>
  `}const _=[{path:"/dashboard",label:"Dashboard"},{path:"/invoices",label:"Ingresos y Facturas"},{path:"/expenses",label:"Gastos y Deducciones"},{path:"/clients",label:"Clientes y Proyectos"},{path:"/subscriptions",label:"Gestion Suscripciones"},{path:"/budget",label:"Presupuesto Inteligente"},{path:"/calendar",label:"Calendario y Calculadora Fiscal"},{path:"/reports",label:"Informes y Metricas"},{path:"/assistant",label:"Asistente IA"}];function f(){return`
    <aside class="sidebar">
      <nav>
        <ul>${_.map(i=>`<li><a href="#${i.path}">${i.label}</a></li>`).join("")}</ul>
      </nav>
    </aside>
  `}function y(t){return`
    ${g(t)}
    <main class="app-main">
      ${f()}
      <section id="page-content" class="page-content" aria-live="polite"></section>
    </main>
  `}let d=!1;function D(){return d||(document.addEventListener("click",t=>{const i=t.target;i instanceof HTMLElement&&(i.id==="google-login"&&(window.location.href="http://localhost:8020/api/auth/google"),i.id==="github-login"&&(window.location.href="http://localhost:8020/api/auth/github"))}),d=!0),`
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
  `}function l(t={}){const{name:i=""}=t,o=i?i.split(" ")[0]:"Anclora",n=new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}),a=[{id:"deadline",icon:"⏳",title:"Proxima obligacion",value:"14 dias",detail:"IVA trimestral vence el 24 oct.",tone:"due"},{id:"taxes",icon:"💰",title:"Pago IVA previsto",value:n.format(6600),detail:"Importe calculado con gastos deducidos",tone:"neutral"},{id:"revenue",icon:"🏦",title:"Ingresos del ano",value:n.format(40050),detail:"Objetivo anual alcanzado al 72%",tone:"positive"},{id:"compliance",icon:"✅",title:"Dias sin incidencias",value:"387",detail:"Declaraciones presentadas en plazo",tone:"success"}],s=[{href:"#/invoices",icon:"📄",title:"Nueva factura",description:"Crea y envia documentos en segundos"},{href:"#/expenses",icon:"💸",title:"Registrar gasto",description:"Anade deducciones con ticket adjunto"},{href:"#/reports",icon:"📊",title:"Ver informes",description:"Analiza margenes y cashflow"},{href:"#/calendar",icon:"🗓️",title:"Calendario fiscal",description:"Consulta fechas limite oficiales"},{href:"#/assistant",icon:"🧑‍🦱",title:"Asistente IA",description:"Resuelve dudas con lenguaje natural"},{href:"#/subscriptions",icon:"📦",title:"Suscripciones",description:"Gestiona pagos recurrentes"}],r=[{label:"Modelo 303",date:"24 oct 2025",status:"Programado",href:"#/calendar"},{label:"Modelo 111",date:"31 oct 2025",status:"Pendiente",href:"#/calendar"},{label:"Cuota RETA",date:"30 oct 2025",status:"Confirmado",href:"#/expenses"}],h=[{label:"Factura 2025-144",value:n.format(1540),meta:"Emitida a Studio Goya",href:"#/invoices"},{label:"Gasto coworking",value:n.format(220),meta:"Deducible al 100%",href:"#/expenses"},{label:"Ingreso Stripe",value:n.format(890),meta:"Conciliado hace 2 horas",href:"#/reports"}],p=a.map(e=>`
        <article class="module dashboard__kpi-card dashboard__kpi-card--${e.tone}" role="listitem">
          <div class="dashboard__kpi-icon" aria-hidden="true">${e.icon}</div>
          <div class="dashboard__kpi-content">
            <p class="dashboard__kpi-title">${e.title}</p>
            <p class="dashboard__kpi-value">${e.value}</p>
            <p class="dashboard__kpi-detail">${e.detail}</p>
          </div>
        </article>
      `).join(""),b=s.map(e=>`
        <a class="dashboard__quick-card" href="${e.href}" role="listitem">
          <span class="dashboard__quick-icon" aria-hidden="true">${e.icon}</span>
          <span class="dashboard__quick-body">
            <span class="dashboard__quick-title">${e.title}</span>
            <span class="dashboard__quick-description">${e.description}</span>
          </span>
          <span class="dashboard__quick-arrow" aria-hidden="true">&rarr;</span>
        </a>
      `).join(""),v=r.map(e=>`
        <li class="dashboard__timeline-item">
          <div class="dashboard__timeline-marker" aria-hidden="true"></div>
          <div class="dashboard__timeline-content">
            <p class="dashboard__timeline-title">${e.label}</p>
            <p class="dashboard__timeline-meta">${e.date} &middot; ${e.status}</p>
          </div>
          <a class="dashboard__timeline-link" href="${e.href}" aria-label="Ver detalles de ${e.label}">&rarr;</a>
        </li>
      `).join(""),m=h.map(e=>`
        <li class="dashboard__activity-item">
          <div class="dashboard__activity-info">
            <p class="dashboard__activity-title">${e.label}</p>
            <p class="dashboard__activity-meta">${e.meta}</p>
          </div>
          <div class="dashboard__activity-value">${e.value}</div>
          <a class="dashboard__activity-link" href="${e.href}" aria-label="Abrir ${e.label}">&rarr;</a>
        </li>
      `).join("");return`
    <section class="dashboard" aria-labelledby="dashboard-title">
      <header class="module dashboard__hero">
        <div class="dashboard__hero-headline">
          <p class="dashboard__kicker">Hola ${o||"Anclora"}</p>
          <h1 id="dashboard-title">Dashboard principal</h1>
          <p class="dashboard__subtitle">Supervisa ingresos, obligaciones fiscales y acciones recomendadas en un unico lugar.</p>
        </div>
        <div class="dashboard__hero-actions">
          <a class="dashboard__primary-action" href="#/invoices">Crear factura</a>
          <a class="dashboard__secondary-action" href="#/reports">Ver resumen mensual</a>
        </div>
      </header>

      <section class="dashboard__metrics" aria-labelledby="dashboard-metrics">
        <div class="dashboard__section-heading">
          <h2 id="dashboard-metrics">Resumen rapido</h2>
          <p class="dashboard__section-meta">Datos sincronizados con tus ultimas operaciones</p>
        </div>
        <div class="dashboard__kpi-grid" role="list">
          ${p}
        </div>
      </section>

      <section class="module dashboard__quick" aria-labelledby="dashboard-quick">
        <div class="dashboard__section-heading dashboard__section-heading--inline">
          <h2 id="dashboard-quick">Acceso rapido</h2>
          <p class="dashboard__section-meta">Acciones frecuentes para mantenerte al dia</p>
        </div>
        <div class="dashboard__quick-grid" role="list">
          ${b}
        </div>
      </section>

      <section class="dashboard__insights" aria-labelledby="dashboard-insights">
        <div class="module dashboard__timeline" aria-labelledby="dashboard-obligations">
          <div class="dashboard__section-heading dashboard__section-heading--inline">
            <h2 id="dashboard-obligations">Proximas obligaciones</h2>
            <p class="dashboard__section-meta">Planifica tus entregas fiscales sin sorpresas</p>
          </div>
          <ul class="dashboard__timeline-list">
            ${v}
          </ul>
        </div>
        <div class="module dashboard__activity" aria-labelledby="dashboard-activity">
          <div class="dashboard__section-heading dashboard__section-heading--inline">
            <h2 id="dashboard-activity">Actividad reciente</h2>
            <p class="dashboard__section-meta">Ultimos movimientos registrados</p>
          </div>
          <ul class="dashboard__activity-list">
            ${m}
          </ul>
        </div>
      </section>
    </section>
  `}function $(){return`
    <section class="module invoices">
      <h2>Ingresos y Facturas</h2>
      <button id="new-invoice" type="button">Nueva factura</button>
      <div id="invoice-list"></div>
    </section>
  `}function C(){return`
    <section class="module expenses">
      <h2>Gastos y Deducciones</h2>
      <button id="new-expense" type="button">Anadir gasto</button>
      <div id="expense-list"></div>
    </section>
  `}function k(){return`
    <section class="module clients">
      <h2>Clientes y Proyectos</h2>
      <button id="new-client" type="button">Nuevo cliente</button>
      <div id="client-list"></div>
    </section>
  `}function w(){return`
    <section class="module subscriptions">
      <h2>Gestion Inteligente de Suscripciones</h2>
      <button id="add-subscription" type="button">Suscribirse</button>
      <div id="subscription-list"></div>
    </section>
  `}function A(){return`
    <section class="module budget">
      <h2>Presupuesto Personal Inteligente</h2>
      <div id="budget-chart"></div>
    </section>
  `}function E(){return`
    <section class="module calendar">
      <h2>Calendario Fiscal y Calculadora Avanzada</h2>
      <div id="calendar-widget"></div>
      <div id="tax-calculator"></div>
    </section>
  `}function I(){return`
    <section class="module reports">
      <h2>Informes y Metricas</h2>
      <button id="generate-report" type="button">Generar informe</button>
      <div id="report-list"></div>
    </section>
  `}function L(){return`
    <section class="module assistant">
      <h2>Asistente IA Integrado</h2>
      <div id="assistant-chat"></div>
    </section>
  `}function P(t={}){const{email:i="",authProvider:o=""}=t;return`
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
          <input name="email" value="${i}" />
        </label>
        <label>Proveedor
          <input name="provider" value="${o}" readonly />
        </label>
        <button type="submit">Guardar</button>
      </form>
    </section>
  `}const S={"/dashboard":l,"/invoices":$,"/expenses":C,"/clients":k,"/subscriptions":w,"/budget":A,"/calendar":E,"/reports":I,"/assistant":L,"/settings":P},c={name:"Demo",email:"demo@demo.com",avatar:"",authProvider:"local"};function x(){document.getElementById("page-content")||(document.body.innerHTML=y(c))}function u(){const t=window.location.hash||"",o=(t.startsWith("#")?t.slice(1):t)||"/dashboard";if(o==="/login"){document.body.innerHTML=D();return}x();const n=S[o]||l,a=document.getElementById("page-content");a&&(a.innerHTML=n(c))}window.addEventListener("hashchange",u);document.addEventListener("DOMContentLoaded",u);
