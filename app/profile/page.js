'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SignUpButton from '../components/SignUpButton';

const cardStyle = {
  background: '#fff', borderRadius: 20, border: '1px solid #ede8df', padding: 28, marginBottom: 24,
};
const eyebrow = (text) => ({
  fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: '#C9A84C',
  textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16,
});
const mobileCardPad = { padding: 28 };

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

  // Current food data from dog_foods_v2
  const [currentFoodData, setCurrentFoodData] = useState(null);
  const [percentile, setPercentile] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [altProteinOnly, setAltProteinOnly] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  // Saved foods
  const [savedFoods, setSavedFoods] = useState([]);

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
  }, [dog?.current_food_slug]);

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

  // Load saved foods from localStorage
  useEffect(() => {
    const slugs = JSON.parse(localStorage.getItem('gk_saved_foods') || '[]');
    if (slugs.length === 0) { setSavedFoods([]); return; }
    // Fetch each saved food
    Promise.all(slugs.map(s =>
      fetch(`/api/foods/search?q=${encodeURIComponent(s)}&limit=3`)
        .then(r => r.json())
        .then(data => (Array.isArray(data) ? data : [])[0] || null)
    )).then(foods => setSavedFoods(foods.filter(Boolean)));
  }, [tab]);

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

  const tabs = ['Dashboard', 'Saved', 'Settings'];

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
              <button key={d.id} onClick={() => setActiveDogIdx(i)} style={{
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
                    <button style={{
                      padding: '10px 24px', borderRadius: 100, background: 'transparent', color: '#C9A84C',
                      fontSize: 13, fontWeight: 600, border: '1.5px solid #C9A84C', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}>Change Food</button>
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
                  These foods {altProteinOnly && currentFoodData.primary_protein ? `share the same primary protein as ${displayName}\u2019s current food and ` : ''}scored higher on our 0\u2013100 scale.
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
                      ? `${displayName}\u2019s food is already top-tier! No higher-scored alternatives found.`
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

            {/* Dog Profile Quick View */}
            {dog && (
              <div style={cardStyle}>
                <div style={eyebrow()}>{displayName}&rsquo;s Profile</div>
                {[
                  { label: 'Breed', value: dog.breed },
                  { label: 'Age', value: `${dog.age_value} ${dog.age_unit}` },
                  { label: 'Weight', value: `${dog.weight_lbs} lbs` },
                  { label: 'Gender', value: dog.gender === 'male' ? 'Male' : 'Female' },
                  { label: 'Neutered', value: dog.is_neutered ? 'Yes' : 'No' },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '11px 0',
                    borderBottom: i < arr.length - 1 ? '1px solid #f5f2ec' : 'none',
                  }}>
                    <span style={{ fontSize: 14, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 16 }}>
                  <button style={{
                    padding: '10px 24px', borderRadius: 100, background: 'transparent', color: '#1a1612',
                    fontSize: 13, fontWeight: 600, border: '1.5px solid #ede8df',
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}>Edit Profile</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ SAVED TAB ═══ */}
        {tab === 'saved' && (
          <>
            <div style={cardStyle}>
              <div style={eyebrow()}>Saved Comparisons</div>
              {savedFoods.length > 0 ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {savedFoods.map(f => (
                    <ProductCard key={f.id} food={f} onClick={() => goToFood(f)} />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 12 }}>{'\u{1F516}'}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1612', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>No saved foods yet</div>
                  <p style={{ fontSize: 13, color: '#8a7e72', marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
                    Browse foods and tap &ldquo;Add to Compare&rdquo; to save them here.
                  </p>
                  <button onClick={() => router.push('/discover')} style={{
                    padding: '10px 28px', borderRadius: 100, background: '#1a1612', color: '#faf8f4',
                    fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}>Discover Foods &rarr;</button>
                </div>
              )}
            </div>

            {/* Quick Compare Table */}
            {savedFoods.length > 0 && currentFoodData && (
              <div style={cardStyle}>
                <div style={eyebrow()}>Quick Compare with {displayName}&rsquo;s Food</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px 10px', color: '#8a7e72', fontWeight: 500, borderBottom: '1px solid #f5f2ec' }}></th>
                        <th style={{ padding: '8px 10px', color: '#C9A84C', fontWeight: 700, borderBottom: '2px solid #C9A84C', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {currentFoodData.brand}
                        </th>
                        {savedFoods.map(f => (
                          <th key={f.id} style={{ padding: '8px 10px', color: '#1a1612', fontWeight: 600, borderBottom: '1px solid #f5f2ec', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {f.brand}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Score', key: 'quality_score', fmt: v => v ?? '—' },
                        { label: 'Protein %', key: 'protein_dmb', fmt: v => v != null ? `${Math.round(v * 10) / 10}%` : '—' },
                        { label: 'Fat %', key: 'fat_dmb', fmt: v => v != null ? `${Math.round(v * 10) / 10}%` : '—' },
                        { label: 'Carbs %', key: 'carbs_dmb', fmt: v => v != null ? `${Math.round(v * 10) / 10}%` : '—' },
                        { label: 'Protein', key: 'primary_protein', fmt: v => v || '—' },
                      ].map(row => (
                        <tr key={row.label}>
                          <td style={{ padding: '8px 10px', color: '#8a7e72', borderBottom: '1px solid #f5f2ec' }}>{row.label}</td>
                          <td style={{ padding: '8px 10px', color: '#639922', fontWeight: 700, textAlign: 'center', borderBottom: '1px solid #f5f2ec' }}>
                            {row.fmt(currentFoodData[row.key])}
                          </td>
                          {savedFoods.map(f => (
                            <td key={f.id} style={{ padding: '8px 10px', color: '#1a1612', textAlign: 'center', borderBottom: '1px solid #f5f2ec' }}>
                              {row.fmt(f[row.key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

            {/* Priorities */}
            {dog?.priorities && dog.priorities.length > 0 && (
              <div style={cardStyle}>
                <div style={eyebrow()}>Your Priorities</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
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
        @media (max-width: 768px) {
          .profile-container { padding: 20px 16px 60px !important; }
          .current-food-layout { flex-direction: column !important; align-items: center !important; text-align: center !important; }
          .current-food-img { width: 80px !important; }
        }
      `}</style>
    </div>
  );
}
