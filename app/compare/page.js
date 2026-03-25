'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCompare } from '../components/CompareContext';
import CompareBubble from '../components/CompareBubble';
import SearchBox from '../components/SearchBox';
import { supabase } from '../../lib/supabase';

/* ── fixed nutrient colors (same as product page) ── */
const NC = {
  protein_dmb: '#2d7a4f',
  fat_dmb: '#c47a20',
  carbs_dmb: '#5a7a9e',
  fiber_dmb: '#8a6aaf',
};

const SHARED_MAX = 50;

const NUTRIENTS = [
  { label: 'Protein', key: 'protein_dmb' },
  { label: 'Fat', key: 'fat_dmb' },
  { label: 'Carbs', key: 'carbs_dmb' },
  { label: 'Fiber', key: 'fiber_dmb' },
];

/* ── responsive hook ── */
function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return mobile;
}

/* ── score tier helpers ── */
function getScoreColor(score) {
  if (score >= 70) return '#2d7a4f';
  if (score >= 50) return '#c47a20';
  return '#b5483a';
}

function getScoreTier(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Great';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Below Avg';
  return 'Poor';
}

/* ── score ring badge ── */
function ScoreRing({ score, compact }) {
  if (score == null) return null;
  const color = getScoreColor(score);
  const circumference = 106.8;
  const offset = circumference * (1 - score / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={compact ? 32 : 42} height={compact ? 32 : 42} viewBox="0 0 42 42">
        <circle cx={21} cy={21} r={17} fill="none" stroke="#ede8df" strokeWidth={3} />
        <circle cx={21} cy={21} r={17} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 21 21)" />
        <text x={21} y={21} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", fill: '#1a1612' }}>
          {score}
        </text>
      </svg>
      <span style={{ fontSize: 9, fontFamily: "'DM Sans', sans-serif", color: '#8a7e72', marginTop: 2 }}>
        {getScoreTier(score)}
      </span>
    </div>
  );
}

/* ── nutrient explainer ── */
function NutrientExplainer() {
  const [open, setOpen] = useState(false);
  const nutrients = [
    { name: 'Protein', color: '#2d7a4f', desc: 'Essential for muscle development, immune function, and tissue repair. AAFCO recommends a minimum of 18% for adult dogs and 22.5% for puppies. Higher-protein foods (28%+) can benefit active dogs, but excessively high protein may stress the kidneys in dogs with renal issues.' },
    { name: 'Fat', color: '#c47a20', desc: 'The most concentrated energy source in dog food. Supports healthy skin, coat, brain function, and vitamin absorption. AAFCO minimum is 5.5% for adults and 8.5% for puppies. Most quality foods range between 12-20%. Dogs with pancreatitis may need lower-fat diets.' },
    { name: 'Carbohydrates', color: '#5a7a9e', desc: 'Provide energy and fiber for digestive health. Dogs have no minimum carbohydrate requirement, but carbs from whole grains, vegetables, and legumes provide beneficial fiber and nutrients. Very high carb content (50%+) may indicate filler ingredients.' },
    { name: 'Fiber', color: '#8a6aaf', desc: 'Promotes healthy digestion and regular bowel movements. Most dog foods contain 2-5% fiber. Higher fiber (5-10%) can help with weight management and blood sugar regulation. Sources like beet pulp and pumpkin are considered high quality.' },
  ];
  return (
    <div style={{
      marginTop: 20, borderRadius: 20, border: '1px solid #ede8df',
      background: '#faf8f5', overflow: 'hidden',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '18px 28px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', border: 'none', background: 'transparent', cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1612', letterSpacing: 1 }}>
          📖 What do these numbers mean?
        </span>
        <span style={{ fontSize: 18, color: '#8a7e72', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: '0 28px 24px' }}>
          {nutrients.map((n) => (
            <div key={n.name} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid #ede8df' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: n.color, display: 'inline-block' }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1612' }}>{n.name}</span>
              </div>
              <p style={{ fontSize: 13, color: '#5a5047', lineHeight: 1.6 }}>{n.desc}</p>
            </div>
          ))}
          <p style={{ fontSize: 12, color: '#b5aa99', lineHeight: 1.5, fontStyle: 'italic' }}>
            Nutrient guidelines based on AAFCO (Association of American Feed Control Officials) standards for dog food. Always consult your veterinarian for dietary advice specific to your dog.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── desktop bar with tick marks ── */
function TickBar({ value, color }) {
  const pct = Math.min((value / SHARED_MAX) * 100, 100);
  const ticks = [10, 20, 30, 40].map(v => (v / SHARED_MAX) * 100);
  return (
    <div style={{ flex: 1, position: 'relative', height: 8 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 100, background: '#ede8df', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 100, background: color,
          width: `${pct}%`, transition: 'width 0.8s ease',
        }} />
      </div>
      {ticks.map((tp) => (
        <div key={tp} style={{
          position: 'absolute', left: `${tp}%`, top: -2, bottom: -2,
          width: 1, background: '#d4cfc6', opacity: 0.5, pointerEvents: 'none',
        }} />
      ))}
    </div>
  );
}

/* ── inline search for the add slot ── */
function AddCardSearch({ onSelect, compact }) {
  const [active, setActive] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => { if (active && inputRef.current) inputRef.current.focus(); }, [active]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      supabase
        .from('dog_foods_v2')
        .select('id, name, brand, protein_dmb, fat_dmb, carbs_dmb, fiber_dmb, moisture, ingredients, image_url, quality_score')
        .ilike('name', `%${query}%`)
        .limit(6)
        .then(({ data }) => setResults(data || []));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  if (!active) {
    return (
      <div onClick={() => setActive(true)} style={{
        borderLeft: '1px dashed #e8e0d4',
        textAlign: 'center', cursor: 'pointer', transition: 'all 0.25s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: compact ? 16 : 24, minWidth: compact ? 140 : undefined,
      }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f0e8'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{
          width: compact ? 36 : 44, height: compact ? 36 : 44, borderRadius: '50%', background: '#ede8df',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: compact ? 18 : 22, marginBottom: compact ? 6 : 10, color: '#8a7e72',
        }}>+</div>
        <div style={{ fontSize: compact ? 12 : 14, fontWeight: 600, color: '#8a7e72', marginBottom: 2 }}>Add a food</div>
        {!compact && <div style={{ fontSize: 12, color: '#b5aa99' }}>Click to search</div>}
      </div>
    );
  }

  return (
    <div style={{
      borderLeft: '2px solid #f0c930', padding: compact ? 12 : 20,
      animation: 'scaleIn 0.2s ease', background: '#fff',
      minWidth: compact ? 180 : undefined,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#8a7e72', letterSpacing: 1 }}>SEARCH</span>
        <button onClick={() => { setActive(false); setQuery(''); setResults([]); }} style={{
          background: 'none', border: 'none', color: '#b5aa99', fontSize: 16, cursor: 'pointer', padding: 0, lineHeight: 1,
        }}>✕</button>
      </div>
      <input
        ref={inputRef} type="text" value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Brand or food..."
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 10,
          border: '1.5px solid #ede8df', fontSize: 13,
          fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#faf8f5',
        }}
        onFocus={(e) => e.target.style.borderColor = '#f0c930'}
        onBlur={(e) => e.target.style.borderColor = '#ede8df'}
      />
      <div style={{ marginTop: 6, maxHeight: 200, overflowY: 'auto' }}>
        {results.map((r) => (
          <div key={r.id} onClick={() => { onSelect(r); setActive(false); setQuery(''); setResults([]); }}
            style={{ padding: '9px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#1a1612', transition: 'background 0.15s', lineHeight: 1.4 }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f0e8'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ fontWeight: 600 }}>{r.brand}</div>
            <div style={{ color: '#8a7e72', fontSize: 11 }}>{r.name?.length > 50 ? r.name.substring(0, 50) + '...' : r.name}</div>
          </div>
        ))}
        {query.length >= 2 && results.length === 0 && (
          <div style={{ padding: '14px 10px', fontSize: 12, color: '#b5aa99', textAlign: 'center' }}>No results</div>
        )}
      </div>
    </div>
  );
}

/* ── helper: get first 5 ingredients ── */
function getFirst5(ingredientsStr) {
  if (!ingredientsStr) return [];
  /* smart split: don't split on commas inside parentheses or brackets */
  const all = ingredientsStr.match(/(?:[^,(\[]*(?:\([^)]*\)|\[[^\]]*\])?[^,(\[]*)*/g)
    ?.map(s => s.trim()).filter(Boolean) || [];
  return all.slice(0, 5);
}

/* ══════════════════════════════════════════
   MAIN COMPARE PAGE
   ══════════════════════════════════════════ */
export default function ComparePage() {
  const router = useRouter();
  const { items, addItem, removeItem, clearAll } = useCompare();
  const goHome = () => router.push('/');
  const goFood = (id) => router.push(`/food/${id}`);
  const isMobile = useIsMobile();

  const hasAddSlot = items.length < 3;
  const totalDataCols = items.length + (hasAddSlot ? 1 : 0);

  /* desktop: fixed label col + flex product cols */
  const gridCols = `100px repeat(${totalDataCols}, 1fr)`;

  /* mobile: sticky narrow label col + fixed-width scrollable product cols */
  const mLabelW = 80;
  const mColW = 150;
  const mGridCols = `${mLabelW}px repeat(${totalDataCols}, ${mColW}px)`;

  const colBg = (idx) => idx % 2 === 1 ? '#f7f4ef' : 'transparent';

  /* shared label cell style (sticky on mobile) */
  const labelCell = (extra = {}) => ({
    padding: isMobile ? '10px 6px 10px 10px' : '14px 8px 14px 20px',
    fontSize: isMobile ? 12 : 13,
    fontWeight: 600,
    letterSpacing: 0.3,
    lineHeight: 1.2,
    ...(isMobile ? {
      position: 'sticky', left: 0, zIndex: 2,
      background: '#faf8f5',
      borderRight: '1px solid #ede8df',
    } : {}),
    ...extra,
  });

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {/* nav */}
      <nav className="nav-bar" style={{
        padding: '16px 24px 16px 40px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: '1px solid #ede8df', background: '#fff',
        position: 'sticky', top: 0, zIndex: 40, gap: 16,
      }}>
        <div onClick={goHome} style={{
          fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800,
          color: '#1a1612', cursor: 'pointer', flexShrink: 0,
        }}>Good<span style={{ color: '#f0c930' }}>Kibble</span></div>
        <div className="nav-search" style={{ flex: 1, maxWidth: 380 }}>
          <SearchBox onSelect={goFood} variant="nav" />
        </div>
        <CompareBubble />
      </nav>

      {/* content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '24px 12px 60px' : '40px 24px 80px' }}>
        <button onClick={goHome} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', color: '#8a7e72', fontSize: 14,
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          marginBottom: isMobile ? 20 : 32, padding: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to search
        </button>

        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 20 : 36, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 24 : 'clamp(28px, 3vw, 40px)',
              fontWeight: 800, color: '#1a1612', letterSpacing: -1,
            }}>Compare Foods</h1>
            <p style={{ fontSize: isMobile ? 13 : 15, color: '#8a7e72', marginTop: 4 }}>
              {items.length === 0
                ? 'Add products to start comparing'
                : items.length === 1
                  ? 'Comparing 1 product — add another'
                  : `Comparing ${items.length} products side-by-side`}
            </p>
          </div>
          {items.length > 0 && (
            <button onClick={clearAll} style={{
              padding: '8px 16px', borderRadius: 100, border: '1px solid #e8e0d4',
              background: '#fff', color: '#8a7e72', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>Clear All</button>
          )}
        </div>

        {/* empty state */}
        {items.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: isMobile ? '36px 16px' : '48px 24px',
            background: '#faf8f5', borderRadius: 24, border: '1px solid #ede8df',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚖️</div>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#1a1612', marginBottom: 8 }}>No products selected yet</p>
            <p style={{ fontSize: 14, color: '#8a7e72', maxWidth: 380, margin: '0 auto 24px' }}>
              Search for a dog food and click &ldquo;+ Add to Compare&rdquo; on any product page, or search below.
            </p>
            <div style={{ maxWidth: 340, margin: '0 auto', borderRadius: 20, border: '2px dashed #e8e0d4', overflow: 'hidden' }}>
              <AddCardSearch onSelect={addItem} compact={isMobile} />
            </div>
          </div>
        ) : (
          <>
          {/* ═══ COMPARISON GRID ═══ */}
          {isMobile && (
            <div style={{
              textAlign: 'center', fontSize: 11, color: '#b5aa99', fontWeight: 500,
              marginBottom: 8, letterSpacing: 0.5,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              ← Swipe to compare →
            </div>
          )}
          <div style={{
            background: '#faf8f5', borderRadius: isMobile ? 16 : 24,
            border: '1px solid #ede8df',
            overflow: isMobile ? 'auto' : 'hidden',
            animation: 'fadeUp 0.5s ease',
            WebkitOverflowScrolling: 'touch',
          }}>
            {/* inner wrapper: on mobile, wider than viewport to enable horizontal scroll */}
            <div style={{
              display: 'inline-grid',
              gridTemplateColumns: isMobile ? mGridCols : gridCols,
              minWidth: isMobile ? `${mLabelW + mColW * totalDataCols}px` : undefined,
            }}>

              {/* ══ ROW: product cards ══ */}
              {/* label cell */}
              <div style={{
                ...(isMobile ? { position: 'sticky', left: 0, zIndex: 2, background: '#faf8f5' } : {}),
                borderBottom: '2px solid #ede8df',
              }} />

              {items.map((f, idx) => (
                <div key={f.id} style={{
                  padding: isMobile ? '10px 8px 10px' : '24px 12px 18px',
                  textAlign: 'center',
                  borderLeft: '1px solid #ede8df',
                  borderBottom: '2px solid #ede8df',
                  background: colBg(idx),
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
                  onClick={() => goFood(f.id)}
                  onMouseEnter={(e) => { if (!isMobile) e.currentTarget.style.background = '#f0ebe3'; }}
                  onMouseLeave={(e) => { if (!isMobile) e.currentTarget.style.background = colBg(idx); }}
                >
                  {f.image_url && (
                    <div style={{
                      width: isMobile ? 44 : 80, height: isMobile ? 56 : 104,
                      margin: isMobile ? '0 auto 6px' : '0 auto 12px', borderRadius: isMobile ? 8 : 10,
                      overflow: 'hidden', background: '#fff', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      border: '1px solid #ede8df',
                    }}>
                      <img src={f.image_url} alt={f.name}
                        style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }}
                        onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  )}
                  <div style={{
                    fontSize: isMobile ? 9 : 11, color: '#8a7e72', fontWeight: 600,
                    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 1,
                  }}>{f.brand}</div>
                  {/* title: fixed height for alignment */}
                  <div style={{
                    fontSize: isMobile ? 11 : 13, fontWeight: 600, color: '#1a1612',
                    lineHeight: 1.4, marginBottom: isMobile ? 6 : 10, padding: 0,
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    height: isMobile ? 46 : 55,
                  }}>
                    {f.name}
                  </div>
                  <div style={{ marginBottom: isMobile ? 4 : 8 }}>
                    <ScoreRing score={f.quality_score} compact={isMobile} />
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeItem(f.id); }} style={{
                    padding: isMobile ? '3px 8px' : '5px 12px', borderRadius: 100,
                    border: '1px solid #e8e0d4', background: '#fff', color: '#8a7e72',
                    fontSize: isMobile ? 10 : 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    transition: 'all 0.2s', position: 'relative', zIndex: 2,
                  }}
                    onMouseEnter={(e) => { e.target.style.background = '#fce4e4'; e.target.style.color = '#c44'; e.target.style.borderColor = '#f0c4c4'; }}
                    onMouseLeave={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#8a7e72'; e.target.style.borderColor = '#e8e0d4'; }}
                  >Remove</button>
                  {!isMobile && <div style={{ fontSize: 10, color: '#c4b9a8', marginTop: 8 }}>View details →</div>}
                </div>
              ))}

              {/* add slot */}
              {hasAddSlot && (
                <div style={{ borderBottom: '2px solid #ede8df' }}>
                  <AddCardSearch onSelect={addItem} compact={isMobile} />
                </div>
              )}

              {/* ══ NUTRIENT ROWS ══ */}
              {NUTRIENTS.map((n, nIdx) => {
                const color = NC[n.key];
                const isLast = nIdx === NUTRIENTS.length - 1;
                return [
                  /* label cell */
                  <div key={`${n.key}-label`} style={{
                    ...labelCell({ color }),
                    borderBottom: isLast ? 'none' : '1px solid #f0ebe3',
                  }}>{n.label}</div>,

                  /* product value cells */
                  ...items.map((f, idx) => {
                    const val = f[n.key] || 0;
                    return (
                      <div key={`${n.key}-${f.id}`} style={{
                        padding: isMobile ? '10px 10px' : '14px 16px',
                        borderLeft: '1px solid #f0ebe3',
                        borderBottom: isLast ? 'none' : '1px solid #f0ebe3',
                        background: colBg(idx),
                        display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 10,
                        justifyContent: isMobile ? 'center' : 'flex-start',
                      }}>
                        <div style={{
                          fontSize: isMobile ? 16 : 18, fontWeight: 700, color: '#1a1612',
                          fontFamily: "'DM Sans', sans-serif", lineHeight: 1,
                          minWidth: isMobile ? undefined : 44, flexShrink: 0,
                        }}>
                          {val}<span style={{ fontSize: 12, fontWeight: 500, color: '#8a7e72' }}>%</span>
                        </div>
                        {/* bar: desktop only */}
                        {!isMobile && <TickBar value={val} color={color} />}
                      </div>
                    );
                  }),

                  /* empty add-slot cell */
                  hasAddSlot && (
                    <div key={`${n.key}-add`} style={{
                      borderLeft: '1px dashed #e8e0d4',
                      borderBottom: isLast ? 'none' : '1px solid #f0ebe3',
                    }} />
                  ),
                ];
              })}

              {/* ══ TOP 5 INGREDIENTS ROW ══ */}
              {/* label cell */}
              <div style={{
                ...labelCell({ color: '#8a7e72', fontSize: 11 }),
                borderTop: '2px solid #ede8df',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                borderRight: '1px solid #ede8df',
              }}>
                <span>Top 5<br />Ingredients</span>
              </div>

              {/* product ingredient cells */}
              {items.map((f, idx) => {
                const first5 = getFirst5(f.ingredients);
                return (
                  <div key={`ing-${f.id}`} style={{
                    padding: isMobile ? '12px 10px' : '18px 16px',
                    borderTop: '2px solid #ede8df',
                    background: colBg(idx),
                    display: 'flex', alignItems: 'center',
                  }}>
                    {first5.length > 0 ? (
                      <ol style={{ margin: 0, paddingLeft: isMobile ? 16 : 20, width: '100%' }}>
                        {first5.map((ing, i) => (
                          <li key={i} style={{
                            fontSize: isMobile ? 10 : 12,
                            color: i === 0 ? '#1a1612' : '#5a5047',
                            fontWeight: i === 0 ? 600 : 400,
                            lineHeight: isMobile ? 1.4 : 1.8,
                            fontFamily: "'DM Sans', sans-serif",
                            listStyleType: 'decimal',
                          }}>{ing}</li>
                        ))}
                      </ol>
                    ) : (
                      <div style={{ fontSize: 12, color: '#b5aa99', fontStyle: 'italic' }}>N/A</div>
                    )}
                  </div>
                );
              })}

              {/* add-slot cell */}
              {hasAddSlot && (
                <div style={{ borderLeft: '1px dashed #e8e0d4', borderTop: '2px solid #ede8df' }} />
              )}
            </div>
          </div>

          {/* nutrient explainer */}
          <NutrientExplainer />
          </>
        )}
      </div>

      {/* footer */}
      <div className="footer-bar" style={{
        borderTop: '1px solid #ede8df', padding: isMobile ? '24px 16px' : '32px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div className="footer-logo" style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 24 : 32, fontWeight: 800, color: '#1a1612' }}>
          Good<span style={{ color: '#f0c930' }}>Kibble</span>
        </div>
        <div style={{ fontSize: 13, color: '#b5aa99' }}>© 2026 GoodKibble. Not affiliated with any dog food brand.</div>
      </div>
    </div>
  );
}
