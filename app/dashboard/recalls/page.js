'use client';
import RecallTracker from '../../components/RecallTracker';
import SignUpButton from '../../components/SignUpButton';

export default function RecallDashboardPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid #ede8df',
        background: '#faf8f4', position: 'sticky', top: 0, zIndex: 40,
      }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: '#1a1612', letterSpacing: -0.5 }}>GoodKibble</span>
        </a>
        <SignUpButton />
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-block', background: 'rgba(181,72,58,0.08)',
            color: '#b5483a', padding: '4px 12px', borderRadius: 100,
            fontSize: 11, fontWeight: 700, marginBottom: 16,
            fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5,
          }}>{'\u{1F6A8}'} LIVE MONITORING</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 38px)',
            fontWeight: 900, color: '#1a1612', margin: '0 0 10px', letterSpacing: -0.5,
          }}>Recall &amp; Safety Tracker</h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#8a7e72',
            maxWidth: 480, margin: '0 auto', lineHeight: 1.6,
          }}>
            Monitoring FDA recalls and ingredient changes for dog food brands
          </p>
        </div>

        <RecallTracker />
      </div>
    </div>
  );
}
