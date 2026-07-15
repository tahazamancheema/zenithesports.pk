# Zenith Esports — Brand Guidelines

**Version 1.0 · "Forged in Obsidian"**

These guidelines govern every screen, component, and asset on zenithesports.pk.
The design tokens live in [`src/index.css`](src/index.css) (`@theme` block) — that file is the
single source of truth; this document explains how to use it.

---

## 1. Brand Essence

| | |
|---|---|
| **Positioning** | Pakistan's premier competitive PUBG Mobile circuit |
| **Personality** | Disciplined, tactical, premium — a broadcast graphics package, not a website |
| **Motif** | Obsidian (near-black surfaces) struck with Gold (victory) |
| **Voice** | Short, imperative, military-operational: "DEPLOY", "REGISTER TEAM", "ACCESS PORTAL" |

---

## 2. Typography — The Saira System

**One typeface. Three widths.** The entire product uses the
[Saira superfamily](https://fonts.google.com/specimen/Saira) — a single engineered
typeface whose Condensed, Semi Condensed, and Normal widths give us a complete
hierarchy without ever mixing brands.

| Role | Face | Class | Weights | Usage |
|---|---|---|---|---|
| **Display** | Saira Condensed | `font-display` (alias `font-bebas`) | 600 default, 700 emphasis | Headlines, hero text, stat numerals, buttons. **Always uppercase** (enforced by the class). |
| **Label** | Saira Semi Condensed | `font-label` (alias `font-teko`) | 500 default | Overlines, nav items, tags, table headers, meta text. Pair with `uppercase tracking-widest`. |
| **Body** | Saira | `font-body` | 400–600 | Paragraphs, forms, toasts, long-form copy. Never letterspace body text. |
| Code / IDs | system monospace | `font-mono` | — | Player IDs, error dumps only. |

Loaded once in [`index.html`](index.html) from Google Fonts. **Never** add another
font family, another CDN, or a local font file without updating these guidelines.

### Type rules
1. Display type is uppercase, tight leading (`leading-none` / `0.9`), tracking `0.02–0.05em`.
2. Labels carry the tracking (`tracking-[0.2em]`–`[0.3em]`); display carries the size.
3. Body text is never uppercase, never tracked, minimum 14px (`text-sm`).
4. One display size per section — hierarchy comes from width + weight, not four sizes.

---

## 3. Color — Obsidian & Gold

All colors are tokens in `@theme`. **Never hardcode a new hex.**

### Surfaces (dark → light)
| Token | Hex | Use |
|---|---|---|
| page base | `#0a0a0a` | `body`, page backgrounds |
| `--color-surface-lowest` | `#0e0e0e` | Recessed panels, form sections |
| `--color-surface` | `#131313` | Cards, modals, sidebars |
| `--color-surface-low` | `#1b1b1b` | List rows, stat cells |
| `--color-surface-container` | `#1f1f1f` | Active nav, toasts |
| `--color-surface-high` → `-bright` | `#2a2a2a`–`#393939` | Hover states, scrollbars |

### Gold accent
| Token | Hex | Use |
|---|---|---|
| `--color-primary` | `#f9d07a` | Active/highlight text, focus rings |
| `--color-primary-container` | `#dbb462` | The brand gold — buttons, borders, gradients |
| `--color-on-primary` | `#402d00` | Text placed on gold |

Gradient: `zenith-gradient` (135°, `#dbb462 → #fbefc4`). Gold is earned — reserve it
for primary actions, live states, and victory moments. If everything is gold, nothing is.

### Text
`--color-on-surface` `#f2f2f2` (primary) · `--color-on-surface-variant` `#d1c5b3`
(secondary, usually with opacity) · `--color-outline-variant` `#4e4638` (hairlines).

### Semantic
Success `emerald-400` · Info `blue-400` · Error `--color-error` `#ffb4ab` / `red-400` ·
Pending `yellow-500`. Semantic colors appear only as thin borders, badges, and status
strips — never as fills.

### Contrast
Text on surfaces must meet WCAG AA (4.5:1 body, 3:1 large display). `#d1c5b3` at
opacity < 40% is decorative only — never for information a user must read.

---

## 4. Shape — The Monolith Rule

**Zero border radius, everywhere.** (`border-radius: 0 !important` is global.)
The only exception is `--radius-full` for live-status dots and pulse rings.
Depth comes from hairline borders (`1px`, `rgba(78,70,56,…)` or `white/[0.05]`)
and glow shadows (`glow-gold`, `card-hover-glow`) — never from drop shadows alone.

- Cards: `bg-[#131313]` + 1px hairline border; hover raises border opacity, adds glow.
- Accent edges: 2–3px gold top-strip or left-strip (`status-strip-*`) mark active/featured items.
- Grids of stats separate with `gap-[1px]` over a hairline background — the "circuit board" look.

## 5. Components

- **Primary button**: `btn-obsidian-primary` — gold gradient, `--color-on-primary` display
  type, shine sweep on hover, `scale(0.95)` on press.
- **Ghost button**: `btn-obsidian-ghost` — gold hairline, transparent fill, glow on hover.
- **Inputs**: `GhostInput` / dark field `#1a1a1a`, hairline border, gold focus border
  (`focus:border-[#dbb462]/50`), label = Label face 11–13px uppercase tracked.
- **Modals**: obsidian panel, gold hairline, `backdrop-blur`, top gradient strip.
- **Badges**: `StatusBadge` — hairline border + semantic text color, Label face.

## 6. Motion

Framer-motion / CSS only. Durations 200–400ms UI, 600ms+ ambient. Easing
`cubic-bezier(0.16, 1, 0.3, 1)`. Signature moves: `animate-page-enter` (fade-up),
scanline sweeps, `tech-pulse`, marquee strips. Motion must never block reading or input;
respect `prefers-reduced-motion` for new ambient effects.

## 7. Voice & Copy

- Headlines: imperative, ≤ 4 words, uppercase ("CLAIM THE ZENITH").
- Labels: telegraphic system-speak ("GRID LOGISTICS", "SQUAD DEPLOYMENT").
- Errors: plain, actionable body copy — never jargon in error messages.
- Currency: `PKR 1,00,000` via `toLocaleString('en-PK')`.

## 8. Logo

`/logo.png` on dark only. Clear space = logo height × 0.5. Watermark usage at
opacity ≤ 0.05, grayscale. Never recolor, skew, or place on gold.

---

*Any new page or component must be built exclusively from the tokens and classes above.
If a design needs something this file doesn't define, extend the tokens first, then use them.*
