'use client';
import { useState, useRef } from 'react';

const ADMIN_PASSWORD = 'gk_admin_2026';
const ADMIN_SECRET = 'gk_admin_2026';

const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #ede8df', fontSize: 14, background: '#fff', outline: 'none', fontFamily: "'DM Sans', sans-serif", color: '#1a1612', boxSizing: 'border-box' };
const labelStyle = { fontSize: 11, fontWeight: 600, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' };

export default function AddRecallPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState('url'); // 'url' | 'pdf' | 'email'
  const [url, setUrl] = useState('');
  const [emailText, setEmailText] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null); // { recall, extracted }
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf8f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 360, width: '100%', padding: 24, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: '#1a1612', marginBottom: 24 }}>Good<span style={{ color: '#A32D2D' }}>Kibble</span> Recalls</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && password === ADMIN_PASSWORD) setAuthed(true); }}
            placeholder="Admin password" style={inputStyle} />
          <button onClick={() => { if (password === ADMIN_PASSWORD) setAuthed(true); else setError('Wrong password'); }}
            style={{ width: '100%', padding: 12, borderRadius: 100, marginTop: 12, background: '#1a1612', color: '#faf8f4', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Enter</button>
          {error && <p style={{ color: '#b5483a', fontSize: 13, marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>}
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null); setSaved(false); setEditData(null);
    setStatus('AI is reading the recall information...');

    try {
      const body = { admin_secret: ADMIN_SECRET, mode: tab, save: false };

      if (tab === 'url') {
        if (!url.trim()) { setError('URL required'); setLoading(false); return; }
        body.url = url.trim();
      } else if (tab === 'pdf') {
        if (!pdfFile) { setError('PDF required'); setLoading(false); return; }
        const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(pdfFile); });
        body.pdf_base64 = base64;
      } else if (tab === 'email') {
        if (!emailText.trim()) { setError('Paste the email or text'); setLoading(false); return; }
        body.email_text = emailText.trim();
      }

      const res = await fetch('/api/admin/manual-recall', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setEditData(data.recall);
      } else {
        setError(data.error || 'Failed to extract recall');
      }
    } catch (err) { setError(err.message); }
    setLoading(false); setStatus('');
  }

  async function confirmSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/manual-recall', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_secret: ADMIN_SECRET, mode: 'url', url: editData.source_url || 'manual',
          save: true,
          // Override with a direct insert approach
        }),
      });
      // Actually just insert the editData directly
      const { createClient } = await import('@supabase/supabase-js');
      // Can't use service role from client — call a save endpoint instead
      const saveRes = await fetch('/api/admin/manual-recall', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_secret: ADMIN_SECRET, mode: 'save', recall: editData }),
      });
      const saveData = await saveRes.json();
      if (saveData.success) { setSaved(true); setEditData(null); }
      else setError(saveData.error || 'Failed to save');
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  function updateField(key, val) { setEditData(prev => ({ ...prev, [key]: val })); }
  function reset() { setResult(null); setEditData(null); setSaved(false); setError(''); setUrl(''); setEmailText(''); setPdfFile(null); }

  const tabs = [
    { key: 'url', label: 'Paste URL / PDF Link' },
    { key: 'pdf', label: 'Upload PDF' },
    { key: 'email', label: 'Paste Email / Text' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: '#1a1612', marginBottom: 4 }}>Add Recall</div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8a7e72', margin: 0 }}>Paste a URL, upload a PDF, or paste email text. AI extracts the recall details.</p>
          </div>
          <a href="/admin/add-product" style={{ fontSize: 12, color: '#C9A84C', fontWeight: 600, textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>Add Product &rarr;</a>
        </div>

        {/* Tabs */}
        {!editData && !saved && (
          <>
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #ede8df', marginBottom: 20 }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  flex: 1, padding: '12px 0', background: 'none', border: 'none',
                  borderBottom: tab === t.key ? '2px solid #A32D2D' : '2px solid transparent',
                  color: tab === t.key ? '#1a1612' : '#b5aa99', fontSize: 13, fontWeight: tab === t.key ? 600 : 500,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}>{t.label}</button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {tab === 'url' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Recall URL (webpage or PDF link)</label>
                  <input type="url" value={url} onChange={e => setUrl(e.target.value)} disabled={loading}
                    placeholder="https://www.fda.gov/... or https://example.com/recall.pdf"
                    style={{ ...inputStyle, opacity: loading ? 0.5 : 1 }} />
                  <div style={{ fontSize: 11, color: '#b5aa99', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                    Works with FDA pages, company press releases, Petful articles, or direct PDF links
                  </div>
                </div>
              )}

              {tab === 'pdf' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Upload PDF</label>
                  {pdfFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fff', borderRadius: 10, border: '1.5px solid #ede8df' }}>
                      <span style={{ fontSize: 20 }}>{'\u{1F4C4}'}</span>
                      <span style={{ flex: 1, fontSize: 14, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>{pdfFile.name}</span>
                      <button type="button" onClick={() => { setPdfFile(null); if (fileRef.current) fileRef.current.value = ''; }} style={{ background: 'none', border: 'none', color: '#b5aa99', fontSize: 16, cursor: 'pointer' }}>&times;</button>
                    </div>
                  ) : (
                    <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                      onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer?.files?.[0]; if (f?.type === 'application/pdf') setPdfFile(f); }}
                      onClick={() => fileRef.current?.click()}
                      style={{ border: `2px dashed ${dragOver ? '#A32D2D' : '#ede8df'}`, borderRadius: 14, padding: '28px 20px', textAlign: 'center', background: dragOver ? '#fce8e8' : '#fff', cursor: 'pointer' }}>
                      <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.3 }}>{'\u{1F4C4}'}</div>
                      <div style={{ fontSize: 13, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>Drop PDF here or click to browse</div>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept=".pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) setPdfFile(f); }} />
                </div>
              )}

              {tab === 'email' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Paste recall email, press release, or any text</label>
                  <textarea value={emailText} onChange={e => setEmailText(e.target.value)} disabled={loading}
                    rows={8} placeholder="Paste the full email or recall announcement text here..."
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, opacity: loading ? 0.5 : 1 }} />
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: 14, borderRadius: 100, border: 'none',
                background: loading ? '#ede8df' : '#A32D2D', color: loading ? '#b5aa99' : '#fff',
                fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}>{loading ? 'Extracting...' : 'Extract Recall Details'}</button>
            </form>
          </>
        )}

        {/* Loading */}
        {loading && status && (
          <div style={{ padding: '14px 20px', borderRadius: 12, background: '#fff', border: '1px solid #ede8df', marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#5a5248' }}>
            <div style={{ width: 16, height: 16, border: '2px solid #ede8df', borderTopColor: '#A32D2D', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            {status}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '14px 20px', borderRadius: 12, background: '#fce4e4', border: '1px solid #e8c4c4', marginTop: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#b5483a' }}>
            {error}
            <button onClick={reset} style={{ marginLeft: 12, padding: '4px 12px', borderRadius: 100, border: '1px solid #e8c4c4', background: 'transparent', color: '#b5483a', fontSize: 11, cursor: 'pointer' }}>Reset</button>
          </div>
        )}

        {/* Saved */}
        {saved && (
          <div style={{ marginTop: 16 }}>
            <div style={{ padding: '14px 20px', borderRadius: 12, background: '#e6f4e0', border: '1px solid #c4e0ba', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#2d7a4f', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{'\u2713'} Recall added to database!</span>
              <button onClick={reset} style={{ padding: '5px 14px', borderRadius: 100, border: '1px solid #c4e0ba', background: 'transparent', color: '#2d7a4f', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Add Another</button>
            </div>
          </div>
        )}

        {/* Review Card */}
        {editData && !saved && (
          <div style={{ marginTop: 16 }}>
            <div style={{ padding: '12px 16px', borderRadius: 12, background: '#fff8dc', border: '1px solid #ede8b0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#8a7e20', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <span>{'\u{1F50D}'} <strong>Review &amp; edit before saving</strong></span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={confirmSave} disabled={saving} style={{ padding: '6px 16px', borderRadius: 100, border: 'none', background: '#2d7a4f', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1, fontFamily: "'DM Sans', sans-serif" }}>{saving ? 'Saving...' : '\u2713 Save Recall'}</button>
                <button onClick={reset} style={{ padding: '6px 14px', borderRadius: 100, border: '1.5px solid #ede8df', background: 'transparent', color: '#8a7e72', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Discard</button>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ede8df', overflow: 'hidden' }}>
              {/* Severity indicator */}
              <div style={{ height: 4, background: editData.severity === 'Class I' ? '#A32D2D' : editData.severity === 'Class II' ? '#d4760a' : '#C9A84C' }} />

              <div style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div><label style={labelStyle}>Brand Name</label><input value={editData.brand_name || ''} onChange={e => updateField('brand_name', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Severity</label>
                    <select value={editData.severity || ''} onChange={e => updateField('severity', e.target.value || null)} style={inputStyle}>
                      <option value="">Unknown</option>
                      <option value="Class I">Class I (Serious)</option>
                      <option value="Class II">Class II (Moderate)</option>
                      <option value="Class III">Class III (Low Risk)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Product Description</label>
                  <textarea value={editData.product_description || ''} onChange={e => updateField('product_description', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Reason for Recall</label>
                  <textarea value={editData.reason || ''} onChange={e => updateField('reason', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div><label style={labelStyle}>Recall Date</label><input type="date" value={editData.recall_date || ''} onChange={e => updateField('recall_date', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Status</label>
                    <select value={editData.status || 'Ongoing'} onChange={e => updateField('status', e.target.value)} style={inputStyle}>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Terminated">Terminated</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Lot Numbers / Codes</label>
                  <textarea value={editData.lot_numbers || ''} onChange={e => updateField('lot_numbers', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} placeholder="UPC codes, lot numbers, best-by dates..." />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Distribution Pattern</label>
                  <input value={editData.distribution_pattern || ''} onChange={e => updateField('distribution_pattern', e.target.value)} style={inputStyle} placeholder="Where was it sold?" />
                </div>

                <div>
                  <label style={labelStyle}>Source URL</label>
                  <input value={editData.source_url || ''} onChange={e => updateField('source_url', e.target.value)} style={inputStyle} placeholder="https://..." />
                </div>
              </div>

              {/* Bottom save */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid #f5f2ec', display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={confirmSave} disabled={saving} style={{
                  padding: '12px 32px', borderRadius: 100, border: 'none',
                  background: '#2d7a4f', color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.6 : 1,
                }}>{saving ? 'Saving...' : '\u2713 Save Recall to Database'}</button>
                <button onClick={reset} style={{
                  padding: '12px 24px', borderRadius: 100, border: '1.5px solid #ede8df',
                  background: 'transparent', color: '#8a7e72', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}>Discard</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
