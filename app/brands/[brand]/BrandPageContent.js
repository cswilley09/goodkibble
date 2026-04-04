'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import SearchBox from '@/app/components/SearchBox';
import CompareBubble from '@/app/components/CompareBubble';
import SignUpButton from '@/app/components/SignUpButton';

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

function ScoreRing({ score }) {
  if (score == null) return null;
  const color = getScoreColor(score);
  const circumference = 106.8;
  const offset = circumference * (1 - score / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>
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

function ProductCard({ food, onClick }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #ede8df',
      cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex', gap: 14, alignItems: 'center',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,22,18,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {food.image_url && !imgErr ? (
        <div style={{ width: 56, height: 72, borderRadius: 10, overflow: 'hidden', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img src={food.image_url} alt="" onError={() => setImgErr(true)} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      ) : (
        <div style={{ width: 56, height: 72, borderRadius: 10, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🐕</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: '#8a7e72', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{food.brand}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', lineHeight: 1.3, marginBottom: 6,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{food.name}</div>
        {(food.flavor || food.primary_protein) && (
          <div style={{ marginBottom: 6 }}>
            {food.primary_protein && (
              <div style={{ fontSize: 12, color: '#8a7e72', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 600, color: '#6b6157' }}>Primary Protein:</span> {food.primary_protein}
              </div>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#e8f5ee', color: '#2d7a4f' }}>Protein {(Math.round(food.protein_dmb * 10) / 10)}%</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#fef3e2', color: '#c47a20' }}>Fat {(Math.round(food.fat_dmb * 10) / 10)}%</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#edf2f7', color: '#5a7a9e' }}>Carbs {(Math.round(food.carbs_dmb * 10) / 10)}%</span>
          {food.fiber_dmb != null && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#f0edf7', color: '#8a6aaf' }}>Fiber {(Math.round(food.fiber_dmb * 10) / 10)}%</span>
          )}
        </div>
      </div>
      <ScoreRing score={food.quality_score} />
    </div>
  );
}

export default function BrandPageContent({ brandName, brandSlug, products, avgScore, avgProtein, avgFat }) {
  const router = useRouter();
  const goHome = () => router.push('/');
  const goFood = (p) => router.push(`/dog-food/${p.brand_slug}/${p.slug}`);

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      <nav className="nav-bar" style={{
        padding: '16px 24px 16px 40px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: '1px solid #ede8df', background: '#fff',
        position: 'sticky', top: 0, zIndex: 40, gap: 16,
      }}>
        <div onClick={goHome} style={{
          fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800,
          color: '#1a1612', cursor: 'pointer', flexShrink: 0,
        }}>Good<span style={{ color: '#f0c930' }}>Kibble</span></div>
        <div className="nav-search" style={{ flex: 1, maxWidth: 380 }}>
          <SearchBox onSelect={(id) => router.push(`/food/${id}`)} variant="nav" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CompareBubble />
          <SignUpButton />
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 80px' }}>
        <button onClick={goHome} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', color: '#8a7e72', fontSize: 14,
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          marginBottom: 32, padding: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to search
        </button>

        {/* Brand header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 700, color: '#1a1612', marginBottom: 8,
          }}>{brandName}</h1>
          <p style={{ fontSize: 15, color: '#8a7e72', marginBottom: 16 }}>
            {products.length} products reviewed
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {avgScore && (
              <div style={{ background: '#faf8f5', border: '1px solid #ede8df', borderRadius: 12, padding: '12px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>{avgScore}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#8a7e72', letterSpacing: 1, textTransform: 'uppercase' }}>Avg Score</div>
              </div>
            )}
            {avgProtein && (
              <div style={{ background: '#faf8f5', border: '1px solid #ede8df', borderRadius: 12, padding: '12px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#2d7a4f', fontFamily: "'DM Sans', sans-serif" }}>{avgProtein}%</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#8a7e72', letterSpacing: 1, textTransform: 'uppercase' }}>Avg Protein</div>
              </div>
            )}
            {avgFat && (
              <div style={{ background: '#faf8f5', border: '1px solid #ede8df', borderRadius: 12, padding: '12px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#c47a20', fontFamily: "'DM Sans', sans-serif" }}>{avgFat}%</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#8a7e72', letterSpacing: 1, textTransform: 'uppercase' }}>Avg Fat</div>
              </div>
            )}
          </div>
        </div>

        {/* Product grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {products.map((p) => (
            <ProductCard key={p.id} food={p} onClick={() => goFood(p)} />
          ))}
        </div>
      </div>

      <div className="footer-bar" style={{
        borderTop: '1px solid #ede8df', padding: '32px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: '#1a1612' }}>
          Good<span style={{ color: '#f0c930' }}>Kibble</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#b5aa99', flexWrap: 'wrap' }}>
          <a href="/terms" style={{ color: '#b5aa99', textDecoration: 'none' }}>Terms</a>
          <a href="/privacy" style={{ color: '#b5aa99', textDecoration: 'none' }}>Privacy</a>
          <span>© 2026 GoodKibble. Not affiliated with any dog food brand.</span>
        </div>
      </div>
    </div>
  );
}
