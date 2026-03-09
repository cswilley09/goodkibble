'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

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
  const all = `${brand} ${name} ${flavor}`;
  const allTokens = tokenize(all);
  let score = 0;

  for (const qt of queryTokens) {
    const brandMatch = brand.startsWith(qt) ? 10 : brand.includes(qt) ? 6 : 0;
    if (brandMatch) { score += brandMatch; continue; }

    let bestToken = 0;
    for (const at of allTokens) {
      const m = fuzzyMatch(qt, at);
      if (m > bestToken) bestToken = m;
    }
    score += bestToken;
  }

  if (queryTokens.length > 0 && brand === queryTokens.join(' ')) score += 20;
  if (queryTokens.length > 0 && brand.startsWith(queryTokens.join(' '))) score += 15;

  return score;
}

function highlightText(text, query) {
  if (!query.trim() || !text) return text;
  const tokens = tokenize(query);
  let result = text;
  tokens.forEach(token => {
    const regex = new RegExp(`(${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    result = result.replace(regex, '|||$1|||');
  });
  const parts = result.split('|||');
  return parts.map((part, i) => {
    const isMatch = tokens.some(t => part.toLowerCase().startsWith(t.substring(0, Math.min(t.length, part.length))));
    if (isMatch && i % 2 === 1) {
      return <strong key={i} style={{ color: '#1a1612' }}>{part}</strong>;
    }
    return part;
  });
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
      const tokens = tokenize(val);
      if (tokens.length === 0) { setResults([]); setOpen(false); setLoading(false); return; }

      const queries = tokens.map(t => `name.ilike.%${t}%,brand.ilike.%${t}%,flavor.ilike.%${t}%`);
      const orClause = queries.join(',');

      const { data, count } = await supabase
        .from('dog_foods')
        .select('id, name, brand, flavor, protein, image_url', { count: 'exact' })
        .or(orClause)
        .limit(50);

      const scored = (data || []).map(f => ({ ...f, _score: scoreResult(f, tokens) }))
        .filter(f => f._score > 0)
        .sort((a, b) => b._score - a._score);

      setResults(scored.slice(0, 10));
      setTotalCount(scored.length);
      setOpen(true);
      setLoading(false);
    }, 250);
  }

  function handleSelect(food) {
    setText('');
    setResults([]);
    setOpen(false);
    onSelect(food.id);
  }

  function viewAll() {
    const q = text.trim();
    setText('');
    setResults([]);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
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
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) viewAll(); }}
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: isNav ? 14 : 17, padding: isNav ? '10px 8px' : '14px 12px',
            background: 'transparent', color: '#1a1612',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          }}
        />
        {!isNav && (
          <button onClick={() => { if (text.trim()) viewAll(); }}
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
          maxHeight: 480, overflowY: 'auto', animation: 'slideDown 0.15s ease',
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
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1612', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {highlightText(f.brand, text)}
                    </div>
                    <div style={{ fontSize: 13, color: '#8a7e72', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {highlightText(f.name, text)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: '#8a7e72',
                    background: '#f5f0e8', padding: '4px 10px', borderRadius: 100, whiteSpace: 'nowrap',
                  }}>{f.protein}% protein</div>
                </div>
              ))}
              {totalCount > 10 && (
                <div
                  onMouseDown={(e) => { e.preventDefault(); viewAll(); }}
                  style={{
                    padding: '14px 20px', cursor: 'pointer', textAlign: 'center',
                    fontSize: 14, fontWeight: 600, color: '#1a1612',
                    background: '#faf8f5', borderTop: '1px solid #ede8df',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f0e8')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#faf8f5')}
                >
                  View all {totalCount} results →
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
