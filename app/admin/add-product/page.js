'use client';
import { useState, useRef } from 'react';

const ADMIN_PASSWORD = 'gk_admin_2026';
const ADMIN_SECRET = 'gk_admin_2026';

const STATUS_MESSAGES = [
  'Fetching product page...',
  'AI is reading the label...',
  'Calculating nutrition scores...',
  'Almost done...',
];

export default function AddProductPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState('url');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const intervalRef = useRef(null);

  // Password gate
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
            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #ede8df', fontSize: 15, background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" }}
          />
          <button onClick={() => { if (password === ADMIN_PASSWORD) setAuthed(true); else setError('Wrong password'); }}
            style={{ width: '100%', padding: 12, borderRadius: 100, marginTop: 12, background: '#1a1612', color: '#faf8f4', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Enter</button>
          {error && <p style={{ color: '#b5483a', fontSize: 13, marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>}
        </div>
      </div>
    );
  }

  function startLoading() {
    setLoading(true);
    setError('');
    setResult(null);
    setStatusIdx(0);
    intervalRef.current = setInterval(() => {
      setStatusIdx(prev => Math.min(prev + 1, STATUS_MESSAGES.length - 1));
    }, 3000);
  }

  function stopLoading() {
    setLoading(false);
    clearInterval(intervalRef.current);
  }

  async function submitURL(e) {
    e.preventDefault();
    if (!url.trim()) return;
    startLoading();
    try {
      const res = await fetch('/api/admin/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), admin_secret: ADMIN_SECRET, mode: 'url' }),
      });
      const data = await res.json();
      if (data.success) { setResult(data); setUrl(''); }
      else setError(data.error || 'Failed to process');
    } catch (err) { setError(err.message); }
    stopLoading();
  }

  async function submitFile(file) {
    if (!file) return;
    startLoading();
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const isPdf = file.type === 'application/pdf';
      const body = {
        admin_secret: ADMIN_SECRET,
        mode: isPdf ? 'pdf' : 'image',
        ...(isPdf ? { pdf_base64: base64 } : { image_base64: base64, image_type: file.type }),
      };

      const res = await fetch('/api/admin/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) setResult(data);
      else setError(data.error || 'Failed to process');
    } catch (err) { setError(err.message); }
    stopLoading();
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) submitFile(file);
  }

  function reset() {
    setResult(null);
    setError('');
    setUrl('');
  }

  const p = result?.product;
  const s = result?.score;
  const tabs = [
    { key: 'url', label: 'Paste URL' },
    { key: 'image', label: 'Upload Screenshot' },
    { key: 'pdf', label: 'Upload PDF' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: '#1a1612', marginBottom: 4 }}>Add Product</div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8a7e72', marginBottom: 28 }}>
          Scrape a product page, upload a screenshot, or upload a PDF. AI extracts the data and we calculate the GoodKibble score.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #ede8df', marginBottom: 24 }}>
          {tabs.map(t => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => { setTab(t.key); reset(); }} style={{
                flex: 1, padding: '12px 0', background: 'none', border: 'none',
                borderBottom: active ? '2px solid #C9A84C' : '2px solid transparent',
                color: active ? '#1a1612' : '#b5aa99', fontSize: 14, fontWeight: active ? 600 : 500,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
              }}>{t.label}</button>
            );
          })}
        </div>

        {/* Tab: URL */}
        {tab === 'url' && !result && (
          <form onSubmit={submitURL}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="url" value={url} onChange={e => setUrl(e.target.value)} disabled={loading}
                placeholder="https://www.chewy.com/product/..."
                style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1.5px solid #ede8df', fontSize: 14, background: '#fff', outline: 'none', fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.5 : 1 }}
              />
              <button type="submit" disabled={loading || !url.trim()} style={{
                padding: '12px 28px', borderRadius: 100, border: 'none',
                background: loading ? '#ede8df' : '#1a1612', color: loading ? '#b5aa99' : '#faf8f4',
                fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
              }}>Scrape &amp; Score</button>
            </div>
          </form>
        )}

        {/* Tab: Image */}
        {tab === 'image' && !result && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !loading && fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#C9A84C' : '#ede8df'}`,
              borderRadius: 16, padding: '48px 24px', textAlign: 'center',
              background: dragOver ? '#faf5e8' : '#fff', cursor: loading ? 'default' : 'pointer',
              transition: 'all 0.2s', opacity: loading ? 0.5 : 1,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>{'\u{1F4F7}'}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1612', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
              Drop an image here or click to browse
            </div>
            <div style={{ fontSize: 13, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", maxWidth: 400, margin: '0 auto' }}>
              Take a screenshot of the product page showing the Guaranteed Analysis and ingredient list, or photograph the bag
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => submitFile(e.target.files?.[0])} />
          </div>
        )}

        {/* Tab: PDF */}
        {tab === 'pdf' && !result && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !loading && fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#C9A84C' : '#ede8df'}`,
              borderRadius: 16, padding: '48px 24px', textAlign: 'center',
              background: dragOver ? '#faf5e8' : '#fff', cursor: loading ? 'default' : 'pointer',
              transition: 'all 0.2s', opacity: loading ? 0.5 : 1,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>{'\u{1F4C4}'}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1612', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
              Drop a PDF here or click to browse
            </div>
            <div style={{ fontSize: 13, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>
              Upload the product spec sheet or nutritional PDF
            </div>
            <input ref={fileRef} type="file" accept=".pdf" hidden onChange={e => submitFile(e.target.files?.[0])} />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{
            padding: '16px 20px', borderRadius: 12, background: '#fff', border: '1px solid #ede8df',
            marginTop: 20, display: 'flex', alignItems: 'center', gap: 12,
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#5a5248',
          }}>
            <div style={{ width: 18, height: 18, border: '2.5px solid #ede8df', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            {STATUS_MESSAGES[statusIdx]}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '14px 20px', borderRadius: 12, background: '#fce4e4', border: '1px solid #e8c4c4',
            marginTop: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#b5483a',
          }}>
            {error}
            {(error.includes('403') || error.includes('blocked') || error.includes('Firecrawl')) && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#8a7e72' }}>
                Tip: This site may block scrapers. Try the <strong>Screenshot</strong> or <strong>PDF</strong> tab instead.
              </div>
            )}
          </div>
        )}

        {/* Success banner */}
        {result?.success && (
          <div style={{
            padding: '14px 20px', borderRadius: 12, background: '#e6f4e0', border: '1px solid #c4e0ba',
            marginTop: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#2d7a4f', fontWeight: 600,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{'\u2713'} Product added to GoodKibble!</span>
            <button onClick={reset} style={{
              padding: '6px 16px', borderRadius: 100, border: '1.5px solid #c4e0ba', background: 'transparent',
              color: '#2d7a4f', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>Add Another</button>
          </div>
        )}

        {/* Result Card */}
        {p && (
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #ede8df', overflow: 'hidden', marginTop: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', gap: 20, padding: 24, borderBottom: '1px solid #f5f2ec' }}>
              {p.image_url && (
                <div style={{ width: 80, height: 100, borderRadius: 10, overflow: 'hidden', background: '#f5f2ec', flexShrink: 0 }}>
                  <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a7e72', marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>{p.brand}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1612', lineHeight: 1.3, fontFamily: "'DM Sans', sans-serif" }}>{p.name}</div>
                {p.flavor && <div style={{ fontSize: 13, color: '#8a7e72', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{p.flavor}</div>}
                {p.primary_protein && <div style={{ fontSize: 12, color: '#b5aa99', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Primary Protein: {p.primary_protein}</div>}
              </div>
            </div>

            {/* Score */}
            <div style={{ padding: 24, borderBottom: '1px solid #f5f2ec', textAlign: 'center' }}>
              <div style={{
                fontSize: 52, fontWeight: 900, fontFamily: "'Playfair Display', serif",
                color: p.quality_score >= 80 ? '#2d7a4f' : p.quality_score >= 60 ? '#c47a20' : '#b5483a',
              }}>{p.quality_score}</div>
              <div style={{
                display: 'inline-block', padding: '4px 14px', borderRadius: 100, fontSize: 13, fontWeight: 700,
                background: p.quality_score >= 80 ? '#e6f4e0' : p.quality_score >= 60 ? '#fff0dc' : '#fce4e4',
                color: p.quality_score >= 80 ? '#2d7a4f' : p.quality_score >= 60 ? '#c47a20' : '#b5483a',
                fontFamily: "'DM Sans', sans-serif", marginTop: 4,
              }}>{s?.label || 'Scored'}</div>
            </div>

            {/* GA + DMB */}
            <div style={{ padding: 24, borderBottom: '1px solid #f5f2ec' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>Guaranteed Analysis (DMB)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {[
                  { label: 'Protein', value: p.protein_dmb },
                  { label: 'Fat', value: p.fat_dmb },
                  { label: 'Fiber', value: p.fiber_dmb },
                  { label: 'Carbs', value: p.carbs_dmb },
                  { label: 'Moisture', value: p.moisture, raw: true },
                ].map(n => (
                  <div key={n.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>{n.value != null ? Math.round(n.value * 10) / 10 : '—'}%</div>
                    <div style={{ fontSize: 10, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>{n.label}{!n.raw ? ' DMB' : ''}</div>
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
                  const names = { A_protein: 'Protein', B_fat: 'Fat', C_carbs: 'Carbs', D_fiber: 'Fiber', E_protein_source: 'Protein Source', F_preservatives: 'Preservatives', G_additives: 'Additives', H_functional: 'Functional' };
                  return (
                    <div key={key} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 13, color: '#3d352b', fontFamily: "'DM Sans', sans-serif" }}>{names[key] || key}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>{cat.score}/{cat.max}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: '#ede8df' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: pct >= 70 ? '#639922' : pct >= 40 ? '#EF9F27' : '#b5483a', width: `${pct}%`, transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ingredients */}
            {p.ingredients && (
              <div style={{ padding: 24, borderBottom: '1px solid #f5f2ec' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Ingredients</div>
                <div style={{ fontSize: 13, color: '#5a5248', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif", maxHeight: 200, overflowY: 'auto' }}>{p.ingredients}</div>
              </div>
            )}

            {/* Links */}
            <div style={{ padding: '14px 24px', background: '#faf8f5', display: 'flex', gap: 16 }}>
              {p.slug && p.brand_slug && (
                <a href={`/dog-food/${p.brand_slug}/${p.slug}`} style={{ fontSize: 13, fontWeight: 600, color: '#C9A84C', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>View on Site &rarr;</a>
              )}
              {p.url && (
                <a href={p.url} target="_blank" rel="noopener" style={{ fontSize: 13, fontWeight: 600, color: '#8a7e72', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>Original Page &rarr;</a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
