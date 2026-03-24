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
  if (lower === 'salt') return true;
  return SALT_KEYWORDS.some(kw => lower === kw || lower.startsWith(kw + ' ') || lower.endsWith(' ' + kw) || lower.includes(kw));
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

/* Compact pill for bracketed ingredient sub-groups (vitamins [...], trace minerals [...]) */
function SubGroupPill({ groupName, subItems, afterSalt, animDelay }) {
  const [expanded, setExpanded] = useState(false);

  const baseDisplay = expanded ? 'block' : 'inline-block';
  const wrapStyle = afterSalt
    ? { display: baseDisplay, opacity: 0.4, width: expanded ? '100%' : 'auto' }
    : {
        display: baseDisplay,
        width: expanded ? '100%' : 'auto',
        animationName: 'fadeUp', animationDuration: '0.4s',
        animationFillMode: 'both', animationDelay: `${animDelay}ms`,
      };

  return (
    <span style={wrapStyle}>
      <span
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 100,
          fontSize: 14, fontFamily: "'DM Sans', sans-serif",
          border: '1px dashed #c4bdb2', background: '#fff',
          color: '#3d352b', cursor: 'pointer', transition: 'background 0.15s',
          verticalAlign: 'middle',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f0e8'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
      >
        <span style={{
          fontSize: 11, background: '#e8e0d4', color: '#5a5248',
          padding: '2px 7px', borderRadius: 100, fontWeight: 600,
        }}>{subItems.length}</span>
        {groupName}
        <span style={{ fontSize: 10, color: '#b5aa99', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </span>
      {expanded && (
        <div style={{
          marginTop: 6, padding: '12px 16px',
          borderRadius: 12, background: '#f5f0e8', border: '1px solid #ede8df',
          fontSize: 13, color: '#5a5248', lineHeight: 1.6,
          fontFamily: "'DM Sans', sans-serif",
          animation: 'fadeIn 0.15s ease',
        }}>
          {subItems.join(', ')}
        </div>
      )}
    </span>
  );
}

const SHARED_MAX = 50; /* shared 0-50% scale, same as compare page */

function TickBar({ value, color }) {
  const pct = Math.min((value / SHARED_MAX) * 100, 100);
  const ticks = [10, 20, 30, 40].map(v => (v / SHARED_MAX) * 100);
  return (
    <div style={{ flex: 1, position: 'relative', height: 10 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 100, background: '#ede8df', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 100, background: color,
          width: `${pct}%`, transition: 'width 0.8s ease',
        }} />
      </div>
      {ticks.map((tp) => (
        <div key={tp} style={{
          position: 'absolute', left: `${tp}%`, top: -2, bottom: -2,
          width: 1, background: '#d4cfc6', opacity: 0.5, pointerEvents: 'none',
        }} />
      ))}
    </div>
  );
}

function NutrientRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <span style={{
        fontSize: 14, fontWeight: 600, color: color,
        fontFamily: "'DM Sans', sans-serif",
        minWidth: 110, flexShrink: 0,
      }}>{label}</span>
      <span style={{
        fontSize: 18, fontWeight: 700, color: '#1a1612',
        fontFamily: "'DM Mono', monospace", lineHeight: 1,
        minWidth: 48, flexShrink: 0,
      }}>{value}<span style={{ fontSize: 12, fontWeight: 500, color: '#8a7e72' }}>%</span></span>
      <TickBar value={value} color={color} />
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

/* ── Score tier helper ── */
function getScoreTier(score) {
  if (score >= 90) return { label: 'Excellent', color: '#639922' };
  if (score >= 80) return { label: 'Very Good', color: '#639922' };
  if (score >= 70) return { label: 'Good', color: '#1D9E75' };
  if (score >= 60) return { label: 'Adequate', color: '#EF9F27' };
  if (score >= 50) return { label: 'Below Average', color: '#D85A30' };
  return { label: 'Concerning', color: '#C0392B' };
}

/* ── Score Ring ── */
function ScoreRing({ score, size = 52 }) {
  const tier = getScoreTier(score);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score / 100);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#E8E5DB" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={tier.color} strokeWidth={4}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 500, fontFamily: "'DM Mono', monospace", color: '#1a1612',
      }}>{score}</div>
    </div>
  );
}

/* ── Score Breakdown Bar Row ── */
function ScoreBarRow({ label, score, max, color, blurred }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, filter: blurred ? 'blur(4px)' : 'none', opacity: blurred ? 0.35 : 1 }}>
      <div style={{ width: 110, fontSize: 11, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 8, background: '#EDEAE2', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#1a1612', fontFamily: "'DM Mono', monospace", minWidth: 36, textAlign: 'right' }}>
        {blurred ? `?/${max}` : `${score}/${max}`}
      </div>
    </div>
  );
}

/* ── Score Breakdown Card ── */
function ScoreBreakdownCard({ breakdown }) {
  const [expandedCat, setExpandedCat] = useState(null);
  if (!breakdown || !breakdown.categories) return null;
  const cats = breakdown.categories;

  const toggleExpand = (key) => {
    setExpandedCat(expandedCat === key ? null : key);
  };

  /* expanded detail renderer */
  function renderDetail(key) {
    const c = cats[key];
    if (!c) return null;
    const lines = [];
    if (key === 'A_protein') {
      lines.push(`Protein DMB: ${c.protein_dmb}%`);
      lines.push(`Bracket: ${c.bracket} → ${c.score} points`);
      lines.push(`AAFCO adult minimum: 18% · growth minimum: 22.5%`);
    } else if (key === 'B_fat') {
      lines.push(`Fat DMB: ${c.fat_dmb}%`);
      lines.push(`Fat level: ${c.bracket_level} → ${c.fat_level_points}/8`);
      lines.push(`Fat:protein ratio: ${c.fat_protein_ratio} (${c.bracket_ratio}) → ${c.ratio_points}/7`);
    } else if (key === 'C_carbs') {
      lines.push(`Carbs DMB: ${c.carbs_dmb}%`);
      lines.push(`Bracket: ${c.bracket} → ${c.score} points`);
    } else if (key === 'D_fiber') {
      lines.push(`Fiber DMB: ${c.fiber_dmb}%`);
      lines.push(`Bracket: ${c.bracket} → ${c.score} points`);
    } else if (key === 'E_protein_source') {
      lines.push(`First animal protein: ${c.first_animal_protein || 'none'} → ${c.first_animal_points} pts`);
      lines.push(`Second animal protein: ${c.second_animal_protein || 'none'} → ${c.second_animal_points} pts`);
      lines.push(`Third+ animal protein: ${c.third_plus_animal ? 'yes' : 'no'} → ${c.third_plus_points} pts`);
      lines.push(`By-products: ${c.byproduct_status} → ${c.byproduct_points} pts`);
      if (c.splitting_penalty) lines.push(`Splitting penalty: ${c.splitting_penalty} (${c.splitting_detail})`);
      if (c.plant_concentrate_penalty) lines.push(`Plant concentrate penalty: ${c.plant_concentrate_penalty} (${(c.plant_concentrate_detail || []).join(', ')})`);
    } else if (key === 'F_preservatives') {
      lines.push(`Status: ${c.status === 'natural_only' ? 'Natural preservatives only' : c.status}`);
      if (c.synthetic_found && c.synthetic_found.length > 0) lines.push(`Found: ${c.synthetic_found.join(', ')}`);
    } else if (key === 'G_additives') {
      lines.push(`Artificial colors: ${c.artificial_colors ? 'yes' : 'none'}`);
      lines.push(`Artificial flavors: ${c.artificial_flavors ? 'yes' : 'none'}`);
    } else if (key === 'H_functional') {
      const p = c.probiotics || {};
      const o = c.omega3 || {};
      const g = c.glucosamine || {};
      const m = c.chelated_minerals || {};
      lines.push(`Probiotics: ${p.found ? (p.before_salt ? 'before salt' : 'after salt') : 'not found'} → ${p.points} pts`);
      lines.push(`Omega-3: ${o.found ? (o.ingredient || 'found') + (o.before_salt ? ' (before salt)' : ' (after salt)') : 'not found'} → ${o.points} pts`);
      lines.push(`Glucosamine: ${g.found ? 'found' : 'not found'} → ${g.points} pts`);
      lines.push(`Chelated minerals: ${m.found ? 'found' : 'not found'} → ${m.points} pts`);
    }
    return (
      <div style={{
        padding: '10px 14px', marginTop: 4, marginBottom: 8,
        borderRadius: 10, background: '#f5f0e8', fontSize: 12,
        color: '#5a5248', lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif",
        animation: 'fadeIn 0.15s ease',
      }}>
        {lines.map((line, i) => <div key={i}>{line}</div>)}
      </div>
    );
  }

  const nutritionRows = [
    { key: 'A_protein', label: 'Protein', color: '#639922' },
    { key: 'B_fat', label: 'Fat', color: '#EF9F27' },
    { key: 'C_carbs', label: 'Carbs', color: '#378ADD' },
    { key: 'D_fiber', label: 'Fiber', color: '#7F77DD' },
  ];
  const ingredientRows = [
    { key: 'E_protein_source', label: 'Protein sources', color: '#1D9E75' },
    { key: 'F_preservatives', label: 'Preservatives', color: '#1D9E75' },
    { key: 'G_additives', label: 'Additives', color: '#1D9E75' },
    { key: 'H_functional', label: 'Functional', color: '#1D9E75' },
  ];

  return (
    <div style={{
      padding: '28px 32px', background: '#faf8f5', borderRadius: 24,
      border: '1px solid #ede8df', marginBottom: 28,
      animation: 'scaleIn 0.5s ease 0.05s both',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>Score breakdown</span>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 1,
          padding: '3px 10px', borderRadius: 100,
          background: '#C8A415', color: '#fff',
          fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase',
        }}>PRO</span>
      </div>

      {/* Nutrition (visible to all) */}
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 10 }}>Nutrition</div>
      {nutritionRows.map(({ key, label, color }) => {
        const c = cats[key];
        if (!c) return null;
        return (
          <div key={key}>
            <div onClick={() => toggleExpand(key)} style={{ cursor: 'pointer' }}>
              <ScoreBarRow label={label} score={c.score} max={c.max} color={color} blurred={false} />
            </div>
            {expandedCat === key && renderDetail(key)}
          </div>
        );
      })}

      <div style={{ height: 1, background: '#ede8df', margin: '16px 0' }} />

      {/* Ingredients (blurred for free users) */}
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 10 }}>Ingredients</div>
      <div style={{ position: 'relative' }}>
        {ingredientRows.map(({ key, label, color }) => {
          const c = cats[key];
          if (!c) return null;
          return (
            <ScoreBarRow key={key} label={label} score={c.score} max={c.max} color={color} blurred={true} />
          );
        })}
        {/* Pro CTA overlay */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '16px 0 8px',
        }}>
          <button style={{
            padding: '10px 24px', borderRadius: 100,
            border: '1.5px solid #C8A415', background: '#fff',
            color: '#C8A415', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.2s',
          }}
            onMouseEnter={(e) => { e.target.style.background = '#C8A415'; e.target.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#C8A415'; }}
          >
            Unlock full breakdown — GoodKibble Pro
          </button>
          <div style={{ fontSize: 11, color: '#b5aa99', marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>
            $29.99/year · See exactly why this food scored {breakdown.total}
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: '#ede8df', margin: '16px 0 12px' }} />

      {/* Methodology link */}
      <div style={{ textAlign: 'center' }}>
        <a href="/how-we-score" style={{
          fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif",
          textDecoration: 'none', transition: 'color 0.15s',
        }}
          onMouseEnter={(e) => { e.target.style.color = '#1a1612'; e.target.style.textDecoration = 'underline'; }}
          onMouseLeave={(e) => { e.target.style.color = '#8a7e72'; e.target.style.textDecoration = 'none'; }}
        >
          Read our full scoring methodology
        </a>
      </div>
    </div>
  );
}

export default function FoodPage() {
  const params = useParams();
  const router = useRouter();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.from('dog_foods_v2').select('*').eq('id', params.id).single()
      .then(({ data }) => { setFood(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const goHome = () => router.push('/');
  const goFood = (id) => router.push(`/food/${id}`);
  const goBrand = () => food && router.push(`/brand/${encodeURIComponent(food.brand)}`);

  /* smart split: don't split on commas inside parentheses or brackets */
  const ingredients = food?.ingredients
    ? food.ingredients.match(/(?:[^,(\[]*(?:\([^)]*\)|\[[^\]]*\])?[^,(\[]*)*/g)
        ?.map((s) => s.trim()).filter(Boolean) || []
    : [];
  const saltIdx = findSaltIndex(ingredients);

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

              {/* Score ring + label */}
              {food.quality_score != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <ScoreRing score={food.quality_score} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>
                      {getScoreTier(food.quality_score).label}
                    </div>
                    <div style={{ fontSize: 11, color: '#b5aa99', fontFamily: "'DM Sans', sans-serif" }}>
                      <a href="/how-we-score" style={{ color: '#b5aa99', textDecoration: 'none' }}
                        onMouseEnter={(e) => { e.target.style.color = '#1a1612'; e.target.style.textDecoration = 'underline'; }}
                        onMouseLeave={(e) => { e.target.style.color = '#b5aa99'; e.target.style.textDecoration = 'none'; }}
                      >How we score</a> · v{food.score_version || '1.3'}
                    </div>
                  </div>
                </div>
              )}

              <CompareToggle food={food} />
            </div>
          </div>

          {/* Score Breakdown */}
          {food.score_breakdown && (
            <ScoreBreakdownCard breakdown={food.score_breakdown} />
          )}

          {/* Nutrition - Dry Matter Basis */}
          <div className="nutrition-section" style={{
            padding: '40px 32px', background: '#faf8f5', borderRadius: 24,
            border: '1px solid #ede8df', animation: 'scaleIn 0.5s ease 0.1s both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2.5, textTransform: 'uppercase', color: '#b5aa99' }}>
                Guaranteed Analysis (Dry Matter Basis)
              </span>
              <InfoTooltip text="These values are calculated on a Dry Matter Basis (DMB), which removes moisture content to give you a more accurate comparison between foods. Dry matter percentages reflect the actual nutrient concentration in the food solids, making it easier to compare wet and dry foods fairly." />
            </div>

            <div style={{ maxWidth: 560 }}>
              <NutrientRow label="Protein" value={food.protein_dmb || 0} color="#2d7a4f" />
              <NutrientRow label="Fat" value={food.fat_dmb || 0} color="#c47a20" />
              <NutrientRow label="Carbohydrates" value={food.carbs_dmb || 0} color="#5a7a9e" />
              {food.fiber_dmb > 0 && <NutrientRow label="Fiber" value={food.fiber_dmb} color="#8a6aaf" />}
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
                const afterSalt = (saltIdx >= 0 && i > saltIdx) ? true : false;

                let bgColor = '#fff';
                if (isSalt) bgColor = '#f0c930';
                else if (isFirst) bgColor = '#1a1612';
                else if (i < 5) bgColor = '#f5f0e8';

                let textColor = '#3d352b';
                if (isSalt) textColor = '#1a1612';
                else if (isFirst) textColor = '#faf8f5';

                /* detect bracketed sub-groups: "vitamins [...]" or "trace minerals [...]" */
                const bracketMatch = ing.match(/^([^[\]]+?)\s*\[(.+)\]$/s);
                if (bracketMatch) {
                  const groupName = bracketMatch[1].trim();
                  const subItems = bracketMatch[2].split(',').map(s => s.trim()).filter(Boolean);
                  return (
                    <SubGroupPill
                      key={i}
                      groupName={groupName}
                      subItems={subItems}
                      afterSalt={afterSalt}
                      animDelay={i * 20}
                    />
                  );
                }

                const pillStyle = {
                  display: 'inline-block', padding: '8px 16px', borderRadius: 100,
                  fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                  fontWeight: (isFirst || isSalt) ? 600 : 400,
                  background: bgColor,
                  color: textColor,
                  border: (isSalt || isFirst) ? 'none' : '1px solid #e8e0d4',
                  cursor: isSalt ? 'pointer' : 'default',
                };

                /* animation on non-dimmed pills only; after-salt pills skip animation
                   because the fadeUp keyframe ends at opacity:1 which overrides inline opacity */
                const wrapStyle = afterSalt
                  ? { display: 'inline-block', opacity: 0.4 }
                  : {
                      display: 'inline-block',
                      animationName: 'fadeUp', animationDuration: '0.4s',
                      animationFillMode: 'both', animationDelay: `${i * 20}ms`,
                    };

                const pill = <span style={pillStyle}>{ing}</span>;

                return isSalt ? (
                  <span key={i} style={wrapStyle}><SaltTooltip>{pill}</SaltTooltip></span>
                ) : (
                  <span key={i} style={wrapStyle}>{pill}</span>
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
