'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBox from '../components/SearchBox';
import CompareBubble from '../components/CompareBubble';

/* ── Score tier colors ── */
const TIER_COLORS = {
  excellent: '#639922',
  veryGood: '#639922',
  good: '#1D9E75',
  adequate: '#EF9F27',
  belowAvg: '#D85A30',
  concerning: '#A32D2D',
};

const CAT_COLORS = {
  protein: '#639922',
  fat: '#EF9F27',
  carbs: '#378ADD',
  fiber: '#7F77DD',
  teal: '#1D9E75',
};

/* ── Expandable category section ── */
function CategoryDetail({ color, name, maxPts, type, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid #ede8df' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '18px 0', border: 'none', background: 'none', cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif", textAlign: 'left',
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1612' }}>{name}</span>
          <span style={{ fontSize: 13, color: '#b5aa99', marginLeft: 8 }}>{maxPts} pts</span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
          color: type === 'Nutrition' ? '#639922' : '#1D9E75',
          padding: '3px 10px', borderRadius: 100,
          background: type === 'Nutrition' ? '#e8f5ee' : '#e1f5ee',
        }}>{type}</span>
        <span style={{ fontSize: 14, color: '#b5aa99', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 8 }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: '0 0 28px 22px', animation: 'fadeIn 0.2s ease' }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Simple table component ── */
function ThresholdTable({ headers, rows }) {
  return (
    <div style={{ overflowX: 'auto', margin: '16px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #ede8df', color: '#8a7e72', fontWeight: 600, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#faf8f5' : '#fff' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '8px 12px', borderBottom: '1px solid #f0ebe3', color: j === 0 ? '#1a1612' : '#5a5248', fontWeight: j === 1 ? 600 : 400, fontFamily: j === 1 ? "'DM Sans', sans-serif" : 'inherit' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Citation text ── */
function Citations({ text }) {
  return <p style={{ fontSize: 11, color: '#b5aa99', fontStyle: 'italic', marginTop: 12, lineHeight: 1.5 }}>{text}</p>;
}

/* ── Paragraph helper ── */
function P({ children }) {
  return <p style={{ fontSize: 14, color: '#5a5248', lineHeight: 1.7, marginBottom: 12 }}>{children}</p>;
}

/* ── Glance bar ── */
function GlanceBar({ label, pts, max, color }) {
  const pct = (pts / max) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <div style={{ width: 130, fontSize: 13, color: '#5a5248', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 24, background: '#EDEAE2', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>{pts}</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#b5aa99', fontFamily: "'DM Sans', sans-serif", minWidth: 28, textAlign: 'right' }}>/{max}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* MAIN PAGE                                   */
/* ═══════════════════════════════════════════ */
export default function HowWeScorePage() {
  const router = useRouter();
  const goHome = () => router.push('/');
  const goFood = (food) => {
    if (food?.brand_slug && food?.slug) router.push(`/dog-food/${food.brand_slug}/${food.slug}`);
    else router.push(`/food/${food?.id || food}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5' }}>
      {/* Nav */}
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

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* ─── Section 1: Hero ─── */}
        <div style={{ marginBottom: 56, animation: 'fadeUp 0.5s ease' }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 12 }}>Methodology</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: '#1a1612',
            lineHeight: 1.1, letterSpacing: -1, marginBottom: 16,
          }}>How we score dog food</h1>
          <p style={{ fontSize: 17, color: '#5a5248', lineHeight: 1.6, maxWidth: 600, marginBottom: 16 }}>
            We built a scoring system to answer one question: how does this dog food actually stack up? Here&apos;s exactly how it works — the science we relied on, the choices we made, and where we drew the line.
          </p>
          <span style={{
            display: 'inline-block', padding: '5px 14px', borderRadius: 100,
            background: '#f0ebe3', fontSize: 12, color: '#8a7e72', fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
          }}>Methodology v1.3 · Last updated March 2026</span>
        </div>

        {/* ─── Section 2: Principles ─── */}
        <div style={{ marginBottom: 56 }}>
          <div className="principles-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16,
          }}>
            {[
              { n: '01', title: 'Label data only', desc: "We score what's on the bag — the guaranteed analysis and ingredient list. Nothing we can't verify." },
              { n: '02', title: 'Research backed', desc: 'Every scoring threshold is anchored to AAFCO standards, NRC guidelines, or peer-reviewed studies.' },
              { n: '03', title: 'No brand deals', desc: "We don't accept money, free products, or any form of compensation from pet food companies." },
              { n: '04', title: 'Fully transparent', desc: 'This page explains every factor, every threshold, every citation. Nothing is hidden or proprietary.' },
            ].map((p) => (
              <div key={p.n} style={{
                padding: '24px', borderRadius: 20, border: '1px solid #ede8df', background: '#fff',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: '#f0ebe3',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#8a7e72', marginBottom: 12,
                  fontFamily: "'DM Sans', sans-serif",
                }}>{p.n}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1612', marginBottom: 6 }}>{p.title}</div>
                <div style={{ fontSize: 13, color: '#8a7e72', lineHeight: 1.5 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Section 2b: Two Layers ─── */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1612', marginBottom: 8 }}>Two layers, clearly separated</h2>
          <p style={{ fontSize: 14, color: '#5a5248', lineHeight: 1.7, marginBottom: 20 }}>
            Throughout this methodology, we separate two distinct layers. We will never blur them.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={{ padding: '24px', borderRadius: 20, border: '2px solid #1D9E75', background: '#fff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#1D9E75', marginBottom: 8 }}>Layer 1 — Verified facts</div>
              <p style={{ fontSize: 14, color: '#5a5248', lineHeight: 1.6, margin: 0 }}>
                Regulatory standards, published research findings, and labeling rules that any veterinarian or nutritionist can independently verify. These are cited with specific sources.
              </p>
            </div>
            <div style={{ padding: '24px', borderRadius: 20, border: '2px solid #EF9F27', background: '#fff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#C8A415', marginBottom: 8 }}>Layer 2 — Scoring design</div>
              <p style={{ fontSize: 14, color: '#5a5248', lineHeight: 1.6, margin: 0 }}>
                The specific brackets, point values, and weightings that GoodKibble uses to translate verified facts into a numerical score. These are informed by — but not directly derived from — the scientific literature.
              </p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#8a7e72', lineHeight: 1.6, marginTop: 16 }}>
            When we state a fact, it is cited. When we make a scoring decision, we say so. The scoring brackets should be interpreted as a comparative ranking system, not clinical recommendations.
          </p>
        </div>

        {/* ─── Section 2b: Why Dry Matter Basis? ─── */}
        <div style={{ marginBottom: 56, background: '#fff', borderRadius: 24, border: '1px solid #ede8df', padding: '36px 32px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1612', marginBottom: 8, textAlign: 'center' }}>Why Dry Matter Basis?</h2>
          <p style={{ fontSize: 14, color: '#8a7e72', lineHeight: 1.6, marginBottom: 32, textAlign: 'center', maxWidth: 560, margin: '0 auto 32px' }}>
            The guaranteed analysis on the bag includes moisture. We remove it so you see the real nutrition.
          </p>

          {/* Flow boxes */}
          <div className="dmb-flow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            {/* Box 1 — Label says */}
            <div style={{ flex: '1 1 0', maxWidth: 200, background: '#f5f2ec', border: '1px solid #ede8df', borderRadius: 16, padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#8a7e72', marginBottom: 8 }}>Label says</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: '#8a7e72', lineHeight: 1 }}>26%</div>
              <div style={{ fontSize: 12, color: '#8a7e72', marginTop: 6 }}>protein</div>
            </div>

            <span className="dmb-arrow" style={{ fontSize: 20, color: '#b5aa99', flexShrink: 0 }}>&rarr;</span>

            {/* Box 2 — Remove moisture */}
            <div style={{ flex: '1 1 0', maxWidth: 200, background: '#e8f1fb', border: '1px solid #c4d9f0', borderRadius: 16, padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#378ADD', marginBottom: 8 }}>Remove moisture</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: '#378ADD', lineHeight: 1 }}>10%</div>
              <div style={{ fontSize: 12, color: '#8a7e72', marginTop: 6 }}>water content</div>
            </div>

            <span className="dmb-arrow" style={{ fontSize: 20, color: '#b5aa99', flexShrink: 0 }}>&rarr;</span>

            {/* Box 3 — Real nutrition */}
            <div style={{ flex: '1 1 0', maxWidth: 200, background: '#eef5e4', border: '1px solid #c8e0a8', borderRadius: 16, padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#639922', marginBottom: 8 }}>Real nutrition</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: '#639922', lineHeight: 1 }}>28.9%</div>
              <div style={{ fontSize: 12, color: '#8a7e72', marginTop: 6 }}>DMB protein</div>
            </div>
          </div>

          {/* Equation bar */}
          <div style={{ background: '#f5f2ec', borderRadius: 12, padding: '16px 20px', textAlign: 'center', fontSize: 16, fontWeight: 600, color: '#3d352b' }}>
            26% protein <span style={{ color: '#b5aa99' }}>&divide;</span> (100% <span style={{ color: '#b5aa99' }}>&minus;</span> 10% moisture) <span style={{ color: '#b5aa99' }}>=</span>{' '}
            <span style={{ color: '#639922', fontWeight: 800, fontSize: 18 }}>28.9% DMB</span>
          </div>

          <style>{`
            @media (max-width: 600px) {
              .dmb-flow { flex-direction: column !important; }
              .dmb-flow > div { max-width: 100% !important; }
              .dmb-arrow { transform: rotate(90deg); }
            }
          `}</style>
        </div>

        {/* ─── Section 3: Score at a Glance ─── */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1612', marginBottom: 8 }}>The score at a glance</h2>
          <p style={{ fontSize: 14, color: '#8a7e72', lineHeight: 1.6, marginBottom: 24 }}>
            Every dry kibble is scored 0–100 across eight categories. The first four measure nutritional content from the guaranteed analysis. The last four evaluate ingredient quality from the ingredient list.
          </p>
          <div style={{ padding: '28px 32px', background: '#fff', borderRadius: 20, border: '1px solid #ede8df' }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 12 }}>Nutrition</div>
            <GlanceBar label="Protein" pts={25} max={25} color={CAT_COLORS.protein} />
            <GlanceBar label="Fat" pts={15} max={15} color={CAT_COLORS.fat} />
            <GlanceBar label="Carbohydrates" pts={15} max={15} color={CAT_COLORS.carbs} />
            <GlanceBar label="Fiber" pts={5} max={5} color={CAT_COLORS.fiber} />
            <div style={{ height: 1, background: '#ede8df', margin: '16px 0' }} />
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 12 }}>Ingredients</div>
            <GlanceBar label="Protein sources" pts={15} max={15} color={CAT_COLORS.teal} />
            <GlanceBar label="Preservatives" pts={10} max={10} color={CAT_COLORS.teal} />
            <GlanceBar label="Additives" pts={5} max={5} color={CAT_COLORS.teal} />
            <GlanceBar label="Functional" pts={10} max={10} color={CAT_COLORS.teal} />
            <div style={{ textAlign: 'right', fontSize: 12, color: '#8a7e72', marginTop: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Total: 100 points</div>
          </div>
        </div>

        {/* ─── Section 4: What the Scores Mean ─── */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1612', marginBottom: 8 }}>What the scores mean</h2>
          <div style={{ padding: '24px 28px', background: '#fff', borderRadius: 20, border: '1px solid #ede8df', marginTop: 16 }}>
            {[
              { range: '90–100', label: 'Excellent', color: TIER_COLORS.excellent, desc: 'Exceeds standards across all categories' },
              { range: '80–89', label: 'Very good', color: TIER_COLORS.veryGood, desc: 'Strong profile with minor gaps' },
              { range: '70–79', label: 'Good', color: TIER_COLORS.good, desc: 'Meets AAFCO standards with favorable ingredients' },
              { range: '60–69', label: 'Adequate', color: TIER_COLORS.adequate, desc: 'Meets minimums, room for improvement' },
              { range: '50–59', label: 'Below average', color: TIER_COLORS.belowAvg, desc: 'Notable ingredient or nutritional concerns' },
              { range: 'Below 50', label: 'Concerning', color: TIER_COLORS.concerning, desc: 'Below AAFCO minimums or significant concerns' },
            ].map((tier, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0',
                borderBottom: i < 5 ? '1px solid #f0ebe3' : 'none',
              }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: tier.color, minWidth: 60 }}>{tier.range}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: tier.color, minWidth: 110 }}>{tier.label}</div>
                <div style={{ fontSize: 13, color: '#8a7e72', flex: 1 }}>{tier.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Section 5: Category Details ─── */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1612', marginBottom: 8 }}>Category details</h2>
          <p style={{ fontSize: 14, color: '#8a7e72', marginBottom: 20 }}>Click any category to see the exact thresholds and the science behind them.</p>

          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #ede8df', padding: '0 28px' }}>

            {/* A — Protein */}
            <CategoryDetail color={CAT_COLORS.protein} name="Protein" maxPts={25} type="Nutrition">
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#1D9E75', marginBottom: 8 }}>What the science establishes</div>
              <P>AAFCO requires a minimum of 18% protein (dry matter basis) for adult dogs and 22.5% for puppies. NRC confirms dogs require 10 indispensable amino acids and that no maximum protein level has been established — there is insufficient data to demonstrate harmful effects of high protein in healthy dogs.</P>
              <P>Dogs do not have a requirement for &quot;protein per se&quot; but rather for indispensable amino acids. This category measures crude protein quantity. Category E separately evaluates where that protein comes from — because quantity without quality is an incomplete picture.</P>
              <P>What the science does NOT establish: an optimal protein percentage for healthy adult dogs. The literature defines a floor but no evidence-based ceiling or &quot;sweet spot.&quot;</P>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#C8A415', margin: '16px 0 8px' }}>How we score (design choices)</div>
              <P>Scores increase as protein exceeds AAFCO minimums. Because no upper optimal threshold is established, the upper tiers are a design choice to differentiate between baseline adequacy and higher-protein formulations.</P>
              <ThresholdTable
                headers={['Range (DMB)', 'Points', 'Rationale']}
                rows={[
                  ['40%+', '25', 'Above minimum — design choice'],
                  ['35–39.9%', '23', 'Above minimum — design choice'],
                  ['30–34.9%', '20', 'Above minimum — design choice'],
                  ['26–29.9%', '16', 'Above minimum — design choice'],
                  ['22–25.9%', '12', 'Meets AAFCO growth minimum'],
                  ['18–21.9%', '8', 'Meets AAFCO adult minimum'],
                  ['Below 18%', '0', 'Below AAFCO minimum'],
                ]}
              />
              <Citations text="AAFCO Dog Food Nutrient Profiles, 2016; NRC, 2006 (Ch. 5); Templeman & Shoveller, 2022, Journal of Animal Science, 100(11):skac279" />
            </CategoryDetail>

            {/* B — Fat */}
            <CategoryDetail color={CAT_COLORS.fat} name="Fat" maxPts={15} type="Nutrition">
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#1D9E75', marginBottom: 8 }}>What the science establishes</div>
              <P>AAFCO requires a minimum of 5.5% fat for adult dogs and 8.5% for puppies. Fat provides essential fatty acids, carries fat-soluble vitamins, and is the most concentrated dietary energy source (~8.5 kcal/g). No maximum for total fat is established.</P>
              <P>What the science does NOT establish: an optimal fat percentage, a &quot;safe upper limit,&quot; or an evidence-based fat-to-protein ratio for healthy adult dogs.</P>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#C8A415', margin: '16px 0 8px' }}>How we score (design choices)</div>
              <P>Fat is scored in two parts: absolute level and fat-to-protein ratio. All thresholds are design choices. The 20% upper boundary for full points reflects that high-protein kibbles using whole-animal ingredients typically contain 16–20% fat as a natural compositional consequence.</P>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8a7e72', marginTop: 8, marginBottom: 4 }}>Fat level (8 points)</div>
              <ThresholdTable
                headers={['Range (DMB)', 'Points']}
                rows={[
                  ['13.0–20.0%', '8'],
                  ['20.1–24.0%', '6'],
                  ['8.5–12.9%', '5'],
                  ['5.5–8.4%', '3'],
                  ['Above 24.0%', '4'],
                  ['Below 5.5%', '0'],
                ]}
              />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8a7e72', marginTop: 8, marginBottom: 4 }}>Fat-to-protein ratio (7 points)</div>
              <ThresholdTable
                headers={['Ratio', 'Points']}
                rows={[
                  ['0.40–0.75', '7'],
                  ['0.30–0.39 or 0.76–0.85', '5'],
                  ['Below 0.30 or 0.86–1.00', '3'],
                  ['Above 1.00', '1'],
                ]}
              />
              <Citations text="AAFCO, 2016; NRC, 2006; Xenoulis & Steiner, 2010, The Veterinary Journal, 183(1):12-21" />
            </CategoryDetail>

            {/* C — Carbohydrates */}
            <CategoryDetail color={CAT_COLORS.carbs} name="Carbohydrates" maxPts={15} type="Nutrition">
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#1D9E75', marginBottom: 8 }}>What the science establishes</div>
              <P>Dogs have no established nutritional requirement for dietary carbohydrates (NRC, 2006). Dogs can synthesize glucose via gluconeogenesis from amino acids and glycerol. Starch is needed for kibble extrusion — it&apos;s a manufacturing necessity, not a nutritional one.</P>
              <P>Research shows dietary protein-to-carbohydrate ratio impacts gut microbial composition in dogs, with more pronounced effects in obese dogs (Li et al., 2017). However, the study demonstrates microbial shifts, not clinical health outcomes.</P>
              <P>What the science does NOT establish: a specific carbohydrate percentage above which health is impaired in healthy dogs.</P>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#C8A415', margin: '16px 0 8px' }}>How we score (design choices)</div>
              <P>Lower carbohydrate scores higher based on the macronutrient displacement principle: higher protein and fat necessarily displace carbohydrates. Since dogs have no carbohydrate requirement, this rewards formulations that prioritize nutrients dogs do require. All bracket cutoffs are design choices based on our database distribution.</P>
              <ThresholdTable
                headers={['Range (DMB)', 'Points', 'Rationale']}
                rows={[
                  ['Below 20%', '15', 'Lowest carb tier — design choice'],
                  ['20–29.9%', '12', 'Low carb — design choice'],
                  ['30–39.9%', '10', 'Moderate — where most mid-range kibbles fall'],
                  ['40–49.9%', '5', 'High carb — design choice'],
                  ['50%+', '1', 'Very high — top of observed range'],
                ]}
              />
              <div style={{ padding: '10px 14px', borderRadius: 10, background: '#faf8f5', fontSize: 12, color: '#8a7e72', lineHeight: 1.5, marginTop: 8 }}>
                <strong>Note:</strong> Carbohydrate on GoodKibble is calculated as: 100 − protein − fat − fiber − ash (all dry matter basis). When ash is not provided by the manufacturer, we use a sliding default: 7% for products under 30% protein DMB, 8% for 30–39.9%, 9% for 40%+.
              </div>
              <Citations text="NRC, 2006 (Ch. 3); Li et al., 2017, mBio, 8(1):e01703-16; Carciofi et al., 2008, JAPN, 92(3):326-336" />
            </CategoryDetail>

            {/* D — Fiber */}
            <CategoryDetail color={CAT_COLORS.fiber} name="Fiber" maxPts={5} type="Nutrition">
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#1D9E75', marginBottom: 8 }}>What the science establishes</div>
              <P>No minimum dietary requirement for crude fiber is established for dogs (NRC, 2006). Soluble fiber is fermented by gut bacteria to produce short-chain fatty acids that support intestinal health (Swanson et al., 2002).</P>
              <P>What the science does NOT establish: an optimal crude fiber range for healthy adult dogs. No study defines a specific fiber percentage as superior to another.</P>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#C8A415', margin: '16px 0 8px' }}>How we score (design choices)</div>
              <P>This category functions as a formulation quality signal, not a nutritional adequacy measure. No regulatory anchors exist. The moderate range (4–7%) represents the most common range in well-formulated general-purpose kibbles in our database. The entire category is a design choice.</P>
              <ThresholdTable
                headers={['Range (DMB)', 'Points', 'Rationale']}
                rows={[
                  ['4.0–6.9%', '5', 'Moderate range — design choice'],
                  ['2.0–3.9%', '4', 'Low but functional — design choice'],
                  ['7.0–9.9%', '3', 'Elevated — design choice'],
                  ['Below 2.0%', '2', 'Very low — design choice'],
                  ['10.0%+', '1', 'Very high — design choice'],
                ]}
              />
              <Citations text="NRC, 2006; Swanson et al., 2002, Journal of Nutrition, 132(6):1717S-1722S" />
            </CategoryDetail>

            {/* E — Protein Sources */}
            <CategoryDetail color={CAT_COLORS.teal} name="Protein sources" maxPts={15} type="Ingredients">
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#1D9E75', marginBottom: 8 }}>What the science establishes</div>
              <P>FDA requires ingredients listed in descending order by weight. AAFCO defines specific terms: &quot;chicken&quot; means clean flesh; &quot;chicken meal&quot; means rendered and dried; generic terms like &quot;meat meal&quot; indicate unspecified sources that may vary between batches.</P>
              <P>Animal-sourced ingredients have significantly higher protein quality scores than plant-sourced ingredients (Templeman &amp; Shoveller, 2022). Fresh chicken provided the highest protein quality without amino acid supplementation, while chicken by-product meal had the lowest digestibility (Sieja, Oba et al., 2023). Plant protein concentrates are typically limiting in methionine, taurine, and lysine relative to animal proteins (Case et al., 2011).</P>
              <P>What the science does NOT establish: a point-value system for ranking ingredients by position, or a specific threshold for how many plant protein concentrates constitute a concern.</P>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#C8A415', margin: '16px 0 8px' }}>How we score (design choices)</div>
              <P>Named animal protein sources are rewarded over generic terms based on the ingredient transparency principle. The plant protein concentrate penalty targets ingredients whose amino acid limitations are documented — and where consumers cannot determine from the label whether amino acids have been supplemented.</P>
              <ThresholdTable
                headers={['Component', 'Points']}
                rows={[
                  ['First animal protein: named', '5'],
                  ['First animal protein: generic', '1'],
                  ['Second animal protein: named', '3'],
                  ['Second animal protein: generic', '1'],
                  ['Third+ animal protein in top 5', '2'],
                  ['No by-products', '5'],
                  ['Named by-products only', '3'],
                  ['Generic by-products', '0'],
                  ['Splitting penalty (if detected)', '−3'],
                  ['Plant concentrate penalty (if 2+ in top 10)', '−2'],
                ]}
              />
              <Citations text="FDA 21 CFR 501.4; AAFCO ingredient definitions; Case et al., 2011; Templeman & Shoveller, 2022, JAS, 100(11):skac279; Sieja, Oba et al., 2023, JAS, 101:skad093" />
            </CategoryDetail>

            {/* F — Preservatives */}
            <CategoryDetail color={CAT_COLORS.teal} name="Preservatives" maxPts={10} type="Ingredients">
              <P>Some dog foods use synthetic chemical preservatives — specifically BHA, BHT, and ethoxyquin — to prevent fats from going rancid. These compounds have been flagged by multiple regulatory bodies.</P>
              <P>BHA is listed by the National Institutes of Health as &quot;reasonably anticipated to be a human carcinogen.&quot; BHT has been banned in human food in several countries. Ethoxyquin is registered by the EPA as a pesticide and is not permitted in human food in the United States.</P>
              <P>Natural alternatives — like mixed tocopherols (vitamin E) and rosemary extract — are widely available and have no comparable safety concerns.</P>
              <P>In the interest of transparency: a 2024 review by researcher A.C. Beynen concluded that &quot;there is no convincing evidence that these antioxidants, at regular contents in dry dog food, are harmful.&quot; The debate over their safety at permitted levels is ongoing. Our scoring reflects the weight of regulatory concern signals from multiple international agencies, not a definitive finding of harm.</P>
              <ThresholdTable
                headers={['Status', 'Points']}
                rows={[
                  ['No synthetic preservatives — natural alternatives only', '10'],
                  ['Contains one synthetic preservative', '6'],
                  ['Contains two or more', '2'],
                ]}
              />
              <Citations text="NTP Report on Carcinogens, 15th Ed., 2021; EFSA FEEDAP Panel, 2018; Vorhees et al., 1981; Beynen, 2024" />
            </CategoryDetail>

            {/* G — Additives */}
            <CategoryDetail color={CAT_COLORS.teal} name="Additives" maxPts={5} type="Ingredients">
              <P>Artificial colors serve no nutritional purpose in dog food. Dogs have dichromatic vision — they don&apos;t choose food based on color. Dyes like Red 40, Yellow 5, and Blue 2 are added to make the food look appealing to the human buying it, not the dog eating it.</P>
              <P>Artificial flavors similarly indicate synthetic flavor enhancement rather than flavor derived from actual food ingredients.</P>
              <ThresholdTable
                headers={['Status', 'Points']}
                rows={[
                  ['No artificial colors or flavors', '5'],
                  ['Artificial flavors only', '3'],
                  ['Artificial colors (with or without flavors)', '0'],
                ]}
              />
              <Citations text="Miller & Murphy, 1995, Journal of the American Veterinary Medical Association" />
            </CategoryDetail>

            {/* H — Functional Ingredients */}
            <CategoryDetail color={CAT_COLORS.teal} name="Functional ingredients" maxPts={10} type="Ingredients">
              <P>Some ingredients provide specific health benefits beyond basic nutrition — like probiotics for gut health, fish oil for anti-inflammatory omega-3 fatty acids, glucosamine for joint support, and chelated minerals for better nutrient absorption.</P>
              <P>We only award points for functional ingredients that appear before salt in the ingredient list. Salt typically sits at roughly the 1% mark in dog food formulations — anything listed after it is present in very small amounts that may not provide a meaningful dose.</P>
              <P>One important nuance: kibble is manufactured at very high temperatures that kill most probiotic cultures. Unless the manufacturer guarantees live cultures (CFU count) in the guaranteed analysis, we award reduced points for listed probiotics.</P>
              <ThresholdTable
                headers={['Ingredient', 'Points', 'Condition']}
                rows={[
                  ['Probiotics (named strains)', '2', 'Listed before salt'],
                  ['Probiotics with CFU guarantee', '3', 'GA includes live culture count'],
                  ['Omega-3 source (fish oil, flaxseed, etc.)', '3', 'Listed before salt'],
                  ['Glucosamine / chondroitin', '2', 'Listed before salt'],
                  ['Chelated minerals (proteinates, chelates)', '2', 'Listed before salt'],
                  ['Maximum', '10', ''],
                ]}
              />
              <div style={{ padding: '10px 14px', borderRadius: 10, background: '#faf8f5', fontSize: 12, color: '#8a7e72', lineHeight: 1.5, marginTop: 8 }}>
                <strong>Note on copper:</strong> Chelated copper is included in the mineral scoring. However, certain breeds (Labrador Retrievers, Doberman Pinschers, Bedlington Terriers) are predisposed to Copper Storage Hepatopathy. Owners of these breeds should consult their veterinarian about dietary copper.
              </div>
              <Citations text="Schmitz & Suchodolski, 2016; Bauer, 2011, JAVMA; McCarthy et al., 2007, Veterinary Record; Wedekind et al., 2010" />
            </CategoryDetail>
          </div>
        </div>

        {/* ─── Section 6: Limitations ─── */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1612', marginBottom: 8 }}>What this score doesn&apos;t tell you</h2>
          <p style={{ fontSize: 14, color: '#8a7e72', marginBottom: 20 }}>Being honest about our limitations is part of being trustworthy.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { title: "Whether this food is right for YOUR dog.", desc: "Dogs with kidney disease, allergies, pancreatitis, or other conditions may need foods that intentionally score lower on this scale. Prescription diets are formulated for medical purposes — a low score doesn't mean they're bad, it means they're specialized. Always consult your veterinarian." },
              { title: "Ingredient sourcing quality.", desc: "Two foods listing \"chicken meal\" may source it from very different supply chains. We can't see behind the label." },
              { title: "Manufacturing quality.", desc: "We don't evaluate factory conditions, batch testing, or quality control processes." },
              { title: "Digestibility.", desc: "The guaranteed analysis shows crude nutrient levels, not how much your dog actually absorbs. Actual digestibility depends on the ingredient form, how it's processed, and your individual dog." },
              { title: "Feeding trial results.", desc: "AAFCO feeding trials — where dogs are actually fed the food and monitored — are considered a higher standard than laboratory analysis alone. Our score complements but does not replace clinical evidence from feeding trials." },
              { title: "Recall history.", desc: "Past recalls are tracked separately on GoodKibble and are not factored into the score." },
              { title: "Caloric density.", desc: "A high-scoring food can still be calorically dense. Always monitor your dog's body condition and adjust portions accordingly." },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#fce8e8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: '#A32D2D', fontWeight: 700, flexShrink: 0, marginTop: 2,
                }}>✕</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1612', marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: '#8a7e72', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Section 7: Our Commitment ─── */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1612', marginBottom: 16 }}>A living methodology</h2>
          <P>The GoodKibble Score is not a static formula written once and forgotten. Veterinary nutrition is an evolving field, and our methodology evolves with it.</P>
          <P>Every scoring threshold is reviewed when relevant new peer-reviewed research is published. When we update the methodology, every product in our database is rescored under the new version so all scores remain directly comparable. Previous versions are archived and documented below.</P>
          <P>We are actively working with veterinary nutrition professionals to review and strengthen this methodology. If you are a veterinary professional and would like to provide feedback, we welcome your input.</P>

          <div style={{ marginTop: 20, padding: '20px 24px', background: '#fff', borderRadius: 16, border: '1px solid #ede8df' }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 12 }}>Version history</div>
            {[
              { v: 'v1.3 (current)', desc: 'Separated verified facts (Layer 1) from scoring design (Layer 2). Removed Kealy (2002) — study is about caloric restriction, not protein. Corrected Carciofi and Xenoulis journal references. Added Templeman & Shoveller (2022) and Sieja/Oba (2023) to protein sources.' },
              { v: 'v1.2', desc: 'Plant protein concentrate detection added. Fat threshold adjusted based on full-database validation.' },
              { v: 'v1.1', desc: 'Sliding ash defaults, ingredient splitting detection, probiotic viability adjustment, preservative threshold refinement.' },
              { v: 'v1.0', desc: 'Initial methodology.' },
            ].map((ver, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: i < 3 ? '1px solid #f0ebe3' : 'none' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1612', minWidth: 100, fontFamily: "'DM Sans', sans-serif" }}>{ver.v}</div>
                <div style={{ fontSize: 12, color: '#8a7e72' }}>{ver.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Section 9: References ─── */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1612', marginBottom: 16 }}>References</h2>
          <div style={{ fontSize: 12, color: '#8a7e72', lineHeight: 1.8 }}>
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li>AAFCO (2016). <em>Dog Food Nutrient Profiles.</em></li>
              <li>National Research Council (2006). <em>Nutrient Requirements of Dogs and Cats.</em> National Academies Press.</li>
              <li>Li, Q., et al. (2017). Protein and carbohydrate ratio effects on gut microbiome. <em>mBio</em>, 8(1).</li>
              <li>Xenoulis, P.G. &amp; Steiner, J.M. (2010). Lipid metabolism in dogs. <em>The Veterinary Journal</em>, 183(1):12-21.</li>
              <li>Case, L.P., et al. (2011). <em>Canine and Feline Nutrition</em>, 3rd ed. Mosby Elsevier.</li>
              <li>Carciofi, A.C., et al. (2008). Carbohydrate sources and digestibility. <em>Journal of Animal Physiology and Animal Nutrition</em>, 92(3):326-336.</li>
              <li>Templeman, J.R. &amp; Shoveller, A.K. (2022). Digestible indispensable amino acid scores. <em>Journal of Animal Science</em>, 100(11):skac279.</li>
              <li>Sieja, K.M., Oba, P.M., et al. (2023). Evaluation of high-protein diets differing in protein source. <em>Journal of Animal Science</em>, 101:skad093.</li>
              <li>NTP (2021). <em>Report on Carcinogens</em>, 15th Edition.</li>
              <li>Bauer, J.E. (2011). Omega-3 fatty acids in companion animals. <em>JAVMA</em>, 239(11).</li>
              <li>Schmitz, S. &amp; Suchodolski, J. (2016). Canine intestinal microbiota. <em>Advances in Animal Biosciences</em>, 7(2).</li>
              <li>Swanson, K.S., et al. (2002). FOS and gut microbial populations in dogs. <em>Journal of Nutrition</em>, 132(6).</li>
              <li>Laflamme, D.P. (2005). Nutrition for aging cats and dogs and the importance of body condition. <em>Veterinary Clinics of North America: Small Animal Practice</em>, 35(3):713-742.</li>
              <li>Fascetti, A.J. &amp; Delaney, S.J. (2012). <em>Applied Veterinary Clinical Nutrition.</em> Wiley-Blackwell.</li>
              <li>FDA (2018). <em>FDA Investigation into Potential Link Between Certain Diets and Canine Dilated Cardiomyopathy.</em></li>
              <li>Freeman, L.M., et al. (2018). Diet-associated dilated cardiomyopathy in dogs. <em>JAVMA</em>, 253(11):1390-1394.</li>
              <li>Buff, P.R., et al. (2014). Natural pet food: A review of natural diets and their impact on canine and feline physiology. <em>Journal of Animal Science</em>, 92(9):3781-3791.</li>
              <li>Thompson, A. (2008). Ingredients: Where pet food starts. <em>Topics in Companion Animal Medicine</em>, 23(3):127-132.</li>
              <li>Aldrich, G.C. &amp; Koppel, K. (2015). Pet food palatability evaluation: A review of standard assay techniques. <em>Animals</em>, 5(1):43-55.</li>
              <li>Kanakubo, K., Fascetti, A.J., &amp; Larsen, J.A. (2015). Assessment of protein and amino acid concentrations and labeling adequacy of commercial vegetarian diets for dogs and cats. <em>JAVMA</em>, 247(4):385-392.</li>
            </ol>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="footer-bar" style={{
        borderTop: '1px solid #ede8df', padding: '32px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: '#1a1612' }}>
          Good<span style={{ color: '#f0c930' }}>Kibble</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#b5aa99', flexWrap: 'wrap' }}>
          <a href="/terms" style={{ color: '#b5aa99', textDecoration: 'none' }}>Terms</a>
          <a href="/privacy" style={{ color: '#b5aa99', textDecoration: 'none' }}>Privacy</a>
          <span>© 2026 GoodKibble. Not affiliated with any dog food brand.</span>
        </div>
      </div>
    </div>
  );
}
