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
          {/* Left - Hero Graphic */}
          <div style={{
            width: 'clamp(280px, 30vw, 420px)',
            flexShrink: 0,
          }}>
            <svg viewBox="0 0 400 700" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
              {/* Connector lines */}
              <g stroke="#1a161230" strokeWidth="1.5" strokeDasharray="6 4">
                <path d="M120 100 L60 80 L20 80" />
                <circle cx="120" cy="100" r="3" fill="#1a161240" />
                <path d="M280 220 L340 220 L380 200" />
                <circle cx="280" cy="220" r="3" fill="#1a161240" />
                <path d="M120 360 L40 360 L20 340" />
                <circle cx="120" cy="360" r="3" fill="#1a161240" />
                <path d="M280 480 L350 480 L380 460" />
                <circle cx="280" cy="480" r="3" fill="#1a161240" />
                <path d="M140 610 L60 630 L20 630" />
                <circle cx="140" cy="610" r="3" fill="#1a161240" />
              </g>
              {/* Labels */}
              <text x="18" y="68" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="20" letterSpacing="3" fill="#1a1612">PROTEIN</text>
              <text x="378" y="190" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="20" letterSpacing="3" fill="#1a1612" textAnchor="end">FAT</text>
              <text x="18" y="328" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="20" letterSpacing="3" fill="#1a1612">CARBS</text>
              <text x="378" y="450" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="20" letterSpacing="3" fill="#1a1612" textAnchor="end">FIBER</text>
              <text x="18" y="622" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="20" letterSpacing="3" fill="#1a1612">MOISTURE</text>
              {/* Kibble pieces */}
              <ellipse cx="200" cy="120" rx="70" ry="55" fill="#a07840" />
              <ellipse cx="200" cy="115" rx="68" ry="50" fill="#b8884d" />
              <ellipse cx="195" cy="110" rx="55" ry="38" fill="#c49558" />
              <path d="M150 120 Q175 90 220 105 Q240 115 250 130" fill="#a07840" opacity="0.4" />
              <ellipse cx="210" cy="240" rx="75" ry="58" fill="#9a7038" />
              <ellipse cx="210" cy="235" rx="72" ry="53" fill="#b08045" />
              <ellipse cx="205" cy="230" rx="58" ry="40" fill="#c08f52" />
              <path d="M155 245 Q185 215 230 228 Q255 238 265 255" fill="#9a7038" opacity="0.4" />
              <ellipse cx="195" cy="370" rx="90" ry="72" fill="#8e6832" />
              <ellipse cx="195" cy="364" rx="87" ry="67" fill="#a87a42" />
              <ellipse cx="190" cy="358" rx="72" ry="52" fill="#bc8e50" />
              <path d="M130 375 Q170 340 220 355 Q255 365 265 385" fill="#8e6832" opacity="0.4" />
              <ellipse cx="215" cy="495" rx="72" ry="55" fill="#96733a" />
              <ellipse cx="215" cy="490" rx="69" ry="50" fill="#ad844a" />
              <ellipse cx="210" cy="485" rx="55" ry="37" fill="#c09255" />
              <path d="M165 500 Q190 475 230 485 Q250 495 260 510" fill="#96733a" opacity="0.4" />
              <ellipse cx="190" cy="610" rx="65" ry="50" fill="#a07840" />
              <ellipse cx="190" cy="606" rx="62" ry="46" fill="#b58a4c" />
              <ellipse cx="186" cy="601" rx="50" ry="34" fill="#c89858" />
              <path d="M145 615 Q168 590 210 600 Q230 608 240 622" fill="#a07840" opacity="0.4" />
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
