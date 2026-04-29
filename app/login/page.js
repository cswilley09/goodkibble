'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
import { useAuth } from '../components/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, show a link to profile instead of redirecting
  const isLoggedIn = session?.user;

  function isValidEmail(e) {
    const a = e.indexOf('@');
    if (a < 1) return false;
    const after = e.slice(a + 1);
    return after.includes('.') && after.indexOf('.') < after.length - 1;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValidEmail(email.trim())) return;
    setLoading(true);
    setError('');
    try {
      const { error: otpError } = await getSupabase().auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin + '/profile' },
      });
      if (otpError) throw new Error(otpError.message);
      setSent(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function resendEmail() {
    setLoading(true);
    await getSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + '/profile' },
    });
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE4' }}>
      {/* Nav */}
      <nav className="nav-bar" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid rgba(28,24,20,0.08)',
        background: '#F4EFE4', position: 'sticky', top: 0, zIndex: 40,
      }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 800, color: '#1C1814', letterSpacing: -0.5 }}>GoodKibble</span>
        </a>
      </nav>

      <div style={{ maxWidth: 500, margin: '0 auto', padding: '60px 24px 80px' }}>
        {isLoggedIn ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{'\u{2705}'}</div>
            <h1 className="page-title" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontWeight: 800, color: '#1C1814', marginBottom: 8 }}>You&rsquo;re already signed in!</h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(28,24,20,0.60)', marginBottom: 24 }}>
              You&rsquo;re logged in as <strong style={{ color: '#C8941F' }}>{session.user.email}</strong>
            </p>
            <a href="/profile" style={{ padding: '14px 36px', borderRadius: 100, background: '#1C1814', color: '#F4EFE4', fontSize: 16, fontWeight: 700, textDecoration: 'none', fontFamily: "'Inter', sans-serif" }}>Go to Profile &rarr;</a>
          </div>
        ) : !sent ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h1 className="page-title" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, fontWeight: 800, color: '#1C1814', margin: '0 0 8px', letterSpacing: -0.5 }}>
                Welcome back
              </h1>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(28,24,20,0.60)' }}>
                Enter your email and we&rsquo;ll send you a sign-in link.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="your@email.com"
                style={{
                  width: '100%', padding: '14px 18px', borderRadius: 14,
                  border: '1.5px solid rgba(28,24,20,0.08)', fontSize: 16, background: '#fff',
                  fontFamily: "'Inter', sans-serif", outline: 'none',
                  color: '#1C1814', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#C8941F')}
                onBlur={e => (e.target.style.borderColor = 'rgba(28,24,20,0.08)')}
              />

              {error && (
                <p style={{ fontSize: 13, color: '#b5483a', marginTop: 8, fontFamily: "'Inter', sans-serif" }}>{error}</p>
              )}

              <button type="submit" disabled={!isValidEmail(email.trim()) || loading} style={{
                width: '100%', padding: 14, borderRadius: 100, marginTop: 16,
                background: isValidEmail(email.trim()) ? '#1C1814' : 'rgba(28,24,20,0.08)',
                color: isValidEmail(email.trim()) ? '#F4EFE4' : 'rgba(28,24,20,0.40)',
                fontSize: 16, fontWeight: 700, border: 'none',
                cursor: isValidEmail(email.trim()) ? 'pointer' : 'default',
                fontFamily: "'Inter', sans-serif",
                opacity: loading ? 0.6 : 1,
                transition: 'background 0.2s, color 0.2s',
              }}>
                {loading ? 'Sending...' : 'Send Sign-In Link'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 24, fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(28,24,20,0.60)' }}>
              Don&rsquo;t have an account?{' '}
              <a href="/signup" style={{ color: '#C8941F', fontWeight: 600, textDecoration: 'none' }}>Sign up &rarr;</a>
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f7efd8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>{'\u2709\uFE0F'}</div>
            <h1 className="page-title" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 800, color: '#1C1814', margin: '0 0 8px', letterSpacing: -0.5 }}>
              Check your email!
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: 'rgba(28,24,20,0.60)', lineHeight: 1.6, marginBottom: 8 }}>
              We sent a sign-in link to <strong style={{ color: '#C8941F' }}>{email.trim()}</strong>.
              <br />Click it to log in.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(28,24,20,0.40)', marginBottom: 28 }}>
              Didn&rsquo;t get it? Check your spam folder, or wait a moment and try again.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button onClick={resendEmail} disabled={loading} style={{
                padding: '10px 24px', borderRadius: 100, background: 'transparent', color: 'rgba(28,24,20,0.60)',
                fontSize: 14, fontWeight: 600, border: '1.5px solid rgba(28,24,20,0.08)',
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                opacity: loading ? 0.6 : 1,
              }}>Resend Email</button>
              <button onClick={() => { setSent(false); setEmail(''); }} style={{
                padding: '10px 24px', borderRadius: 100, background: 'transparent', color: '#C8941F',
                fontSize: 14, fontWeight: 600, border: 'none',
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}>Try a different email</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
