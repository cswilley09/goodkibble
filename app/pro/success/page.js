'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SignUpButton from '../../components/SignUpButton';
import { useAuth } from '../../components/AuthContext';

export default function ProSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, fetchProfile } = useAuth();

  // Activate Pro on page load as a fallback in case webhook is delayed
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId || !session?.user) return;
    fetch('/api/activate-pro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, user_id: session.user.id, email: session.user.email }),
    }).then(() => {
      // Refresh the auth profile to pick up is_pro = true
      if (fetchProfile && session.user) fetchProfile(session.user.id, session.user.email);
    }).catch(() => {});
  }, [session?.user?.id]);

  const unlocked = [
    'Ingredient deep-dive with quality signals',
    'Unlimited food comparisons',
    'Save unlimited comparisons',
    'Up to 5 dog profiles',
    'Recall alerts via email',
    'Score change notifications',
    'Algorithm update alerts',
    'Ad-free experience',
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE4' }}>
      <nav className="nav-bar" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid rgba(28,24,20,0.08)',
        background: '#F4EFE4', position: 'sticky', top: 0, zIndex: 40,
      }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 800, color: '#1C1814', letterSpacing: -0.5 }}>GoodKibble</span>
        </a>
        <SignUpButton />
      </nav>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '60px 24px 80px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>{'\u{1F389}'}</div>
        <h1 className="page-title" style={{
          fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 5vw, 38px)',
          fontWeight: 900, color: '#1C1814', margin: '0 0 12px', letterSpacing: -1,
        }}>Welcome to GoodKibble Pro!</h1>
        <p style={{
          fontFamily: "'Inter', sans-serif", fontSize: 16, color: 'rgba(28,24,20,0.60)',
          marginBottom: 32, lineHeight: 1.6,
        }}>Your account has been upgraded. All Pro features are now unlocked.</p>

        <div style={{
          background: '#fff', borderRadius: 20, border: '1px solid rgba(28,24,20,0.08)',
          padding: 28, textAlign: 'left', marginBottom: 32,
        }}>
          <div style={{
            fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700,
            color: '#C8941F', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16,
          }}>What you unlocked</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {unlocked.map(f => (
              <div key={f} style={{
                display: 'flex', gap: 10, alignItems: 'center',
                fontSize: 14, fontFamily: "'Inter', sans-serif", color: '#1C1814',
              }}>
                <span style={{ color: '#639922', fontWeight: 700, flexShrink: 0 }}>{'\u2713'}</span>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/profile')} style={{
            padding: '14px 32px', borderRadius: 100, background: '#1C1814', color: '#F4EFE4',
            fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
          }}>Go to Dashboard &rarr;</button>
          <button onClick={() => router.push('/discover')} style={{
            padding: '14px 32px', borderRadius: 100, background: 'transparent', color: '#1C1814',
            fontSize: 16, fontWeight: 600, border: '1.5px solid rgba(28,24,20,0.08)', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
          }}>Browse Foods &rarr;</button>
        </div>
      </div>
    </div>
  );
}
