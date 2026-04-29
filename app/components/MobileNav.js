'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

/**
 * Mobile-only nav: sticky 3-element top bar (logo / avatar / hamburger) plus a
 * right-sliding drawer with the rest of the nav. Hidden at desktop widths
 * via the @media block at the bottom — desktop nav (.site-nav) is the source
 * of truth for ≥ 768px.
 */
export default function MobileNav() {
  const router = useRouter();
  const { session, userProfile, isPro, signOut, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hamburgerRef = useRef(null);
  const drawerRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Body scroll lock + ESC + focus trap while open
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the drawer
    requestAnimationFrame(() => closeBtnRef.current?.focus());

    const handleKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key !== 'Tab') return;
      const root = drawerRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKey);
      // Restore focus to hamburger after close
      hamburgerRef.current?.focus();
    };
  }, [open]);

  const closeAndNav = useCallback((href) => () => {
    setOpen(false);
    router.push(href);
  }, [router]);

  const handleSignOut = useCallback(async () => {
    setOpen(false);
    await signOut();
    router.push('/');
  }, [signOut, router]);

  // Hide until mounted to avoid auth-flash mismatch
  if (!mounted) return null;

  const isLoggedIn = !!session?.user;
  const initial = userProfile?.first_name?.charAt(0)?.toUpperCase() || '';
  const avatarHref = isLoggedIn ? '/profile' : '/signup';

  return (
    <>
      {/* ─── Sticky top bar ─── */}
      <header className="gk-mobilenav" style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#faf8f4',
        padding: '12px 16px',
        display: 'none', /* shown via media query below */
        justifyContent: 'space-between', alignItems: 'center',
        borderBottom: scrolled ? '0.5px solid rgba(26,22,18,0.12)' : '0.5px solid transparent',
        transition: 'border-color 0.25s',
      }}>
        {/* Logo */}
        <Link href="/" style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 24, fontWeight: 800, color: '#1a1612',
          letterSpacing: -0.3, textDecoration: 'none',
        }}>
          Good<span style={{ color: '#E5A93D' }}>Kibble</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Avatar */}
          <Link href={avatarHref} aria-label={isLoggedIn ? 'Account' : 'Sign up'} style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#C68A1B', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
            fontFamily: "'Inter', sans-serif",
            position: 'relative', flexShrink: 0,
            ...(isPro ? { boxShadow: '0 0 0 2px #C68A1B, 0 0 8px rgba(198,138,27,0.3)' } : {}),
          }}>
            {isLoggedIn && initial ? initial : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
              </svg>
            )}
            {isLoggedIn && isPro && (
              <span style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 14, height: 14, borderRadius: '50%',
                background: '#C68A1B', color: '#fff', fontSize: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #faf8f4',
              }}>★</span>
            )}
          </Link>

          {/* Hamburger */}
          <button
            ref={hamburgerRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="gk-mobilenav-drawer"
            style={{
              width: 44, height: 44, padding: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1612" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>
      </header>

      {/* ─── Backdrop + Drawer ─── */}
      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className="gk-mobilenav-backdrop"
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(26,22,18,0.4)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 200ms ease',
        }}
      />

      <aside
        id="gk-mobilenav-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        className="gk-mobilenav-drawer"
        style={{
          position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 70,
          width: '85vw', maxWidth: 360,
          background: '#faf8f4',
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 200ms ease',
          boxShadow: open ? '-12px 0 32px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        {/* Drawer header — close button */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          padding: '12px 16px', minHeight: 56,
        }}>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            style={{
              width: 44, height: 44, padding: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1612" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {[
            { label: 'Discover Foods', href: '/discover' },
            { label: 'Recalls', href: '/recalls' },
            { label: 'Compare', href: '/compare' },
          ].map((it, i, arr) => (
            <Link
              key={it.href}
              href={it.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center',
                minHeight: 56, padding: '0 24px',
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 18, color: '#1a1612', textDecoration: 'none',
                borderBottom: i < arr.length - 1 ? '0.5px solid rgba(26,22,18,0.08)' : 'none',
              }}
            >{it.label}</Link>
          ))}
        </nav>

        {/* Footer (auth-aware) */}
        <div style={{ padding: '32px 24px 24px', borderTop: '0.5px solid rgba(26,22,18,0.08)' }}>
          {!isPro && (
            <Link
              href="/pro"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', minHeight: 48, padding: '0 24px',
                background: '#C68A1B', color: '#1a1612',
                borderRadius: 100, textDecoration: 'none',
                fontFamily: "'Inter', sans-serif",
                fontSize: 15, fontWeight: 700,
              }}
            >Get Pro</Link>
          )}

          <div style={{ marginTop: isPro ? 0 : 16, textAlign: 'center' }}>
            {isLoggedIn ? (
              <>
                {isPro && (
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'inline-block', padding: '8px 0',
                      color: 'rgba(26,22,18,0.7)', textDecoration: 'none',
                      fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500,
                    }}
                  >Manage subscription</Link>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    display: 'block', margin: isPro ? '8px auto 0' : '0 auto',
                    padding: '8px 0', background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'rgba(26,22,18,0.7)',
                    fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500,
                  }}
                >Sign out</button>
              </>
            ) : (
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: 14,
                color: 'rgba(26,22,18,0.7)',
              }}>
                Already have an account?{' '}
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  style={{ color: 'rgba(26,22,18,0.7)', textDecoration: 'underline', fontWeight: 600 }}
                >Sign in</Link>
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* ─── Visibility rules ─── */}
      <style>{`
        @media (max-width: 768px) {
          .gk-mobilenav { display: flex !important; }
          /* Hide existing per-page top navs at mobile so we don't double up */
          .site-nav,
          .nav-bar { display: none !important; }
        }
        @media (min-width: 769px) {
          .gk-mobilenav,
          .gk-mobilenav-backdrop,
          .gk-mobilenav-drawer { display: none !important; }
        }
      `}</style>
    </>
  );
}
