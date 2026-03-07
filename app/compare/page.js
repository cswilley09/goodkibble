'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCompare } from '../components/CompareContext';
import CompareBubble from '../components/CompareBubble';
import SearchBox from '../components/SearchBox';
import { supabase } from '../../lib/supabase';

/* ── fixed nutrient color map (matches single-product page) ── */
const NUTRIENT_COLORS = {
  protein: '#2d7a4f',
  fat: '#c47a20',
  carbohydrates: '#5a7a9e',
  fiber: '#8a6aaf',
};

const NUTRIENTS = [
  { label: 'Protein', key: 'protein', max: 50 },
  { label: 'Fat', key: 'fat', max: 30 },
  { label: 'Carbs', key: 'carbohydrates', max: 70 },
  { label: 'Fiber', key: 'fiber', max: 10 },
];

/* ── inline search for the "add" card ── */
function AddCardSearch({ onSelect }) {
  const [active, setActive] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (active && inputRef.current) inputRef.current.focus();
  }, [active]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      supabase
        .from('dog_foods')
        .select('id, name, brand, protein, fat, carbohydrates, fiber, moisture, image_url')
        .ilike('name', `%${query}%`)
        .limit(6)
        .then(({ data }) => setResults(data || []));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  if (!active) {
    return (
      <div onClick={() => setActive(true)} style={{
        background: '#faf8f5', borderRadius: 20, padding: 24,
        border: '2px dashed #e8e0d4', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: '#8a7e72', minHeight: 260, cursor: 'pointer',
        transition: 'all 0.25s',
      }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#c4b9a8'; e.currentTarget.style.background = '#f5f0e8'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8e0d4'; e.currentTarget.style.background = '#faf8f5'; }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: '#ede8df',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, marginBottom: 12, color: '#8a7e72',
        }}>+</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Add a food</div>
        <div style={{ fontSize: 13, color: '#b5aa99' }}>Click to search &amp; compare</div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: 20,
      border: '2px solid #f0c930', textAlign: 'left',
      minHeight: 260, position: 'relative',
      animation: 'scaleIn 0.2s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#8a7e72', letterSpacing: 1 }}>SEARCH</span>
        <button onClick={() => { setActive(false); setQuery(''); setResults([]); }} style={{
          background: 'none', border: 'none', color: '#b5aa99', fontSize: 18, cursor: 'pointer', padding: 0, lineHeight: 1,
        }}>✕</button>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type a brand or food name..."
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 12,
          border: '1.5px solid #ede8df', fontSize: 14,
          fontFamily: "'DM Sans', sans-serif", outline: 'none',
          background: '#faf8f5',
        }}
        onFocus={(e) => e.target.style.borderColor = '#f0c930'}
        onBlur={(e) => e.target.style.borderColor = '#ede8df'}
      />
      <div style={{ marginTop: 8, maxHeight: 160, overflowY: 'auto' }}>
        {results.map((r) => (
          <div key={r.id} onClick={() => { onSelect(r); setActive(false); setQuery(''); setResults([]); }}
            style={{
              padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
              fontSize: 13, color: '#1a1612', transition: 'background 0.15s',
              lineHeight: 1.4,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f0e8'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ fontWeight: 600 }}>{r.brand}</div>
            <div style={{ color: '#8a7e72', fontSize: 12 }}>{r.name?.length > 55 ? r.name.substring(0, 55) + '...' : r.name}</div>
          </div>
        ))}
        {query.length >= 2 && results.length === 0 && (
          <div style={{ padding: '16px 12px', fontSize: 13, color: '#b5aa99', textAlign: 'center' }}>No results found</div>
        )}
      </div>
    </div>
  );
}

/* ── nutrient comparison row ── */
function NutrientRow({ label, nutrientKey, values, maxVal }) {
  const color = NUTRIENT_COLORS[nutrientKey];
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `100px repeat(${values.length}, 1fr)`,
      gap: 0, alignItems: 'center',
      padding: '18px 0',
      borderBottom: '1px solid #f0ebe3',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#5a5047' }}>{label}</span>
      </div>
      {values.map((v, i) => {
        const pct = Math.min((v / maxVal) * 100, 100);
        return (
          <div key={i} style={{ padding: '0 10px' }}>
            <div style={{
              fontSize: 24, fontWeight: 700, color: '#1a1612',
              fontFamily: "'DM Mono', monospace", marginBottom: 6, lineHeight: 1,
            }}>
              {v}<span style={{ fontSize: 13, fontWeight: 500, color: '#8a7e72' }}>%</span>
            </div>
            <div style={{ height: 8, borderRadius: 100, background: '#ede8df', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 100, background: color,
                width: `${pct}%`, transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── main compare page ── */
export default function ComparePage() {
  const router = useRouter();
  const { items, addItem, removeItem, clearAll } = useCompare();
  const goHome = () => router.push('/');
  const goFood = (id) => router.push(`/food/${id}`);

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
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px' }}>
        <button onClick={goHome} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', color: '#8a7e72', fontSize: 14,
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          marginBottom: 32, padding: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to search
        </button>

        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3vw, 40px)',
              fontWeight: 800, color: '#1a1612', letterSpacing: -1,
            }}>Compare Foods</h1>
            <p style={{ fontSize: 15, color: '#8a7e72', marginTop: 4 }}>
              {items.length === 0
                ? 'Add products to start comparing'
                : items.length === 1
                  ? 'Comparing 1 product — add another to see side-by-side'
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
            textAlign: 'center', padding: '48px 24px',
            background: '#faf8f5', borderRadius: 24, border: '1px solid #ede8df',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚖️</div>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#1a1612', marginBottom: 8 }}>No products selected yet</p>
            <p style={{ fontSize: 14, color: '#8a7e72', maxWidth: 380, margin: '0 auto 24px' }}>
              Search for a dog food and click &ldquo;+ Add to Compare&rdquo; on any product page, or search below.
            </p>
            <div style={{ maxWidth: 360, margin: '0 auto' }}>
              <AddCardSearch onSelect={addItem} />
            </div>
          </div>
        ) : (
          <>
            {/* product cards row */}
            <div className="compare-grid" style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(items.length + (items.length < 3 ? 1 : 0), 3)}, 1fr)`,
              gap: 16, marginBottom: 4,
            }}>
              {items.map((f) => (
                <div key={f.id} style={{
                  background: '#faf8f5', borderRadius: 20, padding: 24,
                  border: '1px solid #ede8df',
                  textAlign: 'center', animation: 'fadeUp 0.4s ease both',
                  cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative',
                }}
                  onClick={() => goFood(f.id)}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,22,18,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {f.image_url && (
                    <div style={{
                      width: 100, height: 130, margin: '0 auto 14px', borderRadius: 12,
                      overflow: 'hidden', background: '#fff', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <img src={f.image_url} alt={f.name}
                        style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }}
                        onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#8a7e72', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>{f.brand}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', lineHeight: 1.3, marginBottom: 14, minHeight: 36 }}>
                    {f.name?.length > 50 ? f.name.substring(0, 50) + '...' : f.name}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeItem(f.id); }} style={{
                    padding: '6px 14px', borderRadius: 100, border: '1px solid #e8e0d4',
                    background: '#fff', color: '#8a7e72', fontSize: 12, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                    position: 'relative', zIndex: 2,
                  }}
                    onMouseEnter={(e) => { e.target.style.background = '#fce4e4'; e.target.style.color = '#c44'; e.target.style.borderColor = '#f0c4c4'; }}
                    onMouseLeave={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#8a7e72'; e.target.style.borderColor = '#e8e0d4'; }}
                  >Remove</button>
                  <div style={{
                    position: 'absolute', bottom: 8, right: 12,
                    fontSize: 11, color: '#c4b9a8', fontWeight: 500,
                  }}>View details →</div>
                </div>
              ))}
              {items.length < 3 && (
                <AddCardSearch onSelect={addItem} />
              )}
            </div>

            {/* comparison table — always shown, even with 1 product */}
            <div style={{
              background: '#faf8f5', borderRadius: 24, padding: '32px 28px',
              border: '1px solid #ede8df', marginTop: 28,
              animation: 'fadeUp 0.5s ease 0.15s both',
            }}>
              <div style={{
                fontSize: 12, fontWeight: 600, letterSpacing: 2.5,
                textTransform: 'uppercase', color: '#b5aa99', marginBottom: 20,
              }}>
                Nutritional Breakdown
              </div>

              {/* column headers */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `100px repeat(${items.length}, 1fr)`,
                gap: 0, paddingBottom: 12, borderBottom: '2px solid #ede8df',
              }}>
                <div style={{ fontSize: 11, color: '#b5aa99', fontWeight: 600, letterSpacing: 1, paddingRight: 12 }}>METRIC</div>
                {items.map((f) => (
                  <div key={f.id} style={{ padding: '0 10px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1612', lineHeight: 1.3 }}>
                      {f.brand}
                    </div>
                    <div style={{ fontSize: 11, color: '#8a7e72', lineHeight: 1.3, marginTop: 2 }}>
                      {f.name?.length > 30 ? f.name.substring(0, 30) + '...' : f.name}
                    </div>
                  </div>
                ))}
              </div>

              {/* nutrient rows */}
              {NUTRIENTS.map((n) => (
                <NutrientRow
                  key={n.key}
                  label={n.label}
                  nutrientKey={n.key}
                  values={items.map(f => f[n.key] || 0)}
                  maxVal={n.max}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* footer */}
      <div className="footer-bar" style={{
        borderTop: '1px solid #ede8df', padding: '32px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div className="footer-logo" style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: '#1a1612' }}>
          Good<span style={{ color: '#f0c930' }}>Kibble</span>
        </div>
        <div style={{ fontSize: 13, color: '#b5aa99' }}>© 2026 GoodKibble. Not affiliated with any dog food brand.</div>
      </div>
    </div>
  );
}
