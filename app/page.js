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

/* ── fade-in on scroll ── */
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
      {/* image area with overlapping score badge */}
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
            border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1,
          }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>{p.quality_score}</span>
          </div>
        )}
      </div>

      {/* card body */}
      <div style={{ padding: '28px 16px 18px', textAlign: 'center' }}>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase',
          color: '#8a7e72', marginBottom: 4, fontFamily: "'DM Sans', sans-serif",
        }}>{p.brand}</div>
        <div style={{
          fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700,
          color: '#1a1612', lineHeight: 1.3, marginBottom: 6,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{p.name}</div>
        {p.primary_protein && (
          <div style={{ fontSize: 11, color: '#8a7e72', marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>
            Primary Protein: {p.primary_protein}
          </div>
        )}

        {/* nutrient pills */}
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
        if (error) { console.error('Marquee query error:', error); return; }
        if (!data || data.length === 0) { console.warn('Marquee: no data returned'); return; }
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
      {/* header */}
      <div style={{ textAlign: 'center', marginBottom: 40, padding: '0 24px' }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 36px)',
          fontWeight: 800, color: '#1a1612', letterSpacing: -1, marginBottom: 8,
        }}>See how popular brands stack up</h2>
        <p style={{ fontSize: 15, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", maxWidth: 480, margin: '0 auto' }}>
          Every kibble scored 0–100 across nutrition and ingredient quality
        </p>
      </div>

      {/* fade edges */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, zIndex: 2, background: 'linear-gradient(to right, #faf8f4, transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, zIndex: 2, background: 'linear-gradient(to left, #faf8f4, transparent)', pointerEvents: 'none' }} />

      {/* marquee track */}
      <div className="marquee-track" style={{
        display: 'flex', gap: 20, width: 'max-content',
        animation: 'marquee 45s linear infinite',
      }}>
        {doubled.map((p, i) => (
          <MarqueeCard key={`${p.id}-${i}`} p={p} onClick={onCardClick} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   SECTION 3: STATS STRIP
   ═══════════════════════════════════════ */

function StatsStrip({ productCount, brandCount }) {
  const [ref, visible] = useFadeIn(0.2);
  const stats = [
    { number: productCount ? productCount.toLocaleString() : '—', label: 'products scored' },
    { number: brandCount || '—', label: 'brands analyzed' },
    { number: '8', label: 'scoring categories' },
    { number: '100%', label: 'manufacturer-sourced' },
  ];
  return (
    <div ref={ref} style={{ background: '#1a1612', padding: '56px 24px' }}>
      <div className="stats-grid" style={{
        maxWidth: 900, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24,
        ...fade(visible),
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 800, color: '#f0c930', lineHeight: 1.1, marginBottom: 6,
            }}>{s.number}</div>
            <div style={{
              fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
            }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   SECTION 4: HOW WE SCORE TEASER
   ═══════════════════════════════════════ */

const SCORING_CATS = {
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

  function CatRow({ cat }) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: 11,
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
      <div style={{ maxWidth: 780, margin: '0 auto', ...fade(visible) }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3vw, 38px)',
          fontWeight: 800, color: '#1a1612', letterSpacing: -1, marginBottom: 16, textAlign: 'center',
        }}>A score you can trust</h2>
        <p style={{
          fontSize: 16, color: '#5a5248', lineHeight: 1.7, maxWidth: 580,
          margin: '0 auto 40px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif",
        }}>
          Every dry kibble is scored 0–100 across eight categories. The first four measure nutritional
          content. The last four evaluate ingredient quality. No brand sponsorships. No hidden agendas.
        </p>

        <div className="scoring-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>Nutrition</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SCORING_CATS.nutrition.map(c => <CatRow key={c.name} cat={c} />)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>Ingredients</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SCORING_CATS.ingredients.map(c => <CatRow key={c.name} cat={c} />)}
            </div>
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

const PROTEINS = [
  { name: 'Chicken', emoji: '🐔' },
  { name: 'Salmon', emoji: '🐟' },
  { name: 'Lamb', emoji: '🐑' },
  { name: 'Beef', emoji: '🐄' },
  { name: 'Turkey', emoji: '🦃' },
  { name: 'Fish', emoji: '🐠' },
];

function BrowseByProtein({ proteinCounts, onNavigate }) {
  const [ref, visible] = useFadeIn(0.15);
  return (
    <div ref={ref} style={{ background: '#fff', padding: '80px 24px', borderTop: '1px solid #ede8df', borderBottom: '1px solid #ede8df' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', ...fade(visible) }}>
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
        }}>
          {PROTEINS.map(({ name, emoji }) => (
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
              <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
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
      <div style={{ maxWidth: 900, margin: '0 auto', ...fade(visible) }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3vw, 38px)',
          fontWeight: 800, color: '#1a1612', letterSpacing: -1, marginBottom: 48, textAlign: 'center',
        }}>Why GoodKibble?</h2>
        <div className="value-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {VALUE_PROPS.map((vp) => (
            <div key={vp.title} style={{
              background: '#fff', borderRadius: 20, padding: 32,
              border: '1px solid #ede8df',
            }}>
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
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 36px)',
          fontWeight: 800, color: '#faf8f4', letterSpacing: -0.5, marginBottom: 12,
        }}>Ready to see what&apos;s in your dog&apos;s food?</h2>
        <p style={{ fontSize: 15, color: '#8a7e72', marginBottom: 32, fontFamily: "'DM Sans', sans-serif" }}>
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
   MAIN PAGE
   ═══════════════════════════════════════ */

export default function Home() {
  const [totalCount, setTotalCount] = useState(0);
  const [brandCount, setBrandCount] = useState(0);
  const [proteinCounts, setProteinCounts] = useState({});
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase
      .from('dog_foods_v2')
      .select('brand, primary_protein')
      .then(({ data }) => {
        if (!data) return;
        setTotalCount(data.length);
        const bCounts = {};
        data.forEach(r => { bCounts[r.brand] = (bCounts[r.brand] || 0) + 1; });
        setBrandCount(Object.keys(bCounts).length);
        const pCounts = {};
        data.forEach(r => { if (r.primary_protein) pCounts[r.primary_protein] = (pCounts[r.primary_protein] || 0) + 1; });
        setProteinCounts(pCounts);
      });
  }, []);

  /* sticky nav scroll detection */
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
        <div style={{
          fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800,
          color: '#1a1612', letterSpacing: -0.5, cursor: 'pointer',
        }} onClick={() => goTo('/')}>
          Good<span style={{ color: '#C9A84C' }}>Kibble</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="nav-discover-link" onClick={() => goTo('/discover')} style={{
            fontSize: 14, fontWeight: 600, color: '#5a5248', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", transition: 'color 0.2s',
          }}
            onMouseEnter={(e) => e.target.style.color = '#1a1612'}
            onMouseLeave={(e) => e.target.style.color = '#5a5248'}
          >Discover Foods</span>
          <CompareBubble />
        </div>
      </nav>

      {/* ═══ SECTION 1: HERO ═══ */}
      <div style={{
        padding: '48px 24px 36px', maxWidth: 680, width: '100%',
        margin: '0 auto', textAlign: 'center',
        position: 'relative', zIndex: 30,
      }}>
        <div style={{
          fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
          color: '#C9A84C', marginBottom: 16,
          animation: 'fadeUp 0.6s ease both',
        }}>Know what&apos;s in the bowl</div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(38px, 5vw, 58px)', fontWeight: 900, color: '#1a1612',
          lineHeight: 1.08, letterSpacing: -2, marginBottom: 20,
          animation: 'fadeUp 0.6s ease 0.1s both',
        }}>
          What&apos;s really in<br />your dog&apos;s food?
        </h1>

        <p style={{
          fontSize: 18, color: '#8a7e72', lineHeight: 1.6, maxWidth: 480,
          margin: '0 auto 32px', fontFamily: "'DM Sans', sans-serif",
          animation: 'fadeUp 0.6s ease 0.2s both',
        }}>
          Search any dog food brand. Get a clear breakdown of ingredients and nutrition — no fluff.
        </p>

        <div style={{ animation: 'fadeUp 0.6s ease 0.3s both', position: 'relative', zIndex: 60, maxWidth: 520, margin: '0 auto' }}>
          <SearchBox onSelect={handleSelect} variant="hero" />
        </div>

        <div style={{
          marginTop: 16, animation: 'fadeUp 0.6s ease 0.4s both', textAlign: 'center',
        }}>
          <span onClick={() => goTo('/discover')} style={{
            fontSize: 14, color: '#C9A84C', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
            transition: 'color 0.2s',
          }}
            onMouseEnter={(e) => { e.target.style.color = '#a8882e'; e.target.style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { e.target.style.color = '#C9A84C'; e.target.style.textDecoration = 'none'; }}
          >
            or discover 900+ dog foods by filter →
          </span>
        </div>
      </div>

      {/* ═══ SECTION 2: MARQUEE ═══ */}
      <ProductMarquee onCardClick={handleSelect} />

      {/* ═══ SECTION 3: STATS ═══ */}
      <StatsStrip productCount={totalCount} brandCount={brandCount} />

      {/* ═══ SECTION 4: HOW WE SCORE ═══ */}
      <HowWeScoreTeaser onNavigate={goTo} />

      {/* ═══ SECTION 5: BROWSE BY PROTEIN ═══ */}
      <BrowseByProtein proteinCounts={proteinCounts} onNavigate={goTo} />

      {/* ═══ SECTION 6: WHY GOODKIBBLE ═══ */}
      <WhyGoodKibble />

      {/* ═══ SECTION 7: FOOTER CTA ═══ */}
      <FooterCTA onNavigate={goTo} onSelect={handleSelect} />

      {/* ═══ FOOTER ═══ */}
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

      {/* ═══ STYLES ═══ */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        .marquee-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(26,22,18,0.10);
        }
        .protein-tile:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(26,22,18,0.06);
          border-color: #C9A84C !important;
        }
        @media (max-width: 768px) {
          .site-nav { padding: 12px 16px !important; }
          .nav-discover-link { display: none !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 28px 16px !important; }
          .scoring-cols { grid-template-columns: 1fr !important; gap: 28px !important; }
          .protein-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .value-grid { grid-template-columns: 1fr !important; }
          .marquee-card { width: 210px !important; }
        }
      `}</style>
    </div>
  );
}
