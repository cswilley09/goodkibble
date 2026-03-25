'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import SearchBox from './components/SearchBox';
import { useRouter } from 'next/navigation';

/* ── score helpers ── */
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

/* ── score ring ── */
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

/* ── Score Snapshot section ── */
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
      const sectionMiddle = rect.top + rect.height / 2;
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
      background: '#faf8f5', padding: '64px 0 56px', overflow: 'hidden', position: 'relative',
    }}>
      {/* header */}
      <div style={{ textAlign: 'center', marginBottom: 36, padding: '0 24px' }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 36px)',
          fontWeight: 800, color: '#1a1612', letterSpacing: -1, marginBottom: 8,
        }}>See how popular brands stack up</h2>
        <p style={{ fontSize: 15, color: '#8a7e72', maxWidth: 480, margin: '0 auto' }}>
          Every kibble scored 0–100 across nutrition and ingredient quality
        </p>
      </div>

      {/* fade edges */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, zIndex: 2,
        background: 'linear-gradient(to right, #faf8f5, transparent)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, zIndex: 2,
        background: 'linear-gradient(to left, #faf8f5, transparent)', pointerEvents: 'none',
      }} />

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
              <div style={{
                width: 56, height: 72, borderRadius: 10, overflow: 'hidden', background: '#f5f0e8',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <img src={p.image_url} alt="" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                  onError={(e) => e.target.style.display = 'none'} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: '#8a7e72', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{p.brand}</div>
              <div style={{
                fontSize: 14, fontWeight: 600, color: '#1a1612', lineHeight: 1.3, marginBottom: 4,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>{p.name}</div>
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

      {/* scroll hint */}
      <div style={{
        textAlign: 'center', marginTop: 20, fontSize: 13, color: '#b5aa99',
        fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
        opacity: hintVisible ? 1 : 0, transition: 'opacity 0.6s ease',
        pointerEvents: 'none',
      }}>
        Keep scrolling to see more →
      </div>
    </div>
  );
}

export default function Home() {
  const [brands, setBrands] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    supabase
      .from('dog_foods_v2')
      .select('brand')
      .then(({ data }) => {
        if (!data) return;
        setTotalCount(data.length);
        const counts = {};
        data.forEach(r => { counts[r.brand] = (counts[r.brand] || 0) + 1; });
        const sorted = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, count]) => ({ name, count }));
        setBrands(sorted);
      });
  }, []);

  function handleSelect(id) {
    router.push(`/food/${id}`);
  }

  function handleBrand(brandName) {
    router.push(`/brand/${encodeURIComponent(brandName)}`);
  }

  const labelStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '2.5px',
    color: '#1a1612',
    whiteSpace: 'nowrap',
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
  };

  const dashLeft = (w) => (
    <span style={{ display: 'inline-block', width: w, height: 0, borderTop: '1.5px dashed #1a161245', marginLeft: 8 }} />
  );

  const dashRight = (w) => (
    <span style={{ display: 'inline-block', width: w, height: 0, borderTop: '1.5px dashed #1a161245', marginRight: 8 }} />
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
          <button onClick={() => router.push('/discover')} style={{
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
          padding: '20px 48px 40px',
          gap: 60,
          animation: 'fadeUp 0.8s ease',
        }}>
          <div className="hero-kibble-col" style={{
            width: 320, flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <div style={{ position: 'relative', transform: 'rotate(-8deg)' }}>
              <img
                src="/hero-kibble.png"
                alt="Kibble nutritional breakdown"
                style={{ width: 130, height: 'auto', display: 'block' }}
              />
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
              <span
                onClick={() => router.push('/discover')}
                style={{
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
              <button key={b.name} onClick={() => handleBrand(b.name)}
                style={{
                  padding: '12px 22px', borderRadius: 100,
                  border: '1.5px solid #3d352b', background: 'transparent',
                  color: '#d4c9b8', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                  animationName: 'fadeUp', animationDuration: '0.5s',
                  animationFillMode: 'both', animationDelay: `${i * 80}ms`,
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f5d442';
                  e.target.style.color = '#1a1612';
                  e.target.style.borderColor = '#f5d442';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#d4c9b8';
                  e.target.style.borderColor = '#3d352b';
                }}
              >
                {b.name}
                <span style={{ marginLeft: 8, opacity: 0.5, fontSize: 12 }}>({b.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <ScoreSnapshot onCardClick={handleSelect} />
    </div>
  );
}
