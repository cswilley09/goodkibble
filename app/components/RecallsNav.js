'use client';
import { useRouter } from 'next/navigation';
import { useCompare } from './CompareContext';

export default function RecallsNav() {
  const router = useRouter();
  const { items } = useCompare();
  const hasCompareItems = items.length > 0;

  return (
    <>
      {/* Desktop: text link */}
      <span className={`recalls-nav-text${hasCompareItems ? ' recalls-hide-for-compare' : ''}`} onClick={() => router.push('/recalls')} style={{
        fontSize: 14, fontWeight: 600, color: '#5a5248', cursor: 'pointer',
        fontFamily: "'Inter', sans-serif", display: 'inline-block',
        transition: 'color 0.2s',
      }}
        onMouseEnter={e => (e.currentTarget.style.color = '#1a1612')}
        onMouseLeave={e => (e.currentTarget.style.color = '#5a5248')}
      >
        Recalls
      </span>
      {/* Mobile: shield icon */}
      <span className={`recalls-nav-icon${hasCompareItems ? ' recalls-hide-for-compare' : ''}`} onClick={() => router.push('/recalls')} style={{
        display: 'none', cursor: 'pointer', flexShrink: 0,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5a5248" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </span>
      <style>{`
        @media (max-width: 768px) {
          .recalls-nav-text { display: none !important; }
          .recalls-nav-icon { display: inline-flex !important; }
          .recalls-hide-for-compare.recalls-nav-icon { display: none !important; }
        }
      `}</style>
    </>
  );
}
