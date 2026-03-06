'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import SearchBox from './components/SearchBox';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [brands, setBrands] = useState([]);
  const router = useRouter();

  useEffect(() => {
    supabase
      .from('dog_foods')
      .select('brand')
      .then(({ data }) => {
        if (!data) return;
        const counts = {};
        data.forEach(r => { counts[r.brand] = (counts[r.brand] || 0) + 1; });
        const sorted = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, count]) => ({ name, count }));
        setBrands(sorted);
      });
  }, []);

  function handleSelect(id) {
    router.push(`/food/${id}`);
  }

  function handleBrand(brandName) {
    router.push(`/brand/${encodeURIComponent(brandName)}`);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        flex: 1,
        background: 'linear-gradient(170deg, #f5d442 0%, #f0c930 45%, #e8c020 100%)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Nav */}
        <nav style={{
          padding: '20px 40px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', animation: 'fadeIn 0.6s ease',
        }}>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800,
            color: '#1a1612', letterSpacing: -0.5, cursor: 'pointer',
          }}>
            Good<span style={{ opacity: 0.4 }}>Kibble</span>
          </div>
        </nav>

        {/* Hero - Centered layout with kibble on left */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 60px 40px',
          animation: 'fadeUp 0.8s ease',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 60,
            maxWidth: 1000, width: '100%',
          }}>
            {/* Left - Kibble with labels */}
            <div style={{
              position: 'relative',
              width: 180,
              flexShrink: 0,
            }}>
              <img
                src="/hero-kibble.png"
                alt="Kibble nutritional breakdown"
                style={{ width: '100%', height: 'auto' }}
              />
              {/* SVG overlay - viewBox matches image: 263x1046 */}
              <svg
                viewBox="-120 0 500 1046"
                fill="none"
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '270%',
                  height: '100%',
                  marginLeft: '-85%',
                  pointerEvents: 'none',
                  overflow: 'visible',
                }}
              >
                {/* PROTEIN - left, piece 1 center ~(127,87) */}
                <circle cx="127" cy="87" r="4" fill="#1a1612" opacity="0.4" />
                <path d="M127 87 L50 50 L-80 50" stroke="#1a1612" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.3" />
                <text x="-80" y="43" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="22" letterSpacing="3" fill="#1a1612">PROTEIN</text>

                {/* FAT - right, piece 2 center ~(131,283) */}
                <circle cx="200" cy="283" r="4" fill="#1a1612" opacity="0.4" />
                <path d="M200 283 L290 260 L380 260" stroke="#1a1612" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.3" />
                <text x="380" y="253" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="22" letterSpacing="3" fill="#1a1612" textAnchor="end">FAT</text>

                {/* CARBS - left, piece 3 center ~(129,503) */}
                <circle cx="60" cy="503" r="4" fill="#1a1612" opacity="0.4" />
                <path d="M60 503 L0 475 L-80 475" stroke="#1a1612" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.3" />
                <text x="-80" y="468" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="22" letterSpacing="3" fill="#1a1612">CARBS</text>

                {/* FIBER - right, piece 4 center ~(134,753) */}
                <circle cx="210" cy="753" r="4" fill="#1a1612" opacity="0.4" />
                <path d="M210 753 L290 730 L380 730" stroke="#1a1612" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.3" />
                <text x="380" y="723" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="22" letterSpacing="3" fill="#1a1612" textAnchor="end">FIBER</text>

                {/* MOISTURE - left, piece 5 center ~(134,957) */}
                <circle cx="70" cy="957" r="4" fill="#1a1612" opacity="0.4" />
                <path d="M70 957 L0 935 L-80 935" stroke="#1a1612" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.3" />
                <text x="-80" y="928" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="22" letterSpacing="3" fill="#1a1612">MOISTURE</text>
              </svg>
            </div>

            {/* Right - Text + Search */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'flex-start', minWidth: 0,
            }}>
              <div style={{
                fontSize: 13, fontWeight: 600, letterSpacing: 3,
                textTransform: 'uppercase', color: '#1a161260', marginBottom: 12,
              }}>Know what&apos;s in the bowl</div>

              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(32px, 4.5vw, 60px)', fontWeight: 800, color: '#1a1612',
                lineHeight: 1.05, marginBottom: 12, letterSpacing: -1.5,
              }}>
                What&apos;s really in<br />your dog&apos;s food?
              </h1>

              <p style={{
                fontSize: 16, color: '#1a161290', maxWidth: 420,
                lineHeight: 1.6, marginBottom: 32, fontWeight: 400,
              }}>
                Search any dog food brand. Get a clear breakdown of ingredients and nutrition — no fluff.
              </p>

              <SearchBox onSelect={handleSelect} variant="hero" />
            </div>
          </div>
        </div>

        {/* Popular Brands */}
        <div style={{
          background: '#1a1612', borderRadius: '32px 32px 0 0',
          padding: '40px 40px 48px', animation: 'fadeUp 1s ease 0.3s both',
        }}>
          <div style={{
            fontSize: 12, fontWeight: 600, letterSpacing: 2.5,
            textTransform: 'uppercase', color: '#8a7e72', marginBottom: 20, textAlign: 'center',
          }}>Popular Brands</div>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 10,
            justifyContent: 'center', maxWidth: 700, margin: '0 auto',
          }}>
            {brands.map((b, i) => (
              <button key={b.name} onClick={() => handleBrand(b.name)}
                style={{
                  padding: '12px 22px', borderRadius: 100,
                  border: '1.5px solid #3d352b', background: 'transparent',
                  color: '#d4c9b8', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                  animationName: 'fadeUp', animationDuration: '0.5s',
                  animationFillMode: 'both', animationDelay: `${i * 80}ms`,
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f5d442';
                  e.target.style.color = '#1a1612';
                  e.target.style.borderColor = '#f5d442';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#d4c9b8';
                  e.target.style.borderColor = '#3d352b';
                }}
              >
                {b.name}
                <span style={{ marginLeft: 8, opacity: 0.5, fontSize: 12 }}>({b.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
