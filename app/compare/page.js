'use client';
import { useRouter } from 'next/navigation';
import { useCompare } from '../components/CompareContext';
import CompareBubble from '../components/CompareBubble';
import SearchBox from '../components/SearchBox';
import { supabase } from '../../lib/supabase';

function BarCompare({ label, values, colors, maxVal }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#8a7e72', marginBottom: 8, letterSpacing: 1 }}>{label}</div>
      {values.map((v, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 40, fontSize: 14, fontWeight: 700, color: '#1a1612', fontFamily: "'DM Mono', monospace", textAlign: 'right' }}>{v}%</div>
          <div style={{ flex: 1, height: 14, borderRadius: 100, background: '#ede8df', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 100, background: colors[i], width: `${Math.min((v / maxVal) * 100, 100)}%`, transition: 'width 0.8s ease' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const { items, removeItem, clearAll } = useCompare();
  const goHome = () => router.push('/');
  const goFood = (id) => router.push(`/food/${id}`);

  const itemColors = ['#2d7a4f', '#c47a20', '#5a7a9e'];

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <nav className="nav-bar" style={{
        padding: '16px 24px 16px 40px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: '1px solid #ede8df', background: '#fff',
        position: 'sticky', top: 0, zIndex: 40, gap: 16,
      }}>
        <div onClick={goHome} style={{
          fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800,
          color: '#1a1612', cursor: 'pointer', flexShrink: 0,
        }}>Good<span style={{ color: '#f0c930' }}>Kibble</span></div>
        <div className="nav-search" style={{ flex: 1, maxWidth: 380 }}><SearchBox onSelect={goFood} variant="nav" /></div>
        <CompareBubble />
      </nav>

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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3vw, 40px)',
              fontWeight: 800, color: '#1a1612', letterSpacing: -1,
            }}>Compare Foods</h1>
            <p style={{ fontSize: 15, color: '#8a7e72', marginTop: 4 }}>
              {items.length === 0 ? 'Add products to compare' : `Comparing ${items.length} product${items.length > 1 ? 's' : ''}`}
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

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#b5aa99' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 17, marginBottom: 8 }}>No products selected yet</p>
            <p style={{ fontSize: 14 }}>Search for a dog food and click &ldquo;Add to Compare&rdquo; on any product page.</p>
          </div>
        ) : (
          <>
            <div className="compare-grid" style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${items.length}, 1fr)`,
              gap: 20, marginBottom: 40,
            }}>
              {items.map((f, idx) => (
                <div key={f.id} style={{
                  background: '#faf8f5', borderRadius: 20, padding: 24,
                  border: `2px solid ${itemColors[idx]}20`, textAlign: 'center',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: itemColors[idx],
                    margin: '0 auto 12px',
                  }} />
                  {f.image_url && (
                    <div style={{
                      width: 120, height: 160, margin: '0 auto 16px', borderRadius: 12,
                      overflow: 'hidden', background: '#fff', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <img src={f.image_url} alt={f.name}
                        style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }}
                        onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#8a7e72', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{f.brand}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', lineHeight: 1.3, marginBottom: 12 }}>
                    {f.name?.length > 50 ? f.name.substring(0, 50) + '...' : f.name}
                  </div>
                  <button onClick={() => removeItem(f.id)} style={{
                    padding: '6px 14px', borderRadius: 100, border: '1px solid #e8e0d4',
                    background: '#fff', color: '#8a7e72', fontSize: 12, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>Remove</button>
                </div>
              ))}
              {items.length < 3 && (
                <div style={{
                  background: '#faf8f5', borderRadius: 20, padding: 24,
                  border: '2px dashed #e8e0d4', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  color: '#b5aa99', minHeight: 200,
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>+</div>
                  <div style={{ fontSize: 14 }}>Search to add<br />another food</div>
                </div>
              )}
            </div>

            {items.length > 1 && (
              <div style={{
                background: '#faf8f5', borderRadius: 24, padding: '36px 32px',
                border: '1px solid #ede8df',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2.5, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 8 }}>
                  Nutritional Comparison
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
                  {items.map((f, idx) => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#5a5047' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: itemColors[idx], display: 'inline-block' }} />
                      {f.brand}
                    </div>
                  ))}
                </div>
                <BarCompare label="PROTEIN" values={items.map(f => f.protein || 0)} colors={items.map((_, i) => itemColors[i])} maxVal={50} />
                <BarCompare label="FAT" values={items.map(f => f.fat || 0)} colors={items.map((_, i) => itemColors[i])} maxVal={30} />
                <BarCompare label="CARBOHYDRATES" values={items.map(f => f.carbohydrates || 0)} colors={items.map((_, i) => itemColors[i])} maxVal={70} />
                <BarCompare label="FIBER" values={items.map(f => f.fiber || 0)} colors={items.map((_, i) => itemColors[i])} maxVal={10} />
              </div>
            )}
          </>
        )}
      </div>

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
