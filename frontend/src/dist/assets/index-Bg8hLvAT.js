(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))i(t);new MutationObserver(t=>{for(const n of t)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function s(t){const n={};return t.integrity&&(n.integrity=t.integrity),t.referrerPolicy&&(n.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?n.credentials="include":t.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(t){if(t.ep)return;t.ep=!0;const n=s(t);fetch(t.href,n)}})();function K(){return`
    <span class="sidebar-toggle__icon" aria-hidden="true">
      <span class="sidebar-toggle__orb"></span>
      <span class="sidebar-toggle__stem"></span>
      <span class="sidebar-toggle__fluke"></span>
      <span class="sidebar-toggle__wave"></span>
    </span>
  `}function ie(e={}){const{name:a="Invitado",avatar:s=""}=e,i=a||"Invitado",t=i.split(/\s+/).filter(Boolean).map(r=>r.charAt(0).toUpperCase()).join("").slice(0,2)||"AF",n=s?`<img src="${s}" alt="${i}" class="avatar" />`:`<span class="avatar placeholder" aria-hidden="true">${t}</span>`;return`
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
          ${K()}
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
            ${n}
            <span class="user-chip__label">${i}</span>
          </button>
          <ul class="dropdown" role="menu">
            <li role="none"><a role="menuitem" href="#/settings">Configuracion</a></li>
            <li role="none"><button role="menuitem" id="logout-btn" type="button">Cerrar sesion</button></li>
          </ul>
        </div>
      </nav>
    </div>
  `}const ne=[{path:"/dashboard",label:"Dashboard",icon:"⎈"},{path:"/invoices",label:"Ingresos & Facturas",icon:"🧾"},{path:"/expenses",label:"Gastos & Deducciones",icon:"💸"},{path:"/clients",label:"Clientes & Proyectos",icon:"👥"},{path:"/subscriptions",label:"Gestion Suscripciones",icon:"🔁"},{path:"/budget",label:"Presupuesto Inteligente",icon:"📊"},{path:"/calendar",label:"Calendario & Calc. Fiscal",icon:"📆"},{path:"/reports",label:"Informes & Metricas",icon:"📑"},{path:"/assistant",label:"Asistente IA",icon:"🤖"}];function oe(){const e=ne.map(a=>`
        <li>
          <a class="app-sidebar__link" href="#${a.path}" aria-label="${a.label}" title="${a.label}">
            <span class="app-sidebar__glyph" aria-hidden="true">${a.icon}</span>
            <span class="app-sidebar__label">${a.label}</span>
          </a>
        </li>
      `).join("");return`
    <aside class="app-sidebar" data-state="expanded">
      <div class="app-sidebar__brand">
        <div class="app-sidebar__logo logo" aria-label="Anclora Flow">
          <span class="logo__icon" aria-hidden="true"></span>
          <span class="logo__text">Anclora Flow</span>
        </div>
        <button
          type="button"
          class="sidebar-toggle"
          data-sidebar-trigger="primary"
          aria-expanded="true"
          aria-label="Contraer la navegacion"
        >
          ${K()}
        </button>
      </div>
      <nav class="app-sidebar__nav" aria-label="Menu principal">
        <ul>${e}</ul>
      </nav>
    </aside>
  `}function re(e){return`
    <main class="app-shell">
      ${oe()}
      <div class="app-shell__workspace">
        ${ie(e)}
        <section id="page-content" class="page-content" aria-live="polite"></section>
      </div>
    </main>
  `}let B=!1;function le(){return B||(document.addEventListener("click",e=>{const a=e.target;a instanceof HTMLElement&&(a.id==="google-login"&&(window.location.href="http://localhost:8020/api/auth/google"),a.id==="github-login"&&(window.location.href="http://localhost:8020/api/auth/github"))}),B=!0),`
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
  `}const G=new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"});function W(e={}){const{name:a="Demo"}=e,s=a.split(/\s+/)[0]||"Demo",i=[{id:"deadline",icon:"⏳",title:"Dias hasta vencimiento",value:"14",helper:"Revisa tus obligaciones",tone:"warning"},{id:"iva",icon:"💰",title:"Proximo pago IVA",value:G.format(6600),helper:"Corresponde al T3 2025",tone:"info"},{id:"forecast",icon:"📊",title:"Estimacion anual",value:G.format(40050),helper:"Objetivo al 72%",tone:"success"},{id:"days",icon:"✅",title:"Dias sin incidencias",value:"387",helper:"Declaraciones al dia",tone:"neutral"}],t=[{icon:"🧾",title:"Nueva factura",description:"Crear facturas",href:"#/invoices?open=new-invoice"},{icon:"📉",title:"Gastos del mes",description:"Revisar gastos",href:"#/expenses"},{icon:"📆",title:"Proximas obligaciones",description:"Vencimientos fiscales",href:"#/calendar"},{icon:"🧮",title:"Calculadora IRPF",description:"Calcular impuestos",href:"#/assistant"},{icon:"📑",title:"Informes",description:"Analisis y metricas",href:"#/reports"},{icon:"🤖",title:"Asistente IA",description:"Ayuda inteligente",href:"#/assistant"}],n=[{label:"Modelo 303 - IVA",date:"20 ene 2025"},{label:"IRPF Q4 2024",date:"30 ene 2025"},{label:"Modelo 111",date:"20 feb 2025"}],r=[{label:"Factura #2025-001 creada",time:"Hace 2 horas",href:"#/invoices"},{label:"Gasto registrado: material oficina",time:"Hace 4 horas",href:"#/expenses"},{label:"Recordatorio: Modelo 303 proximo",time:"Hace 1 dia",href:"#/calendar"}],l=i.map(o=>`
        <article class="dashboard__kpi-card dashboard__kpi-card--${o.tone}" role="listitem">
          <span class="dashboard__kpi-icon" aria-hidden="true">${o.icon}</span>
          <div class="dashboard__kpi-copy">
            <p class="dashboard__kpi-label">${o.title}</p>
            <p class="dashboard__kpi-value">${o.value}</p>
            <p class="dashboard__kpi-helper">${o.helper}</p>
          </div>
        </article>
      `).join(""),d=t.map(o=>`
        <article class="dashboard__quick-card" role="listitem">
          <div class="dashboard__quick-icon" aria-hidden="true">${o.icon}</div>
          <div class="dashboard__quick-copy">
            <h3>${o.title}</h3>
            <p>${o.description}</p>
            <a class="dashboard__quick-link" href="${o.href}">Acceder</a>
          </div>
        </article>
      `).join(""),c=n.map(o=>`
        <li class="dashboard__timeline-item">
          <span class="dashboard__timeline-dot" aria-hidden="true"></span>
          <div class="dashboard__timeline-copy">
            <p class="dashboard__timeline-label">${o.label}</p>
            <p class="dashboard__timeline-date">${o.date}</p>
          </div>
        </li>
      `).join(""),p=r.map(o=>`
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
          ${l}
        </div>
      </section>

      <section class="dashboard__section" aria-labelledby="dashboard-quick">
        <div class="dashboard__section-head">
          <h2 id="dashboard-quick">Acciones rapidas</h2>
          <p>Gestiona tareas habituales desde un solo lugar</p>
        </div>
        <div class="dashboard__quick-list" role="list">
          ${d}
        </div>
      </section>

      <section class="dashboard__grid" aria-labelledby="dashboard-grid">
        <article class="dashboard__panel" aria-labelledby="dashboard-dates">
          <div class="dashboard__panel-head">
            <h2 id="dashboard-dates">Proximas fechas</h2>
            <p>Preparate para los vencimientos claves</p>
          </div>
          <ol class="dashboard__timeline">
            ${c}
          </ol>
        </article>
        <article class="dashboard__panel" aria-labelledby="dashboard-activity">
          <div class="dashboard__panel-head">
            <h2 id="dashboard-activity">Actividad reciente</h2>
            <p>Ultimas acciones registradas</p>
          </div>
          <ul class="dashboard__activity" role="list">
            ${p}
          </ul>
        </article>
      </section>
    </section>
  `}const b=new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:2}),y={cobradas:{label:"Cobrada",tone:"paid"},enviadas:{label:"Enviada",tone:"sent"},pendientes:{label:"Pendiente",tone:"pending"},vencidas:{label:"Vencida",tone:"overdue"},borradores:{label:"Borrador",tone:"draft"}},M=[{number:"F2025-001",client:"TechStart Solutions SL",issueDate:"2025-01-15",dueDate:"2025-02-14",total:2650,status:y.cobradas,daysLate:"",highlight:!0},{number:"F2025-002",client:"Consultoría Martínez",issueDate:"2025-02-01",dueDate:"2025-03-03",total:1224,status:y.enviadas,daysLate:"219 días tarde"},{number:"F2025-003",client:"Academia de Idiomas Global",issueDate:"2025-02-15",dueDate:"2025-03-17",total:648,status:y.pendientes,daysLate:"205 días tarde"},{number:"F2025-004",client:"Startup Innovation Hub",issueDate:"2025-03-01",dueDate:"2025-04-14",total:3710,status:y.vencidas,daysLate:"190 días tarde"},{number:"F2025-005",client:"Freelancer Network SL",issueDate:"2025-03-15",dueDate:"2025-04-14",total:1908,status:y.borradores,daysLate:"177 días tarde"}],ce=[...new Set(M.map(e=>e.client))],de=[{id:"total",title:"Facturación Total",hint:"Este mes",value:8500,badge:"+18.1%",tone:"primary"},{id:"pending",title:"Cobros Pendientes",hint:"4 facturas",value:4132,action:"Gestionar",tone:"alert"},{id:"average",title:"Facturación Media",hint:"Por cliente",value:2840,badge:"Por proyecto",tone:"neutral"},{id:"ratio",title:"Ratio de Cobro",hint:"En plazo",value:"82.5%",badge:"Bueno",tone:"success"}];function N(e){const[a,s,i]=e.split("-").map(Number);return`${i}/${s}/${a}`}function ue(){return de.map(e=>{const a=typeof e.value=="number"?b.format(e.value):e.value,s=e.badge?`<span class="invoices-card__badge">${e.badge}</span>`:"",i=e.action?`<button type="button" class="invoices-card__cta">${e.action}</button>`:"";return`
        <article class="invoices-card invoices-card--${e.tone}" role="listitem">
          <div class="invoices-card__content">
            <header class="invoices-card__header">
              <p class="invoices-card__title">${e.title}</p>
              <p class="invoices-card__hint">${e.hint}</p>
            </header>
            <p class="invoices-card__value">${a}</p>
            <footer class="invoices-card__footer">
              ${s}
              ${i}
            </footer>
          </div>
        </article>
      `}).join("")}function pe(){return M.map(e=>{const{number:a,client:s,issueDate:i,dueDate:t,total:n,status:r,daysLate:l,highlight:d}=e,c=r.label,p=r.tone;return`
        <tr
          data-invoice-row
          data-client="${s.toLowerCase()}"
          data-status="${p}"
          data-number="${a.toLowerCase()}"
          class="${d?"invoices-table__row invoices-table__row--highlight":"invoices-table__row"}"
        >
          <td data-column="Factura">
            <span class="invoices-table__number">${a}</span>
          </td>
          <td data-column="Cliente">
            <span class="invoices-table__client">${s}</span>
          </td>
          <td data-column="Emision">
            <time datetime="${i}">${N(i)}</time>
          </td>
          <td data-column="Vencimiento">
            <time datetime="${t}">${N(t)}</time>
          </td>
          <td data-column="Importe">
            <span class="invoices-table__amount">${b.format(n)}</span>
          </td>
          <td data-column="Estado">
            <span class="status-pill status-pill--${p}">
              <span class="status-pill__dot" aria-hidden="true"></span>
              ${c}
            </span>
          </td>
          <td data-column="Dias">
            <span class="invoices-table__days">${l||"-"}</span>
          </td>
          <td data-column="Acciones" class="invoices-table__actions">
            <button type="button" class="table-action" title="Ver factura" aria-label="Ver ${a}">
              <span aria-hidden="true">👁️</span>
            </button>
            <button type="button" class="table-action" title="Editar factura" aria-label="Editar ${a}">
              <span aria-hidden="true">✏️</span>
            </button>
            <button type="button" class="table-action" title="Descargar PDF" aria-label="Descargar ${a}">
              <span aria-hidden="true">📄</span>
            </button>
            <button type="button" class="table-action" title="Marcar como cobrada" aria-label="Marcar ${a} como cobrada">
              <span aria-hidden="true">✅</span>
            </button>
          </td>
        </tr>
      `}).join("")}function be(){return`
    <div class="modal" id="invoice-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="invoice-modal-title">
      <div class="modal__backdrop" data-modal-dismiss></div>
      <div class="modal__panel" role="document">
        <header class="modal__head">
          <div>
            <h2 id="invoice-modal-title">Nueva factura</h2>
            <p class="modal__subtitle">Completa los datos para generar la factura y enviarla al cliente.</p>
          </div>
          <button type="button" class="modal__close" data-modal-close aria-label="Cerrar modal">
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <form class="invoice-form" novalidate>
          <section class="invoice-form__section">
            <h3>Datos del cliente</h3>
            <div class="invoice-form__grid">
              <label class="form-field">
                <span>Cliente</span>
                <input type="text" name="client" placeholder="Introduce el nombre fiscal" required />
              </label>
              <label class="form-field">
                <span>Email</span>
                <input type="email" name="clientEmail" placeholder="cliente@empresa.com" />
              </label>
              <label class="form-field">
                <span>NIF / CIF</span>
                <input type="text" name="clientTaxId" placeholder="B12345678" />
              </label>
              <label class="form-field">
                <span>Dirección</span>
                <input type="text" name="clientAddress" placeholder="Calle, ciudad, provincia" />
              </label>
            </div>
          </section>

          <section class="invoice-form__section">
            <h3>Datos de la factura</h3>
            <div class="invoice-form__grid invoice-form__grid--compact">
              <label class="form-field">
                <span>Nº de factura</span>
                <input type="text" name="invoiceNumber" value="F2025-006" />
              </label>
              <label class="form-field">
                <span>Fecha de emisión</span>
                <input type="date" name="issueDate" value="2025-10-08" />
              </label>
              <label class="form-field">
                <span>Fecha de vencimiento</span>
                <input type="date" name="dueDate" value="2025-11-08" />
              </label>
              <label class="form-field">
                <span>Proyecto</span>
                <input type="text" name="project" placeholder="Nombre del proyecto" />
              </label>
            </div>
          </section>

          <section class="invoice-form__section invoice-form__section--lines">
            <div class="invoice-form__section-head">
              <h3>Conceptos</h3>
              <button type="button" class="invoice-form__add-line">
                <span aria-hidden="true">＋</span>
                Añadir línea
              </button>
            </div>
            <div class="invoice-lines">
              <article class="invoice-line">
                <div class="invoice-line__desc">
                  <label class="form-field">
                    <span>Descripción</span>
                    <input type="text" name="lineDescription" value="Servicios de consultoría fiscal" />
                  </label>
                </div>
                <div class="invoice-line__meta">
                  <label class="form-field">
                    <span>Horas</span>
                    <input type="number" inputmode="decimal" name="lineQty" value="10" min="0" step="0.5" />
                  </label>
                  <label class="form-field">
                    <span>Tarifa</span>
                    <input type="number" inputmode="decimal" name="lineRate" value="120" min="0" step="0.01" />
                  </label>
                  <label class="form-field">
                    <span>IVA</span>
                    <select name="lineVat">
                      <option value="21" selected>21%</option>
                      <option value="10">10%</option>
                      <option value="4">4%</option>
                      <option value="0">Exento</option>
                    </select>
                  </label>
                </div>
                <div class="invoice-line__total">
                  <span class="invoice-line__total-label">Importe estimado</span>
                  <span class="invoice-line__total-value">${b.format(1452)}</span>
                </div>
              </article>
            </div>
          </section>

          <section class="invoice-form__section invoice-summary">
            <h3>Resumen</h3>
            <dl class="invoice-summary__list">
              <div class="invoice-summary__row">
                <dt>Base imponible</dt>
                <dd>${b.format(1200)}</dd>
              </div>
              <div class="invoice-summary__row">
                <dt>IVA (21%)</dt>
                <dd>${b.format(252)}</dd>
              </div>
              <div class="invoice-summary__row">
                <dt>Retención IRPF (15%)</dt>
                <dd>- ${b.format(180)}</dd>
              </div>
              <div class="invoice-summary__row invoice-summary__row--total">
                <dt>Total a cobrar</dt>
                <dd>${b.format(1272)}</dd>
              </div>
            </dl>
          </section>

          <footer class="invoice-form__footer">
            <button type="button" class="btn-secondary" data-modal-close>Cancelar</button>
            <button type="submit" class="btn-primary">Guardar y enviar</button>
          </footer>
        </form>
      </div>
    </div>
  `}function he(){return`
    <section class="invoices" aria-labelledby="invoices-title">
      <header class="invoices__hero">
        <div class="invoices__hero-copy">
          <h1 id="invoices-title">Ingresos &amp; Facturas</h1>
          <p>Controla facturación, cobros y rendimiento en un panel unificado.</p>
        </div>
        <div class="invoices__hero-actions">
          <button type="button" class="btn-primary" data-modal-open="invoice">Nueva factura</button>
          <button type="button" class="btn-ghost" data-feature-pending="add-payment">Añadir cobro</button>
        </div>
      </header>

      <section class="invoices__filters" aria-label="Filtros de facturas">
        <div class="invoices__filters-group">
          <label class="visually-hidden" for="invoice-search">Buscar facturas</label>
          <input
            type="search"
            id="invoice-search"
            class="invoices__search"
            placeholder="Buscar facturas..."
            autocomplete="off"
            data-invoices-search
          />
        </div>
        <div class="invoices__filters-group">
          <label class="visually-hidden" for="invoice-status">Filtrar por estado</label>
          <select id="invoice-status" class="invoices__select" data-invoices-filter="status">
            <option value="all">Todos los estados</option>
            <option value="paid">Cobradas</option>
            <option value="sent">Enviadas</option>
            <option value="pending">Pendientes</option>
            <option value="overdue">Vencidas</option>
            <option value="draft">Borradores</option>
          </select>
        </div>
        <div class="invoices__filters-group">
          <label class="visually-hidden" for="invoice-client">Filtrar por cliente</label>
          <select id="invoice-client" class="invoices__select" data-invoices-filter="client">
            <option value="all">Todos los clientes</option>
            ${ce.map(e=>`<option value="${e.toLowerCase()}">${e}</option>`).join("")}
          </select>
        </div>
        <div class="invoices__filters-group invoices__filters-group--pinned">
          <button type="button" class="btn-ghost" data-export-excel>
            <span aria-hidden="true">📊</span>
            Exportar Excel
          </button>
        </div>
      </section>

      <section class="invoices-table" aria-label="Listado de facturas">
        <div class="invoices-table__surface">
          <table>
            <thead>
              <tr>
                <th scope="col">Nº Factura</th>
                <th scope="col">Cliente</th>
                <th scope="col">Fecha Emisión</th>
                <th scope="col">Fecha Vencimiento</th>
                <th scope="col">Importe Total</th>
                <th scope="col">Estado</th>
                <th scope="col">Días</th>
                <th scope="col"><span class="visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              ${pe()}
            </tbody>
          </table>
          <div class="invoices-table__empty" hidden>
            <p>No hay facturas que coincidan con los filtros seleccionados.</p>
          </div>
        </div>
        <footer class="invoices-table__footer">
          <p data-result-count>Mostrando 1-5 de ${M.length} facturas</p>
          <div class="invoices-table__pager" role="navigation" aria-label="Paginación">
            <button type="button" class="pager-btn" disabled aria-disabled="true">Anterior</button>
            <button type="button" class="pager-btn pager-btn--primary">Siguiente</button>
          </div>
        </footer>
      </section>

      <section class="invoices__insights" aria-label="Indicadores clave">
        <div class="invoices__metrics" role="list">
          ${ue()}
        </div>

        <div class="invoices__charts">
          <article class="chart-card chart-card--line">
            <div class="chart-card__head">
              <h3>Evolución mensual - Ingresos</h3>
              <p>Comparativa de los últimos 12 meses</p>
            </div>
            <svg class="chart chart--line" viewBox="0 0 320 180" role="img" aria-label="Gráfico de ingresos">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="rgba(51,102,255,0.45)"></stop>
                  <stop offset="100%" stop-color="rgba(51,102,255,0)"></stop>
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="var(--secondary-400)"></stop>
                  <stop offset="100%" stop-color="var(--accent-500)"></stop>
                </linearGradient>
              </defs>
              <polyline
                fill="url(#lineGradient)"
                stroke="url(#strokeGradient)"
                stroke-width="4"
                stroke-linecap="round"
                points="10,140 40,120 70,130 100,115 130,118 160,105 190,110 220,108 250,95 280,100 310,70"
              ></polyline>
              <g class="chart__axis">
                <line x1="10" y1="150" x2="310" y2="150"></line>
                <line x1="10" y1="40" x2="10" y2="150"></line>
              </g>
            </svg>
          </article>
          <article class="chart-card chart-card--bars">
            <div class="chart-card__head">
              <h3>Top 5 clientes</h3>
              <p>Facturación acumulada anual</p>
            </div>
            <svg class="chart chart--bars" viewBox="0 0 320 180" role="img" aria-label="Ranking de clientes">
              <g>
                <rect x="40" y="60" width="36" height="100" class="bar bar--1"></rect>
                <rect x="90" y="80" width="36" height="80" class="bar bar--2"></rect>
                <rect x="140" y="95" width="36" height="65" class="bar bar--3"></rect>
                <rect x="190" y="105" width="36" height="55" class="bar bar--4"></rect>
                <rect x="240" y="120" width="36" height="40" class="bar bar--5"></rect>
              </g>
            </svg>
          </article>
          <article class="chart-card chart-card--donut">
            <div class="chart-card__head">
              <h3>Distribución por servicio</h3>
              <p>Reparto de facturación por línea</p>
            </div>
            <svg class="chart chart--donut" viewBox="0 0 180 180" role="img" aria-label="Distribución por servicio">
              <circle class="donut-ring" cx="90" cy="90" r="70"></circle>
              <circle class="donut-segment donut-segment--primary" cx="90" cy="90" r="70" stroke-dasharray="300 440" stroke-dashoffset="0"></circle>
              <circle class="donut-segment donut-segment--accent" cx="90" cy="90" r="70" stroke-dasharray="220 440" stroke-dashoffset="-300"></circle>
              <circle class="donut-segment donut-segment--secondary" cx="90" cy="90" r="70" stroke-dasharray="120 440" stroke-dashoffset="-520"></circle>
            </svg>
            <ul class="chart-legend">
              <li><span class="legend-dot legend-dot--primary"></span>Desarrollo web</li>
              <li><span class="legend-dot legend-dot--accent"></span>Consultoría</li>
              <li><span class="legend-dot legend-dot--secondary"></span>Enseñanza</li>
              <li><span class="legend-dot legend-dot--muted"></span>Diseño</li>
            </ul>
          </article>
        </div>
      </section>
    </section>
    ${be()}
  `}function me(){return`
    <section class="module expenses">
      <h2>Gastos y Deducciones</h2>
      <button id="new-expense" type="button">Anadir gasto</button>
      <div id="expense-list"></div>
    </section>
  `}function ve(){return`
    <section class="module clients">
      <h2>Clientes y Proyectos</h2>
      <button id="new-client" type="button">Nuevo cliente</button>
      <div id="client-list"></div>
    </section>
  `}function fe(){return`
    <section class="module subscriptions">
      <h2>Gestion Inteligente de Suscripciones</h2>
      <button id="add-subscription" type="button">Suscribirse</button>
      <div id="subscription-list"></div>
    </section>
  `}function ge(){return`
    <section class="module budget">
      <h2>Presupuesto Personal Inteligente</h2>
      <div id="budget-chart"></div>
    </section>
  `}function _e(){return`
    <section class="module calendar">
      <h2>Calendario Fiscal y Calculadora Avanzada</h2>
      <div id="calendar-widget"></div>
      <div id="tax-calculator"></div>
    </section>
  `}function ye(){return`
    <section class="module reports">
      <h2>Informes y Metricas</h2>
      <button id="generate-report" type="button">Generar informe</button>
      <div id="report-list"></div>
    </section>
  `}function Ee(){return`
    <section class="module assistant">
      <h2>Asistente IA Integrado</h2>
      <div id="assistant-chat"></div>
    </section>
  `}function we(e={}){const{email:a="",authProvider:s=""}=e;return`
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
          <input name="email" value="${a}" />
        </label>
        <label>Proveedor
          <input name="provider" value="${s}" readonly />
        </label>
        <button type="submit">Guardar</button>
      </form>
    </section>
  `}const H={"/dashboard":W,"/invoices":he,"/expenses":me,"/clients":ve,"/subscriptions":fe,"/budget":ge,"/calendar":_e,"/reports":ye,"/assistant":Ee,"/settings":we},X={name:"Demo",email:"demo@demo.com",avatar:"",authProvider:"local"},v={theme:"anclora-theme",language:"anclora-language",sidebar:"anclora-sidebar"},I=document.documentElement;let F=[],P=[],O=!1,V=!1;const L={COLLAPSED:"collapsed",EXPANDED:"expanded"},Se=960,u=window.matchMedia(`(max-width: ${Se}px)`);function De(){const e=localStorage.getItem(v.sidebar);return e===L.COLLAPSED?!0:e===L.EXPANDED?!1:window.matchMedia("(max-width: 1280px)").matches}let C=De(),S=C,A=!1,j=!1;const Q='a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';let E=null,$=!1;function Ae(){return window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}let h=localStorage.getItem(v.theme)||Ae(),m=localStorage.getItem(v.language)||"es";function x(e=[],a,s){e.forEach(i=>{const t=i.dataset[a]===s;i.classList.toggle("is-active",t),i.setAttribute("aria-pressed",String(t))})}function q(e){h=e==="dark"?"dark":"light",h==="dark"?I.setAttribute("data-theme","dark"):I.removeAttribute("data-theme"),x(F,"theme",h)}function Y(e){m=e==="en"?"en":"es",I.setAttribute("lang",m),x(P,"lang",m)}q(h);Y(m);function J(){const e=Array.from(document.querySelectorAll(".theme-switch__btn")),a=Array.from(document.querySelectorAll(".lang-switch__btn"));!e.length||!a.length||(F=e,P=a,O||(e.forEach(s=>{s.addEventListener("click",i=>{const t=i.currentTarget.dataset.theme;!t||t===h||(q(t),localStorage.setItem(v.theme,h))})}),a.forEach(s=>{s.addEventListener("click",i=>{const t=i.currentTarget.dataset.lang;!t||t===m||(Y(t),localStorage.setItem(v.language,m))})}),O=!0),x(F,"theme",h),x(P,"lang",m))}function Le(){const e=document.querySelector(".user-menu");if(!e)return;const a=e.querySelector(".user-chip"),s=e.querySelector(".dropdown");if(!a||!s)return;const i=()=>{e.classList.remove("is-open"),a.setAttribute("aria-expanded","false")};V||(a.addEventListener("click",t=>{t.preventDefault();const n=!e.classList.contains("is-open");n?e.classList.add("is-open"):e.classList.remove("is-open"),a.setAttribute("aria-expanded",String(n))}),document.addEventListener("click",t=>{e.contains(t.target)||i()}),a.addEventListener("keydown",t=>{t.key==="Escape"&&(i(),a.blur())}),V=!0)}function k(){return document.getElementById("invoice-modal")}function $e(e){if(e.key!=="Tab")return;const a=k();if(!a)return;const s=Array.from(a.querySelectorAll(Q)).filter(l=>!l.hasAttribute("disabled")&&l.getAttribute("tabindex")!=="-1");if(!s.length){e.preventDefault();return}const i=s[0],t=s[s.length-1],n=e.shiftKey,r=document.activeElement;!n&&r===t?(e.preventDefault(),i.focus()):n&&r===i&&(e.preventDefault(),t.focus())}function w(){const e=k();!e||!$||(e.classList.remove("is-open"),e.setAttribute("aria-hidden","true"),document.body.classList.remove("is-lock-scroll"),$=!1,e.removeEventListener("keydown",Z),E&&typeof E.focus=="function"&&E.focus(),E=null)}function Z(e){if(e.key==="Escape"&&!e.defaultPrevented){e.preventDefault(),w();return}$e(e)}function z(){const e=k();if(!e)return;E=document.activeElement,e.classList.add("is-open"),e.setAttribute("aria-hidden","false"),document.body.classList.add("is-lock-scroll"),$=!0,e.addEventListener("keydown",Z);const s=Array.from(e.querySelectorAll(Q)).filter(i=>!i.hasAttribute("disabled")&&i.getAttribute("tabindex")!=="-1")[0];s&&window.requestAnimationFrame(()=>{s.focus()})}function xe(){const e=k();if(!e||e.dataset.modalReady==="true")return;const a=e.querySelector("[data-modal-dismiss]"),s=e.querySelectorAll("[data-modal-close]"),i=e.querySelector("form");a&&a.addEventListener("click",()=>w()),s.forEach(t=>{t.addEventListener("click",n=>{n.preventDefault(),w()})}),i&&i.addEventListener("submit",t=>{t.preventDefault(),w()}),e.dataset.modalReady="true"}function f(e,a={}){const s=document.querySelector(".app-shell");if(S=e,!s)return;const i=s.querySelector(".app-sidebar"),t=s.querySelectorAll("[data-sidebar-trigger]"),n=u.matches,r=a.persist??!n;n?(s.classList.toggle("is-sidebar-open",!e),s.classList.remove("is-collapsed"),document.body.classList.toggle("is-lock-scroll",!e)):(s.classList.toggle("is-collapsed",e),s.classList.remove("is-sidebar-open"),document.body.classList.remove("is-lock-scroll")),i&&i.setAttribute("data-state",e?"collapsed":"expanded"),t.forEach(l=>{const d=!e,c=d?"Contraer la navegacion":"Expandir la navegacion";l.setAttribute("aria-expanded",String(d)),l.setAttribute("aria-label",c),l.setAttribute("title",c)}),r&&(C=e,localStorage.setItem(v.sidebar,e?L.COLLAPSED:L.EXPANDED))}function Ce(e){if(!u.matches)return;const a=document.querySelector(".app-shell"),s=a?.querySelector(".app-sidebar");if(!a||!s||s.contains(e.target))return;const i=a.querySelectorAll("[data-sidebar-trigger]");for(const t of i)if(t.contains(e.target))return;S||f(!0,{persist:!1})}function ke(e){e.key!=="Escape"||e.defaultPrevented||!u.matches||S||f(!0,{persist:!1})}function Ie(){const e=document.querySelector(".app-shell");if(!e)return;const a=Array.from(e.querySelectorAll("[data-sidebar-trigger]"));a.length&&(a.forEach(s=>{s.dataset.sidebarReady!=="true"&&(s.addEventListener("click",i=>{i.preventDefault(),f(!S)}),s.dataset.sidebarReady="true")}),j||(document.addEventListener("click",Ce),document.addEventListener("keyup",ke),j=!0))}function Fe(e){const a=e.startsWith("/")?e:`/${e}`,s=document.querySelectorAll(".app-sidebar__link");s.length&&s.forEach(i=>{const t=i.getAttribute("href")||"",r=(t.startsWith("#")?t.slice(1):t)===a;i.classList.toggle("is-active",r),r?(i.setAttribute("aria-current","page"),i.removeAttribute("tabindex")):i.removeAttribute("aria-current")})}function Pe(){u.matches&&(S||f(!0,{persist:!1}))}function U(e){if(e.matches){f(!0,{persist:!1});return}f(C,{persist:!1})}function Me(e){xe(),document.querySelectorAll('[data-modal-open="invoice"]').forEach(o=>{o.dataset.modalTriggerReady!=="true"&&(o.addEventListener("click",D=>{D.preventDefault(),z()}),o.dataset.modalTriggerReady="true")});const s=document.querySelector("[data-invoices-search]"),i=document.querySelector('[data-invoices-filter="status"]'),t=document.querySelector('[data-invoices-filter="client"]'),n=Array.from(document.querySelectorAll("[data-invoice-row]")),r=document.querySelector(".invoices-table__empty"),l=document.querySelector("[data-result-count]"),d=n.length,c=()=>{const o=(s?.value||"").trim().toLowerCase(),D=i?.value||"all",T=t?.value||"all";let g=0;n.forEach(_=>{const ae=!o||_.dataset.number?.includes(o)||_.dataset.client?.includes(o),te=D==="all"||_.dataset.status===D,se=T==="all"||_.dataset.client===T,R=!!(ae&&te&&se);_.hidden=!R,R&&(g+=1)}),r&&(r.hidden=g!==0),l&&(g===0?l.textContent="No se encontraron facturas":g===d?l.textContent=`Mostrando ${g} de ${d} facturas`:l.textContent=`Mostrando ${g} de ${d} facturas`)};s&&s.addEventListener("input",c),i&&i.addEventListener("change",c),t&&t.addEventListener("change",c),c();const p=document.querySelector('[data-feature-pending="add-payment"]');p&&p.dataset.pendingBound!=="true"&&(p.addEventListener("click",o=>{o.preventDefault(),window.alert("La gestión de cobros estará disponible próximamente.")}),p.dataset.pendingBound="true"),e&&e.get("open")==="new-invoice"&&window.requestAnimationFrame(()=>{z()})}function qe(e,a){switch(e){case"/invoices":Me(a);break}}function Te(e){const a=e,[s,i=""]=a.split("?"),t=s||"/dashboard";let n;try{n=new URLSearchParams(i)}catch{n=new URLSearchParams}return{path:t,params:n}}function Re(){J(),Le(),Ie()}if(window.matchMedia){const e=window.matchMedia("(prefers-color-scheme: dark)"),a=s=>{localStorage.getItem(v.theme)||(q(s.matches?"dark":"light"),J())};e.addEventListener?e.addEventListener("change",a):e.addListener&&e.addListener(a)}u.addEventListener?u.addEventListener("change",U):u.addListener&&u.addListener(U);function Be(){if(!!document.getElementById("page-content")||(document.body.innerHTML=re(X),A=!1),!A){const a=u.matches?!0:C;f(a,{persist:!1}),A=!0}}function ee(){const e=window.location.hash||"",a=e.startsWith("#")?e.slice(1):e,{path:s,params:i}=Te(a||"/dashboard"),t=H[s]?s:"/dashboard";if($&&w(),t==="/login"){document.body.classList.remove("is-lock-scroll"),A=!1,document.body.innerHTML=le();return}Be(),Re();const n=H[t]||W,r=document.getElementById("page-content");r&&(r.innerHTML=n(X)),qe(t,i),Fe(t),u.matches&&Pe()}window.addEventListener("hashchange",ee);document.addEventListener("DOMContentLoaded",ee);
