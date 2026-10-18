# Zenith Esports — Brand & Interface Guidelines

**Version 2.0 · "Zenith Meridian"** — supersedes v1.0 "Forged in Obsidian".

Audience: anyone designing or building screens for zenithesports.pk and its platforms.
The tokens live in [`src/app/globals.css`](src/app/globals.css) (`@theme`). That file is the source
of truth; this document explains how to use it.

## 1. The concept

The **zenith** is the point directly overhead. The **meridian** is the line that passes through it.

- Layouts hang off a thin vertical meridian line with altitude ticks.
- Sections are indexed as altitudes, rising toward the call to action: `ALT 00°` → `ALT 90°`.
- Each platform is a **signal** travelling along a trajectory toward a single gold apex — the
  ecosystem converging on one point of focus.
- The diamond **node** (a rotated square, the angular tip of the Zenith mark reduced to a point)
  marks positions, list items, active states and the apex itself.

Do not reach for generic esports tropes: no character renders, no neon glow fields, no rows of
identical cards. Every page is composed around its job.

## 2. Colour

| Role | Token | Hex | Use |
|---|---|---|---|
| Night (page) | `--color-void` | `#06070a` | Page background |
| Surfaces | `--color-ink-1…4` | `#0b0d11` → `#1f242e` | Panels, rows, hovers |
| Lines | `--color-line`, `-2`, `-3` | cool white at 8 / 14 / 26 % | Hairlines, grids, meridian |
| Text | `--color-fg`, `-2`, `-3` | `#edf0f5`, `#a6aebb`, `#6e7684` | Primary, secondary, labels |
| Chrome | `--color-chrome` | `#c9cfd9` | The silver of the mark; `t-chrome` headline gradient |
| **Apex gold** | `--color-gold` | `#d9b25f` | The zenith, the ecosystem, Registrations |

**Product frequencies** — each platform has one accent, set by `data-surface` and exposed as
`var(--accent)`. Use it only inside that product.

| Platform | Token | Hex | Meaning |
|---|---|---|---|
| Registrations | `--color-reg` | `#d9b25f` | Competition — shares the apex gold |
| ZenithProduction | `--color-prod` | `#ff5a44` | The on-air tally light |
| ZenithAntiCheat | `--color-ac` | `#3fd8c0` | Verification |
| ZenithPoints | `--color-pts` | `#9d8cff` | Scoring |

Semantic colours (`ok`, `warn`, `bad`, `info`) appear as thin borders, chips and text — never as
large fills. One accent per view; if everything glows, nothing does.

## 3. Type

The ZenithHisaab type system, shared across the ecosystem:

| Face | Class | Use |
|---|---|---|
| **Michroma** | `t-display` | Headlines, product names. Uppercase, balanced, tight leading. Wide — keep sizes moderate and test at 390 px. |
| **Geist** | default | Body copy, forms, tables. Never letterspaced. |
| **Geist Mono** | `t-label`, `font-mono` | Labels (11 px, 0.16em tracking, uppercase), IDs, times, figures, references. |

## 4. Shape and depth

- Radii are small and precise: 2 px chips, 4 px controls, 8 px panels.
- Depth comes from hairlines and a 1-step surface change (`panel`, `panel-raised`), not shadows.
- Grids of facts sit on a 1 px gap over a line colour (`gap-px bg-line`).

## 5. Motion

Motion explains; it never decorates idly.

| Kind | Duration | Easing |
|---|---|---|
| Micro (hover, press) | 160 ms | ease |
| UI (state change) | 280 ms | `--ease-out-expo` |
| Reveal (scroll) | 800 ms | `--ease-out-expo`, staggered 70 ms |
| Draw (trajectories) | 1.4 s | `--ease-draw` |

Signature moves: line-mask headline reveal, trajectory draw, a signal travelling a path, the node
filling on activation, page transitions via React `<ViewTransition>`.

Rules:
- Looping diagrams pause off-screen, offer play/pause, and are keyboard operable.
- `prefers-reduced-motion` turns animation off and swaps diagrams for static equivalents carrying
  the same information.
- Content must be readable without JavaScript (scroll reveals only hide content when scripts run).

## 6. Honesty in imagery

- Illustrations of ZenithProduction and ZenithPoints are always captioned **Illustration**.
- Only approved, sanitised captures are labelled **Screenshot** (HQ console → Media & team).
- Never invent players, teams, sponsors, statistics, testimonials, prices or release dates.
- Social links, contact details and store links appear only once an administrator has set them.

## 7. The mark

`public/brand/zenith-mark-*.webp` (from the official `ZenithEsports.png`). Use on dark surfaces
only, with clear space of half its height. Never recolour, skew or place it on gold.

## 8. Voice

Short, precise, confident. Explain what happens next. Errors say what went wrong and how to fix
it, and never expose internals. Prefer "you" over "users". Currency: `PKR 1,00,000`
(`toLocaleString('en-PK')`). Times show the zone (`PKT`).

## Platform logos (v2.1)

One family, built in code (`src/components/brand/product-logos.tsx`): the traced Zenith mark on a
black rounded square, the same base as the real ZenithProduction app icon, plus one accent per platform.

| Platform | Icon | Accent |
|---|---|---|
| Zenith Esports | chrome mark | chrome `#c9cfd9` |
| Zenith Registrations | gold mark + bracket rails | gold `#d9b25f` |
| ZenithProduction | white mark (the real app icon) | signal red `#ff5a44` |
| ZenithAntiCheat | white mark in a teal scan ring + check badge | teal `#3fd8c0` |
| ZenithPoints | white mark + three rising bars | violet `#9d8cff` |

Use `ProductLockup` (icon + "ZENITH" + platform name) at 44 px or larger; below that use the icon alone.

## Type sizes

Michroma is for large display type only (roughly 22 px and up). Smaller headings use Geist 600
(`.t-title`). Labels are Geist Mono at 12 px minimum; secondary text uses `fg-2 #b9c1cd`, tertiary
`fg-3 #8d96a4` — both pass WCAG AA on the void background.

## Imagery

- **Real product media** — ZenithProduction screenshots and the walkthrough video in
  `public/products/production/` are captures of the real software running its built-in sample data.
  Always label them "Real software · sample data". Never publish the app itself, its paths, ports or
  debug output.
- **ZenithPoints** is unreleased: its phone interface is a concept drawn in code with placeholder
  teams ("Team Alpha" …) and is always labelled "Concept preview".
- **3D renders and game key art** in `public/visuals/` were generated for Zenith (no game logos,
  characters or trademarks). They are backdrops, never presented as screenshots of a game.
- **Game logos** — the site shows Simple Icons glyphs (PUBG, VALORANT, EA) or a typographic badge.
  Official logos and cover art can be uploaded per game in the Registrations console only where Zenith
  has permission to use them.
- **Tournament posters, logos and sponsor logos** are uploaded per tournament by staff. List a sponsor
  only with their agreement.
