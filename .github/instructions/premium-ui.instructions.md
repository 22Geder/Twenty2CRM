---
applyTo: "crm-app/src/app/**/*.tsx,crm-app/src/components/**/*.tsx,crm-app/src/app/**/*.css"
description: "Use when editing TWENTY2CRM screens: premium 2026 UI, RTL, accurate metrics, no dated admin styling. Triggers: עיצוב, UI, דשבורד, כרטיס, סטטוס."
---

# Premium UI while editing screens

Before a visual change, follow `.github/skills/apple-design-crm/SKILL.md` (wins on conflict), then `.github/skills/premium-ui-design/SKILL.md` and its design system.

- Apple restraint: glass only on chrome, solid content cards, no gradient text, weights 400/600/700, radius scale 8/12/16/24/full, quiet motion (150-200ms).
- Prefer logical RTL utilities (`ms/me/ps/pe`), tokens instead of hex, and no emoji as UI. A narrowly scoped `pl`/`pr` override is allowed when an existing shadcn control does not correctly honor logical padding.
- The dashboard shell is intentionally light. Dark styling exists only under `html.dark`; do not reintroduce dark hero banners or a dark default shell.
- The no-emoji rule applies to UI only, never to WhatsApp, SMS, email, or social-message templates.
- Decorative gradients are not used; retain established semantic chart and status colors.
- Use explicit local state for dialogs when the custom `Dialog` cannot compose with `DialogTrigger`.

- Keep existing data rules and API payloads. Restyle only.
- Hebrew RTL, one accent per status, tabular numbers, labeled actions.
- Format months and rates in `he-IL`. Never show `NaN`, raw `YYYY-MM`, or emoji page titles.
- Loading, empty, and selected states are part of the design.
- Preserve every field the screen already shows.
