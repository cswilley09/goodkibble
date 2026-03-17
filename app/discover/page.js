'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import CompareBubble from '../components/CompareBubble';
import SearchBox from '../components/SearchBox';

/* ── filter range definitions ── */
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

/* ── collapsible filter section ── */
function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16, borderBottom: '1px solid #ede8df', paddingBottom: 12 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
        border: 'none', background: 'none', cursor: 'pointer', padding: '4px 0',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1612', letterSpacing: 1, textTransform: 'uppercase' }}>{title}</span>
        <span style={{ fontSize: 14, color: '#8a7e72', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {open && <div style={{ marginTop: 10 }}>{children}</div>}
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

/* ── product card ── */
function ProductCard({ food, onClick }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #ede8df',
      cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex', gap: 14, alignItems: 'flex-start',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,22,18,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {food.image_url && !imgErr ? (
        <div style={{ width: 56, height: 72, borderRadius: 10, overflow: 'hidden', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img src={food.image_url} alt="" onError={() => setImgErr(true)} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
        </div>
      ) : (
        <div style={{ width: 56, height: 72, borderRadius: 10, background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🐕</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: '#8a7e72', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{food.brand}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', lineHeight: 1.3, marginBottom: 6,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{food.name}</div>
        {food.flavor && <div style={{ fontSize: 12, color: '#8a7e72', marginBottom: 8 }}>{food.flavor}</div>}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#e8f5ee', color: '#2d7a4f' }}>Protein {food.protein_dmb}%</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#fef3e2', color: '#c47a20' }}>Fat {food.fat_dmb}%</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#edf2f7', color: '#5a7a9e' }}>Carbs {food.carbs_dmb}%</span>
        </div>
      </div>
    </div>
  );
}

/* ── main discover page ── */
export default function DiscoverPage() {
  const router = useRouter();
  const [allFoods, setAllFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* filter state */
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedProteins, setSelectedProteins] = useState([]);
  const [selectedProteinRange, setSelectedProteinRange] = useState([]);
  const [selectedCarbRange, setSelectedCarbRange] = useState([]);
  const [selectedFatRange, setSelectedFatRange] = useState([]);
  const [selectedFiberRange, setSelectedFiberRange] = useState([]);
  const [brandSearch, setBrandSearch] = useState('');

  const goHome = () => router.push('/');
  const goFood = (id) => router.push(`/food/${id}`);

  /* fetch all products once */
  useEffect(() => {
    async function load() {
      let all = [];
      let offset = 0;
      const batch = 1000;
      while (true) {
        const { data } = await supabase
          .from('dog_foods_v2')
          .select('id, name, brand, flavor, protein_dmb, fat_dmb, carbs_dmb, fiber_dmb, primary_protein, image_url')
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
  }, [allFoods, selectedBrands, selectedProteins, selectedProteinRange, selectedCarbRange, selectedFatRange, selectedFiberRange]);

  const activeFilterCount = [selectedBrands, selectedProteins, selectedProteinRange, selectedCarbRange, selectedFatRange, selectedFiberRange]
    .filter(a => a.length > 0).length;

  function clearAll() {
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

  /* ── filter panel content (shared between desktop sidebar and mobile panel) ── */
  const filterContent = (
    <>
      {activeFilterCount > 0 && (
        <button onClick={clearAll} style={{
          width: '100%', padding: '10px 16px', borderRadius: 12,
          border: '1px solid #e8e0d4', background: '#fff', color: '#8a7e72',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Clear all filters ({activeFilterCount})
        </button>
      )}

      <FilterSection title="Protein Type">
        {PROTEIN_TYPES.map(pt => (
          <CheckOption key={pt} label={pt} count={proteinCounts[pt] || 0}
            checked={selectedProteins.includes(pt)}
            onChange={() => toggleProtein(pt)} />
        ))}
      </FilterSection>

      <FilterSection title="Brand">
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

      <FilterSection title="Protein %" defaultOpen={false}>
        {PROTEIN_RANGES.map(r => (
          <CheckOption key={r.label} label={r.label}
            checked={selectedProteinRange.some(s => s.label === r.label)}
            onChange={() => toggleRange(r, selectedProteinRange, setSelectedProteinRange)} />
        ))}
      </FilterSection>

      <FilterSection title="Carbohydrates %" defaultOpen={false}>
        {CARB_RANGES.map(r => (
          <CheckOption key={r.label} label={r.label}
            checked={selectedCarbRange.some(s => s.label === r.label)}
            onChange={() => toggleRange(r, selectedCarbRange, setSelectedCarbRange)} />
        ))}
      </FilterSection>

      <FilterSection title="Fat %" defaultOpen={false}>
        {FAT_RANGES.map(r => (
          <CheckOption key={r.label} label={r.label}
            checked={selectedFatRange.some(s => s.label === r.label)}
            onChange={() => toggleRange(r, selectedFatRange, setSelectedFatRange)} />
        ))}
      </FilterSection>

      <FilterSection title="Fiber %" defaultOpen={false}>
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
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3vw, 40px)',
            fontWeight: 800, color: '#1a1612', letterSpacing: -1, marginBottom: 4,
          }}>Discover Foods</h1>
          <p style={{ fontSize: 15, color: '#8a7e72' }}>
            {loading ? 'Loading...' : `${filtered.length} of ${allFoods.length} products`}
            {activeFilterCount > 0 && ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`}
          </p>
        </div>

        {/* mobile filter toggle */}
        <div className="mobile-filter-toggle" style={{ display: 'none', marginBottom: 16 }}>
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
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px 32px', borderRadius: 24, border: '2px dashed #e8e0d4', textAlign: 'center', color: '#b5aa99' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>No products match your filters</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>Try removing some filters</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {filtered.map((f) => (
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
