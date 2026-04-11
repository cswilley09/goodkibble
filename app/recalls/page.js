'use client';
import { useState, useEffect } from 'react';
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

/* Try to fuzzy-match a recall brand against a dog's current_food string */
function checkProfileMatch(recall, dogs) {
  if (!dogs || dogs.length === 0) return null;
  const recallBrand = (recall.brand_name || '').toLowerCase().trim();
  if (!recallBrand) return null;
  for (const dog of dogs) {
    const food = (dog.current_food || '').toLowerCase().trim();
    if (!food) continue;
    if (food.includes(recallBrand) || recallBrand.includes(food.split(' ')[0])) {
      return { match: true, dog };
    }
  }
  // No match — return first dog for display
  return { match: false, dog: dogs[0] };
}

export default function RecallsPage() {
  const router = useRouter();
  const { isPro, session } = useAuth();
  const [recalls, setRecalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');
  const [dogs, setDogs] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

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
        if (sorted.length > 0) {
          const latest = sorted[0].created_at || sorted[0].recall_date || sorted[0].report_date;
          if (latest) setLastUpdated(new Date(latest));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch dog profiles for profile match indicator
  useEffect(() => {
    if (!session?.user) { setDogs(null); return; }
    const userId = session.user.id;
    const email = session.user.email;
    fetch(`/api/profile?user_id=${userId}&email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(d => setDogs(d.dogs || []))
      .catch(() => setDogs(null));
  }, [session]);


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
    setExpandedId(expandedId === recall.id ? null : recall.id);
  }


  /* ── label+value card for the key details grid ── */
  const DetailCard = ({ label, value }) => (
    <div style={{
      padding: '10px 14px', background: '#faf8f4', borderRadius: 10,
      border: '1px solid #f0ebe3',
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1612', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4, wordBreak: 'break-word' }}>{value}</div>
    </div>
  );

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
        <p style={{ fontSize: 14, color: '#8a7e72', marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
          Updated every 6 hours from FDA and AVMA sources
          {lastUpdated && <span style={{ marginLeft: 8, fontSize: 12, color: '#b5aa99' }}>&middot; Last checked {lastUpdated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>}
        </p>

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
            {displayCards.map((r) => {
              const urgent = isUrgent(r);
              const expanded = expandedId === r.id;
              const dimmed = expandedId !== null && expandedId !== r.id;
              const multiBrand = (r.brand_name || '').includes('/') || (r.brand_name || '').includes(' and ') || (r.brand_name || '').includes(', ');

              // Key detail fields — only render cards for fields that have data
              const keyDetails = [];
              if (r.lot_numbers) keyDetails.push({ label: 'Lot Number(s)', value: r.lot_numbers });
              if (r.best_by_date || r.expiration_date) keyDetails.push({ label: 'Best By / Expiration', value: r.best_by_date || r.expiration_date });
              if (r.upc_code || r.upc) keyDetails.push({ label: 'UPC Code', value: r.upc_code || r.upc });

              // Distribution & packaging line
              const distParts = [];
              if (r.package_size) distParts.push(`Package: ${r.package_size}`);
              if (r.distribution_pattern) distParts.push(`Distribution: ${r.distribution_pattern}`);
              const distLine = distParts.length > 0 ? distParts.join(' \u00b7 ') : null;

              // Profile match
              const profileResult = session?.user ? checkProfileMatch(r, dogs || []) : null;

              return (
                <div key={r.id} style={{ opacity: dimmed ? 0.5 : 1, transition: 'opacity 0.3s ease' }}>
                  {/* Card row */}
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
                      <span style={{ fontSize: 16, color: '#d4c9b8', flexShrink: 0, fontWeight: 300, transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'none' }}>{'\u203A'}</span>
                    </div>
                  </div>

                  {/* ══ Expanded detail ══ */}
                  <div className="recall-detail" style={{
                    maxHeight: expanded ? 1200 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease',
                  }}>
                    <div style={{
                      padding: '24px 24px 20px', background: '#fff',
                      border: urgent ? '1px solid #e8c4c4' : '1px solid #ede8df',
                      borderTop: 'none', borderRadius: '0 0 16px 16px',
                    }}>

                      {/* Section 1 — AI summary (preferred) or fallback to reason */}
                      {r.detail_summary ? (
                        <div style={{ fontSize: 14, color: '#5a5248', lineHeight: 1.7, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>{r.detail_summary}</div>
                      ) : r.reason && r.reason !== r.product_description ? (
                        <div style={{ fontSize: 14, color: '#5a5248', lineHeight: 1.7, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>{r.reason}</div>
                      ) : null}

                      {/* Affected products (from AI enrichment) */}
                      {r.affected_products && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>Affected Products</div>
                          <div style={{ fontSize: 13, color: '#1a1612', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{r.affected_products}</div>
                        </div>
                      )}

                      {/* Section 2 — Key details grid */}
                      {keyDetails.length > 0 && (
                        <div className="key-details-grid" style={{
                          display: 'grid', gridTemplateColumns: `repeat(${Math.min(keyDetails.length, 3)}, 1fr)`,
                          gap: 10, marginBottom: 16,
                        }}>
                          {keyDetails.map((d) => <DetailCard key={d.label} label={d.label} value={d.value} />)}
                        </div>
                      )}

                      {/* Section 3 — Distribution */}
                      {(r.distribution_pattern || distLine) && (
                        <div style={{ fontSize: 13, color: '#5a5248', lineHeight: 1.6, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
                          {r.distribution_pattern || distLine}
                        </div>
                      )}

                      {/* Consumer action (from AI enrichment) */}
                      {r.consumer_action && (
                        <div style={{
                          background: '#fef9ee', border: '1px solid #f0e6c8', borderRadius: 10,
                          padding: '12px 16px', marginBottom: 16,
                        }}>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#c47a20', fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>What to do</div>
                          <div style={{ fontSize: 13, color: '#5a5248', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{r.consumer_action}</div>
                        </div>
                      )}

                      {/* Company contact (from AI enrichment) */}
                      {r.company_contact && (
                        <div style={{ fontSize: 12, color: '#8a7e72', marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
                          <strong>Company contact:</strong> {r.company_contact}
                        </div>
                      )}

                      {/* Section 4 — Profile match indicator */}
                      {session?.user ? (
                        profileResult && dogs && dogs.length > 0 ? (
                          profileResult.match ? (
                            <div style={{ background: '#fce8e8', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#A32D2D', fontFamily: "'DM Sans', sans-serif" }}>
                                {'\u26A0\uFE0F'} This may affect {profileResult.dog.dog_name}&rsquo;s food
                              </div>
                              <div style={{ fontSize: 12, color: '#5a3030', fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>
                                Check the lot numbers above against your bag
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); router.push('/discover'); }} style={{
                                marginTop: 8, padding: '6px 14px', borderRadius: 100,
                                border: '1.5px solid #e8c4c4', background: 'transparent',
                                color: '#A32D2D', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                fontFamily: "'DM Sans', sans-serif",
                              }}>Find Alternatives &rarr;</button>
                            </div>
                          ) : (
                            <div style={{ background: '#eef5e4', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#639922', fontFamily: "'DM Sans', sans-serif" }}>
                                {'\u2713'} Not in your profile
                              </div>
                              <div style={{ fontSize: 12, color: '#5a5248', fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>
                                {profileResult.dog.dog_name} eats {profileResult.dog.current_food || 'an unlisted food'}
                              </div>
                            </div>
                          )
                        ) : null
                      ) : null}

                      {/* Section 5 — Action buttons */}
                      <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                        {r.source_url && (
                          <a href={r.source_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{
                            padding: '8px 16px', borderRadius: 100, background: '#1a1612', color: '#faf8f4',
                            fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: "'DM Sans', sans-serif",
                          }}>View FDA Source &rarr;</a>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); router.push('/discover'); }} style={{
                          padding: '8px 16px', borderRadius: 100, border: '1.5px solid #ede8df',
                          background: 'transparent', color: '#1a1612', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        }}>Find Alternatives</button>
                      </div>

                      {/* Inline Pro CTA — subtle strip, free users only */}
                      {!isPro && (
                        <div className="recall-pro-strip" onClick={(e) => e.stopPropagation()} style={{
                          background: '#f5f2ec', borderRadius: 10, padding: '12px 18px', marginTop: 20,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          gap: 12, fontFamily: "'DM Sans', sans-serif",
                        }}>
                          <span style={{ fontSize: 13, color: '#5a5248' }}>{'\u{1F514}'} Get instant recall alerts to your email</span>
                          <a href="/pro" style={{ fontSize: 13, color: '#C9A84C', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>Learn about Pro &rarr;</a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        )}
      </div>


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
          .key-details-grid { grid-template-columns: 1fr 1fr !important; }
          .recall-pro-strip { flex-wrap: wrap !important; gap: 6px !important; }
        }
      `}</style>
    </div>
  );
}
