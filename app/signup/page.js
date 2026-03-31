'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const BREEDS = [
  'Mixed Breed', 'Labrador Retriever', 'French Bulldog', 'Golden Retriever',
  'German Shepherd', 'Poodle', 'Bulldog', 'Beagle', 'Rottweiler', 'Dachshund',
  'German Shorthaired Pointer', 'Pembroke Welsh Corgi', 'Australian Shepherd',
  'Yorkshire Terrier', 'Cavalier King Charles Spaniel', 'Doberman Pinscher',
  'Boxer', 'Miniature Schnauzer', 'Cane Corso', 'Great Dane',
  'Shih Tzu', 'Siberian Husky', 'Bernese Mountain Dog', 'Pomeranian',
  'Boston Terrier', 'Havanese', 'Shetland Sheepdog', 'Brittany',
  'English Springer Spaniel', 'Cocker Spaniel', 'Border Collie', 'Other',
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

function DogIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="50" rx="18" ry="4" fill="#ede8df" />
      <path d="M18 28c-3-8-1-16 2-18s6 2 8 6" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M46 28c3-8 1-16-2-18s-6 2-8 6" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="32" cy="34" rx="14" ry="12" stroke="#C9A84C" strokeWidth="2.5" fill="none" />
      <circle cx="27" cy="31" r="2" fill="#C9A84C" />
      <circle cx="37" cy="31" r="2" fill="#C9A84C" />
      <ellipse cx="32" cy="36" rx="3" ry="2" fill="#C9A84C" />
      <path d="M29 40c1.5 2 4.5 2 6 0" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M22 44c0 4 4 6 10 6s10-2 10-6" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
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
              width: current ? 14 : 10,
              height: current ? 14 : 10,
              borderRadius: '50%',
              background: completed ? '#C9A84C' : current ? '#C9A84C' : '#ede8df',
              border: current ? '3px solid rgba(201,168,76,0.3)' : 'none',
              transition: 'all 0.3s ease',
            }} />
            {i < total - 1 && (
              <div style={{
                width: 32,
                height: 2,
                background: completed ? '#C9A84C' : '#ede8df',
                transition: 'background 0.3s ease',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InlineInput({ value, onChange, placeholder, width, type = 'text', min, max, style: extraStyle }) {
  const baseStyle = {
    border: 'none',
    borderBottom: '2.5px dotted #C9A84C',
    background: 'transparent',
    color: '#C9A84C',
    fontWeight: 700,
    fontFamily: "'Playfair Display', serif",
    fontSize: 'inherit',
    textAlign: 'center',
    outline: 'none',
    padding: '2px 4px',
    width: width || 'auto',
    minWidth: 40,
    ...extraStyle,
  };
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      style={baseStyle}
    />
  );
}

function InlineSelect({ value, onChange, options, width, style: extraStyle }) {
  const baseStyle = {
    border: 'none',
    borderBottom: '2.5px dotted #C9A84C',
    background: 'transparent',
    color: '#C9A84C',
    fontWeight: 700,
    fontFamily: "'Playfair Display', serif",
    fontSize: 'inherit',
    textAlign: 'center',
    outline: 'none',
    padding: '2px 4px',
    width: width || 'auto',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23C9A84C' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 4px center',
    paddingRight: 20,
    ...extraStyle,
  };
  return (
    <select value={value} onChange={onChange} style={baseStyle}>
      <option value="" disabled>---</option>
      {options.map(opt => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        return <option key={val} value={val}>{label}</option>;
      })}
    </select>
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
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    setText(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/foods/search?q=' + encodeURIComponent(val) + '&limit=30');
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        const items = Array.isArray(data) ? data : [];
        setResults(items.slice(0, 6));
        setOpen(true);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 250);
  }

  function handleSelect(food) {
    onSelect({ name: `${food.brand} ${food.name}`, slug: food.slug, brand_slug: food.brand_slug });
    setText(`${food.brand} ${food.name}`);
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={boxRef} style={{ position: 'relative', width: '100%', maxWidth: 500, margin: '0 auto' }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: '#fff', borderRadius: 16,
        padding: '6px 6px 6px 20px',
        boxShadow: '0 4px 24px rgba(26,22,18,0.08)',
        border: '1.5px solid #ede8df',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="#b5aa99" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search for your dog's current food..."
          value={text}
          onChange={handleChange}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          style={{
            flex: 1, border: 'none', outline: 'none', minWidth: 0,
            fontSize: 15, padding: '12px 10px',
            background: 'transparent', color: '#1a1612',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          }}
        />
      </div>
      {selectedFood && (
        <div style={{
          marginTop: 10, padding: '10px 16px', background: '#f7efd8',
          borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#1a1612',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>{selectedFood.name}</span>
          <button onClick={() => { onSelect(null); setText(''); }} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#8a7e72', fontSize: 18,
          }}>&times;</button>
        </div>
      )}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#fff', borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(26,22,18,0.15)', zIndex: 9999,
          maxHeight: 340, overflowY: 'auto',
        }}>
          {loading && results.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#8a7e72', fontSize: 14 }}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#8a7e72', fontSize: 14 }}>No results found.</div>
          ) : results.map((f) => (
            <div key={f.id}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(f); }}
              style={{
                padding: '12px 18px', cursor: 'pointer',
                borderBottom: '1px solid #f0ebe3',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#faf8f5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {f.image_url ? (
                <img src={f.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', background: '#f5f0e8', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {'\u{1F415}'}
                </div>
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

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [fadeState, setFadeState] = useState('in'); // 'in', 'out'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 2 — dogs
  const [dogCount, setDogCount] = useState('');
  const [dogName, setDogName] = useState('');

  // Step 3 — dog profile
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [ageUnit, setAgeUnit] = useState('years');
  const [neutered, setNeutered] = useState('');
  const [weight, setWeight] = useState('');
  const [breed, setBreed] = useState('');

  // Step 4 — current food
  const [currentFood, setCurrentFood] = useState(null); // { name, slug, brand_slug } or string
  const [foodAlt, setFoodAlt] = useState(''); // "not_sure", "no_kibble", "want_switch"

  // Step 5 — priorities
  const [priorities, setPriorities] = useState([]);

  // Step 6 — account
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [heardFrom, setHeardFrom] = useState('');

  const pronounHe = gender === 'male' ? 'He' : gender === 'female' ? 'She' : 'They';

  function canContinue() {
    switch (step) {
      case 0: return true;
      case 1: return dogCount && parseInt(dogCount) > 0 && dogName.trim();
      case 2: return gender && age && parseInt(age) > 0 && weight && parseInt(weight) > 0 && breed;
      case 3: return currentFood || foodAlt;
      case 4: return priorities.length > 0;
      case 5: return firstName.trim() && email.trim() && zipCode.trim();
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

  function handleNext() {
    if (!canContinue()) return;
    if (step === 5) {
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
      const payload = {
        first_name: firstName.trim(),
        email: email.trim(),
        zip_code: zipCode.trim(),
        heard_from: heardFrom || null,
        dog: {
          dog_name: dogName.trim(),
          breed,
          age_value: parseInt(age),
          age_unit: ageUnit,
          weight_lbs: parseInt(weight),
          gender,
          is_neutered: neutered === 'is',
          current_food: currentFood ? currentFood.name : foodAlt,
          current_food_slug: currentFood ? `${currentFood.brand_slug}/${currentFood.slug}` : null,
          priorities,
        },
      };
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      const data = await res.json();
      // Store profile IDs and user info for profile page + nav
      if (typeof window !== 'undefined') {
        localStorage.setItem('gk_user_id', data.user_id);
        localStorage.setItem('gk_dog_id', data.dog_id);
        localStorage.setItem('gk_user_name', firstName.trim());
        localStorage.setItem('gk_user_email', email.trim());
        window.dispatchEvent(new Event('gk_profile_updated'));
      }
      goTo(6);
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  function togglePriority(label) {
    setPriorities(prev =>
      prev.includes(label) ? prev.filter(p => p !== label) : [...prev, label]
    );
  }

  const fadeStyle = {
    opacity: fadeState === 'in' ? 1 : 0,
    transform: fadeState === 'in' ? 'translateY(0)' : 'translateY(-12px)',
    transition: fadeState === 'in'
      ? 'opacity 0.4s ease, transform 0.4s ease'
      : 'opacity 0.25s ease, transform 0.25s ease',
  };

  const displayName = dogName.trim() || 'your dog';

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid #ede8df',
        background: '#faf8f4',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22, fontWeight: 800, color: '#1a1612',
            letterSpacing: -0.5,
          }}>GoodKibble</span>
        </a>
        {step < 7 && (
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, fontWeight: 600, color: '#8a7e72',
            letterSpacing: 1, textTransform: 'uppercase',
          }}>Step {step + 1} of 7</span>
        )}
      </nav>

      {/* Progress dots */}
      {step < 7 && <ProgressDots step={step} total={7} />}

      {/* Content */}
      <div style={{
        maxWidth: 640, margin: '0 auto',
        padding: '32px 24px 80px',
        ...fadeStyle,
      }}>

        {/* STEP 1 — Welcome */}
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <DogIcon />
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 800, color: '#1a1612',
              margin: '20px 0 16px',
              letterSpacing: -1,
              lineHeight: 1.15,
            }}>
              Let&rsquo;s find the best food for your dog
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 16, color: '#8a7e72',
              lineHeight: 1.6, maxWidth: 440, margin: '0 auto 12px',
            }}>
              Tell us about your pup and we&rsquo;ll show you how their current food stacks up &mdash; plus smarter alternatives.
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13, color: '#b5aa99',
            }}>Takes about 2 minutes.</p>
            <button onClick={() => goTo(1)} style={{
              marginTop: 32,
              padding: '14px 48px', borderRadius: 100,
              background: '#1a1612', color: '#faf8f4',
              fontSize: 16, fontWeight: 700, border: 'none',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>
              Get Started &rarr;
            </button>
          </div>
        )}

        {/* STEP 2 — My Dogs */}
        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <DogIcon />
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 700, color: '#1a1612',
              lineHeight: 1.6, marginTop: 24,
            }}>
              I have{' '}
              <InlineInput
                value={dogCount}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '');
                  if (v === '' || (parseInt(v) >= 0 && parseInt(v) <= 9)) setDogCount(v);
                }}
                placeholder="#"
                width={50}
                type="text"
                style={{ fontSize: 'clamp(24px, 4vw, 32px)' }}
              />
              {' '}{dogCount === '1' ? 'dog' : 'dogs'}
              {dogCount && parseInt(dogCount) > 0 && (
                <>
                  {' '}named{' '}
                  <InlineInput
                    value={dogName}
                    onChange={e => setDogName(e.target.value)}
                    placeholder="name"
                    width={180}
                    style={{ fontSize: 'clamp(24px, 4vw, 32px)' }}
                  />
                </>
              )}
            </div>
            {dogCount && parseInt(dogCount) > 1 && (
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, color: '#b5aa99', marginTop: 12,
              }}>
                Multi-dog support coming soon &mdash; for now, tell us about your first pup!
              </p>
            )}
          </div>
        )}

        {/* STEP 3 — Dog Profile */}
        {step === 2 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12, fontWeight: 700, color: '#C9A84C',
              textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6,
            }}>Tell us about {displayName}</div>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, color: '#8a7e72', marginBottom: 28,
            }}>This helps us personalize food recommendations.</p>

            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(20px, 3.5vw, 28px)',
              fontWeight: 700, color: '#1a1612',
              lineHeight: 2.2,
            }}>
              <InlineSelect
                value={gender}
                onChange={e => setGender(e.target.value)}
                options={[{ value: 'male', label: 'He' }, { value: 'female', label: 'She' }]}
                width={80}
                style={{ fontSize: 'clamp(20px, 3.5vw, 28px)' }}
              />
              {' '}is{' '}
              <InlineInput
                value={age}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '');
                  setAge(v);
                }}
                placeholder="age"
                width={55}
                type="text"
                style={{ fontSize: 'clamp(20px, 3.5vw, 28px)' }}
              />
              {' '}
              <InlineSelect
                value={ageUnit}
                onChange={e => setAgeUnit(e.target.value)}
                options={['years', 'months']}
                width={110}
                style={{ fontSize: 'clamp(20px, 3.5vw, 28px)' }}
              />
              {' '}old.
            </div>

            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(20px, 3.5vw, 28px)',
              fontWeight: 700, color: '#1a1612',
              lineHeight: 2.2, marginTop: 8,
            }}>
              {pronounHe}{' '}
              <InlineSelect
                value={neutered}
                onChange={e => setNeutered(e.target.value)}
                options={[{ value: 'is', label: 'is' }, { value: 'is not', label: 'is not' }]}
                width={90}
                style={{ fontSize: 'clamp(20px, 3.5vw, 28px)' }}
              />
              {' '}neutered and weighs{' '}
              <InlineInput
                value={weight}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '');
                  setWeight(v);
                }}
                placeholder="lbs"
                width={65}
                type="text"
                style={{ fontSize: 'clamp(20px, 3.5vw, 28px)' }}
              />
              {' '}lbs.
            </div>

            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(20px, 3.5vw, 28px)',
              fontWeight: 700, color: '#1a1612',
              lineHeight: 2.2, marginTop: 8,
            }}>
              Breed:{' '}
              <InlineSelect
                value={breed}
                onChange={e => setBreed(e.target.value)}
                options={BREEDS}
                width={220}
                style={{ fontSize: 'clamp(20px, 3.5vw, 28px)' }}
              />
            </div>
          </div>
        )}

        {/* STEP 4 — Current Food */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12, fontWeight: 700, color: '#C9A84C',
              textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6,
            }}>{displayName}&rsquo;s current food</div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 800, color: '#1a1612',
              margin: '8px 0 28px', letterSpacing: -0.5,
            }}>Right now I feed {displayName}</h2>

            <FoodSearch
              onSelect={(food) => { setCurrentFood(food); if (food) setFoodAlt(''); }}
              selectedFood={currentFood}
            />

            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 10,
              justifyContent: 'center', marginTop: 24,
            }}>
              {[
                { key: 'not_sure', label: "I'm not sure" },
                { key: 'no_kibble', label: "I don't feed kibble" },
                { key: 'want_switch', label: 'I want to switch' },
              ].map(opt => {
                const selected = foodAlt === opt.key;
                return (
                  <button key={opt.key} onClick={() => {
                    setFoodAlt(selected ? '' : opt.key);
                    if (!selected) setCurrentFood(null);
                  }} style={{
                    padding: '10px 20px', borderRadius: 100,
                    border: selected ? '2px solid #C9A84C' : '1.5px solid #ede8df',
                    background: selected ? '#f7efd8' : '#fff',
                    color: '#1a1612', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    transition: 'all 0.2s ease',
                  }}>{opt.label}</button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5 — Priorities */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12, fontWeight: 700, color: '#C9A84C',
              textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6,
            }}>What matters to you</div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 800, color: '#1a1612',
              margin: '8px 0 8px', letterSpacing: -0.5,
            }}>When it comes to {displayName}&rsquo;s food, I care most about...</h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, color: '#8a7e72', marginBottom: 24,
            }}>Select all that apply.</p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 10, maxWidth: 500, margin: '0 auto',
            }}>
              {PRIORITIES.map(p => {
                const selected = priorities.includes(p.label);
                return (
                  <button key={p.label} onClick={() => togglePriority(p.label)} style={{
                    padding: '12px 16px', borderRadius: 14,
                    border: selected ? '2px solid #C9A84C' : '1.5px solid #ede8df',
                    background: selected ? '#f7efd8' : '#fff',
                    color: '#1a1612', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'all 0.2s ease', textAlign: 'left',
                  }}>
                    <span style={{ fontSize: 18 }}>{p.emoji}</span>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 6 — Account */}
        {step === 5 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12, fontWeight: 700, color: '#C9A84C',
              textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6,
            }}>Almost done</div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 800, color: '#1a1612',
              margin: '8px 0 8px', letterSpacing: -0.5,
            }}>Save {displayName}&rsquo;s profile</h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, color: '#8a7e72', marginBottom: 28,
            }}>We&rsquo;ll use this to personalize your recommendations and keep you updated on food scores.</p>

            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(20px, 3.5vw, 28px)',
              fontWeight: 700, color: '#1a1612',
              lineHeight: 2.4,
            }}>
              My first name is{' '}
              <InlineInput
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="first name"
                width={180}
                style={{ fontSize: 'clamp(20px, 3.5vw, 28px)' }}
              />
            </div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(20px, 3.5vw, 28px)',
              fontWeight: 700, color: '#1a1612',
              lineHeight: 2.4,
            }}>
              My email is{' '}
              <InlineInput
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                width={260}
                type="email"
                style={{ fontSize: 'clamp(20px, 3.5vw, 28px)' }}
              />
            </div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(20px, 3.5vw, 28px)',
              fontWeight: 700, color: '#1a1612',
              lineHeight: 2.4,
            }}>
              My zip code is{' '}
              <InlineInput
                value={zipCode}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 5);
                  setZipCode(v);
                }}
                placeholder="00000"
                width={100}
                style={{ fontSize: 'clamp(20px, 3.5vw, 28px)' }}
              />
            </div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(20px, 3.5vw, 28px)',
              fontWeight: 700, color: '#1a1612',
              lineHeight: 2.4,
            }}>
              I heard about GoodKibble from{' '}
              <InlineSelect
                value={heardFrom}
                onChange={e => setHeardFrom(e.target.value)}
                options={HEARD_FROM}
                width={200}
                style={{ fontSize: 'clamp(20px, 3.5vw, 28px)' }}
              />
            </div>

            {error && (
              <p style={{
                color: '#b5483a', fontSize: 14, marginTop: 16,
                fontFamily: "'DM Sans', sans-serif",
              }}>{error}</p>
            )}

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10, color: '#b5aa99', fontStyle: 'italic',
              marginTop: 20, lineHeight: 1.5,
            }}>
              By creating a profile, you agree to receive occasional emails from GoodKibble. Unsubscribe anytime. We never share your data.
            </p>
          </div>
        )}

        {/* STEP 7 — Confirmation */}
        {step === 6 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#e6f4e0', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 32, margin: '0 auto 20px',
            }}>{'\u{1F389}'}</div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(28px, 5vw, 40px)',
              fontWeight: 800, color: '#1a1612',
              margin: '0 0 8px', letterSpacing: -1,
            }}>Welcome, {firstName}!</h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 16, color: '#8a7e72', marginBottom: 28,
            }}>{displayName}&rsquo;s profile is saved.</p>

            {/* Summary card */}
            <div style={{
              background: '#fff', borderRadius: 16,
              border: '1px solid #ede8df',
              padding: 24, textAlign: 'left',
              maxWidth: 420, margin: '0 auto 32px',
            }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12, fontWeight: 700, color: '#C9A84C',
                textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16,
              }}>{displayName}&rsquo;s Profile</div>
              {[
                { label: 'Breed', value: breed },
                { label: 'Age', value: `${age} ${ageUnit}` },
                { label: 'Weight', value: `${weight} lbs` },
                { label: 'Gender', value: gender === 'male' ? 'Male' : 'Female' },
                { label: 'Neutered', value: neutered === 'is' ? 'Yes' : 'No' },
                { label: 'Current Food', value: currentFood ? currentFood.name : foodAlt.replace('_', ' ') },
              ].map((row, i) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: i < 5 ? '1px solid #f5f2ec' : 'none',
                }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8a7e72' }}>{row.label}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#1a1612' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <button onClick={() => router.push('/discover')} style={{
              padding: '14px 48px', borderRadius: 100,
              background: '#1a1612', color: '#faf8f4',
              fontSize: 16, fontWeight: 700, border: 'none',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>
              See {displayName}&rsquo;s Recommendations &rarr;
            </button>

            <div style={{ marginTop: 16 }}>
              <button onClick={() => router.push('/profile')} style={{
                padding: '10px 32px', borderRadius: 100,
                background: 'transparent', color: '#8a7e72',
                fontSize: 14, fontWeight: 600, border: '1.5px solid #ede8df',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>
                View My Profile
              </button>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        {step >= 1 && step <= 5 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 12, marginTop: 40,
          }}>
            <button onClick={handleBack} style={{
              padding: '12px 28px', borderRadius: 100,
              background: 'transparent', color: '#8a7e72',
              fontSize: 15, fontWeight: 600, border: '1.5px solid #ede8df',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>&larr; Back</button>
            <button onClick={handleNext} disabled={!canContinue() || submitting} style={{
              padding: '14px 48px', borderRadius: 100,
              background: canContinue() ? '#1a1612' : '#ede8df',
              color: canContinue() ? '#faf8f4' : '#b5aa99',
              fontSize: 16, fontWeight: 700, border: 'none',
              cursor: canContinue() ? 'pointer' : 'default',
              fontFamily: "'DM Sans', sans-serif",
              opacity: submitting ? 0.7 : 1,
              transition: 'background 0.2s, color 0.2s',
            }}>
              {submitting ? 'Saving...' : step === 5 ? 'Create My Profile \u2192' : 'Continue'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          nav { padding: 12px 16px !important; }
        }
      `}</style>
    </div>
  );
}
