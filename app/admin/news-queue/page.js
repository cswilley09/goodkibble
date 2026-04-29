'use client';
import { useState, useEffect, useCallback } from 'react';

const ADMIN_PASSWORD = 'gk_admin_2026';
const ADMIN_SECRET = 'gk_admin_2026';

const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(28,24,20,0.08)', fontSize: 14, background: '#fff', outline: 'none', fontFamily: "'Inter', sans-serif", color: '#1C1814', boxSizing: 'border-box' };

export default function NewsQueuePage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // item id being acted on
  const [pollLoading, setPollLoading] = useState(false);
  const [pollResult, setPollResult] = useState(null);

  const fetchItems = useCallback(async (status) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/news-queue?status=${status}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) fetchItems(tab);
  }, [authed, tab, fetchItems]);

  async function handleAction(id, action) {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/news-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, admin_secret: ADMIN_SECRET }),
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.filter(i => i.id !== id));
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      alert(err.message);
    }
    setActionLoading(null);
  }

  async function triggerPoll() {
    setPollLoading(true);
    setPollResult(null);
    try {
      const res = await fetch(`/api/cron/poll-news?admin_secret=${ADMIN_SECRET}`);
      const data = await res.json();
      setPollResult(data);
      if (tab === 'pending') fetchItems('pending');
    } catch (err) {
      setPollResult({ error: err.message });
    }
    setPollLoading(false);
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#F4EFE4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 360, width: '100%', padding: 24, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 800, color: '#1C1814', marginBottom: 24 }}>Good<span style={{ color: '#A32D2D' }}>Kibble</span> News Queue</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && password === ADMIN_PASSWORD) setAuthed(true); else if (e.key === 'Enter') setAuthError('Wrong password'); }}
            placeholder="Admin password" style={inputStyle} />
          <button onClick={() => { if (password === ADMIN_PASSWORD) setAuthed(true); else setAuthError('Wrong password'); }}
            style={{ width: '100%', padding: 12, borderRadius: 100, marginTop: 12, background: '#1C1814', color: '#F4EFE4', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Enter</button>
          {authError && <p style={{ color: '#b5483a', fontSize: 13, marginTop: 8, fontFamily: "'Inter', sans-serif" }}>{authError}</p>}
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'dismissed', label: 'Dismissed' },
  ];

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE4' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontWeight: 800, color: '#1C1814', marginBottom: 4 }}>News Queue</div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(28,24,20,0.60)', margin: 0 }}>Google News recall articles pending review</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={triggerPoll} disabled={pollLoading} style={{
              padding: '8px 16px', borderRadius: 100, border: '1.5px solid rgba(28,24,20,0.08)',
              background: pollLoading ? '#f5f2ec' : '#fff', color: '#1C1814',
              fontSize: 13, fontWeight: 600, cursor: pollLoading ? 'default' : 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}>{pollLoading ? 'Polling...' : 'Poll Now'}</button>
            <a href="/admin/add-recall" style={{ fontSize: 12, color: '#C8941F', fontWeight: 600, textDecoration: 'none', fontFamily: "'Inter', sans-serif" }}>Add Recall &rarr;</a>
          </div>
        </div>

        {/* Poll result */}
        {pollResult && (
          <div style={{
            padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontFamily: "'Inter', sans-serif", fontSize: 13,
            background: pollResult.error ? '#fce4e4' : '#e6f4e0',
            border: pollResult.error ? '1px solid #e8c4c4' : '1px solid #c4e0ba',
            color: pollResult.error ? '#b5483a' : '#2d7a4f',
          }}>
            {pollResult.error
              ? `Poll failed: ${pollResult.error}`
              : `Found ${pollResult.new_items || 0} new items, skipped ${pollResult.skipped || 0} duplicates`}
            <button onClick={() => setPollResult(null)} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700, fontSize: 14 }}>&times;</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(28,24,20,0.08)', marginBottom: 20 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '12px 0', background: 'none', border: 'none',
              borderBottom: tab === t.key ? '2px solid #A32D2D' : '2px solid transparent',
              color: tab === t.key ? '#1C1814' : 'rgba(28,24,20,0.40)', fontSize: 14, fontWeight: tab === t.key ? 600 : 500,
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: "'Inter', sans-serif", color: 'rgba(28,24,20,0.40)', fontSize: 14 }}>
            Loading...
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: "'Inter', sans-serif", color: 'rgba(28,24,20,0.40)' }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>{tab === 'pending' ? '\u{1F4ED}' : tab === 'approved' ? '\u2705' : '\u{1F5D1}'}</div>
            <div style={{ fontSize: 15 }}>No {tab} items</div>
            {tab === 'pending' && <div style={{ fontSize: 13, marginTop: 8 }}>Click "Poll Now" to fetch latest news</div>}
          </div>
        )}

        {/* Items */}
        {!loading && items.map(item => (
          <div key={item.id} style={{
            background: '#fff', borderRadius: 14, border: '1px solid rgba(28,24,20,0.08)', padding: 20,
            marginBottom: 12, fontFamily: "'Inter', sans-serif",
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={{
                  fontSize: 15, fontWeight: 600, color: '#1C1814', textDecoration: 'none', lineHeight: 1.4, display: 'block',
                }}>
                  {item.title}
                </a>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: 'rgba(28,24,20,0.60)', flexWrap: 'wrap' }}>
                  {item.source_name && <span style={{ background: '#f5f2ec', padding: '2px 10px', borderRadius: 100 }}>{item.source_name}</span>}
                  <span>{formatDate(item.pub_date)}</span>
                  {item.reviewed_at && <span>Reviewed: {formatDate(item.reviewed_at)}</span>}
                  {item.recall_id && <span style={{ color: '#2d7a4f', fontWeight: 600 }}>Recall ID: {item.recall_id.slice(0, 8)}...</span>}
                </div>
              </div>

              {tab === 'pending' && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => handleAction(item.id, 'approve')} disabled={actionLoading === item.id}
                    style={{
                      padding: '6px 14px', borderRadius: 100, border: 'none',
                      background: actionLoading === item.id ? '#c4e0ba' : '#2d7a4f', color: '#fff',
                      fontSize: 12, fontWeight: 700, cursor: actionLoading === item.id ? 'default' : 'pointer',
                      fontFamily: "'Inter', sans-serif",
                    }}>Approve</button>
                  <button onClick={() => handleAction(item.id, 'dismiss')} disabled={actionLoading === item.id}
                    style={{
                      padding: '6px 14px', borderRadius: 100, border: '1.5px solid rgba(28,24,20,0.08)',
                      background: 'transparent', color: 'rgba(28,24,20,0.60)',
                      fontSize: 12, fontWeight: 600, cursor: actionLoading === item.id ? 'default' : 'pointer',
                      fontFamily: "'Inter', sans-serif",
                    }}>Dismiss</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
