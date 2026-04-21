'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBox from '@/app/components/SearchBox';
import CompareBubble from '@/app/components/CompareBubble';
import SignUpButton from '@/app/components/SignUpButton';
import { ingredientSlug, CATEGORY_INFO, QUALITY_INFO } from '@/lib/ingredients';

const CATEGORY_ORDER = ['protein', 'fat', 'grain', 'fiber', 'fruit_veg', 'legume', 'vitamin', 'mineral', 'supplement', 'preservative', 'additive', 'other'];

export default function IngredientsIndexContent({ ingredients }) {
  const router = useRouter();
  const goHome = () => router.push('/');
  const [activeCategory, setActiveCategory] = useState(null);

  // Group by category
  const grouped = {};
  ingredients.forEach(i => {
    const cat = i.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(i);
  });

  const categories = CATEGORY_ORDER.filter(c => grouped[c] && grouped[c].length > 0);
  const visibleCategories = activeCategory ? [activeCategory] : categories;

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
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

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 13, color: '#b5aa99', marginBottom: 24, fontFamily: "'Inter', sans-serif" }}>
          <a href="/" style={{ color: '#b5aa99', textDecoration: 'none' }}>Home</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#6b6157' }}>Ingredients</span>
        </nav>

        <h1 style={{
          fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 800, color: '#1a1612', marginBottom: 8,
        }}>Dog Food Ingredients</h1>
        <p style={{ fontSize: 15, color: '#8a7e72', marginBottom: 28, fontFamily: "'Inter', sans-serif" }}>
          {ingredients.length} ingredients explained — tap any ingredient to learn what it is and which products contain it.
        </p>

        {/* Category filter tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
          <button onClick={() => setActiveCategory(null)} style={{
            padding: '8px 16px', borderRadius: 100, border: '1.5px solid #ede8df',
            background: !activeCategory ? '#1a1612' : '#fff',
            color: !activeCategory ? '#faf8f5' : '#3d352b',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
          }}>All ({ingredients.length})</button>
          {categories.map(cat => {
            const ci = CATEGORY_INFO[cat] || CATEGORY_INFO.other;
            const isActive = activeCategory === cat;
            return (
              <button key={cat} onClick={() => setActiveCategory(isActive ? null : cat)} style={{
                padding: '8px 16px', borderRadius: 100,
                border: isActive ? `1.5px solid ${ci.color}` : '1.5px solid #ede8df',
                background: isActive ? ci.color + '15' : '#fff',
                color: isActive ? ci.color : '#3d352b',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}>{ci.label} ({grouped[cat].length})</button>
            );
          })}
        </div>

        {/* Ingredient groups */}
        {visibleCategories.map(cat => {
          const ci = CATEGORY_INFO[cat] || CATEGORY_INFO.other;
          return (
            <div key={cat} style={{ marginBottom: 36 }}>
              <h2 style={{
                fontSize: 16, fontWeight: 700, color: ci.color, marginBottom: 12,
                fontFamily: "'Inter', sans-serif", letterSpacing: 0.5,
              }}>{ci.label}</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {grouped[cat].map(ing => {
                  const qi = QUALITY_INFO[ing.quality_signal] || QUALITY_INFO.neutral;
                  return (
                    <a key={ing.ingredient_name}
                      href={`/ingredients/${ingredientSlug(ing.ingredient_name)}`}
                      style={{
                        padding: '7px 14px', borderRadius: 100, fontSize: 13, fontWeight: 500,
                        background: '#fff', border: `1.5px solid ${qi.color}40`,
                        color: '#3d352b', textDecoration: 'none',
                        fontFamily: "'Inter', sans-serif", transition: 'background 0.15s, border-color 0.15s',
                      }}
                    >{ing.display_name}</a>
                  );
                })}
              </div>
            </div>
          );
        })}
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
    </div>
  );
}
