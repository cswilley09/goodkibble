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
          padding: '24px 40px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', animation: 'fadeIn 0.6s ease',
        }}>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800,
            color: '#1a1612', letterSpacing: -0.5, cursor: 'pointer',
          }}>
            Good<span style={{ opacity: 0.4 }}>Kibble</span>
          </div>
        </nav>

        {/* Hero - Split layout */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          padding: '0 40px 60px', gap: 40,
          animation: 'fadeUp 0.8s ease',
          maxWidth: 1200, margin: '0 auto', width: '100%',
        }}>
          {/* Left - Hero Graphic: Real kibble image with label + line overlays */}
          <div style={{
            width: 'clamp(280px, 30vw, 420px)',
            flexShrink: 0,
            position: 'relative',
          }}>
            <img
              src="/hero-kibble.png"
              alt="Kibble nutritional breakdown"
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
            {/* SVG overlay for lines + labels */}
            <svg
              viewBox="0 0 400 720"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            >
              {/* PROTEIN - left side, connects to top kibble */}
              <circle cx="185" cy="95" r="3" fill="#1a1612" opacity="0.5" />
              <path d="M185 95 L100 75 L15 75" stroke="#1a1612" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.4" />
              <text x="15" y="65" fontFamily="DM Sans, sans-serif" fontWeight="800" fontSize="19" letterSpacing="3" fill="#1a1612">PROTEIN</text>

              {/* FAT - right side, connects to second kibble */}
              <circle cx="270" cy="215" r="3" fill="#1a1612" opacity="0.5" />
              <path d="M270 215 L340 200 L385 200" stroke="#1a1612" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.4" />
              <text x="385" y="190" fontFamily="DM Sans, sans-serif" fontWeight="800" fontSize="19" letterSpacing="3" fill="#1a1612" textAnchor="end">FAT</text>

              {/* CARBS - left side, connects to big center kibble */}
              <circle cx="155" cy="365" r="3" fill="#1a1612" opacity="0.5" />
              <path d="M155 365 L80 345 L15 345" stroke="#1a1612" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.4" />
              <text x="15" y="335" fontFamily="DM Sans, sans-serif" fontWeight="800" fontSize="19" letterSpacing="3" fill="#1a1612">CARBS</text>

              {/* FIBER - right side, connects to fourth kibble */}
              <circle cx="275" cy="490" r="3" fill="#1a1612" opacity="0.5" />
              <path d="M275 490 L340 470 L385 470" stroke="#1a1612" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.4" />
              <text x="385" y="460" fontFamily="DM Sans, sans-serif" fontWeight="800" fontSize="19" letterSpacing="3" fill="#1a1612" textAnchor="end">FIBER</text>

              {/* MOISTURE - left side, connects to bottom kibble */}
              <circle cx="170" cy="615" r="3" fill="#1a1612" opacity="0.5" />
              <path d="M170 615 L90 635 L15 635" stroke="#1a1612" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.4" />
              <text x="15" y="625" fontFamily="DM Sans, sans-serif" fontWeight="800" fontSize="19" letterSpacing="3" fill="#1a1612">MOISTURE</text>
            </svg>
          </div>

          {/* Right - Text + Search */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'flex-start',
          }}>
            <div style={{
              fontSize: 13, fontWeight: 600, letterSpacing: 3,
              textTransform: 'uppercase', color: '#1a161260', marginBottom: 16,
            }}>Know what&apos;s in the bowl</div>

            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 800, color: '#1a1612',
              lineHeight: 1.05, marginBottom: 12, letterSpacing: -1.5,
            }}>
              What&apos;s really in<br />your dog&apos;s food?
            </h1>

            <p style={{
              fontSize: 17, color: '#1a161290', maxWidth: 440,
              lineHeight: 1.6, marginBottom: 36, fontWeight: 400,
            }}>
              Search any dog food brand. Get a clear breakdown of ingredients and nutrition — no fluff.
            </p>

            <SearchBox onSelect={handleSelect} variant="hero" />
          </div>
        </div>

        {/* Popular Brands */}
        <div style={{
          background: '#1a1612', borderRadius: '32px 32px 0 0',
          padding: '48px 40px 56px', animation: 'fadeUp 1s ease 0.3s both',
        }}>
          <div style={{
            fontSize: 12, fontWeight: 600, letterSpacing: 2.5,
            textTransform: 'uppercase', color: '#8a7e72', marginBottom: 24, textAlign: 'center',
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
