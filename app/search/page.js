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

/* ── score tier helpers (same as discover page) ── */
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

/* ── product card (same as discover page) ── */
function ProductCard({ food, onClick }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #ede8df',
      cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex', gap: 14, alignItems: 'center',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,22,18,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {food.image_url && !imgErr ? (
        <div style={{ width: 56, aspectRatio: '4/5', overflow: 'hidden', background: '#ffffff', flexShrink: 0 }}>
          <img src={food.image_url} alt="" onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        </div>
      ) : (
        <div style={{ width: 56, aspectRatio: '4/5', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🐕</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: '#8a7e72', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{food.brand}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', lineHeight: 1.3, marginBottom: 6,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{food.name}</div>
        {(food.flavor || food.primary_protein) && (
          <div style={{ marginBottom: 6 }}>
            {food.flavor && (
              <div style={{ fontSize: 12, color: '#8a7e72', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 600, color: '#6b6157' }}>Flavor:</span> {food.flavor}
              </div>
            )}
            {food.primary_protein && (
              <div style={{ fontSize: 12, color: '#8a7e72', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 600, color: '#6b6157' }}>Primary Protein:</span> {food.primary_protein}
              </div>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#e8f5ee', color: '#2d7a4f' }}>Protein {(Math.round(food.protein_dmb * 10) / 10)}%</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#fef3e2', color: '#c47a20' }}>Fat {(Math.round(food.fat_dmb * 10) / 10)}%</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#edf2f7', color: '#5a7a9e' }}>Carbs {(Math.round(food.carbs_dmb * 10) / 10)}%</span>
          {food.fiber_dmb != null && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#f0edf7', color: '#8a6aaf' }}>Fiber {(Math.round(food.fiber_dmb * 10) / 10)}%</span>
          )}
        </div>
      </div>
      <ScoreRing score={food.quality_score} />
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
  const goFood = (food) => {
    if (food?.brand_slug && food?.slug) router.push(`/dog-food/${food.brand_slug}/${food.slug}`);
    else router.push(`/food/${food?.id || food}`);
  };

  useEffect(() => {
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);

    async function search() {
      const variants = getSearchVariants(query);
      if (variants.length === 0) { setResults([]); setLoading(false); return; }

      const selectCols = 'id, name, brand, flavor, protein_dmb, fat_dmb, carbs_dmb, fiber_dmb, primary_protein, image_url, quality_score, slug, brand_slug';

      /* pass 1: brand matches */
      const brandFilter = buildOrFilter(variants, ['brand']);
      const { data: brandMatches } = await supabase
        .from('dog_foods_v2')
        .select(selectCols)
        .or(brandFilter)
        .limit(200);

      /* pass 2: name/flavor matches */
      const nameFilter = buildOrFilter(variants, ['name', 'flavor']);
      const { data: nameMatches } = await supabase
        .from('dog_foods_v2')
        .select(selectCols)
        .or(nameFilter)
        .limit(200);

      /* pass 3: individual word search across all columns */
      let wordMatches = [];
      const queryWords = query.toLowerCase().replace(/[''`]/g, '').split(/\s+/).filter(w => w.length > 2);
      if (queryWords.length >= 2) {
        const stopWords = new Set(['and', 'the', 'for', 'with', 'dry', 'dog', 'food', 'recipe', 'formula', 'adult', 'puppy', 'senior', 'natural', 'grain', 'free']);
        const meaningful = queryWords.filter(w => !stopWords.has(w));
        if (meaningful.length >= 1) {
          const bestWord = meaningful.sort((a, b) => b.length - a.length)[0];
          const wordFilter = buildOrFilter([bestWord], ['name', 'brand', 'flavor']);
          const { data } = await supabase
            .from('dog_foods_v2')
            .select(selectCols)
            .or(wordFilter)
            .limit(200);
          wordMatches = data || [];
        }
      }

      /* merge and dedupe */
      const seen = new Set();
      const merged = [];
      for (const item of (brandMatches || [])) {
        if (!seen.has(item.id)) { seen.add(item.id); merged.push(item); }
      }
      for (const item of (nameMatches || [])) {
        if (!seen.has(item.id)) { seen.add(item.id); merged.push(item); }
      }
      for (const item of wordMatches) {
        if (!seen.has(item.id)) { seen.add(item.id); merged.push(item); }
      }

      /* relevance sort */
      const allWords = query.toLowerCase().replace(/[''`]/g, '').split(/\s+/).filter(w => w.length > 1);
      function relevanceScore(item) {
        const text = `${item.brand} ${item.name} ${item.flavor || ''}`.toLowerCase();
        let score = 0;
        for (const word of allWords) {
          if (text.includes(word)) score += 1;
        }
        /* bonus for exact phrase match in name */
        const strippedQuery = query.toLowerCase().replace(/[''`]/g, '').trim();
        if (item.name.toLowerCase().includes(strippedQuery)) score += 10;
        /* bonus for brand+name combo match */
        const combined = `${item.brand} ${item.name}`.toLowerCase();
        if (combined.includes(strippedQuery)) score += 10;
        /* bonus for brand match */
        if (allWords[0] && item.brand.toLowerCase().includes(allWords[0])) score += 3;
        return score;
      }
      merged.sort((a, b) => relevanceScore(b) - relevanceScore(a));

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
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 80px' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {results.map((p) => (
              <ProductCard key={p.id} food={p} onClick={() => goFood(p)} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#b5aa99', flexWrap: 'wrap' }}>
          <a href="/terms" style={{ color: '#b5aa99', textDecoration: 'none' }}>Terms</a>
          <a href="/privacy" style={{ color: '#b5aa99', textDecoration: 'none' }}>Privacy</a>
          <span>© 2026 GoodKibble. Not affiliated with any dog food brand.</span>
        </div>
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
