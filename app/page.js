'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import SearchBox from './components/SearchBox';
import CompareBubble from './components/CompareBubble';
import { useRouter } from 'next/navigation';

/* ═══════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════ */

function getScoreColor(score) {
  if (score >= 90) return '#639922';
  if (score >= 70) return '#7BAF2E';
  if (score >= 50) return '#EF9F27';
  return '#D97B2A';
}

function getScoreTier(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Great';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Below Avg';
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
    <div onClick={() => onClick(p.id)} className="marquee-card" style={{
      width: 240, flexShrink: 0, background: '#fff', borderRadius: 16,
      border: '1px solid #ede8df', cursor: 'pointer',
      transition: 'transform 0.25s, box-shadow 0.25s',
      overflow: 'hidden',
    }}>
      <div style={{ height: 140, background: '#f2efe9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {p.image_url && !imgErr ? (
          <img src={p.image_url} alt="" onError={() => setImgErr(true)}
            style={{ maxHeight: 110, maxWidth: '70%', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.08))' }} />
        ) : (
          <span style={{ fontSize: 40, opacity: 0.3 }}>🐕</span>
        )}
        {p.quality_score != null && (
          <div style={{
            position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)',
            width: 44, height: 44, borderRadius: '50%', background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 1,
          }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>{p.quality_score}</span>
          </div>
        )}
      </div>
      <div style={{ padding: '28px 16px 18px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a7e72', marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>{p.brand}</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: '#1a1612', lineHeight: 1.3, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
        {p.primary_protein && (
          <div style={{ fontSize: 11, color: '#8a7e72', marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>
            Primary Protein: {p.primary_protein}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
          {p.protein_dmb != null && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#5a5248', background: '#f5f2ec', borderRadius: 20, padding: '3px 8px', fontFamily: "'DM Sans', sans-serif" }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#639922', flexShrink: 0 }} />{p.protein_dmb}%
            </span>
          )}
          {p.fat_dmb != null && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#5a5248', background: '#f5f2ec', borderRadius: 20, padding: '3px 8px', fontFamily: "'DM Sans', sans-serif" }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#EF9F27', flexShrink: 0 }} />{p.fat_dmb}%
            </span>
          )}
          {p.carbs_dmb != null && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#5a5248', background: '#f5f2ec', borderRadius: 20, padding: '3px 8px', fontFamily: "'DM Sans', sans-serif" }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#378ADD', flexShrink: 0 }} />{p.carbs_dmb}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductMarquee({ onCardClick }) {
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from('dog_foods_v2')
      .select('id, name, brand, primary_protein, protein_dmb, fat_dmb, carbs_dmb, quality_score, image_url')
      .not('quality_score', 'is', null)
      .limit(200)
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) return;
        const withImage = data.filter(d => d.image_url && d.image_url.trim() !== '');
        const pool = withImage.length >= 6 ? withImage : data;
        const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 6);
        setProducts(shuffled);
        setLoaded(true);
      });
  }, []);

  if (products.length === 0) return null;
  const doubled = [...products, ...products];

  return (
    <div style={{
      padding: '72px 0 64px', overflow: 'hidden', position: 'relative',
      opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(24px)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40, padding: '0 24px' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: '#1a1612', letterSpacing: -1, marginBottom: 8 }}>See how popular brands stack up</h2>
        <p style={{ fontSize: 15, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", maxWidth: 480, margin: '0 auto' }}>Every kibble scored 0–100 across nutrition and ingredient quality</p>
      </div>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, zIndex: 2, background: 'linear-gradient(to right, #faf8f4, transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, zIndex: 2, background: 'linear-gradient(to left, #faf8f4, transparent)', pointerEvents: 'none' }} />
      <div className="marquee-track" style={{ display: 'flex', gap: 20, width: 'max-content', animation: 'marquee 45s linear infinite' }}>
        {doubled.map((p, i) => <MarqueeCard key={`${p.id}-${i}`} p={p} onClick={onCardClick} />)}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   SECTION 3: STATS STRIP
   ═══════════════════════════════════════ */

function StatsStrip() {
  const [ref, visible] = useFadeIn(0.2);
  const stats = [
    { number: '900+', label: 'products scored' },
    { number: '50+', label: 'brands analyzed' },
    { number: '8', label: 'scoring categories' },
    { number: '100%', label: 'manufacturer-sourced' },
  ];
  return (
    <div ref={ref} style={{ background: '#1a1612', padding: '56px 24px' }}>
      <div className="stats-grid" style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, ...fade(visible) }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#f0c930', lineHeight: 1.1, marginBottom: 6 }}>{s.number}</div>
            <div style={{ fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   SECTION 4: SCORING VISUAL DEMO
   ═══════════════════════════════════════ */

const DEMO_CATS = [
  { key: 'A_protein', name: 'Protein', max: 25, color: '#639922' },
  { key: 'B_fat', name: 'Fat', max: 15, color: '#EF9F27' },
  { key: 'C_carbs', name: 'Carbohydrates', max: 15, color: '#378ADD' },
  { key: 'D_fiber', name: 'Fiber', max: 5, color: '#7F77DD' },
  { key: 'E_protein_source', name: 'Protein Sources', max: 15, color: '#C9A84C' },
  { key: 'F_preservatives', name: 'Preservatives', max: 10, color: '#C9A84C' },
  { key: 'G_additives', name: 'Additives', max: 5, color: '#C9A84C' },
  { key: 'H_functional', name: 'Functional', max: 10, color: '#C9A84C' },
];

function ScoringDemo({ onNavigate }) {
  const [ref, visible] = useFadeIn(0.15);
  const [demoProduct, setDemoProduct] = useState(null);

  useEffect(() => {
    supabase
      .from('dog_foods_v2')
      .select('name, brand, quality_score, score_breakdown')
      .not('score_breakdown', 'is', null)
      .gte('quality_score', 80)
      .limit(20)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const valid = data.filter(d => d.score_breakdown && d.score_breakdown.categories);
        if (valid.length === 0) return;
        setDemoProduct(valid[Math.floor(Math.random() * valid.length)]);
      });
  }, []);

  const cats = demoProduct?.score_breakdown?.categories;

  return (
    <div ref={ref} style={{ background: '#faf8f4', padding: '80px 24px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', ...fade(visible) }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, color: '#1a1612', letterSpacing: -1, marginBottom: 10, textAlign: 'center' }}>
          A score you can actually understand
        </h2>
        <p style={{ fontSize: 16, color: '#5a5248', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 44px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
          Here&apos;s how a real product breaks down across all 8 categories.
        </p>

        <div className="demo-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 40, alignItems: 'center', marginBottom: 40 }}>
          {/* Left: category bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DEMO_CATS.map((cat) => {
              const earned = cats?.[cat.key]?.score ?? Math.round(cat.max * 0.8);
              const pct = Math.min((earned / cat.max) * 100, 100);
              return (
                <div key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1612', fontFamily: "'DM Sans', sans-serif", width: 120, flexShrink: 0 }}>{cat.name}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 100, background: '#ede8df', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 100, background: cat.color, width: `${pct}%`, transition: 'width 1s ease' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", width: 40, textAlign: 'right', flexShrink: 0 }}>{earned}/{cat.max}</span>
                </div>
              );
            })}
          </div>

          {/* Right: gold certification stamp */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {demoProduct ? (
              <div style={{ transform: 'rotate(-7deg)', width: 190 }}>
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
                    <circle cx="100" cy="100" r="93" fill="none" stroke="#C9A84C" strokeWidth="4.5"/>
                    <circle cx="100" cy="100" r="81" fill="none" stroke="#C9A84C" strokeWidth="2"/>
                    <circle cx="100" cy="100" r="87" fill="none" stroke="#C9A84C" strokeWidth="0.5" strokeDasharray="2,4" opacity="0.5"/>
                    <g fill="#C9A84C" fontSize="7" textAnchor="middle" fontFamily="serif">
                      <text x="100" y="14">★</text>
                      <text x="100" y="194">★</text>
                      <text x="9" y="104">★</text>
                      <text x="191" y="104">★</text>
                      <text x="27" y="33">★</text>
                      <text x="173" y="33">★</text>
                      <text x="27" y="174">★</text>
                      <text x="173" y="174">★</text>
                    </g>
                    <text fontFamily="'DM Sans', Helvetica, Arial, sans-serif" fontSize="8" fontWeight="700" letterSpacing="3.5" fill="#C9A84C" textAnchor="middle">
                      <textPath href="#topArc" startOffset="50%">GOODKIBBLE RATED</textPath>
                    </text>
                    <text x="100" y="95" textAnchor="middle" fontFamily="Georgia, 'Playfair Display', 'Times New Roman', serif" fontSize="52" fontWeight="bold" fill="#C9A84C" style={{ fontWeight: 900, letterSpacing: '-2px' }}>
                      {demoProduct.quality_score}
                    </text>
                    <rect x="18" y="100" width="164" height="24" rx="2" fill="#C9A84C"/>
                    <text x="100" y="117" textAnchor="middle" fontFamily="'DM Sans', Helvetica, Arial, sans-serif" fontSize="13" fontWeight="800" letterSpacing="5" fill="#FAF8F4">
                      {getScoreTier(demoProduct.quality_score).toUpperCase()}
                    </text>
                    <text fontFamily="'DM Sans', Helvetica, Arial, sans-serif" fontSize="7.5" fontWeight="600" letterSpacing="2" fill="#C9A84C" opacity="0.85" textAnchor="middle">
                      <textPath href="#botArc" startOffset="50%">★ CERTIFIED QUALITY ★</textPath>
                    </text>
                  </g>
                </svg>
              </div>
            ) : (
              <div style={{
                width: 190, height: 190, borderRadius: '50%', border: '4px solid #ede8df',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 24, height: 24, border: '3px solid #b5aa99', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button onClick={() => onNavigate('/how-we-score')} style={{
            padding: '14px 32px', borderRadius: 100, border: 'none',
            background: '#1a1612', color: '#faf8f4', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'background 0.2s',
          }}
            onMouseEnter={(e) => { e.target.style.background = '#3d352b'; }}
            onMouseLeave={(e) => { e.target.style.background = '#1a1612'; }}
          >See full methodology →</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   SECTION 5: BROWSE BY PROTEIN
   ═══════════════════════════════════════ */

const PROTEIN_ICONS = {
  Chicken: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c-1 2-3 4-3 6a3 3 0 006 0c0-2-2-4-3-6z"/><path d="M9 14c-2 1-4 3-4 5 0 1.5 1.5 2 3 2h8c1.5 0 3-.5 3-2 0-2-2-4-4-5"/><path d="M12 8v6"/></svg>,
  Salmon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-5 7-6c4-1 6 1 8 1s5-1 5 2-2 4-5 5c-3 1-5-1-8 0s-7 4-7 4"/><path d="M20 10l2-2M20 14l2 2"/><circle cx="7" cy="11" r="1" fill="#C9A84C"/></svg>,
  Lamb: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="11" r="5"/><circle cx="8.5" cy="7" r="2"/><circle cx="15.5" cy="7" r="2"/><path d="M9 16v4M15 16v4"/><circle cx="10" cy="11" r="0.5" fill="#C9A84C"/><circle cx="14" cy="11" r="0.5" fill="#C9A84C"/></svg>,
  Beef: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15c0-5 3.5-9 8-9s8 4 8 9c0 3-3 4-8 4s-8-1-8-4z"/><path d="M4 15c1-1 2-3 2-5M20 15c-1-1-2-3-2-5"/><path d="M10 14c.5-.5 1.5-1 2-1s1.5.5 2 1"/></svg>,
  Turkey: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="14" cy="8" r="3"/><path d="M14 11v3"/><path d="M10 21h8"/><path d="M11 14c-3 0-6 2-6 4 0 1 1 3 9 3s9-2 9-3c0-2-3-4-6-4"/><path d="M5 10c-1-2 0-5 2-6"/><path d="M4 7c-1-2 0-4 2-5"/></svg>,
  Fish: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c3-4 7-6 11-6 2 0 4 1 5 2l2-3v14l-2-3c-1 1-3 2-5 2-4 0-8-2-11-6z"/><circle cx="15" cy="12" r="1" fill="#C9A84C"/><path d="M10 10v4"/></svg>,
};

function BrowseByProtein({ proteinCounts, onNavigate }) {
  const [ref, visible] = useFadeIn(0.15);
  const proteins = ['Chicken', 'Salmon', 'Lamb', 'Beef', 'Turkey', 'Fish'];
  return (
    <div ref={ref} style={{ background: '#fff', padding: '80px 24px', borderTop: '1px solid #ede8df', borderBottom: '1px solid #ede8df' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', ...fade(visible) }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, color: '#1a1612', letterSpacing: -1, marginBottom: 8 }}>Browse by protein</h2>
          <p style={{ fontSize: 15, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>Find foods by your dog&apos;s preferred protein source</p>
        </div>
        <div className="protein-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {proteins.map((name) => (
            <div key={name}
              onClick={() => onNavigate(`/discover?protein=${encodeURIComponent(name)}`)}
              className="protein-tile"
              style={{
                padding: '24px 16px', borderRadius: 16, background: '#faf8f4',
                border: '1px solid #ede8df', cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                textAlign: 'center',
              }}
            >
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>{PROTEIN_ICONS[name]}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1612', fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>{name}</div>
              <div style={{ fontSize: 12, color: '#b5aa99', fontFamily: "'DM Sans', sans-serif" }}>
                {proteinCounts[name] ? `${proteinCounts[name]} products` : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   SECTION 6: WHY GOODKIBBLE
   ═══════════════════════════════════════ */

const VALUE_PROPS = [
  {
    title: 'Transparent Scoring',
    desc: 'Every score is broken down across 8 categories. See exactly why a food earned its rating.',
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>,
  },
  {
    title: 'Manufacturer-Sourced Data',
    desc: 'All nutritional data comes directly from manufacturer websites. No guesswork, no retailer approximations.',
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  },
  {
    title: 'Apples-to-Apples Nutrition',
    desc: "Most sites show nutrition with moisture still in the mix — which makes wet-heavy foods look weaker than they are. We use Dry Matter Basis to strip moisture out of the equation, so you're comparing real nutrition, food to food. No inflated numbers. No misleading comparisons.",
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/><circle cx="7" cy="6" r="2" fill="#C9A84C"/><circle cx="17" cy="12" r="2" fill="#C9A84C"/><circle cx="11" cy="18" r="2" fill="#C9A84C"/></svg>,
  },
];

function WhyGoodKibble() {
  const [ref, visible] = useFadeIn(0.15);
  return (
    <div ref={ref} style={{ background: '#faf8f4', padding: '80px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', ...fade(visible) }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, color: '#1a1612', letterSpacing: -1, marginBottom: 48, textAlign: 'center' }}>Why GoodKibble?</h2>
        <div className="value-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {VALUE_PROPS.map((vp) => (
            <div key={vp.title} style={{ background: '#fff', borderRadius: 20, padding: 32, border: '1px solid #ede8df' }}>
              <div style={{ marginBottom: 16 }}>{vp.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1612', marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>{vp.title}</div>
              <p style={{ fontSize: 14, color: '#6b6157', lineHeight: 1.65, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>{vp.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   SECTION 7: FOOTER CTA
   ═══════════════════════════════════════ */

function FooterCTA({ onNavigate, onSelect }) {
  const [ref, visible] = useFadeIn(0.15);
  return (
    <div ref={ref} style={{ background: '#1a1612', padding: '72px 24px 80px', textAlign: 'center' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', ...fade(visible) }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: '#faf8f4', letterSpacing: -0.5, marginBottom: 12 }}>
          Ready to see what&apos;s in your dog&apos;s food?
        </h2>
        <p style={{ fontSize: 15, color: '#8a7e72', marginBottom: 32, fontFamily: "'DM Sans', sans-serif" }}>Search any brand or browse our full database</p>
        <div style={{ marginBottom: 20 }}>
          <SearchBox onSelect={onSelect} variant="hero" />
        </div>
        <button onClick={() => onNavigate('/discover')} style={{
          padding: '14px 36px', borderRadius: 100, border: '1.5px solid #3d352b',
          background: 'transparent', color: '#d4c9b8', fontSize: 15, fontWeight: 600,
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
        }}
          onMouseEnter={(e) => { e.target.style.background = '#f0c930'; e.target.style.color = '#1a1612'; e.target.style.borderColor = '#f0c930'; }}
          onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#d4c9b8'; e.target.style.borderColor = '#3d352b'; }}
        >Discover 900+ dog foods →</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */

export default function Home() {
  const [proteinCounts, setProteinCounts] = useState({});
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase
      .from('dog_foods_v2')
      .select('primary_protein')
      .then(({ data }) => {
        if (!data) return;
        const pCounts = {};
        data.forEach(r => { if (r.primary_protein) pCounts[r.primary_protein] = (pCounts[r.primary_protein] || 0) + 1; });
        setProteinCounts(pCounts);
      });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = useCallback((path) => router.push(path), [router]);
  const handleSelect = useCallback((id) => router.push(`/food/${id}`), [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#faf8f4' }}>

      {/* ═══ NAV ═══ */}
      <nav className="site-nav" style={{
        position: 'sticky', top: 0, zIndex: 50, background: '#faf8f4',
        padding: '14px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: scrolled ? '1px solid #ede8df' : '1px solid transparent',
        boxShadow: scrolled ? '0 2px 12px rgba(26,22,18,0.04)' : 'none',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: '#1a1612', letterSpacing: -0.5, cursor: 'pointer' }} onClick={() => goTo('/')}>
          Good<span style={{ color: '#C9A84C' }}>Kibble</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="nav-discover-link" onClick={() => goTo('/discover')} style={{ fontSize: 14, fontWeight: 600, color: '#5a5248', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#1a1612'}
            onMouseLeave={(e) => e.target.style.color = '#5a5248'}
          >Discover Foods</span>
          <CompareBubble />
        </div>
      </nav>

      {/* ═══ 1. HERO ═══ */}
      <div style={{ padding: '48px 24px 36px', maxWidth: 680, width: '100%', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 30 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#C9A84C', marginBottom: 16, animation: 'fadeUp 0.6s ease both' }}>Know what&apos;s in the bowl</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(38px, 5vw, 58px)', fontWeight: 900, color: '#1a1612', lineHeight: 1.08, letterSpacing: -2, marginBottom: 20, animation: 'fadeUp 0.6s ease 0.1s both' }}>
          What&apos;s really in<br />your dog&apos;s food?
        </h1>
        <p style={{ fontSize: 18, color: '#8a7e72', lineHeight: 1.6, maxWidth: 480, margin: '0 auto 32px', fontFamily: "'DM Sans', sans-serif", animation: 'fadeUp 0.6s ease 0.2s both' }}>
          Search any dog food brand. Get a clear breakdown of ingredients and nutrition — no fluff.
        </p>
        <div style={{ animation: 'fadeUp 0.6s ease 0.3s both', position: 'relative', zIndex: 60, maxWidth: 520, margin: '0 auto' }}>
          <SearchBox onSelect={handleSelect} variant="hero" />
        </div>
        <div style={{ marginTop: 16, animation: 'fadeUp 0.6s ease 0.4s both', textAlign: 'center' }}>
          <span onClick={() => goTo('/discover')} style={{ fontSize: 14, color: '#C9A84C', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, transition: 'color 0.2s' }}
            onMouseEnter={(e) => { e.target.style.color = '#a8882e'; e.target.style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { e.target.style.color = '#C9A84C'; e.target.style.textDecoration = 'none'; }}
          >or discover 900+ dog foods by filter →</span>
        </div>
      </div>

      {/* ═══ 2. MARQUEE ═══ */}
      <ProductMarquee onCardClick={handleSelect} />

      {/* ═══ 3. STATS ═══ */}
      <StatsStrip />

      {/* ═══ 4. SCORING DEMO ═══ */}
      <ScoringDemo onNavigate={goTo} />

      {/* ═══ 5. BROWSE BY PROTEIN ═══ */}
      <BrowseByProtein proteinCounts={proteinCounts} onNavigate={goTo} />

      {/* ═══ 6. WHY GOODKIBBLE ═══ */}
      <WhyGoodKibble />

      {/* ═══ 7. FOOTER CTA ═══ */}
      <FooterCTA onNavigate={goTo} onSelect={handleSelect} />

      {/* ═══ FOOTER ═══ */}
      <div style={{ borderTop: '1px solid #3d352b', padding: '28px 40px', background: '#1a1612', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: '#faf8f4' }}>Good<span style={{ color: '#f0c930' }}>Kibble</span></div>
        <div style={{ fontSize: 12, color: '#5a5248', fontFamily: "'DM Sans', sans-serif" }}>© 2026 GoodKibble. Not affiliated with any dog food brand.</div>
      </div>

      {/* ═══ STYLES ═══ */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track:hover { animation-play-state: paused; }
        .marquee-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(26,22,18,0.10); }
        .protein-tile:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(26,22,18,0.06); border-color: #C9A84C !important; }
        @media (max-width: 768px) {
          .site-nav { padding: 12px 16px !important; }
          .nav-discover-link { display: none !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 28px 16px !important; }
          .demo-layout { grid-template-columns: 1fr !important; gap: 32px !important; }
          .protein-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .value-grid { grid-template-columns: 1fr !important; }
          .marquee-card { width: 210px !important; }
        }
      `}</style>
    </div>
  );
}
