'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import SearchBox from './components/SearchBox';
import CompareBubble from './components/CompareBubble';
import SignUpButton from './components/SignUpButton';
import RecallsNav from './components/RecallsNav';
import KibbleAnalyzer from './components/KibbleAnalyzer';
import { useRouter } from 'next/navigation';

/* ═══════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════ */

// 3-tier score → token-driven color (good / mid / poor).
function getScoreColor(score) {
  if (score >= 80) return 'var(--color-score-good)';
  if (score >= 50) return 'var(--color-score-mid)';
  return 'var(--color-score-poor)';
}

function getScoreTier(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Great';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Poor';
}

function useFadeIn(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

const fade = (visible, delay = 0) => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(24px)',
  transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
});

/* ═══════════════════════════════════════
   SECTION 2: PRODUCT CARD MARQUEE
   ═══════════════════════════════════════ */

function MarqueeCard({ p, onClick }) {
  const [imgErr, setImgErr] = useState(false);
  const color = getScoreColor(p.quality_score);
  return (
    <div onClick={() => onClick(p)} className="marquee-card" style={{
      width: 240, flexShrink: 0,
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      border: 'var(--border-default)',
      cursor: 'pointer',
      transition: 'transform 0.25s, border-color 0.25s',
      overflow: 'hidden',
    }}>
      <div style={{ height: 140, background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {p.image_url && !imgErr ? (
          <img src={p.image_url} alt="" onError={() => setImgErr(true)}
            style={{ maxHeight: 110, maxWidth: '70%', objectFit: 'contain' }} />
        ) : (
          <span style={{ fontSize: 40, opacity: 0.3 }}>🐕</span>
        )}
        {p.quality_score != null && (
          <div style={{
            position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)',
            width: 48, height: 48, borderRadius: 'var(--radius-pill)',
            background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid var(--color-surface)', zIndex: 1,
          }}>
            <span className="t-body" style={{ fontWeight: 500, color: 'var(--color-surface)' }}>{p.quality_score}</span>
          </div>
        )}
      </div>
      <div style={{ padding: 'var(--space-8) var(--space-4) var(--space-4)', textAlign: 'center' }}>
        <div className="t-micro" style={{ color: 'var(--color-ink-60)', marginBottom: 'var(--space-1)' }}>{p.brand}</div>
        <div className="t-display-sm" style={{ color: 'var(--color-ink)', marginBottom: 'var(--space-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
        {p.primary_protein && (
          <div className="t-body-sm" style={{ color: 'var(--color-ink-60)', marginBottom: 'var(--space-3)' }}>
            Primary Protein: {p.primary_protein}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {p.protein_dmb != null && (
            <span className="t-micro" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-ink-60)', background: 'var(--color-sand)', borderRadius: 'var(--radius-pill)', padding: '4px 8px' }}>
              <span style={{ width: 6, height: 6, borderRadius: 'var(--radius-pill)', background: 'var(--color-score-good)', flexShrink: 0 }} />{(Math.round(p.protein_dmb * 10) / 10)}%
            </span>
          )}
          {p.fat_dmb != null && (
            <span className="t-micro" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-ink-60)', background: 'var(--color-sand)', borderRadius: 'var(--radius-pill)', padding: '4px 8px' }}>
              <span style={{ width: 6, height: 6, borderRadius: 'var(--radius-pill)', background: 'var(--color-marigold)', flexShrink: 0 }} />{(Math.round(p.fat_dmb * 10) / 10)}%
            </span>
          )}
          {p.carbs_dmb != null && (
            <span className="t-micro" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-ink-60)', background: 'var(--color-sand)', borderRadius: 'var(--radius-pill)', padding: '4px 8px' }}>
              {/* TODO: token — carbs/fiber data-viz colors are not yet in the token system */}
              <span style={{ width: 6, height: 6, borderRadius: 'var(--radius-pill)', background: '#378ADD', flexShrink: 0 }} />{(Math.round(p.carbs_dmb * 10) / 10)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductMarquee({ onCardClick, products: initialProducts }) {
  const [products] = useState(() => {
    if (!initialProducts || initialProducts.length === 0) return [];
    const withImage = initialProducts.filter(d => d.image_url && d.image_url.trim() !== '');
    const pool = withImage.length >= 6 ? withImage : initialProducts;
    return pool.sort(() => Math.random() - 0.5).slice(0, 6);
  });

  if (products.length === 0) return null;
  const doubled = [...products, ...products];

  return (
    <section className="marquee-section" style={{
      paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)',
      overflow: 'hidden', position: 'relative',
    }}>
      <div className="gk-container" style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
        <h2 className="t-display-md" style={{ color: 'var(--color-ink)', marginBottom: 'var(--space-2)' }}>See how popular brands stack up</h2>
        <p className="t-body" style={{ color: 'var(--color-ink-60)', maxWidth: 480, margin: '0 auto' }}>Every kibble scored 0–100 across nutrition and ingredient quality</p>
      </div>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 64, zIndex: 2, background: 'linear-gradient(to right, var(--color-paper), transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 64, zIndex: 2, background: 'linear-gradient(to left, var(--color-paper), transparent)', pointerEvents: 'none' }} />
      <div className="marquee-track" style={{ display: 'flex', gap: 'var(--space-4)', width: 'max-content', animation: 'marquee 45s linear infinite' }}>
        {doubled.map((p, i) => <MarqueeCard key={`${p.id}-${i}`} p={p} onClick={onCardClick} />)}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   SECTION 3: WHY GOODKIBBLE (DARK EDITORIAL)
   ═══════════════════════════════════════ */

function WhyStrip() {
  const [ref, visible] = useFadeIn(0.2);
  return (
    <section ref={ref} style={{
      background: 'var(--color-ink)',
      paddingTop: 'var(--space-24)', paddingBottom: 'var(--space-24)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Soft marigold glow */}
      <div aria-hidden style={{
        position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 500, borderRadius: 'var(--radius-pill)',
        background: 'radial-gradient(circle, rgba(200,148,31,0.08) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div className="gk-container" style={{ position: 'relative', ...fade(visible) }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
          <div className="t-eyebrow" style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
            color: 'var(--color-marigold)',
            marginBottom: 'var(--space-4)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 'var(--radius-pill)', background: 'var(--color-marigold)', animation: 'heroDot 1.5s ease-in-out infinite' }} />
            Why GoodKibble
          </div>
          <h2 className="t-display-lg" style={{ color: 'var(--color-paper)' }}>
            Built on data,{' '}
            <em style={{ color: 'var(--color-marigold)', fontStyle: 'italic' }}>not marketing.</em>
          </h2>
        </div>
        <div className="why-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-12)' }}>
          {VALUE_PROPS.map((vp, i) => (
            <div key={vp.title} style={{
              textAlign: 'left',
              paddingLeft: i === 0 ? 0 : 'var(--space-8)',
              borderLeft: i === 0 ? 'none' : '1px solid rgba(244,239,228,0.08)',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: 'rgba(200,148,31,0.10)',
                border: '1px solid rgba(200,148,31,0.20)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 'var(--space-6)',
              }}>{vp.icon}</div>
              <div className="t-display-sm" style={{ color: 'var(--color-paper)', marginBottom: 'var(--space-3)' }}>{vp.title}</div>
              <p className="t-body-sm" style={{ color: 'rgba(244,239,228,0.6)', margin: 0 }}>{vp.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   SECTION 4: SCORING VISUAL DEMO
   ═══════════════════════════════════════ */

// TODO: token — DEMO_CATS uses data-viz colors not yet promoted to tokens.
const DEMO_CATS = [
  { key: 'A_protein',         name: 'Protein',         max: 25, color: 'var(--color-score-good)' },
  { key: 'B_fat',              name: 'Fat',             max: 15, color: 'var(--color-marigold)' },
  { key: 'C_carbs',            name: 'Carbohydrates',   max: 15, color: '#378ADD' },
  { key: 'D_fiber',            name: 'Fiber',           max: 5,  color: '#7F77DD' },
  { key: 'E_protein_source',   name: 'Protein Sources', max: 15, color: 'var(--color-marigold)' },
  { key: 'F_preservatives',    name: 'Preservatives',   max: 10, color: 'var(--color-marigold)' },
  { key: 'G_additives',        name: 'Additives',       max: 5,  color: 'var(--color-marigold)' },
  { key: 'H_functional',       name: 'Functional',      max: 10, color: 'var(--color-marigold)' },
];

function AnimatedScore({ target, max, active, delay }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!active) { setDisplay(0); return; }
    const timeout = setTimeout(() => {
      const start = performance.now();
      const duration = 1600;
      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [active, target, delay]);
  return <>{display}/{max}</>;
}

const BAR_DELAYS = [0, 200, 400, 600, 850, 1050, 1250, 1450];

function ScoringDemo({ onNavigate }) {
  const sectionRef = useRef(null);
  const [demoProduct, setDemoProduct] = useState(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    fetch('/api/foods?featured=scoring-demo')
      .then(r => r.json())
      .then(data => {
        if (!data || data.length === 0) return;
        const valid = data.filter(d => d.score_breakdown && d.score_breakdown.categories);
        if (valid.length === 0) return;
        setDemoProduct(valid[Math.floor(Math.random() * valid.length)]);
      });
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setAnimated(true); obs.unobserve(el); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const cats = demoProduct?.score_breakdown?.categories;

  return (
    <section ref={sectionRef} style={{
      background: 'var(--color-paper)',
      paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)',
    }}>
      <div className="gk-container" style={{
        maxWidth: 820,
        opacity: demoProduct ? 1 : 0,
        transform: demoProduct ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}>
        <h2 className="t-display-md" style={{ color: 'var(--color-ink)', marginBottom: 'var(--space-3)', textAlign: 'center' }}>
          A score you can actually understand
        </h2>
        <p className="t-body-lg" style={{ color: 'var(--color-ink-60)', maxWidth: 560, margin: '0 auto', marginBottom: 'var(--space-12)', textAlign: 'center' }}>
          Here&apos;s how a real product breaks down across all 8 categories.
        </p>

        <div className="demo-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 'var(--space-12)', alignItems: 'center', marginBottom: 'var(--space-12)' }}>
          {/* Left: category bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {DEMO_CATS.map((cat, i) => {
              const earned = cats?.[cat.key]?.score ?? Math.round(cat.max * 0.8);
              const pct = Math.min((earned / cat.max) * 100, 100);
              const delay = BAR_DELAYS[i];
              return (
                <div key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 'var(--radius-pill)', background: cat.color, flexShrink: 0 }} />
                  <span className="t-label" style={{ color: 'var(--color-ink)', width: 120, flexShrink: 0 }}>{cat.name}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--color-ink-08)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 'var(--radius-pill)', background: cat.color,
                      width: animated ? `${pct}%` : '0%',
                      transition: `width 1600ms ease-out ${delay}ms`,
                    }} />
                  </div>
                  <span className="t-label" style={{ color: 'var(--color-ink-60)', width: 48, textAlign: 'right', flexShrink: 0 }}>
                    <AnimatedScore target={earned} max={cat.max} active={animated} delay={delay} />
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right: certification stamp */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            opacity: animated ? 0.78 : 0,
            transform: animated ? 'scale(1) rotate(-7deg)' : 'scale(0.7) rotate(-15deg)',
            transition: 'opacity 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 850ms, transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 850ms',
          }}>
            {demoProduct ? (
              <div style={{ width: 192, color: 'var(--color-marigold)' }}>
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="stampWorn" x="-5%" y="-5%" width="110%" height="110%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.065" numOctaves="5" seed="2" result="noise1"/>
                      <feDisplacementMap in="SourceGraphic" in2="noise1" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
                      <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed="5" result="fineNoise"/>
                      <feColorMatrix in="fineNoise" type="saturate" values="0" result="grayNoise"/>
                      <feComponentTransfer in="grayNoise" result="mask">
                        <feFuncA type="linear" slope="1.8" intercept="-0.45"/>
                      </feComponentTransfer>
                      <feComposite operator="in" in="displaced" in2="mask" result="worn"/>
                    </filter>
                    <path id="topArc" d="M 32,100 A 68,68 0 0,1 168,100" fill="none"/>
                    <path id="botArc" d="M 163,118 A 65,65 0 0,1 37,118" fill="none"/>
                  </defs>
                  <g filter="url(#stampWorn)" opacity="0.78">
                    <circle cx="100" cy="100" r="93" fill="none" stroke="currentColor" strokeWidth="4.5"/>
                    <circle cx="100" cy="100" r="81" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="100" cy="100" r="87" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,4" opacity="0.5"/>
                    <g fill="currentColor" fontSize="7" textAnchor="middle" fontFamily="serif">
                      <text x="100" y="14">★</text>
                      <text x="100" y="194">★</text>
                      <text x="9" y="104">★</text>
                      <text x="191" y="104">★</text>
                      <text x="27" y="33">★</text>
                      <text x="173" y="33">★</text>
                      <text x="27" y="174">★</text>
                      <text x="173" y="174">★</text>
                    </g>
                    <text fontSize="8" fontWeight="500" letterSpacing="3.5" fill="currentColor" textAnchor="middle" style={{ fontFamily: 'var(--font-sans)' }}>
                      <textPath href="#topArc" startOffset="50%">GOODKIBBLE RATED</textPath>
                    </text>
                    <text x="100" y="95" textAnchor="middle" fontSize="52" fill="currentColor" style={{ fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-2px' }}>
                      {demoProduct.quality_score}
                    </text>
                    <rect x="18" y="100" width="164" height="24" rx="2" fill="currentColor"/>
                    <text x="100" y="117" textAnchor="middle" fontSize="13" fontWeight="500" letterSpacing="5" fill="var(--color-paper)" style={{ fontFamily: 'var(--font-sans)' }}>
                      {getScoreTier(demoProduct.quality_score).toUpperCase()}
                    </text>
                    <text fontSize="7.5" fontWeight="500" letterSpacing="2" fill="currentColor" opacity="0.85" textAnchor="middle" style={{ fontFamily: 'var(--font-sans)' }}>
                      <textPath href="#botArc" startOffset="50%">★ CERTIFIED QUALITY ★</textPath>
                    </text>
                  </g>
                </svg>
              </div>
            ) : (
              <div style={{
                width: 192, height: 192, borderRadius: 'var(--radius-pill)', border: '4px solid var(--color-ink-08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 24, height: 24, border: '3px solid var(--color-ink-40)', borderTopColor: 'transparent', borderRadius: 'var(--radius-pill)', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => onNavigate('/how-we-score')}
            className="gk-tap"
            style={{
              minHeight: 48, padding: '0 var(--space-8)',
              borderRadius: 'var(--radius-pill)', border: 'none',
              background: 'var(--color-ink)', color: 'var(--color-paper)',
              fontFamily: 'var(--font-sans)', fontSize: 'var(--text-body-sm)', fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => { e.target.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.target.style.opacity = '1'; }}
          >See full methodology →</button>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   SECTION 5: BROWSE BY PROTEIN
   ═══════════════════════════════════════ */

const PROTEIN_ICONS = {
  Chicken: <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><ellipse cx="18" cy="17" rx="8" ry="10" stroke="currentColor" strokeWidth="1.5"/><path d="M10 15c-3 1-5 3-4 5s3 1 5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M26 15c3 1 5 3 4 5s-3 1-5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M14 26c-1 2-2 4-1 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M22 26c1 2 2 4 1 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M18 10v12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" strokeLinecap="round"/></svg>,
  Salmon: <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M4 18c0 0 4-8 14-8s14 8 14 8-4 8-14 8S4 18 4 18z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M30 18c2-3 4-4 4-4s-1 5-2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M30 18c2 3 4 4 4 4s-1-5-2-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="17.5" r="1.5" fill="currentColor"/></svg>,
  Lamb: <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><ellipse cx="18" cy="18" rx="11" ry="8" stroke="currentColor" strokeWidth="1.5"/><path d="M10 12c1-2 3-2 4 0s3 2 4 0 3-2 4 0 3 2 4 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><ellipse cx="28" cy="14" rx="4" ry="3.5" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Beef: <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><ellipse cx="17" cy="18" rx="12" ry="7" stroke="currentColor" strokeWidth="1.5"/><ellipse cx="30" cy="14" rx="4" ry="3.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="31" cy="13.5" r="0.8" fill="currentColor"/></svg>,
  Turkey: <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><ellipse cx="18" cy="20" rx="8" ry="6" stroke="currentColor" strokeWidth="1.5"/><circle cx="26" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="27" cy="6.5" r="0.8" fill="currentColor"/></svg>,
  Fish: <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M5 18c0 0 3.5-7 13-7s13 7 13 7-3.5 7-13 7S5 18 5 18z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M29 14l5-4v16l-5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="17.5" r="1.8" fill="currentColor"/></svg>,
};

function BrowseByProtein({ proteinCounts, onNavigate }) {
  const [ref, visible] = useFadeIn(0.15);
  const proteins = ['Chicken', 'Salmon', 'Lamb', 'Beef', 'Turkey', 'Fish'];
  return (
    <section ref={ref} style={{
      background: 'var(--color-surface)',
      paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)',
      borderTop: 'var(--border-default)', borderBottom: 'var(--border-default)',
    }}>
      <div className="gk-container gk-container--editorial" style={{ ...fade(visible) }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
          <h2 className="t-display-md" style={{ color: 'var(--color-ink)', marginBottom: 'var(--space-2)' }}>Browse by protein</h2>
          <p className="t-body" style={{ color: 'var(--color-ink-60)' }}>Find foods by your dog&apos;s preferred protein source</p>
        </div>
        <div className="protein-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
          {proteins.map((name) => (
            <a
              key={name}
              href={`/discover?protein=${encodeURIComponent(name)}`}
              className="protein-tile gk-tap"
              style={{
                padding: 'var(--space-6) var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-paper)',
                border: 'var(--border-default)',
                cursor: 'pointer',
                transition: 'transform 0.2s, border-color 0.2s',
                textAlign: 'center',
                color: 'var(--color-marigold)',
                textDecoration: 'none',
              }}
            >
              <div style={{ marginBottom: 'var(--space-2)', display: 'flex', justifyContent: 'center' }}>{PROTEIN_ICONS[name]}</div>
              <div className="t-label" style={{ color: 'var(--color-ink)', marginBottom: 'var(--space-1)' }}>{name}</div>
              <div className="t-body-sm" style={{ color: 'var(--color-ink-40)' }}>
                {proteinCounts[name] ? `${proteinCounts[name]} products` : '—'}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   VALUE PROPS (consumed by WhyStrip)
   ═══════════════════════════════════════ */

const VALUE_PROPS = [
  {
    title: 'Transparent Scoring',
    desc: 'Every score is broken down across 8 categories. See exactly why a food earned its rating.',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-marigold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>,
  },
  {
    title: 'Manufacturer-Sourced Data',
    desc: 'All nutritional data comes directly from the manufacturer. No guesswork, no retailer approximations.',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-marigold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  },
  {
    title: 'Apples-to-Apples Nutrition',
    desc: 'We strip moisture out of the equation so every food is compared on equal footing. Real nutrition, side by side.',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-marigold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/><circle cx="7" cy="6" r="2" fill="var(--color-marigold)"/><circle cx="17" cy="12" r="2" fill="var(--color-marigold)"/><circle cx="11" cy="18" r="2" fill="var(--color-marigold)"/></svg>,
  },
];

/* ═══════════════════════════════════════
   SECTION 6: FOOTER CTA
   ═══════════════════════════════════════ */

function FooterCTA({ onNavigate, onSelect }) {
  const [ref, visible] = useFadeIn(0.15);
  return (
    <section ref={ref} style={{
      background: 'var(--color-ink)',
      paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)',
      textAlign: 'center', overflow: 'hidden',
    }}>
      <div className="gk-container gk-container--editorial" style={{ maxWidth: 560, ...fade(visible) }}>
        <h2 className="t-display-md" style={{ color: 'var(--color-paper)', marginBottom: 'var(--space-3)' }}>
          Ready to see what&apos;s in your dog&apos;s food?
        </h2>
        <p className="t-body" style={{ color: 'rgba(244,239,228,0.6)', marginBottom: 'var(--space-8)' }}>Search any brand or browse our full database</p>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <SearchBox onSelect={onSelect} variant="hero" />
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/discover')}
          className="gk-tap"
          style={{
            minHeight: 48, padding: '0 var(--space-8)',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid rgba(244,239,228,0.2)',
            background: 'transparent', color: 'rgba(244,239,228,0.85)',
            fontFamily: 'var(--font-sans)', fontSize: 'var(--text-body-sm)', fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => { e.target.style.background = 'var(--color-marigold)'; e.target.style.color = 'var(--color-ink)'; e.target.style.borderColor = 'var(--color-marigold)'; }}
          onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'rgba(244,239,228,0.85)'; e.target.style.borderColor = 'rgba(244,239,228,0.2)'; }}
        >Discover 1,000+ dog foods →</button>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */

export default function Home({ marqueeData = [] }) {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  // Derive protein counts from server-provided marquee data
  const proteinCounts = {};
  marqueeData.forEach(r => { if (r.primary_protein) proteinCounts[r.primary_protein] = (proteinCounts[r.primary_protein] || 0) + 1; });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = useCallback((path) => router.push(path), [router]);
  const handleSelect = useCallback((food) => {
    if (food?.brand_slug && food?.slug) router.push(`/dog-food/${food.brand_slug}/${food.slug}`);
    else router.push(`/food/${food?.id || food}`);
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-paper)' }}>

      {/* ═══ NAV ═══ */}
      <nav className="site-nav" style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--color-paper)',
        padding: 'var(--space-3) var(--container-padding-desktop)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: scrolled ? 'var(--border-default)' : '1px solid transparent',
        transition: 'border-color 0.3s',
      }}>
        <a href="/" style={{ textDecoration: 'none', color: 'var(--color-ink)' }}>
          <span className="t-display-sm" style={{ letterSpacing: '-0.005em' }}>
            Good<span style={{ color: 'var(--color-marigold)' }}>Kibble</span>
          </span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <a className="nav-discover-link t-body-sm" href="/discover" style={{ color: 'var(--color-ink-60)', textDecoration: 'none', fontWeight: 500 }}>Discover Foods</a>
          <RecallsNav />
          <CompareBubble />
          <SignUpButton />
        </div>
      </nav>

      {/* ═══ 1. HERO ═══ */}
      <section className="hero-section gk-container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)', position: 'relative', zIndex: 30 }}>
        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 'var(--space-12)', alignItems: 'center' }}>
          {/* Left: text + search */}
          <div className="hero-text">
            <div className="t-eyebrow" style={{
              display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
              color: 'var(--color-marigold)', background: 'var(--color-sand)',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-pill)',
              marginBottom: 'var(--space-6)',
              animation: 'fadeUp 0.6s ease both',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: 'var(--radius-pill)', background: 'var(--color-marigold)', animation: 'heroDot 1.5s ease-in-out infinite' }} />
              1,042 foods · 187 brands · scored &amp; analyzed
            </div>
            <h1 className="t-display-xl" style={{ color: 'var(--color-ink)', marginBottom: 'var(--space-8)', animation: 'fadeUp 0.6s ease 0.1s both' }}>
              Look up any dog food.<br />
              <em style={{ color: 'var(--color-marigold)', fontStyle: 'italic' }}>See what&apos;s really in it.</em>
            </h1>
            <div className="hero-search-wrap" style={{ animation: 'fadeUp 0.6s ease 0.3s both', position: 'relative', zIndex: 60, maxWidth: 520, width: '100%' }}>
              <SearchBox onSelect={handleSelect} variant="hero" />
            </div>
            <div style={{ marginTop: 'var(--space-4)', animation: 'fadeUp 0.6s ease 0.35s both' }}>
              <a
                href="/discover"
                className="gk-tap t-body"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  minHeight: 44, padding: 'var(--space-2) 0',
                  color: 'var(--color-ink)', textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
              >or discover 1,000+ dog foods by filter →</a>
            </div>
          </div>

          {/* Right: KibbleAnalyzer (hidden below md via globals.css) */}
          <div className="hero-analyzer" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.8s ease 0.3s both' }}>
            <KibbleAnalyzer />
          </div>
        </div>
      </section>

      {/* ═══ 2. MARQUEE ═══ */}
      <ProductMarquee onCardClick={handleSelect} products={marqueeData} />

      {/* ═══ 3. WHY GOODKIBBLE (dark editorial strip) ═══ */}
      <WhyStrip />

      {/* ═══ 4. SCORING DEMO ═══ */}
      <ScoringDemo onNavigate={goTo} />

      {/* ═══ 5. BROWSE BY PROTEIN ═══ */}
      <BrowseByProtein proteinCounts={proteinCounts} onNavigate={goTo} />

      {/* ═══ 6. FOOTER CTA ═══ */}
      <FooterCTA onNavigate={goTo} onSelect={handleSelect} />

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        background: 'var(--color-ink)',
        borderTop: '1px solid rgba(244,239,228,0.08)',
        padding: 'var(--space-6) var(--container-padding-desktop)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)',
      }}>
        <div className="t-display-sm" style={{ color: 'var(--color-paper)' }}>
          Good<span style={{ color: 'var(--color-marigold)' }}>Kibble</span>
        </div>
        <div className="t-body-sm" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', color: 'rgba(244,239,228,0.5)', flexWrap: 'wrap' }}>
          <a href="/terms" style={{ color: 'rgba(244,239,228,0.5)', textDecoration: 'none' }}>Terms</a>
          <a href="/privacy" style={{ color: 'rgba(244,239,228,0.5)', textDecoration: 'none' }}>Privacy</a>
          <a href="/recalls" style={{ color: 'rgba(244,239,228,0.5)', textDecoration: 'none' }}>Recalls</a>
          <a href="/faq" style={{ color: 'rgba(244,239,228,0.5)', textDecoration: 'none' }}>FAQ</a>
          <span>© 2026 GoodKibble. Not affiliated with any dog food brand.</span>
        </div>
      </footer>

      {/* ═══ STYLES ═══ */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track:hover { animation-play-state: paused; }
        .marquee-card:hover { transform: translateY(-4px); border-color: var(--color-marigold); }
        .protein-tile:hover { transform: translateY(-3px); border-color: var(--color-marigold); }

        /* Hero responsive: stack at md, hide analyzer below md (also in globals.css) */
        @media (max-width: 960px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: var(--space-8) !important; }
          .hero-analyzer { max-width: 480px; margin: 0 auto; }
        }
        @media (max-width: 768px) {
          .site-nav { padding: var(--space-3) var(--container-padding-mobile) !important; }
          .nav-discover-link { display: none !important; }
          .demo-layout { grid-template-columns: 1fr !important; gap: var(--space-8) !important; }
          .protein-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .why-grid { grid-template-columns: 1fr !important; gap: var(--space-12) !important; }
          .why-grid > div:not(:first-child) { padding-left: 0 !important; border-left: none !important; border-top: 1px solid rgba(244,239,228,0.08) !important; padding-top: var(--space-8) !important; }
          .marquee-card { width: 224px !important; }
          .hero-section { padding-top: var(--space-8) !important; padding-bottom: var(--space-12) !important; }
        }
      `}</style>
    </div>
  );
}
