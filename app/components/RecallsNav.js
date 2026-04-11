'use client';
import { useRouter } from 'next/navigation';

export default function RecallsNav() {
  const router = useRouter();

  return (
    <>
      <span className="recalls-nav-link" onClick={() => router.push('/recalls')} style={{
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
          .recalls-nav-link { display: none !important; }
        }
      `}</style>
    </>
  );
}
