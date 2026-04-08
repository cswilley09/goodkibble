'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthContext';
import SignUpButton from '../components/SignUpButton';
import RecallsNav from '../components/RecallsNav';
import CompareBubble from '../components/CompareBubble';

const FREE_FEATURES = [
  'Search any food & see the score',
  'Score breakdown (8 categories)',
  'Guaranteed analysis (DMB)',
  'Basic ingredient list',
  'Compare up to 2 foods',
  '1 dog profile',
];

const PRO_ALERT_FEATURES = [
  'Recall alerts sent to your email',
  'Score change notifications',
  'Algorithm update alerts',
];

const PRO_OTHER_FEATURES = [
  'Ingredient deep-dive with quality signals',
  'Ingredient tooltips & sourcing info',
  'Compare unlimited foods side-by-side',
  'Save unlimited comparisons',
  'Up to 5 dog profiles',
  'Early access to new features',
  'Ad-free experience',
];

const FAQS = [
  { q: 'What are recall alerts?', a: "When the FDA issues a recall on any food you or your dogs are connected to, we'll email you immediately. No more checking recall databases manually." },
  { q: 'What are score change notifications?', a: "When we update our scoring methodology based on new research, or when a manufacturer changes their formula and the score changes, we'll let you know which of your saved foods were affected." },
  { q: 'Can I cancel anytime?', a: "Yes. Cancel from your account settings and you'll keep Pro access until the end of your billing period. No questions asked." },
  { q: 'Is my data shared?', a: "Never. We don't sell data to pet food companies or anyone else. Your dog profiles and food preferences stay private." },
];

export default function ProPage() {
  const router = useRouter();
  const { session, isPro, loading } = useAuth();
  const [billing, setBilling] = useState('yearly');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function handleUpgrade() {
    if (!session?.user) {
      router.push('/signup?redirect=pro');
      return;
    }
    if (isPro) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email, plan: billing }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error + (data.debug ? '\n\nDebug: ' + JSON.stringify(data.debug) : ''));
    } catch { alert('Something went wrong. Please try again.'); }
    setCheckoutLoading(false);
  }

  const price = billing === 'yearly' ? '$29' : '$2.99';
  const period = billing === 'yearly' ? '/year' : '/month';
  const subtitle = billing === 'yearly' ? "That\u2019s just $2.42/month \u2014 less than a dog treat" : 'Cancel anytime';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <a href="/discover" className="nav-discover-link" style={{ fontSize: 14, fontWeight: 600, color: '#5a5248', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textDecoration: 'none' }}>Discover Foods</a>
          <RecallsNav />
          <CompareBubble />
          <SignUpButton />
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px', textAlign: 'center' }}>
        {/* Hero */}
        <span style={{
          display: 'inline-block', background: 'linear-gradient(135deg, #C9A84C, #d4b65e)',
          color: '#fff', padding: '4px 12px', borderRadius: 100,
          fontSize: 11, fontWeight: 700, marginBottom: 20,
          fontFamily: "'DM Sans', sans-serif",
        }}>{'\u2605'} PRO</span>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 5vw, 44px)',
          fontWeight: 900, color: '#1a1612', margin: '0 0 16px', letterSpacing: -1,
        }}>Know more. Choose better.</h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: '#5a5248',
          maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.6,
        }}>
          GoodKibble Pro gives you the full picture &mdash; ingredient intelligence, unlimited comparisons, recall alerts, and score change notifications.
        </p>

        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', marginBottom: 36, position: 'relative' }}>
          <button onClick={() => setBilling('monthly')} style={{
            padding: '10px 24px', borderRadius: '100px 0 0 100px', border: 'none',
            background: billing === 'monthly' ? '#1a1612' : 'transparent',
            color: billing === 'monthly' ? '#faf8f4' : '#8a7e72',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            ...(billing !== 'monthly' ? { border: '1.5px solid #ede8df', borderRight: 'none' } : {}),
          }}>Monthly</button>
          <button onClick={() => setBilling('yearly')} style={{
            padding: '10px 24px', borderRadius: '0 100px 100px 0', border: 'none',
            background: billing === 'yearly' ? '#1a1612' : 'transparent',
            color: billing === 'yearly' ? '#faf8f4' : '#8a7e72',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", position: 'relative',
            ...(billing !== 'yearly' ? { border: '1.5px solid #ede8df', borderLeft: 'none' } : {}),
          }}>
            Yearly
            <span style={{
              position: 'absolute', top: -10, right: -10,
              background: '#639922', color: '#fff', padding: '2px 8px',
              borderRadius: 100, fontSize: 10, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
            }}>Save 38%</span>
          </button>
        </div>

        {/* Plan Cards */}
        <div className="pro-cards" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 760, margin: '0 auto 48px', textAlign: 'left' }}>
          {/* Free Card */}
          <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #ede8df', padding: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a7e72', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Free</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 900, color: '#1a1612' }}>$0</span>
            </div>
            <div style={{ fontSize: 13, color: '#8a7e72', marginBottom: 24, fontFamily: "'DM Sans', sans-serif" }}>Free forever</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {FREE_FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: '#3d352b' }}>
                  <span style={{ color: '#639922', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{'\u2713'}</span>
                  {f}
                </div>
              ))}
            </div>
            {!isPro && (
              <div style={{
                padding: '12px 0', borderRadius: 100, border: '1.5px solid #ede8df',
                textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#8a7e72',
                fontFamily: "'DM Sans', sans-serif",
              }}>Current Plan</div>
            )}
          </div>

          {/* Pro Card */}
          <div style={{ background: '#1a1612', borderRadius: 24, border: '2px solid #C9A84C', padding: 32, position: 'relative' }}>
            <span style={{
              position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
              background: '#C9A84C', color: '#fff', padding: '4px 16px',
              borderRadius: 100, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
              fontFamily: "'DM Sans', sans-serif",
            }}>MOST POPULAR</span>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#C9A84C', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Pro</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 900, color: '#faf8f4' }}>{price}</span>
              <span style={{ fontSize: 14, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>{period}</span>
            </div>
            <div style={{ fontSize: 13, color: '#8a7e72', marginBottom: 24, fontFamily: "'DM Sans', sans-serif" }}>{subtitle}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {/* "Everything in Free, plus:" */}
              <div style={{ fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: '#C9A84C', fontWeight: 700 }}>Everything in Free, plus:</div>

              {/* Group 1: Peace of mind */}
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#C9A84C', fontFamily: "'DM Sans', sans-serif" }}>Works while you sleep</div>
              <div style={{ border: '1px solid rgba(201,168,76,0.3)', borderRadius: 12, padding: '14px 16px', background: 'rgba(201,168,76,0.04)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PRO_ALERT_FEATURES.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.8)' }}>
                    <span style={{ color: '#639922', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{'\u2713'}</span>
                    {f}
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: '#ede8df', margin: '4px 0' }} />

              {/* Group 2: Power tools */}
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#C9A84C', fontFamily: "'DM Sans', sans-serif" }}>For the deep divers</div>
              {PRO_OTHER_FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.8)' }}>
                  <span style={{ color: '#639922', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{'\u2713'}</span>
                  {f}
                </div>
              ))}
            </div>
            {isPro ? (
              <div style={{
                padding: '14px 0', borderRadius: 100, textAlign: 'center',
                fontSize: 15, fontWeight: 700, color: '#639922',
                fontFamily: "'DM Sans', sans-serif",
              }}>You&rsquo;re on Pro {'\u2713'}</div>
            ) : (
              <button onClick={handleUpgrade} disabled={checkoutLoading} style={{
                width: '100%', padding: 14, borderRadius: 100, border: 'none',
                background: '#C9A84C', color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                opacity: checkoutLoading ? 0.6 : 1,
              }}>{checkoutLoading ? 'Loading...' : 'Get GoodKibble Pro \u2192'}</button>
            )}
          </div>
        </div>



        {/* FAQ */}
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'left' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: '#1a1612', textAlign: 'center', marginBottom: 24 }}>Common questions</h2>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ padding: '16px 0', borderTop: i === 0 ? 'none' : '1px solid #ede8df' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1612', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>{faq.q}</div>
              <div style={{ fontSize: 13, color: '#5a5248', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-discover-link { display: none !important; }
          .pro-cards { grid-template-columns: 1fr !important; }
          .pro-cards > div:nth-child(2) { order: -1; }
        }
      `}</style>
    </div>
  );
}
