'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function formatDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}

export default function HomepageRecalls() {
  const router = useRouter();
  const [recalls, setRecalls] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard/recalls?days=180&type=recalls')
      .then(r => r.json())
      .then(d => { setRecalls((d.recalls || []).slice(0, 3)); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || recalls.length === 0) return null;

  return (
    <div style={{
      background: '#fff', borderRadius: 24, border: '1px solid #ede8df',
      padding: '40px 36px', position: 'relative', overflow: 'hidden',
      maxWidth: 680, width: '100%', margin: '0 auto', boxSizing: 'border-box',
    }}>
      {/* Red accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #A32D2D, transparent)', opacity: 0.3 }} />

      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#A32D2D', marginBottom: 10, fontFamily: "'Inter', sans-serif" }}>Recent FDA Recalls</div>
        <h2 className="section-h2" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, color: '#1C1814', margin: '0 0 8px' }}>
          Is your dog&rsquo;s food safe?
        </h2>
        <p style={{ fontSize: 15, color: '#5a5248', maxWidth: 480, margin: '0 auto', lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
          The FDA issues dog food recalls regularly. Most pet parents don&rsquo;t find out until it&rsquo;s too late.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {recalls.map((r, i) => {
          const isUrgent = r.severity === 'Class I' || (r.reason || '').toLowerCase().includes('health');
          return (
            <div key={r.id || i} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
              borderRadius: 14, border: '1px solid #ede8df', background: '#F4EFE4',
            }}>
              <span style={{
                padding: '4px 10px', borderRadius: 100, fontSize: 9, fontWeight: 800,
                letterSpacing: 1, flexShrink: 0,
                background: isUrgent ? '#fce8e8' : '#fdf0e0',
                color: isUrgent ? '#A32D2D' : '#d4760a',
                fontFamily: "'Inter', sans-serif",
              }}>{isUrgent ? 'URGENT' : 'CAUTION'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1C1814', fontFamily: "'Inter', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.brand_name || 'Unknown Brand'}</div>
                <div style={{ fontSize: 12, color: '#5a5248', fontFamily: "'Inter', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.product_description}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: '#8a7e72', fontFamily: "'Inter', sans-serif" }}>{formatDate(r.recall_date || r.report_date)}</div>
                {r.lot_numbers && <div style={{ fontSize: 10, color: '#b5aa99', fontFamily: "'Inter', sans-serif" }}>Lots affected</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button onClick={() => router.push('/recalls')} style={{
          padding: '12px 28px', borderRadius: 100, background: '#1C1814', color: '#F4EFE4',
          fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
          fontFamily: "'Inter', sans-serif", marginBottom: 10,
        }}>View All Recalls &rarr;</button>
        <div>
          <span onClick={() => router.push('/pro')} style={{
            fontSize: 12, color: '#C8941F', fontWeight: 600, cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
          }}>Get instant recall alerts with Pro &rarr;</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="padding: '40px 36px'"] { padding: 24px 20px !important; }
        }
      `}</style>
    </div>
  );
}
