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
            fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 800,
            color: '#1a1612', letterSpacing: -0.5, cursor: 'pointer',
          }}>
            Good<span style={{ opacity: 0.4 }}>Kibble</span>
          </div>
        </nav>

        {/* Hero */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          padding: '0 0 40px 0',
          animation: 'fadeUp 0.8s ease',
          overflow: 'hidden',
        }}>
          {/* Left - Kibble graphic */}
          <div style={{
            width: '38%',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <div style={{
              width: 160,
              transform: 'rotate(-5deg)',
              position: 'relative',
            }}>
              <img
                src="/hero-kibble.png"
                alt="Kibble nutritional breakdown"
                style={{ width: '100%', height: 'auto' }}
              />
              {/* SVG overlay - viewBox matches image 263x1046 */}
              <svg
                viewBox="-140 0 540 1046"
                fill="none"
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '310%',
                  height: '100%',
                  marginLeft: '-100%',
                  pointerEvents: 'none',
                  overflow: 'visible',
                }}
              >
                {/* PROTEIN - left, piece 1 center y=87 */}
                <circle cx="80" cy="87" r="4" fill="#1a1612" opacity="0.4" />
                <path d="M80 87 L10 55 L-110 55" stroke="#1a1612" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.3" />
                <text x="-110" y="48" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="24" letterSpacing="3" fill="#1a1612">PROTEIN</text>

                {/* FAT - right, piece 2 center y=283 */}
                <circle cx="215" cy="283" r="4" fill="#1a1612" opacity="0.4" />
                <path d="M215 283 L300 258 L400 258" stroke="#1a1612" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.3" />
                <text x="400" y="251" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="24" letterSpacing="3" fill="#1a1612" textAnchor="end">FAT</text>

                {/* CARBS - left, piece 3 center y=503 */}
                <circle cx="45" cy="503" r="4" fill="#1a1612" opacity="0.4" />
                <path d="M45 503 L-20 478 L-110 478" stroke="#1a1612" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.3" />
                <text x="-110" y="471" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="24" letterSpacing="3" fill="#1a1612">CARBS</text>

                {/* FIBER - right, piece 4 center y=753 */}
                <circle cx="225" cy="753" r="4" fill="#1a1612" opacity="0.4" />
                <path d="M225 753 L300 728 L400 728" stroke="#1a1612" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.3" />
                <text x="400" y="721" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="24" letterSpacing="3" fill="#1a1612" textAnchor="end">FIBER</text>

                {/* MOISTURE - left, piece 5 center y=957 */}
                <circle cx="65" cy="957" r="4" fill="#1a1612" opacity="0.4" />
                <path d="M65 957 L-10 935 L-110 935" stroke="#1a1612" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.3" />
                <text x="-110" y="928" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="24" letterSpacing="3" fill="#1a1612">MOISTURE</text>
              </svg>
            </div>
          </div>

          {/* Right - Text + Search, pushed further right */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'flex-start',
            paddingRight: 80,
            paddingLeft: 40,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 600, letterSpacing: 3,
              textTransform: 'uppercase', color: '#1a161260', marginBottom: 12,
            }}>Know what&apos;s in the bowl</div>

            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(32px, 4.5vw, 60px)', fontWeight: 800, color: '#1a1612',
              lineHeight: 1.05, marginBottom: 16, letterSpacing: -1.5,
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
