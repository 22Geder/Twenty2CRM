---
name: apple-design-crm
description: "Use for ANY visual work in TWENTY2CRM: new screens, restyles, components, CSS, spacing, typography, color, motion, dark/light, RTL, accessibility. Apple-grade restraint adapted to a Hebrew RTL light-scheme CRM. Triggers: עיצוב, UI, UX, נראה ישן, אפל, apple, premium, מראה, כרטיס, כפתור, צבעים, רווחים, אנימציה, dark, כהה, RTL, polish, redesign."
argument-hint: "Which screen/component to design or audit"
user-invocable: true
---

# Apple-grade design — TWENTY2CRM

Adapted from the community skill family `s1gmamale1/apple-design-skills` (not an official Apple release; Apple HIG themes: clarity, deference, depth). Principles are re-written for this codebase. Load [references/crm-tokens.md](./references/crm-tokens.md) before touching styles. This skill sits ABOVE `premium-ui-design`: when they conflict, this one wins.

## The one question
For every effect on a screen: "If I remove this, does the UI lose meaning, or only decoration?" Decoration goes.

## Core rules (utility screens = the whole CRM)
1. **Content leads, chrome recedes.** Hierarchy comes from type size/weight and whitespace, not boxes, borders, glow.
2. **One accent per region.** Brand teal for selection/focus/primary. Status colors (green/blue/red/amber) only for status, always with text, never color alone.
3. **Glass only on floating chrome** (top bar, sidebar, sticky bars, sheets/dialogs). Content cards are solid surfaces. No `backdrop-blur` on cards.
4. **Gradient text: zero** on KPIs/headings. Decorative gradient backgrounds are not used in CRM screens; semantic data visualization may use its established palette.
5. **Weight ladder 400 / 600 / 700.** Body 400, labels and headings 600, a single emphasis 700. No `font-extrabold`/`font-black`; avoid `font-medium` (500) for new code.
6. **Radius scale:** 8 (chips, inputs) / 12 (buttons, small cards) / 16 (cards) / 24 (page header, dialogs) / full (pills, avatars). Nothing else.
7. **Spacing on a 4/8 grid.** Prefer more space over a new element. Card padding 16–24, section gap 24–32.
8. **Shadows:** at most one soft shadow level for cards, one for floating layers. No colored glow, no stacked shadows.
9. **Motion on utility screens is near invisible:** 150–200ms, ease-standard, opacity/color/1–2px lift. No bounce, no scale-up on hover, no looping animation on data. `prefers-reduced-motion` must disable transforms.
10. **Emoji are not UI.** Use a 16px Lucide icon + Hebrew text. No emoji page titles or status labels; this rule does not apply to WhatsApp, SMS, email, or social-message templates.
11. **Real states.** Every list/panel has designed loading (skeleton), empty (icon + one sentence + one action), and error states.
12. **Accessibility is design:** 44px touch targets on touch, 16px inputs on touch, visible focus ring that follows the element shape, contrast >= 4.5:1 for text, support `prefers-contrast` and `prefers-reduced-transparency`.

## CRM-specific adaptations
- **Hebrew RTL first.** Prefer logical utilities (`ms/me/ps/pe/start/end`, `gap`) over `ml/mr/pl/pr/left/right`. Existing shadcn controls may require a narrowly scoped `pl`/`pr` override when logical padding is not reliably applied. Icons sit on the logical start of text. Numbers use `tabular-nums`; phone numbers and IDs get `dir="ltr"`.
- **Light scheme is the owner's decision (2026-10).** The dashboard canvas (`.t22-dashboard-shell`) is light; dark exists only behind the `html.dark` toggle. Sidebar and Avigdor panel read `--sb-*` CSS variables (light + `.dark` sets in globals.css). Do not reintroduce a dark shell, dark hero banners, or logo watermarks. Surfaces use tokens (see references), not hex or `!important`.
- **Accuracy over beauty.** Every number comes from the same filtered dataset as the list. Never `NaN`, raw `YYYY-MM`, or fake data. Dates in `he-IL` / `Asia/Jerusalem` via existing formatters.
- **Do not change behavior.** Restyle only: no API payloads, statuses, filters, or saved fields change in a design task.
- **Dialog composition is local.** The custom `Dialog` may render no trigger while closed. Prefer an explicit open state with a direct button over assuming shadcn's `DialogTrigger` composition works.
- **Surfaces outside the dashboard** (`/login`, `/upload-cv`, `/install`): public first impression. Light-first, calm, one accent, generous whitespace.
- **`/office-tv`** has its own skill (`office-tv-display`) and a larger motion budget. Do not apply utility rules there.

## Procedure
1. Read the whole screen and every action it supports.
2. Decide: what must the user see in 3 seconds? What do they edit?
3. Rebuild shell first (header, period/filter control, KPI strip), then records.
4. Replace hex, `font-bold`, `rounded-*`, `shadow-*`, `ml/mr` with tokens/scale from the references file as you touch a line. Do not mass-rewrite untouched code.
5. Run the restraint checklist (below) and `get_errors` on every edited file.
6. Check 1280px desktop, 390px mobile, light and dark theme (`html.dark`).

## Restraint checklist
- [ ] Could a solid card replace this glass/gradient card with no loss?
- [ ] One accent doing the pointing?
- [ ] Hierarchy carried by type + space, not borders/glow?
- [ ] Removed at least one effect since the first draft?
- [ ] Only weights 400/600/700 and radii from the scale?
- [ ] No UI emoji, no gradient text, no decorative gradients, no looping motion on data?
- [ ] Loading, empty, error states exist?
- [ ] Logical (RTL-safe) spacing utilities used?
- [ ] Focus visible, 44px touch targets, reduced-motion respected?
- [ ] Behavior and data unchanged?

## Do not
- Introduce a new component kit, chart library, or font. Extend shadcn + Tailwind + `globals.css`.
- Edit `globals.css` by rewriting old layers. It is layered v1..v6 with `!important`; append to the final "Apple Restraint Layer" or fix the specific rule.
- Add `!important` unless overriding an existing `!important`.
