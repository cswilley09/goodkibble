'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpButton() {
  const router = useRouter();
  const [userName, setUserName] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const name = localStorage.getItem('gk_user_name');
    if (name) setUserName(name);

    // Listen for storage changes (e.g. signup in same tab)
    function onStorage() {
      const n = localStorage.getItem('gk_user_name');
      setUserName(n || null);
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener('gk_profile_updated', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('gk_profile_updated', onStorage);
    };
  }, []);

  if (!mounted) return null;

  if (userName) {
    const initial = userName.charAt(0).toUpperCase();
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
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        {initial}
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => router.push('/signup')}
        className="signup-btn-pill"
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
      <style>{`
        @media (max-width: 768px) {
          .signup-btn-pill { padding: 7px 14px !important; font-size: 12px !important; }
        }
      `}</style>
    </>
  );
}
