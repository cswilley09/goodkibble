'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import SearchBox from '../../components/SearchBox';
import CompareBubble from '../../components/CompareBubble';

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
function ScoreRing({ score }) {
  if (score == null) return null;
  const color = getScoreColor(score);
  const circumference = 106.8;
  const offset = circumference * (1 - score / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>
      <svg width={42} height={42} viewBox="0 0 42 42">
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

export default function BrandPage() {
  const params = useParams();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const brandName = decodeURIComponent(params.name);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('dog_foods_v2')
      .select('id, name, brand, flavor, protein_dmb, fat_dmb, carbs_dmb, fiber_dmb, primary_protein, image_url, quality_score')
      .eq('brand', brandName)
      .order('name')
      .then(({ data }) => { setProducts(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [brandName]);

  const goHome = () => router.push('/');
  const goFood = (id) => router.push(`/food/${id}`);

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5' }}>
      <nav className="nav-bar" style={{
        padding: '16px 24px 16px 40px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: '1px solid #ede8df', background: '#faf8f5',
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

        <div style={{ animation: 'fadeUp 0.5s ease' }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 8 }}>Brand</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: '#1a1612',
            lineHeight: 1.1, marginBottom: 8, letterSpacing: -1,
          }}>{brandName}</h1>
          <p style={{ fontSize: 15, color: '#8a7e72', marginBottom: 40 }}>
            {products.length} products in our database
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #ede8df', borderTopColor: '#1a1612', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div className="brand-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12,
          }}>
            {products.map((p, i) => (
              <div key={p.id} onClick={() => goFood(p.id)}
                style={{
                  background: '#fff', borderRadius: 16, padding: 16,
                  border: '1px solid #ede8df', cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'flex', gap: 14, alignItems: 'center',
                  animationName: 'fadeUp', animationDuration: '0.4s',
                  animationFillMode: 'both', animationDelay: `${i * 40}ms`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,22,18,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <ProductThumb src={p.image_url} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#8a7e72', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{p.brand}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', lineHeight: 1.3, marginBottom: 6,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{p.name}</div>
                  {(p.flavor || p.primary_protein) && (
                    <div style={{ marginBottom: 6 }}>
                      {p.flavor && (
                        <div style={{ fontSize: 12, color: '#8a7e72', lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 600, color: '#6b6157' }}>Flavor:</span> {p.flavor}
                        </div>
                      )}
                      {p.primary_protein && (
                        <div style={{ fontSize: 12, color: '#8a7e72', lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 600, color: '#6b6157' }}>Primary Protein:</span> {p.primary_protein}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#e8f5ee', color: '#2d7a4f' }}>Protein {p.protein_dmb}%</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#fef3e2', color: '#c47a20' }}>Fat {p.fat_dmb}%</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#edf2f7', color: '#5a7a9e' }}>Carbs {p.carbs_dmb}%</span>
                    {p.fiber_dmb != null && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#f0edf7', color: '#8a6aaf' }}>Fiber {p.fiber_dmb}%</span>
                    )}
                  </div>
                </div>
                <ScoreRing score={p.quality_score} />
              </div>
            ))}
          </div>
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

function ProductThumb({ src }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div style={{ width: 56, height: 72, borderRadius: 10, background: '#f5f0e8',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🐕</div>
    );
  }
  return (
    <div style={{ width: 56, height: 72, borderRadius: 10, overflow: 'hidden', background: '#f5f0e8',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img src={src} alt="" onError={() => setErr(true)}
        style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
    </div>
  );
}
