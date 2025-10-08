const GRADIENT_CLASS_BY_TYPE = {
  primary: "kpi-revenue",
  secondary: "kpi-expenses",
  accent: "kpi-taxes"
};

const sanitizeText = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const sanitizeAttr = (value = "") => sanitizeText(value).replaceAll("'", "&#39;");

export function renderQuickAccessCard(title, icon = "", action = "", type = "primary") {
  const gradientClass = GRADIENT_CLASS_BY_TYPE[type] ?? GRADIENT_CLASS_BY_TYPE.primary;
  const safeTitle = sanitizeText(title);
  const iconMarkup = icon ? `<div class="card-icon">${icon}</div>` : "";
  const actionAttr = action ? ` onclick='${sanitizeAttr(action)}' role="button" tabindex="0"` : "";

  return `
    <div class="dashboard-card quick-access-card ${gradientClass}"${actionAttr}>
      ${iconMarkup}
      <h3 class="card-title">${safeTitle}</h3>
      <div class="card-arrow" aria-hidden="true">→</div>
    </div>
  `;
}

export default renderQuickAccessCard;
