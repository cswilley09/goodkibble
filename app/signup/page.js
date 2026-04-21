'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const BREEDS = [
  'Affenpinscher', 'Afghan Hound', 'Airedale Terrier', 'Akita', 'Alaskan Malamute',
  'American Bulldog', 'American English Coonhound', 'American Eskimo Dog', 'American Foxhound',
  'American Pit Bull Terrier', 'American Staffordshire Terrier', 'Anatolian Shepherd',
  'Australian Cattle Dog', 'Australian Shepherd', 'Australian Terrier', 'Basenji',
  'Basset Hound', 'Beagle', 'Bearded Collie', 'Beauce Shepherd', 'Belgian Malinois',
  'Belgian Sheepdog', 'Belgian Tervuren', 'Bernedoodle', 'Bernese Mountain Dog', 'Bichon Frise',
  'Black and Tan Coonhound', 'Black Russian Terrier', 'Bloodhound', 'Blue Heeler', 'Blue Lacy',
  'Bluetick Coonhound', 'Boerboel', 'Bolognese', 'Border Collie', 'Border Terrier', 'Borzoi',
  'Boston Terrier', 'Bouvier des Flandres', 'Boxer', 'Boykin Spaniel', 'Briard', 'Brittany',
  'Brussels Griffon', 'Bull Terrier', 'Bulldog', 'Bullmastiff', 'Cairn Terrier', 'Cane Corso',
  'Cardigan Welsh Corgi', 'Cavalier King Charles Spaniel', 'Cavapoo', 'Chesapeake Bay Retriever',
  'Chihuahua', 'Chinese Crested', 'Chinese Shar-Pei', 'Chinook', 'Chow Chow', 'Clumber Spaniel',
  'Cockapoo', 'Cocker Spaniel', 'Collie', 'Corgi', 'Coton de Tulear', 'Dachshund', 'Dalmatian',
  'Dandie Dinmont Terrier', 'Doberman Pinscher', 'Dogo Argentino', 'Dogue de Bordeaux',
  'Dutch Shepherd', 'English Bulldog', 'English Cocker Spaniel', 'English Foxhound',
  'English Setter', 'English Springer Spaniel', 'English Toy Spaniel', 'Entlebucher Mountain Dog',
  'Field Spaniel', 'Finnish Lapphund', 'Finnish Spitz', 'Flat-Coated Retriever', 'Fox Terrier',
  'French Bulldog', 'German Pinscher', 'German Shepherd', 'German Shorthaired Pointer',
  'German Wirehaired Pointer', 'Giant Schnauzer', 'Glen of Imaal Terrier', 'Goldador',
  'Golden Retriever', 'Goldendoodle', 'Gordon Setter', 'Great Dane', 'Great Pyrenees',
  'Greater Swiss Mountain Dog', 'Greyhound', 'Harrier', 'Havanese', 'Hovawart', 'Ibizan Hound',
  'Icelandic Sheepdog', 'Irish Red and White Setter', 'Irish Setter', 'Irish Terrier',
  'Irish Water Spaniel', 'Irish Wolfhound', 'Italian Greyhound', 'Jack Russell Terrier',
  'Japanese Chin', 'Japanese Spitz', 'Keeshond', 'Kerry Blue Terrier', 'King Charles Spaniel',
  'Komondor', 'Kuvasz', 'Labradoodle', 'Labrador Retriever', 'Lagotto Romagnolo',
  'Lakeland Terrier', 'Lancashire Heeler', 'Leonberger', 'Lhasa Apso', 'Lowchen', 'Maltese',
  'Maltipoo', 'Manchester Terrier', 'Maremma Sheepdog', 'Mastiff', 'Miniature American Shepherd',
  'Miniature Bull Terrier', 'Miniature Pinscher', 'Miniature Poodle', 'Miniature Schnauzer',
  'Morkie', 'Mudi', 'Neapolitan Mastiff', 'Newfoundland', 'Norfolk Terrier', 'Norwegian Buhund',
  'Norwegian Elkhound', 'Norwegian Lundehund', 'Norwich Terrier',
  'Nova Scotia Duck Tolling Retriever', 'Old English Sheepdog', 'Otterhound', 'Papillon',
  'Peekapoo', 'Pekingese', 'Pembroke Welsh Corgi', 'Petit Basset Griffon Vendeen',
  'Pharaoh Hound', 'Plott Hound', 'Pointer', 'Polish Lowland Sheepdog', 'Pomeranian', 'Pomsky',
  'Poodle', 'Portuguese Water Dog', 'Pug', 'Puggle', 'Puli', 'Pumi', 'Pyrenean Shepherd',
  'Rat Terrier', 'Redbone Coonhound', 'Rhodesian Ridgeback', 'Rottweiler', 'Russell Terrier',
  'Saint Bernard', 'Saluki', 'Samoyed', 'Schipperke', 'Schnauzer', 'Schnoodle',
  'Scottish Deerhound', 'Scottish Terrier', 'Sealyham Terrier', 'Shetland Sheepdog', 'Shiba Inu',
  'Shih Tzu', 'Shih-Poo', 'Siberian Husky', 'Silky Terrier', 'Skye Terrier', 'Sloughi',
  'Soft Coated Wheaten Terrier', 'Spanish Water Dog', 'Spinone Italiano',
  'Staffordshire Bull Terrier', 'Standard Poodle', 'Standard Schnauzer', 'Sussex Spaniel',
  'Swedish Vallhund', 'Tibetan Mastiff', 'Tibetan Spaniel', 'Tibetan Terrier', 'Toy Fox Terrier',
  'Toy Poodle', 'Treeing Walker Coonhound', 'Vizsla', 'Weimaraner', 'Welsh Springer Spaniel',
  'Welsh Terrier', 'West Highland White Terrier', 'Whippet', 'Wirehaired Pointing Griffon',
  'Xoloitzcuintli', 'Yorkipoo', 'Yorkshire Terrier', 'Mixed Breed', 'Other',
];

const PRIORITIES = [
  { label: 'High-quality ingredients', emoji: '\u{1F969}' },
  { label: 'High protein content', emoji: '\u{1F4AA}' },
  { label: 'No artificial additives', emoji: '\u{1F6AB}' },
  { label: 'Grain-free options', emoji: '\u{1F33E}' },
  { label: 'Budget-friendly', emoji: '\u{1F4B0}' },
  { label: 'Weight management', emoji: '\u{2696}\u{FE0F}' },
  { label: 'Sensitive stomach', emoji: '\u{1F922}' },
  { label: 'Skin & coat health', emoji: '\u{2728}' },
  { label: 'Joint support', emoji: '\u{1F9B4}' },
  { label: 'Puppy nutrition', emoji: '\u{1F436}' },
];

const HEARD_FROM = [
  'Google search', 'A friend', 'Social media', 'My vet',
  'TikTok', 'Instagram', 'Reddit', 'Other',
];

const EMPTY_DOG = { name: '', gender: '', age: '', ageUnit: 'years', neutered: '', weight: '', breed: '', food: null, foodAlt: '', foodAltText: '' };

/* ── Shared dropdown styles ── */
const dropdownPanelStyle = {
  position: 'absolute', top: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)',
  background: '#fff', borderRadius: 12, border: '1px solid #ede8df',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: 4, maxHeight: 240,
  overflowY: 'auto', zIndex: 9999, minWidth: 140,
};
const dropdownOptionStyle = (sel) => ({
  padding: '10px 16px', fontSize: 15, fontWeight: sel ? 600 : 500,
  color: sel ? '#2F6B48' : '#1a1612', background: sel ? '#f7efd8' : 'transparent',
  borderRadius: 8, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
  transition: 'background 0.15s', whiteSpace: 'nowrap',
});
const sentenceFontStyle = {
  fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(20px, 3.5vw, 28px)',
  fontWeight: 700, color: '#1a1612', lineHeight: 2.2,
};

/* ── Auto-expanding input ── */
function AutoInput({ value, onChange, placeholder, type = 'text', min, minW = 60, maxW, className, style: extra }) {
  const spanRef = useRef(null);
  const [w, setW] = useState(minW);
  useEffect(() => {
    if (spanRef.current) {
      const sw = spanRef.current.offsetWidth + 20;
      setW(Math.max(minW, Math.min(sw, maxW || 9999)));
    }
  }, [value, minW, maxW]);
  const base = {
    border: 'none', borderBottom: '2.5px dotted #2F6B48', background: 'transparent',
    color: '#2F6B48', fontWeight: 700, fontFamily: "'Instrument Serif', serif",
    fontSize: 'inherit', textAlign: 'center', outline: 'none', padding: '2px 4px',
    width: w, minWidth: minW, ...extra,
  };
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span ref={spanRef} style={{
        position: 'absolute', visibility: 'hidden', whiteSpace: 'pre', pointerEvents: 'none',
        fontWeight: 700, fontFamily: "'Instrument Serif', serif", fontSize: 'inherit', ...extra,
      }}>{value || placeholder || ''}</span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        min={min} className={className} style={base} />
    </span>
  );
}

/* ── Custom Dropdown ── */
function InlineDropdown({ value, onChange, options, width, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const selectedLabel = (() => {
    if (!value) return placeholder || '---';
    const opt = options.find(o => (typeof o === 'string' ? o : o.value) === value);
    return opt ? (typeof opt === 'string' ? opt : opt.label) : value;
  })();
  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <span onClick={() => setOpen(!open)} style={{
        border: 'none', borderBottom: '2.5px dotted #2F6B48', background: 'transparent',
        color: '#2F6B48', fontWeight: 700, fontFamily: "'Instrument Serif', serif",
        fontSize: 'inherit', textAlign: 'center', cursor: 'pointer',
        padding: '2px 20px 2px 4px', display: 'inline-block', position: 'relative', minWidth: width || 60,
      }}>
        {selectedLabel}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{
          position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)',
        }}><path d="M1 1l4 4 4-4" stroke="#2F6B48" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </span>
      {open && (
        <div style={dropdownPanelStyle}>
          {options.map(opt => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const label = typeof opt === 'string' ? opt : opt.label;
            const isSel = val === value;
            return (
              <div key={val} onMouseDown={(e) => { e.preventDefault(); onChange(val); setOpen(false); }}
                style={dropdownOptionStyle(isSel)}
                onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = '#f5f2ec'; }}
                onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
              >{label}</div>
            );
          })}
        </div>
      )}
    </span>
  );
}

/* ── Breed Autocomplete ── */
function BreedAutocomplete({ value, onChange, style: extra }) {
  const [text, setText] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const ref = useRef(null);
  const spanRef = useRef(null);
  const [w, setW] = useState(160);
  useEffect(() => { setText(value || ''); }, [value]);
  useEffect(() => {
    if (spanRef.current) setW(Math.max(160, Math.min(spanRef.current.offsetWidth + 24, 340)));
  }, [text]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setShowAll(false); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const query = text.trim().toLowerCase();
  const allMatches = query ? BREEDS.filter(b => b.toLowerCase().includes(query)) : [];
  const displayMatches = showAll ? allMatches : allMatches.slice(0, 6);
  function highlight(b) {
    const idx = b.toLowerCase().indexOf(query);
    if (idx === -1 || !query) return b;
    return <>{b.slice(0, idx)}<span style={{ color: '#2F6B48', fontWeight: 700 }}>{b.slice(idx, idx + query.length)}</span>{b.slice(idx + query.length)}</>;
  }
  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <span ref={spanRef} style={{
        position: 'absolute', visibility: 'hidden', whiteSpace: 'pre', pointerEvents: 'none',
        fontWeight: 700, fontFamily: "'Instrument Serif', serif", fontSize: 'inherit', ...extra,
      }}>{text || 'start typing...'}</span>
      <input type="text" value={text} placeholder="start typing..."
        onChange={(e) => { setText(e.target.value); onChange(''); setOpen(true); setShowAll(false); }}
        onFocus={() => { if (query && allMatches.length > 0) setOpen(true); }}
        style={{
          border: 'none', borderBottom: '2.5px dotted #2F6B48', background: 'transparent',
          color: '#2F6B48', fontWeight: 700, fontFamily: "'Instrument Serif', serif",
          fontSize: 'inherit', textAlign: 'center', outline: 'none', padding: '2px 4px',
          width: w, minWidth: 120, ...extra,
        }}
      />
      {open && query && (
        <div style={{ ...dropdownPanelStyle, minWidth: 240 }}>
          {displayMatches.length === 0 ? (
            <div style={{ padding: '10px 16px', fontSize: 14, color: '#8a7e72', fontFamily: "'Inter', sans-serif" }}>No breeds found</div>
          ) : (<>
            {displayMatches.map(b => {
              const isSel = b === value;
              return (
                <div key={b} onMouseDown={(e) => { e.preventDefault(); setText(b); onChange(b); setOpen(false); setShowAll(false); }}
                  style={dropdownOptionStyle(isSel)}
                  onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = '#f5f2ec'; }}
                  onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                >{highlight(b)}</div>
              );
            })}
            {!showAll && allMatches.length > 6 && (
              <div onMouseDown={(e) => { e.preventDefault(); setShowAll(true); }}
                style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#2F6B48', cursor: 'pointer', textAlign: 'center', borderTop: '1px solid #f0ebe3', fontFamily: "'Inter', sans-serif" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f2ec')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >Show all {allMatches.length} results</div>
            )}
          </>)}
        </div>
      )}
    </span>
  );
}

function DogIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="50" rx="18" ry="4" fill="#ede8df" />
      <path d="M18 28c-3-8-1-16 2-18s6 2 8 6" stroke="#2F6B48" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M46 28c3-8 1-16-2-18s-6 2-8 6" stroke="#2F6B48" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="32" cy="34" rx="14" ry="12" stroke="#2F6B48" strokeWidth="2.5" fill="none" />
      <circle cx="27" cy="31" r="2" fill="#2F6B48" /><circle cx="37" cy="31" r="2" fill="#2F6B48" />
      <ellipse cx="32" cy="36" rx="3" ry="2" fill="#2F6B48" />
      <path d="M29 40c1.5 2 4.5 2 6 0" stroke="#2F6B48" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M22 44c0 4 4 6 10 6s10-2 10-6" stroke="#2F6B48" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function ProgressDots({ step, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, padding: '24px 0 8px' }}>
      {Array.from({ length: total }).map((_, i) => {
        const completed = i < step;
        const current = i === step;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: current ? 14 : 10, height: current ? 14 : 10, borderRadius: '50%',
              background: completed || current ? '#2F6B48' : '#ede8df',
              border: current ? '3px solid rgba(201,168,76,0.3)' : 'none',
              transition: 'all 0.3s ease',
            }} />
            {i < total - 1 && (
              <div style={{ width: Math.max(12, Math.min(32, 200 / total)), height: 2,
                background: completed ? '#2F6B48' : '#ede8df', transition: 'background 0.3s ease' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FoodSearch({ onSelect, selectedFood }) {
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
        const res = await fetch('/api/foods/search?q=' + encodeURIComponent(val) + '&limit=20');
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        setResults((Array.isArray(data) ? data : []).slice(0, 20));
        setOpen(true);
      } catch { setResults([]); }
      setLoading(false);
    }, 250);
  }
  function formatName(food) {
    const n = food.name || '', b = food.brand || '';
    if (n.toUpperCase().startsWith(b.toUpperCase())) return { brand: b, product: n.slice(b.length).trim() };
    return { brand: b, product: n };
  }
  function handleSelect(food) {
    const { brand, product } = formatName(food);
    onSelect({ name: product ? `${brand} \u2014 ${product}` : brand, slug: food.slug, brand_slug: food.brand_slug });
    setText(''); setResults([]); setOpen(false);
  }
  if (selectedFood) {
    return (
      <div style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
        <div style={{ background: '#f7efd8', border: '1.5px solid #2F6B48', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <span style={{ color: '#2d7a4f', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{'\u2713'}</span>
            <span style={{ fontSize: 14, color: '#1a1612', fontFamily: "'Inter', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFood.name}</span>
          </div>
          <button onClick={() => { onSelect(null); setText(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a7e72', fontSize: 16, padding: '0 0 0 8px', flexShrink: 0 }}>&times;</button>
        </div>
      </div>
    );
  }
  return (
    <div ref={boxRef} data-food-search style={{ position: 'relative', width: '100%', maxWidth: 500, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 16, padding: '6px 6px 6px 20px', boxShadow: '0 4px 24px rgba(26,22,18,0.08)', border: '1.5px solid #ede8df' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b5aa99" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
        <input type="text" placeholder="Search for your dog's current food..." value={text} onChange={handleChange}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          style={{ flex: 1, border: 'none', outline: 'none', minWidth: 0, fontSize: 15, padding: '12px 10px', background: 'transparent', color: '#1a1612', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
        />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 12px 48px rgba(26,22,18,0.15)', zIndex: 9999, maxHeight: 400, overflowY: 'auto' }}>
          {loading && results.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#8a7e72', fontSize: 14 }}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#8a7e72', fontSize: 14 }}>No results found.</div>
          ) : results.map((f) => (
            <div key={f.id} onMouseDown={(e) => { e.preventDefault(); handleSelect(f); }}
              style={{ padding: '12px 18px', cursor: 'pointer', borderBottom: '1px solid #f0ebe3', display: 'flex', alignItems: 'center', gap: 10 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#faf8f5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {f.image_url ? (
                <img src={f.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', background: '#f5f0e8', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{'\u{1F415}'}</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.brand}</div>
                <div style={{ fontSize: 12, color: '#8a7e72', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN SIGNUP PAGE
   ══════════════════════════════════════════════════ */
export default function SignupPage() {
  const router = useRouter();
  // Restore saved state if user is returning (e.g. back from Stripe)
  const [savedState] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('gk_signup');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const init = (key, fallback) => savedState?.[key] ?? fallback;

  const [step, setStep] = useState(() => init('step', 0));
  const [animating, setAnimating] = useState(false);
  const [fadeState, setFadeState] = useState('in');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 2 — dog count + names
  const [dogCount, setDogCount] = useState(() => init('dogCount', ''));
  const [dogNames, setDogNames] = useState(() => init('dogNames', ['']));

  // Per-dog profiles (array of objects)
  const [dogs, setDogs] = useState(() => init('dogs', [{ ...EMPTY_DOG }]));

  // Which dog we're profiling / feeding (index)
  const [profileIdx, setProfileIdx] = useState(0);
  const [foodIdx, setFoodIdx] = useState(0);

  // Step 5 — priorities
  const [priorities, setPriorities] = useState(() => init('priorities', []));

  // Step 6 — account
  const [firstName, setFirstName] = useState(() => init('firstName', ''));
  const [email, setEmail] = useState(() => init('email', ''));
  const [zipCode, setZipCode] = useState(() => init('zipCode', ''));
  const [heardFrom, setHeardFrom] = useState(() => init('heardFrom', ''));
  const [emailError, setEmailError] = useState('');
  const [billing, setBilling] = useState(() => init('billing', 'yearly'));

  function isValidEmail(e) {
    const a = e.indexOf('@');
    if (a < 1) return false;
    const after = e.slice(a + 1);
    return after.includes('.') && after.indexOf('.') < after.length - 1;
  }

  const numDogs = Math.min(Math.max(parseInt(dogCount) || 0, 0), 5);

  // Sync dogNames/dogs arrays when count changes
  useEffect(() => {
    if (numDogs < 1) return;
    setDogNames(prev => {
      const a = [...prev];
      while (a.length < numDogs) a.push('');
      return a.slice(0, numDogs);
    });
    setDogs(prev => {
      const a = [...prev];
      while (a.length < numDogs) a.push({ ...EMPTY_DOG });
      return a.slice(0, numDogs);
    });
  }, [numDogs]);

  // Update dog helper
  function updateDog(idx, field, val) {
    setDogs(prev => {
      const a = [...prev];
      a[idx] = { ...a[idx], [field]: val };
      return a;
    });
  }

  /*
    Step layout (dynamic):
    0: Welcome
    1: My Dogs (count + names)
    2 .. 2+N-1: Dog Profile for dog 0..N-1
    2+N .. 2+2N-1: Current Food for dog 0..N-1
    2+2N: Priorities
    2+2N+1: Account
    2+2N+2: Confirmation
  */
  const N = Math.max(numDogs, 1);
  const STEP_PROFILE_START = 2;
  const STEP_FOOD_START = 2 + N;
  const STEP_PRIORITIES = 2 + 2 * N;
  const STEP_ACCOUNT = STEP_PRIORITIES + 1;
  const STEP_PLAN = STEP_ACCOUNT + 1;
  const STEP_CONFIRM = STEP_PLAN + 1;
  const TOTAL_STEPS = STEP_PLAN; // plan is last counted step, confirm is the post-submit screen

  // Map step to type
  function stepType(s) {
    if (s === 0) return 'welcome';
    if (s === 1) return 'dogs';
    if (s >= STEP_PROFILE_START && s < STEP_FOOD_START) return 'profile';
    if (s >= STEP_FOOD_START && s < STEP_PRIORITIES) return 'food';
    if (s === STEP_PRIORITIES) return 'priorities';
    if (s === STEP_ACCOUNT) return 'account';
    if (s === STEP_PLAN) return 'plan';
    return 'confirm';
  }

  function dogIdxForStep(s) {
    const t = stepType(s);
    if (t === 'profile') return s - STEP_PROFILE_START;
    if (t === 'food') return s - STEP_FOOD_START;
    return 0;
  }

  const curType = stepType(step);
  const curDogIdx = dogIdxForStep(step);
  const curDog = dogs[curDogIdx] || dogs[0];
  const curDogName = dogNames[curDogIdx] || 'your dog';
  const pronounHe = curDog.gender === 'male' ? 'He' : curDog.gender === 'female' ? 'She' : 'They';

  function canContinue() {
    switch (curType) {
      case 'welcome': return true;
      case 'dogs': return numDogs > 0 && dogNames.slice(0, numDogs).every(n => n.trim());
      case 'profile': return curDog.gender && curDog.age && parseInt(curDog.age) > 0 && curDog.weight && parseInt(curDog.weight) > 0 && curDog.breed;
      case 'food': return curDog.food || curDog.foodAlt === 'not_sure' || ((curDog.foodAlt === 'no_kibble' || curDog.foodAlt === 'cant_find') && curDog.foodAltText.trim());
      case 'priorities': return priorities.length > 0;
      case 'account': return firstName.trim() && email.trim() && isValidEmail(email.trim()) && zipCode.trim();
      default: return true;
    }
  }

  const goTo = useCallback((nextStep) => {
    if (animating) return;
    setAnimating(true);
    setFadeState('out');
    setTimeout(() => {
      setStep(nextStep);
      setFadeState('in');
      setTimeout(() => setAnimating(false), 400);
    }, 250);
  }, [animating]);

  // Persist form state to sessionStorage so the back button from Stripe restores progress
  useEffect(() => {
    if (stepType(step) === 'plan') {
      try {
        sessionStorage.setItem('gk_signup', JSON.stringify({
          step, dogCount, dogNames, dogs, priorities,
          firstName, email, zipCode, heardFrom, billing,
        }));
      } catch {}
    } else if (stepType(step) === 'confirm') {
      // Done — clear saved state
      try { sessionStorage.removeItem('gk_signup'); } catch {}
    }
  }, [step, dogCount, dogNames, dogs, priorities, firstName, email, zipCode, heardFrom, billing]);

  function handleNext() {
    if (curType === 'account' && email.trim() && !isValidEmail(email.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError('');
    if (!canContinue()) return;
    if (curType === 'account') {
      handleSubmit();
    } else {
      goTo(step + 1);
    }
  }

  function handleBack() {
    if (step > 0) goTo(step - 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      // 1. Save profile data first (no auth user ID — will be linked when they click magic link)
      const dogsPayload = dogs.slice(0, numDogs).map((d, i) => ({
        dog_name: dogNames[i].trim(),
        breed: d.breed,
        age_value: parseInt(d.age),
        age_unit: d.ageUnit,
        weight_lbs: parseInt(d.weight),
        gender: d.gender,
        is_neutered: d.neutered === 'is',
        current_food: d.food ? d.food.name : (d.foodAltText.trim() ? `${d.foodAlt}: ${d.foodAltText.trim()}` : d.foodAlt),
        current_food_slug: d.food ? `${d.food.brand_slug}/${d.food.slug}` : null,
        priorities,
      }));
      const payload = {
        first_name: firstName.trim(),
        email: email.trim(),
        zip_code: zipCode.trim(),
        heard_from: heardFrom || null,
        dogs: dogsPayload,
      };
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error?.includes('already exists')) {
          setError('already_registered');
          setSubmitting(false);
          return;
        }
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      // 2. Send magic link after profile is saved
      await getSupabase().auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin + '/profile' },
      });

      goTo(STEP_PLAN);
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  async function resendEmail() {
    await getSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + '/profile' },
    });
  }

  // Enter key advances to next step
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Enter' && !e.shiftKey && step < STEP_PLAN) {
        // Don't intercept Enter inside the food search input
        const tag = e.target.tagName;
        if (tag === 'INPUT' && e.target.closest('[data-food-search]')) return;
        e.preventDefault();
        handleNext();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  function togglePriority(label) {
    setPriorities(prev => prev.includes(label) ? prev.filter(p => p !== label) : [...prev, label]);
  }

  // "Same food" shortcut for multi-dog
  function copyFoodFromFirst(idx) {
    const first = dogs[0];
    setDogs(prev => {
      const a = [...prev];
      a[idx] = { ...a[idx], food: first.food, foodAlt: first.foodAlt, foodAltText: first.foodAltText };
      return a;
    });
  }

  const fadeStyle = {
    opacity: fadeState === 'in' ? 1 : 0,
    transform: fadeState === 'in' ? 'translateY(0)' : 'translateY(-12px)',
    transition: fadeState === 'in' ? 'opacity 0.4s ease, transform 0.4s ease' : 'opacity 0.25s ease, transform 0.25s ease',
  };

  const allDogNames = dogNames.slice(0, numDogs).filter(n => n.trim());
  const firstDogName = dogNames[0]?.trim() || 'your dog';

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid #ede8df',
        background: '#faf8f4', position: 'sticky', top: 0, zIndex: 40,
      }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 800, color: '#1a1612', letterSpacing: -0.5 }}>GoodKibble</span>
        </a>
        {step < STEP_PLAN && (
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#8a7e72', letterSpacing: 1, textTransform: 'uppercase' }}>
            Step {step + 1} of {TOTAL_STEPS}
          </span>
        )}
      </nav>

      {step < STEP_PLAN && <ProgressDots step={step} total={TOTAL_STEPS} />}

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px 80px', ...fadeStyle }}>

        {/* ── WELCOME ── */}
        {curType === 'welcome' && (
          <div style={{ textAlign: 'center' }}>
            <DogIcon />
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, color: '#1a1612', margin: '20px 0 16px', letterSpacing: -1, lineHeight: 1.15 }}>
              Let&rsquo;s find the best food for your dog
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: '#8a7e72', lineHeight: 1.6, maxWidth: 440, margin: '0 auto 12px' }}>
              Tell us about your pup and we&rsquo;ll show you how their current food stacks up &mdash; plus smarter alternatives.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#b5aa99' }}>Takes about 2 minutes.</p>
            <button onClick={() => goTo(1)} style={{ marginTop: 32, padding: '14px 48px', borderRadius: 100, background: '#1a1612', color: '#faf8f4', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              Get Started &rarr;
            </button>
            <p style={{ marginTop: 32, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#8a7e72' }}>
              Already have an account?{' '}
              <a href="/login" style={{ color: '#2F6B48', fontWeight: 600, textDecoration: 'none' }}>Sign in &rarr;</a>
            </p>
          </div>
        )}

        {/* ── MY DOGS ── */}
        {curType === 'dogs' && (
          <div style={{ textAlign: 'center' }}>
            <DogIcon />
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 700, color: '#1a1612', lineHeight: 1.8, marginTop: 24 }}>
              I have{' '}
              <AutoInput value={dogCount} onChange={e => {
                const v = e.target.value.replace(/\D/g, '');
                if (v === '' || (parseInt(v) >= 0 && parseInt(v) <= 9)) setDogCount(v);
              }} placeholder="#" minW={50} style={{ fontSize: 'clamp(24px, 4vw, 32px)' }} />
              {' '}{dogCount === '1' ? 'dog' : 'dogs'}
              {numDogs > 0 && numDogs <= 5 && (
                <>{' '}named{' '}
                  {dogNames.slice(0, numDogs).map((name, i) => (
                    <span key={i}>
                      {i > 0 && i < numDogs - 1 && ', '}
                      {i > 0 && i === numDogs - 1 && (numDogs === 2 ? ' and ' : ', and ')}
                      <AutoInput
                        value={name}
                        onChange={e => {
                          const a = [...dogNames];
                          a[i] = e.target.value;
                          setDogNames(a);
                        }}
                        placeholder={`name ${numDogs > 1 ? i + 1 : ''}`}
                        minW={100}
                        maxW={220}
                        style={{ fontSize: 'clamp(24px, 4vw, 32px)' }}
                      />
                    </span>
                  ))}
                </>
              )}
            </div>
            {parseInt(dogCount) > 5 && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#b5aa99', marginTop: 12 }}>
                We support up to 5 dog profiles right now.
              </p>
            )}
          </div>
        )}

        {/* ── DOG PROFILE ── */}
        {curType === 'profile' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, color: '#2F6B48', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
              {numDogs > 1 ? `Dog ${curDogIdx + 1} of ${numDogs}: ${curDogName}` : `Tell us about ${curDogName}`}
            </div>
            {numDogs > 1 && curDogIdx === 0 && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8a7e72', marginBottom: 28 }}>
                Let&rsquo;s learn about {curDogName} first.{numDogs > 1 && ` You\u2019ll do ${dogNames.slice(1, numDogs).filter(n=>n.trim()).join(', ') || 'the others'} next.`}
              </p>
            )}
            {(numDogs === 1 || curDogIdx > 0) && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8a7e72', marginBottom: 28 }}>
                This helps us personalize food recommendations.
              </p>
            )}

            <div style={sentenceFontStyle}>
              <InlineDropdown value={curDog.gender} onChange={v => updateDog(curDogIdx, 'gender', v)}
                options={[{ value: 'male', label: 'He' }, { value: 'female', label: 'She' }]} width={60} placeholder="---" />
              {' '}is{' '}
              <AutoInput value={curDog.age} onChange={e => updateDog(curDogIdx, 'age', e.target.value.replace(/\D/g, ''))}
                placeholder="age" minW={50} style={{ fontSize: 'clamp(20px, 3.5vw, 28px)' }} />
              {' '}
              <InlineDropdown value={curDog.ageUnit} onChange={v => updateDog(curDogIdx, 'ageUnit', v)}
                options={['years', 'months']} width={90} />
              {' '}old.
            </div>

            <div style={{ ...sentenceFontStyle, marginTop: 8 }}>
              {pronounHe}{' '}
              <InlineDropdown value={curDog.neutered} onChange={v => updateDog(curDogIdx, 'neutered', v)}
                options={[{ value: 'is', label: 'is' }, { value: 'is not', label: 'is not' }]} width={70} placeholder="---" />
              {' '}neutered and weighs{' '}
              <AutoInput value={curDog.weight} onChange={e => updateDog(curDogIdx, 'weight', e.target.value.replace(/\D/g, ''))}
                placeholder="lbs" minW={55} style={{ fontSize: 'clamp(20px, 3.5vw, 28px)' }} />
              {' '}lbs.
            </div>

            <div style={{ ...sentenceFontStyle, marginTop: 8 }}>
              Breed:{' '}
              <BreedAutocomplete value={curDog.breed} onChange={v => updateDog(curDogIdx, 'breed', v)}
                style={{ fontSize: 'clamp(20px, 3.5vw, 28px)' }} />
            </div>
          </div>
        )}

        {/* ── CURRENT FOOD ── */}
        {curType === 'food' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, color: '#2F6B48', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
              {numDogs > 1 ? `${curDogName}\u2019s current food (${curDogIdx + 1} of ${numDogs})` : `${curDogName}\u2019s current food`}
            </div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, color: '#1a1612', margin: '8px 0 28px', letterSpacing: -0.5 }}>
              Right now I feed {curDogName}
            </h2>

            {/* Same-food shortcut for dog 2+ */}
            {curDogIdx > 0 && dogs[0].food && !curDog.food && !curDog.foodAlt && (
              <div style={{ marginBottom: 20 }}>
                <button onClick={() => { copyFoodFromFirst(curDogIdx); }} style={{
                  padding: '10px 20px', borderRadius: 100, border: '1.5px solid #2F6B48',
                  background: '#f7efd8', color: '#1a1612', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                }}>
                  {curDogName} eats the same food as {dogNames[0]?.trim() || 'Dog 1'}
                </button>
              </div>
            )}

            <FoodSearch
              onSelect={(food) => { updateDog(curDogIdx, 'food', food); if (food) { updateDog(curDogIdx, 'foodAlt', ''); updateDog(curDogIdx, 'foodAltText', ''); } }}
              selectedFood={curDog.food}
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 24 }}>
              {[
                { key: 'not_sure', label: "I'm not sure" },
                { key: 'no_kibble', label: "I don't feed kibble" },
                { key: 'cant_find', label: "Can't find my food" },
              ].map(opt => {
                const selected = curDog.foodAlt === opt.key;
                return (
                  <button key={opt.key} onClick={() => {
                    const newVal = selected ? '' : opt.key;
                    updateDog(curDogIdx, 'foodAlt', newVal);
                    if (!selected) { updateDog(curDogIdx, 'food', null); updateDog(curDogIdx, 'foodAltText', ''); }
                  }} style={{
                    padding: '10px 20px', borderRadius: 100,
                    border: selected ? '2px solid #2F6B48' : '1.5px solid #ede8df',
                    background: selected ? '#f7efd8' : '#fff',
                    color: '#1a1612', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s ease',
                  }}>{opt.label}</button>
                );
              })}
            </div>

            {(curDog.foodAlt === 'no_kibble' || curDog.foodAlt === 'cant_find') && (
              <div style={{ maxWidth: 500, margin: '16px auto 0' }}>
                <input type="text" value={curDog.foodAltText}
                  onChange={e => updateDog(curDogIdx, 'foodAltText', e.target.value)}
                  placeholder={curDog.foodAlt === 'no_kibble' ? 'What do you feed? (e.g., raw diet, homemade, fresh food...)' : "Type your dog's food brand and product name"}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #ede8df', fontSize: 15, fontFamily: "'Inter', sans-serif", background: '#fff', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => (e.target.style.borderColor = '#2F6B48')}
                  onBlur={e => (e.target.style.borderColor = '#ede8df')}
                />
              </div>
            )}
          </div>
        )}

        {/* ── PRIORITIES ── */}
        {curType === 'priorities' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, color: '#2F6B48', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>What matters to you</div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, color: '#1a1612', margin: '8px 0 8px', letterSpacing: -0.5 }}>
              When it comes to {numDogs > 1 ? 'your dogs\u2019' : `${firstDogName}\u2019s`} food, I care most about...
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8a7e72', marginBottom: 24 }}>Select all that apply.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, maxWidth: 500, margin: '0 auto' }}>
              {PRIORITIES.map(p => {
                const selected = priorities.includes(p.label);
                return (
                  <button key={p.label} onClick={() => togglePriority(p.label)} style={{
                    padding: '12px 16px', borderRadius: 14,
                    border: selected ? '2px solid #2F6B48' : '1.5px solid #ede8df',
                    background: selected ? '#f7efd8' : '#fff',
                    color: '#1a1612', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s ease', textAlign: 'left',
                  }}><span style={{ fontSize: 18 }}>{p.emoji}</span>{p.label}</button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ACCOUNT ── */}
        {curType === 'account' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, color: '#2F6B48', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Almost done</div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, color: '#1a1612', margin: '8px 0 8px', letterSpacing: -0.5 }}>
              Save {numDogs > 1 ? 'your dogs\u2019 profiles' : `${firstDogName}\u2019s profile`}
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8a7e72', marginBottom: 28 }}>
              We&rsquo;ll use this to personalize your recommendations and keep you updated on food scores.
            </p>

            <div style={sentenceFontStyle}>
              My first name is{' '}
              <AutoInput value={firstName} onChange={e => setFirstName(e.target.value)}
                placeholder="first name" minW={120} style={{ fontSize: 'clamp(20px, 3.5vw, 28px)' }} />
            </div>

            <div className="account-field-row" style={{ ...sentenceFontStyle, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ flexShrink: 0 }}>My email is</span>
              <span style={{ flex: 1, minWidth: 0, display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
                <AutoInput value={email} onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                  placeholder="email@example.com" type="email" minW={180} className="signup-email-input"
                  style={{ fontSize: 'clamp(20px, 3.5vw, 28px)', width: '100%', textAlign: 'left' }} />
                {email.trim() && isValidEmail(email.trim()) && (
                  <span style={{ color: '#2d7a4f', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>{'\u2713'}</span>
                )}
              </span>
            </div>
            {emailError && <p style={{ color: '#d4760a', fontSize: 12, marginTop: 2, fontFamily: "'Inter', sans-serif", textAlign: 'center' }}>{emailError}</p>}

            <div className="account-field-row" style={{ ...sentenceFontStyle, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ flexShrink: 0 }}>My zip code is</span>
              <AutoInput value={zipCode} onChange={e => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="00000" minW={80} style={{ fontSize: 'clamp(20px, 3.5vw, 28px)' }} />
            </div>

            <div style={sentenceFontStyle}>
              I heard about GoodKibble from{' '}
              <InlineDropdown value={heardFrom} onChange={setHeardFrom} options={HEARD_FROM} width={160} placeholder="---" />
            </div>

            {error && <p style={{ color: '#b5483a', fontSize: 14, marginTop: 16, fontFamily: "'Inter', sans-serif" }}>{error}</p>}

            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#b5aa99', fontStyle: 'italic', marginTop: 20, lineHeight: 1.5 }}>
              By creating a profile, you agree to receive occasional emails from GoodKibble. Unsubscribe anytime. We never share your data.
            </p>
          </div>
        )}

        {/* ── CHOOSE YOUR PLAN ── */}
        {curType === 'plan' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f7efd8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>{'\u{1F389}'}</div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#1a1612', margin: '0 0 8px', letterSpacing: -0.5 }}>
              You&rsquo;re in, {firstName || 'there'}!
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#8a7e72', lineHeight: 1.6, maxWidth: 440, margin: '0 auto 24px' }}>
              Choose how you want to use GoodKibble.
            </p>

            {/* Billing toggle */}
            <div style={{ display: 'inline-flex', marginBottom: 28, position: 'relative' }}>
              <button onClick={() => setBilling('monthly')} style={{
                padding: '10px 24px', borderRadius: '100px 0 0 100px', border: 'none',
                background: billing === 'monthly' ? '#1a1612' : 'transparent',
                color: billing === 'monthly' ? '#faf8f4' : '#8a7e72',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                ...(billing !== 'monthly' ? { border: '1.5px solid #ede8df', borderRight: 'none' } : {}),
              }}>Monthly</button>
              <button onClick={() => setBilling('yearly')} style={{
                padding: '10px 24px', borderRadius: '0 100px 100px 0', border: 'none',
                background: billing === 'yearly' ? '#1a1612' : 'transparent',
                color: billing === 'yearly' ? '#faf8f4' : '#8a7e72',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", position: 'relative',
                ...(billing !== 'yearly' ? { border: '1.5px solid #ede8df', borderLeft: 'none' } : {}),
              }}>
                Yearly
                <span style={{
                  position: 'absolute', top: -10, right: -10,
                  background: '#639922', color: '#fff', padding: '2px 8px',
                  borderRadius: 100, fontSize: 10, fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                }}>Save 38%</span>
              </button>
            </div>

            <div className="plan-cards" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 560, margin: '0 auto', textAlign: 'left' }}>
              {/* Free card */}
              <div style={{
                background: '#fff', borderRadius: 20, border: '1px solid #ede8df', padding: '24px 20px',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a7e72', marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>Free</div>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontWeight: 900, color: '#1a1612', marginBottom: 4 }}>$0</div>
                <div style={{ fontSize: 12, color: '#b5aa99', marginBottom: 20, fontFamily: "'Inter', sans-serif" }}>Free forever</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, flex: 1 }}>
                  {['Search & score any food', 'Score breakdown (9 categories)', 'Compare up to 2 foods', '1 dog profile'].map(f => (
                    <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, fontFamily: "'Inter', sans-serif", color: '#3d352b' }}>
                      <span style={{ color: '#639922', fontWeight: 700, flexShrink: 0 }}>{'\u2713'}</span>{f}
                    </div>
                  ))}
                </div>
                <button onClick={() => goTo(STEP_CONFIRM)} style={{
                  width: '100%', padding: '12px 0', borderRadius: 100, border: '1.5px solid #ede8df',
                  background: 'transparent', color: '#8a7e72', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                }}>Continue Free</button>
              </div>

              {/* Pro card */}
              <div style={{
                background: '#1a1612', borderRadius: 20, border: '2px solid #2F6B48', padding: '24px 20px',
                display: 'flex', flexDirection: 'column', position: 'relative',
              }}>
                <span style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: '#2F6B48', color: '#fff', padding: '3px 12px',
                  borderRadius: 100, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                  fontFamily: "'Inter', sans-serif",
                }}>RECOMMENDED</span>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#2F6B48', marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>Pro</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontWeight: 900, color: '#faf8f4' }}>{billing === 'yearly' ? '$29' : '$3.99'}</span>
                  <span style={{ fontSize: 13, color: '#8a7e72', fontFamily: "'Inter', sans-serif" }}>{billing === 'yearly' ? '/year' : '/month'}</span>
                </div>
                <div style={{ fontSize: 12, color: '#8a7e72', marginBottom: 20, fontFamily: "'Inter', sans-serif" }}>
                  {billing === 'yearly' ? "That\u2019s just $2.42/month" : 'Cancel anytime'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, flex: 1 }}>
                  {['Everything in Free, plus:', 'Recall alerts to your email', 'Score change notifications', 'Ingredient deep-dives', 'Unlimited comparisons', 'Up to 5 dog profiles'].map((f, i) => (
                    <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, fontFamily: "'Inter', sans-serif", color: i === 0 ? '#2F6B48' : 'rgba(255,255,255,0.8)', fontWeight: i === 0 ? 700 : 400 }}>
                      {i > 0 && <span style={{ color: '#639922', fontWeight: 700, flexShrink: 0 }}>{'\u2713'}</span>}{f}
                    </div>
                  ))}
                </div>
                <button onClick={async () => {
                  try {
                    const res = await fetch('/api/checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: email.trim(), plan: billing, source: 'signup' }),
                    });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                    else goTo(STEP_CONFIRM);
                  } catch {
                    goTo(STEP_CONFIRM);
                  }
                }} style={{
                  width: '100%', padding: '12px 0', borderRadius: 100, border: 'none',
                  background: '#2F6B48', color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                }}>Get Pro &rarr;</button>
              </div>
            </div>

            <button onClick={() => goTo(STEP_CONFIRM)} style={{
              marginTop: 24, background: 'none', border: 'none', color: '#b5aa99',
              fontSize: 13, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}>Skip for now</button>
          </div>
        )}

        {/* ── CHECK YOUR EMAIL ── */}
        {curType === 'confirm' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f7efd8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>{'\u2709\uFE0F'}</div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, color: '#1a1612', margin: '0 0 8px', letterSpacing: -1 }}>
              Check your email!
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: '#8a7e72', marginBottom: 8, lineHeight: 1.6 }}>
              We sent a magic link to <strong style={{ color: '#2F6B48' }}>{email.trim()}</strong>.
              <br />Click the link in your email to activate your profile.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#b5aa99', marginBottom: 28 }}>
              Didn&rsquo;t get it? Check your spam folder, or wait a moment and try again.
            </p>
            <button onClick={resendEmail} style={{
              padding: '10px 28px', borderRadius: 100, background: 'transparent', color: '#8a7e72',
              fontSize: 14, fontWeight: 600, border: '1.5px solid #ede8df',
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}>Resend Email</button>
          </div>
        )}

        {/* Already registered error */}
        {error === 'already_registered' && curType === 'account' && (
          <div style={{ textAlign: 'center', marginTop: 16, padding: '16px 20px', background: '#f7efd8', borderRadius: 14, fontFamily: "'Inter', sans-serif" }}>
            <p style={{ fontSize: 14, color: '#1a1612', marginBottom: 8 }}>Looks like you already have an account!</p>
            <a href="/login" style={{ fontSize: 14, fontWeight: 600, color: '#2F6B48', textDecoration: 'none' }}>Sign in instead &rarr;</a>
          </div>
        )}

        {/* Navigation buttons */}
        {step >= 1 && step < STEP_PLAN && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 40 }}>
            <button onClick={handleBack} style={{ padding: '12px 28px', borderRadius: 100, background: 'transparent', color: '#8a7e72', fontSize: 15, fontWeight: 600, border: '1.5px solid #ede8df', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>&larr; Back</button>
            <button onClick={handleNext} disabled={!canContinue() || submitting} style={{
              padding: '14px 48px', borderRadius: 100,
              background: canContinue() ? '#1a1612' : '#ede8df',
              color: canContinue() ? '#faf8f4' : '#b5aa99',
              fontSize: 16, fontWeight: 700, border: 'none',
              cursor: canContinue() ? 'pointer' : 'default',
              fontFamily: "'Inter', sans-serif",
              opacity: submitting ? 0.7 : 1, transition: 'background 0.2s, color 0.2s',
            }}>
              {submitting ? 'Saving...' : curType === 'account' ? 'Create My Profile \u2192' : 'Continue'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          nav { padding: 12px 16px !important; }
          .account-field-row { flex-direction: column !important; align-items: center !important; }
          .signup-email-input { width: 100% !important; text-align: center !important; }
          .plan-cards { grid-template-columns: 1fr !important; }
          .plan-cards > div:last-child { order: -1; }
        }
      `}</style>
    </div>
  );
}
