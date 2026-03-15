'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

/* ── search normalization helpers ── */

/* generate search variants to handle apostrophes, hyphens, etc.
   e.g. "hills" → ["hills", "hill's"]
        "hill's" → ["hill's", "hills"]
        "stella chewys" → ["stella chewys", "stella chewy's"] */
function getSearchVariants(query) {
  const q = query.trim();
  if (!q) return [];

  const variants = new Set();
  variants.add(q);

  /* variant without any apostrophes/special chars */
  const stripped = q.replace(/[''`]/g, '');
  variants.add(stripped);

  /* variant with apostrophe before trailing 's' in each word
     "hills" → "hill's", "chewys" → "chewy's" */
  const withApostrophe = stripped.replace(/(\w)s\b/g, "$1's");
  variants.add(withApostrophe);

  /* also try adding apostrophe just before final 's' of the whole query
     handles "hills science" → "hill's science" */
  const words = stripped.split(/\s+/);
  const firstWordApos = words.map((w, i) => {
    if (i === 0 && w.length > 2 && w.endsWith('s')) {
      return w.slice(0, -1) + "'s";
    }
    return w;
  }).join(' ');
  variants.add(firstWordApos);

  return [...variants].filter(v => v.length > 0);
}

/* build Supabase OR filter string for a set of variants across given columns */
function buildOrFilter(variants, columns) {
  const clauses = [];
  for (const col of columns) {
    for (const v of variants) {
      clauses.push(`${col}.ilike.%${v}%`);
    }
  }
  return clauses.join(',');
}

export default function SearchBox({ onSelect, variant = 'hero' }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const debounceRef = useRef(null);
  const router = useRouter();
  const isNav = variant === 'nav';

  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    setText(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); setTotalCount(0); setOpen(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const variants = getSearchVariants(val);
      if (variants.length === 0) { setResults([]); setTotalCount(0); setLoading(false); return; }

      /* ── two-pass search: brand matches first, then name/flavor matches ── */

      /* pass 1: brand matches */
      const brandFilter = buildOrFilter(variants, ['brand']);
      const { data: brandMatches } = await supabase
        .from('dog_foods_v2')
        .select('id, name, brand, flavor, image_url')
        .or(brandFilter)
        .limit(20);

      /* pass 2: name/flavor matches (excluding already-found brand matches) */
      const nameFilter = buildOrFilter(variants, ['name', 'flavor']);
      const { data: nameMatches } = await supabase
        .from('dog_foods_v2')
        .select('id, name, brand, flavor, image_url')
        .or(nameFilter)
        .limit(20);

      /* merge: brand matches first, then name matches (deduped) */
      const seen = new Set();
      const merged = [];

      /* brand matches get priority */
      for (const item of (brandMatches || [])) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          merged.push({ ...item, _matchType: 'brand' });
        }
      }

      /* then name/flavor matches */
      for (const item of (nameMatches || [])) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          merged.push({ ...item, _matchType: 'name' });
        }
      }

      setTotalCount(merged.length);
      setResults(merged.slice(0, 6)); /* show top 6 in dropdown */
      setOpen(true);
      setLoading(false);
    }, 250);
  }

  function handleSelect(food) {
    setText('');
    setResults([]);
    setTotalCount(0);
    setOpen(false);
    onSelect(food.id);
  }

  function handleSeeAll() {
    const q = text.trim();
    setText('');
    setResults([]);
    setTotalCount(0);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function handleSearchButton() {
    if (text.trim()) {
      handleSeeAll();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && text.trim()) {
      handleSeeAll();
    }
  }

  return (
    <div ref={boxRef} style={{ position: 'relative', width: '100%', maxWidth: isNav ? 380 : 560 }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: isNav ? '#f0ebe3' : '#fff',
        borderRadius: isNav ? 14 : 20,
        padding: isNav ? '4px 4px 4px 16px' : '6px 6px 6px 24px',
        boxShadow: isNav ? 'none' : '0 8px 40px rgba(26,22,18,0.12), 0 2px 8px rgba(26,22,18,0.06)',
      }}>
        <svg width={isNav ? 16 : 20} height={isNav ? 16 : 20} viewBox="0 0 24 24" fill="none"
          stroke={isNav ? '#8a7e72' : '#b5aa99'} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input type="text"
          placeholder={isNav ? 'Search another food...' : 'Search any dog food...'}
          value={text} onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: isNav ? 14 : 17, padding: isNav ? '10px 8px' : '14px 12px',
            background: 'transparent', color: '#1a1612',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          }}
        />
        {!isNav && (
          <button onClick={handleSearchButton}
            style={{
              padding: '14px 28px', borderRadius: 14, border: 'none',
              background: '#1a1612', color: '#faf8f5', fontSize: 15,
              fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
            }}>Search</button>
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: '#fff', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(26,22,18,0.15)', zIndex: 100,
          maxHeight: 440, overflowY: 'auto', animation: 'slideDown 0.15s ease',
        }}>
          {loading && results.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#8a7e72', fontSize: 15 }}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#8a7e72', fontSize: 15 }}>No results found.</div>
          ) : (
            <>
              {results.map((f, i) => (
                <div key={f.id}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(f); }}
                  style={{
                    padding: '12px 20px', cursor: 'pointer',
                    borderBottom: '1px solid #f0ebe3',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#faf8f5')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Thumb src={f.image_url} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1612', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.brand}</div>
                    <div style={{ fontSize: 13, color: '#8a7e72', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  </div>
                </div>
              ))}
              {/* "See all results" link */}
              {totalCount > 6 && (
                <div
                  onMouseDown={(e) => { e.preventDefault(); handleSeeAll(); }}
                  style={{
                    padding: '14px 20px', cursor: 'pointer', textAlign: 'center',
                    fontSize: 14, fontWeight: 600, color: '#1a1612',
                    background: '#faf8f5', borderTop: '1px solid #f0ebe3',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f0ebe3')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#faf8f5')}
                >
                  See all {totalCount} results for &ldquo;{text.trim()}&rdquo; →
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Thumb({ src }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div style={{
        width: 40, height: 40, borderRadius: 8, background: '#f5f0e8',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
      }}>🐕</div>
    );
  }
  return <img src={src} alt="" onError={() => setErr(true)}
    style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain', background: '#f5f0e8', flexShrink: 0 }} />;
}
