'use client';
import { useRouter } from 'next/navigation';
import { useCompare } from './CompareContext';

export default function RecallsNav() {
  const router = useRouter();
  const { items } = useCompare();
  const hasCompareItems = items.length > 0;

  return (
    <>
      <span className={`recalls-nav-link${hasCompareItems ? ' recalls-hide-for-compare' : ''}`} onClick={() => router.push('/recalls')} style={{
        fontSize: 14, fontWeight: 600, color: '#5a5248', cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif", display: 'inline-block',
        transition: 'color 0.2s',
      }}
        onMouseEnter={e => (e.currentTarget.style.color = '#1a1612')}
        onMouseLeave={e => (e.currentTarget.style.color = '#5a5248')}
      >
        Recalls
      </span>
      <style>{`
        @media (max-width: 768px) {
          .recalls-nav-link { font-size: 12px !important; }
          .recalls-hide-for-compare { display: none !important; }
        }
      `}</style>
    </>
  );
}
