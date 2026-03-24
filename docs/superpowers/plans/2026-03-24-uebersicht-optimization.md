# Übersicht Tab Optimization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the Übersicht (home/cards) view from developer-default grey boxes to a precision-instrument VC dealflow UI using the software-ui-ux skill.

**Architecture:** All changes are additive CSS overrides appended to `styles/main.css` and targeted JS changes to `renderCards()` in `js/renderers.js`. No other files are touched. The existing CSS structure is preserved; new tokens and rules are added in a clearly-marked section at the end of the file.

**Tech Stack:** Vanilla HTML/CSS/JS · Supabase backend (not modified) · Google Fonts (IBM Plex Sans + IBM Plex Mono via @import)

---

## Brainstorm Analysis

**Primary job:** SCANNING — VCs scan 10–100 cards per session to identify deals worth opening. Speed of visual parsing is the #1 priority.

**Current anti-patterns (vs. software-ui-ux skill):**
1. `system-ui/Roboto` body font → no distinctive pairing, developer-default
2. Freehand font sizes (`1.18rem`, `0.82rem`, `0.88rem`) → no scale system
3. Hardcoded hex in `.score-yellow` (#fffbe6, #7a6b00, #ffe066)
4. `.metric strong` uses `var(--brand2)` blue → data reads as interactive links
5. Empty state "Keine Treffer" — no CTA
6. No skeleton loader (no loading state)
7. `disabled` buttons lack `cursor:not-allowed`
8. `.achip:hover` uses `filter:brightness(1.02)` — imperceptible change
9. No motion/easing tokens in `:root`

**Data reality:** ID · HQ · market · stage · sector · score badge · description · 6 KPI tiles · 3 action buttons. Score is the primary signal — it must dominate visually.

**Aesthetic direction:** *Precision instrument* — IBM Plex Sans/Mono pairing, tight spacing, muted palette, one sharp accent. Like a Bloomberg terminal that a VC would trust.

**ONE memorable detail:** Monospaced KPI values with staggered card entrance animation (translateY(6px) → 0, 30ms stagger).

---

## Files Modified

| File | Change |
|---|---|
| `styles/main.css` | Add `@import` for IBM Plex fonts; add design tokens to `:root` and dark theme; append `/* ÜBERSICHT OPTIMIZATION */` section with all overrides |
| `js/renderers.js` | Update `renderCards()`: skeleton loader, rich empty state, card entrance stagger animation |
| `docs/superpowers/plans/2026-03-24-uebersicht-optimization.md` | This file |

---

## Task 1: Font import + design tokens

**Files:**
- Modify: `styles/main.css` (top of file — insert @import before `:root`)
- Modify: `styles/main.css:1–29` — add tokens to `:root`
- Modify: `styles/main.css:31–55` — add tokens to `[data-theme="dark"]`

- [ ] **Step 1:** Add `@import url(…IBM+Plex+Sans…IBM+Plex+Mono…)` at very top of main.css
- [ ] **Step 2:** Add font + scale tokens, motion tokens, score-yellow tokens to `:root` block
- [ ] **Step 3:** Add dark-mode overrides for new surface/text tokens in `[data-theme="dark"]` block
- [ ] **Step 4:** Apply `font-family: var(--font-ui)` to body rule

---

## Task 2: Übersicht CSS overrides section

**Files:**
- Modify: `styles/main.css` (append at end)

Cover in order:
- Card (h3, tagrow, score-row, desc, metrics, actions)
- Controls (search focus, chips)
- Empty state
- Skeleton + shimmer keyframe
- Card entrance + hover transitions
- Dark mode specifics for new tokens
- Disabled button cursor
- prefers-reduced-motion guard

- [ ] **Step 1:** Append `/* OPTIMIZED: software-ui-ux applied — 2026-03-24 */` section header
- [ ] **Step 2:** Card base — h3 color `var(--text-primary)`, font `var(--font-ui)`
- [ ] **Step 3:** Score-row dominance — score-value size bump, border-radius 6px
- [ ] **Step 4:** Score-yellow — use new `--score-yellow-*` tokens (no hardcoded hex)
- [ ] **Step 5:** Metrics — `font-family: var(--font-data)` on `metric strong`, `var(--text-primary)` color
- [ ] **Step 6:** Card actions — primary btn dominant, secondary ghost, disabled `cursor:not-allowed; opacity:0.5`
- [ ] **Step 7:** Controls — search focus `box-shadow: 0 0 0 3px var(--accent-subtle); border-color: var(--accent)`
- [ ] **Step 8:** Chips (`.achip`) — visible hover (background shift), remove affordance
- [ ] **Step 9:** Empty state CSS — centered, surface-raised, max-width 400px
- [ ] **Step 10:** Skeleton CSS — shimmer animation, 6 skeleton card placeholders
- [ ] **Step 11:** Card entrance animation (`@keyframes card-enter`) + hover border/shadow transition
- [ ] **Step 12:** `prefers-reduced-motion` guard wrapping all animations
- [ ] **Step 13:** Dark mode tokens in `[data-theme="dark"]` for new variables

---

## Task 3: renderCards() JS updates

**Files:**
- Modify: `js/renderers.js:82–239`

- [ ] **Step 1:** Extract card-rendering loop into `_renderCardsContent(grid, list, ...)` helper
- [ ] **Step 2:** In `renderCards()`, show 6 skeleton cards immediately, then `requestAnimationFrame` to call `_renderCardsContent()`
- [ ] **Step 3:** Replace empty state block with rich empty state: icon + headline + sub + "Filter zurücksetzen" CTA button
- [ ] **Step 4:** Add `card.style.animationDelay = (idx * 30) + 'ms'` per card in the loop
- [ ] **Step 5:** Verify disabled pipeline button already has HTML `disabled` attribute — add CSS rule for `button:disabled, .btn:disabled`

---

## Verification

After all tasks:
- [ ] Light mode: all 9 audit FAILs resolved
- [ ] Dark mode: surface hierarchy visible, no invisible elements
- [ ] Contrast: body text ≥ 4.5:1 in both themes
- [ ] Skeleton shows on first paint, replaced by cards on next frame
- [ ] Empty state has CTA that calls `resetAllFilters()` equivalent
- [ ] Card h3 is `var(--text-primary)` — not blue
- [ ] KPI values use monospaced font
- [ ] `.btn:disabled` has `cursor:not-allowed`
- [ ] No hardcoded hex in component rules
- [ ] `prefers-reduced-motion` guard present
