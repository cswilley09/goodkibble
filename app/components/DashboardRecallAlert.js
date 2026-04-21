'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

function formatDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}

export default function DashboardRecallAlert({ dogName, currentFood, currentFoodSlug }) {
  const router = useRouter();
  const { isPro } = useAuth();
  const [matchedRecall, setMatchedRecall] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!currentFood && !currentFoodSlug) { setLoaded(true); return; }
    fetch('/api/dashboard/recalls?days=365&type=recalls')
      .then(r => r.json())
      .then(d => {
        const recalls = d.recalls || [];
        const foodLower = (currentFood || '').toLowerCase();
        const slugBrand = currentFoodSlug ? currentFoodSlug.split('/')[0].toLowerCase() : '';

        const match = recalls.find(r => {
          if (!r.brand_name) return false;
          const recallBrand = r.brand_name.toLowerCase();
          return foodLower.includes(recallBrand) || (slugBrand && slugBrand.includes(recallBrand));
        });
        setMatchedRecall(match || null);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [currentFood, currentFoodSlug]);

  if (!loaded || !matchedRecall) return null;

  const name = dogName || 'Your dog';

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Recall Alert Card */}
      <div style={{ background: '#fff', borderRadius: 20, border: '2px solid #A32D2D', overflow: 'hidden', marginBottom: isPro ? 0 : 16 }}>
        <div style={{
          background: 'linear-gradient(135deg, #A32D2D, #8B2500)', padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{'\u26A0\uFE0F'}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'Inter', sans-serif" }}>Active Recall Alert</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif" }}>{formatDate(matchedRecall.recall_date || matchedRecall.report_date)}</div>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1612', marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>{matchedRecall.brand_name} — {matchedRecall.product_description}</div>
          {matchedRecall.reason && matchedRecall.reason !== matchedRecall.product_description && (
            <div style={{ fontSize: 13, color: '#5a5248', lineHeight: 1.6, marginBottom: 12, fontFamily: "'Inter', sans-serif" }}>{matchedRecall.reason}</div>
          )}
          <div style={{
            background: '#fce8e8', borderRadius: 10, padding: '12px 16px',
            fontSize: 12, color: '#A32D2D', fontWeight: 600, marginBottom: 16,
            fontFamily: "'Inter', sans-serif", lineHeight: 1.5,
          }}>
            This is {name}&rsquo;s current food. Stop feeding immediately and contact your veterinarian.
          </div>
          <div className="recall-alert-btns" style={{ display: 'flex', gap: 10 }}>
            {matchedRecall.source_url && (
              <a href={matchedRecall.source_url} target="_blank" rel="noopener noreferrer" style={{
                padding: '10px 22px', borderRadius: 100, background: '#A32D2D', color: '#fff',
                fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: "'Inter', sans-serif",
              }}>View Recall Details &rarr;</a>
            )}
            <button onClick={() => router.push('/discover')} style={{
              padding: '10px 22px', borderRadius: 100, border: '1.5px solid #ede8df',
              background: 'transparent', color: '#1a1612', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}>Find Alternatives</button>
          </div>
        </div>
      </div>

      {/* Pro upgrade nudge (free users only) */}
      {!isPro && (
        <div style={{
          background: 'linear-gradient(135deg, #1a1612, #2a2318)', borderRadius: 20,
          padding: 28, textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#2F6B48', marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>You found this recall by checking manually.</div>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>What about the next one?</h3>
          <p style={{ fontSize: 13, color: '#8a7e72', maxWidth: 380, margin: '0 auto 16px', lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
            Pro members get instant email alerts when a recall affects their food. You&rsquo;ll know within hours &mdash; not days or weeks.
          </p>
          <button onClick={() => router.push('/pro')} style={{
            padding: '12px 28px', borderRadius: 100, background: '#2F6B48', color: '#fff',
            fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
          }}>Get Recall Alerts &mdash; $29/year &rarr;</button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .recall-alert-btns { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
}
