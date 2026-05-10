'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RecallsNav from './RecallsNav';
import CompareBubble from './CompareBubble';
import SignUpButton from './SignUpButton';

// Canonical desktop nav. Hidden < 769px via the global `.site-nav` rule in
// MobileNav.js — MobileNav takes over on mobile. Keep this component the
// single source of truth so every page renders the same header.
export default function SiteNav() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className="site-nav" style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: '#F4EFE4',
      padding: '14px 40px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderBottom: scrolled ? '1px solid rgba(28,24,20,0.08)' : '1px solid transparent',
      boxShadow: scrolled ? '0 2px 12px rgba(26,22,18,0.04)' : 'none',
      transition: 'all 0.3s',
    }}>
      <div
        style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontWeight: 800, color: '#1C1814', cursor: 'pointer' }}
        onClick={() => router.push('/')}
      >
        Good<span style={{ color: '#C8941F' }}>Kibble</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span
          className="nav-discover-link"
          onClick={() => router.push('/discover')}
          style={{
            fontSize: 14, fontWeight: 600, color: '#5a5248', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif", transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.color = '#1C1814')}
          onMouseLeave={(e) => (e.target.style.color = '#5a5248')}
        >Discover Foods</span>
        <RecallsNav />
        <CompareBubble />
        <SignUpButton />
      </div>
    </nav>
  );
}
