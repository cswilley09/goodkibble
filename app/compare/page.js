'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCompare } from '../components/CompareContext';
import CompareBubble from '../components/CompareBubble';
import SignUpButton from '../components/SignUpButton';
import SearchBox from '../components/SearchBox';

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
  const size = compact ? 32 : 64;
  const r = compact ? 12 : 27;
  const sw = compact ? 3 : 3.5;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ede8df" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
        <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: compact ? 12 : 26, fontWeight: 800, fontFamily: "'DM Sans', sans-serif", fill: '#1a1612' }}>
          {score}
        </text>
      </svg>
      {!compact && (
        <>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", color, marginTop: 4 }}>
            {getScoreTier(score)}
          </span>
          <span style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif", color: '#b5aa99', marginTop: 1 }}>
            GoodKibble Score
          </span>
        </>
      )}
      {compact && (
        <span style={{ fontSize: 9, fontFamily: "'DM Sans', sans-serif", color: '#8a7e72', marginTop: 2 }}>
          {getScoreTier(score)}
        </span>
      )}
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
      fetch(`/api/foods/search?q=${encodeURIComponent(query)}&limit=6`)
        .then(r => r.json())
        .then(data => setResults(Array.isArray(data) ? data : []))
        .catch(() => setResults([]));
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
            style={{ padding: '9px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#1a1612', transition: 'background 0.15s', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: 10 }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f0e8'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {r.image_url ? (
              <img src={r.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'contain', background: '#f2efe9', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f2efe9', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{r.brand}</div>
              <div style={{ color: '#8a7e72', fontSize: 11, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.name}</div>
            </div>
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
  const [saved, setSaved] = useState(false);
  const [ingredientInfo, setIngredientInfo] = useState({});

  useEffect(() => {
    fetch('/api/ingredients').then(r => r.json()).then(data => {
      if (!data || data.error) return;
      const map = {};
      data.forEach(row => { map[row.ingredient_name] = row; });
      setIngredientInfo(map);
    }).catch(() => {});
  }, []);

  function lookupSignal(ingName) {
    if (!ingName) return null;
    const norm = ingName.toLowerCase().trim().replace(/\s*\([^)]*\)$/g, '').replace(/[.]+$/, '').trim();
    if (ingredientInfo[norm]) return ingredientInfo[norm].quality_signal;
    // Multi-prefix stripping: "ground yellow corn" → "yellow corn" → "corn"
    const prefixes = ['whole grain ', 'ground whole grain ', 'ground whole ', 'whole ', 'ground ', 'dried ', 'dehydrated ', 'deboned ', 'freeze-dried ', 'organic ', 'raw ', 'roasted ', 'yellow ', 'white '];
    let stripped = norm;
    for (let i = 0; i < 3; i++) {
      let found = false;
      for (const p of prefixes) {
        if (stripped.startsWith(p)) {
          stripped = stripped.slice(p.length);
          found = true;
          break;
        }
      }
      if (!found) break;
      if (ingredientInfo[stripped]) return ingredientInfo[stripped].quality_signal;
      if (ingredientInfo[stripped + 's']) return ingredientInfo[stripped + 's'].quality_signal;
      if (stripped.endsWith('s') && ingredientInfo[stripped.slice(0, -1)]) return ingredientInfo[stripped.slice(0, -1)].quality_signal;
    }
    // Plural/singular on original norm
    if (ingredientInfo[norm + 's']) return ingredientInfo[norm + 's'].quality_signal;
    if (norm.endsWith('s') && ingredientInfo[norm.slice(0, -1)]) return ingredientInfo[norm.slice(0, -1)].quality_signal;
    return null;
  }

  const goHome = () => router.push('/');
  const goFood = (food) => {
    if (food?.brand_slug && food?.slug) router.push(`/dog-food/${food.brand_slug}/${food.slug}`);
    else router.push(`/food/${food?.id || food}`);
  };
  const isMobile = useIsMobile();

  const hasAddSlot = items.length < 3;
  const totalDataCols = items.length + (hasAddSlot ? 1 : 0);

  /* desktop: fixed label col + flex product cols */
  const gridCols = `160px repeat(${totalDataCols}, 1fr)`;

  /* mobile: sticky narrow label col + fixed-width scrollable product cols */
  const mLabelW = 80;
  const mColW = 150;
  const mGridCols = `${mLabelW}px repeat(${totalDataCols}, ${mColW}px)`;

  const colBg = (idx) => idx % 2 === 1 ? '#f7f4ef' : 'transparent';

  /* shared label cell style (sticky on mobile) */
  const labelCell = (extra = {}) => ({
    padding: isMobile ? '10px 6px 10px 10px' : '18px 12px 18px 24px',
    fontSize: isMobile ? 12 : 15,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CompareBubble />
          <SignUpButton />
        </div>
      </nav>

      {/* content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 12px 60px' : '40px 40px 80px' }}>
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
          {items.length >= 2 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => {
                const comparisons = JSON.parse(localStorage.getItem('gk_saved_comparisons') || '[]');
                const entry = {
                  id: Date.now(),
                  saved_at: new Date().toISOString(),
                  items: items.map(f => ({ id: f.id, name: f.name, brand: f.brand, slug: f.slug, brand_slug: f.brand_slug, image_url: f.image_url, quality_score: f.quality_score, protein_dmb: f.protein_dmb, fat_dmb: f.fat_dmb, carbs_dmb: f.carbs_dmb, primary_protein: f.primary_protein })),
                };
                comparisons.unshift(entry);
                localStorage.setItem('gk_saved_comparisons', JSON.stringify(comparisons.slice(0, 20)));
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
              }} style={{
                padding: '8px 16px', borderRadius: 100,
                background: saved ? '#2d7a4f' : '#C9A84C', color: '#fff',
                fontSize: 13, fontWeight: 600, border: 'none',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                transition: 'background 0.2s',
              }}>{saved ? '\u2713 Saved!' : 'Save Comparison'}</button>
              <button onClick={clearAll} style={{
                padding: '8px 16px', borderRadius: 100, border: '1px solid #e8e0d4',
                background: '#fff', color: '#8a7e72', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>Clear All</button>
            </div>
          )}
          {items.length === 1 && (
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
                  padding: isMobile ? '10px 8px 10px' : '28px 20px 22px',
                  textAlign: 'center',
                  borderLeft: '1px solid #ede8df',
                  borderBottom: '2px solid #ede8df',
                  background: colBg(idx),
                  cursor: 'pointer', transition: 'background 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  position: 'relative',
                }}
                  onClick={() => goFood(f.id)}
                  onMouseEnter={(e) => { if (!isMobile) e.currentTarget.style.background = '#f0ebe3'; }}
                  onMouseLeave={(e) => { if (!isMobile) e.currentTarget.style.background = colBg(idx); }}
                >
                  {/* X close button */}
                  {!isMobile ? (
                    <div onClick={(e) => { e.stopPropagation(); removeItem(f.id); }} style={{
                      position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%',
                      background: '#f0ebe3', color: '#8a7e72', fontSize: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', zIndex: 2, transition: 'background 0.15s',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#ede8df'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#f0ebe3'; }}
                    >&times;</div>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); removeItem(f.id); }} style={{
                      position: 'absolute', top: 4, right: 4, padding: '2px 6px', borderRadius: 100,
                      border: '1px solid #e8e0d4', background: '#fff', color: '#8a7e72',
                      fontSize: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", zIndex: 2,
                    }}>&times;</button>
                  )}

                  {f.image_url && (
                    <div style={{
                      width: isMobile ? 44 : 80, height: isMobile ? 56 : 104,
                      margin: isMobile ? '0 auto 6px' : '0 auto 12px', borderRadius: isMobile ? 8 : 10,
                      overflow: 'hidden', background: '#fff', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      border: '1px solid #ede8df', flexShrink: 0,
                    }}>
                      <img src={f.image_url} alt={f.name}
                        style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }}
                        onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  )}
                  <div style={{
                    fontSize: isMobile ? 9 : 12, color: '#8a7e72', fontWeight: 600,
                    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 1,
                  }}>{f.brand}</div>
                  <div style={{
                    fontSize: isMobile ? 11 : 15, fontWeight: 600, color: '#1a1612',
                    lineHeight: 1.4, marginBottom: isMobile ? 6 : 14, padding: 0,
                    flex: 1, minHeight: isMobile ? 40 : 0,
                  }}>
                    {f.name}
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <ScoreRing score={f.quality_score} compact={isMobile} />
                  </div>
                  {!isMobile && <div style={{ fontSize: 10, color: '#c4b9a8', marginTop: 10, flexShrink: 0 }}>View details &rarr;</div>}
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
                    const val = Math.round((f[n.key] || 0) * 10) / 10;
                    return (
                      <div key={`${n.key}-${f.id}`} style={{
                        padding: isMobile ? '10px 10px' : '18px 20px',
                        borderLeft: '1px solid #f0ebe3',
                        borderBottom: isLast ? 'none' : '1px solid #f0ebe3',
                        background: colBg(idx),
                        display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 10,
                        justifyContent: isMobile ? 'center' : 'flex-start',
                      }}>
                        <div style={{
                          fontSize: isMobile ? 16 : 22, fontWeight: 700, color: '#1a1612',
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

              {/* ══ PRIMARY PROTEIN ROW ══ */}
              <div style={{
                ...labelCell(),
                borderBottom: '1px solid #f0ebe3',
                borderTop: '2px solid #ede8df',
              }}>Primary Protein</div>
              {items.map((f, idx) => (
                <div key={`pp-${f.id}`} style={{
                  padding: isMobile ? '10px 10px' : '18px 20px',
                  borderLeft: '1px solid #f0ebe3',
                  borderBottom: '1px solid #f0ebe3',
                  borderTop: '2px solid #ede8df',
                  background: colBg(idx),
                  display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                }}>
                  <span style={{ fontSize: isMobile ? 12 : 15, fontWeight: 600, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>
                    {f.primary_protein || '\u2014'}
                  </span>
                </div>
              ))}
              {hasAddSlot && <div style={{ borderLeft: '1px dashed #e8e0d4', borderTop: '2px solid #ede8df', borderBottom: '1px solid #f0ebe3' }} />}

              {/* ══ TOP 5 INGREDIENTS ══ */}
              {/* section header */}
              <div style={{
                gridColumn: `1 / -1`,
                background: '#faf8f4', borderTop: '2px solid #ede8df', borderBottom: '1px solid #ede8df',
                padding: isMobile ? '10px 10px' : '12px 24px',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif" }}>
                  Top 5 Ingredients
                </span>
              </div>

              {/* ingredient rows: 5 rows, no labels in left column */}
              {[0, 1, 2, 3, 4].map((rowIdx) => {
                const isLast = rowIdx === 4;
                const dotColors = { good: '#639922', neutral: '#8a7e72', caution: '#d4760a' };
                return [
                  /* empty left label cell to maintain grid alignment */
                  <div key={`ing-label-${rowIdx}`} style={{
                    borderBottom: isLast ? 'none' : '1px solid #f5f2ec',
                    background: !isMobile && rowIdx % 2 === 1 ? 'rgba(0,0,0,0.015)' : 'transparent',
                  }} />,
                  ...items.map((f, idx) => {
                    const first5 = getFirst5(f.ingredients);
                    const ing = first5[rowIdx] || null;
                    const signal = ing && !isMobile ? lookupSignal(ing) : null;
                    const stripe = !isMobile && rowIdx % 2 === 1 ? 'rgba(0,0,0,0.015)' : undefined;
                    return (
                      <div key={`ing-${f.id}-${rowIdx}`} style={{
                        padding: isMobile ? '8px 10px' : '10px 20px',
                        borderLeft: '1px solid #f0ebe3',
                        borderBottom: isLast ? 'none' : '1px solid #f5f2ec',
                        background: stripe || colBg(idx),
                        display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: 6,
                      }}>
                        {ing ? (<>
                          {signal && !isMobile && (
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColors[signal] || dotColors.neutral, flexShrink: 0 }} />
                          )}
                          <span style={{
                            fontSize: isMobile ? 10 : 13, fontWeight: rowIdx === 0 ? 700 : 500,
                            color: '#1a1612', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4, textAlign: isMobile ? 'center' : 'left',
                          }}>{ing.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                        </>) : (
                          <span style={{ fontSize: 12, color: '#b5aa99', fontStyle: 'italic' }}>&mdash;</span>
                        )}
                      </div>
                    );
                  }),
                  hasAddSlot && <div key={`ing-add-${rowIdx}`} style={{ borderLeft: '1px dashed #e8e0d4', borderBottom: isLast ? 'none' : '1px solid #f5f2ec' }} />,
                ];
              })}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#b5aa99', flexWrap: 'wrap' }}>
          <a href="/terms" style={{ color: '#b5aa99', textDecoration: 'none' }}>Terms</a>
          <a href="/privacy" style={{ color: '#b5aa99', textDecoration: 'none' }}>Privacy</a>
          <span>© 2026 GoodKibble. Not affiliated with any dog food brand.</span>
        </div>
      </div>
    </div>
  );
}
