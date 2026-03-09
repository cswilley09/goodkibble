'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import SearchBox from '../components/SearchBox';
import CompareBubble from '../components/CompareBubble';

function normalize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(str) {
  return normalize(str).split(' ').filter(Boolean);
}

function fuzzyMatch(token, target) {
  if (target.startsWith(token)) return 2;
  if (target.includes(token)) return 1;
  if (token.length >= 3 && target.length >= 3) {
    let edits = 0;
    const short = token.length < target.length ? token : target;
    const long = token.length < target.length ? target : token;
    if (Math.abs(short.length - long.length) > 2) return 0;
    for (let i = 0; i < short.length; i++) {
      if (short[i] !== long[i]) edits++;
      if (edits > 2) return 0;
    }
    return edits <= 1 ? 0.5 : 0;
  }
  return 0;
}

function scoreResult(food, queryTokens) {
  const brand = normalize(food.brand || '');
  const name = normalize(food.name || '');
  const flavor = normalize(food.flavor || '');
  const allTokens = tokenize(`${brand} ${name} ${flavor}`);
  let score = 0;
  for (const qt of queryTokens) {
    const brandMatch = brand.startsWith(qt) ? 10 : brand.includes(qt) ? 6 : 0;
    if (brandMatch) { score += brandMatch; continue; }
    let best = 0;
    for (const at of allTokens) { const m = fuzzyMatch(qt, at); if (m > best) best = m; }
    score += best;
  }
  if (queryTokens.length > 0 && brand === queryTokens.join(' ')) score += 20;
  return score;
}

function highlightText(text, query) {
  if (!query || !text) return text;
  const tokens = tokenize(query);
  let parts = [text];
  tokens.forEach(token => {
    const newParts = [];
    parts.forEach(part => {
      if (typeof part !== 'string') { newParts.push(part); return; }
      const regex = new RegExp(`(${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const split = part.split(regex);
      split.forEach((s, i) => {
        if (i % 2 === 1) newParts.push(<strong key={Math.random()} style={{ color: '#1a1612', background: '#f0c93040', padding: '0 2px', borderRadius: 2 }}>{s}</strong>);
        else if (s) newParts.push(s);
      });
    });
    parts = newParts;
  });
  return parts;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const tokens = tokenize(query);
    const queries = tokens.map(t => `name.ilike.%${t}%,brand.ilike.%${t}%,flavor.ilike.%${t}%`);
    supabase
      .from('dog_foods')
      .select('id, name, brand, flavor, protein, fat, carbohydrates, image_url')
      .or(queries.join(','))
      .limit(200)
      .then(({ data }) => {
        const scored = (data || []).map(f => ({ ...f, _score: scoreResult(f, tokens) }))
          .filter(f => f._score > 0)
          .sort((a, b) => b._score - a._score);
        setResults(scored);
        setLoading(false);
      });
  }, [query]);

  const goFood = (id) => router.push(`/food/${id}`);
  const goHome = () => router.push('/');

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="nav-search"><SearchBox onSelect={goFood} variant="nav" /></div>
          <CompareBubble />
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
        <button onClick={goHome} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', color: '#8a7e72', fontSize: 14,
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          marginBottom: 24, padding: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to search
        </button>

        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3.5vw, 40px)',
          fontWeight: 800, color: '#1a1612', marginBottom: 8, letterSpacing: -1,
        }}>
          Search results for &ldquo;{query}&rdquo;
        </h1>
        <p style={{ fontSize: 15, color: '#8a7e72', marginBottom: 32 }}>
          {loading ? 'Searching...' : `${results.length} product${results.length !== 1 ? 's' : ''} found`}
        </p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #ede8df', borderTopColor: '#1a1612', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: '60px 32px', borderRadius: 24, border: '2px dashed #e8e0d4', textAlign: 'center', color: '#b5aa99' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>No products found</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>Try a different search term</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map((f, i) => (
              <div key={f.id} onClick={() => goFood(f.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 20px', borderRadius: 16,
                  background: '#faf8f5', border: '1px solid #ede8df',
                  cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
                  animationName: 'fadeUp', animationDuration: '0.3s',
                  animationFillMode: 'both', animationDelay: `${Math.min(i * 30, 300)}ms`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,22,18,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <ResultThumb src={f.image_url} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#b5aa99', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
                    {highlightText(f.brand, query)}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1612', lineHeight: 1.3 }}>
                    {highlightText(f.name, query)}
                  </div>
                  {f.flavor && <div style={{ fontSize: 13, color: '#8a7e72', marginTop: 2 }}>{f.flavor}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: '#e8f5ee', color: '#2d7a4f' }}>{f.protein}%P</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: '#fef3e2', color: '#c47a20' }}>{f.fat}%F</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: '#edf2f7', color: '#5a7a9e' }}>{f.carbohydrates}%C</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="footer-bar" style={{
        borderTop: '1px solid #ede8df', padding: '32px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: '#1a1612' }}>
          Good<span style={{ color: '#f0c930' }}>Kibble</span>
        </div>
        <div style={{ fontSize: 13, color: '#b5aa99' }}>© 2026 GoodKibble. Not affiliated with any dog food brand.</div>
      </div>
    </div>
  );
}

function ResultThumb({ src }) {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <div style={{ width: 56, height: 70, borderRadius: 10, background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🐕</div>
  );
  return (
    <div style={{ width: 56, height: 70, borderRadius: 10, overflow: 'hidden', background: '#fff', border: '1px solid #ede8df', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img src={src} alt="" onError={() => setErr(true)} style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: 'center' }}>Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}
