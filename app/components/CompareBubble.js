'use client';
import { useCompare } from './CompareContext';
import { useRouter } from 'next/navigation';

export default function CompareBubble() {
  const { items } = useCompare();
  const router = useRouter();
  const active = items.length > 0;

  return (
    <>
      <button
        onClick={() => { if (active) router.push('/compare'); }}
        className="compare-bubble"
        style={{
          padding: '8px 18px', borderRadius: 100,
          border: active ? '1.5px solid #1a1612' : '1.5px solid #d4c9b8',
          background: active ? '#1a1612' : 'transparent',
          color: active ? '#faf8f5' : '#b5aa99',
          fontSize: 13, fontWeight: 600, cursor: active ? 'pointer' : 'default',
          fontFamily: "'DM Sans', sans-serif",
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
        @media (max-width: 768px) {
          .compare-bubble { padding: 6px 12px !important; font-size: 11px !important; gap: 4px !important; }
          .compare-text { display: none !important; }
        }
      `}</style>
    </>
  );
}
