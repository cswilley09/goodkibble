'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SearchBox from './SearchBox';
import CompareBubble from './CompareBubble';
import SignUpButton from './SignUpButton';
import { useCompare } from './CompareContext';
import { useAuth } from './AuthContext';
import { ProGateOverlay } from './ProGate';

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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

/* InfoTooltip — simple inline text, shown via parent's activeInfo state */
function InfoTooltip({ text, onShow }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 8 }}
      onClick={() => onShow(text)}
    >
      <span style={{
        width: 20, height: 20, borderRadius: '50%', background: '#e8e0d4',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, color: '#8a7e72', cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
      }}>i</span>
    </span>
  );
}

/* Normalize an ingredient string for matching against ingredient_info table */
function normalizeIngredient(ing) {
  let s = ing.toLowerCase().trim();
  // Strip trailing punctuation (some brands end with periods)
  s = s.replace(/[.]+$/, '').trim();
  // Strip &nbsp; artifacts
  s = s.replace(/&nbsp;/g, '').trim();
  // Strip Purina manufacturing codes: "garlic oil. e449223 manufactured and..."
  s = s.replace(/\.\s*[a-z]?\d{5,}.*$/i, '').trim();
  // Strip "manufactured and guaranteed by..." suffixes
  s = s.replace(/\s*manufactured\s+(and\s+)?guaranteed\s+by.*$/i, '').trim();
  // Strip trailing periods again after stripping codes
  s = s.replace(/[.]+$/, '').trim();
  // Strip parenthetical content: "chicken fat (preserved with mixed tocopherols)" → "chicken fat"
  s = s.replace(/\s*\([^)]*\)$/g, '').trim();
  // Strip leading "and "
  if (s.startsWith('and ')) s = s.slice(4).trim();
  // Normalize color numbers: "red #40" → "red 40"
  s = s.replace(/#(\d)/g, '$1');
  return s;
}

const STRIP_PREFIXES = ['whole grain ', 'ground whole grain ', 'ground whole ', 'whole ', 'ground ', 'dried ', 'dehydrated ', 'deboned ', 'freeze-dried ', 'freeze dried ', 'pressed ', 'organic ', 'raw ', 'roasted ', 'smoke-flavored ', 'yellow ', 'white '];

function lookupIngredient(ing, ingredientInfo) {
  if (!ingredientInfo || !ing) return null;
  let lower = ing.toLowerCase().trim().replace(/[.]+$/, '');
  // 1. Exact match (full string as-is)
  if (ingredientInfo[lower]) return ingredientInfo[lower];
  // 2. With full normalization (strips parens, codes, punctuation, etc.)
  const norm = normalizeIngredient(ing);
  if (ingredientInfo[norm]) return ingredientInfo[norm];
  // 3. Try prefix-stripped variations: "whole cranberries" → "cranberries"
  for (const prefix of STRIP_PREFIXES) {
    if (norm.startsWith(prefix)) {
      const base = norm.slice(prefix.length);
      if (ingredientInfo[base]) return ingredientInfo[base];
      // Try singular→plural and plural→singular
      if (ingredientInfo[base + 's']) return ingredientInfo[base + 's'];
      if (base.endsWith('s') && ingredientInfo[base.slice(0, -1)]) return ingredientInfo[base.slice(0, -1)];
      if (base.endsWith('es') && ingredientInfo[base.slice(0, -2)]) return ingredientInfo[base.slice(0, -2)];
    }
  }
  // 4. Try plural/singular on the normalized form directly
  if (ingredientInfo[norm + 's']) return ingredientInfo[norm + 's'];
  if (norm.endsWith('s') && ingredientInfo[norm.slice(0, -1)]) return ingredientInfo[norm.slice(0, -1)];
  if (norm.endsWith('es') && ingredientInfo[norm.slice(0, -2)]) return ingredientInfo[norm.slice(0, -2)];
  // 5. "oat meal" → "oatmeal" (space removal)
  const nospace = norm.replace(/\s+/g, '');
  if (ingredientInfo[nospace]) return ingredientInfo[nospace];
  // 6. Try stripping multiple prefixes: "ground yellow corn" → "yellow corn" → "corn"
  let multi = norm;
  for (let attempts = 0; attempts < 3; attempts++) {
    let stripped = false;
    for (const prefix of STRIP_PREFIXES) {
      if (multi.startsWith(prefix)) {
        multi = multi.slice(prefix.length);
        stripped = true;
        break;
      }
    }
    if (!stripped) break;
    if (ingredientInfo[multi]) return ingredientInfo[multi];
    if (ingredientInfo[multi + 's']) return ingredientInfo[multi + 's'];
    if (multi.endsWith('s') && ingredientInfo[multi.slice(0, -1)]) return ingredientInfo[multi.slice(0, -1)];
  }
  // 7. Strip trailing "]" or ")" that leaked from bracket groups
  const cleanTrail = norm.replace(/[)\]]+$/, '').trim();
  if (cleanTrail !== norm && ingredientInfo[cleanTrail]) return ingredientInfo[cleanTrail];
  return null;
}

const SIGNAL_COLORS = { good: '#2d7a4f', neutral: '#8a7e72', caution: '#d4852a' };
const SIGNAL_BG = { good: 'rgba(45,122,79,0.12)', neutral: 'rgba(138,126,114,0.12)', caution: 'rgba(212,133,42,0.12)' };

/* IngredientInfoCard — rendered in document flow below the pills */
function IngredientInfoCard({ info, onClose }) {
  if (!info) return null;
  return (
    <div style={{
      marginTop: 12, padding: 16, borderRadius: 12,
      background: '#1a1612', color: '#faf8f5',
      fontSize: 13, lineHeight: 1.55, fontWeight: 400,
      fontFamily: "'DM Sans', sans-serif",
      animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: SIGNAL_COLORS[info.quality_signal] || SIGNAL_COLORS.neutral,
        }} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>{info.display_name}</span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
          textTransform: 'uppercase', padding: '2px 8px', borderRadius: 100, flexShrink: 0,
          background: SIGNAL_BG[info.quality_signal] || SIGNAL_BG.neutral,
          color: SIGNAL_COLORS[info.quality_signal] || SIGNAL_COLORS.neutral,
        }}>{info.quality_signal}</span>
        <span onClick={onClose} style={{
          marginLeft: 8, fontSize: 14, color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer', lineHeight: 1, padding: '0 2px',
        }}>&times;</span>
      </div>
      <div style={{ color: '#d4cfc6', marginBottom: info.source ? 10 : 0 }}>
        {info.short_description}
      </div>
      {info.source && (
        <div style={{ fontSize: 11, color: '#8a7e72', fontStyle: 'italic' }}>
          Source: {info.source}
        </div>
      )}
    </div>
  );
}

/* Mobile bottom sheet for ingredient info */
function IngredientBottomSheet({ info, onClose, bottomOffset = 0, gated = false }) {
  if (!info) return null;
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.3)', zIndex: 9998,
      }} />
      <div style={{
        position: 'fixed', bottom: bottomOffset, left: 0, right: 0,
        background: '#1a1612', color: '#faf8f5',
        borderRadius: '20px 20px 0 0', padding: '24px 24px 32px',
        fontFamily: "'DM Sans', sans-serif",
        boxShadow: '0 -8px 32px rgba(0,0,0,0.3)',
        zIndex: 9999,
        animation: 'bottomSheetUp 0.25s ease both',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 16px' }} />
        <div onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 16, color: 'rgba(255,255,255,0.5)',
        }}>&times;</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingRight: 36 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: SIGNAL_COLORS[info.quality_signal] || SIGNAL_COLORS.neutral,
          }} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>{info.display_name}</span>
          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
            textTransform: 'uppercase', padding: '2px 8px', borderRadius: 100, flexShrink: 0,
            background: SIGNAL_BG[info.quality_signal] || SIGNAL_BG.neutral,
            color: SIGNAL_COLORS[info.quality_signal] || SIGNAL_COLORS.neutral,
          }}>{info.quality_signal}</span>
        </div>
        {gated ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#C9A84C', marginBottom: 10 }}>Ingredient Intelligence</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 12, lineHeight: 1.5 }}>
              See what each ingredient means for your dog with GoodKibble Pro
            </div>
            <a href="/pro" style={{
              display: 'inline-block', padding: '8px 20px', borderRadius: 100,
              background: '#C9A84C', color: '#fff', fontSize: 12, fontWeight: 700,
              textDecoration: 'none', fontFamily: "'DM Sans', sans-serif",
            }}>Unlock with Pro {'\u2192'}</a>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: info.source ? 10 : 0 }}>
              {info.short_description}
            </div>
            {info.source && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                Source: {info.source}
              </div>
            )}
          </>
        )}
      </div>
    </>
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
        fontFamily: "'DM Sans', sans-serif", lineHeight: 1,
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
  const { isPro } = useAuth();
  const maxCompare = isPro ? 6 : 2;
  const isAdded = items.some(f => f.id === food.id);
  const isFull = items.length >= maxCompare;

  function handleClick() {
    if (isAdded) {
      removeItem(food.id);
    } else {
      addItem(food); // nudges even when full
    }
  }

  return (
    <button onClick={handleClick} className="compare-toggle-btn" style={{
      padding: '10px 20px', borderRadius: 100,
      border: isAdded ? '1.5px solid #1a1612' : '1.5px solid #ede8df',
      background: isAdded ? '#1a1612' : '#fff',
      color: isAdded ? '#faf8f5' : isFull ? '#b5aa99' : '#1a1612',
      fontSize: 13, fontWeight: 600,
      cursor: isFull && !isAdded ? 'default' : 'pointer',
      fontFamily: "'DM Sans', sans-serif",
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.25s',
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
      {isAdded ? '\u2713 Added to Compare' : isFull ? `Compare Full (${maxCompare}/${maxCompare})` : '+ Add to Compare'}
    </button>
  );
}

/* ── Score tier helper ── */
function getScoreTier(score) {
  if (score >= 90) return { label: 'Excellent', color: '#639922' };
  if (score >= 80) return { label: 'Great', color: '#639922' };
  if (score >= 70) return { label: 'Good', color: '#1D9E75' };
  if (score >= 60) return { label: 'Fair', color: '#EF9F27' };
  return { label: 'Poor', color: '#D85A30' };
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
        fontSize: size >= 72 ? 22 : 16, fontWeight: size >= 72 ? 700 : 500, fontFamily: "'DM Sans', sans-serif", color: '#1a1612',
      }}>{score}</div>
    </div>
  );
}


/* ── Mini Ring for tiles (36px) ── */

/* ── Tile Ring (40px, matches GA value style) ── */
function TileRing({ score, max, color }) {
  const circumference = 2 * Math.PI * 16;
  const pct = max > 0 ? score / max : 0;
  const offset = circumference * (1 - pct);
  return (
    <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
      <svg width={40} height={40} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={20} cy={20} r={16} fill="none" stroke="#ede8df" strokeWidth={3} />
        <circle cx={20} cy={20} r={16} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", color: '#1a1612',
      }}>{score}</div>
    </div>
  );
}

/* ── Detail panel per category ── */
function CategoryDetailPanel({ catKey, data, color }) {
  if (!data) return null;
  const c = data;
  let cells = [];
  let context = '';
  let citation = '';

  if (catKey === 'A_protein') {
    cells = [
      { l: 'Protein (DMB)', v: `${(Math.round(c.protein_dmb * 10) / 10)}%` },
      { l: 'Bracket', v: `${c.bracket} → ${c.score} pts` },
      { l: 'AAFCO adult min', v: '18.0%' },
      { l: 'AAFCO growth min', v: '22.5%' },
    ];
    const ratio = c.protein_dmb ? (c.protein_dmb / 22.5).toFixed(1) : '?';
    context = `Exceeds AAFCO growth minimum by ${ratio}x. Protein provides the 10 essential amino acids dogs cannot produce on their own.`;
    citation = 'AAFCO, 2016; NRC, 2006';
  } else if (catKey === 'B_fat') {
    cells = [
      { l: 'Fat (DMB)', v: `${(Math.round(c.fat_dmb * 10) / 10)}%` },
      { l: 'Fat level', v: `${c.fat_level_points}/8 pts` },
      { l: 'Fat:protein ratio', v: `${c.fat_protein_ratio}` },
      { l: 'Ratio score', v: `${c.ratio_points}/7 pts` },
    ];
    context = 'AAFCO minimum is 5.5% for adults, 8.5% for growth.';
    citation = 'AAFCO, 2016; NRC, 2006';
  } else if (catKey === 'C1_carb_level' || catKey === 'C_carbs') {
    cells = [
      { l: 'Carbs (DMB)', v: `${(Math.round(c.carbs_dmb * 10) / 10)}%` },
      { l: 'Bracket', v: `→ ${c.score}/${c.max} pts` },
      { l: 'NRC requirement', v: 'None established' },
    ];
    context = 'Dogs have no dietary requirement for carbohydrates (NRC, 2006). Carbs = 100 − protein − fat − fiber − ash.';
    citation = 'NRC, 2006';
  } else if (catKey === 'C2_carb_source') {
    cells = [
      { l: 'Primary carb source', v: c.primary_carb ? capitalize(c.primary_carb) : 'Not detected' },
      { l: 'Glycemic tier', v: c.tier_label || 'Unknown' },
      { l: 'Score', v: `${c.score}/${c.max} pts` },
    ];
    if (c.carb_before_protein) {
      cells.push({ l: 'Position penalty', v: 'Carb appears before animal protein — capped at 2 pts' });
    }
    context = 'Carb source quality based on published canine glycemic index data. Low-GI sources (sweet potato, oats, lentils) score higher.';
    citation = 'Carciofi 2008; Adolphe 2012, 2015; Vastolo 2023; Rankovic 2020; Domingues 2023';
  } else if (catKey === 'D_fiber') {
    cells = [
      { l: 'Fiber (DMB)', v: `${(Math.round(c.fiber_dmb * 10) / 10)}%` },
      { l: 'Bracket', v: `→ ${c.score} pts` },
    ];
    context = 'No minimum requirement established. This category functions as a formulation quality signal.';
    citation = 'NRC, 2006';
  } else if (catKey === 'E_protein_source') {
    cells = [
      { l: 'First animal protein', v: capitalize(c.first_animal_protein) || 'None' },
      { l: 'Second animal protein', v: capitalize(c.second_animal_protein) || 'None in top 5' },
      { l: 'Species diversity', v: c.diversity_label || `${(c.species_diversity || []).length} group(s)` },
      { l: 'By-product status', v: capitalize(c.byproduct_status) || 'None' },
      { l: 'Splitting penalty', v: c.splitting_penalty ? capitalize(`${c.splitting_penalty}`) : 'None' },
    ];
    if (c.plant_concentrate_penalty) {
      cells.push({ l: 'Plant protein penalty', v: `${capitalize(`${c.plant_concentrate_penalty}`)} — ${(c.plant_concentrate_detail || []).map(capitalize).join(', ')}` });
    }
    context = c.byproduct_status === 'none'
      ? 'Named animal proteins in top positions with no by-products detected.'
      : `By-product status: ${capitalize(c.byproduct_status)}.`;
    citation = 'AAFCO definitions; Templeman & Shoveller, 2022';
  } else if (catKey === 'F_preservatives') {
    cells = [
      { l: 'Synthetic found', v: (c.synthetic_found && c.synthetic_found.length > 0) ? c.synthetic_found.map(capitalize).join(', ') : 'None' },
      { l: 'Status', v: c.status === 'natural_only' ? 'Natural only' : capitalize(c.status) },
    ];
    context = c.status === 'natural_only'
      ? 'No synthetic preservatives detected.'
      : 'Multiple regulatory bodies have flagged synthetic preservatives.';
    citation = 'NTP, 2021; EFSA, 2018';
  } else if (catKey === 'G_additives') {
    cells = [
      { l: 'Artificial colors', v: c.artificial_colors ? 'Yes' : 'No' },
      { l: 'Artificial flavors', v: c.artificial_flavors ? 'Yes' : 'No' },
    ];
    context = "Dogs have dichromatic vision — artificial colors serve no function for the dog.";
    citation = 'Miller & Murphy, 1995';
  } else if (catKey === 'H_functional') {
    const p = c.probiotics || {};
    const o = c.omega3 || {};
    const g = c.glucosamine || {};
    const m = c.chelated_minerals || {};
    cells = [
      { l: 'Omega-3 source', v: o.found ? `${o.ingredient || 'Found'} → ${o.points} pts` : 'Not found → 0 pts', green: o.found },
      { l: 'Probiotics', v: p.found ? `Found → ${p.points} pts` : 'Not found → 0 pts', green: p.found },
      { l: 'Glucosamine', v: g.found ? `Found → ${g.points} pts` : 'Not found → 0 pts', green: g.found },
      { l: 'Chelated minerals', v: m.found ? `Found → ${m.points} pts` : 'Not found → 0 pts', green: m.found },
    ];
    const foundItems = [o.found && 'omega-3', p.found && 'probiotics', g.found && 'glucosamine', m.found && 'chelated minerals'].filter(Boolean);
    context = foundItems.length > 0
      ? `${foundItems.join(', ')} qualified at meaningful concentration (before salt).`
      : 'No functional ingredients detected before salt.';
    citation = 'Bauer, 2011, JAVMA';
  }

  return (
    <div style={{
      background: '#ede8df', borderRadius: '0 0 12px 0', marginTop: -2,
      padding: '16px 18px 18px',
      borderLeft: `3px solid ${color || '#ccc'}`,
      animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', maxWidth: 460 }}>
        {cells.map((cell, i) => (
          <div key={i}>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#b5aa99' }}>{cell.l}</div>
            <div style={{
              fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
              color: cell.green ? '#2d7a4f' : '#1a1612',
            }}>{cell.v}</div>
          </div>
        ))}
      </div>
      {context && (
        <div style={{
          marginTop: 10, paddingTop: 10,
          borderTop: '1px solid rgba(0,0,0,0.06)',
          fontSize: 11, fontWeight: 400, color: '#8a7e72', lineHeight: 1.6,
        }}>
          {context}
          {citation && <div style={{ fontStyle: 'italic', color: '#b5aa99', marginTop: 2 }}>{citation}</div>}
        </div>
      )}
    </div>
  );
}

/* ── Single Tile (flex child) ── */
function ScoreTile({ catKey, label, color, textColor, data, isExpanded, onToggle }) {
  if (!data) return null;
  const nameColor = textColor || color;
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        onClick={() => onToggle(catKey)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px',
          background: isExpanded ? '#ede8df' : '#f4f1ec',
          borderRadius: isExpanded ? '12px 12px 0 0' : 12,
          cursor: 'pointer', transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = '#ede8df'; }}
        onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = '#f4f1ec'; }}
      >
        <TileRing score={data.score} max={data.max} color={color} />
        <span style={{ fontSize: 14, fontWeight: 600, color: nameColor, flex: 1, minWidth: 0, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>{data.score}/{data.max}</span>
        <span style={{
          fontSize: 18, color: '#8a7e72', flexShrink: 0, transition: 'transform 0.2s',
          transform: isExpanded ? 'rotate(180deg)' : 'none',
        }}>▼</span>
      </div>
      {isExpanded && <CategoryDetailPanel catKey={catKey} data={data} color={color} />}
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

  const nutRow1 = [
    { key: 'A_protein', label: 'Protein', color: '#2d7a4f' },
    { key: 'B_fat', label: 'Fat', color: '#c47a20' },
  ];
  // Support both old (C_carbs) and new (C1+C2) breakdown keys
  const hasNewCarbs = !!cats?.C1_carb_level;
  const nutRow2 = hasNewCarbs ? [
    { key: 'C1_carb_level', label: 'Carb Level', color: '#5a7a9e' },
    { key: 'C2_carb_source', label: 'Carb Source', color: '#4a8a9e' },
  ] : [
    { key: 'C_carbs', label: 'Carbs', color: '#5a7a9e' },
    { key: 'D_fiber', label: 'Fiber', color: '#8a6aaf' },
  ];
  const nutRow3 = hasNewCarbs ? [
    { key: 'D_fiber', label: 'Fiber', color: '#8a6aaf' },
  ] : [];
  const ingRow1 = [
    { key: 'E_protein_source', label: 'Protein sources', color: '#C8A415', textColor: '#A08310' },
    { key: 'F_preservatives', label: 'Preservatives', color: '#C8A415', textColor: '#A08310' },
  ];
  const ingRow2 = [
    { key: 'G_additives', label: 'Additives', color: '#C8A415', textColor: '#A08310' },
    { key: 'H_functional', label: 'Functional', color: '#C8A415', textColor: '#A08310' },
  ];

  const renderPair = (tiles) => (
    <div className="score-tile-pair" style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
      {tiles.map((t) => (
        <div key={t.key} className={tiles.length === 1 ? 'score-tile-single' : ''} style={{ flex: 1, maxWidth: tiles.length === 1 ? 'calc(50% - 5px)' : undefined }}>
          <ScoreTile catKey={t.key} label={t.label}
            color={t.color} textColor={t.textColor}
            data={cats[t.key]} isExpanded={expandedCat === t.key}
            onToggle={toggleExpand} />
        </div>
      ))}
    </div>
  );

  return (
    <div style={{
      padding: '40px 32px', background: '#faf8f5', borderRadius: 24,
      border: '1px solid #ede8df', marginBottom: 28,
      animation: 'scaleIn 0.5s ease 0.05s both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2.5, textTransform: 'uppercase', color: '#b5aa99' }}>Score breakdown</span>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2.5, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 12 }}>Nutrition</div>
      {renderPair(nutRow1)}
      {renderPair(nutRow2)}
      {nutRow3.length > 0 && renderPair(nutRow3)}

      <div style={{ height: 1, background: '#ede8df', margin: '14px 0 24px' }} />

      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2.5, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 12 }}>Ingredients</div>
      {renderPair(ingRow1)}
      {renderPair(ingRow2)}

      <div style={{ height: 1, background: '#ede8df', margin: '14px 0 16px' }} />

      <div style={{ textAlign: 'center' }}>
        <a href="/how-we-score" style={{
          fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif",
          textDecoration: 'underline', textUnderlineOffset: 3, transition: 'color 0.15s',
        }}
          onMouseEnter={(e) => e.target.style.color = '#1a1612'}
          onMouseLeave={(e) => e.target.style.color = '#8a7e72'}
        >
          How we score – read our full methodology
        </a>
      </div>
    </div>
  );
}

export default function FoodPageContent({ productId }) {
  const router = useRouter();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ingredientInfo, setIngredientInfo] = useState({});
  const [showStickyBuy, setShowStickyBuy] = useState(false);
  const { isPro } = useAuth();
  const [activeIngredient, setActiveIngredient] = useState(null); // { idx, info }
  const [tooltipTop, setTooltipTop] = useState(0);
  const pillsContainerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const heroRef = useRef(null);

  useEffect(() => {
    if (!heroRef.current) return;
    const obs = new IntersectionObserver(([e]) => {
      setShowStickyBuy(!e.isIntersecting);
    }, { threshold: 0 });
    obs.observe(heroRef.current);
    return () => obs.disconnect();
  }, [food]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/foods/${productId}`)
      .then(r => r.json())
      .then(data => { if (data && !data.error) setFood(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId]);

  /* Fetch ingredient_info lookup table once */
  useEffect(() => {
    fetch('/api/ingredients')
      .then(r => r.json())
      .then(data => {
        if (!data || data.error) return;
        const map = {};
        data.forEach(row => { map[row.ingredient_name] = row; });
        setIngredientInfo(map);
      });
  }, []);

  const goHome = () => router.push('/');
  const goFood = (id) => {
    fetch(`/api/foods/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data?.slug && data?.brand_slug) router.push(`/dog-food/${data.brand_slug}/${data.slug}`);
        else router.push(`/food/${id}`);
      });
  };
  const goBrand = () => food && router.push(`/brands/${food.brand_slug || encodeURIComponent(food.brand)}`);

  /* smart split: don't split on commas inside parentheses or brackets */
  const ingredients = food?.ingredients
    ? food.ingredients.match(/(?:[^,(\[]*(?:\([^)]*\)|\[[^\]]*\])?[^,(\[]*)*/g)
        ?.map((s) => s.trim()).filter(Boolean) || []
    : [];
  const saltIdx = findSaltIndex(ingredients);
  const [pillsAnimated, setPillsAnimated] = useState(false);
  useEffect(() => {
    if (ingredients.length > 0 && !pillsAnimated) {
      const t = setTimeout(() => setPillsAnimated(true), ingredients.length * 20 + 500);
      return () => clearTimeout(t);
    }
  }, [ingredients.length, pillsAnimated]);

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', overflowX: 'hidden' }}>
      <style>{`
        @media (max-width: 480px) {
          .score-tile-pair { flex-direction: column; }
        }
        @keyframes bottomSheetUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CompareBubble />
          <SignUpButton />
        </div>
      </nav>

      {loading ? (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
          {/* Skeleton: back button */}
          <div style={{ width: 160, height: 14, borderRadius: 4, background: '#f0ebe3', marginBottom: 32, animation: 'pulse 1.5s ease infinite' }} />
          {/* Skeleton: product hero */}
          <div className="product-hero" style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
            <div style={{ width: 260, height: 320, borderRadius: 20, background: '#f0ebe3', flexShrink: 0, animation: 'pulse 1.5s ease infinite' }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: '30%', height: 10, borderRadius: 4, background: '#f0ebe3', marginBottom: 10, animation: 'pulse 1.5s ease infinite' }} />
              <div style={{ width: '80%', height: 24, borderRadius: 4, background: '#f0ebe3', marginBottom: 12, animation: 'pulse 1.5s ease 0.1s infinite' }} />
              <div style={{ width: '50%', height: 12, borderRadius: 4, background: '#f0ebe3', marginBottom: 24, animation: 'pulse 1.5s ease 0.2s infinite' }} />
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0ebe3', animation: 'pulse 1.5s ease infinite' }} />
                <div>
                  <div style={{ width: 80, height: 14, borderRadius: 4, background: '#f0ebe3', marginBottom: 6, animation: 'pulse 1.5s ease 0.1s infinite' }} />
                  <div style={{ width: 120, height: 10, borderRadius: 4, background: '#f0ebe3', animation: 'pulse 1.5s ease 0.2s infinite' }} />
                </div>
              </div>
            </div>
          </div>
          {/* Skeleton: score breakdown */}
          <div style={{ background: '#faf8f5', borderRadius: 24, border: '1px solid #ede8df', padding: '40px 32px' }}>
            <div style={{ width: 140, height: 10, borderRadius: 4, background: '#f0ebe3', marginBottom: 24, animation: 'pulse 1.5s ease infinite' }} />
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1, height: 60, borderRadius: 12, background: '#f0ebe3', animation: 'pulse 1.5s ease infinite' }} />
              <div style={{ flex: 1, height: 60, borderRadius: 12, background: '#f0ebe3', animation: 'pulse 1.5s ease 0.1s infinite' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, height: 60, borderRadius: 12, background: '#f0ebe3', animation: 'pulse 1.5s ease 0.2s infinite' }} />
              <div style={{ flex: 1, height: 60, borderRadius: 12, background: '#f0ebe3', animation: 'pulse 1.5s ease 0.3s infinite' }} />
            </div>
          </div>
        </div>
      ) : !food ? (
        <div style={{ textAlign: 'center', padding: '120px 24px', color: '#8a7e72', fontSize: 17 }}>
          Product not found. <span onClick={goHome} style={{ color: '#1a1612', cursor: 'pointer', textDecoration: 'underline' }}>Go back</span>
        </div>
      ) : (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
          <button onClick={() => router.push('/discover')} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: '#8a7e72', fontSize: 14,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
            marginBottom: 32, padding: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Discover Foods
          </button>

          {/* Hero */}
          <div ref={heroRef} className="product-hero" style={{
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
              {(food.flavor || food.primary_protein) && (
                <div style={{ marginBottom: 14 }}>
                  {food.flavor && (
                    <div style={{ fontSize: 14, color: '#8a7e72', lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600, color: '#6b6157' }}>Flavor:</span> {food.flavor}
                    </div>
                  )}
                  {food.primary_protein && (
                    <div style={{ fontSize: 14, color: '#8a7e72', lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600, color: '#6b6157' }}>Primary Protein:</span> {food.primary_protein}
                    </div>
                  )}
                </div>
              )}

              {/* Prescription diet disclaimer */}
              {food.brand && (/prescription|veterinary|vet diet/i.test(food.brand) || /prescription|veterinary|vet diet/i.test(food.name)) && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10, background: '#f5f2ec',
                  border: '1px solid #ede8df', marginBottom: 16,
                  fontSize: 12, color: '#8a7e72', lineHeight: 1.5,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  This score evaluates general formulation quality for healthy adult dogs. Veterinary/prescription diets are formulated for specific clinical conditions and are not intended to score highly on a general-purpose scale.
                </div>
              )}

              {/* Score ring + label */}
              {food.quality_score != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <ScoreRing score={food.quality_score} size={72} />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1612', fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>
                      {getScoreTier(food.quality_score).label}
                    </div>
                    <div style={{ fontSize: 13, color: '#b5aa99', fontFamily: "'DM Sans', sans-serif" }}>
                      <a href="/how-we-score" style={{ color: '#b5aa99', textDecoration: 'none' }}
                        onMouseEnter={(e) => { e.target.style.color = '#1a1612'; e.target.style.textDecoration = 'underline'; }}
                        onMouseLeave={(e) => { e.target.style.color = '#b5aa99'; e.target.style.textDecoration = 'none'; }}
                      >How we score</a> · v{food.score_version || '1.5'}
                    </div>
                  </div>
                </div>
              )}

              <div className="product-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <CompareToggle food={food} />
                {food.affiliate_url && (
                  <a href={food.affiliate_url} target="_blank" rel="noopener noreferrer sponsored" className="buy-amazon-btn" style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px 22px', borderRadius: 100, border: 'none',
                    background: '#C9A84C', color: '#fff', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textDecoration: 'none',
                    transition: 'background 0.2s',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#b5952f'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#C9A84C'}
                  >Buy on Amazon &rarr;</a>
                )}
              </div>
              {food.affiliate_url && (
                <div style={{ fontSize: 10, color: '#b5aa99', fontStyle: 'italic', marginTop: 8 }}>
                  As an Amazon Associate, GoodKibble earns from qualifying purchases.
                </div>
              )}
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
              <InfoTooltip text="These values are calculated on a Dry Matter Basis (DMB), which removes moisture content to give you a more accurate comparison between foods. Dry matter percentages reflect the actual nutrient concentration in the food solids, making it easier to compare wet and dry foods fairly."
                onShow={(text) => setActiveIngredient(activeIngredient?.idx === 'dmb' ? null : { idx: 'dmb', info: { display_name: 'Dry Matter Basis', quality_signal: 'neutral', short_description: text, source: null } })} />
            </div>
            {activeIngredient?.idx === 'dmb' && !isMobile && (
              <IngredientInfoCard info={activeIngredient.info} onClose={() => setActiveIngredient(null)} />
            )}

            <div style={{ maxWidth: 560 }}>
              <NutrientRow label="Protein" value={Math.round((food.protein_dmb || 0) * 10) / 10} color="#2d7a4f" />
              <NutrientRow label="Fat" value={Math.round((food.fat_dmb || 0) * 10) / 10} color="#c47a20" />
              <NutrientRow label="Carbohydrates" value={Math.round((food.carbs_dmb || 0) * 10) / 10} color="#5a7a9e" />
              {food.fiber_dmb > 0 && <NutrientRow label="Fiber" value={Math.round(food.fiber_dmb * 10) / 10} color="#8a6aaf" />}
            </div>
          </div>

          {/* Nutrient Explainer */}
          <NutrientExplainer />

          {/* Ingredients */}
          <div className="ingredients-section" onClick={() => { if (activeIngredient && !isMobile) setActiveIngredient(null); }} style={{
            marginTop: 28, padding: '40px 32px', background: '#faf8f5', borderRadius: 24,
            border: '1px solid #ede8df', animation: 'fadeIn 0.5s ease 0.2s both',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2.5, textTransform: 'uppercase', color: '#b5aa99' }}>Ingredients</div>
              <div style={{ fontSize: 12, color: '#b5aa99', fontWeight: 500 }}>{ingredients.length} ingredients</div>
            </div>
            <p style={{ fontSize: 13, color: '#8a7e72', marginBottom: 24, lineHeight: 1.5 }}>
              Listed in order of weight. The first ingredient is the most prominent. Tap any ingredient with ⓘ to learn more.
              {saltIdx >= 0 && ' Ingredients after the salt indicator typically make up less than 1% of the formula.'}
            </p>

            {/* Quality signal summary bar */}
            {Object.keys(ingredientInfo).length > 0 && (() => {
              let good = 0, neutral = 0, caution = 0;
              ingredients.forEach(ing => {
                if (isSaltIngredient(ing)) { neutral++; return; }
                const info = lookupIngredient(ing, ingredientInfo);
                const sig = info?.quality_signal;
                if (sig === 'good') good++;
                else if (sig === 'caution') caution++;
                else neutral++;
              });
              return (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <div style={{ flex: 1, background: '#eef5e4', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: '#639922', lineHeight: 1.1 }}>{good}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#639922', marginTop: 2 }}>Good</div>
                  </div>
                  <div style={{ flex: 1, background: '#f5f2ec', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: '#8a7e72', lineHeight: 1.1 }}>{neutral}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#8a7e72', marginTop: 2 }}>Neutral</div>
                  </div>
                  <div style={{ flex: 1, background: '#fdf0e0', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: '#d4760a', lineHeight: 1.1 }}>{caution}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#d4760a', marginTop: 2 }}>Caution</div>
                  </div>
                </div>
              );
            })()}



            <div ref={pillsContainerRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, position: 'relative' }}>
              {ingredients.map((ing, i) => {
                const isSalt = isSaltIngredient(ing);
                const isFirst = i === 0;
                const afterSalt = (saltIdx >= 0 && i > saltIdx) ? true : false;
                const info = !isSalt ? lookupIngredient(ing, ingredientInfo) : null;
                const hasTooltip = !!info;

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

                /* detect parenthesis sub-groups: "Minerals (sub1, sub2, sub3, ...)" */
                const parenMatch = ing.match(/^([^()]+?)\s*\((.+)\)$/s);
                if (parenMatch) {
                  const inner = parenMatch[2];
                  const commaCount = (inner.match(/,/g) || []).length;
                  if (commaCount >= 3) {
                    const groupName = parenMatch[1].trim();
                    const subItems = inner.split(',').map(s => s.trim()).filter(Boolean);
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
                }

                const pillStyle = {
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '8px 16px', borderRadius: 100,
                  fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                  fontWeight: (isFirst || isSalt) ? 600 : 400,
                  background: bgColor,
                  color: textColor,
                  border: (isSalt || isFirst) ? 'none' : '1px solid #e8e0d4',
                  cursor: (isSalt || hasTooltip) ? 'pointer' : 'default',
                  borderBottomStyle: hasTooltip && !isFirst && !isSalt ? 'dashed' : undefined,
                  transition: 'background 0.15s, border-color 0.15s',
                  opacity: afterSalt && (hasTooltip || isSalt) ? 0.4 : undefined,
                };

                /* animation on non-dimmed pills only; after-salt pills skip animation
                   because the fadeUp keyframe ends at opacity:1 which overrides inline opacity.
                   For tooltip/salt pills after salt, opacity lives on the pill itself so the
                   tooltip popover renders at full opacity. */
                const wrapStyle = afterSalt
                  ? { display: 'inline-block', opacity: (hasTooltip || isSalt) ? 1 : 0.4 }
                  : pillsAnimated
                    ? { display: 'inline-block' }
                    : {
                        display: 'inline-block',
                        animationName: 'fadeUp', animationDuration: '0.4s',
                        animationFillMode: 'both', animationDelay: `${i * 20}ms`,
                      };

                /* quality dot color */
                const signal = info?.quality_signal;
                const dotColorMap = { good: '#639922', neutral: '#bbbbbb', caution: '#d4760a' };
                const showDot = !isSalt && signal && dotColorMap[signal];
                const dotColor = isFirst ? '#ffffff' : dotColorMap[signal];

                const isActive = activeIngredient?.idx === i;
                const clickable = hasTooltip || isSalt;

                const pill = (
                  <span style={{ ...pillStyle, ...(isActive ? { borderColor: '#C9A84C', background: isSalt ? '#f0c930' : isFirst ? '#1a1612' : '#f7efd8' } : {}) }}
                    onMouseEnter={(e) => { if (hasTooltip) e.currentTarget.style.borderColor = '#b5aa99'; }}
                    onMouseLeave={(e) => { if (hasTooltip && !isActive) e.currentTarget.style.borderColor = '#e8e0d4'; }}
                  >
                    {showDot && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                    )}
                    {ing}
                    {hasTooltip && (
                      <span style={{
                        fontSize: 11, color: isFirst ? 'rgba(250,248,245,0.5)' : '#b5aa99',
                        lineHeight: 1, marginLeft: 2,
                      }}>ⓘ</span>
                    )}
                  </span>
                );

                return (
                  <span key={i} style={wrapStyle} onClick={(e) => {
                    e.stopPropagation();
                    if (!clickable) return;
                    if (isActive) { setActiveIngredient(null); return; }
                    // Calculate position relative to pills container
                    if (!isMobile && pillsContainerRef.current) {
                      const pillRect = e.currentTarget.getBoundingClientRect();
                      const containerRect = pillsContainerRef.current.getBoundingClientRect();
                      setTooltipTop(pillRect.bottom - containerRect.top + 8);
                    }
                    if (isSalt) {
                      setActiveIngredient({ idx: i, info: { display_name: 'Salt Divider', quality_signal: 'caution', short_description: 'Any ingredient listed after salt typically makes up less than 1% of the total formula, as salt itself usually represents <1% of the recipe.', source: null } });
                    } else if (info) {
                      setActiveIngredient({ idx: i, info });
                    }
                  }}>{pill}</span>
                );
              })}

              {/* Desktop overlay tooltip — full width of pills container, absolutely positioned */}
              {activeIngredient && !isMobile && (
                <div onClick={(e) => e.stopPropagation()} style={{
                  position: 'absolute', left: 0, right: 0, top: tooltipTop,
                  zIndex: 50, borderRadius: 12, overflow: 'visible',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  animation: 'fadeIn 0.15s ease',
                }}>
                  {(isPro || activeIngredient.idx < 5) ? (
                    <div style={{ padding: '18px 24px', background: '#1a1612', color: '#faf8f5', fontFamily: "'DM Sans', sans-serif" }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: SIGNAL_COLORS[activeIngredient.info.quality_signal] || SIGNAL_COLORS.neutral }} />
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{activeIngredient.info.display_name}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 100, flexShrink: 0, background: SIGNAL_BG[activeIngredient.info.quality_signal] || SIGNAL_BG.neutral, color: SIGNAL_COLORS[activeIngredient.info.quality_signal] || SIGNAL_COLORS.neutral }}>{activeIngredient.info.quality_signal}</span>
                        <span onClick={() => setActiveIngredient(null)} style={{ marginLeft: 8, fontSize: 16, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>&times;</span>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.6, marginBottom: activeIngredient.info.source ? 10 : 0 }}>{activeIngredient.info.short_description}</div>
                      {activeIngredient.info.source && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>Source: {activeIngredient.info.source}</div>}
                    </div>
                  ) : (
                    <div style={{ padding: '18px 24px', background: '#1a1612', color: '#faf8f5', fontFamily: "'DM Sans', sans-serif", borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingRight: 36 }}>
                        <span style={{
                          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                          background: SIGNAL_COLORS[activeIngredient.info.quality_signal] || SIGNAL_COLORS.neutral,
                        }} />
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{activeIngredient.info.display_name}</span>
                        <span style={{
                          marginLeft: 'auto', fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
                          textTransform: 'uppercase', padding: '2px 8px', borderRadius: 100, flexShrink: 0,
                          background: SIGNAL_BG[activeIngredient.info.quality_signal] || SIGNAL_BG.neutral,
                          color: SIGNAL_COLORS[activeIngredient.info.quality_signal] || SIGNAL_COLORS.neutral,
                        }}>{activeIngredient.info.quality_signal}</span>
                        <span onClick={() => setActiveIngredient(null)} style={{ marginLeft: 8, fontSize: 16, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>&times;</span>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#C9A84C', marginBottom: 10 }}>Ingredient Intelligence</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 14, lineHeight: 1.5, maxWidth: 300, margin: '0 auto 14px' }}>
                          See what each ingredient means for your dog with GoodKibble Pro
                        </div>
                        <a href="/pro" style={{
                          display: 'inline-block', padding: '10px 24px', borderRadius: 100,
                          background: '#C9A84C', color: '#fff', fontSize: 13, fontWeight: 700,
                          textDecoration: 'none', fontFamily: "'DM Sans', sans-serif",
                        }}>Unlock with Pro →</a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile bottom sheet rendered at component root level below */}
            {saltIdx >= 0 && (
              <div style={{ marginTop: 16, fontSize: 12, color: '#b5aa99', fontStyle: 'italic' }}>
                * Ingredients after salt are dimmed — they typically represent &lt;1% of the formula.
              </div>
            )}
          </div>

          {/* Source */}
          <div style={{
            marginTop: 28, padding: '20px 24px', borderRadius: 16, background: '#faf8f5',
            animation: 'fadeUp 0.5s ease 0.3s both',
          }}>
            <span style={{ fontSize: 14, color: '#5a5047' }}>
              <strong>Source:</strong> Manufacturer&apos;s reported nutritional information
            </span>
          </div>
        </div>
      )}

      <div className="footer-bar" style={{
        borderTop: '1px solid #ede8df', padding: '32px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div className="footer-logo" style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: '#1a1612' }}>
          Good<span style={{ color: '#f0c930' }}>Kibble</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#b5aa99', flexWrap: 'wrap' }}>
          <a href="/terms" style={{ color: '#b5aa99', textDecoration: 'none' }}>Terms</a>
          <a href="/privacy" style={{ color: '#b5aa99', textDecoration: 'none' }}>Privacy</a>
          <a href="/recalls" style={{ color: '#b5aa99', textDecoration: 'none' }}>Recalls</a>
          <a href="/faq" style={{ color: '#b5aa99', textDecoration: 'none' }}>FAQ</a>
          <span>© 2026 GoodKibble. Not affiliated with any dog food brand.</span>
        </div>
      </div>

      {/* Sticky mobile buy bar */}
      {food && food.affiliate_url && (
        <div className="sticky-buy-bar" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: '#fff', borderTop: '1px solid #ede8df',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transform: showStickyBuy ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            {food.quality_score != null && (() => {
              const tier = getScoreTier(food.quality_score);
              const r = 14.5;
              const c = 2 * Math.PI * r;
              const o = c - (c * food.quality_score / 100);
              return (
                <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
                  <svg width={34} height={34} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={17} cy={17} r={r} fill="none" stroke="#ede8df" strokeWidth={2.5} />
                    <circle cx={17} cy={17} r={r} fill="none" stroke={tier.color} strokeWidth={2.5}
                      strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" />
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, fontFamily: "'DM Sans', sans-serif", color: '#1a1612',
                  }}>{food.quality_score}</div>
                </div>
              );
            })()}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1612', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{food.name}</div>
              <div style={{ fontSize: 10, color: '#b5aa99' }}>{food.brand}</div>
            </div>
          </div>
          <a href={food.affiliate_url} target="_blank" rel="noopener noreferrer sponsored" style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '9px 16px', borderRadius: 100, border: 'none',
            background: '#C9A84C', color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textDecoration: 'none',
            flexShrink: 0, whiteSpace: 'nowrap',
          }}>Buy &rarr;</a>
        </div>
      )}

      {/* Single mobile bottom sheet — rendered at root level to avoid duplicates */}
      {activeIngredient && isMobile && (
        (isPro || activeIngredient.idx < 5) ? (
          <IngredientBottomSheet
            info={activeIngredient.info}
            onClose={() => setActiveIngredient(null)}
            bottomOffset={showStickyBuy && food?.affiliate_url ? 56 : 0}
          />
        ) : (
          <IngredientBottomSheet
            info={{ ...activeIngredient.info, short_description: null, source: null }}
            onClose={() => setActiveIngredient(null)}
            bottomOffset={showStickyBuy && food?.affiliate_url ? 56 : 0}
            gated={true}
          />
        )
      )}


      <style>{`
        .sticky-buy-bar { display: none !important; }
        @media (max-width: 768px) {
          .sticky-buy-bar { display: flex !important; }
          .product-actions { flex-direction: column !important; align-items: stretch !important; }
          .product-actions .compare-toggle-btn { width: 100% !important; padding: 12px !important; font-size: 14px !important; }
          .score-tile-single { max-width: 100% !important; }
          .score-tile-pair { flex-direction: column !important; }
          .buy-amazon-btn { width: 100% !important; padding: 12px !important; font-size: 14px !important; text-align: center !important; }
        }
      `}</style>
    </div>
  );
}
