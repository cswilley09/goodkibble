'use client';
import { useState, useEffect } from 'react';

const SEVERITY_STYLES = {
  'Class I': { bg: '#fce4e4', color: '#b5483a', border: '#b5483a', label: 'Class I' },
  'Class II': { bg: '#fff0dc', color: '#c47a20', border: '#c47a20', label: 'Class II' },
  'Class III': { bg: '#fff8dc', color: '#8a7e20', border: '#d4c040', label: 'Class III' },
  null: { bg: '#f0ebe3', color: 'rgba(28,24,20,0.60)', border: 'rgba(28,24,20,0.40)', label: 'Unclassified' },
};

const STATUS_STYLES = {
  'Ongoing': { color: '#b5483a', bg: 'rgba(181,72,58,0.08)' },
  'Terminated': { color: 'rgba(28,24,20,0.60)', bg: 'rgba(138,126,114,0.08)' },
  'Completed': { color: '#2d7a4f', bg: 'rgba(45,122,79,0.08)' },
};

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown date';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
}

export default function RecallTracker() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/recalls?days=365')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', color: 'rgba(28,24,20,0.60)', fontFamily: "'Inter', sans-serif", fontSize: 16 }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(28,24,20,0.08)', borderTopColor: '#C8941F', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        Loading recall data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', color: '#b5483a', fontFamily: "'Inter', sans-serif", fontSize: 14 }}>
        Failed to load recall data: {error}
      </div>
    );
  }

  const recalls = data?.recalls || [];
  const summary = data?.summary || {};

  const filtered = search.trim()
    ? recalls.filter(r => (r.brand_name || r.product_description || '').toLowerCase().includes(search.toLowerCase()))
    : recalls;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Summary Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
        marginBottom: 28,
      }}>
        {[
          { label: 'Total Recalls', value: summary.totalRecalls || 0, color: '#1C1814' },
          { label: 'Class I (Serious)', value: summary.classIRecalls || 0, color: '#b5483a' },
          { label: 'Ingredient Changes', value: summary.totalIngredientChanges || 0, color: '#c47a20' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: 16, border: '1px solid rgba(28,24,20,0.08)',
            padding: '20px 16px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(28,24,20,0.60)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 12,
          border: '1.5px solid rgba(28,24,20,0.08)', padding: '4px 4px 4px 16px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(28,24,20,0.40)" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by brand or product..."
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 14, padding: '10px 12px',
              background: 'transparent', color: '#1C1814',
              fontFamily: "'Inter', sans-serif", fontWeight: 500,
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: 'none', border: 'none', color: 'rgba(28,24,20,0.40)', fontSize: 16,
              cursor: 'pointer', padding: '6px 12px',
            }}>&times;</button>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(28,24,20,0.40)', marginTop: 6, fontFamily: "'Inter', sans-serif" }}>
          Showing {filtered.length} of {recalls.length} recalls from the last {summary.periodDays || 365} days
        </div>
      </div>

      {/* Recall Cards */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 24px', background: '#fff',
          borderRadius: 16, border: '1px solid rgba(28,24,20,0.08)',
        }}>
          <div style={{ fontSize: 36, opacity: 0.3, marginBottom: 12 }}>{'\u{1F6E1}\u{FE0F}'}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1C1814', marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>
            {search ? 'No recalls match your search' : 'No recalls found'}
          </div>
          <p style={{ fontSize: 13, color: 'rgba(28,24,20,0.60)', fontFamily: "'Inter', sans-serif" }}>
            {search ? 'Try a different brand name or keyword.' : 'No FDA recalls or advisories were found for the selected period.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((recall, i) => {
            const sev = SEVERITY_STYLES[recall.severity] || SEVERITY_STYLES[null];
            const stat = STATUS_STYLES[recall.status] || STATUS_STYLES['Ongoing'];
            return (
              <div key={recall.id || i} style={{
                background: '#fff', borderRadius: 14, border: '1px solid rgba(28,24,20,0.08)',
                borderLeft: `4px solid ${sev.border}`,
                padding: '18px 20px',
                animation: `fadeIn 0.3s ease ${i * 0.03}s both`,
              }}>
                {/* Top row: brand + badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 700, color: '#1C1814',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {recall.brand_name || 'Unknown Brand'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700,
                      background: sev.bg, color: sev.color,
                      fontFamily: "'Inter', sans-serif", letterSpacing: 0.3,
                    }}>{sev.label}</span>
                    <span style={{
                      padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700,
                      background: stat.bg, color: stat.color,
                      fontFamily: "'Inter', sans-serif", letterSpacing: 0.3,
                    }}>{recall.status || 'Ongoing'}</span>
                  </div>
                </div>

                {/* Description */}
                <div style={{
                  fontSize: 13, color: '#5a5248', lineHeight: 1.5, marginBottom: 10,
                  fontFamily: "'Inter', sans-serif",
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {recall.product_description || recall.reason || 'No description available'}
                </div>

                {/* Footer: date + source link */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'rgba(28,24,20,0.40)', fontFamily: "'Inter', sans-serif" }}>
                    {formatDate(recall.recall_date || recall.report_date || recall.created_at)}
                    {recall.source === 'fda_outbreaks' && ' \u00B7 FDA Advisory'}
                    {recall.source === 'fda_rss' && ' \u00B7 FDA Recall'}
                  </span>
                  {recall.source_url && (
                    <a href={recall.source_url} target="_blank" rel="noopener noreferrer" style={{
                      fontSize: 11, fontWeight: 600, color: '#C8941F',
                      textDecoration: 'none', fontFamily: "'Inter', sans-serif",
                    }}>View FDA Source &rarr;</a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
