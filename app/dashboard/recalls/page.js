'use client';
import RecallTracker from '../../components/RecallTracker';
import SignUpButton from '../../components/SignUpButton';
import RecallsNav from '../../components/RecallsNav';
import CompareBubble from '../../components/CompareBubble';

export default function RecallDashboardPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid #ede8df',
        background: '#faf8f4', position: 'sticky', top: 0, zIndex: 40,
      }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 800, color: '#1a1612', letterSpacing: -0.5 }}>GoodKibble</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <a href="/discover" className="nav-discover-link" style={{ fontSize: 14, fontWeight: 600, color: '#5a5248', cursor: 'pointer', fontFamily: "'Inter', sans-serif", textDecoration: 'none' }}>Discover Foods</a>
          <RecallsNav />
          <CompareBubble />
          <SignUpButton />
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-block', background: 'rgba(181,72,58,0.08)',
            color: '#b5483a', padding: '4px 12px', borderRadius: 100,
            fontSize: 11, fontWeight: 700, marginBottom: 16,
            fontFamily: "'Inter', sans-serif", letterSpacing: 0.5,
          }}>{'\u{1F6A8}'} LIVE MONITORING</div>
          <h1 className="page-title" style={{
            fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 4vw, 38px)',
            fontWeight: 900, color: '#1a1612', margin: '0 0 10px', letterSpacing: -0.5,
          }}>Recall &amp; Safety Tracker</h1>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#8a7e72',
            maxWidth: 480, margin: '0 auto', lineHeight: 1.6,
          }}>
            Monitoring FDA recalls and ingredient changes for dog food brands
          </p>
        </div>

        <RecallTracker />
      </div>
      <style>{`
        @media (max-width: 768px) {
          .nav-discover-link { font-size: 12px !important; }
        }
      `}</style>
    </div>
  );
}
