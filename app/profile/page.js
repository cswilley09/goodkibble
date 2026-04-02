'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SignUpButton from '../components/SignUpButton';

const BREEDS = [
  'Affenpinscher', 'Afghan Hound', 'Airedale Terrier', 'Akita', 'Alaskan Malamute',
  'American Bulldog', 'American Pit Bull Terrier', 'Australian Cattle Dog', 'Australian Shepherd',
  'Basenji', 'Basset Hound', 'Beagle', 'Belgian Malinois', 'Bernedoodle',
  'Bernese Mountain Dog', 'Bichon Frise', 'Border Collie', 'Boston Terrier', 'Boxer',
  'Bulldog', 'Bullmastiff', 'Cairn Terrier', 'Cane Corso', 'Cavalier King Charles Spaniel',
  'Cavapoo', 'Chihuahua', 'Chow Chow', 'Cockapoo', 'Cocker Spaniel', 'Collie', 'Corgi',
  'Dachshund', 'Dalmatian', 'Doberman Pinscher', 'English Bulldog', 'French Bulldog',
  'German Shepherd', 'German Shorthaired Pointer', 'Golden Retriever', 'Goldendoodle',
  'Great Dane', 'Great Pyrenees', 'Greyhound', 'Havanese', 'Irish Setter', 'Italian Greyhound',
  'Jack Russell Terrier', 'Labradoodle', 'Labrador Retriever', 'Lhasa Apso', 'Maltese',
  'Maltipoo', 'Mastiff', 'Miniature Pinscher', 'Miniature Poodle', 'Miniature Schnauzer',
  'Newfoundland', 'Old English Sheepdog', 'Papillon', 'Pekingese', 'Pembroke Welsh Corgi',
  'Pomeranian', 'Pomsky', 'Poodle', 'Portuguese Water Dog', 'Pug', 'Puggle', 'Rat Terrier',
  'Rhodesian Ridgeback', 'Rottweiler', 'Saint Bernard', 'Samoyed', 'Schnauzer', 'Schnoodle',
  'Shetland Sheepdog', 'Shiba Inu', 'Shih Tzu', 'Siberian Husky', 'Staffordshire Bull Terrier',
  'Standard Poodle', 'Standard Schnauzer', 'Tibetan Mastiff', 'Toy Poodle', 'Vizsla',
  'Weimaraner', 'West Highland White Terrier', 'Whippet', 'Yorkshire Terrier',
  'Mixed Breed', 'Other',
];

const cardStyle = {
  background: '#fff', borderRadius: 20, border: '1px solid #ede8df', padding: 28, marginBottom: 24,
};
const eyebrow = (text) => ({
  fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: '#C9A84C',
  textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16,
});
const mobileCardPad = { padding: 28 };

/* ── Breed Autocomplete (reused from signup) ── */
function BreedPicker({ value, onChange }) {
  const [text, setText] = useState(value || '');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { setText(value || ''); }, [value]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const q = text.trim().toLowerCase();
  const matches = q ? BREEDS.filter(b => b.toLowerCase().includes(q)).slice(0, 8) : [];
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input type="text" value={text} placeholder="Search breed..."
        onChange={e => { setText(e.target.value); onChange(''); setOpen(true); }}
        onFocus={e => { e.target.style.borderColor = '#C9A84C'; if (q && matches.length) setOpen(true); }}
        onBlur={e => { if (!open) e.target.style.borderColor = '#ede8df'; }}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #ede8df',
          fontSize: 14, fontFamily: "'DM Sans', sans-serif", background: '#fff', outline: 'none',
          color: '#1a1612', fontWeight: 600, boxSizing: 'border-box',
        }}
      />
      {open && q && matches.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', borderRadius: 10, border: '1px solid #ede8df',
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)', zIndex: 100, maxHeight: 200, overflowY: 'auto',
        }}>
          {matches.map(b => (
            <div key={b} onMouseDown={e => { e.preventDefault(); setText(b); onChange(b); setOpen(false); }}
              style={{ padding: '9px 14px', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: b === value ? '#C9A84C' : '#1a1612', fontWeight: b === value ? 600 : 400 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f5f2ec')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >{b}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Food Search (reused from signup) ── */
function FoodPicker({ value, onChange }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const debounceRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  function handleChange(e) {
    const val = e.target.value;
    setText(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/foods/search?q=' + encodeURIComponent(val) + '&limit=10');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setResults((Array.isArray(data) ? data : []).slice(0, 10));
        setOpen(true);
      } catch { setResults([]); }
      setLoading(false);
    }, 250);
  }
  function handleSelect(food) {
    const n = food.name.toUpperCase().startsWith(food.brand.toUpperCase())
      ? `${food.brand} \u2014 ${food.name.slice(food.brand.length).trim()}`
      : `${food.brand} \u2014 ${food.name}`;
    onChange({ name: n, slug: food.slug, brand_slug: food.brand_slug });
    setText('');
    setResults([]);
    setOpen(false);
  }
  if (value && value.name) {
    return (
      <div style={{ background: '#f7efd8', border: '1.5px solid #C9A84C', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          <span style={{ color: '#2d7a4f', fontWeight: 700, flexShrink: 0 }}>{'\u2713'}</span>
          <span style={{ fontSize: 13, color: '#1a1612', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value.name}</span>
        </div>
        <button onClick={() => onChange(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a7e72', fontSize: 16, padding: '0 0 0 8px' }}>&times;</button>
      </div>
    );
  }
  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 10, padding: '4px 4px 4px 14px', border: '1.5px solid #ede8df' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b5aa99" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
        <input type="text" placeholder="Search for a food..." value={text} onChange={handleChange}
          onFocus={() => { if (results.length) setOpen(true); }}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, padding: '8px 8px', background: 'transparent', color: '#1a1612', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, minWidth: 0 }}
        />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(26,22,18,0.12)', zIndex: 100, maxHeight: 300, overflowY: 'auto' }}>
          {loading && results.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: '#8a7e72', fontSize: 13 }}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: '#8a7e72', fontSize: 13 }}>No results found.</div>
          ) : results.map(f => (
            <div key={f.id} onMouseDown={e => { e.preventDefault(); handleSelect(f); }}
              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f0ebe3', display: 'flex', alignItems: 'center', gap: 10 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#faf8f5')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {f.image_url ? (
                <img src={f.image_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'contain', background: '#f5f0e8', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{'\u{1F415}'}</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1612', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.brand}</div>
                <div style={{ fontSize: 11, color: '#8a7e72', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreCircle({ score, size = 48 }) {
  if (score == null) return null;
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const o = c * (1 - score / 100);
  const color = score >= 70 ? '#2d7a4f' : score >= 50 ? '#c47a20' : '#b5483a';
  const tier = score >= 90 ? 'Excellent' : score >= 80 ? 'Great' : score >= 70 ? 'Good' : score >= 60 ? 'Fair' : score >= 50 ? 'Below Avg' : 'Poor';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ede8df" strokeWidth={3} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
        <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: size * 0.32, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", fill: '#1a1612' }}>
          {score}
        </text>
      </svg>
      <span style={{ fontSize: 9, fontFamily: "'DM Sans', sans-serif", color: '#8a7e72', marginTop: 2 }}>{tier}</span>
    </div>
  );
}

function NutrientPill({ label, value, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
      color: '#5a5248', background: '#f5f2ec', borderRadius: 20, padding: '3px 10px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label} {value != null ? `${Math.round(value * 10) / 10}%` : '—'}
    </span>
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
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,22,18,0.06)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {food.image_url && !imgErr ? (
        <div style={{ width: 56, height: 70, overflow: 'hidden', background: '#fff', flexShrink: 0, borderRadius: 8 }}>
          <img src={food.image_url} alt="" onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      ) : (
        <div style={{ width: 56, height: 70, background: '#f5f2ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, borderRadius: 8 }}>{'\u{1F415}'}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: '#8a7e72', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{food.brand}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', lineHeight: 1.3, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{food.name}</div>
        {food.primary_protein && <div style={{ fontSize: 11, color: '#8a7e72' }}>{food.primary_protein}</div>}
        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
          <NutrientPill label="P" value={food.protein_dmb} color="#2d7a4f" />
          <NutrientPill label="F" value={food.fat_dmb} color="#c47a20" />
          <NutrientPill label="C" value={food.carbs_dmb} color="#5a7a9e" />
        </div>
      </div>
      <ScoreCircle score={food.quality_score} size={42} />
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [activeDogIdx, setActiveDogIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [editFood, setEditFood] = useState(null); // { name, slug, brand_slug } or null
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Current food data from dog_foods_v2
  const [currentFoodData, setCurrentFoodData] = useState(null);
  const [percentile, setPercentile] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [altProteinOnly, setAltProteinOnly] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  // Saved comparisons
  const [savedComparisons, setSavedComparisons] = useState([]);

  const dog = dogs[activeDogIdx] || null;
  const displayName = dog?.dog_name || 'Your dog';

  // Load profile
  useEffect(() => {
    async function load() {
      const email = localStorage.getItem('gk_user_email');
      if (!email) { router.push('/signup'); return; }
      try {
        const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
        if (!res.ok) { router.push('/signup'); return; }
        const data = await res.json();
        if (!data.user) { router.push('/signup'); return; }
        setUser(data.user);
        setDogs(data.dogs || []);
      } catch { router.push('/signup'); }
      setLoading(false);
    }
    load();
  }, []);

  // Load current food data when dog changes — use slug-based lookup
  useEffect(() => {
    setCurrentFoodData(null);
    setPercentile(null);
    setAlternatives([]);
    if (!dog?.current_food_slug) return;
    const parts = dog.current_food_slug.split('/');
    if (parts.length < 2) return;
    const [brandSlug, ...slugParts] = parts;
    const productSlug = slugParts.join('/');
    fetch(`/api/foods/${encodeURIComponent(brandSlug)}?slug=${encodeURIComponent(productSlug)}`)
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) setCurrentFoodData(data);
      })
      .catch(() => {});
  }, [dog?.current_food_slug, refreshKey]);

  // Calculate percentile and fetch alternatives
  useEffect(() => {
    if (!currentFoodData?.quality_score) { setPercentile(null); setAlternatives([]); return; }
    // Fetch all products to calculate percentile and find alternatives
    fetch('/api/foods?all=true')
      .then(r => r.json())
      .then(all => {
        if (!Array.isArray(all)) return;
        setTotalProducts(all.length);
        const below = all.filter(f => f.quality_score != null && f.quality_score < currentFoodData.quality_score).length;
        const scored = all.filter(f => f.quality_score != null).length;
        setPercentile(scored > 0 ? Math.round((below / scored) * 100) : null);

        // Alternatives: higher score, same protein (or all), has image
        let alts = all.filter(f =>
          f.quality_score != null &&
          f.quality_score > currentFoodData.quality_score &&
          f.image_url &&
          f.id !== currentFoodData.id
        );
        if (altProteinOnly && currentFoodData.primary_protein) {
          alts = alts.filter(f => f.primary_protein === currentFoodData.primary_protein);
        }
        alts.sort((a, b) => b.quality_score - a.quality_score);
        setAlternatives(alts.slice(0, 3));
      });
  }, [currentFoodData?.id, currentFoodData?.quality_score, altProteinOnly]);

  // Load saved comparisons from localStorage
  useEffect(() => {
    if (tab === 'saved') {
      const data = JSON.parse(localStorage.getItem('gk_saved_comparisons') || '[]');
      setSavedComparisons(data);
    }
  }, [tab]);

  function deleteComparison(id) {
    const updated = savedComparisons.filter(c => c.id !== id);
    setSavedComparisons(updated);
    localStorage.setItem('gk_saved_comparisons', JSON.stringify(updated));
  }

  function handleLogout() {
    localStorage.removeItem('gk_user_id');
    localStorage.removeItem('gk_dog_id');
    localStorage.removeItem('gk_user_name');
    localStorage.removeItem('gk_user_email');
    window.dispatchEvent(new Event('gk_profile_updated'));
    router.push('/');
  }

  function goToFood(food) {
    if (food.slug && food.brand_slug) router.push(`/dog-food/${food.brand_slug}/${food.slug}`);
    else router.push(`/food/${food.id}`);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf8f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#8a7e72' }}>Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const tabs = ['Dashboard', 'Profile', 'Saved', 'Settings'];

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid #ede8df',
        background: '#faf8f4', position: 'sticky', top: 0, zIndex: 40,
      }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: '#1a1612', letterSpacing: -0.5 }}>GoodKibble</span>
        </a>
        <SignUpButton />
      </nav>

      <div className="profile-container" style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{'\u{1F436}'}</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: '#1a1612', margin: '0 0 6px', letterSpacing: -0.5 }}>
            {displayName}&rsquo;s Dashboard
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8a7e72' }}>
            Welcome back, {user.first_name}!
          </p>
        </div>

        {/* Dog switcher */}
        {dogs.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
            {dogs.map((d, i) => (
              <button key={d.id} onClick={() => { setActiveDogIdx(i); setEditing(false); }} style={{
                padding: '8px 20px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', transition: 'all 0.2s',
                background: i === activeDogIdx ? '#C9A84C' : 'transparent',
                color: i === activeDogIdx ? '#fff' : '#8a7e72',
                border: i === activeDogIdx ? '1.5px solid #C9A84C' : '1.5px solid #ede8df',
              }}>{d.dog_name}</button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #ede8df', marginBottom: 28 }}>
          {tabs.map(t => {
            const active = tab === t.toLowerCase();
            return (
              <button key={t} onClick={() => setTab(t.toLowerCase())} style={{
                flex: 1, padding: '14px 0', background: 'none', border: 'none',
                borderBottom: active ? '2px solid #C9A84C' : '2px solid transparent',
                color: active ? '#1a1612' : '#b5aa99',
                fontSize: 14, fontWeight: active ? 600 : 500,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                transition: 'color 0.2s, border-color 0.2s',
              }}>{t}</button>
            );
          })}
        </div>

        {/* ═══ DASHBOARD TAB ═══ */}
        {tab === 'dashboard' && (
          <>
            {/* Current Food Card */}
            <div style={cardStyle}>
              <div style={eyebrow()}>{displayName}&rsquo;s Current Food</div>
              {currentFoodData ? (
                <>
                  <div className="current-food-layout" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                    {currentFoodData.image_url && (
                      <div className="current-food-img" style={{ width: 100, flexShrink: 0, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                        <img src={currentFoodData.image_url} alt="" style={{ width: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a7e72', marginBottom: 4 }}>{currentFoodData.brand}</div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#1a1612', lineHeight: 1.3, marginBottom: 6 }}>{currentFoodData.name}</div>
                      {currentFoodData.primary_protein && (
                        <div style={{ fontSize: 12, color: '#8a7e72', marginBottom: 10 }}>Primary Protein: {currentFoodData.primary_protein}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ScoreCircle score={currentFoodData.quality_score} size={48} />
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <NutrientPill label="Protein" value={currentFoodData.protein_dmb} color="#2d7a4f" />
                          <NutrientPill label="Fat" value={currentFoodData.fat_dmb} color="#c47a20" />
                          <NutrientPill label="Carbs" value={currentFoodData.carbs_dmb} color="#5a7a9e" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Percentile bar */}
                  {percentile != null && (
                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f5f2ec' }}>
                      <div style={{ fontSize: 13, color: '#5a5248', marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>
                        {displayName}&rsquo;s food scores better than <strong style={{ color: '#639922' }}>{percentile}%</strong> of all kibbles
                      </div>
                      <div style={{ position: 'relative', height: 8, borderRadius: 100, background: 'linear-gradient(to right, #D97B2A, #EF9F27, #7BAF2E, #639922)', overflow: 'visible' }}>
                        <div style={{
                          position: 'absolute', top: '50%', left: `${percentile}%`,
                          transform: 'translate(-50%, -50%)',
                          width: 20, height: 20, borderRadius: '50%',
                          background: '#1a1612', border: '3px solid #fff',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                        <span style={{ fontSize: 10, color: '#b5aa99' }}>0 — Concerning</span>
                        <span style={{ fontSize: 10, color: '#b5aa99' }}>100 — Excellent</span>
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                    <button onClick={() => goToFood(currentFoodData)} style={{
                      padding: '10px 24px', borderRadius: 100, background: '#1a1612', color: '#faf8f4',
                      fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}>View Full Breakdown &rarr;</button>
                    {currentFoodData.affiliate_url && (
                      <a href={currentFoodData.affiliate_url} target="_blank" rel="noopener noreferrer sponsored" style={{
                        padding: '10px 24px', borderRadius: 100, background: '#C9A84C', color: '#fff',
                        fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        textDecoration: 'none', display: 'inline-block',
                      }}>Buy on Amazon &rarr;</a>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 14, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>
                  {dog?.current_food ? (
                    <span>Current food: <strong>{dog.current_food}</strong> — we couldn&rsquo;t match it to our database for scoring.</span>
                  ) : (
                    <span>No current food set. <a href="/signup" style={{ color: '#C9A84C' }}>Update your profile</a> to add one.</span>
                  )}
                </div>
              )}
            </div>

            {/* Higher-Scored Alternatives */}
            {currentFoodData && (
              <div style={cardStyle}>
                <div style={eyebrow()}>Higher-Scored {altProteinOnly && currentFoodData.primary_protein ? currentFoodData.primary_protein : ''} Kibbles</div>
                <p style={{ fontSize: 13, color: '#8a7e72', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                  These foods {altProteinOnly && currentFoodData.primary_protein ? (<>share the same primary protein as {displayName}&rsquo;s current food and </>) : null}scored higher on our 0&ndash;100 scale.
                </p>
                <p style={{ fontSize: 11, color: '#b5aa99', fontStyle: 'italic', marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
                  Switching foods should always be done gradually. Consult your vet before making changes.
                </p>

                {/* Protein toggle */}
                {currentFoodData.primary_protein && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <button onClick={() => setAltProteinOnly(true)} style={{
                      padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                      background: altProteinOnly ? '#f7efd8' : 'transparent',
                      color: altProteinOnly ? '#1a1612' : '#8a7e72',
                      border: altProteinOnly ? '1.5px solid #C9A84C' : '1.5px solid #ede8df',
                    }}>{currentFoodData.primary_protein} only</button>
                    <button onClick={() => setAltProteinOnly(false)} style={{
                      padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                      background: !altProteinOnly ? '#f7efd8' : 'transparent',
                      color: !altProteinOnly ? '#1a1612' : '#8a7e72',
                      border: !altProteinOnly ? '1.5px solid #C9A84C' : '1.5px solid #ede8df',
                    }}>All proteins</button>
                  </div>
                )}

                {alternatives.length > 0 ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {alternatives.map(f => (
                      <ProductCard key={f.id} food={f} onClick={() => goToFood(f)} />
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#8a7e72', textAlign: 'center', padding: '20px 0', fontFamily: "'DM Sans', sans-serif" }}>
                    {currentFoodData.quality_score >= 90
                      ? <>{displayName}&rsquo;s food is already top-tier! No higher-scored alternatives found.</>
                      : 'No alternatives found with the current filter.'}
                  </div>
                )}

                {currentFoodData.primary_protein && (
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <button onClick={() => router.push(`/discover?protein=${encodeURIComponent(currentFoodData.primary_protein)}`)} style={{
                      padding: '10px 24px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                      background: 'transparent', color: '#1a1612', border: '1.5px solid #ede8df',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}>Browse All {currentFoodData.primary_protein} Kibbles &rarr;</button>
                  </div>
                )}
              </div>
            )}

          </>
        )}

        {/* ═══ PROFILE TAB ═══ */}
        {tab === 'profile' && dog && (
          <>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={eyebrow()}>{displayName}&rsquo;s Profile</div>
                {!editing && (
                  <button onClick={() => {
                    setEditing(true);
                    setEditData({
                      breed: dog.breed || '', age_value: String(dog.age_value || ''), age_unit: dog.age_unit || 'years',
                      weight_lbs: String(dog.weight_lbs || ''), gender: dog.gender || '', is_neutered: !!dog.is_neutered,
                    });
                    if (dog.current_food_slug) {
                      const parts = dog.current_food_slug.split('/');
                      setEditFood({ name: dog.current_food, slug: parts.slice(1).join('/'), brand_slug: parts[0] });
                    } else {
                      setEditFood(undefined); // undefined = not changed, null = cleared
                    }
                  }} style={{
                    padding: '6px 16px', borderRadius: 100, background: 'transparent', color: '#C9A84C',
                    fontSize: 12, fontWeight: 600, border: '1.5px solid #C9A84C',
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}>Edit</button>
                )}
              </div>

              {!editing ? (
                <>
                  {[
                    { label: 'Breed', value: dog.breed },
                    { label: 'Age', value: `${dog.age_value} ${dog.age_unit}` },
                    { label: 'Weight', value: `${dog.weight_lbs} lbs` },
                    { label: 'Gender', value: dog.gender === 'male' ? 'Male' : 'Female' },
                    { label: 'Neutered', value: dog.is_neutered ? 'Yes' : 'No' },
                    { label: 'Current Food', value: dog.current_food || 'Not specified' },
                  ].map((row, i, arr) => (
                    <div key={row.label} style={{
                      display: 'flex', justifyContent: 'space-between', padding: '11px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid #f5f2ec' : 'none',
                    }}>
                      <span style={{ fontSize: 14, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>{row.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', fontFamily: "'DM Sans', sans-serif", textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Breed */}
                  <div>
                    <label style={{ fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: 'block' }}>Breed</label>
                    <BreedPicker value={editData.breed} onChange={v => setEditData(d => ({ ...d, breed: v }))} />
                  </div>
                  {/* Age */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: 'block' }}>Age</label>
                      <input type="number" min="0" value={editData.age_value} onChange={e => setEditData(d => ({ ...d, age_value: e.target.value }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #ede8df', fontSize: 14, fontFamily: "'DM Sans', sans-serif", background: '#fff', outline: 'none', fontWeight: 600, color: '#1a1612', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ width: 120 }}>
                      <label style={{ fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: 'block' }}>Unit</label>
                      <select value={editData.age_unit} onChange={e => setEditData(d => ({ ...d, age_unit: e.target.value }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #ede8df', fontSize: 14, fontFamily: "'DM Sans', sans-serif", background: '#fff', outline: 'none', fontWeight: 600, color: '#1a1612', boxSizing: 'border-box' }}>
                        <option value="years">Years</option>
                        <option value="months">Months</option>
                      </select>
                    </div>
                  </div>
                  {/* Weight */}
                  <div>
                    <label style={{ fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: 'block' }}>Weight (lbs)</label>
                    <input type="number" min="0" value={editData.weight_lbs} onChange={e => setEditData(d => ({ ...d, weight_lbs: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #ede8df', fontSize: 14, fontFamily: "'DM Sans', sans-serif", background: '#fff', outline: 'none', fontWeight: 600, color: '#1a1612', boxSizing: 'border-box' }} />
                  </div>
                  {/* Gender */}
                  <div>
                    <label style={{ fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: 'block' }}>Gender</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['male', 'female'].map(g => (
                        <button key={g} onClick={() => setEditData(d => ({ ...d, gender: g }))} style={{
                          flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                          background: editData.gender === g ? '#f7efd8' : '#fff',
                          color: editData.gender === g ? '#1a1612' : '#8a7e72',
                          border: editData.gender === g ? '1.5px solid #C9A84C' : '1.5px solid #ede8df',
                        }}>{g === 'male' ? 'Male' : 'Female'}</button>
                      ))}
                    </div>
                  </div>
                  {/* Neutered */}
                  <div>
                    <label style={{ fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: 'block' }}>Neutered</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[true, false].map(v => (
                        <button key={String(v)} onClick={() => setEditData(d => ({ ...d, is_neutered: v }))} style={{
                          flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                          background: editData.is_neutered === v ? '#f7efd8' : '#fff',
                          color: editData.is_neutered === v ? '#1a1612' : '#8a7e72',
                          border: editData.is_neutered === v ? '1.5px solid #C9A84C' : '1.5px solid #ede8df',
                        }}>{v ? 'Yes' : 'No'}</button>
                      ))}
                    </div>
                  </div>
                  {/* Current Food */}
                  <div>
                    <label style={{ fontSize: 12, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: 'block' }}>Current Food</label>
                    <FoodPicker value={editFood} onChange={setEditFood} />
                  </div>

                  {/* Save / Cancel */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button disabled={saving} onClick={async () => {
                      if (!editData.breed || !editData.age_value || !editData.weight_lbs) return;
                      setSaving(true);
                      // Build updates — only include food fields if user changed them
                      const updates = {
                        breed: editData.breed,
                        age_value: parseInt(editData.age_value),
                        age_unit: editData.age_unit,
                        weight_lbs: parseInt(editData.weight_lbs),
                        gender: editData.gender,
                        is_neutered: editData.is_neutered,
                      };
                      // editFood: undefined = not touched, null = cleared, object = new selection
                      if (editFood !== undefined) {
                        if (editFood && editFood.slug) {
                          updates.current_food = editFood.name;
                          updates.current_food_slug = `${editFood.brand_slug}/${editFood.slug}`;
                        } else {
                          updates.current_food = null;
                          updates.current_food_slug = null;
                        }
                      }
                      try {
                        const res = await fetch('/api/profile', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ dog_id: dog.id, updates }),
                        });
                        const result = await res.json();
                        if (res.ok && result && !result.error) {
                          setDogs(prev => prev.map((d, i) => i === activeDogIdx ? result : d));
                          setEditing(false);
                          setEditFood(null);
                          setCurrentFoodData(null);
                          setPercentile(null);
                          setAlternatives([]);
                          setRefreshKey(k => k + 1);
                          setTab('dashboard');
                        } else {
                          alert('Failed to save: ' + (result?.error || 'Unknown error. You may need to add an UPDATE policy in Supabase.'));
                        }
                      } catch (err) {
                        console.error('Save failed:', err);
                        alert('Failed to save changes. Please try again.');
                      }
                      setSaving(false);
                    }} style={{
                      flex: 1, padding: '12px 0', borderRadius: 100, background: '#1a1612', color: '#faf8f4',
                      fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      opacity: saving ? 0.6 : 1,
                    }}>{saving ? 'Saving...' : 'Save Changes'}</button>
                    <button onClick={() => { setEditing(false); setEditFood(null); }} style={{
                      padding: '12px 24px', borderRadius: 100, background: 'transparent', color: '#8a7e72',
                      fontSize: 14, fontWeight: 600, border: '1.5px solid #ede8df',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Priorities */}
            {!editing && dog.priorities && dog.priorities.length > 0 && (
              <div style={cardStyle}>
                <div style={eyebrow()}>Your Priorities</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {dog.priorities.map(p => (
                    <span key={p} style={{
                      padding: '8px 16px', borderRadius: 100,
                      background: '#f7efd8', border: '1.5px solid #C9A84C',
                      fontSize: 13, fontWeight: 600, color: '#1a1612',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>{p}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ SAVED TAB ═══ */}
        {tab === 'saved' && (
          <>
            {savedComparisons.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {savedComparisons.map(comp => {
                  const highestScore = Math.max(...comp.items.map(f => f.quality_score ?? 0));
                  return (
                    <div key={comp.id} style={cardStyle}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={eyebrow()}>Saved Comparison</div>
                        <span style={{ fontSize: 11, color: '#b5aa99', fontFamily: "'DM Sans', sans-serif" }}>
                          {new Date(comp.saved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' \u00B7 '}{comp.items.length} products
                        </span>
                      </div>

                      {/* Horizontal scroll cards (mobile) / responsive grid (desktop) */}
                      <div className="saved-scroll-row" style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14,
                      }}>
                        {comp.items.map(f => {
                          const isHighest = f.quality_score != null && f.quality_score === highestScore && comp.items.filter(x => x.quality_score === highestScore).length === 1;
                          const scoreColor = f.quality_score >= 70 ? '#2d7a4f' : f.quality_score >= 50 ? '#c47a20' : '#b5483a';
                          const tier = f.quality_score >= 90 ? 'Excellent' : f.quality_score >= 80 ? 'Great' : f.quality_score >= 70 ? 'Good' : f.quality_score >= 60 ? 'Fair' : f.quality_score >= 50 ? 'Below Avg' : 'Poor';
                          const nutrients = [
                            { label: 'Protein', key: 'protein_dmb', color: '#639922', max: 50 },
                            { label: 'Fat', key: 'fat_dmb', color: '#EF9F27', max: 25 },
                            { label: 'Carbs', key: 'carbs_dmb', color: '#378ADD', max: 60 },
                          ];
                          return (
                            <div key={f.id} className="saved-card" onClick={() => goToFood(f)} style={{
                              background: '#faf8f4', borderRadius: 16,
                              border: isHighest ? '2px solid #C9A84C' : '1px solid #ede8df',
                              padding: 18, position: 'relative', cursor: 'pointer',
                              transition: 'box-shadow 0.2s',
                            }}
                              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,22,18,0.06)')}
                              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                            >
                              {isHighest && (
                                <span style={{
                                  position: 'absolute', top: 8, right: 8,
                                  background: '#C9A84C', color: '#fff', padding: '3px 10px',
                                  borderRadius: 100, fontSize: 10, fontWeight: 700,
                                  fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5,
                                }}>HIGHEST</span>
                              )}

                              {/* Score + tier */}
                              {f.quality_score != null && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                  <ScoreCircle score={f.quality_score} size={42} />
                                </div>
                              )}

                              {/* Brand */}
                              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#8a7e72', marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>{f.brand}</div>

                              {/* Product name */}
                              <div style={{
                                fontSize: 13, fontWeight: 700, color: '#1a1612', lineHeight: 1.3,
                                marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                fontFamily: "'DM Sans', sans-serif",
                              }}>{f.name}</div>

                              {/* Nutrient bars */}
                              {nutrients.map(n => {
                                const val = f[n.key];
                                const pct = val != null ? Math.min((val / n.max) * 100, 100) : 0;
                                return (
                                  <div key={n.key} style={{ marginBottom: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                      <span style={{ fontSize: 10, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>{n.label}</span>
                                      <span style={{ fontSize: 10, fontWeight: 700, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>
                                        {val != null ? `${Math.round(val * 10) / 10}%` : '\u2014'}
                                      </span>
                                    </div>
                                    <div style={{ height: 5, borderRadius: 3, background: '#ede8df' }}>
                                      <div style={{ height: '100%', borderRadius: 3, background: n.color, width: `${pct}%`, transition: 'width 0.4s ease' }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16 }}>
                        <button onClick={() => router.push('/compare')} style={{
                          padding: '9px 22px', borderRadius: 100, background: '#1a1612', color: '#faf8f4',
                          fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        }}>View Full Comparison &rarr;</button>
                        <button onClick={() => deleteComparison(comp.id)} style={{
                          padding: '9px 22px', borderRadius: 100, background: 'transparent', color: '#8a7e72',
                          fontSize: 12, fontWeight: 600, border: '1.5px solid #ede8df',
                          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        }}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={cardStyle}>
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 32, opacity: 0.4, marginBottom: 12 }}>{'\u{1F4CC}'}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1612', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>No saved comparisons yet</div>
                  <p style={{ fontSize: 13, color: '#8a7e72', marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
                    Browse foods and tap &ldquo;Add to Compare&rdquo; to save them here.
                  </p>
                  <button onClick={() => router.push('/discover')} style={{
                    padding: '10px 28px', borderRadius: 100, background: '#1a1612', color: '#faf8f4',
                    fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}>Discover Foods &rarr;</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ SETTINGS TAB ═══ */}
        {tab === 'settings' && (
          <>
            {/* Account */}
            <div style={cardStyle}>
              <div style={eyebrow()}>Account</div>
              {[
                { label: 'Name', value: user.first_name },
                { label: 'Email', value: user.email },
                { label: 'Zip Code', value: user.zip_code },
                ...(user.heard_from ? [{ label: 'Heard From', value: user.heard_from }] : []),
              ].map((row, i, arr) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid #f5f2ec' : 'none',
                }}>
                  <span style={{ fontSize: 14, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>{row.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>{row.value}</span>
                    <span style={{ fontSize: 12, color: '#C9A84C', cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Edit</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button onClick={handleLogout} style={{
                padding: '10px 32px', borderRadius: 100, background: 'transparent', color: '#8a7e72',
                fontSize: 14, fontWeight: 600, border: '1.5px solid #ede8df',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>Log Out</button>
              <div style={{ marginTop: 16 }}>
                <span style={{ fontSize: 12, color: '#d4760a', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Delete Account
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .saved-scroll-row::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          .profile-container { padding: 20px 16px 60px !important; }
          .current-food-layout { flex-direction: column !important; align-items: center !important; text-align: center !important; }
          .current-food-img { width: 80px !important; }
          .saved-scroll-row {
            display: flex !important;
            grid-template-columns: unset !important;
            overflow-x: auto !important;
            padding-bottom: 8px !important;
            scroll-snap-type: x mandatory !important;
            scrollbar-width: none !important;
          }
          .saved-card {
            flex: 0 0 200px !important;
            scroll-snap-align: start !important;
          }
        }
      `}</style>
    </div>
  );
}
