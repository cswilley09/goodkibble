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
        minHeight: '100vh',
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

        {/* Hero */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          animation: 'fadeUp 0.8s ease',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Kibble - absolutely positioned on the left */}
          <div style={{
            position: 'absolute',
            left: '4%',
            top: '50%',
            transform: 'translateY(-50%) rotate(-8deg)',
            width: '22%',
            maxWidth: 260,
            minWidth: 140,
          }}>
            <img
              src="/hero-kibble.png"
              alt="Kibble nutritional breakdown"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>

          {/* Labels - absolutely positioned, connected to kibble */}
          {/* These use percentage positioning so they scale with the viewport */}
          {[
            { text: 'PROTEIN', top: '8%', left: '2%', align: 'left' },
            { text: 'FAT', top: '28%', left: '28%', align: 'left' },
            { text: 'CARBS', top: '46%', left: '1%', align: 'left' },
            { text: 'FIBER', top: '65%', left: '29%', align: 'left' },
            { text: 'MOISTURE', top: '83%', left: '1%', align: 'left' },
          ].map((label) => (
            <div key={label.text} style={{
              position: 'absolute',
              top: label.top,
              left: label.left,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(11px, 1.1vw, 16px)',
              letterSpacing: '3px',
              color: '#1a1612',
              opacity: 0.6,
            }}>{label.text}</div>
          ))}

          {/* Right content - pushed to the right half */}
          <div style={{
            marginLeft: '42%',
            paddingRight: '6%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            maxWidth: 620,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 600, letterSpacing: 3,
              textTransform: 'uppercase', color: '#1a161250', marginBottom: 16,
            }}>Know what&apos;s in the bowl</div>

            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(36px, 5vw, 68px)', fontWeight: 800, color: '#1a1612',
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

            <div style={{ width: '100%', maxWidth: 520 }}>
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
