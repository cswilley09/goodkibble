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
  const [url, setUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [result, setResult] = useState(null); // { product, score } — extracted but not saved
  const [savedResult, setSavedResult] = useState(null); // after confirm save
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [autopilot, setAutopilot] = useState(false);
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

  function handleImageSelect(file) {
    if (!file || !file.type.startsWith('image/')) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }

  function removeImage() { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; }

  function startLoading() {
    setLoading(true); setError(''); setResult(null); setSavedResult(null); setStatusIdx(0);
    intervalRef.current = setInterval(() => setStatusIdx(prev => Math.min(prev + 1, STATUS_MESSAGES.length - 1)), 3000);
  }
  function stopLoading() { setLoading(false); clearInterval(intervalRef.current); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim() && !imageFile) return;
    startLoading();
    try {
      const body = { admin_secret: ADMIN_SECRET, save: autopilot };
      if (url.trim()) body.url = url.trim();
      if (imageFile) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(imageFile);
        });
        body.image_base64 = base64;
        body.image_type = imageFile.type;
      }
      const res = await fetch('/api/admin/scrape-product', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        if (data.saved) { setSavedResult(data); setResult(null); }
        else { setResult(data); setSavedResult(null); }
      } else { setError(data.error || 'Failed to process'); }
    } catch (err) { setError(err.message); }
    stopLoading();
  }

  async function confirmSave() {
    if (!result?.product) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/save-product', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_secret: ADMIN_SECRET, product: result.product }),
      });
      const data = await res.json();
      if (data.success) { setSavedResult({ ...result, saved: true, product: data.product }); setResult(null); }
      else setError(data.error || 'Failed to save');
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  function reset() { setResult(null); setSavedResult(null); setError(''); setUrl(''); removeImage(); }

  const p = (result || savedResult)?.product;
  const s = (result || savedResult)?.score;
  const canSubmit = (url.trim() || imageFile) && !loading;
  const isReview = result && !savedResult; // showing extracted data, not yet saved

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: '#1a1612', marginBottom: 4 }}>Add Product</div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8a7e72', margin: 0 }}>
              Paste a URL, upload a screenshot, or both.
            </p>
          </div>
          {/* Autopilot toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: autopilot ? '#C9A84C' : '#b5aa99', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
              {autopilot ? 'Autopilot ON' : 'Review mode'}
            </span>
            <div onClick={() => setAutopilot(!autopilot)} style={{
              width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
              background: autopilot ? '#C9A84C' : '#ede8df',
              position: 'relative', transition: 'background 0.2s',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 2, left: autopilot ? 22 : 2,
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }} />
            </div>
          </div>
        </div>

        {/* Autopilot info */}
        {autopilot && (
          <div style={{
            padding: '10px 16px', borderRadius: 10, background: '#f7efd8', border: '1px solid #C9A84C20',
            marginBottom: 20, fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif",
          }}>
            {'\u{26A1}'} <strong style={{ color: '#1a1612' }}>Autopilot:</strong> Products will be scored and added to the database automatically without review.
          </div>
        )}

        {/* Form */}
        {!result && !savedResult && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginBottom: 6, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Product URL</label>
              <input type="url" value={url} onChange={e => setUrl(e.target.value)} disabled={loading}
                placeholder="https://www.chewy.com/product/..."
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #ede8df', fontSize: 14, background: '#fff', outline: 'none', fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.5 : 1, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginBottom: 6, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Screenshot <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional — for GA data)</span>
              </label>
              {imagePreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={imagePreview} alt="" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 12, border: '1px solid #ede8df' }} />
                  <button type="button" onClick={removeImage} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                </div>
              ) : (
                <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleImageSelect(e.dataTransfer?.files?.[0]); }}
                  onClick={() => !loading && fileRef.current?.click()}
                  style={{ border: `2px dashed ${dragOver ? '#C9A84C' : '#ede8df'}`, borderRadius: 14, padding: '24px 20px', textAlign: 'center', background: dragOver ? '#faf5e8' : '#fff', cursor: loading ? 'default' : 'pointer', transition: 'all 0.2s', opacity: loading ? 0.5 : 1 }}>
                  <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.3 }}>{'\u{1F4F7}'}</div>
                  <div style={{ fontSize: 13, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>Drop image or click to browse</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => handleImageSelect(e.target.files?.[0])} />
            </div>
            <button type="submit" disabled={!canSubmit} style={{
              width: '100%', padding: 14, borderRadius: 100, border: 'none',
              background: canSubmit ? '#1a1612' : '#ede8df', color: canSubmit ? '#faf8f4' : '#b5aa99',
              fontSize: 15, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default', fontFamily: "'DM Sans', sans-serif",
            }}>{loading ? 'Processing...' : 'Scrape & Score'}</button>
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: '#b5aa99', fontFamily: "'DM Sans', sans-serif" }}>
              {autopilot ? 'Autopilot: will save automatically' : 'Review mode: you\u2019ll approve before saving'}
            </div>
          </form>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ padding: '16px 20px', borderRadius: 12, background: '#fff', border: '1px solid #ede8df', marginTop: 20, display: 'flex', alignItems: 'center', gap: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#5a5248' }}>
            <div style={{ width: 18, height: 18, border: '2.5px solid #ede8df', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            {STATUS_MESSAGES[statusIdx]}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '14px 20px', borderRadius: 12, background: '#fce4e4', border: '1px solid #e8c4c4', marginTop: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#b5483a' }}>
            {error}
            {(error.includes('403') || error.includes('Firecrawl')) && !imageFile && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#8a7e72' }}>Tip: Try uploading a <strong>screenshot</strong> too.</div>
            )}
            <button onClick={reset} style={{ marginTop: 10, padding: '6px 16px', borderRadius: 100, border: '1.5px solid #e8c4c4', background: 'transparent', color: '#b5483a', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Try Again</button>
          </div>
        )}

        {/* Review banner */}
        {isReview && (
          <div style={{
            padding: '14px 20px', borderRadius: 12, background: '#fff8dc', border: '1px solid #ede8b0',
            marginTop: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8a7e20',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
          }}>
            <span>{'\u{1F50D}'} <strong>Review before saving</strong> — check the data below is correct</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={confirmSave} disabled={saving} style={{
                padding: '8px 20px', borderRadius: 100, border: 'none',
                background: '#2d7a4f', color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.6 : 1,
              }}>{saving ? 'Saving...' : '\u2713 Approve & Save'}</button>
              <button onClick={reset} style={{
                padding: '8px 16px', borderRadius: 100, border: '1.5px solid #ede8df',
                background: 'transparent', color: '#8a7e72', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>Discard</button>
            </div>
          </div>
        )}

        {/* Saved banner */}
        {savedResult && (
          <div style={{
            padding: '14px 20px', borderRadius: 12, background: '#e6f4e0', border: '1px solid #c4e0ba',
            marginTop: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#2d7a4f', fontWeight: 600,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{'\u2713'} Product added to GoodKibble!</span>
            <button onClick={reset} style={{ padding: '6px 16px', borderRadius: 100, border: '1.5px solid #c4e0ba', background: 'transparent', color: '#2d7a4f', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Add Another</button>
          </div>
        )}

        {/* Product Card */}
        {p && (
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #ede8df', overflow: 'hidden', marginTop: 16 }}>
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

            <div style={{ padding: 24, borderBottom: '1px solid #f5f2ec', textAlign: 'center' }}>
              <div style={{ fontSize: 52, fontWeight: 900, fontFamily: "'Playfair Display', serif", color: p.quality_score >= 80 ? '#2d7a4f' : p.quality_score >= 60 ? '#c47a20' : '#b5483a' }}>{p.quality_score}</div>
              <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, fontSize: 13, fontWeight: 700, background: p.quality_score >= 80 ? '#e6f4e0' : p.quality_score >= 60 ? '#fff0dc' : '#fce4e4', color: p.quality_score >= 80 ? '#2d7a4f' : p.quality_score >= 60 ? '#c47a20' : '#b5483a', fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>{s?.label || 'Scored'}</div>
            </div>

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

            {p.ingredients && (
              <div style={{ padding: 24, borderBottom: '1px solid #f5f2ec' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Ingredients</div>
                <div style={{ fontSize: 13, color: '#5a5248', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif", maxHeight: 200, overflowY: 'auto' }}>{p.ingredients}</div>
              </div>
            )}

            <div style={{ padding: '14px 24px', background: '#faf8f5', display: 'flex', gap: 16 }}>
              {p.slug && p.brand_slug && <a href={`/dog-food/${p.brand_slug}/${p.slug}`} style={{ fontSize: 13, fontWeight: 600, color: '#C9A84C', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>View on Site &rarr;</a>}
              {p.url && <a href={p.url} target="_blank" rel="noopener" style={{ fontSize: 13, fontWeight: 600, color: '#8a7e72', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>Original Page &rarr;</a>}
            </div>

            {/* Bottom approve/discard for review mode */}
            {isReview && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid #f5f2ec', display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={confirmSave} disabled={saving} style={{
                  padding: '12px 32px', borderRadius: 100, border: 'none',
                  background: '#2d7a4f', color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.6 : 1,
                }}>{saving ? 'Saving...' : '\u2713 Approve & Save to Database'}</button>
                <button onClick={reset} style={{
                  padding: '12px 24px', borderRadius: 100, border: '1.5px solid #ede8df',
                  background: 'transparent', color: '#8a7e72', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}>Discard</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
