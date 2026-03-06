'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import SearchBox from '../../components/SearchBox';
import NutrientRing from '../../components/NutrientRing';

const SALT_KEYWORDS = ['salt', 'sodium chloride', 'iodized salt', 'sodium', 'sea salt'];

function isSaltIngredient(ing) {
  const lower = ing.toLowerCase().trim();
  return SALT_KEYWORDS.some(kw => {
    if (kw === 'sodium') {
      return lower === 'sodium' || lower === 'sodium chloride';
    }
    return lower === kw || lower.startsWith(kw + ' ') || lower.endsWith(' ' + kw);
  });
}

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
        width: 240, height: 240, borderRadius: 20,
        background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#c4b9a8', fontSize: 56, flexShrink: 0,
      }}>🐕</div>
    );
  }
  return (
    <div style={{
      width: 240, height: 240, borderRadius: 20, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#fff', flexShrink: 0,
    }}>
      <img src={src} alt={alt}
