'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBox({ onSelect, variant = 'hero', dark = false }) {
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
      try {
        const res = await fetch('/api/foods/search?q=' + encodeURIComponent(val) + '&limit=30');
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        const items = Array.isArray(data) ? data : [];
        setTotalCount(items.length);
        setResults(items.slice(0, 6));
        console.log('DROPDOWN OPEN, results:', items.length, 'showing:', Math.min(items.length, 6));
        setOpen(true);
      } catch (e) {
        setResults([]);
        setTotalCount(0);
      }
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
    <div ref={boxRef} className="searchbox-root" style={{ position: 'relative', width: '100%', maxWidth: isNav ? 380 : 560, boxSizing: 'border-box' }}>
      <div className="searchbox-bar" style={{
        display: 'flex', alignItems: 'center', width: '100%', boxSizing: 'border-box',
        background: isNav ? '#f0ebe3' : (dark ? 'rgba(255,255,255,0.08)' : '#fff'),
        borderRadius: isNav ? 14 : 20,
        padding: isNav ? '4px 4px 4px 16px' : '6px 6px 6px 24px',
        boxShadow: isNav || dark ? 'none' : '0 8px 40px rgba(26,22,18,0.12), 0 2px 8px rgba(26,22,18,0.06)',
        border: dark ? '1px solid rgba(255,255,255,0.1)' : 'none',
      }}>
        <svg width={isNav ? 16 : 20} height={isNav ? 16 : 20} viewBox="0 0 24 24" fill="none"
          stroke={isNav ? '#8a7e72' : (dark ? 'rgba(255,255,255,0.3)' : '#b5aa99')} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input type="text"
          placeholder={isNav ? 'Search another food...' : 'Search any dog food...'}
          value={text} onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          style={{
            flex: 1, border: 'none', outline: 'none', minWidth: 0,
            fontSize: isNav ? 14 : 17, padding: isNav ? '10px 8px' : '14px 12px',
            background: 'transparent', color: dark ? '#faf8f4' : '#1a1612',
            fontFamily: "'Inter', sans-serif", fontWeight: 500,
          }}
        />
        {!isNav && (
          <button className="searchbox-btn" onClick={handleSearchButton}
            style={{
              padding: '14px 28px', borderRadius: 14, border: 'none',
              background: dark ? '#2F6B48' : '#1a1612', color: '#fff', fontSize: 15,
              fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>Search</button>
        )}
      </div>
      <style>{`
        ${dark ? '.searchbox-bar input::placeholder { color: rgba(255,255,255,0.3) !important; }' : ''}
        @media (max-width: 768px) {
          .searchbox-root { max-width: 100% !important; }
          .searchbox-bar { max-width: 100% !important; padding-left: 16px !important; padding-right: 6px !important; }
          .searchbox-btn { padding: 12px 18px !important; }
        }
      `}</style>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: '#fff', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(26,22,18,0.15)', zIndex: 9999,
          maxHeight: 440, overflowY: 'auto',
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
