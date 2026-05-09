# GoodKibble — Homepage Redesign (Concept 1: Database)

Dev handoff for the "Database" homepage concept. This is the editorial / search-first
direction: oversized serif headline, kibble cross-section hero, top-scoring foods
leaderboard, and a "How we score" methodology strip.

## What's in here

```
screenshots/    01-homepage-full.png         Full-page render, for reference
components/     KibbleAnalyzer.jsx           The animated hero SVG component
                tokens.js                    Design tokens (colors, type, scores)
reference/      Concept1_DatabaseConcept.jsx The full page composition
                data.jsx                     FOODS + methodology data shape
assets/         kibble-clean.png             Background-removed kibble photo
```

Everything here is lifted verbatim from the prototype in
`GoodKibble Homepage.html` (the parent project). Any discrepancy — the prototype wins.

## Stack assumptions

- React 18, functional components, inline styles (no CSS framework).
- No build tool assumed. If you're on Vite / Next / CRA, just drop the `.jsx` files in
  and rename imports as needed.
- Fonts: Inter (UI) and Fraunces (display italic). Load from Google Fonts or your
  preferred host — see `tokens.js` for the exact families and weights.
- Colors use `oklch()`. Safari 15.4+, Chrome 111+. Fall back to hex if you need to
  support older browsers — `tokens.js` has the approximate hex values in comments.

## Component map

### `KibbleAnalyzer`
SVG + `<image>` composition. Animates a single sweeping arc clockwise around the
kibble photo; ingredient callouts (Whole grains 22%, Peas & lentils 18%, etc.) fade
in as the sweep passes their angle, then reset each loop (~4.5s).

Props: none. Self-contained. The kibble image is referenced as a relative path
`kibble-clean.png` — in the prototype it's inlined as a base64 data URI to avoid
cross-origin issues inside SVG. In production, just serve the PNG alongside.

### `DatabaseConcept` (in `reference/`)
The full page layout: header → hero (headline + search + KibbleAnalyzer) →
leaderboard table → methodology strip. This is reference-level; feel free to split
into smaller components (`<SiteHeader>`, `<Hero>`, `<Leaderboard>`, `<Methodology>`)
when you wire it up.

### `ScorePill`, `ScoreDial`
Score display primitives. Pill is the inline 94/100 badge; dial is the big circular
progress used elsewhere in the product. Both included in `Concept1_DatabaseConcept.jsx`
for reference.

## Notes for engineering

- **Leaderboard is static data.** Wire to your foods API. See `data.jsx` for the
  shape — `{ rank, brand, product, score, protein, fat, pricePerLb, firstIngredient }`.
- **Search box** is visual only. Hook up to your existing search endpoint. The chip
  row ("Orijen", "Purina Pro", etc.) should be popular-queries or recent-searches.
- **"Updated 3 days ago"** in the header should be driven by the most recent DB
  refresh timestamp.
- **Filter chips** on the leaderboard ("Grain-free", "No by-products", "80+") need
  to actually filter. Sort dropdown toggles between score / price / protein.
- The KibbleAnalyzer animation is decorative — don't block anything on it. It uses
  `requestAnimationFrame`; pause it when the hero is off-screen via
  `IntersectionObserver` if perf matters on low-end devices.

## Questions / gaps

- Exact typography scale for mobile isn't specified here — the prototype is
  desktop-first. Work with design on breakpoints.
- Score badge color scale (green ≥80, amber 60–79, red <60) is set in
  `tokens.js` → `scoreColor()`. Confirm thresholds with product.
- No dark mode. Ask if needed.
