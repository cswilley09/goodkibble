'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RecallsNav() {
  const router = useRouter();
  const [hasRecent, setHasRecent] = useState(false);

  useEffect(() => {
    // Check once per session, cache for 30 minutes
    const cached = localStorage.getItem('gk_recalls_dot');
    if (cached) {
      const { value, ts } = JSON.parse(cached);
      if (Date.now() - ts < 30 * 60 * 1000) { setHasRecent(value); return; }
    }
    fetch('/api/dashboard/recalls?days=30&type=recalls')
      .then(r => r.json())
      .then(d => {
        const has = (d.summary?.totalRecalls || 0) > 0;
        setHasRecent(has);
        localStorage.setItem('gk_recalls_dot', JSON.stringify({ value: has, ts: Date.now() }));
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <span className="recalls-nav-link" onClick={() => router.push('/recalls')} style={{
        fontSize: 14, fontWeight: 600, color: '#5a5248', cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif", position: 'relative', display: 'inline-block',
        transition: 'color 0.2s',
      }}
        onMouseEnter={e => (e.currentTarget.style.color = '#1a1612')}
        onMouseLeave={e => (e.currentTarget.style.color = '#5a5248')}
      >
        Recalls
        {hasRecent && (
          <span style={{
            position: 'absolute', top: -2, right: -8,
            width: 7, height: 7, borderRadius: '50%', background: '#A32D2D',
          }} />
        )}
      </span>
      <style>{`
        @media (max-width: 768px) {
          .recalls-nav-link { font-size: 12px !important; }
        }
      `}</style>
    </>
  );
}
