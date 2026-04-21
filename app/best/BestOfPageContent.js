'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import SearchBox from '@/app/components/SearchBox';
import CompareBubble from '@/app/components/CompareBubble';
import SignUpButton from '@/app/components/SignUpButton';

function getScoreTier(score) {
  if (score >= 90) return { label: 'Excellent', color: '#639922' };
  if (score >= 80) return { label: 'Great', color: '#639922' };
  if (score >= 70) return { label: 'Good', color: '#1D9E75' };
  if (score >= 60) return { label: 'Fair', color: '#EF9F27' };
  return { label: 'Poor', color: '#D85A30' };
}

function ScoreRing({ score, size = 56 }) {
  const tier = getScoreTier(score);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E8E5DB" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={tier.color} strokeWidth={4}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 700, fontFamily: "'Inter', sans-serif", color: '#1a1612',
      }}>{score}</div>
    </div>
  );
}

function generateWhyBlurb(product) {
  const parts = [];
  if (product.protein_dmb) parts.push(`High protein (${(Math.round(product.protein_dmb * 10) / 10)}% DMB)`);
  if (product.primary_protein) parts.push(`${product.primary_protein.toLowerCase()}-based`);
  const bd = product.score_breakdown?.categories;
  if (bd) {
    if (bd.F_preservatives?.status === 'natural_only') parts.push('natural preservatives only');
    if (bd.H_functional?.omega3?.found) parts.push('omega-3 present');
    if (bd.H_functional?.probiotics?.found) parts.push('probiotics included');
    if (bd.H_functional?.glucosamine?.found) parts.push('glucosamine added');
    if (bd.E_protein_source?.byproduct_status === 'none') parts.push('no by-products');
  }
  if (parts.length === 0) return `Scored ${product.quality_score}/100 in our comprehensive analysis.`;
  return parts.slice(0, 4).join(', ') + ` earned this a ${product.quality_score}/100 score.`;
}

function RankedCard({ rank, product }) {
  const tier = getScoreTier(product.quality_score);
  const [imgErr, setImgErr] = useState(false);
  return (
    <div style={{
      display: 'flex', gap: 20, padding: 24, background: '#fff', borderRadius: 20,
      border: '1px solid #ede8df', marginBottom: 16, alignItems: 'flex-start',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Rank */}
      <div style={{
        fontFamily: "'Instrument Serif', serif", fontSize: 32, fontWeight: 900,
        color: rank <= 3 ? '#2F6B48' : '#b5aa99', lineHeight: 1, minWidth: 36, textAlign: 'center',
        flexShrink: 0, paddingTop: 4,
      }}>#{rank}</div>

      {/* Image */}
      <div className="best-card-img" style={{
        width: 100, height: 120, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
        background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid #ede8df',
      }}>
        {product.image_url && !imgErr ? (
          <img src={product.image_url} alt={product.name} loading="lazy"
            onError={() => setImgErr(true)}
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
        ) : (
          <span style={{ fontSize: 36, color: '#c4b9a8' }}>🐕</span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <a href={`/brands/${product.brand_slug}`} style={{
              fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase',
              color: '#b5aa99', textDecoration: 'none',
            }}>{product.brand}</a>
            <h3 style={{ margin: '4px 0 0' }}>
              <a href={`/dog-food/${product.brand_slug}/${product.slug}`} style={{
                fontFamily: "'Instrument Serif', serif", fontSize: 18, fontWeight: 700,
                color: '#1a1612', textDecoration: 'none', lineHeight: 1.3,
              }}>{product.name}</a>
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <ScoreRing score={product.quality_score} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: tier.color }}>{tier.label}</div>
              <div style={{ fontSize: 11, color: '#b5aa99' }}>GoodKibble Score</div>
            </div>
          </div>
        </div>

        {/* Nutrient pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {product.protein_dmb != null && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: '#e8f5ee', color: '#2d7a4f' }}>
              Protein {(Math.round(product.protein_dmb * 10) / 10)}%
            </span>
          )}
          {product.fat_dmb != null && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: '#fef3e2', color: '#c47a20' }}>
              Fat {(Math.round(product.fat_dmb * 10) / 10)}%
            </span>
          )}
          {product.carbs_dmb != null && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: '#edf2f7', color: '#5a7a9e' }}>
              Carbs {(Math.round(product.carbs_dmb * 10) / 10)}%
            </span>
          )}
          {product.primary_protein && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: '#f5f2ec', color: '#6b6157' }}>
              {product.primary_protein}
            </span>
          )}
        </div>

        {/* Why it ranked */}
        <p style={{ fontSize: 13, color: '#6b6157', lineHeight: 1.5, margin: '0 0 10px' }}>
          {generateWhyBlurb(product)}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <a href={`/dog-food/${product.brand_slug}/${product.slug}`} style={{
            fontSize: 13, fontWeight: 600, color: '#1a1612', textDecoration: 'underline',
            textUnderlineOffset: 3, fontFamily: "'Inter', sans-serif",
          }}>Full Review</a>
          {product.affiliate_url && (
            <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer nofollow" style={{
              fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 100,
              background: '#1a1612', color: '#faf8f5', textDecoration: 'none',
              fontFamily: "'Inter', sans-serif",
            }}>Check Price on Amazon</a>
          )}
        </div>
      </div>
    </div>
  );
}

const ALL_RANKINGS = [
  { href: '/best/dog-food', label: 'Best Dog Food' },
  { href: '/best/puppy-food', label: 'Best Puppy Food' },
  { href: '/best/large-breed-dog-food', label: 'Best Large Breed Dog Food' },
  { href: '/best/grain-free-dog-food', label: 'Best Grain-Free Dog Food' },
];

export default function BestOfPageContent({ title, subtitle, intro, products, currentPath, totalAnalyzed }) {
  const router = useRouter();
  const goHome = () => router.push('/');

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* Nav */}
      <nav className="nav-bar" style={{
        padding: '16px 24px 16px 40px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: '1px solid #ede8df', background: '#fff',
        position: 'sticky', top: 0, zIndex: 40, gap: 16,
      }}>
        <div onClick={goHome} style={{
          fontFamily: "'Instrument Serif', serif", fontSize: 32, fontWeight: 800,
          color: '#1a1612', cursor: 'pointer', flexShrink: 0,
        }}>Good<span style={{ color: '#5FB37E' }}>Kibble</span></div>
        <div className="nav-search" style={{ flex: 1, maxWidth: 380 }}>
          <SearchBox onSelect={(id) => router.push(`/food/${id}`)} variant="nav" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CompareBubble />
          <SignUpButton />
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 13, color: '#b5aa99', marginBottom: 24, fontFamily: "'Inter', sans-serif" }}>
          <a href="/" style={{ color: '#b5aa99', textDecoration: 'none' }}>Home</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <a href="/best/dog-food" style={{ color: '#b5aa99', textDecoration: 'none' }}>Best</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#6b6157' }}>{title}</span>
        </nav>

        {/* Hero */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800,
            color: '#1a1612', lineHeight: 1.15, letterSpacing: -1, marginBottom: 8,
          }}>{title}</h1>
          <p style={{ fontSize: 15, color: '#8a7e72', marginBottom: 16, fontFamily: "'Inter', sans-serif" }}>
            {subtitle}
          </p>
          <div style={{
            fontSize: 14, color: '#5a5248', lineHeight: 1.7, maxWidth: 700,
            fontFamily: "'Inter', sans-serif",
          }}>
            {intro}
          </div>
        </div>

        {/* Product list */}
        <div>
          {products.map((p, i) => (
            <RankedCard key={p.id} rank={i + 1} product={p} />
          ))}
        </div>

        {/* How We Score */}
        <div style={{
          marginTop: 48, padding: '32px', background: '#faf8f5', borderRadius: 20,
          border: '1px solid #ede8df',
        }}>
          <h2 style={{
            fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 700,
            color: '#1a1612', marginBottom: 12,
          }}>How We Score</h2>
          <p style={{ fontSize: 14, color: '#5a5248', lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>
            Every dog food in our database is scored 0-100 across eight categories: protein, fat, carbohydrates, fiber,
            protein source quality, preservatives, additives, and functional ingredients. We use{' '}
            <a href="/how-we-score" style={{ color: '#1a1612', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              dry matter basis (DMB) calculations
            </a>{' '}
            to normalize nutrition across foods with different moisture levels. Rankings are based entirely on
            nutritional data and ingredient analysis — no brand pays for placement. {' '}
            <a href="/discover" style={{ color: '#1a1612', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Discover all {totalAnalyzed || '1,000+'} products
            </a>{' '}
            in our database.
          </p>
        </div>

        {/* Related Rankings */}
        <div style={{ marginTop: 32 }}>
          <h2 style={{
            fontFamily: "'Instrument Serif', serif", fontSize: 20, fontWeight: 700,
            color: '#1a1612', marginBottom: 16,
          }}>Related Rankings</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {ALL_RANKINGS.filter(r => r.href !== currentPath).map(r => (
              <a key={r.href} href={r.href} style={{
                padding: '12px 20px', borderRadius: 14, border: '1px solid #ede8df',
                background: '#fff', fontSize: 14, fontWeight: 600, color: '#1a1612',
                textDecoration: 'none', fontFamily: "'Inter', sans-serif",
                transition: 'background 0.15s, border-color 0.15s',
              }}>{r.label}</a>
            ))}
            <a href="/discover" style={{
              padding: '12px 20px', borderRadius: 14, border: '1px solid #ede8df',
              background: '#faf8f5', fontSize: 14, fontWeight: 600, color: '#8a7e72',
              textDecoration: 'none', fontFamily: "'Inter', sans-serif",
            }}>Browse All 1,000+ Foods</a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #ede8df', padding: '32px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, fontWeight: 800, color: '#1a1612' }}>
          Good<span style={{ color: '#5FB37E' }}>Kibble</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#b5aa99', flexWrap: 'wrap' }}>
          <a href="/terms" style={{ color: '#b5aa99', textDecoration: 'none' }}>Terms</a>
          <a href="/privacy" style={{ color: '#b5aa99', textDecoration: 'none' }}>Privacy</a>
          <a href="/recalls" style={{ color: '#b5aa99', textDecoration: 'none' }}>Recalls</a>
          <a href="/faq" style={{ color: '#b5aa99', textDecoration: 'none' }}>FAQ</a>
          <span>© 2026 GoodKibble. Not affiliated with any dog food brand.</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .best-card-img { display: none !important; }
        }
      `}</style>
    </div>
  );
}
