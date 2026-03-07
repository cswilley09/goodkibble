'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import SearchBox from '../../components/SearchBox';
import CompareBubble from '../../components/CompareBubble';
import { useCompare } from '../../components/CompareContext';

const SALT_KEYWORDS = ['salt', 'sodium chloride', 'iodized salt', 'sea salt'];

function isSaltIngredient(ing) {
  const lower = ing.toLowerCase().trim();
  return SALT_KEYWORDS.some(kw => lower === kw || lower.startsWith(kw + ' ') || lower.endsWith(' ' + kw));
}

function findSaltIndex(ingredients) {
  return ingredients.findIndex(ing => isSaltIngredient(ing));
}

function ProductImage({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div style={{
        width: 260, height: 320, borderRadius: 20,
        background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#c4b9a8', fontSize: 56, flexShrink: 0,
      }}>🐕</div>
    );
  }
  return (
    <div className="product-image-wrap" style={{
      width: 260, height: 320, borderRadius: 20, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#fff', flexShrink: 0, border: '1px solid #ede8df',
    }}>
      <img src={src} alt={alt} onError={() => setErr(true)}
        style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
    </div>
  );
}

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 8 }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(!show)}
    >
      <span style={{
        width: 20, height: 20, borderRadius: '50%', background: '#e8e0d4',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, color: '#8a7e72', cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
      }}>i</span>
      {show && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 10px)', left: '50%',
          transform: 'translateX(-50%)', width: 300, padding: '14px 16px',
          borderRadius: 12, background: '#1a1612', color: '#faf8f5',
          fontSize: 13, lineHeight: 1.5, fontWeight: 400,
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 8px 24px rgba(26,22,18,0.25)',
          zIndex: 50, animation: 'fadeIn 0.15s ease',
        }}>
          {text}
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0, borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent', borderTop: '6px solid #1a1612',
          }} />
        </div>
      )}
    </span>
  );
}

function SaltTooltip({ children }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)', width: 280, padding: '14px 16px',
          borderRadius: 12, background: '#1a1612', color: '#faf8f5',
          fontSize: 13, lineHeight: 1.5, fontWeight: 400,
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 8px 24px rgba(26,22,18,0.25)',
          zIndex: 50, pointerEvents: 'none', animation: 'fadeIn 0.15s ease',
        }}>
          The &ldquo;salt divider&rdquo; rule: any ingredient listed after salt typically makes up less than 1% of the total formula, as salt itself usually represents &lt;1% of the recipe.
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0, borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent', borderTop: '6px solid #1a1612',
          }} />
        </div>
      )}
    </span>
  );
}

function HorizontalBar({ label, value, color, maxVal = 50 }) {
  const pct = Math.min((value / maxVal) * 100, 100);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'baseline' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1612', fontFamily: "'DM Mono', monospace" }}>{value}%</span>
      </div>
      <div style={{ height: 12, borderRadius: 100, background: '#ede8df', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 100, background: color,
          width: `${pct}%`, transition: 'width 1s ease',
        }} />
      </div>
    </div>
  );
}

function NutrientExplainer() {
  const [open, setOpen] = useState(false);
  const nutrients = [
    { name: 'Protein', color: '#2d7a4f', desc: 'Essential for muscle development, immune function, and tissue repair. AAFCO recommends a minimum of 18% for adult dogs and 22.5% for puppies. Higher-protein foods (28%+) can benefit active dogs, but excessively high protein may stress the kidneys in dogs with renal issues.' },
    { name: 'Fat', color: '#c47a20', desc: 'The most concentrated energy source in dog food. Supports healthy skin, coat, brain function, and vitamin absorption. AAFCO minimum is 5.5% for adults and 8.5% for puppies. Most quality foods range between 12-20%. Dogs with pancreatitis may need lower-fat diets.' },
    { name: 'Carbohydrates', color: '#5a7a9e', desc: 'Provide energy and fiber for digestive health. Dogs have no minimum carbohydrate requirement, but carbs from whole grains, vegetables, and legumes provide beneficial fiber and nutrients. Very high carb content (50%+) may indicate filler ingredients.' },
    { name: 'Fiber', color: '#8a6aaf', desc: 'Promotes healthy digestion and regular bowel movements. Most dog foods contain 2-5% fiber. Higher fiber (5-10%) can help with weight management and blood sugar regulation. Sources like beet pulp and pumpkin are considered high quality.' },
    { name: 'Moisture', color: '#5a9e9e', desc: 'The water content in the food. Dry kibble typically contains 6-12% moisture. Higher moisture means less caloric density per cup. When comparing foods, dry matter basis removes moisture from the equation for a fairer comparison.' },
  ];
  return (
    <div style={{
      marginTop: 28, borderRadius: 24, border: '1px solid #ede8df',
      background: '#faf8f5', overflow: 'hidden',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '20px 32px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', border: 'none', background: 'transparent', cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1612', letterSpacing: 1 }}>
          📖 What do these numbers mean?
        </span>
        <span style={{ fontSize: 18, color: '#8a7e72', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: '0 32px 28px' }}>
          {nutrients.map((n) => (
            <div key={n.name} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #ede8df' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: n.color, display: 'inline-block' }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1612' }}>{n.name}</span>
              </div>
              <p style={{ fontSize: 14, color: '#5a5047', lineHeight: 1.6 }}>{n.desc}</p>
            </div>
          ))}
          <p style={{ fontSize: 12, color: '#b5aa99', lineHeight: 1.5, fontStyle: 'italic' }}>
            Nutrient guidelines based on AAFCO (Association of American Feed Control Officials) standards for dog food. Always consult your veterinarian for dietary advice specific to your dog.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Toggle compare button using global context ── */
function CompareToggle({ food }) {
  const { items, addItem, removeItem } = useCompare();
  const isAdded = items.some(f => f.id === food.id);
  const isFull = items.length >= 3;

  function handleClick() {
    if (isAdded) {
      removeItem(food.id);
    } else if (!isFull) {
      addItem(food);
    }
  }

  return (
    <button onClick={handleClick} style={{
      padding: '10px 20px', borderRadius: 100,
      border: isAdded ? '1.5px solid #1a1612' : '1.5px solid #ede8df',
      background: isAdded ? '#1a1612' : '#fff',
      color: isAdded ? '#faf8f5' : isFull ? '#b5aa99' : '#1a1612',
      fontSize: 13, fontWeight: 600,
      cursor: isFull && !isAdded ? 'default' : 'pointer',
      fontFamily: "'DM Sans', sans-serif",
      display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.25s',
      opacity: isFull && !isAdded ? 0.5 : 1,
    }}
      onMouseEnter={(e) => {
        if (isAdded) {
          e.currentTarget.style.background = '#c44';
          e.currentTarget.style.borderColor = '#c44';
        } else if (!isFull) {
          e.currentTarget.style.background = '#f5f0e8';
        }
      }}
      onMouseLeave={(e) => {
        if (isAdded) {
          e.currentTarget.style.background = '#1a1612';
          e.currentTarget.style.borderColor = '#1a1612';
        } else {
          e.currentTarget.style.background = '#fff';
        }
      }}
    >
      {isAdded ? '✓ Added to Compare' : isFull ? 'Compare Full (3/3)' : '+ Add to Compare'}
    </button>
  );
}

export default function FoodPage() {
  const params = useParams();
  const router = useRouter();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.from('dog_foods').select('*').eq('id', params.id).single()
      .then(({ data }) => { setFood(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const goHome = () => router.push('/');
  const goFood = (id) => router.push(`/food/${id}`);
  const goBrand = () => food && router.push(`/brand/${encodeURIComponent(food.brand)}`);

  const ingredients = food?.ingredients
    ? food.ingredients.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const saltIdx = findSaltIndex(ingredients);

  const prices = food ? [
    food.size_1_lb && food.price_1 ? { lb: food.size_1_lb, price: food.price_1 } : null,
    food.size_2_lb && food.price_2 ? { lb: food.size_2_lb, price: food.price_2 } : null,
    food.size_3_lb && food.price_3 ? { lb: food.size_3_lb, price: food.price_3 } : null,
    food.size_4_lb && food.price_4 ? { lb: food.size_4_lb, price: food.price_4 } : null,
    food.size_5_lb && food.price_5 ? { lb: food.size_5_lb, price: food.price_5 } : null,
  ].filter(Boolean) : [];

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
          <SearchBox onSelect={goFood} variant="nav" />
        </div>
        <CompareBubble />
      </nav>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #ede8df', borderTopColor: '#1a1612', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
          <div className="product-hero" style={{
            display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap',
            animation: 'fadeUp 0.5s ease', marginBottom: 40,
          }}>
            <ProductImage src={food.image_url} alt={food.name} />
            <div style={{ flex: 1, minWidth: 260 }}>
              <div onClick={goBrand} style={{
                fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase',
                color: '#b5aa99', marginBottom: 8, cursor: 'pointer', transition: 'color 0.2s',
              }}
                onMouseEnter={(e) => e.target.style.color = '#1a1612'}
                onMouseLeave={(e) => e.target.style.color = '#b5aa99'}
              >{food.brand} →</div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 700, color: '#1a1612',
                lineHeight: 1.2, marginBottom: 12, letterSpacing: -0.5,
              }}>{food.name}</h1>
              {food.flavor && <div style={{ fontSize: 15, color: '#8a7e72', marginBottom: 16 }}>Flavor: {food.flavor}</div>}

              <CompareToggle food={food} />

              {prices.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 10 }}>Available sizes</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {prices.map((p, i) => (
                      <div key={i} style={{
                        padding: '10px 16px', borderRadius: 12,
                        border: '1.5px solid #ede8df', background: '#faf8f5', fontSize: 14,
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

          {/* Nutrition - Horizontal Bars */}
          <div className="nutrition-section" style={{
            padding: '40px 32px', background: '#faf8f5', borderRadius: 24,
            border: '1px solid #ede8df', animation: 'scaleIn 0.5s ease 0.1s both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2.5, textTransform: 'uppercase', color: '#b5aa99' }}>
                Guaranteed Analysis
              </span>
              <InfoTooltip text="These values are calculated on a Dry Matter Basis (DMB), which removes moisture content to give you a more accurate comparison between foods. Dry matter percentages reflect the actual nutrient concentration in the food solids, making it easier to compare wet and dry foods fairly." />
            </div>

            <div style={{ maxWidth: 520 }}>
              <HorizontalBar label="Protein" value={food.protein || 0} color="#2d7a4f" maxVal={50} />
              <HorizontalBar label="Fat" value={food.fat || 0} color="#c47a20" maxVal={30} />
              <HorizontalBar label="Carbohydrates" value={food.carbohydrates || 0} color="#5a7a9e" maxVal={70} />
              {food.fiber > 0 && <HorizontalBar label="Fiber" value={food.fiber} color="#8a6aaf" maxVal={10} />}
              {food.moisture > 0 && <HorizontalBar label="Moisture" value={food.moisture} color="#5a9e9e" maxVal={15} />}
            </div>
          </div>

          {/* Nutrient Explainer */}
          <NutrientExplainer />

          {/* Ingredients */}
          <div className="ingredients-section" style={{
            marginTop: 28, padding: '40px 32px', background: '#faf8f5', borderRadius: 24,
            border: '1px solid #ede8df', animation: 'scaleIn 0.5s ease 0.2s both',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2.5, textTransform: 'uppercase', color: '#b5aa99' }}>Ingredients</div>
              <div style={{ fontSize: 12, color: '#b5aa99', fontWeight: 500 }}>{ingredients.length} ingredients</div>
            </div>
            <p style={{ fontSize: 13, color: '#8a7e72', marginBottom: 24, lineHeight: 1.5 }}>
              Listed in order of weight. The first ingredient is the most prominent.
              {saltIdx >= 0 && ' Ingredients after the salt indicator typically make up less than 1% of the formula.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ingredients.map((ing, i) => {
                const isSalt = isSaltIngredient(ing);
                const isFirst = i === 0;
                const isAfterSalt = saltIdx >= 0 && i > saltIdx;
                const pill = (
                  <span style={{
                    display: 'inline-block', padding: '8px 16px', borderRadius: 100,
                    fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                    fontWeight: isFirst || isSalt ? 600 : 400,
                    background: isSalt ? '#f0c930' : isFirst ? '#1a1612' : i < 5 ? '#f5f0e8' : '#fff',
                    color: isSalt ? '#1a1612' : isFirst ? '#faf8f5' : '#3d352b',
                    border: isSalt || isFirst ? 'none' : '1px solid #e8e0d4',
                    cursor: isSalt ? 'pointer' : 'default',
                    opacity: isAfterSalt ? 0.45 : 1,
                    animationName: 'fadeUp', animationDuration: '0.4s',
                    animationFillMode: 'both', animationDelay: `${i * 20}ms`,
                  }}>{ing}</span>
                );
                return isSalt ? (
                  <SaltTooltip key={i}>{pill}</SaltTooltip>
                ) : (
                  <span key={i}>{pill}</span>
                );
              })}
            </div>
            {saltIdx >= 0 && (
              <div style={{ marginTop: 16, fontSize: 12, color: '#b5aa99', fontStyle: 'italic' }}>
                * Ingredients after salt are dimmed — they typically represent &lt;1% of the formula.
              </div>
            )}
          </div>

          {/* Source */}
          {food.url && (
            <div style={{
              marginTop: 28, padding: '20px 24px', borderRadius: 16, background: '#faf8f5',
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

      <div className="footer-bar" style={{
        borderTop: '1px solid #ede8df', padding: '32px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div className="footer-logo" style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: '#1a1612' }}>
          Good<span style={{ color: '#f0c930' }}>Kibble</span>
        </div>
        <div style={{ fontSize: 13, color: '#b5aa99' }}>© 2026 GoodKibble. Not affiliated with any dog food brand.</div>
      </div>
    </div>
  );
}
