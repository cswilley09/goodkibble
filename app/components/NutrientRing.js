'use client';
import { useState, useEffect } from 'react';

export default function NutrientRing({ label, value, color, delay = 0 }) {
  const [anim, setAnim] = useState(0);
  const r = 54, circ = 2 * Math.PI * r;
  const offset = circ - (anim / 100) * circ;

  useEffect(() => {
    setAnim(0);
    const t = setTimeout(() => {
      let s = 0;
      const tick = () => {
        s += 1.5;
        if (s >= value) { setAnim(value); return; }
        setAnim(Math.round(s));
        requestAnimationFrame(tick);
      };
      tick();
    }, delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#f0ebe3" strokeWidth="10" />
          <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 0.05s linear' }} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'DM Sans', sans-serif", fontSize: 32, fontWeight: 500, color: '#1a1612',
        }}>{anim}%</div>
      </div>
      <span style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
        letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a7e72',
      }}>{label}</span>
    </div>
  );
}
