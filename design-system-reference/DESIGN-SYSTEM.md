# eReolen GO! — design reference

This folder contains the six-page implementation and its local visual assets. Use it as the working reference when adding or updating features so new UI follows the same visual language and interaction patterns.

## Pages

- `index.html` — Forside
- `vaerk.html` — Værkvisning
- `min-side.html` — Min side
- `kategori.html` — Kategoriside
- `filtre.html` — Filtre / browse results
- `soegning.html` — Søgning

All pages use the shared shell and page rendering in `site.js` and `app.js`; shared styling lives in `styles.css`. Assets and the bundled DM Sans variable font are in `assets/`.

## Foundations

- **Typography:** DM Sans, variable weights 400–700, loaded locally from `assets/dm-sans-variable.woff2`.
- **Core colors:** ink `#0b2718`, paper `#fcfaf7`, white `#fefefe`; shared accents include blue `#32b4ff`, soft green `#eff1e8`, and line `#dfe2d9`.
- **Dark theme:** apply `theme-dark` on `body`; preserve the semantic `--paper`, `--ink`, `--white`, `--soft-green`, and `--line` variables rather than hardcoding theme-dependent colors.
- **Shape and depth:** rounded pill actions, softly rounded cards, and the characteristic hard offset shadow (`2px 2px 0 var(--ink)`).
- **Content width:** `.page` is centered and capped at 1440px. Prefer existing page/section spacing and responsive rules in `styles.css`.

## Shared patterns

- `header()` and `footer()` in `site.js` provide shared site chrome, category navigation, search, account entry, and theme control.
- Reuse `.pill-button`, `.primary-action`, `.secondary-action`, `.filter-toggle`, `.section-heading`, `.shelf`, and `.book-card` patterns before introducing new primitives.
- Book shelves use the existing `cards()` renderer and local cover art. Use the supplied `assets/` images and SVGs; do not replace them with placeholders or add an icon package for existing artwork.
- The profile form/modal is shared across pages. Keep its trigger, close, and submission behavior wired through `app.js`.
- Existing interactive patterns include search submission, filter panel/open/apply, favorites with `aria-pressed`, horizontal shelf controls, book format selection, audio/play controls, and the theme toggle.

## Responsive behavior

The shared navigation, search strip, profile dialog, page sections, and card rails adapt in `styles.css`. Main breakpoints are 760px and 380px; the site supports a 320px minimum viewport. New work should be checked at narrow phone, tablet, and desktop widths and avoid horizontal page overflow.

## Adding a feature

1. Extend the closest existing page/component pattern and shared data/render helpers in `site.js` rather than duplicating the shell.
2. Reuse semantic CSS variables and existing controls; add a new token only when a real repeated design need exists.
3. Keep navigation and data behavior consistent with the static page routes and relative asset paths.
4. Add keyboard-accessible labels/states to controls, including `aria-pressed` or `aria-expanded` where applicable.
5. Validate every changed route in a browser at desktop and mobile widths, including asset loading and interactions.
