# CRM design tokens and recipes

Source of truth: `crm-app/src/app/globals.css` (see the "Apple Restraint Layer v6.0" at the end). Tailwind v4, shadcn, Geist/Heebo and system fonts.

## Type
| Role | Class | Notes |
|---|---|---|
| Page title | `text-2xl font-semibold tracking-tight` | One per page |
| Section title | `text-lg font-semibold` | |
| KPI number | `text-3xl font-semibold tabular-nums` | Solid color, no gradient |
| Body | `text-sm text-slate-700` | weight 400 |
| Label / meta | `text-xs text-slate-500` | |
| Emphasis | `font-bold` only once per card | |

## Color roles
| Role | Default light surface | Optional dark theme |
|---|---|---|
| Canvas | `--app-bg` | `html.dark` overrides |
| Card | `bg-white` | `.dark` override where needed |
| Text strong / body / muted | `text-slate-900 / 700 / 500` | handled by `.dark` overrides |
| Accent (selection, focus, primary) | brand teal `--t22-teal` | same |
| CTA (add actions only) | `.t22-btn-cta` orange | same |
| Hired / Process / Rejected / New | emerald-600 / sky-600 / rose-600 / slate-600 | tinted pill + text label |

Prefer `var(--text-strong)`, `var(--text-body)`, `var(--text-muted)`, `var(--surface)`, `var(--hairline)` over hex. New hex values need a reason.

## Radius / spacing / shadow
- Radius: `rounded-lg` 8 (inputs, chips), `rounded-xl` 12 (buttons, small cards), `rounded-2xl` 16 (cards), `rounded-3xl` 24 (page header, dialogs), `rounded-full` (pills).
- Spacing: 4/8 grid, `p-4`/`p-6` cards, `gap-4`/`gap-6` between cards.
- Shadow: cards `--shadow-soft-sm`, floating layers `--shadow-soft-lg`. Nothing colored.

## Motion
- Variables: `--ease-standard`, `--dur-fast` 150ms, `--dur-base` 200ms.
- Allowed: opacity, background-color, border-color, 1-2px translateY on hover.
- Forbidden on utility screens: bounce/spring overshoot, `scale` > 1 on hover, `animate-pulse/bounce/ping` on data, page-entry translate.

## Glass (chrome only)
- OK: top navbar, sidebar, sticky filter/save bars (`.t22-sticky-bar`, `.t22-save-bar`), dialogs.
- Not OK: stat cards, list rows, table wrappers.

## Page skeleton
```
<header>   page title + one primary action + period/filter control
<kpi strip> 3-5 metrics, each also a filter, one accent each
<list>     search in the list header, one record per row
```
Record anatomy: identity -> pipeline/status -> date rail. Secondary info (phone, city) is muted.

## RTL snippets
- Spacing: `ms-2 me-2 ps-4 pe-4 text-start`. Existing shadcn inputs may use a scoped `pl-*`/`pr-*` compatibility override when logical padding fails.
- LTR islands: `<span dir="ltr">050-1234567</span>`.
- Never `style={{ left/right }}`; use `inset-inline-start/end`.

## Audit counters (find work to do)
PowerShell from `crm-app/src`: count `font-(bold|extrabold|black)`, `#[0-9a-fA-F]{6}`, `\b(ml|mr|pl|pr)-\d`, `bg-gradient-to`, `backdrop-blur`, and emoji per file. Fix the worst files first, one screen per commit.
