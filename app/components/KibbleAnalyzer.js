'use client';

import { useEffect, useState } from 'react';

/**
 * KibbleAnalyzer — animated hero illustration.
 *
 * Renders a vertical stack of real kibble pieces inside an SVG "analyzer":
 *   - soft green halo behind the kibble
 *   - single sweeping arc that orbits the sample once every ~4.5s
 *   - five ingredient callouts that pop in as the sweep reaches each one
 *   - live "ANALYZING … 94/100" readout in the top-right
 *
 * This is a **static demo** of a curated product (Orijen Original, score 94).
 * It does not read any live data.
 *
 * Props: none.
 *
 * Asset:
 *   /public/kibble-clean.png — vertical photo of kibble pieces on transparent bg.
 *   Included in this handoff at ../assets/kibble-clean.png.
 *   Move it to /public in your Next.js app.
 *
 * Styling: inline style objects only (matches your existing pattern).
 */
export default function KibbleAnalyzer() {
  // Single animation clock: 0 → 1, loops every 4.5s.
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const loop = (now) => {
      setT((((now - start) / 4500) % 1));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const targetScore = 94;
  const scoreAnim = Math.min(targetScore, Math.floor(t * targetScore * 1.1));

  // SVG viewBox is 600x540; image sits centered at 300x490.
  const W = 600, H = 540;
  const imgW = 300, imgH = 490;
  const imgX = (W - imgW) / 2;
  const imgY = (H - imgH) / 2;
  const imgCX = imgX + imgW / 2;

  // Five kibble pieces along the vertical image, each with its callout metadata.
  // frac = vertical position in image (0 = top, 1 = bottom).
  // side = which side of the image the label sits on.
  const pieces = [
    { frac: 0.08, side: 'left',  color: 'oklch(0.55 0.14 155)', label: 'Fresh chicken',  pct: 38 },
    { frac: 0.27, side: 'right', color: 'oklch(0.60 0.13 90)',  label: 'Whole grains',   pct: 22 },
    { frac: 0.50, side: 'left',  color: 'oklch(0.60 0.11 55)',  label: 'Peas & lentils', pct: 18 },
    { frac: 0.74, side: 'right', color: 'oklch(0.55 0.10 40)',  label: 'Fats & oils',    pct: 12 },
    { frac: 0.92, side: 'left',  color: 'oklch(0.50 0.07 310)', label: 'Vitamins',       pct: 10 },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: W }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <radialGradient id="ka-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.55 0.14 155)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="oklch(0.55 0.14 155)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft radial glow behind the kibble */}
        <ellipse cx={imgCX} cy={H / 2} rx={imgW * 0.9} ry={imgH * 0.55} fill="url(#ka-halo)" />

        {/* Single sweeping arc — one rotation per loop, starts at 12 o'clock CW */}
        <circle
          cx={imgCX} cy={H / 2} r={imgH * 0.48 + 10}
          fill="none" stroke="oklch(0.55 0.14 155)" strokeWidth="1.4"
          strokeDasharray={`${Math.PI * 2 * (imgH * 0.48 + 10) * 0.28} 10000`}
          strokeLinecap="round"
          transform={`rotate(${t * 360 - 90} ${imgCX} ${H / 2})`}
          opacity="0.9"
        />

        {/* Kibble photo — reference the file from /public */}
        <image
          href="/kibble-clean.png"
          x={imgX} y={imgY} width={imgW} height={imgH}
          preserveAspectRatio="xMidYMid meet"
          transform={`rotate(8 ${imgCX} ${H / 2})`}
        />

        {/* Ingredient callouts — each one reveals as the sweep passes its angular position */}
        {pieces.map((p) => {
          const anchorY = imgY + p.frac * imgH;
          const anchorX = imgCX + (p.side === 'left' ? -imgW / 2 + 14 : imgW / 2 - 14);
          const labelX = p.side === 'left' ? imgX - 30 : imgX + imgW + 30;
          const labelY = anchorY;
          const textAnchor = p.side === 'left' ? 'end' : 'start';
          const midX = p.side === 'left' ? anchorX - 24 : anchorX + 24;

          // Angle from ring center to this callout (0 at 12 o'clock, CW).
          const dx = anchorX - imgCX;
          const dy = anchorY - H / 2;
          let ang = Math.atan2(dx, -dy);
          if (ang < 0) ang += Math.PI * 2;
          const angFrac = ang / (Math.PI * 2);
          const revealed = t >= angFrac;

          return (
            <g key={p.label} opacity={revealed ? 1 : 0} style={{ transition: 'opacity 0.5s ease-out' }}>
              <polyline
                points={`${anchorX},${anchorY} ${midX},${anchorY} ${labelX},${labelY}`}
                fill="none" stroke={p.color} strokeWidth="1"
              />
              <circle cx={anchorX} cy={anchorY} r="3" fill={p.color} />
              <circle cx={anchorX} cy={anchorY} r="7" fill="none" stroke={p.color} strokeWidth="0.8" opacity="0.5" />
              <text
                x={labelX + (textAnchor === 'end' ? -6 : 6)} y={labelY - 3}
                fontFamily="ui-monospace, monospace" fontSize="10"
                fill="oklch(0.3 0.01 80)" textAnchor={textAnchor} fontWeight="500" letterSpacing="0.5"
              >
                {p.label.toUpperCase()}
              </text>
              <text
                x={labelX + (textAnchor === 'end' ? -6 : 6)} y={labelY + 11}
                fontFamily="ui-monospace, monospace" fontSize="10"
                fill={p.color} textAnchor={textAnchor} fontWeight="600"
              >
                {p.pct}%
              </text>
            </g>
          );
        })}

        {/* Live score readout — top-right corner */}
        <g transform={`translate(${W - 130}, 14)`}>
          <rect width="116" height="70" rx="4" fill="#fff" stroke="oklch(0.88 0.01 80)" />
          <text x="10" y="18" fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="1.5" fill="oklch(0.5 0.01 80)">
            ANALYZING
          </text>
          <text x="10" y="52" fontFamily='"Instrument Serif", serif' fontSize="34" fill="oklch(0.55 0.14 155)" fontWeight="400">
            {scoreAnim}
            <tspan fontSize="14" fill="oklch(0.5 0.01 80)">/100</tspan>
          </text>
          <circle cx="104" cy="14" r="3" fill="oklch(0.55 0.14 155)" style={{ animation: 'heroDot 1.5s ease-in-out infinite' }} />
        </g>
      </svg>
    </div>
  );
}
