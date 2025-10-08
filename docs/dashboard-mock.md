# Dashboard Mockups

## Light Mode Overview
- **Background**: `var(--bg-secondary)` for canvas, cards with `var(--bg-primary)` and subtle `--border-color` outline (contrast ratio >= 4.5:1).
- **Hero strip**: compact banner using `--gradient-hero`, height 128px, left column with greeting + short status pill, right column lists next due date badge.
- **Metrics row**: four KPI tiles (`--bg-primary`) with accent top border using `--primary-400`, icon chips with `--primary-100` background; typography `1.4rem` bold values, supporting text `0.85rem` in `--text-secondary`.
- **Quick actions**: two-column grid of six buttons; each card uses neutral background `--bg-secondary`, no arrow icon, instead CTA button text with underline on hover; icons in circular badges tinted with `--secondary-100`.
- **Insights split**: left timeline list (vertical divider accent `--accent-400`), right activity list with alternating row highlight `rgba(51,102,255,0.04)`.

```
┌──────────────────────────────────────────────────────────┐
│ Hero: Hola Demo  | Siguiente obligación en 14 días        │
├──────────────────────────────────────────────────────────┤
│ KPI1 │ KPI2 │ KPI3 │ KPI4                                │
├──────────────────────────────────────────────────────────┤
│ Quick Action Cards (2 cols x 3 rows, touch-friendly)     │
├───────────────┬──────────────────────────────────────────┤
│ Timeline      │ Activity Feed                            │
│ (next taxes)  │ (latest invoices, gastos)                │
└───────────────┴──────────────────────────────────────────┘
```

## Dark Mode Overview
- **Background**: switch document `data-theme="dark"`; cards use `--bg-dark-secondary` with `rgba(148,163,184,0.18)` border for contrast > 4.8:1.
- **Hero strip**: gradient tweaked to `linear-gradient(135deg, #1d4ed8 0%, #14b8a6 45%, #c026d3 100%)`; text in `--text-dark-primary` with drop shadow `0 8px 26px rgba(15,23,42,0.45)` for depth.
- **KPI tiles**: maintain gradient fills for status but ensure body text uses pure white; support text in `rgba(241,245,249,0.75)`.
- **Quick actions**: background `rgba(30, 41, 59, 0.85)`, border `1px solid rgba(148,163,184,0.3)`, hover lifts + glow `0 12px 24px rgba(14,116,144,0.35)`.
- **Insights**: timeline markers in `--accent-500`, active row highlight `rgba(180,83,9,0.25)` for pending statuses.

```
┌──────────────────────────────────────────────────────────┐
│ Hero Gradient (dark) – texto claro, badge contraste alto │
├──────────────────────────────────────────────────────────┤
│ KPI cards (gradientes intensos, bordes neon suaves)      │
├──────────────────────────────────────────────────────────┤
│ Quick actions (grid 2x3, sin flechas, icono circular)    │
├───────────────┬──────────────────────────────────────────┤
│ Timeline badges| Activity feed con tags de estado        │
└───────────────┴──────────────────────────────────────────┘
```

## Accessibility Notes
- Minimum font size `0.82rem`; large text `>= 1.25rem` for KPIs.
- Ensure focus ring `outline: 3px solid var(--accent-400)` across components.
- Provide `aria-label` on quick actions and timeline links referencing action name.
- Use `prefers-reduced-motion` media query to disable hover lifts.

## Pending Decisions
1. Confirm removal of hero CTA duplicada (solo mantener botón "Ver resumen"?).
2. Validar si quick actions deben incluir subtítulo o etiquetas breves.
3. Alinear mensajes de idioma/tema con módulos i18n existentes (actualmente sin wiring).
