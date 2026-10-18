---
name: taste-crm
description: "Use when deciding HOW a TWENTY2CRM screen should look and feel before building: art-direction judgment, design dials (variance / motion / density), hierarchy, typography, color restraint, brand voice for a Hebrew recruitment CRM. Our own taste system (inspired by public anti-slop frontend practice). Triggers: טעם, סגנון, כיוון עיצובי, taste, art direction, נראה גנרי, נראה זול, יוקרתי, מינימליסטי, hierarchy, typography, צבע."
argument-hint: "Screen or component + the feeling wanted"
user-invocable: true
---

# Taste — TWENTY2CRM

`apple-design-crm` = the rules. `taste-crm` = the judgment that picks between rule-compliant options. `design-critique-crm` = the review. `motion-craft-crm` = the movement.

## Brand read (fixed, do not re-ask)
22JOBS recruitment agency, Israel. Users: recruiters (all day, dense data) and the owner (overview). Hebrew RTL, light scheme (owner decision 2026-10), brand teal `#0891B2` family. Voice: calm, competent, direct. Not playful, not corporate-gray, not startup-neon.

## The three dials (this CRM's fixed settings)
| Dial | Value | Meaning here |
|---|---|---|
| DESIGN_VARIANCE | 3 / 10 | Predictable, grid-aligned layouts. Asymmetry only in hero/summary strips. Recruiters need muscle memory. |
| MOTION_INTENSITY | 2 / 10 | Feedback motion only (see `motion-craft-crm`). `/office-tv` = 7/10, separate skill. |
| VISUAL_DENSITY | 6 / 10 | Dense but breathable: tables and candidate lists are compact; pages have generous section gaps. |
Public/first-impression pages (`/login`, `/upload-cv`, `/install`): variance 4, motion 3, density 3.

## Taste principles (decide with these)
1. **Hierarchy by contrast of size and weight, not by decoration.** Three levels per region: title (20–24/600), label (13–14/600 muted), body (14/400). KPI number is the largest thing on the page; its label is small.
2. **Neutral does the work, accent points.** 90% slate neutrals, one teal accent per region, status colors for status only. Tint neutrals slightly cool (slate) — never pure `#000`, never flat `#808080`.
3. **Whitespace is the premium signal.** When a screen feels cheap, add space and remove an element before adding a style.
4. **Typography:** one family (the existing app font; no new font loads), `tabular-nums` for numbers, `text-wrap: balance` on headings, line-height 1.5 body / 1.25 headings, Hebrew never letter-spaced, no ALL-CAPS Latin labels.
5. **Alignment is taste.** Everything on a 4/8 grid; icon + text baseline aligned; numbers right-aligned in tables (logical end in RTL); consistent row height per list.
6. **Surfaces:** page canvas slightly tinted, cards white with a 1px hairline and at most one soft shadow, floating layers glass. No nested cards: use dividers and spacing inside a card.
7. **Color in data:** semantic only — success green, info blue, warning amber, danger red — each paired with an icon or text label. Charts: max 3 hues, teal first.
8. **Copy is design.** Buttons = verb + object ("שמור שינויים"), no "אישור". Empty states say what to do next. No exclamation marks, UI emoji, or "אופס". Marketing and outbound-message templates are content, not UI, and may use appropriate emoji.
9. **Consistency over novelty.** If a pattern exists in `components/ui`, reuse; a new variant needs a reason you can say in one sentence.
10. **Delight budget = 1 per flow,** earned after a meaningful success (candidate hired, CV uploaded): a 200ms check draw or subtle confirmation, never confetti.

## Tells that scream "template" (never ship)
Gradient hero with floating blobs; every card with an icon tile; rainbow stat cards (each KPI different color); uniform 3-column feature grids on app screens; glass on everything; oversized rounded-3xl everywhere; bold on every label; centered text blocks; decorative dividers; stock empty-state illustrations.

## Process for a new/redone screen
1. State the screen's job in one sentence and its primary action.
2. Sketch hierarchy in 3 lines (what is read first, second, third).
3. Pick dial values (defaults above) and write any deviation down.
4. Build with tokens from `apple-design-crm/references/crm-tokens.md`.
5. Run `design-critique-crm audit` + anti-slop scan.
6. Verify visually with `visual-verify-crm` (1920 / 1280 / 390, light + dark, RTL).

## Redesign existing screen (most work here)
Audit first, then in this order: **layout and spacing -> hierarchy/typography -> color/surface -> states -> copy -> motion.** Touch each layer once. Do not mass-rewrite untouched code; fix lines as you pass them.

## Tie-breakers when rules conflict
Accuracy of data > readability > restraint > consistency > beauty > novelty. Owner decisions in repo memory (light scheme, no logo watermark, leave `/office-tv` alone) are never overridden by taste.
