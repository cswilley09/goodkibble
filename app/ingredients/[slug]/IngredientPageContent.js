'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import SearchBox from '@/app/components/SearchBox';
import CompareBubble from '@/app/components/CompareBubble';
import SignUpButton from '@/app/components/SignUpButton';
import { ingredientSlug, CATEGORY_INFO, QUALITY_INFO } from '@/lib/ingredients';

function ScoreRing({ score }) {
  if (score == null) return null;
  const color = score >= 70 ? '#2d7a4f' : score >= 50 ? '#c47a20' : '#b5483a';
  const circumference = 106.8;
  const offset = circumference * (1 - score / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>
      <svg width={42} height={42} viewBox="0 0 42 42">
        <circle cx={21} cy={21} r={17} fill="none" stroke="#ede8df" strokeWidth={3} />
        <circle cx={21} cy={21} r={17} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 21 21)" />
        <text x={21} y={21} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", fill: '#1a1612' }}>{score}</text>
      </svg>
    </div>
  );
}

function ProductCard({ product }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <a href={`/dog-food/${product.brand_slug}/${product.slug}`} style={{
      background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #ede8df',
      display: 'flex', gap: 14, alignItems: 'center', textDecoration: 'none', color: 'inherit',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}>
      {product.image_url && !imgErr ? (
        <div style={{ width: 48, height: 60, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={product.image_url} alt="" loading="lazy" onError={() => setImgErr(true)}
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
        </div>
      ) : (
        <div style={{ width: 48, height: 60, borderRadius: 8, background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🐕</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#b5aa99', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{product.brand}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1612', lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{product.name}</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
          {product.protein != null && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 100, background: '#e8f5ee', color: '#2d7a4f' }}>Protein {product.protein}%</span>}
          {product.fat != null && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 100, background: '#fef3e2', color: '#c47a20' }}>Fat {product.fat}%</span>}
        </div>
      </div>
      <ScoreRing score={product.quality_score} />
    </a>
  );
}

export default function IngredientPageContent({ ingredient, products, productCount, related }) {
  const router = useRouter();
  const goHome = () => router.push('/');
  const qi = QUALITY_INFO[ingredient.quality_signal] || QUALITY_INFO.neutral;
  const ci = CATEGORY_INFO[ingredient.category] || CATEGORY_INFO.other;

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

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 13, color: '#b5aa99', marginBottom: 24, fontFamily: "'DM Sans', sans-serif" }}>
          <a href="/" style={{ color: '#b5aa99', textDecoration: 'none' }}>Home</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <a href="/ingredients" style={{ color: '#b5aa99', textDecoration: 'none' }}>Ingredients</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#6b6157' }}>{ingredient.display_name}</span>
        </nav>

        {/* Hero */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 4vw, 38px)',
              fontWeight: 700, color: '#1a1612', lineHeight: 1.2, margin: 0,
            }}>{ingredient.display_name}</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 100,
              background: qi.bg, color: qi.color,
            }}>{qi.label}</span>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 100,
              background: '#f5f2ec', color: ci.color,
            }}>{ci.label}</span>
          </div>
          <p style={{ fontSize: 15, color: '#3d352b', lineHeight: 1.7, maxWidth: 680, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>
            {ingredient.short_description}
          </p>
          {ingredient.source && (
            <p style={{ fontSize: 12, color: '#b5aa99', fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif" }}>
              Source: {ingredient.source}
            </p>
          )}
        </div>

        {/* Caution box */}
        {ingredient.quality_signal === 'caution' && (
          <div style={{
            padding: '20px 24px', borderRadius: 16, background: '#FFF3F0',
            border: '1px solid #FECACA', marginBottom: 32,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#C62828', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
              Why this ingredient deserves attention
            </div>
            <p style={{ fontSize: 13, color: '#5a4040', lineHeight: 1.6, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
              {ingredient.short_description} Some pet nutrition experts recommend avoiding or limiting foods with this ingredient. Always consult your veterinarian about dietary concerns specific to your dog.
            </p>
          </div>
        )}

        {/* Products containing this ingredient */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700,
            color: '#1a1612', marginBottom: 4,
          }}>Found in {productCount} dog food{productCount !== 1 ? 's' : ''}</h2>
          <p style={{ fontSize: 13, color: '#8a7e72', marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
            Showing top {products.length} by GoodKibble Score
          </p>
          {products.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <p style={{ color: '#8a7e72', fontSize: 14 }}>No products found containing this ingredient.</p>
          )}
        </div>

        {/* Related ingredients */}
        {related.length > 0 && (
          <div style={{
            padding: '28px 32px', background: '#faf8f5', borderRadius: 20,
            border: '1px solid #ede8df',
          }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700,
              color: '#1a1612', marginBottom: 16,
            }}>Related Ingredients</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {related.map(r => {
                const rqi = QUALITY_INFO[r.quality_signal] || QUALITY_INFO.neutral;
                return (
                  <a key={r.ingredient_name} href={`/ingredients/${ingredientSlug(r.ingredient_name)}`} style={{
                    padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500,
                    background: '#fff', border: `1.5px solid ${rqi.color}30`, color: '#3d352b',
                    textDecoration: 'none', fontFamily: "'DM Sans', sans-serif",
                    transition: 'background 0.15s',
                  }}>{r.display_name}</a>
                );
              })}
            </div>
          </div>
        )}

        {/* Browse all */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <a href="/ingredients" style={{
            fontSize: 14, fontWeight: 600, color: '#1a1612', textDecoration: 'underline',
            textUnderlineOffset: 3, fontFamily: "'DM Sans', sans-serif",
          }}>Browse all 666 ingredients</a>
        </div>
      </div>

      {/* Footer */}
      <div style={{
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
