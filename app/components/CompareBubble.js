'use client';
import { useState, useEffect, useRef } from 'react';
import { useCompare } from './CompareContext';
import { useRouter } from 'next/navigation';

export default function CompareBubble() {
  const { items, nudge } = useCompare();
  const router = useRouter();
  const active = items.length > 0;
  const [wiggle, setWiggle] = useState(false);
  const prevNudge = useRef(nudge);

  useEffect(() => {
    if (nudge !== prevNudge.current && nudge > 0) {
      // Reset first to re-trigger animation on rapid clicks
      setWiggle(false);
      requestAnimationFrame(() => {
        setWiggle(true);
      });
      const t = setTimeout(() => setWiggle(false), 800);
      prevNudge.current = nudge;
      return () => clearTimeout(t);
    }
    prevNudge.current = nudge;
  }, [nudge]);

  return (
    <>
      <button
        onClick={() => { if (active) router.push('/compare'); }}
        className={`compare-bubble${wiggle ? ' compare-wiggle' : ''}${active ? ' compare-active' : ''}`}
        style={{
          padding: '8px 18px', borderRadius: 100,
          border: active ? '1.5px solid #1C1814' : '1.5px solid #d4c9b8',
          background: active ? '#1C1814' : 'transparent',
          color: active ? '#faf8f5' : '#b5aa99',
          fontSize: 13, fontWeight: 600, cursor: active ? 'pointer' : 'default',
          fontFamily: "'Inter', sans-serif",
          transition: 'all 0.25s',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          opacity: active ? 1 : 0.5,
          flexShrink: 0,
        }}
      >
        <span className="compare-text">Compare</span>
        {active && <span>({items.length})</span>}
      </button>
      <style>{`
        @keyframes wiggle {
          0% { transform: rotate(0deg); }
          15% { transform: rotate(-6deg) scale(1.1); }
          30% { transform: rotate(6deg) scale(1.1); }
          45% { transform: rotate(-4deg); }
          60% { transform: rotate(4deg); }
          75% { transform: rotate(-2deg); }
          100% { transform: rotate(0deg); }
        }
        .compare-wiggle { animation: wiggle 0.6s ease; }
        @media (max-width: 768px) {
          .compare-bubble { padding: 6px 12px !important; font-size: 11px !important; gap: 4px !important; }
          .compare-text { display: none !important; }
          .compare-bubble:not(.compare-active) { display: none !important; }
        }
      `}</style>
    </>
  );
}
