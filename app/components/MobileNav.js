'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

const HAIRLINE = '1px solid rgba(28,24,20,0.10)';

const navItemStyle = {
  display: 'flex', alignItems: 'center',
  padding: '18px 24px',
  fontFamily: "'Instrument Serif', Georgia, serif",
  fontSize: 22, fontWeight: 400, lineHeight: 1.2, color: '#1C1814',
  textDecoration: 'none',
  borderBottom: HAIRLINE,
};

const accountItemStyle = {
  display: 'flex', alignItems: 'center',
  width: '100%', padding: '18px 24px',
  fontFamily: "'Inter', sans-serif",
  fontSize: 18, fontWeight: 400, lineHeight: 1.2, color: '#1C1814',
  textDecoration: 'none',
  borderBottom: HAIRLINE,
};

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
        background: '#F4EFE4',
        padding: '12px 16px',
        display: 'none', /* shown via media query below */
        justifyContent: 'space-between', alignItems: 'center',
        borderBottom: scrolled ? '0.5px solid rgba(26,22,18,0.12)' : '0.5px solid transparent',
        transition: 'border-color 0.25s',
      }}>
        {/* Logo */}
        <Link href="/" style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 24, fontWeight: 800, color: '#1C1814',
          letterSpacing: -0.3, textDecoration: 'none',
        }}>
          Good<span style={{ color: '#C8941F' }}>Kibble</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Avatar */}
          <Link href={avatarHref} aria-label={isLoggedIn ? 'Account' : 'Sign up'} style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#C8941F', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
            fontFamily: "'Inter', sans-serif",
            position: 'relative', flexShrink: 0,
            ...(isPro ? { boxShadow: '0 0 0 2px #C8941F, 0 0 8px rgba(198,138,27,0.3)' } : {}),
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
                background: '#C8941F', color: '#fff', fontSize: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #F4EFE4',
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1C1814" strokeWidth="2" strokeLinecap="round">
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
          background: '#F4EFE4',
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 200ms ease',
          boxShadow: open ? '-12px 0 32px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        {/* Drawer header — close button (24px icon, 44px hit area) */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          padding: '20px 12px 0',
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1C1814" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        {/* Primary nav — Instrument Serif 22px, hairline dividers between items */}
        <nav style={{ marginTop: 32 }}>
          {[
            { label: 'Discover Foods', href: '/discover' },
            { label: 'Recalls',        href: '/recalls'  },
            { label: 'Compare',        href: '/compare'  },
          ].map((it, i, arr) => (
            <Link
              key={it.href}
              href={it.href}
              onClick={() => setOpen(false)}
              style={{
                ...navItemStyle,
                borderBottom: i < arr.length - 1 ? HAIRLINE : 'none',
              }}
            >{it.label}</Link>
          ))}
        </nav>

        {/* Account section — 32px above label, 8px below it, then items */}
        <div style={{ marginTop: 32 }}>
          <div style={{
            padding: '0 24px',
            fontFamily: "'Inter', sans-serif",
            fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'rgba(28,24,20,0.60)',
            marginBottom: 8,
          }}>Account</div>

          {isLoggedIn ? (
            <>
              {/* TODO: route — /saved and /settings don't exist yet, falling back to /profile */}
              <Link href="/profile" onClick={() => setOpen(false)} style={accountItemStyle}>Saved foods</Link>
              <Link href="/profile" onClick={() => setOpen(false)} style={accountItemStyle}>Settings</Link>
              <button
                type="button"
                onClick={handleSignOut}
                style={{ ...accountItemStyle, borderBottom: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
              >Sign out</button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              style={{ ...accountItemStyle, borderBottom: 'none' }}
            >Sign in</Link>
          )}
        </div>

        {/* Get Pro CTA pinned to bottom via margin-top: auto (single anchor) */}
        <div style={{ marginTop: 'auto', padding: '0 24px 32px' }}>
          {isPro ? (
            <div style={{ textAlign: 'center' }}>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                style={{
                  display: 'inline-block', padding: '8px 0',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14, fontWeight: 500,
                  color: 'rgba(28,24,20,0.60)',
                  textDecoration: 'none',
                }}
              >Manage subscription →</Link>
            </div>
          ) : (
            <>
              <div style={{
                textAlign: 'center',
                fontFamily: "'Inter', sans-serif",
                fontSize: 14, lineHeight: 1.5,
                color: 'rgba(28,24,20,0.60)',
                marginBottom: 12,
              }}>
                Unlimited compares, recall alerts, and more.
              </div>
              <Link
                href="/pro"
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', height: 56,
                  background: '#C8941F', color: '#1C1814',
                  borderRadius: 9999, textDecoration: 'none',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 15, fontWeight: 600,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#1C1814" aria-hidden>
                  <path d="M12 2l2.6 7.4 7.4.6-5.7 4.8 1.7 7.2L12 17.8 5.9 22l1.7-7.2L2 10l7.4-.6L12 2z" />
                </svg>
                Get Pro
              </Link>
            </>
          )}
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
