'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import SearchBox from './components/SearchBox';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [popular, setPopular] = useState([]);
  const router = useRouter();

  useEffect(() => {
    supabase
      .from('dog_foods')
      .select('id, name, brand, protein, image_url')
      .limit(6)
      .then(({ data }) => setPopular(data || []));
  }, []);

  function handleSelect(id) {
    router.push(`/food/${id}`);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(170deg, #f5d442 0%, #f0c930 45%, #e8c020 100%)',
        display: 'flex', flexDirection: 'column',
      }}>
        <nav style={{
          padding: '24px 40px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', animation: 'fadeIn 0.6s ease',
        }}>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800,
            color: '#1a1612', letterSpacing: -0.5, cursor: 'pointer',
          }}>
            kibble<span style={{ opacity: 0.4 }}>check</span>
          </div>
        </nav>

        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '0 24px 80px', animation: 'fadeUp 0.8s ease',
        }}>
          <div style={{
            fontSize: 13, fontWeight: 600, letterSpacing: 3,
            textTransform: 'uppercase', color: '#1a161260', marginBottom: 16,
          }}>Know what&apos;s in the bowl</div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 800, color: '#1a1612',
            textAlign: 'center', lineHeight: 1.05, marginBottom: 12,
            letterSpacing: -1.5, maxWidth: 700,
          }}>
            What&apos;s really in<br />your dog&apos;s food?
          </h1>

          <p style={{
            fontSize: 17, color: '#1a161290', maxWidth: 440, textAlign: 'center',
            lineHeight: 1.6, marginBottom: 40, fontWeight: 400,
          }}>
            Search any dog food brand. Get a clear breakdown of ingredients and nutrition — no fluff.
          </p>

          <SearchBox onSelect={handleSelect} variant="hero" />
        </div>

        {/* Popular */}
        <div style={{
          background: '#1a1612', borderRadius: '32px 32px 0 0',
          padding: '48px 40px 56px', animation: 'fadeUp 1s ease 0.3s both',
        }}>
          <div style={{
            fontSize: 12, fontWeight: 600, letterSpacing: 2.5,
            textTransform: 'uppercase', color: '#8a7e72', marginBottom: 24, textAlign: 'center',
          }}>Most searched</div>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 10,
            justifyContent: 'center', maxWidth: 700, margin: '0 auto',
          }}>
            {popular.map((f, i) => (
              <button key={f.id} onClick={() => handleSelect(f.id)}
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
              >{f.brand}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
