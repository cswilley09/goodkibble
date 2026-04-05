'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SignUpButton from '../components/SignUpButton';
import RecallsNav from '../components/RecallsNav';
import { useAuth } from '../components/AuthContext';

function formatDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}

export default function RecallsPage() {
  const router = useRouter();
  const { isPro, session } = useAuth();
  const [recalls, setRecalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gateModal, setGateModal] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/recalls?days=365&type=recalls')
      .then(r => r.json())
      .then(d => {
        // Sort: date desc, then urgency (Class I first)
        const sorted = (d.recalls || []).sort((a, b) => {
          const dateA = new Date(a.recall_date || a.report_date || a.created_at || 0);
          const dateB = new Date(b.recall_date || b.report_date || b.created_at || 0);
          if (dateB - dateA !== 0) return dateB - dateA;
          const sevOrder = { 'Class I': 0, 'Class II': 1, 'Class III': 2 };
          return (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3);
        });
        setRecalls(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? recalls.filter(r => {
        const q = search.toLowerCase();
        return (r.brand_name || '').toLowerCase().includes(q)
          || (r.product_description || '').toLowerCase().includes(q)
          || (r.reason || '').toLowerCase().includes(q);
      })
    : recalls;

  function handleRowClick(recall) {
    if (isPro) {
      setExpandedId(expandedId === recall.id ? null : recall.id);
    } else {
      setGateModal(recall);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid #ede8df',
        background: '#faf8f4', position: 'sticky', top: 0, zIndex: 40,
      }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: '#1a1612', letterSpacing: -0.5 }}>GoodKibble</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <RecallsNav />
          <SignUpButton />
        </div>
      </nav>

      <div className="recalls-container" style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Pro banner */}
        {!isPro && (
          <div className="pro-banner" style={{
            background: 'linear-gradient(135deg, #1a1612, #2a2318)', borderRadius: 16,
            padding: '18px 24px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 28, gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>Never check manually again</div>
              <div style={{ fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>Pro members get instant email alerts when a recall affects their dog&rsquo;s food</div>
            </div>
            <button onClick={() => router.push('/pro')} style={{
              padding: '8px 20px', borderRadius: 100, background: '#C9A84C', color: '#fff',
              fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap', flexShrink: 0,
            }}>Get Alerts &rarr;</button>
          </div>
        )}

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: '#1a1612', margin: '0 0 6px' }}>FDA Dog Food Recalls</h1>
        <p style={{ fontSize: 14, color: '#8a7e72', marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>Updated every 6 hours from FDA and AVMA sources</p>

        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 12, border: '1.5px solid #ede8df', padding: '4px 4px 4px 16px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b5aa99" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by brand, product, or reason..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, padding: '10px 12px', background: 'transparent', color: '#1a1612', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
            />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#b5aa99', fontSize: 16, cursor: 'pointer', padding: '6px 12px' }}>&times;</button>}
          </div>
          {search && <div style={{ fontSize: 12, color: '#b5aa99', marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>Showing {filtered.length} of {recalls.length} recalls</div>}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ width: 24, height: 24, border: '3px solid #ede8df', borderTopColor: '#A32D2D', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Loading recalls...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ fontSize: 32, opacity: 0.3, marginBottom: 12 }}>{'\u{1F6E1}\u{FE0F}'}</div>
            {search ? `No recalls match "${search}"` : 'No recalls found in the last year'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(r => {
              const isUrgent = r.severity === 'Class I' || (r.reason || '').toLowerCase().includes('health');
              const expanded = expandedId === r.id && isPro;
              return (
                <div key={r.id}>
                  <div onClick={() => handleRowClick(r)} style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px',
                    borderRadius: expanded ? '16px 16px 0 0' : 16, border: '1px solid #ede8df',
                    background: '#fff', cursor: 'pointer', transition: 'box-shadow 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    <span style={{
                      padding: '4px 10px', borderRadius: 100, fontSize: 9, fontWeight: 800,
                      letterSpacing: 1, flexShrink: 0,
                      background: isUrgent ? '#fce8e8' : '#fdf0e0',
                      color: isUrgent ? '#A32D2D' : '#d4760a',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>{isUrgent ? 'URGENT' : 'CAUTION'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>{r.brand_name || 'Unknown Brand'}</div>
                      <div style={{ fontSize: 13, color: '#5a5248', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.product_description}</div>
                      <div style={{ fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason !== r.product_description ? r.reason : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>{formatDate(r.recall_date || r.report_date)}</div>
                      {r.lot_numbers && <div style={{ fontSize: 10, color: '#b5aa99', fontFamily: "'DM Sans', sans-serif" }}>Lots affected</div>}
                    </div>
                    <span style={{ fontSize: 18, color: '#b5aa99', flexShrink: 0 }}>&rarr;</span>
                  </div>

                  {/* Expanded detail (Pro only) */}
                  {expanded && (
                    <div style={{
                      padding: '20px 24px', background: '#fff', border: '1px solid #ede8df',
                      borderTop: 'none', borderRadius: '0 0 16px 16px',
                      animation: 'fadeIn 0.2s ease',
                    }}>
                      {r.reason && <div style={{ fontSize: 14, color: '#3d352b', lineHeight: 1.6, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>{r.reason}</div>}
                      {r.lot_numbers && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#8a7e72', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Lot Numbers</div>
                          <div style={{ fontSize: 13, color: '#5a5248', fontFamily: "'DM Sans', sans-serif" }}>{r.lot_numbers}</div>
                        </div>
                      )}
                      {r.distribution_pattern && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#8a7e72', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Distribution</div>
                          <div style={{ fontSize: 13, color: '#5a5248', fontFamily: "'DM Sans', sans-serif" }}>{r.distribution_pattern}</div>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                        {r.source_url && (
                          <a href={r.source_url} target="_blank" rel="noopener noreferrer" style={{
                            padding: '8px 18px', borderRadius: 100, background: '#A32D2D', color: '#fff',
                            fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: "'DM Sans', sans-serif",
                          }}>View FDA Source &rarr;</a>
                        )}
                        <button onClick={() => router.push('/discover')} style={{
                          padding: '8px 18px', borderRadius: 100, border: '1.5px solid #ede8df',
                          background: 'transparent', color: '#1a1612', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        }}>Find Alternatives</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pro Gate Modal */}
      {gateModal && (
        <>
          <div onClick={() => setGateModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#fff', borderRadius: 24, padding: 36, maxWidth: 440,
            width: 'calc(100vw - 48px)', zIndex: 1001, textAlign: 'center',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <div onClick={() => setGateModal(null)} style={{ position: 'absolute', top: 16, right: 16, fontSize: 18, color: '#b5aa99', cursor: 'pointer' }}>&times;</div>
            <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.8 }}>{'\u{1F514}'}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: '#1a1612', margin: '0 0 8px' }}>Get recall details &amp; alerts</h2>
            <p style={{ fontSize: 14, color: '#5a5248', marginBottom: 8 }}>See full recall details, affected lot numbers, and recommended actions.</p>
            <p style={{ fontSize: 13, color: '#8a7e72', marginBottom: 24 }}>Pro members also get instant email alerts when a recall affects any food in their profile &mdash; so you never have to check manually.</p>
            <button onClick={() => router.push('/pro')} style={{
              width: '100%', padding: 14, borderRadius: 100, background: '#C9A84C', color: '#fff',
              fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: 8,
            }}>Get GoodKibble Pro &rarr;</button>
            <p style={{ fontSize: 12, color: '#b5aa99', marginBottom: 16 }}>$29/year &middot; Cancel anytime</p>
            <div style={{ height: 1, background: '#ede8df', marginBottom: 16 }} />
            <p style={{ fontSize: 12, color: '#8a7e72' }}>Just want to check your food? <span onClick={() => { setGateModal(null); router.push('/discover'); }} style={{ color: '#C9A84C', fontWeight: 600, cursor: 'pointer' }}>Search free &rarr;</span></p>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .recalls-container { padding: 24px 16px 60px !important; }
          .pro-banner { flex-direction: column !important; text-align: center !important; }
          .pro-banner button { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
