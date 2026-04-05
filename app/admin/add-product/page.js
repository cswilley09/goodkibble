'use client';
import { useState, useRef, useCallback } from 'react';

const ADMIN_PASSWORD = 'gk_admin_2026';
const ADMIN_SECRET = 'gk_admin_2026';
const STATUS_MESSAGES = ['Fetching product page...', 'AI is reading the label...', 'Calculating nutrition scores...', 'Almost done...'];

// Client-side scoring (mirrors lib/scoring.js for live preview)
function quickScore(protein_dmb, fat_dmb, fiber_dmb, carbs_dmb) {
  // Simplified category scores for live preview
  let A = protein_dmb >= 40 ? 25 : protein_dmb >= 35 ? 23 : protein_dmb >= 30 ? 20 : protein_dmb >= 26 ? 16 : protein_dmb >= 22 ? 12 : protein_dmb >= 18 ? 8 : 0;
  const ratio = protein_dmb > 0 ? fat_dmb / protein_dmb : 0;
  const fatLevel = fat_dmb > 24 ? 4 : fat_dmb > 20 ? 6 : fat_dmb >= 13 ? 8 : fat_dmb >= 8.5 ? 5 : fat_dmb >= 5.5 ? 3 : 0;
  const fatRatio = (ratio >= 0.4 && ratio <= 0.75) ? 7 : ((ratio >= 0.3 && ratio < 0.4) || (ratio > 0.75 && ratio <= 0.85)) ? 5 : (ratio < 0.3 || (ratio > 0.85 && ratio <= 1.0)) ? 3 : 1;
  let B = fatLevel + fatRatio;
  let C = carbs_dmb < 20 ? 15 : carbs_dmb < 30 ? 12 : carbs_dmb < 40 ? 10 : carbs_dmb < 50 ? 5 : 1;
  let D = fiber_dmb >= 10 ? 1 : fiber_dmb >= 7 ? 3 : fiber_dmb >= 4 ? 5 : fiber_dmb >= 2 ? 4 : 2;
  // E, F, G, H need ingredients — use placeholder 25 (average)
  return A + B + C + D + 25;
}

function calcDMB(protein, fat, fiber, moisture, ash) {
  const dm = 100 - (moisture || 10);
  if (dm <= 0) return { protein_dmb: 0, fat_dmb: 0, fiber_dmb: 0, carbs_dmb: 0, ash_dmb: 0 };
  const p = Math.round((protein / dm) * 1000) / 10;
  const f = Math.round((fat / dm) * 1000) / 10;
  const fb = Math.round((fiber / dm) * 1000) / 10;
  const a = Math.round((ash / dm) * 1000) / 10;
  const c = Math.round((100 - p - f - fb - a) * 10) / 10;
  return { protein_dmb: p, fat_dmb: f, fiber_dmb: fb, carbs_dmb: c, ash_dmb: a };
}

function scoreLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Above Average';
  if (score >= 50) return 'Average';
  return 'Below Average';
}

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #ede8df',
  fontSize: 14, background: '#fff', outline: 'none', fontFamily: "'DM Sans', sans-serif",
  color: '#1a1612', boxSizing: 'border-box',
};
const labelStyle = { fontSize: 11, fontWeight: 600, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' };
const numInputStyle = { ...inputStyle, width: '100%', textAlign: 'center' };

export default function AddProductPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [editData, setEditData] = useState(null); // editable product fields
  const [serverScore, setServerScore] = useState(null); // full score from server
  const [savedResult, setSavedResult] = useState(null);
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
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: '#1a1612', marginBottom: 24 }}>Good<span style={{ color: '#C9A84C' }}>Kibble</span> Admin</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && password === ADMIN_PASSWORD) setAuthed(true); }}
            placeholder="Admin password" style={inputStyle} />
          <button onClick={() => { if (password === ADMIN_PASSWORD) setAuthed(true); else setError('Wrong password'); }}
            style={{ width: '100%', padding: 12, borderRadius: 100, marginTop: 12, background: '#1a1612', color: '#faf8f4', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Enter</button>
          {error && <p style={{ color: '#b5483a', fontSize: 13, marginTop: 8 }}>{error}</p>}
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
  function startLoading() { setLoading(true); setError(''); setEditData(null); setSavedResult(null); setStatusIdx(0); intervalRef.current = setInterval(() => setStatusIdx(prev => Math.min(prev + 1, 3)), 3000); }
  function stopLoading() { setLoading(false); clearInterval(intervalRef.current); }

  function updateField(key, value) {
    setEditData(prev => ({ ...prev, [key]: value }));
  }

  // Derived DMB and score from editData
  const dmb = editData ? calcDMB(
    Number(editData.protein) || 0, Number(editData.fat) || 0,
    Number(editData.fiber) || 0, Number(editData.moisture) || 10,
    Number(editData.ash) || 7,
  ) : null;

  const liveScore = dmb ? quickScore(dmb.protein_dmb, dmb.fat_dmb, dmb.fiber_dmb, dmb.carbs_dmb) : null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim() && !imageFile) return;
    startLoading();
    try {
      const body = { admin_secret: ADMIN_SECRET, save: autopilot };
      if (url.trim()) body.url = url.trim();
      if (imageFile) {
        const base64 = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result.split(',')[1]); r.onerror = reject; r.readAsDataURL(imageFile); });
        body.image_base64 = base64; body.image_type = imageFile.type;
      }
      const res = await fetch('/api/admin/scrape-product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        if (data.saved) { setSavedResult(data); }
        else {
          setEditData(data.product);
          setServerScore(data.score);
        }
      } else setError(data.error || 'Failed');
    } catch (err) { setError(err.message); }
    stopLoading();
  }

  async function confirmSave() {
    if (!editData) return;
    setSaving(true);
    try {
      // Rebuild product with edited values
      const product = {
        ...editData,
        protein: Number(editData.protein),
        fat: Number(editData.fat),
        fiber: Number(editData.fiber) || 0,
        moisture: Number(editData.moisture) || 10,
        ash: Number(editData.ash) || 7,
      };
      const res = await fetch('/api/admin/save-product', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_secret: ADMIN_SECRET, product }),
      });
      const data = await res.json();
      if (data.success) { setSavedResult({ product: data.product, score: serverScore }); setEditData(null); }
      else setError(data.error || 'Failed to save');
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  function reset() { setEditData(null); setSavedResult(null); setError(''); setUrl(''); removeImage(); setServerScore(null); }

  const isReview = !!editData && !savedResult;
  const displayProduct = savedResult?.product || editData;
  const displayScore = serverScore;
  const canSubmit = (url.trim() || imageFile) && !loading;
  const scoreColor = s => s >= 80 ? '#2d7a4f' : s >= 60 ? '#c47a20' : '#b5483a';
  const scoreBg = s => s >= 80 ? '#e6f4e0' : s >= 60 ? '#fff0dc' : '#fce4e4';

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Header + autopilot */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: '#1a1612', marginBottom: 4 }}>Add Product</div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8a7e72', margin: 0 }}>Paste a URL, upload a screenshot, or both.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: autopilot ? '#C9A84C' : '#b5aa99', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{autopilot ? 'Autopilot' : 'Review'}</span>
            <div onClick={() => setAutopilot(!autopilot)} style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', background: autopilot ? '#C9A84C' : '#ede8df', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: autopilot ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
            </div>
          </div>
        </div>

        {autopilot && (
          <div style={{ padding: '10px 16px', borderRadius: 10, background: '#f7efd8', border: '1px solid #C9A84C20', marginBottom: 20, fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>
            {'\u26A1'} <strong style={{ color: '#1a1612' }}>Autopilot:</strong> saves automatically without review.
          </div>
        )}

        {/* Form */}
        {!editData && !savedResult && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Product URL</label>
              <input type="url" value={url} onChange={e => setUrl(e.target.value)} disabled={loading} placeholder="https://..." style={{ ...inputStyle, opacity: loading ? 0.5 : 1 }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Screenshot <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
              {imagePreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={imagePreview} alt="" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 12, border: '1px solid #ede8df' }} />
                  <button type="button" onClick={removeImage} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                </div>
              ) : (
                <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); handleImageSelect(e.dataTransfer?.files?.[0]); }} onClick={() => !loading && fileRef.current?.click()}
                  style={{ border: `2px dashed ${dragOver ? '#C9A84C' : '#ede8df'}`, borderRadius: 14, padding: '24px 20px', textAlign: 'center', background: dragOver ? '#faf5e8' : '#fff', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.5 : 1 }}>
                  <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.3 }}>{'\u{1F4F7}'}</div>
                  <div style={{ fontSize: 13, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>Drop image or click to browse</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => handleImageSelect(e.target.files?.[0])} />
            </div>
            <button type="submit" disabled={!canSubmit} style={{ width: '100%', padding: 14, borderRadius: 100, border: 'none', background: canSubmit ? '#1a1612' : '#ede8df', color: canSubmit ? '#faf8f4' : '#b5aa99', fontSize: 15, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default', fontFamily: "'DM Sans', sans-serif" }}>
              {loading ? 'Processing...' : 'Scrape & Score'}
            </button>
          </form>
        )}

        {loading && (
          <div style={{ padding: '16px 20px', borderRadius: 12, background: '#fff', border: '1px solid #ede8df', marginTop: 20, display: 'flex', alignItems: 'center', gap: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#5a5248' }}>
            <div style={{ width: 18, height: 18, border: '2.5px solid #ede8df', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            {STATUS_MESSAGES[statusIdx]}
          </div>
        )}

        {error && (
          <div style={{ padding: '14px 20px', borderRadius: 12, background: '#fce4e4', border: '1px solid #e8c4c4', marginTop: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#b5483a' }}>
            {error}
            <button onClick={reset} style={{ marginTop: 10, padding: '6px 16px', borderRadius: 100, border: '1.5px solid #e8c4c4', background: 'transparent', color: '#b5483a', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'block' }}>Try Again</button>
          </div>
        )}

        {/* Review banner */}
        {isReview && (
          <div style={{ padding: '14px 20px', borderRadius: 12, background: '#fff8dc', border: '1px solid #ede8b0', marginTop: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8a7e20', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span>{'\u{1F50D}'} <strong>Review &amp; edit</strong> — fix any errors before saving</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={confirmSave} disabled={saving} style={{ padding: '8px 20px', borderRadius: 100, border: 'none', background: '#2d7a4f', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1, fontFamily: "'DM Sans', sans-serif" }}>{saving ? 'Saving...' : '\u2713 Approve & Save'}</button>
              <button onClick={reset} style={{ padding: '8px 16px', borderRadius: 100, border: '1.5px solid #ede8df', background: 'transparent', color: '#8a7e72', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Discard</button>
            </div>
          </div>
        )}

        {savedResult && (
          <div style={{ padding: '14px 20px', borderRadius: 12, background: '#e6f4e0', border: '1px solid #c4e0ba', marginTop: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#2d7a4f', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{'\u2713'} Product added to GoodKibble!</span>
            <button onClick={reset} style={{ padding: '6px 16px', borderRadius: 100, border: '1.5px solid #c4e0ba', background: 'transparent', color: '#2d7a4f', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Add Another</button>
          </div>
        )}

        {/* Editable Review Card */}
        {isReview && editData && (
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #ede8df', overflow: 'hidden', marginTop: 16 }}>
            {/* Image + basic info */}
            <div style={{ padding: 24, borderBottom: '1px solid #f5f2ec' }}>
              {editData.image_url && (
                <div style={{ marginBottom: 12 }}>
                  <img src={editData.image_url} alt="" style={{ maxHeight: 120, borderRadius: 10, objectFit: 'contain', background: '#f5f2ec' }} onError={e => { e.target.style.display = 'none'; }} />
                </div>
              )}
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Image URL</label>
                <input value={editData.image_url || ''} onChange={e => updateField('image_url', e.target.value)} style={inputStyle} placeholder="https://..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div><label style={labelStyle}>Brand</label><input value={editData.brand || ''} onChange={e => updateField('brand', e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Name</label><input value={editData.name || ''} onChange={e => updateField('name', e.target.value)} style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={labelStyle}>Flavor</label><input value={editData.flavor || ''} onChange={e => updateField('flavor', e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Primary Protein</label><input value={editData.primary_protein || ''} onChange={e => updateField('primary_protein', e.target.value)} style={inputStyle} /></div>
              </div>
            </div>

            {/* Live Score */}
            <div style={{ padding: 20, borderBottom: '1px solid #f5f2ec', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#8a7e72', marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>ESTIMATED SCORE (live)</div>
              <div style={{ fontSize: 48, fontWeight: 900, fontFamily: "'Playfair Display', serif", color: liveScore ? scoreColor(liveScore) : '#8a7e72' }}>{liveScore || '—'}</div>
              {liveScore && <div style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: scoreBg(liveScore), color: scoreColor(liveScore), fontFamily: "'DM Sans', sans-serif" }}>{scoreLabel(liveScore)}</div>}
              <div style={{ fontSize: 10, color: '#b5aa99', marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>Full 8-category score calculated on save</div>
            </div>

            {/* GA inputs */}
            <div style={{ padding: 24, borderBottom: '1px solid #f5f2ec' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>Guaranteed Analysis</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {[
                  { key: 'protein', label: 'Protein %' },
                  { key: 'fat', label: 'Fat %' },
                  { key: 'fiber', label: 'Fiber %' },
                  { key: 'moisture', label: 'Moisture %' },
                  { key: 'ash', label: 'Ash %' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ ...labelStyle, textAlign: 'center' }}>{f.label}</label>
                    <input type="number" step="0.1" value={editData[f.key] ?? ''} onChange={e => updateField(f.key, e.target.value)} style={numInputStyle} />
                  </div>
                ))}
              </div>
              {/* DMB preview */}
              {dmb && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
                  {[
                    { label: 'Protein DMB', value: dmb.protein_dmb },
                    { label: 'Fat DMB', value: dmb.fat_dmb },
                    { label: 'Fiber DMB', value: dmb.fiber_dmb },
                    { label: 'Carbs DMB', value: dmb.carbs_dmb },
                  ].map(d => (
                    <div key={d.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>{Math.round(d.value * 10) / 10}%</div>
                      <div style={{ fontSize: 9, color: '#b5aa99', fontFamily: "'DM Sans', sans-serif" }}>{d.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Server score breakdown (from initial extraction) */}
            {displayScore?.categories && (
              <div style={{ padding: 24, borderBottom: '1px solid #f5f2ec' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>Full Score Breakdown (from extraction)</div>
                {Object.entries(displayScore.categories).map(([key, cat]) => {
                  const pct = (cat.score / cat.max) * 100;
                  const names = { A_protein: 'Protein', B_fat: 'Fat', C_carbs: 'Carbs', D_fiber: 'Fiber', E_protein_source: 'Protein Source', F_preservatives: 'Preservatives', G_additives: 'Additives', H_functional: 'Functional' };
                  return (
                    <div key={key} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 12, color: '#3d352b', fontFamily: "'DM Sans', sans-serif" }}>{names[key] || key}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>{cat.score}/{cat.max}</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: '#ede8df' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: pct >= 70 ? '#639922' : pct >= 40 ? '#EF9F27' : '#b5483a', width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ingredients */}
            <div style={{ padding: 24, borderBottom: '1px solid #f5f2ec' }}>
              <label style={{ ...labelStyle, marginBottom: 8 }}>Ingredients</label>
              <textarea value={editData.ingredients || ''} onChange={e => updateField('ingredients', e.target.value)}
                rows={5} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </div>

            {/* Bottom actions */}
            <div style={{ padding: '16px 24px', display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={confirmSave} disabled={saving} style={{ padding: '12px 32px', borderRadius: 100, border: 'none', background: '#2d7a4f', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : '\u2713 Approve & Save to Database'}
              </button>
              <button onClick={reset} style={{ padding: '12px 24px', borderRadius: 100, border: '1.5px solid #ede8df', background: 'transparent', color: '#8a7e72', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Discard</button>
            </div>
          </div>
        )}

        {/* Saved card (read-only) */}
        {savedResult?.product && (
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #ede8df', overflow: 'hidden', marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 20, padding: 24, borderBottom: '1px solid #f5f2ec' }}>
              {savedResult.product.image_url && <div style={{ width: 80, height: 100, borderRadius: 10, overflow: 'hidden', background: '#f5f2ec', flexShrink: 0 }}><img src={savedResult.product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a7e72', marginBottom: 2 }}>{savedResult.product.brand}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1612', lineHeight: 1.3, fontFamily: "'DM Sans', sans-serif" }}>{savedResult.product.name}</div>
                <div style={{ fontSize: 13, color: '#8a7e72', marginTop: 4 }}>{savedResult.product.primary_protein && `Primary Protein: ${savedResult.product.primary_protein}`}</div>
              </div>
            </div>
            <div style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 44, fontWeight: 900, fontFamily: "'Playfair Display', serif", color: scoreColor(savedResult.product.quality_score) }}>{savedResult.product.quality_score}</div>
            </div>
            <div style={{ padding: '14px 24px', background: '#faf8f5', display: 'flex', gap: 16 }}>
              {savedResult.product.slug && savedResult.product.brand_slug && <a href={`/dog-food/${savedResult.product.brand_slug}/${savedResult.product.slug}`} style={{ fontSize: 13, fontWeight: 600, color: '#C9A84C', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>View on Site &rarr;</a>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
