'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

export default function SearchBox({ onSelect, variant = 'hero' }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const debounceRef = useRef(null);
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
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('dog_foods_v2')
        .select('id, name, brand, flavor, image_url')
        .or(`name.ilike.%${val.trim()}%,brand.ilike.%${val.trim()}%,flavor.ilike.%${val.trim()}%`)
        .limit(8);
      setResults(data || []);
      setOpen(true);
      setLoading(false);
    }, 300);
  }

  function handleSelect(food) {
    setText('');
    setResults([]);
    setOpen(false);
    onSelect(food.id);
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
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: isNav ? 14 : 17, padding: isNav ? '10px 8px' : '14px 12px',
            background: 'transparent', color: '#1a1612',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          }}
        />
        {!isNav && (
          <button onClick={() => { if (results.length > 0) handleSelect(results[0]); }}
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
          maxHeight: 400, overflowY: 'auto', animation: 'slideDown 0.15s ease',
        }}>
          {loading && results.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#8a7e72', fontSize: 15 }}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#8a7e72', fontSize: 15 }}>No results found.</div>
          ) : (
            results.map((f, i) => (
              <div key={f.id}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(f); }}
                style={{
                  padding: '12px 20px', cursor: 'pointer',
                  borderBottom: i < results.length - 1 ? '1px solid #f0ebe3' : 'none',
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
            ))
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
