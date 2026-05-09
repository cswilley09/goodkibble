// Design tokens for the GoodKibble homepage redesign ("The Database" direction).
// Use these as constants at the top of your component files. Keep them inline —
// your existing codebase does not use Tailwind, CSS Modules, or styled-components,
// so these ship as plain JS constants applied via inline style={{}} objects.

export const colors = {
  // Warm cream background used site-wide in the hero and shell.
  bg: 'oklch(0.985 0.005 90)',       // ≈ #FAF8F2

  // Primary text. Warm near-black, not pure.
  ink: 'oklch(0.22 0.01 80)',        // ≈ #363330

  // Secondary text (metadata, captions, disabled states).
  muted: 'oklch(0.5 0.01 80)',       // ≈ #807A72

  // Hairlines and dividers. 1px borders, table lines, card outlines.
  line: 'oklch(0.9 0.008 80)',       // ≈ #E8E4DE

  // Primary brand green. Deep forest, used for all interactive accents,
  // score tints, the analyzer sweep, italic emphasis in the headline.
  accent: 'oklch(0.55 0.14 155)',    // ≈ #2F6B48

  // Soft accent — 8% tint of the primary, used for pill/chip backgrounds,
  // hover states, and the analyzer halo.
  accentSoft: 'oklch(0.95 0.03 155)',// ≈ #E3EFE6

  // Warning/alert tint for by-product flags and caveats.
  warnBg: 'oklch(0.95 0.04 30)',     // pale terracotta
  warnFg: 'oklch(0.5 0.15 30)',      // saturated terracotta

  // Card surfaces — pure white on the cream background.
  surface: '#fff',
};

// Typography stacks. Inter for UI, Instrument Serif for display.
// Both are already Google Fonts — add them in app/layout.js via next/font.
export const fonts = {
  body: 'Inter, system-ui, sans-serif',
  display: '"Instrument Serif", Georgia, serif',
  // Monospace used for ALL small caps labels (uppercase metadata),
  // stat numbers in tables, and the analyzer readout.
  mono: 'ui-monospace, SFMono-Regular, monospace',
};

// Type scale — pixel values, matching the mock exactly.
// Line heights tuned per role, not a single ratio.
export const type = {
  hero: { family: fonts.display, size: 60, lineHeight: 1.02, weight: 400, tracking: -1 },
  h2:   { family: fonts.display, size: 32, lineHeight: 1.1,  weight: 400, tracking: -0.5 },
  h3:   { family: fonts.display, size: 28, lineHeight: 1.1,  weight: 400, tracking: -0.5 },
  // Body copy under headlines.
  lead: { family: fonts.body, size: 16, lineHeight: 1.5, weight: 400 },
  // Default body (table cells, paragraphs).
  body: { family: fonts.body, size: 14, lineHeight: 1.5, weight: 400 },
  // Secondary metadata below body rows.
  small:{ family: fonts.body, size: 13, lineHeight: 1.4, weight: 400 },
  // Monospace uppercase label — use letterSpacing: 1, textTransform: 'uppercase'.
  label:{ family: fonts.mono, size: 11, lineHeight: 1.2, weight: 500, tracking: 1 },
};

// Spacing scale (px).
export const space = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 72,
};

// Border radii. Note: UI corners are small (4px), card corners are 8px.
// The brand does NOT use heavily rounded pills on buttons (only on filter chips).
export const radius = {
  chip: 100,  // fully rounded — only for filter chips and quick-search chips
  button: 4,  // primary action buttons
  input: 6,   // the "Search" button inside the search field
  card: 8,    // result tables, detail cards, suggestion dropdown
};

// Shadow tokens.
export const shadow = {
  // Search field — soft elevation
  input: '0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04)',
  // Dropdown / menu
  menu: '0 12px 32px rgba(0,0,0,0.08)',
};

// Score color scale — used by <ScorePill> to tint the pill background and
// text based on the numeric score. Hue shifts from green (high) → red (low).
export const scoreColor = (score) => {
  const h = score >= 85 ? 155 : score >= 70 ? 85 : score >= 60 ? 55 : 25;
  return {
    fg: `oklch(0.55 0.14 ${h})`,
    bg: `oklch(0.96 0.04 ${h})`,
  };
};
