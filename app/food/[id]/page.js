'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import SearchBox from '../../components/SearchBox';
import NutrientRing from '../../components/NutrientRing';

function QualityBadge({ protein, carbs }) {
  const pS = protein >= 30 ? 3 : protein >= 25 ? 2 : 1;
  const cS = carbs <= 45 ? 3 : carbs <= 55 ? 2 : 1;
  const t = pS + cS;
  const [score, lbl, color, bg] =
    t >= 5 ? ['A', 'Excellent', '#2d7a4f', '#e8f5ee'] :
    t >= 4 ? ['B', 'Good', '#5a7a2d', '#f0f5e8'] :
    t >= 3 ? ['C', 'Average', '#7a6b2d', '#f5f0e8'] :
             ['D', 'Below Avg', '#7a3d2d', '#f5ebe8'];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '8px 16px 8px 10px', borderRadius: 100, background: bg, border: `1.5px solid ${color}20`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 700, color: '#fff',
      }}>{score}</div>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color }}>
        {lbl} Nutrition
      </span>
    </div>
  );
}

function ProductImage({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div style={{
        width: '100%', maxWidth: 260, aspectRatio: '1', borderRadius: 20,
        background: '#f0ebe3', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#c4b9a8', fontSize: 56,
      }}>🐕</div>
    );
  }
  return <img src={src} alt={alt} onError={() => setErr(true)}
    style={{ width: '100%', maxWidth: 260, aspectRatio: '1', objectFit: 'contain',
      borderRadius: 20, background: '#fff', border: '1px solid #ede8df' }} />;
}

export default function FoodPage() {
  const params = useParams();
  const router = useRouter();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('dog_foods')
      .select('*')
      .eq('id', params.id)
      .single()
      .then(({ data }) => { setFood(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  function handleSelect(id) {
    router.push(`/food/${id}`);
  }

  const goHome = () => router.push('/');

  const ingredients = food?.ingredients
    ? food.ingredients.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const prices = food ? [
    food.size_1_lb && food.price_1 ? { lb: food.size_1_lb, price: food.price_1 } : null,
    food.size_2_lb && food.price_2 ? { lb: food.size_2_lb, price: food.price_2 } : null,
    food.size_3_lb && food.price_3 ? { lb: food.size_3_lb, price: food.price_3 } : null,
    food.size_4_lb && food.price_4 ? { lb: food.size_4_lb, price: food.price_4 } : null,
    food.size_5_lb && food.price_5 ? { lb: food.size_5_lb, price: food.price_5 } : null,
  ].filter(Boolean) : [];

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5' }}>
      {/* Nav */}
      <nav style={{
        padding: '16px 24px 16px 40px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: '1px solid #ede8df', background: '#faf8f5',
        position: 'sticky', top: 0, zIndex: 40, gap: 24,
      }}>
        <div onClick={goHome} style={{
          fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800,
          color: '#1a1612', cursor: 'pointer', flexShrink: 0,
        }}>kibble<span style={{ opacity: 0.4 }}>check</span></div>
        <SearchBox onSelect={handleSelect} variant="nav" />
      </nav>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
          <div style={{
            width: 40, height: 40, border: '4px solid #ede8df', borderTopColor: '#1a1612',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      ) : !food ? (
        <div style={{ textAlign: 'center', padding: '120px 24px', color: '#8a7e72', fontSize: 17 }}>
          Product not found. <span onClick={goHome} style={{ color: '#1a1612', cursor: 'pointer', textDecoration: 'underline' }}>Go back</span>
        </div>
      ) : (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
          <button onClick={goHome} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: '#8a7e72', fontSize: 14,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
            marginBottom: 32, padding: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to search
          </button>

          {/* Hero */}
          <div style={{
            display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap',
            animation: 'fadeUp 0.5s ease', marginBottom: 40,
          }}>
            <ProductImage src={food.image_url} alt={food.name} />
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 8 }}>{food.brand}</div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 700, color: '#1a1612',
                lineHeight: 1.2, marginBottom: 8, letterSpacing: -0.5,
              }}>{food.name}</h1>
              {food.flavor && <div style={{ fontSize: 15, color: '#8a7e72', marginBottom: 16 }}>Flavor: {food.flavor}</div>}
              <QualityBadge protein={food.protein || 0} carbs={food.carbohydrates || 0} />

              {prices.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 10 }}>Available sizes</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {prices.map((p, i) => (
                      <div key={i} style={{
                        padding: '10px 16px', borderRadius: 12,
                        border: '1.5px solid #ede8df', background: '#fff', fontSize: 14,
                      }}>
                        <span style={{ fontWeight: 600, color: '#1a1612' }}>{p.lb} lb</span>
                        <span style={{ color: '#8a7e72', marginLeft: 8 }}>${Number(p.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Nutrition */}
          <div style={{
            padding: '48px 32px', background: '#fff', borderRadius: 24,
            border: '1px solid #ede8df', animation: 'scaleIn 0.5s ease 0.1s both',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2.5, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 36 }}>Guaranteed Analysis</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(24px, 5vw, 56px)', flexWrap: 'wrap' }}>
              <NutrientRing label="Protein" value={food.protein || 0} color="#2d7a4f" delay={100} />
              <NutrientRing label="Fat" value={food.fat || 0} color="#c47a20" delay={250} />
              <NutrientRing label="Carbs" value={food.carbohydrates || 0} color="#5a7a9e" delay={400} />
              {food.fiber > 0 && <NutrientRing label="Fiber" value={food.fiber} color="#8a6aaf" delay={550} />}
              {food.moisture > 0 && <NutrientRing label="Moisture" value={food.moisture} color="#5a9e9e" delay={700} />}
            </div>
            <div style={{ marginTop: 40, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
              <div style={{ display: 'flex', height: 14, borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ width: `${food.protein}%`, background: '#2d7a4f', transition: 'width 1s ease' }} />
                <div style={{ width: `${food.fat}%`, background: '#c47a20', transition: 'width 1s ease 0.1s' }} />
                <div style={{ width: `${food.carbohydrates}%`, background: '#5a7a9e', transition: 'width 1s ease 0.2s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: '#8a7e72', fontWeight: 500 }}>
                <span>● Protein {food.protein}%</span>
                <span>● Fat {food.fat}%</span>
                <span>● Carbs {food.carbohydrates}%</span>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div style={{
            marginTop: 28, padding: '48px 32px', background: '#fff', borderRadius: 24,
            border: '1px solid #ede8df', animation: 'scaleIn 0.5s ease 0.2s both',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2.5, textTransform: 'uppercase', color: '#b5aa99' }}>Ingredients</div>
              <div style={{ fontSize: 12, color: '#b5aa99', fontWeight: 500 }}>{ingredients.length} ingredients</div>
            </div>
            <p style={{ fontSize: 13, color: '#8a7e72', marginBottom: 24, lineHeight: 1.5 }}>
              Listed in order of weight. The first ingredient is the most prominent.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ingredients.map((ing, i) => (
                <span key={i} style={{
                  display: 'inline-block', padding: '8px 16px', borderRadius: 100,
                  fontSize: 14, fontWeight: i === 0 ? 600 : 400,
                  background: i === 0 ? '#1a1612' : i < 5 ? '#f5f0e8' : '#faf8f5',
                  color: i === 0 ? '#faf8f5' : '#3d352b',
                  border: i === 0 ? 'none' : '1px solid #e8e0d4',
                  animationName: 'fadeUp', animationDuration: '0.4s',
                  animationFillMode: 'both', animationDelay: `${i * 20}ms`,
                }}>{ing}</span>
              ))}
            </div>
          </div>

          {/* Source */}
          {food.url && (
            <div style={{
              marginTop: 28, padding: '20px 24px', borderRadius: 16, background: '#f5f0e8',
              animation: 'fadeUp 0.5s ease 0.3s both',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
            }}>
              <span style={{ fontSize: 14, color: '#5a5047' }}>
                <strong>Source:</strong> Manufacturer&apos;s reported nutritional information
              </span>
              <a href={food.url} target="_blank" rel="noopener noreferrer" style={{
                fontSize: 13, fontWeight: 600, color: '#1a1612', textDecoration: 'none',
                padding: '8px 16px', borderRadius: 100, background: '#fff', border: '1px solid #e8e0d4',
              }}>View on PetSmart →</a>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #ede8df', padding: '32px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800, color: '#1a1612' }}>
          kibble<span style={{ opacity: 0.3 }}>check</span>
        </div>
        <div style={{ fontSize: 13, color: '#b5aa99' }}>© 2026 KibbleCheck. Not affiliated with any dog food brand.</div>
      </div>
    </div>
  );
}
