'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import SearchBox from '../components/SearchBox';
import CompareBubble from '../components/CompareBubble';

/* ── same normalization helpers as SearchBox ── */
function getSearchVariants(query) {
  const q = query.trim();
  if (!q) return [];
  const variants = new Set();
  variants.add(q);
  const stripped = q.replace(/[''`]/g, '');
  variants.add(stripped);
  const withApostrophe = stripped.replace(/(\w)s\b/g, "$1's");
  variants.add(withApostrophe);
  const words = stripped.split(/\s+/);
  const firstWordApos = words.map((w, i) => {
    if (i === 0 && w.length > 2 && w.endsWith('s')) return w.slice(0, -1) + "'s";
    return w;
  }).join(' ');
  variants.add(firstWordApos);
  /* for long queries, extract key words */
  if (words.length >= 4) {
    const stopWords = new Set(['and', 'the', 'for', 'with', 'dry', 'dog', 'food', 'recipe', 'formula', 'adult', 'puppy', 'senior', 'natural', 'grain', 'free']);
    const significant = words.filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()));
    if (significant.length >= 2) {
      variants.add(significant.slice(0, 3).join(' '));
      variants.add(significant.slice(0, 2).join(' '));
    }
  }
  return [...variants].filter(v => v.length > 0);
}

function buildOrFilter(variants, columns) {
  const clauses = [];
  for (const col of columns) {
    for (const v of variants) {
      clauses.push(`${col}.ilike.%${v}%`);
    }
  }
  return clauses.join(',');
}

function Thumb({ src }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div style={{
        width: 56, height: 72, borderRadius: 10, background: '#f5f0e8',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0,
      }}>🐕</div>
    );
  }
  return (
    <div style={{
      width: 56, height: 72, borderRadius: 10, overflow: 'hidden', background: '#f5f0e8',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <img src={src} alt="" onError={() => setErr(true)}
        style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
    </div>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const goHome = () => router.push('/');
  const goFood = (id) => router.push(`/food/${id}`);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);

    async function search() {
      const variants = getSearchVariants(query);
      if (variants.length === 0) { setResults([]); setLoading(false); return; }

      /* brand matches first */
      const brandFilter = buildOrFilter(variants, ['brand']);
      const { data: brandMatches } = await supabase
        .from('dog_foods_v2')
        .select('id, name, brand, flavor, protein_dmb, fat_dmb, carbs_dmb, image_url')
        .or(brandFilter)
        .order('name')
        .limit(200);

      /* name/flavor matches */
      const nameFilter = buildOrFilter(variants, ['name', 'flavor']);
      const { data: nameMatches } = await supabase
        .from('dog_foods_v2')
        .select('id, name, brand, flavor, protein_dmb, fat_dmb, carbs_dmb, image_url')
        .or(nameFilter)
        .order('name')
        .limit(200);

      /* merge with brand priority */
      const seen = new Set();
      const merged = [];
      for (const item of (brandMatches || [])) {
        if (!seen.has(item.id)) { seen.add(item.id); merged.push(item); }
      }
      for (const item of (nameMatches || [])) {
        if (!seen.has(item.id)) { seen.add(item.id); merged.push(item); }
      }

      setResults(merged);
      setLoading(false);
    }

    search();
  }, [query]);

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5' }}>
      {/* nav */}
      <nav className="nav-bar" style={{
        padding: '16px 24px 16px 40px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: '1px solid #ede8df', background: '#faf8f5',
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

        <div style={{ animation: 'fadeUp 0.5s ease', marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 8 }}>Search results</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, color: '#1a1612',
            lineHeight: 1.1, marginBottom: 8, letterSpacing: -1,
          }}>&ldquo;{query}&rdquo;</h1>
          {!loading && (
            <p style={{ fontSize: 15, color: '#8a7e72' }}>
              {results.length} {results.length === 1 ? 'product' : 'products'} found
            </p>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #ede8df', borderTopColor: '#1a1612', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#8a7e72' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 17, marginBottom: 8 }}>No products found for &ldquo;{query}&rdquo;</p>
            <p style={{ fontSize: 14, color: '#b5aa99' }}>Try a different search term, brand name, or flavor.</p>
          </div>
        ) : (
          <div className="brand-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16,
          }}>
            {results.map((p, i) => (
              <div key={p.id} onClick={() => goFood(p.id)}
                style={{
                  background: '#fff', borderRadius: 20, padding: 24,
                  border: '1px solid #ede8df', cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  animationName: 'fadeUp', animationDuration: '0.4s',
                  animationFillMode: 'both', animationDelay: `${Math.min(i, 12) * 40}ms`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(26,22,18,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <Thumb src={p.image_url} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1612', marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>
                    {p.flavor && <div style={{ fontSize: 13, color: '#8a7e72', marginBottom: 12 }}>{p.flavor}</div>}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: '#e8f5ee', color: '#2d7a4f' }}>Protein {p.protein_dmb}%</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: '#fef3e2', color: '#c47a20' }}>Fat {p.fat_dmb}%</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: '#edf2f7', color: '#5a7a9e' }}>Carbs {p.carbs_dmb}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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

/* Wrap in Suspense because useSearchParams requires it in Next.js 14 */
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #ede8df', borderTopColor: '#1a1612', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
