# TWENTY2CRM design system — 2026

Research basis: Linear/Vercel command surfaces, shadcn dashboard patterns, WCAG 2.2, and RTL product UI. Apply this whenever a CRM screen is redesigned.

## What “dated” looks like here
- Emoji as the page title.
- Five identical white cards with a pastel icon.
- Native `<select>` and `<input type="month">` as the main control.
- A long border-box list where name, phone, jobs, and dates compete on one line.
- Status shown only by a colored badge, with icon-only actions and no label.

## Information hierarchy
1. **Command header** — what period, what mode, one refresh.
2. **Decision metrics** — total, hired, in process, rejected, new. Each metric is also the filter.
3. **Context** — conversion rate and period label, computed from the same list.
4. **Work surface** — search, then one record per row.
5. **Record anatomy** — identity, pipeline, then a date rail. Edit expands in place.

The eye should land on the number, then the name, then the employer. Phone and city are secondary.

## Color
Use OKLCH-like restraint, not rainbow Tailwind:

| Role | Token | Use |
|---|---|---|
| Ink | `slate-950` | Headers, names |
| Mute | `slate-500` | Meta |
| Canvas | `slate-50` to white | Page |
| Hired | emerald-600 | Accepted only |
| Process | sky-600 | In process only |
| Rejected | rose-600 | Rejected only |
| New | slate-600 | Untriaged |
| Brand | `--t22-teal` | Selection, focus, primary |

One accent per card. A selected KPI gets a 2px ring in its own accent plus a tinted background. Do not ring everything purple.

## Type
- Page title: `text-2xl font-semibold tracking-tight`, not `text-3xl font-bold`.
- KPI number: `text-3xl font-semibold tabular-nums`.
- Meta: `text-xs text-slate-500`.
- Never use emoji as a label. A 16px Lucide icon plus Hebrew text is enough.

## Surfaces
- Page: a light solid tokenized canvas (`--app-bg`); no decorative gradients.
- Header: light solid surface with a hairline and restrained shadow. Glass is reserved for floating chrome only.
- Cards: `rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_40px_-24px_rgba(15,23,42,0.35)]` (solid; `backdrop-blur` is for floating chrome only, see `apple-design-crm`)
- Records: white, `rounded-2xl`, hover lifts 1px. Editing state is amber tint, not a yellow form from 2008.

## Controls
- Segmented control is a pill track (`bg-slate-100 p-1`), active segment is white with shadow. Not two bordered buttons.
- Month/year picker is a designed control: chevrons + label, with the native input visually hidden but still present for accessibility.
- Search sits in the list header, not as a lonely full-width field.
- Quick actions are labeled icon buttons, 32px, with `title` and `aria-label`. Active status is filled.
- Focus: use the established teal focus token from `globals.css`.

## Motion
- `transition-[transform,box-shadow,background-color] duration-200`
- KPI selection and row hover only. No infinite pulse on data.
- `@media (prefers-reduced-motion: reduce)` disables transforms.

## Accuracy rules
- Period label is formatted in `he-IL`, never a raw `2026-10`.
- Conversion = hired / total for the selected period. If total is 0, show `—`, not `NaN%` or `Infinity`.
- Filter chips show counts. The list header count is the filtered count, and the subtitle says so.
- Dates stay on `Asia/Jerusalem` through the existing formatters. Do not re-parse them in the view.
- A missing employer, deleted job, or absent interview is an explicit quiet state, not a blank gap.

## RTL and density
- `dir="rtl"` is inherited. Do not set `left`/`right` in inline styles.
- Wrap meta with `flex-wrap`. A Hebrew name plus three jobs must not overflow the action cluster.
- On small screens the action cluster drops below the identity block. Do not squeeze icon buttons into the name.

## Do not
- Add a chart library for five numbers.
- Replace shadcn `Button`/`Input`/`Card` with a new component kit.
- Hide the edit form behind a modal unless the user asks. In-place edit is the current workflow.
- Ship a visual change that drops phone, uploader, interview, or “sent to job” data.
