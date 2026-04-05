'use client';
import { useState } from 'react';

const ADMIN_PASSWORD = 'gk_admin_2026';

export default function AddProductPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf8f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 360, width: '100%', padding: 24, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: '#1a1612', marginBottom: 24 }}>
            Good<span style={{ color: '#C9A84C' }}>Kibble</span> Admin
          </div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && password === ADMIN_PASSWORD) setAuthed(true); }}
            placeholder="Admin password"
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #ede8df',
              fontSize: 15, background: '#fff', outline: 'none', boxSizing: 'border-box',
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <button onClick={() => { if (password === ADMIN_PASSWORD) setAuthed(true); else setError('Wrong password'); }}
            style={{
              width: '100%', padding: 12, borderRadius: 100, marginTop: 12,
              background: '#1a1612', color: '#faf8f4', fontSize: 15, fontWeight: 700,
              border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>Enter</button>
          {error && <p style={{ color: '#b5483a', fontSize: 13, marginTop: 8 }}>{error}</p>}
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      setStatus('Scraping product page...');
      await new Promise(r => setTimeout(r, 500));
      setStatus('Extracting data with AI...');

      const res = await fetch('/api/admin/scrape-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer gk_admin_2026',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      setStatus('Calculating score...');
      const data = await res.json();

      if (data.success) {
        setResult(data);
        setUrl('');
      } else {
        setError(data.error || 'Failed to process product');
        if (data.product) setResult(data); // show partial data
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
    setStatus('');
  }

  const p = result?.product;
  const s = result?.score;

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: '#1a1612', marginBottom: 4 }}>
          Add Product
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8a7e72', marginBottom: 28 }}>
          Paste a product page URL. We&rsquo;ll scrape it, extract nutrition data with AI, and calculate the GoodKibble score.
        </p>

        <form onSubmit={handleSubmit} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://www.chewy.com/product/..."
              disabled={loading}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 12, border: '1.5px solid #ede8df',
                fontSize: 14, background: '#fff', outline: 'none',
                fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.5 : 1,
              }}
            />
            <button type="submit" disabled={loading || !url.trim()} style={{
              padding: '12px 28px', borderRadius: 100, border: 'none',
              background: loading ? '#ede8df' : '#1a1612', color: loading ? '#b5aa99' : '#faf8f4',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
            }}>{loading ? 'Processing...' : 'Scrape & Score'}</button>
          </div>
        </form>

        {/* Status */}
        {status && (
          <div style={{
            padding: '14px 20px', borderRadius: 12, background: '#fff', border: '1px solid #ede8df',
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#5a5248',
          }}>
            <div style={{ width: 16, height: 16, border: '2px solid #ede8df', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            {status}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '14px 20px', borderRadius: 12, background: '#fce4e4', border: '1px solid #e8c4c4',
            marginBottom: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#b5483a',
          }}>{error}</div>
        )}

        {/* Success */}
        {result?.success && (
          <div style={{
            padding: '14px 20px', borderRadius: 12, background: '#e6f4e0', border: '1px solid #c4e0ba',
            marginBottom: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#2d7a4f', fontWeight: 600,
          }}>{'\u2713'} Product Added Successfully</div>
        )}

        {/* Result Card */}
        {p && (
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #ede8df', overflow: 'hidden' }}>
            {/* Header with image */}
            <div style={{ display: 'flex', gap: 20, padding: 24, borderBottom: '1px solid #f5f2ec' }}>
              {p.image_url && (
                <div style={{ width: 80, height: 100, borderRadius: 10, overflow: 'hidden', background: '#f5f2ec', flexShrink: 0 }}>
                  <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a7e72', marginBottom: 2 }}>{p.brand}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1612', lineHeight: 1.3, fontFamily: "'DM Sans', sans-serif" }}>{p.name}</div>
                {p.primary_protein && <div style={{ fontSize: 13, color: '#8a7e72', marginTop: 4 }}>Primary Protein: {p.primary_protein}</div>}
              </div>
            </div>

            {/* Score */}
            <div style={{ padding: 24, borderBottom: '1px solid #f5f2ec', textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#1a1612', fontFamily: "'Playfair Display', serif" }}>{p.quality_score}</div>
              <div style={{
                display: 'inline-block', padding: '4px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                background: p.quality_score >= 70 ? '#e6f4e0' : p.quality_score >= 50 ? '#fff0dc' : '#fce4e4',
                color: p.quality_score >= 70 ? '#2d7a4f' : p.quality_score >= 50 ? '#c47a20' : '#b5483a',
                fontFamily: "'DM Sans', sans-serif", marginTop: 4,
              }}>{s?.label || 'Scored'}</div>
            </div>

            {/* Guaranteed Analysis */}
            <div style={{ padding: 24, borderBottom: '1px solid #f5f2ec' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>Guaranteed Analysis</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {[
                  { label: 'Protein', value: p.protein_dmb, unit: '% DMB' },
                  { label: 'Fat', value: p.fat_dmb, unit: '% DMB' },
                  { label: 'Fiber', value: p.fiber_dmb, unit: '% DMB' },
                  { label: 'Carbs', value: p.carbs_dmb, unit: '% DMB' },
                  { label: 'Moisture', value: p.moisture, unit: '%' },
                ].map(n => (
                  <div key={n.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>{n.value != null ? Math.round(n.value * 10) / 10 : '—'}</div>
                    <div style={{ fontSize: 10, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>{n.label} {n.unit}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown */}
            {s?.categories && (
              <div style={{ padding: 24, borderBottom: '1px solid #f5f2ec' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>Score Breakdown</div>
                {Object.entries(s.categories).map(([key, cat]) => {
                  const pct = (cat.score / cat.max) * 100;
                  return (
                    <div key={key} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 13, color: '#3d352b', fontFamily: "'DM Sans', sans-serif" }}>{key.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>{cat.score}/{cat.max}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: '#ede8df' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: pct >= 70 ? '#639922' : pct >= 40 ? '#EF9F27' : '#b5483a', width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ingredients */}
            {p.ingredients && (
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Ingredients</div>
                <div style={{ fontSize: 13, color: '#5a5248', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{p.ingredients}</div>
              </div>
            )}

            {/* Links */}
            <div style={{ padding: '16px 24px', background: '#faf8f5', display: 'flex', gap: 16 }}>
              {p.slug && p.brand_slug && (
                <a href={`/dog-food/${p.brand_slug}/${p.slug}`} style={{
                  fontSize: 13, fontWeight: 600, color: '#C9A84C', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif",
                }}>View on Site &rarr;</a>
              )}
              <a href={p.url || url} target="_blank" rel="noopener" style={{
                fontSize: 13, fontWeight: 600, color: '#8a7e72', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif",
              }}>Original Page &rarr;</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
