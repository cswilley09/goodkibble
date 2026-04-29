export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#faf8f4' }}>
      {/* Nav skeleton */}
      <nav className="nav-bar" style={{
        position: 'sticky', top: 0, zIndex: 50, background: '#faf8f4',
        padding: '14px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid transparent',
      }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontWeight: 800, color: '#1a1612', letterSpacing: -0.5 }}>
          Good<span style={{ color: '#C68A1B' }}>Kibble</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#5a5248', fontFamily: "'Inter', sans-serif" }}>Discover Foods</span>
        </div>
      </nav>

      {/* Hero skeleton */}
      <div style={{ padding: '48px 24px 36px', maxWidth: 680, width: '100%', margin: '0 auto', textAlign: 'center', boxSizing: 'border-box' }}>
        {/* Tagline */}
        <div style={{ width: 200, height: 14, borderRadius: 8, background: '#ede8df', margin: '0 auto 16px' }} />
        {/* Heading line 1 */}
        <div style={{ width: 380, maxWidth: '80%', height: 44, borderRadius: 10, background: '#ede8df', margin: '0 auto 10px' }} />
        {/* Heading line 2 */}
        <div style={{ width: 320, maxWidth: '70%', height: 44, borderRadius: 10, background: '#ede8df', margin: '0 auto 20px' }} />
        {/* Subtitle */}
        <div style={{ width: 440, maxWidth: '90%', height: 16, borderRadius: 8, background: '#ede8df', margin: '0 auto 32px' }} />
        {/* Search bar */}
        <div style={{
          maxWidth: 520, margin: '0 auto', height: 58, borderRadius: 20,
          background: '#fff',
          boxShadow: '0 8px 40px rgba(26,22,18,0.12), 0 2px 8px rgba(26,22,18,0.06)',
        }} />
        {/* Browse link */}
        <div style={{ width: 260, height: 14, borderRadius: 8, background: '#ede8df', margin: '16px auto 0' }} />
      </div>

      {/* Marquee skeleton */}
      <div style={{ padding: '24px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 16, paddingLeft: 40 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{
              width: 240, height: 160, borderRadius: 20, background: '#fff',
              border: '1px solid #ede8df', flexShrink: 0,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
