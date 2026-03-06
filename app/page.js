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
        background: 'linear-gradient(170deg, #f5d442 0%, #f0c930 45%, #e8c020 100%)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Nav */}
        <nav style={{ padding: '24px 48px', animation: 'fadeIn 0.6s ease' }}>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800,
            color: '#1a1612', letterSpacing: -0.5,
          }}>
            Good<span style={{ opacity: 0.4 }}>Kibble</span>
          </div>
        </nav>

        {/* Hero - two column */}
        <div style={{
          display: 'flex', alignItems: 'center',
          maxWidth: 1100, width: '100%', margin: '0 auto',
          padding: '40px 48px 60px',
          gap: 60,
          animation: 'fadeUp 0.8s ease',
        }}>
          {/* Left column - kibble with labels */}
          <div style={{
            width: 320, flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <div style={{
              position: 'relative',
              transform: 'rotate(-8deg)',
            }}>
              <img
                src="/hero-kibble.png"
                alt="Kibble nutritional breakdown"
                style={{ width: 130, height: 'auto', display: 'block' }}
              />
              {/* Labels - counter-rotate so text reads straight */}
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                transform: 'rotate(8deg)',
              }}>
                {/* PROTEIN - left, piece 1 mid=8.3%, left edge=9.1% → needs short line */}
                <div style={{
                  position: 'absolute', top: '6%', right: '91%',
                  display: 'flex', alignItems: 'center', gap: 0,
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                  fontSize: 13, letterSpacing: '2.5px', color: '#1a1612', whiteSpace: 'nowrap',
                }}>
                  PROTEIN
                  <span style={{ display: 'inline-block', width: 12, height: 0, borderTop: '1.5px dashed #1a161250', marginLeft: 6 }} />
                </div>

                {/* FAT - right, piece 2 mid=27.1%, right edge=92.4% → needs short line */}
                <div style={{
                  position: 'absolute', top: '25%', left: '92%',
                  display: 'flex', alignItems: 'center', gap: 0,
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                  fontSize: 13, letterSpacing: '2.5px', color: '#1a1612', whiteSpace: 'nowrap',
                }}>
                  <span style={{ display: 'inline-block', width: 12, height: 0, borderTop: '1.5px dashed #1a161250', marginRight: 6 }} />
                  FAT
                </div>

                {/* CARBS - left, piece 3 mid=48.1%, left edge=3.8% → kibble almost touches edge, very short line */}
                <div style={{
                  position: 'absolute', top: '46%', right: '96%',
                  display: 'flex', alignItems: 'center', gap: 0,
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                  fontSize: 13, letterSpacing: '2.5px', color: '#1a1612', whiteSpace: 'nowrap',
                }}>
                  CARBS
                  <span style={{ display: 'inline-block', width: 6, height: 0, borderTop: '1.5px dashed #1a161250', marginLeft: 6 }} />
                </div>

                {/* FIBER - right, piece 4 mid=72%, right edge=94.3% → short line */}
                <div style={{
                  position: 'absolute', top: '70%', left: '94%',
                  display: 'flex', alignItems: 'center', gap: 0,
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                  fontSize: 13, letterSpacing: '2.5px', color: '#1a1612', whiteSpace: 'nowrap',
                }}>
                  <span style={{ display: 'inline-block', width: 8, height: 0, borderTop: '1.5px dashed #1a161250', marginRight: 6 }} />
                  FIBER
                </div>

                {/* MOISTURE - left, piece 5 mid=91.5%, left edge=10.3% → needs short line */}
                <div style={{
                  position: 'absolute', top: '90%', right: '90%',
                  display: 'flex', alignItems: 'center', gap: 0,
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                  fontSize: 13, letterSpacing: '2.5px', color: '#1a1612', whiteSpace: 'nowrap',
                }}>
                  MOISTURE
                  <span style={{ display: 'inline-block', width: 12, height: 0, borderTop: '1.5px dashed #1a161250', marginLeft: 6 }} />
                </div>
              </div>
            </div>
          </div>

          {/* Right column - text + search */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, letterSpacing: 3,
              textTransform: 'uppercase', color: '#1a161250', marginBottom: 16,
            }}>Know what&apos;s in the bowl</div>

            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(36px, 4.5vw, 64px)', fontWeight: 800, color: '#1a1612',
              lineHeight: 1.02, marginBottom: 20, letterSpacing: -2,
            }}>
              What&apos;s really in<br />your dog&apos;s food?
            </h1>

            <p style={{
              fontSize: 17, color: '#1a161280', maxWidth: 440,
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
