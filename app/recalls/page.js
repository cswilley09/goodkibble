'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SignUpButton from '../components/SignUpButton';
import RecallsNav from '../components/RecallsNav';
import CompareBubble from '../components/CompareBubble';
import { useAuth } from '../components/AuthContext';

function formatDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}

function isUrgent(r) {
  return r.severity === 'Class I' || (r.reason || '').toLowerCase().includes('health');
}


export default function RecallsPage() {
  const router = useRouter();
  const { isPro } = useAuth();
  const [recalls, setRecalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gateModal, setGateModal] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');
  const [proPopup, setProPopup] = useState(false);

  // Engagement-based modal trigger state
  const detailClicksRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch('/api/dashboard/recalls?days=365&type=recalls')
      .then(r => r.json())
      .then(d => {
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

  // Engagement-based Pro popup: 30s timer OR 2 detail clicks (whichever first)
  // Timer resets each time user navigates to the page, but modal only shows
  // once per visit (dismissed flag resets on cleanup when leaving page)
  useEffect(() => {
    if (isPro) return;
    if (sessionStorage.getItem('gk_recalls_popup_dismissed')) return;
    timerRef.current = setTimeout(() => {
      if (!sessionStorage.getItem('gk_recalls_popup_dismissed')) {
        setProPopup(true);
      }
    }, 20000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPro]);

  function triggerProPopup() {
    if (isPro) return;
    if (sessionStorage.getItem('gk_recalls_popup_dismissed')) return;
    setProPopup(true);
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function closeProPopup() {
    setProPopup(false);
    sessionStorage.setItem('gk_recalls_popup_dismissed', '1');
  }

  const filtered = search.trim()
    ? recalls.filter(r => {
        const q = search.toLowerCase();
        return (r.brand_name || '').toLowerCase().includes(q)
          || (r.product_description || '').toLowerCase().includes(q)
          || (r.reason || '').toLowerCase().includes(q);
      })
    : recalls;

  const displayCards = filtered;

  function handleCardClick(recall) {
    if (isPro) {
      setExpandedId(expandedId === recall.id ? null : recall.id);
    } else {
      // Track detail clicks for engagement trigger
      detailClicksRef.current += 1;
      if (detailClicksRef.current >= 2) {
        triggerProPopup();
      }
      setGateModal(recall);
    }
  }

  const benefits = [
    { icon: '\u{1F514}', title: 'Instant recall alerts', desc: "Your dog\u2019s food gets recalled? You\u2019ll know within hours \u2014 not weeks." },
    { icon: '\u{1F4CA}', title: 'Score change notifications', desc: "Formulas change quietly. We\u2019ll tell you when yours does." },
    { icon: '\u{1F50D}', title: 'Ingredient deep-dives', desc: "See what\u2019s really behind every ingredient \u2014 quality signals, sourcing, red flags." },
  ];

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
          <a href="/discover" className="nav-discover-link" style={{ fontSize: 14, fontWeight: 600, color: '#5a5248', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textDecoration: 'none' }}>Discover Foods</a>
          <RecallsNav />
          <CompareBubble />
          <SignUpButton />
        </div>
      </nav>

      <div className="recalls-container" style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Pro banner — free users only */}
        {!isPro && (
          <div className="pro-banner" style={{
            background: 'linear-gradient(135deg, #1a1612, #2a2318)', borderRadius: 16,
            padding: '16px 24px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 28, gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{'\u{1F514}'}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>Never check manually again</div>
                <div style={{ fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>Pro members get instant email alerts when a recall affects their dog&rsquo;s food</div>
              </div>
            </div>
            <a href="/pro" className="pro-banner-btn" style={{
              padding: '8px 20px', borderRadius: 100, background: '#C9A84C', color: '#fff',
              fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap', flexShrink: 0,
              textDecoration: 'none', display: 'inline-block',
            }}>Get Alerts &rarr;</a>
          </div>
        )}

        {/* Header */}
        <h1 style={{ fontFamily: "Georgia, 'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: '#1a1612', margin: '0 0 6px' }}>FDA Dog Food Recalls</h1>
        <p style={{ fontSize: 14, color: '#8a7e72', marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>Updated every 6 hours from FDA and AVMA sources</p>

        {/* Search bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 14,
            border: '1.5px solid #ede8df', padding: '4px 4px 4px 18px',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b5aa99" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by brand, product, or reason..."
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: 15, padding: '10px 12px',
                background: 'transparent', color: '#1a1612', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                background: '#f0ebe3', border: 'none', color: '#8a7e72', fontSize: 12,
                cursor: 'pointer', padding: '8px 16px', borderRadius: 10,
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, flexShrink: 0,
              }}>Clear</button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div style={{ fontSize: 12, color: '#b5aa99', marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
          {loading ? '' : `${filtered.length} recall${filtered.length !== 1 ? 's' : ''} found`}
        </div>

        {/* Content */}
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
            {displayCards.map((r, idx) => {
              const urgent = isUrgent(r);
              const expanded = expandedId === r.id && isPro;
              const multiBrand = (r.brand_name || '').includes('/') || (r.brand_name || '').includes(' and ') || (r.brand_name || '').includes(', ');

              return (
                <div key={r.id}>
                  {/* Card */}
                  <div
                    className="recall-card"
                    onClick={() => handleCardClick(r)}
                    style={{
                      display: 'flex', alignItems: 'stretch',
                      borderRadius: expanded ? '16px 16px 0 0' : 16, overflow: 'hidden',
                      cursor: 'pointer',
                      background: urgent ? '#fef8f8' : '#fff',
                      border: urgent ? '1px solid #e8c4c4' : '1px solid #ede8df',
                      transition: 'box-shadow 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'; }}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    {/* Left border strip */}
                    <div style={{
                      width: 4, flexShrink: 0,
                      background: urgent ? '#A32D2D' : '#EF9F27',
                    }} />

                    {/* Card content */}
                    <div className="recall-card-inner" style={{
                      flex: 1, minWidth: 0, padding: '18px 22px',
                      display: 'flex', alignItems: 'center', gap: 16,
                    }}>
                      {/* Severity badge */}
                      <span className="recall-badge" style={{
                        padding: '5px 12px', borderRadius: 100, fontSize: 10, fontWeight: 800,
                        letterSpacing: 1, flexShrink: 0, textTransform: 'uppercase',
                        background: urgent ? '#fce8e8' : '#fdf0e0',
                        color: urgent ? '#A32D2D' : '#d4760a',
                        fontFamily: "'DM Sans', sans-serif",
                      }}>{urgent ? 'URGENT' : 'CAUTION'}</span>

                      {/* Content area */}
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#1a1612', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.brand_name || 'Unknown Brand'}
                          </span>
                          {multiBrand && (
                            <span style={{
                              padding: '2px 8px', borderRadius: 100, background: '#f0ebe3',
                              fontSize: 9, fontWeight: 700, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif",
                              letterSpacing: 0.5, flexShrink: 0,
                            }}>MULTI-BRAND</span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: '#5a5248', fontFamily: "'DM Sans', sans-serif", marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.product_description}
                        </div>
                        {r.reason && r.reason !== r.product_description && (
                          <div className="recall-reason" style={{ fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.reason}
                          </div>
                        )}
                      </div>

                      {/* Date area */}
                      <div className="recall-date" style={{ textAlign: 'right', flexShrink: 0, minWidth: 100 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>
                          {formatDate(r.recall_date || r.report_date)}
                        </div>
                        {r.lot_numbers && (
                          <div style={{ fontSize: 10, color: '#b5aa99', fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>Lots affected</div>
                        )}
                      </div>

                      {/* Arrow */}
                      <span style={{ fontSize: 16, color: '#d4c9b8', flexShrink: 0, fontWeight: 300 }}>{'\u203A'}</span>
                    </div>
                  </div>

                  {/* Expanded detail (Pro only) */}
                  {expanded && (
                    <div style={{
                      padding: '20px 24px', background: '#fff',
                      border: urgent ? '1px solid #e8c4c4' : '1px solid #ede8df',
                      borderTop: 'none', borderRadius: '0 0 16px 16px',
                    }}>
                      {r.reason && (
                        <div style={{ fontSize: 14, color: '#3d352b', lineHeight: 1.6, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>{r.reason}</div>
                      )}
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
                      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                        {r.source_url && (
                          <a href={r.source_url} target="_blank" rel="noopener noreferrer" style={{
                            padding: '8px 18px', borderRadius: 100, background: '#A32D2D', color: '#fff',
                            fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: "'DM Sans', sans-serif",
                          }}>View Source &rarr;</a>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); router.push('/discover'); }} style={{
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

      {/* Pro Gate Modal (click on card) */}
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
              fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}>Get GoodKibble Pro &rarr;</button>
            <p style={{ fontSize: 12, color: '#b5aa99', marginBottom: 16 }}>$29/year &middot; Cancel anytime</p>
            <div style={{ height: 1, background: '#ede8df', marginBottom: 16 }} />
            <p style={{ fontSize: 12, color: '#8a7e72' }}>Just want to check your food? <span onClick={() => { setGateModal(null); router.push('/discover'); }} style={{ color: '#C9A84C', fontWeight: 600, cursor: 'pointer' }}>Search free &rarr;</span></p>
          </div>
        </>
      )}

      {/* Engagement-based Pro Popup (after 30s or 2 detail clicks, once per session) */}
      {proPopup && (
        <>
          <div onClick={closeProPopup} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
          <div className="pro-popup-modal" style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#fff', borderRadius: 24, padding: 36, maxWidth: 460,
            width: 'calc(100% - 48px)', zIndex: 1001, textAlign: 'center',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <div onClick={closeProPopup} style={{ position: 'absolute', top: 16, right: 16, fontSize: 18, color: '#b5aa99', cursor: 'pointer' }}>&times;</div>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u{1F514}'}</div>
            <h2 style={{ fontFamily: "Georgia, 'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: '#1a1612', margin: '0 0 8px' }}>You&rsquo;re already checking &mdash; let us do it for you.</h2>
            <p style={{ fontSize: 14, color: '#5a5248', lineHeight: 1.6, marginBottom: 24 }}>
              Get instant email alerts when the FDA issues a recall on any food your dog eats. Pro monitors every 6 hours so you don&rsquo;t have to.
            </p>

            {/* Benefits box */}
            <div style={{ border: '1px solid #ede8df', borderRadius: 14, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
              {benefits.map((b, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0',
                  borderBottom: i < benefits.length - 1 ? '1px solid #f5f2ec' : 'none',
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                    {b.icon}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>{b.title}</div>
                    <div style={{ fontSize: 11, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginTop: 2, lineHeight: 1.4 }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => router.push('/pro')} style={{
              width: '100%', padding: 14, borderRadius: 100, background: '#C9A84C', color: '#fff',
              fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>Get GoodKibble Pro &rarr;</button>
            <p style={{ fontSize: 12, color: '#b5aa99', marginTop: 8, marginBottom: 12 }}>$29/year &middot; Cancel anytime</p>
            <div onClick={closeProPopup} style={{
              fontSize: 13, color: '#8a7e72', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>Not right now</div>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .nav-discover-link { font-size: 12px !important; }
          .recalls-container { padding: 24px 16px 60px !important; }
          .pro-banner { flex-direction: column !important; text-align: center !important; }
          .pro-banner-btn { width: 100% !important; text-align: center !important; }
          .recall-card-inner { flex-wrap: wrap !important; gap: 10px !important; padding: 14px 16px !important; }
          .recall-badge { order: -1; }
          .recall-date { text-align: left !important; width: 100%; margin-top: 4px; }
          .recall-reason { white-space: normal !important; }
          .pro-popup-modal { padding: 24px !important; }
        }
      `}</style>
    </div>
  );
}
