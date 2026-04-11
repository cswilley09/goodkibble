'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

export default function SignUpButton() {
  const router = useRouter();
  const { session, userProfile, loading } = useAuth();
  const [legacyName, setLegacyName] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!session?.user) {
      const n = localStorage.getItem('gk_user_name');
      if (n) setLegacyName(n);
    }
  }, [session]);

  if (loading || !mounted) return null;

  const isUserPro = !!userProfile?.is_pro;

  // Logged in via Supabase auth
  if (session?.user && userProfile?.first_name) {
    const initial = userProfile.first_name.charAt(0).toUpperCase();
    return (
      <>
        {!isUserPro && (
          <span onClick={() => router.push('/pro')} className="nav-pro-link" style={{
            fontSize: 14, fontWeight: 600, color: '#C9A84C', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 3,
            transition: 'opacity 0.2s', flexShrink: 0,
          }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >{'\u2605'} Pro</span>
        )}
        <div
          onClick={() => router.push('/profile')}
          className="signup-btn-circle"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#C9A84C', color: '#fff',
            fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, position: 'relative',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'opacity 0.2s',
            ...(isUserPro ? { boxShadow: '0 0 0 2px #C9A84C, 0 0 8px rgba(201,168,76,0.3)' } : {}),
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {initial}
          {isUserPro && (
            <span style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 14, height: 14, borderRadius: '50%',
              background: '#C9A84C', color: '#fff', fontSize: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #faf8f4',
            }}>{'\u2605'}</span>
          )}
        </div>
        <style>{`
          @media (max-width: 768px) {
            .nav-pro-link { display: none !important; }
          }
        `}</style>
      </>
    );
  }

  // Legacy localStorage fallback
  if (legacyName) {
    const initial = legacyName.charAt(0).toUpperCase();
    return (
      <div
        onClick={() => router.push('/profile')}
        className="signup-btn-circle"
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#C9A84C', color: '#fff',
          fontSize: 14, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >{initial}</div>
    );
  }

  // Logged out — Pro link + pill on desktop, person icon on mobile
  return (
    <>
      <span onClick={() => router.push('/pro')} className="nav-pro-link" style={{
        fontSize: 14, fontWeight: 600, color: '#C9A84C', cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 3,
        transition: 'opacity 0.2s', flexShrink: 0,
      }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >{'\u2605'} Pro</span>
      <div
        onClick={() => router.push('/signup')}
        className="signup-btn-desktop"
        style={{
          padding: '8px 18px', borderRadius: 100,
          background: '#C9A84C', color: '#fff',
          fontSize: 13, fontWeight: 600,
          cursor: 'pointer', flexShrink: 0,
          fontFamily: "'DM Sans', sans-serif",
          whiteSpace: 'nowrap',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        Sign Up
      </div>
      <div
        onClick={() => router.push('/signup')}
        className="signup-btn-mobile"
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: '#C9A84C', color: '#fff',
          display: 'none', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        </svg>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .signup-btn-desktop { display: none !important; }
          .signup-btn-mobile { display: flex !important; }
          .signup-btn-circle { width: 32px !important; height: 32px !important; font-size: 13px !important; }
          .nav-pro-link { display: none !important; }
        }
      `}</style>
    </>
  );
}
