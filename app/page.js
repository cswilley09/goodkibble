'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import SearchBox from './components/SearchBox';
import { useRouter } from 'next/navigation';

/* ═══════════════════════════════════════
   SHARED HELPERS
   ═══════════════════════════════════════ */

function getScoreColor(score) {
  if (score >= 70) return '#2d7a4f';
  if (score >= 50) return '#c47a20';
  return '#b5483a';
}

function getScoreTier(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Great';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Below Avg';
  return 'Poor';
}

/* ── fade-in on scroll hook ── */
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

const fadeStyle = (visible, delay = 0) => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(20px)',
  transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
});

/* ═══════════════════════════════════════
   SCORE RING
   ═══════════════════════════════════════ */

function ScoreRing({ score }) {
  if (score == null) return null;
  const color = getScoreColor(score);
  const circumference = 106.8;
  const offset = circumference * (1 - score / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
      <svg width={42} height={42} viewBox="0 0 42 42">
        <circle cx={21} cy={21} r={17} fill="none" stroke="#ede8df" strokeWidth={3} />
        <circle cx={21} cy={21} r={17} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 21 21)" />
        <text x={21} y={21} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", fill: '#1a1612' }}>
          {score}
        </text>
      </svg>
      <span style={{ fontSize: 9, fontFamily: "'DM Sans', sans-serif", color: '#8a7e72', marginTop: 2 }}>
        {getScoreTier(score)}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════
   SECTION 2: Score Snapshot
   ═══════════════════════════════════════ */

function ScoreSnapshot({ onCardClick }) {
  const [products, setProducts] = useState([]);
  const sectionRef = useRef(null);
  const [translateX, setTranslateX] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    supabase
      .from('dog_foods_v2')
      .select('id, name, brand, primary_protein, protein_dmb, fat_dmb, carbs_dmb, quality_score, image_url')
      .not('quality_score', 'is', null)
      .not('image_url', 'is', null)
      .limit(100)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 6);
        setProducts(shuffled);
      });
  }, []);

  useEffect(() => {
    function onScroll() {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const viewH = window.innerHeight;
      const progress = Math.max(0, (viewH - rect.top) / (viewH + rect.height));
      setTranslateX(progress * 0.45 * rect.width * -1 + rect.width * 0.15);
      if (hintVisible && progress > 0.05) setHintVisible(false);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [hintVisible]);

  if (products.length === 0) return null;

  return (
    <div ref={sectionRef} style={{
      background: '#faf8f4', padding: '72px 0 56px', overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 36, padding: '0 24px' }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 36px)',
          fontWeight: 800, color: '#1a1612', letterSpacing: -1, marginBottom: 8,
        }}>See how popular brands stack up</h2>
        <p style={{ fontSize: 15, color: '#8a7e72', maxWidth: 480, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>
          Every kibble scored 0–100 across nutrition and ingredient quality
        </p>
      </div>

      {/* fade edges */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, zIndex: 2, background: 'linear-gradient(to right, #faf8f4, transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, zIndex: 2, background: 'linear-gradient(to left, #faf8f4, transparent)', pointerEvents: 'none' }} />

      {/* card track */}
      <div style={{
        display: 'flex', gap: 16, paddingLeft: 40, paddingRight: 40,
        transform: `translateX(${translateX}px)`,
        transition: 'transform 0.1s linear',
        willChange: 'transform',
      }}>
        {products.map((p) => (
          <div key={p.id} onClick={() => onCardClick(p.id)} style={{
            background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #ede8df',
            cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
            display: 'flex', gap: 14, alignItems: 'center',
            minWidth: 320, maxWidth: 360, flexShrink: 0,
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,22,18,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {p.image_url && (
              <div style={{ width: 56, height: 72, borderRadius: 10, overflow: 'hidden', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src={p.image_url} alt="" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: '#8a7e72', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{p.brand}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', lineHeight: 1.3, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</div>
              {p.primary_protein && (
                <div style={{ fontSize: 12, color: '#8a7e72', lineHeight: 1.4, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: '#6b6157' }}>Primary Protein:</span> {p.primary_protein}
                </div>
              )}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#e8f5ee', color: '#639922' }}>Protein {p.protein_dmb}%</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#fef3e2', color: '#EF9F27' }}>Fat {p.fat_dmb}%</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#edf2f7', color: '#378ADD' }}>Carbs {p.carbs_dmb}%</span>
              </div>
            </div>
            <ScoreRing score={p.quality_score} />
          </div>
        ))}
      </div>

      <div style={{
        textAlign: 'center', marginTop: 20, fontSize: 13, color: '#b5aa99',
        fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
        opacity: hintVisible ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: 'none',
      }}>
        Keep scrolling to see more →
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   SECTION 3: Stats / Credibility Strip
   ═══════════════════════════════════════ */

function StatsStrip({ productCount, brandCount }) {
  const [ref, visible] = useFadeIn(0.2);
  const stats = [
    { number: productCount ? productCount.toLocaleString() : '—', label: 'products scored' },
    { number: brandCount || '—', label: 'brands analyzed' },
    { number: '8', label: 'scoring categories' },
    { number: '100%', label: 'manufacturer-sourced data' },
  ];
  return (
    <div ref={ref} style={{
      background: '#1a1612', padding: '52px 24px',
    }}>
      <div className="stats-grid" style={{
        maxWidth: 900, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24,
        ...fadeStyle(visible),
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 800, color: '#f0c930', lineHeight: 1.1, marginBottom: 6,
            }}>{s.number}</div>
            <div style={{
              fontSize: 13, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500, letterSpacing: 0.3,
            }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   SECTION 4: How We Score (teaser)
   ═══════════════════════════════════════ */

const SCORING_CATEGORIES = {
  nutrition: [
    { name: 'Protein', max: 25, color: '#639922' },
    { name: 'Fat', max: 15, color: '#EF9F27' },
    { name: 'Carbohydrates', max: 15, color: '#378ADD' },
    { name: 'Fiber', max: 5, color: '#7F77DD' },
  ],
  ingredients: [
    { name: 'Protein Sources', max: 15, color: '#C9A84C' },
    { name: 'Preservatives', max: 10, color: '#C9A84C' },
    { name: 'Additives', max: 5, color: '#C9A84C' },
    { name: 'Functional', max: 10, color: '#C9A84C' },
  ],
};

function HowWeScoreTeaser({ onNavigate }) {
  const [ref, visible] = useFadeIn(0.15);

  function CategoryPill({ cat }) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        background: '#fff', borderRadius: 12, border: '1px solid #ede8df',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', fontFamily: "'DM Sans', sans-serif", flex: 1 }}>{cat.name}</span>
        <span style={{ fontSize: 13, color: '#b5aa99', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>/{cat.max}</span>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ background: '#faf8f4', padding: '80px 24px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', ...fadeStyle(visible) }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3vw, 38px)',
          fontWeight: 800, color: '#1a1612', letterSpacing: -1, marginBottom: 16,
          textAlign: 'center',
        }}>A score you can trust</h2>
        <p style={{
          fontSize: 16, color: '#5a5248', lineHeight: 1.7, maxWidth: 600,
          margin: '0 auto 40px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif",
        }}>
          Every dry kibble is scored 0–100 across eight categories. The first four measure nutritional
          content from the guaranteed analysis. The last four evaluate ingredient quality from the
          ingredient list. No brand sponsorships. No hidden agendas.
        </p>

        <div className="scoring-cols" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40,
        }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase',
              color: '#b5aa99', marginBottom: 12, fontFamily: "'DM Sans', sans-serif",
            }}>Nutrition</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SCORING_CATEGORIES.nutrition.map(c => <CategoryPill key={c.name} cat={c} />)}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase',
              color: '#b5aa99', marginBottom: 12, fontFamily: "'DM Sans', sans-serif",
            }}>Ingredients</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SCORING_CATEGORIES.ingredients.map(c => <CategoryPill key={c.name} cat={c} />)}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button onClick={() => onNavigate('/how-we-score')} style={{
            padding: '14px 32px', borderRadius: 100,
            border: 'none', background: '#1a1612', color: '#faf8f4',
            fontSize: 15, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
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
   SECTION 5: Browse by Primary Protein
   ═══════════════════════════════════════ */

const PROTEIN_ICONS = {
  Chicken: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.5 2.5C16.5 3.5 17 5 16.5 6.5L14 12l5 5-3 3-5-5-5.5 2.5c-1.5.5-3 0-4-1s-1.5-2.5-1-4L4 10l6-6 2.5-2.5c1-.5 2.5 0 3 1z"/>
    </svg>
  ),
  Salmon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 16s1-4 5-6 8-2 10-1 5 4 5 4-1 4-5 6-8 2-10 1-5-4-5-4z"/><path d="M7 12c1-1 3-1 4 0"/>
    </svg>
  ),
  Lamb: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="6"/><path d="M8 20h8M10 16v4M14 16v4"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/>
    </svg>
  ),
  Beef: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14c0-4 4-8 8-8s8 4 8 8-2 6-8 6-8-2-8-6z"/><path d="M9 13c.5-1 2-2 3-2s2.5 1 3 2"/>
    </svg>
  ),
  Turkey: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.5 2.5C16.5 3.5 17 5 16.5 6.5L14 12l5 5-3 3-5-5-5.5 2.5c-1.5.5-3 0-4-1s-1.5-2.5-1-4L4 10l6-6 2.5-2.5c1-.5 2.5 0 3 1z"/>
    </svg>
  ),
  Fish: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 16s1-4 5-6 8-2 10-1 5 4 5 4-1 4-5 6-8 2-10 1-5-4-5-4z"/><path d="M7 12c1-1 3-1 4 0"/>
    </svg>
  ),
};

function BrowseByProtein({ proteinCounts, onNavigate }) {
  const [ref, visible] = useFadeIn(0.15);
  const proteins = ['Chicken', 'Salmon', 'Lamb', 'Beef', 'Turkey', 'Fish'];

  return (
    <div ref={ref} style={{ background: '#fff', padding: '80px 24px', borderTop: '1px solid #ede8df', borderBottom: '1px solid #ede8df' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', ...fadeStyle(visible) }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3vw, 38px)',
            fontWeight: 800, color: '#1a1612', letterSpacing: -1, marginBottom: 8,
          }}>Browse by protein</h2>
          <p style={{ fontSize: 15, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>
            Find foods by your dog&apos;s preferred protein source
          </p>
        </div>

        <div className="protein-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14,
          maxWidth: 700, margin: '0 auto',
        }}>
          {proteins.map((name) => (
            <div key={name}
              onClick={() => onNavigate(`/discover?protein=${encodeURIComponent(name)}`)}
              style={{
                padding: '24px 20px', borderRadius: 16, background: '#faf8f4',
                border: '1px solid #ede8df', cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,22,18,0.06)'; e.currentTarget.style.borderColor = '#C9A84C'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#ede8df'; }}
            >
              <div style={{ color: '#8a7e72', marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
                {PROTEIN_ICONS[name]}
              </div>
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
   SECTION 6: Why GoodKibble
   ═══════════════════════════════════════ */

const VALUE_PROPS = [
  {
    title: 'Transparent Scoring',
    desc: 'Every score is broken down across 8 categories. See exactly why a food earned its rating.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10M18 20V4M6 20v-4"/>
      </svg>
    ),
  },
  {
    title: 'Manufacturer-Sourced Data',
    desc: 'All nutritional data comes directly from manufacturer websites. No guesswork, no retailer approximations.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  },
  {
    title: 'Dry Matter Basis',
    desc: 'We calculate nutrition on a dry matter basis so you can compare foods accurately, regardless of moisture content.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M3 12h18M3 18h18"/><circle cx="7" cy="6" r="2" fill="#C9A84C"/><circle cx="17" cy="12" r="2" fill="#C9A84C"/><circle cx="11" cy="18" r="2" fill="#C9A84C"/>
      </svg>
    ),
  },
];

function WhyGoodKibble() {
  const [ref, visible] = useFadeIn(0.15);
  return (
    <div ref={ref} style={{ background: '#faf8f4', padding: '80px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', ...fadeStyle(visible) }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3vw, 38px)',
          fontWeight: 800, color: '#1a1612', letterSpacing: -1, marginBottom: 48,
          textAlign: 'center',
        }}>Why GoodKibble?</h2>

        <div className="value-props-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
        }}>
          {VALUE_PROPS.map((vp) => (
            <div key={vp.title} style={{
              background: '#fff', borderRadius: 20, padding: '32px 28px',
              border: '1px solid #ede8df',
            }}>
              <div style={{ marginBottom: 16 }}>{vp.icon}</div>
              <div style={{
                fontSize: 17, fontWeight: 700, color: '#1a1612', marginBottom: 10,
                fontFamily: "'DM Sans', sans-serif",
              }}>{vp.title}</div>
              <p style={{
                fontSize: 14, color: '#6b6157', lineHeight: 1.65,
                fontFamily: "'DM Sans', sans-serif", margin: 0,
              }}>{vp.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   SECTION 7: Footer CTA
   ═══════════════════════════════════════ */

function FooterCTA({ onNavigate, onSelect }) {
  const [ref, visible] = useFadeIn(0.15);
  return (
    <div ref={ref} style={{
      background: '#1a1612', padding: '72px 24px 80px', textAlign: 'center',
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto', ...fadeStyle(visible) }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 36px)',
          fontWeight: 800, color: '#faf8f4', letterSpacing: -0.5, marginBottom: 16,
        }}>Ready to see what&apos;s in your dog&apos;s food?</h2>
        <p style={{
          fontSize: 15, color: '#8a7e72', marginBottom: 32, fontFamily: "'DM Sans', sans-serif",
        }}>
          Search any brand or browse our full database
        </p>
        <div style={{ marginBottom: 20 }}>
          <SearchBox onSelect={onSelect} variant="hero" />
        </div>
        <button onClick={() => onNavigate('/discover')} style={{
          padding: '14px 36px', borderRadius: 100,
          border: '1.5px solid #3d352b', background: 'transparent',
          color: '#d4c9b8', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
        }}
          onMouseEnter={(e) => { e.target.style.background = '#f0c930'; e.target.style.color = '#1a1612'; e.target.style.borderColor = '#f0c930'; }}
          onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#d4c9b8'; e.target.style.borderColor = '#3d352b'; }}
        >Explore 1,000+ dog foods →</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════ */

function SiteFooter() {
  return (
    <div style={{
      borderTop: '1px solid #3d352b', padding: '28px 40px', background: '#1a1612',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
    }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: '#faf8f4' }}>
        Good<span style={{ color: '#f0c930' }}>Kibble</span>
      </div>
      <div style={{ fontSize: 12, color: '#5a5248', fontFamily: "'DM Sans', sans-serif" }}>
        © 2026 GoodKibble. Not affiliated with any dog food brand.
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */

export default function Home() {
  const [brands, setBrands] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [brandCount, setBrandCount] = useState(0);
  const [proteinCounts, setProteinCounts] = useState({});
  const router = useRouter();

  useEffect(() => {
    supabase
      .from('dog_foods_v2')
      .select('brand, primary_protein')
      .then(({ data }) => {
        if (!data) return;
        setTotalCount(data.length);

        /* brand counts */
        const bCounts = {};
        data.forEach(r => { bCounts[r.brand] = (bCounts[r.brand] || 0) + 1; });
        setBrandCount(Object.keys(bCounts).length);
        const sorted = Object.entries(bCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, count]) => ({ name, count }));
        setBrands(sorted);

        /* protein counts */
        const pCounts = {};
        data.forEach(r => {
          const pp = r.primary_protein;
          if (pp) pCounts[pp] = (pCounts[pp] || 0) + 1;
        });
        setProteinCounts(pCounts);
      });
  }, []);

  const goTo = useCallback((path) => router.push(path), [router]);
  const handleSelect = useCallback((id) => router.push(`/food/${id}`), [router]);
  const handleBrand = useCallback((name) => router.push(`/brand/${encodeURIComponent(name)}`), [router]);

  const labelStyle = {
    fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13,
    letterSpacing: '2.5px', color: '#1a1612', whiteSpace: 'nowrap',
    position: 'absolute', display: 'flex', alignItems: 'center',
  };

  const dashLeft = (w) => (
    <span style={{ display: 'inline-block', width: w, height: 0, borderTop: '1.5px dashed #1a161245', marginLeft: 8 }} />
  );
  const dashRight = (w) => (
    <span style={{ display: 'inline-block', width: w, height: 0, borderTop: '1.5px dashed #1a161245', marginRight: 8 }} />
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#faf8f4' }}>

      {/* ═══ SECTION 1: HERO ═══ */}
      <div style={{
        background: 'linear-gradient(170deg, #f5d442 0%, #f0c930 45%, #e8c020 100%)',
        display: 'flex', flexDirection: 'column',
      }}>
        <nav className="nav-bar" style={{
          padding: '16px 48px', animation: 'fadeIn 0.6s ease',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div className="nav-logo" style={{
            fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800,
            color: '#1a1612', letterSpacing: -0.5,
          }}>
            Good<span style={{ opacity: 0.4 }}>Kibble</span>
          </div>
          <button onClick={() => goTo('/discover')} style={{
            padding: '10px 22px', borderRadius: 100,
            border: '1.5px solid #1a161230', background: 'transparent',
            color: '#1a1612', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
          }}
            onMouseEnter={(e) => { e.target.style.background = '#1a1612'; e.target.style.color = '#f5d442'; e.target.style.borderColor = '#1a1612'; }}
            onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#1a1612'; e.target.style.borderColor = '#1a161230'; }}
          >Discover Foods</button>
        </nav>

        <div className="hero-layout" style={{
          display: 'flex', alignItems: 'center',
          maxWidth: 1100, width: '100%', margin: '0 auto',
          padding: '20px 48px 40px', gap: 60,
          animation: 'fadeUp 0.8s ease',
        }}>
          <div className="hero-kibble-col" style={{
            width: 320, flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <div style={{ position: 'relative', transform: 'rotate(-8deg)' }}>
              <img src="/hero-kibble.png" alt="Kibble nutritional breakdown"
                style={{ width: 130, height: 'auto', display: 'block' }} />
              <div className="hero-kibble-labels" style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                transform: 'rotate(8deg)',
              }}>
                <div style={{ ...labelStyle, top: '6%', right: '100%', paddingRight: 4 }}>
                  PROTEIN {dashLeft(45)}
                </div>
                <div style={{ ...labelStyle, top: '25%', left: '100%', paddingLeft: 4 }}>
                  {dashRight(55)} FAT
                </div>
                <div style={{ ...labelStyle, top: '46%', right: '100%', paddingRight: 4 }}>
                  CARBS {dashLeft(35)}
                </div>
                <div style={{ ...labelStyle, top: '70%', left: '100%', paddingLeft: 4 }}>
                  {dashRight(45)} FIBER
                </div>
              </div>
            </div>
          </div>

          <div className="hero-text" style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, letterSpacing: 3,
              textTransform: 'uppercase', color: '#1a161250', marginBottom: 12,
            }}>Know what&apos;s in the bowl</div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(36px, 4.5vw, 64px)', fontWeight: 800, color: '#1a1612',
              lineHeight: 1.02, marginBottom: 16, letterSpacing: -2,
            }}>
              What&apos;s really in<br />your dog&apos;s food?
            </h1>
            <p style={{
              fontSize: 17, color: '#1a161280', maxWidth: 440,
              lineHeight: 1.6, marginBottom: 28, fontWeight: 400,
            }}>
              Search any dog food brand. Get a clear breakdown of ingredients and nutrition — no fluff.
            </p>
            <SearchBox onSelect={handleSelect} variant="hero" />
            <div style={{ marginTop: 14, textAlign: 'left' }}>
              <span onClick={() => goTo('/discover')} style={{
                fontSize: 14, color: '#1a161260', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                transition: 'color 0.2s', textDecoration: 'none',
              }}
                onMouseEnter={(e) => { e.target.style.color = '#1a1612'; e.target.style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { e.target.style.color = '#1a161260'; e.target.style.textDecoration = 'none'; }}
              >
                or browse 1,000+ dog foods by filter →
              </span>
            </div>
          </div>
        </div>

        {/* Popular Brands bar */}
        <div className="popular-brands" style={{
          background: '#1a1612', borderRadius: '32px 32px 0 0',
          padding: '36px 40px 44px', animation: 'fadeUp 1s ease 0.3s both',
        }}>
          <div style={{
            fontSize: 12, fontWeight: 600, letterSpacing: 2.5,
            textTransform: 'uppercase', color: '#8a7e72', marginBottom: 20, textAlign: 'center',
          }}>Popular Brands</div>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 10,
            justifyContent: 'center', maxWidth: 700, margin: '0 auto',
          }}>
            {brands.map((b, i) => (
              <button key={b.name} onClick={() => handleBrand(b.name)} style={{
                padding: '12px 22px', borderRadius: 100,
                border: '1.5px solid #3d352b', background: 'transparent',
                color: '#d4c9b8', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                animationName: 'fadeUp', animationDuration: '0.5s',
                animationFillMode: 'both', animationDelay: `${i * 80}ms`,
              }}
                onMouseEnter={(e) => { e.target.style.background = '#f5d442'; e.target.style.color = '#1a1612'; e.target.style.borderColor = '#f5d442'; }}
                onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#d4c9b8'; e.target.style.borderColor = '#3d352b'; }}
              >
                {b.name}
                <span style={{ marginLeft: 8, opacity: 0.5, fontSize: 12 }}>({b.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ SECTION 2: Score Snapshot ═══ */}
      <ScoreSnapshot onCardClick={handleSelect} />

      {/* ═══ SECTION 3: Stats ═══ */}
      <StatsStrip productCount={totalCount} brandCount={brandCount} />

      {/* ═══ SECTION 4: How We Score ═══ */}
      <HowWeScoreTeaser onNavigate={goTo} />

      {/* ═══ SECTION 5: Browse by Protein ═══ */}
      <BrowseByProtein proteinCounts={proteinCounts} onNavigate={goTo} />

      {/* ═══ SECTION 6: Why GoodKibble ═══ */}
      <WhyGoodKibble />

      {/* ═══ SECTION 7: Footer CTA ═══ */}
      <FooterCTA onNavigate={goTo} onSelect={handleSelect} />

      {/* ═══ FOOTER ═══ */}
      <SiteFooter />

      {/* ═══ RESPONSIVE STYLES ═══ */}
      <style>{`
        @media (max-width: 768px) {
          .hero-layout { flex-direction: column !important; padding: 24px 20px 32px !important; gap: 32px !important; text-align: center; }
          .hero-kibble-col { width: 200px !important; margin: 0 auto; }
          .hero-kibble-col img { width: 90px !important; }
          .hero-kibble-labels { display: none !important; }
          .hero-text { text-align: center; }
          .hero-text p { margin-left: auto; margin-right: auto; }
          .hero-text > div:last-child { text-align: center !important; }
          .nav-bar { padding: 14px 20px !important; }
          .nav-logo { font-size: 26px !important; }
          .popular-brands { padding: 28px 20px 36px !important; border-radius: 24px 24px 0 0 !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 28px 16px !important; }
          .scoring-cols { grid-template-columns: 1fr !important; gap: 28px !important; }
          .protein-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .value-props-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
