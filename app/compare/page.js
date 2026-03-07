'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCompare } from '../components/CompareContext';
import CompareBubble from '../components/CompareBubble';
import SearchBox from '../components/SearchBox';
import { supabase } from '../../lib/supabase';

/* ── fixed nutrient colors (same as product page) ── */
const NC = {
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

/* ── inline search for the add slot ── */
function AddCardSearch({ onSelect }) {
  const [active, setActive] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => { if (active && inputRef.current) inputRef.current.focus(); }, [active]);

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
        borderLeft: '1px dashed #e8e0d4',
        textAlign: 'center', cursor: 'pointer', transition: 'all 0.25s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f0e8'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: '#ede8df',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, marginBottom: 10, color: '#8a7e72',
        }}>+</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#8a7e72', marginBottom: 2 }}>Add a food</div>
        <div style={{ fontSize: 12, color: '#b5aa99' }}>Click to search</div>
      </div>
    );
  }

  return (
    <div style={{
      borderLeft: '2px solid #f0c930', padding: 20,
      animation: 'scaleIn 0.2s ease', background: '#fff',
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
        placeholder="Brand or food name..."
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

/* ── main compare page ── */
export default function ComparePage() {
  const router = useRouter();
  const { items, addItem, removeItem, clearAll } = useCompare();
  const goHome = () => router.push('/');
  const goFood = (id) => router.push(`/food/${id}`);

  /* grid column definitions:
     - label column: fixed 80px
     - product columns: equal flex
     - add-slot column (if < 3 items): equal flex */
  const hasAddSlot = items.length < 3;
  const productCols = items.length;
  const totalDataCols = productCols + (hasAddSlot ? 1 : 0);

  /* card row uses same total columns but label col is blank */
  const cardGridCols = `80px repeat(${totalDataCols}, 1fr)`;
  const dataGridCols = `80px repeat(${totalDataCols}, 1fr)`;

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
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px 80px' }}>
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
            <div style={{ maxWidth: 340, margin: '0 auto', borderRadius: 20, border: '2px dashed #e8e0d4', overflow: 'hidden' }}>
              <AddCardSearch onSelect={addItem} />
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════════
             UNIFIED COMPARISON GRID
             label col | product cols | add slot
             All share the same column widths.
             ═══════════════════════════════════════════ */
          <div style={{
            background: '#faf8f5', borderRadius: 24, border: '1px solid #ede8df',
            overflow: 'hidden', animation: 'fadeUp 0.5s ease',
          }}>

            {/* ── row 1: product card headers ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: cardGridCols,
              borderBottom: '2px solid #ede8df',
            }}>
              {/* empty label column */}
              <div />

              {/* product cards */}
              {items.map((f, idx) => (
                <div key={f.id} style={{
                  padding: '28px 16px 22px',
                  textAlign: 'center',
                  borderLeft: '1px solid #ede8df',
                  cursor: 'pointer', transition: 'background 0.2s',
                  position: 'relative',
                }}
                  onClick={() => goFood(f.id)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f0e8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {f.image_url && (
                    <div style={{
                      width: 80, height: 104, margin: '0 auto 12px', borderRadius: 12,
                      overflow: 'hidden', background: '#fff', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      border: '1px solid #ede8df',
                    }}>
                      <img src={f.image_url} alt={f.name}
                        style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }}
                        onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#8a7e72', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 }}>{f.brand}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1612', lineHeight: 1.3, marginBottom: 12, minHeight: 34, padding: '0 2px' }}>
                    {f.name?.length > 45 ? f.name.substring(0, 45) + '...' : f.name}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeItem(f.id); }} style={{
                    padding: '5px 12px', borderRadius: 100, border: '1px solid #e8e0d4',
                    background: '#fff', color: '#8a7e72', fontSize: 11, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                    position: 'relative', zIndex: 2,
                  }}
                    onMouseEnter={(e) => { e.target.style.background = '#fce4e4'; e.target.style.color = '#c44'; e.target.style.borderColor = '#f0c4c4'; }}
                    onMouseLeave={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#8a7e72'; e.target.style.borderColor = '#e8e0d4'; }}
                  >Remove</button>
                  <div style={{ fontSize: 10, color: '#c4b9a8', marginTop: 8 }}>View details →</div>
                </div>
              ))}

              {/* add slot */}
              {hasAddSlot && (
                <AddCardSearch onSelect={addItem} />
              )}
            </div>

            {/* ── nutrient rows ── */}
            {NUTRIENTS.map((n, nIdx) => {
              const color = NC[n.key];
              return (
                <div key={n.key} style={{
                  display: 'grid',
                  gridTemplateColumns: dataGridCols,
                  alignItems: 'center',
                  borderBottom: nIdx < NUTRIENTS.length - 1 ? '1px solid #f0ebe3' : 'none',
                }}>
                  {/* ── left label column (once per row) ── */}
                  <div style={{
                    padding: '14px 12px 14px 20px',
                    fontSize: 13, fontWeight: 600, color: color,
                    letterSpacing: 0.3,
                    lineHeight: 1.2,
                  }}>
                    {n.label}
                  </div>

                  {/* ── product value cells ── */}
                  {items.map((f, idx) => {
                    const val = f[n.key] || 0;
                    const pct = Math.min((val / n.max) * 100, 100);
                    return (
                      <div key={f.id} style={{
                        padding: '14px 16px',
                        borderLeft: '1px solid #f0ebe3',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <div style={{
                          fontSize: 18, fontWeight: 700, color: '#1a1612',
                          fontFamily: "'DM Mono', monospace", lineHeight: 1,
                          minWidth: 44, flexShrink: 0,
                        }}>
                          {val}<span style={{ fontSize: 12, fontWeight: 500, color: '#8a7e72' }}>%</span>
                        </div>
                        <div style={{ flex: 1, height: 8, borderRadius: 100, background: '#ede8df', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 100, background: color,
                            width: `${pct}%`, transition: 'width 0.8s ease',
                          }} />
                        </div>
                      </div>
                    );
                  })}

                  {/* empty add-slot cell */}
                  {hasAddSlot && (
                    <div style={{ borderLeft: '1px dashed #e8e0d4' }} />
                  )}
                </div>
              );
            })}
          </div>
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
