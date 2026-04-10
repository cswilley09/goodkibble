'use client';
import { useState, useRef } from 'react';

const ADMIN_PASSWORD = 'gk_admin_2026';
const ADMIN_SECRET = 'gk_admin_2026';
const STATUS_MSGS = ['Fetching product page...', 'AI is reading the label...', 'Calculating nutrition scores...', 'Almost done...'];

function calcDMB(protein, fat, fiber, moisture, ash) {
  const dm = 100 - (moisture || 10);
  if (dm <= 0) return {};
  return {
    protein_dmb: Math.round((protein / dm) * 1000) / 10,
    fat_dmb: Math.round((fat / dm) * 1000) / 10,
    fiber_dmb: Math.round((fiber / dm) * 1000) / 10,
    carbs_dmb: Math.round((100 - (protein / dm * 100) - (fat / dm * 100) - (fiber / dm * 100) - (ash / dm * 100)) * 10) / 10,
  };
}
function scoreColor(s) { return s >= 80 ? '#2d7a4f' : s >= 60 ? '#c47a20' : '#b5483a'; }
function scoreBg(s) { return s >= 80 ? '#e6f4e0' : s >= 60 ? '#fff0dc' : '#fce4e4'; }
function scoreLabel(s) { return s >= 90 ? 'Excellent' : s >= 80 ? 'Great' : s >= 70 ? 'Good' : s >= 60 ? 'Fair' : 'Poor'; }

const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #ede8df', fontSize: 14, background: '#fff', outline: 'none', fontFamily: "'DM Sans', sans-serif", color: '#1a1612', boxSizing: 'border-box' };
const labelStyle = { fontSize: 11, fontWeight: 600, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' };

export default function AddProductPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [autopilot, setAutopilot] = useState(false);

  // Single mode state
  const [url, setUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [editData, setEditData] = useState(null);
  const [serverScore, setServerScore] = useState(null);
  const [savedResult, setSavedResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Bulk mode state
  const [catalogUrl, setCatalogUrl] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [discoveredBrand, setDiscoveredBrand] = useState('');
  const [discoveredProducts, setDiscoveredProducts] = useState([]);
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkScraping, setBulkScraping] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, name: '' });
  // bulkItems: array of { product (editable), score, error, status: 'pending'|'approved'|'skipped' }
  const [bulkItems, setBulkItems] = useState([]);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [bulkPhase, setBulkPhase] = useState('discover'); // 'discover' | 'scraping' | 'review' | 'summary' | 'done'
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkSaveResult, setBulkSaveResult] = useState(null);
  const [approvingIdx, setApprovingIdx] = useState(-1);

  const fileRef = useRef(null);
  const intervalRef = useRef(null);

  // ═══ PASSWORD GATE ═══
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf8f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 360, width: '100%', padding: 24, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: '#1a1612', marginBottom: 24 }}>Good<span style={{ color: '#C9A84C' }}>Kibble</span> Admin</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && password === ADMIN_PASSWORD) setAuthed(true); }} placeholder="Admin password" style={inputStyle} />
          <button onClick={() => { if (password === ADMIN_PASSWORD) setAuthed(true); else setError('Wrong password'); }} style={{ width: '100%', padding: 12, borderRadius: 100, marginTop: 12, background: '#1a1612', color: '#faf8f4', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Enter</button>
          {error && <p style={{ color: '#b5483a', fontSize: 13, marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>}
        </div>
      </div>
    );
  }

  // ═══ SINGLE MODE HELPERS ═══
  function handleImageSelect(file) { if (!file?.type.startsWith('image/')) return; setImageFile(file); const r = new FileReader(); r.onload = () => setImagePreview(r.result); r.readAsDataURL(file); }
  function removeImage() { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; }
  function startLoading() { setLoading(true); setError(''); setEditData(null); setSavedResult(null); setStatusIdx(0); intervalRef.current = setInterval(() => setStatusIdx(p => Math.min(p + 1, 3)), 3000); }
  function stopLoading() { setLoading(false); clearInterval(intervalRef.current); }
  function updateField(key, val) { setEditData(prev => ({ ...prev, [key]: val })); }
  function resetSingle() { setEditData(null); setSavedResult(null); setError(''); setUrl(''); removeImage(); setServerScore(null); }

  async function handleSingleSubmit(e) {
    e.preventDefault(); if (!url.trim() && !imageFile) return; startLoading();
    try {
      const body = { admin_secret: ADMIN_SECRET, save: autopilot };
      if (url.trim()) body.url = url.trim();
      if (imageFile) { const b64 = await fileToBase64(imageFile); body.image_base64 = b64; body.image_type = imageFile.type; }
      const res = await fetch('/api/admin/scrape-product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { if (data.saved) setSavedResult(data); else { setEditData(data.product); setServerScore(data.score); } }
      else setError(data.error || 'Failed');
    } catch (err) { setError(err.message); }
    stopLoading();
  }

  async function confirmSingleSave() {
    if (!editData) return; setSaving(true);
    try {
      const res = await fetch('/api/admin/save-product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_secret: ADMIN_SECRET, product: editData }) });
      const data = await res.json();
      if (data.success) { setSavedResult({ product: data.product, score: serverScore }); setEditData(null); }
      else setError(data.error || 'Failed');
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  // ═══ BULK MODE HELPERS ═══
  async function discoverProducts(e) {
    e.preventDefault(); if (!catalogUrl.trim()) return;
    setDiscovering(true); setError(''); setDiscoveredProducts([]); setBulkItems([]); setBulkSaveResult(null); setBulkPhase('discover');
    try {
      const res = await fetch('/api/admin/bulk-discover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: catalogUrl.trim(), admin_secret: ADMIN_SECRET }) });
      const data = await res.json();
      if (data.success && data.products?.length > 0) {
        setDiscoveredBrand(data.brand_name || '');
        setDiscoveredProducts(data.products);
        setBulkSelected(new Set(data.products.map((_, i) => i)));
      } else setError(data.error || 'No products found');
    } catch (err) { setError(err.message); }
    setDiscovering(false);
  }

  async function scrapeSelected() {
    const selected = discoveredProducts.filter((_, i) => bulkSelected.has(i));
    if (selected.length === 0) return;
    setBulkScraping(true); setBulkItems([]); setBulkPhase('scraping');
    const items = [];
    for (let i = 0; i < selected.length; i++) {
      const p = selected[i];
      setBulkProgress({ current: i + 1, total: selected.length, name: p.name });
      try {
        const res = await fetch('/api/admin/scrape-product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: p.url, admin_secret: ADMIN_SECRET, skip_save: true }) });
        const data = await res.json();
        if (data.success) items.push({ product: data.product, score: data.score, status: 'pending' });
        else items.push({ error: data.error || 'Failed', name: p.name, url: p.url, status: 'skipped' });
      } catch (err) { items.push({ error: err.message, name: p.name, url: p.url, status: 'skipped' }); }
      setBulkItems([...items]);
    }
    setBulkScraping(false);
    setBulkPhase('review');
    setReviewIdx(0);
  }

  function updateBulkItem(idx, key, val) {
    setBulkItems(prev => prev.map((item, i) => i === idx ? { ...item, product: { ...item.product, [key]: val } } : item));
  }

  async function approveCurrent() {
    const idx = reviewIdx;
    const total = bulkItems.length;
    const item = bulkItems[idx];
    if (!item?.product) return;
    setApprovingIdx(idx);

    // Advance FIRST so UI moves to next product while saving happens
    if (idx < total - 1) setReviewIdx(idx + 1);
    else setBulkPhase('summary');

    // Save to database in background
    try {
      const res = await fetch('/api/admin/save-product', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_secret: ADMIN_SECRET, product: item.product }),
      });
      const data = await res.json();
      if (data.success) {
        setBulkItems(prev => prev.map((it, i) => i === idx ? { ...it, status: 'approved', savedProduct: data.product } : it));
      } else {
        setBulkItems(prev => prev.map((it, i) => i === idx ? { ...it, status: 'approved', saveError: data.error } : it));
      }
    } catch (err) {
      setBulkItems(prev => prev.map((it, i) => i === idx ? { ...it, status: 'approved', saveError: err.message } : it));
    }
    setApprovingIdx(-1);
  }

  function skipCurrent() {
    const idx = reviewIdx;
    const total = bulkItems.length;
    setBulkItems(prev => prev.map((item, i) => i === idx ? { ...item, status: 'skipped' } : item));
    if (idx < total - 1) setReviewIdx(idx + 1);
    else setBulkPhase('summary');
  }

  async function bulkSave() {
    const approved = bulkItems.filter(r => r.status === 'approved' && r.product);
    if (approved.length === 0) return;
    setBulkSaving(true);
    try {
      const res = await fetch('/api/admin/bulk-save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ products: approved.map(r => r.product), admin_secret: ADMIN_SECRET }) });
      setBulkSaveResult(await res.json());
      setBulkPhase('done');
    } catch (err) { setError(err.message); }
    setBulkSaving(false);
  }

  function resetBulk() { setDiscoveredProducts([]); setBulkItems([]); setBulkSaveResult(null); setCatalogUrl(''); setError(''); setBulkPhase('discover'); setReviewIdx(0); }

  async function fileToBase64(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(file); }); }

  const dmb = editData ? calcDMB(Number(editData.protein) || 0, Number(editData.fat) || 0, Number(editData.fiber) || 0, Number(editData.moisture) || 10, Number(editData.ash) || 7) : null;
  const isReview = !!editData && !savedResult;
  const canSubmit = (url.trim() || imageFile) && !loading;
  const checkedBulkCount = bulkItems.filter(r => r.status === 'approved' && r.product).length;

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: '#1a1612', marginBottom: 4 }}>Add Product</div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8a7e72', margin: 0 }}>{bulkMode ? 'Scrape an entire brand catalog at once' : 'Paste a URL, upload a screenshot, or both.'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            {!bulkMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: autopilot ? '#C9A84C' : '#b5aa99', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{autopilot ? 'Auto' : 'Review'}</span>
                <div onClick={() => setAutopilot(!autopilot)} style={{ width: 38, height: 20, borderRadius: 10, cursor: 'pointer', background: autopilot ? '#C9A84C' : '#ede8df', position: 'relative' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: autopilot ? 20 : 2, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
                </div>
              </div>
            )}
            <button onClick={() => { setBulkMode(!bulkMode); resetSingle(); resetBulk(); }} style={{
              padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
              background: bulkMode ? '#C9A84C' : 'transparent', color: bulkMode ? '#fff' : '#8a7e72',
              border: bulkMode ? 'none' : '1.5px solid #ede8df', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>{bulkMode ? 'Bulk Mode ON' : 'Bulk Mode'}</button>
          </div>
        </div>

        {/* ═══ ERROR ═══ */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: '#fce4e4', border: '1px solid #e8c4c4', marginBottom: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#b5483a' }}>
            {error}
            <button onClick={() => { resetSingle(); resetBulk(); }} style={{ marginLeft: 12, padding: '4px 12px', borderRadius: 100, border: '1px solid #e8c4c4', background: 'transparent', color: '#b5483a', fontSize: 11, cursor: 'pointer' }}>Reset</button>
          </div>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* SINGLE MODE */}
        {/* ═══════════════════════════════════════ */}
        {!bulkMode && (
          <>
            {!editData && !savedResult && (
              <form onSubmit={handleSingleSubmit}>
                <div style={{ marginBottom: 16 }}><label style={labelStyle}>Product URL</label><input type="url" value={url} onChange={e => setUrl(e.target.value)} disabled={loading} placeholder="https://..." style={{ ...inputStyle, opacity: loading ? 0.5 : 1 }} /></div>
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Screenshot <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                  {imagePreview ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={imagePreview} alt="" style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 12, border: '1px solid #ede8df' }} />
                      <button type="button" onClick={removeImage} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                    </div>
                  ) : (
                    <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); handleImageSelect(e.dataTransfer?.files?.[0]); }} onClick={() => !loading && fileRef.current?.click()}
                      style={{ border: `2px dashed ${dragOver ? '#C9A84C' : '#ede8df'}`, borderRadius: 14, padding: '20px', textAlign: 'center', background: dragOver ? '#faf5e8' : '#fff', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
                      <div style={{ fontSize: 13, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>{'\u{1F4F7}'} Drop image or click</div>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => handleImageSelect(e.target.files?.[0])} />
                </div>
                <button type="submit" disabled={!canSubmit} style={{ width: '100%', padding: 14, borderRadius: 100, border: 'none', background: canSubmit ? '#1a1612' : '#ede8df', color: canSubmit ? '#faf8f4' : '#b5aa99', fontSize: 15, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default', fontFamily: "'DM Sans', sans-serif" }}>{loading ? 'Processing...' : 'Scrape & Score'}</button>
              </form>
            )}
            {loading && <div style={{ padding: '14px 20px', borderRadius: 12, background: '#fff', border: '1px solid #ede8df', marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#5a5248' }}><div style={{ width: 16, height: 16, border: '2px solid #ede8df', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />{STATUS_MSGS[statusIdx]}</div>}

            {/* Review */}
            {isReview && <ReviewCard editData={editData} updateField={updateField} dmb={dmb} serverScore={serverScore} onSave={confirmSingleSave} onDiscard={resetSingle} saving={saving} />}
            {savedResult && (
              <div style={{ marginTop: 16 }}>
                <div style={{ padding: '12px 16px', borderRadius: 12, background: '#e6f4e0', border: '1px solid #c4e0ba', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#2d7a4f', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{'\u2713'} Product added!</span>
                  <button onClick={resetSingle} style={{ padding: '5px 14px', borderRadius: 100, border: '1px solid #c4e0ba', background: 'transparent', color: '#2d7a4f', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Add Another</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* BULK MODE */}
        {/* ═══════════════════════════════════════ */}
        {bulkMode && (
          <>
            {/* Phase: Discover */}
            {bulkPhase === 'discover' && discoveredProducts.length === 0 && (
              <form onSubmit={discoverProducts}>
                <label style={labelStyle}>Brand catalog page URL</label>
                <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <input type="url" value={catalogUrl} onChange={e => setCatalogUrl(e.target.value)} disabled={discovering} placeholder="https://www.brandname.com/products" style={{ ...inputStyle, flex: 1, opacity: discovering ? 0.5 : 1 }} />
                  <button type="submit" disabled={discovering || !catalogUrl.trim()} style={{ padding: '10px 24px', borderRadius: 100, border: 'none', background: !discovering && catalogUrl.trim() ? '#1a1612' : '#ede8df', color: !discovering && catalogUrl.trim() ? '#faf8f4' : '#b5aa99', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>{discovering ? 'Scanning...' : 'Discover Products'}</button>
                </div>
                {discovering && <div style={{ fontSize: 13, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>Scanning catalog page for products...</div>}
              </form>
            )}

            {/* Phase: Select products */}
            {bulkPhase === 'discover' && discoveredProducts.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: '#1a1612' }}>Found {discoveredProducts.length} products{discoveredBrand ? ` from ${discoveredBrand}` : ''}</div>
                  <button onClick={resetBulk} style={{ fontSize: 12, color: '#8a7e72', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: "'DM Sans', sans-serif" }}>Start Over</button>
                </div>
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ede8df', overflow: 'hidden', marginBottom: 16 }}>
                  {discoveredProducts.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < discoveredProducts.length - 1 ? '1px solid #f5f2ec' : 'none' }}>
                      <input type="checkbox" checked={bulkSelected.has(i)} onChange={() => { const s = new Set(bulkSelected); if (s.has(i)) s.delete(i); else s.add(i); setBulkSelected(s); }} style={{ accentColor: '#1a1612', width: 16, height: 16 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: '#b5aa99', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>{p.url}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={scrapeSelected} disabled={bulkSelected.size === 0} style={{ width: '100%', padding: 14, borderRadius: 100, border: 'none', background: bulkSelected.size > 0 ? '#1a1612' : '#ede8df', color: bulkSelected.size > 0 ? '#faf8f4' : '#b5aa99', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Scrape Selected ({bulkSelected.size} products)</button>
              </div>
            )}

            {/* Phase: Scraping progress */}
            {bulkPhase === 'scraping' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>Scraping product {bulkProgress.current} of {bulkProgress.total}...</span>
                  <span style={{ fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>{Math.round((bulkProgress.current / bulkProgress.total) * 100)}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: '#ede8df', marginBottom: 4 }}>
                  <div style={{ height: '100%', borderRadius: 3, background: '#C9A84C', width: `${(bulkProgress.current / bulkProgress.total) * 100}%`, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>{bulkProgress.name}</div>
              </div>
            )}

            {/* Phase: Full-screen stepper review */}
            {bulkPhase === 'review' && (() => {
              // Guard: if reviewIdx is out of bounds or item is invalid, show transition
              if (reviewIdx >= bulkItems.length || !bulkItems[reviewIdx]?.product) {
                // Check if there are any pending items left
                const hasPending = bulkItems.some(r => r.product && r.status === 'pending');
                return (
                  <div style={{ textAlign: 'center', padding: 40, fontFamily: "'DM Sans', sans-serif" }}>
                    <div style={{ fontSize: 14, color: '#8a7e72', marginBottom: 16 }}>
                      {hasPending ? 'Finding next product...' : 'All products reviewed!'}
                    </div>
                    <button onClick={() => {
                      if (hasPending) {
                        const nextIdx = bulkItems.findIndex(r => r.product && r.status === 'pending');
                        if (nextIdx >= 0) setReviewIdx(nextIdx);
                        else setBulkPhase('summary');
                      } else {
                        setBulkPhase('summary');
                      }
                    }} style={{
                      padding: '10px 24px', borderRadius: 100, border: 'none',
                      background: '#1a1612', color: '#faf8f4', fontSize: 14, fontWeight: 700,
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}>{hasPending ? 'Continue Review' : 'View Summary'}</button>
                  </div>
                );
              }

              const item = bulkItems[reviewIdx];

              const p = item.product;
              const d = calcDMB(Number(p.protein) || 0, Number(p.fat) || 0, Number(p.fiber) || 0, Number(p.moisture) || 10, Number(p.ash) || 7);
              const approvedCount = bulkItems.filter(r => r.status === 'approved').length;
              const skippedCount = bulkItems.filter(r => r.status === 'skipped').length;

              return (
                <div>
                  {/* Header bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <button onClick={() => { if (reviewIdx > 0) setReviewIdx(reviewIdx - 1); }} disabled={reviewIdx === 0} style={{ padding: '6px 14px', borderRadius: 100, border: '1.5px solid #ede8df', background: 'transparent', color: reviewIdx > 0 ? '#1a1612' : '#b5aa99', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{'\u2190'} Prev</button>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>Product {reviewIdx + 1} of {bulkItems.length}</span>
                    <button onClick={() => { if (reviewIdx < bulkItems.length - 1) setReviewIdx(reviewIdx + 1); else setBulkPhase('summary'); }} style={{ padding: '6px 14px', borderRadius: 100, border: '1.5px solid #ede8df', background: 'transparent', color: '#1a1612', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Next {'\u2192'}</button>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: '#ede8df', marginBottom: 16 }}>
                    <div style={{ height: '100%', borderRadius: 2, background: '#C9A84C', width: `${((reviewIdx + 1) / bulkItems.length) * 100}%`, transition: 'width 0.2s' }} />
                  </div>

                  {/* Full editable review card */}
                  <ReviewCard
                    editData={p}
                    updateField={(key, val) => updateBulkItem(reviewIdx, key, val)}
                    dmb={d}
                    serverScore={item.score}
                    onSave={approveCurrent}
                    onDiscard={skipCurrent}
                    saving={approvingIdx === reviewIdx}
                    approveLabel={'\u2713 Approve'}
                    discardLabel="Skip"
                  />

                  {/* Status dots */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                    {bulkItems.map((r, i) => (
                      <div key={i} onClick={() => setReviewIdx(i)} style={{
                        width: i === reviewIdx ? 12 : 8, height: i === reviewIdx ? 12 : 8,
                        borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s',
                        background: r.status === 'approved' ? '#2d7a4f' : r.status === 'skipped' ? '#b5483a' : i === reviewIdx ? '#C9A84C' : '#ede8df',
                        border: i === reviewIdx ? '2px solid rgba(201,168,76,0.3)' : 'none',
                      }} />
                    ))}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>
                    {approvedCount} approved &middot; {skippedCount} skipped &middot; {bulkItems.length - approvedCount - skippedCount} remaining
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <button onClick={() => setBulkPhase('summary')} style={{ fontSize: 13, color: '#C9A84C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Skip to Summary {'\u2192'}</button>
                  </div>
                </div>
              );
            })()}

            {/* Phase: Summary */}
            {bulkPhase === 'summary' && (() => {
              const saved = bulkItems.filter(r => r.status === 'approved' && r.savedProduct);
              const saveErrors = bulkItems.filter(r => r.status === 'approved' && r.saveError);
              const skipped = bulkItems.filter(r => r.status === 'skipped' || r.error);
              const pending = bulkItems.filter(r => r.status === 'pending' && r.product);
              return (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>{'\u{1F389}'}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1612', fontFamily: "'Playfair Display', serif", marginBottom: 6 }}>Review Complete</div>
                    <div style={{ fontSize: 15, color: '#3d352b', fontFamily: "'DM Sans', sans-serif" }}>
                      <strong style={{ color: '#2d7a4f' }}>{saved.length}</strong> saved to database &middot;
                      <strong style={{ color: '#b5483a' }}> {skipped.length}</strong> skipped
                      {saveErrors.length > 0 && <> &middot; <strong style={{ color: '#c47a20' }}>{saveErrors.length}</strong> save errors</>}
                      {pending.length > 0 && <> &middot; <strong style={{ color: '#C9A84C' }}>{pending.length}</strong> not reviewed</>}
                    </div>
                  </div>

                  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ede8df', overflow: 'hidden', marginBottom: 20 }}>
                    {bulkItems.map((r, i) => {
                      const p = r.product;
                      const isSaved = r.status === 'approved' && r.savedProduct;
                      const hasSaveError = r.status === 'approved' && r.saveError;
                      const isSkipped = r.status === 'skipped' || r.error;
                      return (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                          borderBottom: '1px solid #f5f2ec',
                          background: hasSaveError ? '#fff0dc' : 'transparent',
                          opacity: isSkipped ? 0.4 : 1,
                        }}>
                          <span style={{ fontSize: 14, flexShrink: 0, color: isSaved ? '#2d7a4f' : isSkipped ? '#b5483a' : hasSaveError ? '#c47a20' : '#b5aa99' }}>
                            {isSaved ? '\u2713' : isSkipped ? '\u2717' : hasSaveError ? '\u26A0' : '\u25CB'}
                          </span>
                          {p && (
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: scoreBg(p.quality_score), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: scoreColor(p.quality_score), fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>{p.quality_score}</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0, fontFamily: "'DM Sans', sans-serif" }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1612' }}>{p?.brand || r.name || 'Error'}</span>
                            <span style={{ fontSize: 13, color: '#5a5248' }}> — {p?.name || r.error || ''}</span>
                            {hasSaveError && <div style={{ fontSize: 11, color: '#c47a20', marginTop: 2 }}>{r.saveError}</div>}
                          </div>
                          <span style={{ fontSize: 10, color: '#8a7e72', flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
                            {isSaved ? 'Saved' : isSkipped ? 'Skipped' : hasSaveError ? 'Error' : 'Pending'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button onClick={resetBulk} style={{
                      padding: '14px 32px', borderRadius: 100, border: 'none',
                      background: '#1a1612', color: '#faf8f4',
                      fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}>Scrape Another Brand</button>
                    {pending.length > 0 && (
                      <button onClick={() => { setReviewIdx(bulkItems.findIndex(r => r.status === 'pending')); setBulkPhase('review'); }} style={{
                        padding: '14px 24px', borderRadius: 100, border: '1.5px solid #ede8df',
                        background: 'transparent', color: '#8a7e72', fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      }}>Review Remaining ({pending.length})</button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Phase: Done */}
            {bulkPhase === 'done' && bulkSaveResult && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{'\u{1F389}'}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1612', fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>Bulk save complete</div>
                <div style={{ fontSize: 16, color: '#3d352b', fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
                  <strong style={{ color: '#2d7a4f' }}>{bulkSaveResult.saved}</strong> saved
                  {bulkSaveResult.skipped > 0 && <> &middot; <strong>{bulkSaveResult.skipped}</strong> duplicates skipped</>}
                  {bulkSaveResult.errors?.length > 0 && <> &middot; <strong style={{ color: '#b5483a' }}>{bulkSaveResult.errors.length}</strong> errors</>}
                </div>
                {bulkSaveResult.errors?.length > 0 && <div style={{ fontSize: 12, color: '#b5483a', marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>{bulkSaveResult.errors.join('; ')}</div>}
                <button onClick={resetBulk} style={{ marginTop: 24, padding: '12px 32px', borderRadius: 100, border: 'none', background: '#1a1612', color: '#faf8f4', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Scrape Another Brand</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ═══ SINGLE MODE REVIEW CARD (extracted as component for cleanliness) ═══
function ReviewCard({ editData, updateField, dmb, serverScore, onSave, onDiscard, saving, approveLabel, discardLabel }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ padding: '12px 16px', borderRadius: 12, background: '#fff8dc', border: '1px solid #ede8b0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#8a7e20', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <span>{'\u{1F50D}'} <strong>Review &amp; edit</strong></span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onSave} disabled={saving} style={{ padding: '6px 16px', borderRadius: 100, border: 'none', background: '#2d7a4f', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1, fontFamily: "'DM Sans', sans-serif" }}>{saving ? 'Saving...' : approveLabel || '\u2713 Save'}</button>
          <button onClick={onDiscard} style={{ padding: '6px 14px', borderRadius: 100, border: '1.5px solid #ede8df', background: 'transparent', color: '#8a7e72', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{discardLabel || 'Discard'}</button>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ede8df', overflow: 'hidden' }}>
        <div style={{ padding: 20, borderBottom: '1px solid #f5f2ec' }}>
          {/* Product image */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
            <div style={{ width: 100, height: 130, borderRadius: 10, overflow: 'hidden', background: '#f5f2ec', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ede8df' }}>
              {editData.image_url ? (
                <img src={editData.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:32px;opacity:0.3">\u{1F4E6}</span>'; }} />
              ) : (
                <span style={{ fontSize: 32, opacity: 0.3 }}>{'\u{1F4E6}'}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a7e72', marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>{editData.brand || 'Brand'}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1612', lineHeight: 1.3, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>{editData.name || 'Product Name'}</div>
              {editData.quality_score != null && (
                <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: scoreBg(editData.quality_score), color: scoreColor(editData.quality_score), fontFamily: "'DM Sans', sans-serif" }}>
                  {editData.quality_score} — {scoreLabel(editData.quality_score)}
                </div>
              )}
            </div>
          </div>
          {/* Image URL — full width, editable */}
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Product Image URL</label>
            <input value={editData.image_url || ''} onChange={e => updateField('image_url', e.target.value)} placeholder="https://..." style={{ ...inputStyle, fontSize: 12 }} />
            {!editData.image_url && <div style={{ fontSize: 11, color: '#c47a20', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{'\u26A0'} No image found — paste a URL above</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div><label style={labelStyle}>Brand</label><input value={editData.brand || ''} onChange={e => updateField('brand', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Name</label><input value={editData.name || ''} onChange={e => updateField('name', e.target.value)} style={inputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><label style={labelStyle}>Flavor</label><input value={editData.flavor || ''} onChange={e => updateField('flavor', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Primary Protein</label><input value={editData.primary_protein || ''} onChange={e => updateField('primary_protein', e.target.value)} style={inputStyle} /></div>
          </div>
        </div>
        <div style={{ padding: 20, borderBottom: '1px solid #f5f2ec' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 10 }}>
            {['protein', 'fat', 'fiber', 'moisture', 'ash'].map(k => (
              <div key={k}><label style={{ ...labelStyle, textAlign: 'center' }}>{k}</label><input type="number" step="0.1" value={editData[k] ?? ''} onChange={e => updateField(k, e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} /></div>
            ))}
          </div>
          {dmb && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              {[{ l: 'P-DMB', v: dmb.protein_dmb }, { l: 'F-DMB', v: dmb.fat_dmb }, { l: 'Fb-DMB', v: dmb.fiber_dmb }, { l: 'C-DMB', v: dmb.carbs_dmb }].map(d => (
                <span key={d.l} style={{ fontSize: 11, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>{d.l}: <strong>{Math.round(d.v * 10) / 10}%</strong></span>
              ))}
            </div>
          )}
        </div>
        {serverScore?.categories && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f5f2ec' }}>
            {Object.entries(serverScore.categories).map(([k, c]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#8a7e72', width: 90, flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>{k.replace('_', ': ')}</span>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#ede8df' }}><div style={{ height: '100%', borderRadius: 2, background: (c.score / c.max) >= 0.7 ? '#639922' : '#EF9F27', width: `${(c.score / c.max) * 100}%` }} /></div>
                <span style={{ fontSize: 11, fontWeight: 600, width: 36, textAlign: 'right', fontFamily: "'DM Sans', sans-serif" }}>{c.score}/{c.max}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ padding: '16px 20px' }}>
          <label style={labelStyle}>Ingredients</label>
          <textarea value={editData.ingredients || ''} onChange={e => updateField('ingredients', e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        </div>
      </div>
    </div>
  );
}
