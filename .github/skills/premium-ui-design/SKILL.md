---
name: premium-ui-design
description: "Use when redesigning, polishing, or building any TWENTY2CRM screen so it looks like a 2026 product, not a dated admin form. Triggers: עיצוב, נראה ישן, נראה מיושן, לא מקצועי, UI, UX, דשבורד, כרטיסים, סטטוס חודשי, סטטוס שנתי, monthly-status, תעשה יפה, חדשני, מודרני, polish, redesign, visual refresh."
argument-hint: "Which screen or component should look premium"
user-invocable: true
---

# Premium UI Design — TWENTY2CRM

Load [references/design-system.md](./references/design-system.md) before changing any visual surface. Also follow `.github/skills/apple-design-crm/SKILL.md`; where they conflict (for example glass on cards), the Apple restraint skill wins.

## When to use
- A screen looks flat, crowded, or ten years old.
- The user asks for professional, accurate, modern, or 2026-level design.
- A new dashboard, report, status board, or candidate list is being built.

## Non-negotiables
1. Redesign the presentation. Do not change status rules, date filters, APIs, or saved fields unless the task explicitly asks for it.
2. Hebrew is RTL. Icons sit on the logical start of text. Use `ms`/`me` or `gap`, not hardcoded left margins.
3. Every number on screen must come from the same filtered dataset. Never show a total that does not match the list.
4. One primary action per region. Status changes stay one click, with a visible pressed state.
5. Empty, loading, and error states are designed. A spinner alone is not a state.
6. Respect `prefers-reduced-motion`. Motion explains hierarchy; it never loops aggressively.
7. Do not invent a second color system. Extend the existing Tailwind + shadcn surface.

## Procedure
1. Read the full screen and every action it already supports.
2. Map data → decision: what the user must see in 3 seconds, then what they edit.
3. Rebuild the shell first: period control, KPI strip, filters, then records.
4. Keep every existing mutation payload identical.
5. Check contrast, 44px touch targets for primary controls, and overflow on 1280px and mobile.
6. Run diagnostics on the edited file. Do not claim the design is done with type errors.

## Visual bar
A finished screen has a quiet light command header, solid KPI cards with one accent each (glass is reserved for floating chrome), a segmented period control, and records that read as a pipeline — not a stack of gray boxes. Dates are a timeline. Status is color plus text, never color alone. Dark presentation is limited to the explicit `html.dark` theme.
