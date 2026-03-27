'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { supabase } from '../../lib/supabase';
import CompareBubble from '../components/CompareBubble';
import SearchBox from '../components/SearchBox';

/* ── filter range definitions ── */
const SCORE_RANGES = [
  { label: 'Excellent (90–100)', min: 90, max: 100 },
  { label: 'Great (80–89)', min: 80, max: 89 },
  { label: 'Good (70–79)', min: 70, max: 79 },
  { label: 'Fair (60–69)', min: 60, max: 69 },
  { label: 'Below Avg (50–59)', min: 50, max: 59 },
  { label: 'Poor (under 50)', min: 0, max: 49 },
];

const PROTEIN_TYPES = ['Chicken', 'Beef', 'Salmon', 'Lamb', 'Turkey', 'Duck', 'Fish', 'Other', 'Specialty / Veterinary'];

const PROTEIN_RANGES = [
  { label: 'Under 22%', min: 0, max: 21.9 },
  { label: '22–28%', min: 22, max: 28.9 },
  { label: '28–35%', min: 28, max: 35.9 },
  { label: '35%+', min: 35, max: 999 },
];

const CARB_RANGES = [
  { label: 'Under 20%', min: 0, max: 19.9 },
  { label: '20–30%', min: 20, max: 30.9 },
  { label: '30–40%', min: 30, max: 40.9 },
  { label: '40%+', min: 40, max: 999 },
];

const FAT_RANGES = [
  { label: 'Under 10%', min: 0, max: 9.9 },
  { label: '10–15%', min: 10, max: 15.9 },
  { label: '15–20%', min: 15, max: 20.9 },
  { label: '20%+', min: 20, max: 999 },
];

const FIBER_RANGES = [
  { label: 'Under 3%', min: 0, max: 2.9 },
  { label: '3–6%', min: 3, max: 6.9 },
  { label: '6%+', min: 6, max: 999 },
];

/* ── score tier helpers ── */
function getScoreColor(score) {
  if (score >= 70) return '#2d7a4f';
  if (score >= 50) return '#c47a20';
  return '#b5483a';
}

function getScoreTier(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Great';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Below Avg';
  return 'Poor';
}

/* ── score ring badge ── */
function ScoreRing({ score }) {
  if (score == null) return null;
  const color = getScoreColor(score);
  const circumference = 106.8;
  const offset = circumference * (1 - score / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>
      <svg width={42} height={42} viewBox="0 0 42 42">
        <circle cx={21} cy={21} r={17} fill="none" stroke="#ede8df" strokeWidth={3} />
        <circle cx={21} cy={21} r={17} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 21 21)" />
        <text x={21} y={21} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", fill: '#1a1612' }}>
          {score}
        </text>
      </svg>
      <span style={{ fontSize: 9, fontFamily: "'DM Sans', sans-serif", color: '#8a7e72', marginTop: 2 }}>
        {getScoreTier(score)}
      </span>
    </div>
  );
}

/* ── sort options ── */
const SORT_OPTIONS = [
  { label: 'GoodKibble Score (high to low)', value: 'score_desc', field: 'quality_score', dir: -1 },
  { label: 'GoodKibble Score (low to high)', value: 'score_asc', field: 'quality_score', dir: 1 },
  { label: 'Protein (high to low)', value: 'protein_desc', field: 'protein_dmb', dir: -1 },
  { label: 'Protein (low to high)', value: 'protein_asc', field: 'protein_dmb', dir: 1 },
  { label: 'Carbs (low to high)', value: 'carbs_asc', field: 'carbs_dmb', dir: 1 },
  { label: 'Carbs (high to low)', value: 'carbs_desc', field: 'carbs_dmb', dir: -1 },
  { label: 'Fat (low to high)', value: 'fat_asc', field: 'fat_dmb', dir: 1 },
  { label: 'Fat (high to low)', value: 'fat_desc', field: 'fat_dmb', dir: -1 },
  { label: 'Brand (A–Z)', value: 'brand_asc', field: 'brand', dir: 1 },
  { label: 'Brand (Z–A)', value: 'brand_desc', field: 'brand', dir: -1 },
];

/* ── collapsible filter section (Change 5) ── */
function FilterSection({ title, children, defaultOpen = true, forceOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = open || forceOpen;
  return (
    <div style={{ marginBottom: 16, borderBottom: '1px solid #ede8df', paddingBottom: 12 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
        border: 'none', background: 'none', cursor: 'pointer', padding: '4px 0',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1612', letterSpacing: 1, textTransform: 'uppercase' }}>{title}</span>
        <span style={{ fontSize: 14, color: '#8a7e72', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {isOpen && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
}

/* ── checkbox option ── */
function CheckOption({ label, checked, onChange, count }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0',
      cursor: 'pointer', fontSize: 14, color: '#3d352b',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ accentColor: '#1a1612', width: 16, height: 16 }} />
      <span style={{ flex: 1 }}>{label}</span>
      {count !== undefined && <span style={{ fontSize: 12, color: '#b5aa99' }}>({count})</span>}
    </label>
  );
}

/* ── product card (Change 4: added fiber pill) ── */
function ProductCard({ food, onClick }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #ede8df',
      cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex', gap: 14, alignItems: 'center',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,22,18,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {food.image_url && !imgErr ? (
        <div style={{ width: 56, height: 72, borderRadius: 10, overflow: 'hidden', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img src={food.image_url} alt="" onError={() => setImgErr(true)} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      ) : (
        <div style={{ width: 56, height: 72, borderRadius: 10, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🐕</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: '#8a7e72', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{food.brand}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', lineHeight: 1.3, marginBottom: 6,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{food.name}</div>
        {(food.flavor || food.primary_protein) && (
          <div style={{ marginBottom: 6 }}>
            {food.flavor && (
              <div style={{ fontSize: 12, color: '#8a7e72', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 600, color: '#6b6157' }}>Flavor:</span> {food.flavor}
              </div>
            )}
            {food.primary_protein && (
              <div style={{ fontSize: 12, color: '#8a7e72', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 600, color: '#6b6157' }}>Primary Protein:</span> {food.primary_protein}
              </div>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#e8f5ee', color: '#2d7a4f' }}>Protein {(Math.round(food.protein_dmb * 10) / 10)}%</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#fef3e2', color: '#c47a20' }}>Fat {(Math.round(food.fat_dmb * 10) / 10)}%</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#edf2f7', color: '#5a7a9e' }}>Carbs {(Math.round(food.carbs_dmb * 10) / 10)}%</span>
          {food.fiber_dmb != null && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#f0edf7', color: '#8a6aaf' }}>Fiber {(Math.round(food.fiber_dmb * 10) / 10)}%</span>
          )}
        </div>
      </div>
      <ScoreRing score={food.quality_score} />
    </div>
  );
}

/* ── main discover page content ── */
function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allFoods, setAllFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* filter state */
  const [selectedScoreRange, setSelectedScoreRange] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const initialProtein = searchParams.get('protein');
  const [selectedProteins, setSelectedProteins] = useState(initialProtein ? [initialProtein] : []);
  const [selectedProteinRange, setSelectedProteinRange] = useState([]);
  const [selectedCarbRange, setSelectedCarbRange] = useState([]);
  const [selectedFatRange, setSelectedFatRange] = useState([]);
  const [selectedFiberRange, setSelectedFiberRange] = useState([]);
  const [brandSearch, setBrandSearch] = useState('');

  /* sort state (Change 3) — read initial from URL, default protein desc */
  const initialSort = searchParams.get('sort') || 'score_desc';
  const [sortValue, setSortValue] = useState(initialSort);

  const goHome = () => router.push('/');
  const goFood = (id) => router.push(`/food/${id}`);

  /* update URL when sort changes */
  function handleSortChange(val) {
    setSortValue(val);
    const url = new URL(window.location);
    url.searchParams.set('sort', val);
    window.history.replaceState({}, '', url);
  }

  /* fetch all products once */
  useEffect(() => {
    async function load() {
      let all = [];
      let offset = 0;
      const batch = 1000;
      while (true) {
        const { data } = await supabase
          .from('dog_foods_v2')
          .select('id, name, brand, flavor, protein_dmb, fat_dmb, carbs_dmb, fiber_dmb, primary_protein, image_url, quality_score')
          .range(offset, offset + batch - 1);
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < batch) break;
        offset += batch;
      }
      setAllFoods(all);
      setLoading(false);
    }
    load();
  }, []);

  /* derive brand list from data */
  const brands = useMemo(() => {
    const counts = {};
    allFoods.forEach(f => { counts[f.brand] = (counts[f.brand] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [allFoods]);

  /* derive protein type counts */
  const proteinCounts = useMemo(() => {
    const counts = {};
    PROTEIN_TYPES.forEach(t => { counts[t] = 0; });
    allFoods.forEach(f => {
      const pp = f.primary_protein || 'Unknown';
      if (counts[pp] !== undefined) counts[pp]++;
      else counts['Other'] = (counts['Other'] || 0) + 1;
    });
    return counts;
  }, [allFoods]);

  /* filtered brands for the brand search */
  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brands;
    const q = brandSearch.toLowerCase();
    return brands.filter(b => b.name.toLowerCase().includes(q));
  }, [brands, brandSearch]);

  /* apply all filters */
  const filtered = useMemo(() => {
    return allFoods.filter(f => {
      if (selectedScoreRange.length > 0) {
        const val = f.quality_score;
        if (val == null || !selectedScoreRange.some(r => val >= r.min && val <= r.max)) return false;
      }
      if (selectedBrands.length > 0 && !selectedBrands.includes(f.brand)) return false;
      if (selectedProteins.length > 0) {
        const pp = f.primary_protein || 'Unknown';
        if (!selectedProteins.includes(pp)) return false;
      }
      if (selectedProteinRange.length > 0) {
        const val = f.protein_dmb || 0;
        if (!selectedProteinRange.some(r => val >= r.min && val <= r.max)) return false;
      }
      if (selectedCarbRange.length > 0) {
        const val = f.carbs_dmb || 0;
        if (!selectedCarbRange.some(r => val >= r.min && val <= r.max)) return false;
      }
      if (selectedFatRange.length > 0) {
        const val = f.fat_dmb || 0;
        if (!selectedFatRange.some(r => val >= r.min && val <= r.max)) return false;
      }
      if (selectedFiberRange.length > 0) {
        const val = f.fiber_dmb || 0;
        if (!selectedFiberRange.some(r => val >= r.min && val <= r.max)) return false;
      }
      return true;
    });
  }, [allFoods, selectedScoreRange, selectedBrands, selectedProteins, selectedProteinRange, selectedCarbRange, selectedFatRange, selectedFiberRange]);

  /* sort filtered results (Change 3) */
  const sorted = useMemo(() => {
    const opt = SORT_OPTIONS.find(o => o.value === sortValue) || SORT_OPTIONS[0];
    return [...filtered].sort((a, b) => {
      const av = a[opt.field];
      const bv = b[opt.field];
      /* nulls go to bottom */
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string') return opt.dir * av.localeCompare(bv);
      return opt.dir * (av - bv);
    });
  }, [filtered, sortValue]);

  const activeFilterCount = [selectedScoreRange, selectedBrands, selectedProteins, selectedProteinRange, selectedCarbRange, selectedFatRange, selectedFiberRange]
    .filter(a => a.length > 0).length;

  function clearAll() {
    setSelectedScoreRange([]);
    setSelectedBrands([]);
    setSelectedProteins([]);
    setSelectedProteinRange([]);
    setSelectedCarbRange([]);
    setSelectedFatRange([]);
    setSelectedFiberRange([]);
    setBrandSearch('');
  }

  function toggleBrand(name) {
    setSelectedBrands(prev => prev.includes(name) ? prev.filter(b => b !== name) : [...prev, name]);
  }
  function toggleProtein(name) {
    setSelectedProteins(prev => prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]);
  }
  function toggleRange(range, selected, setter) {
    const exists = selected.some(r => r.label === range.label);
    setter(exists ? selected.filter(r => r.label !== range.label) : [...selected, range]);
  }

  /* ── smart result count text (Change 1) ── */
  function getResultText() {
    if (loading) return 'Loading...';
    if (filtered.length === 0) return 'No foods match your filters';
    if (activeFilterCount === 0) return `Showing all ${allFoods.length.toLocaleString()} foods`;
    if (activeFilterCount === 1) {
      if (selectedProteins.length === 1) {
        return `Showing ${filtered.length.toLocaleString()} ${selectedProteins[0].toLowerCase()} foods`;
      }
      if (selectedBrands.length === 1) {
        return `Showing ${filtered.length.toLocaleString()} ${selectedBrands[0]} foods`;
      }
    }
    return `Showing ${filtered.length.toLocaleString()} foods`;
  }

  /* ── filter panel content ── */
  const filterContent = (
    <>
      <FilterSection title="GoodKibble Score" defaultOpen={true} forceOpen={selectedScoreRange.length > 0}>
        {SCORE_RANGES.map(r => (
          <CheckOption key={r.label} label={r.label}
            checked={selectedScoreRange.some(s => s.label === r.label)}
            onChange={() => toggleRange(r, selectedScoreRange, setSelectedScoreRange)} />
        ))}
      </FilterSection>

      <FilterSection title="Protein Type" defaultOpen={true} forceOpen={selectedProteins.length > 0}>
        {PROTEIN_TYPES.map(pt => (
          <CheckOption key={pt} label={pt} count={proteinCounts[pt] || 0}
            checked={selectedProteins.includes(pt)}
            onChange={() => toggleProtein(pt)} />
        ))}
      </FilterSection>

      <FilterSection title="Brand" defaultOpen={true} forceOpen={selectedBrands.length > 0}>
        <input
          type="text" placeholder="Search brands..."
          value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 10,
            border: '1.5px solid #ede8df', fontSize: 13, marginBottom: 8,
            fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#faf8f5',
          }}
          onFocus={(e) => e.target.style.borderColor = '#f0c930'}
          onBlur={(e) => e.target.style.borderColor = '#ede8df'}
        />
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {filteredBrands.map(b => (
            <CheckOption key={b.name} label={b.name} count={b.count}
              checked={selectedBrands.includes(b.name)}
              onChange={() => toggleBrand(b.name)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Protein %" defaultOpen={false} forceOpen={selectedProteinRange.length > 0}>
        {PROTEIN_RANGES.map(r => (
          <CheckOption key={r.label} label={r.label}
            checked={selectedProteinRange.some(s => s.label === r.label)}
            onChange={() => toggleRange(r, selectedProteinRange, setSelectedProteinRange)} />
        ))}
      </FilterSection>

      <FilterSection title="Carbohydrates %" defaultOpen={false} forceOpen={selectedCarbRange.length > 0}>
        {CARB_RANGES.map(r => (
          <CheckOption key={r.label} label={r.label}
            checked={selectedCarbRange.some(s => s.label === r.label)}
            onChange={() => toggleRange(r, selectedCarbRange, setSelectedCarbRange)} />
        ))}
      </FilterSection>

      <FilterSection title="Fat %" defaultOpen={false} forceOpen={selectedFatRange.length > 0}>
        {FAT_RANGES.map(r => (
          <CheckOption key={r.label} label={r.label}
            checked={selectedFatRange.some(s => s.label === r.label)}
            onChange={() => toggleRange(r, selectedFatRange, setSelectedFatRange)} />
        ))}
      </FilterSection>

      <FilterSection title="Fiber %" defaultOpen={false} forceOpen={selectedFiberRange.length > 0}>
        {FIBER_RANGES.map(r => (
          <CheckOption key={r.label} label={r.label}
            checked={selectedFiberRange.some(s => s.label === r.label)}
            onChange={() => toggleRange(r, selectedFiberRange, setSelectedFiberRange)} />
        ))}
      </FilterSection>
    </>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5' }}>
      {/* nav */}
      <nav className="nav-bar" style={{
        padding: '16px 24px 16px 40px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: '1px solid #ede8df', background: '#faf8f5',
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

      {/* content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 80px' }}>
        {/* header */}
        <div style={{ marginBottom: 8 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3vw, 40px)',
            fontWeight: 800, color: '#1a1612', letterSpacing: -1, marginBottom: 4,
          }}>Discover Foods</h1>
        </div>

        {/* mobile filter toggle */}
        <div className="mobile-filter-toggle" style={{ display: 'none', marginBottom: 12 }}>
          <button onClick={() => setMobileFiltersOpen(true)} style={{
            width: '100%', padding: '12px 20px', borderRadius: 14,
            border: '1.5px solid #ede8df', background: '#fff',
            fontSize: 14, fontWeight: 600, color: '#1a1612', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
            <span style={{ color: '#8a7e72' }}>▼</span>
          </button>
        </div>

        {/* result count + clear + sort row (Changes 1, 2, 3) */}
        <div className="results-bar" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, color: '#8a7e72', fontFamily: "'DM Sans', sans-serif" }}>
              {getResultText()}
            </span>
            {activeFilterCount > 0 && (
              <span
                onClick={clearAll}
                style={{
                  fontSize: 13, color: '#b5aa99', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => { e.target.style.color = '#1a1612'; e.target.style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { e.target.style.color = '#b5aa99'; e.target.style.textDecoration = 'none'; }}
              >
                · Clear filters
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#b5aa99', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>Sort by:</span>
            <select
              value={sortValue}
              onChange={(e) => handleSortChange(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 10, border: '1.5px solid #ede8df',
                background: '#fff', fontSize: 13, color: '#1a1612', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", outline: 'none',
                appearance: 'none', WebkitAppearance: 'none',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'10\' height=\'6\' viewBox=\'0 0 10 6\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1L5 5L9 1\' stroke=\'%238a7e72\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
                paddingRight: 32,
              }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* main layout: sidebar + grid */}
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
          {/* desktop sidebar */}
          <div className="filter-sidebar" style={{
            width: 260, flexShrink: 0, position: 'sticky', top: 80,
            maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
            padding: '20px 20px 20px 0',
          }}>
            {filterContent}
          </div>

          {/* product grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <div style={{ width: 40, height: 40, border: '4px solid #ede8df', borderTopColor: '#1a1612', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : sorted.length === 0 ? (
              <div style={{ padding: '60px 32px', borderRadius: 24, border: '2px dashed #e8e0d4', textAlign: 'center', color: '#b5aa99' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>No products match your filters</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>Try removing some filters</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {sorted.map((f) => (
                  <ProductCard key={f.id} food={f} onClick={() => goFood(f.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* mobile filter panel */}
      {mobileFiltersOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(26,22,18,0.4)',
        }} onClick={() => setMobileFiltersOpen(false)}>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: '#fff', borderRadius: '24px 24px 0 0',
            padding: '24px 24px 32px', maxHeight: '85vh', overflowY: 'auto',
            animation: 'fadeUp 0.25s ease',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1612' }}>Filters</span>
              <button onClick={() => setMobileFiltersOpen(false)} style={{
                background: 'none', border: 'none', fontSize: 22, color: '#8a7e72', cursor: 'pointer',
              }}>✕</button>
            </div>
            {filterContent}
            <button onClick={() => setMobileFiltersOpen(false)} style={{
              width: '100%', padding: '14px', borderRadius: 14,
              border: 'none', background: '#1a1612', color: '#faf8f5',
              fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 16,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Show {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* footer */}
      <div className="footer-bar" style={{
        borderTop: '1px solid #ede8df', padding: '32px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: '#1a1612' }}>
          Good<span style={{ color: '#f0c930' }}>Kibble</span>
        </div>
        <div style={{ fontSize: 13, color: '#b5aa99' }}>© 2026 GoodKibble. Not affiliated with any dog food brand.</div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .filter-sidebar { display: none !important; }
          .mobile-filter-toggle { display: block !important; }
        }
      `}</style>
    </div>
  );
}

/* Wrap in Suspense for useSearchParams */
export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #ede8df', borderTopColor: '#1a1612', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <DiscoverContent />
    </Suspense>
  );
}
