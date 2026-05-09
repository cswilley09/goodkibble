// Concept 1: "The Database" — Kayak-style utility-first

const db_bg = 'oklch(0.985 0.005 90)';
const db_ink = 'oklch(0.22 0.01 80)';
const db_muted = 'oklch(0.5 0.01 80)';
const db_line = 'oklch(0.9 0.008 80)';
const db_accent = 'oklch(0.55 0.14 155)'; // deep forest
const db_accentSoft = 'oklch(0.95 0.03 155)';

function ScorePill({ score, size = 'md' }) {
  const h = score >= 85 ? 155 : score >= 70 ? 85 : score >= 60 ? 55 : 25;
  const color = `oklch(0.55 0.14 ${h})`;
  const bg = `oklch(0.96 0.04 ${h})`;
  const fontSize = size === 'lg' ? 18 : size === 'sm' ? 12 : 14;
  const pad = size === 'lg' ? '6px 14px' : size === 'sm' ? '2px 8px' : '4px 10px';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 4,
      background: bg, color, padding: pad, borderRadius: 4,
      fontVariantNumeric: 'tabular-nums', fontWeight: 600,
      fontSize,
    }}>
      <span>{score}</span>
      <span style={{ fontSize: fontSize * 0.65, opacity: 0.7 }}>/100</span>
    </span>
  );
}

function DatabaseConcept() {
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState(null);
  const [sort, setSort] = React.useState('score');
  const [filters, setFilters] = React.useState({ minScore: 0, grainFree: false, noBy: false });
  const inputRef = React.useRef(null);

  const suggestions = React.useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return FOODS.filter(f =>
      f.brand.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [query]);

  const rows = React.useMemo(() => {
    let list = [...FOODS];
    if (filters.minScore) list = list.filter(f => f.score >= filters.minScore);
    if (filters.grainFree) list = list.filter(f => f.flags.some(x => x.toLowerCase().includes('grain-free')));
    if (filters.noBy) list = list.filter(f => !f.warnings.some(x => x.toLowerCase().includes('by-product')));
    list.sort((a, b) => {
      if (sort === 'score') return b.score - a.score;
      if (sort === 'price') return a.price - b.price;
      if (sort === 'protein') return b.protein - a.protein;
      return a.brand.localeCompare(b.brand);
    });
    return list;
  }, [sort, filters]);

  return (
    <div style={{
      fontFamily: 'Inter, system-ui, sans-serif',
      background: db_bg, color: db_ink,
      minHeight: '100%', fontSize: 14,
    }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 40px', borderBottom: `1px solid ${db_line}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 5, background: db_accent,
              display: 'grid', placeItems: 'center', color: '#fff',
              fontFamily: 'ui-monospace, monospace', fontSize: 12, fontWeight: 700,
            }}>K</div>
            <span style={{ fontWeight: 600, letterSpacing: -0.2 }}>GoodKibble</span>
          </div>
          <nav style={{ display: 'flex', gap: 24, fontSize: 13, color: db_muted }}>
            <a style={{ color: db_ink, fontWeight: 500 }}>Database</a>
            <a>Brands</a>
            <a>Methodology</a>
            <a>Recalls</a>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
          <span style={{ color: db_muted }}>Updated {STATS.updatedAgo}</span>
          <button style={{
            background: db_ink, color: '#fff', border: 'none',
            padding: '7px 14px', borderRadius: 4, fontSize: 13, fontWeight: 500,
            cursor: 'pointer',
          }}>Sign in</button>
        </div>
      </header>

      {/* Hero search */}
      <section style={{ padding: '72px 40px 48px', borderBottom: `1px solid ${db_line}` }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: db_accentSoft, color: db_accent,
            padding: '4px 10px', borderRadius: 4,
            fontSize: 12, fontWeight: 500, marginBottom: 20,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: db_accent }} />
            {STATS.foods.toLocaleString()} foods · {STATS.brands} brands · independent scoring
          </div>
          <h1 style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 60, lineHeight: 1.02, fontWeight: 400,
            letterSpacing: -1, margin: '0 0 14px',
          }}>
            Look up any dog food.<br/>
            <span style={{ fontStyle: 'italic', color: db_accent }}>See what&rsquo;s really in it.</span>
          </h1>
          <p style={{ fontSize: 16, color: db_muted, margin: '0 0 32px', maxWidth: 560 }}>
            Search by brand, product, or ingredient. Every food is scored 0&ndash;100 against the same open methodology.
          </p>

          {/* Big search */}
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              background: '#fff', border: `1px solid ${db_line}`,
              borderRadius: 8, padding: '6px 6px 6px 18px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={db_muted} strokeWidth="2">
                <circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Try &ldquo;Orijen Original&rdquo; or &ldquo;Blue Buffalo&rdquo;"
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  padding: '16px 14px', fontSize: 17, background: 'transparent',
                  fontFamily: 'inherit', color: db_ink,
                }}
              />
              <button style={{
                background: db_accent, color: '#fff', border: 'none',
                padding: '12px 22px', borderRadius: 6, fontSize: 14, fontWeight: 500,
                cursor: 'pointer',
              }}>Search</button>
            </div>

            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                background: '#fff', border: `1px solid ${db_line}`, borderRadius: 8,
                boxShadow: '0 12px 32px rgba(0,0,0,0.08)', zIndex: 10,
                overflow: 'hidden',
              }}>
                {suggestions.map(f => (
                  <button key={f.id}
                    onClick={() => { setSelected(f); setQuery(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '12px 18px', background: 'transparent',
                      border: 'none', borderBottom: `1px solid ${db_line}`, cursor: 'pointer',
                      textAlign: 'left', fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = db_accentSoft}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 500, color: db_ink }}>{f.brand} &middot; {f.name}</div>
                      <div style={{ fontSize: 12, color: db_muted, marginTop: 2 }}>{f.tagline}</div>
                    </div>
                    <ScorePill score={f.score} size="sm" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick chips */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: db_muted, alignSelf: 'center', marginRight: 4 }}>Popular:</span>
            {['Orijen', 'Purina Pro', 'Blue Buffalo', 'Grain-free', 'Puppy'].map(t => (
              <button key={t} onClick={() => setQuery(t)} style={{
                background: '#fff', border: `1px solid ${db_line}`, color: db_ink,
                padding: '5px 12px', borderRadius: 100, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>{t}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Selected food detail OR leaderboard */}
      {selected ? (
        <FoodDetail food={selected} onClose={() => setSelected(null)} />
      ) : (
        <Leaderboard rows={rows} sort={sort} setSort={setSort} filters={filters} setFilters={setFilters} onPick={setSelected} />
      )}

      {/* Methodology strip */}
      <section style={{
        padding: '48px 40px', borderTop: `1px solid ${db_line}`,
        background: '#fff',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 48 }}>
          <div>
            <div style={{
              fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase',
              color: db_muted, marginBottom: 8,
              fontFamily: 'ui-monospace, monospace',
            }}>Methodology</div>
            <h2 style={{
              fontFamily: '"Instrument Serif", serif', fontSize: 32,
              fontWeight: 400, margin: 0, letterSpacing: -0.5,
            }}>How we score.</h2>
            <p style={{ color: db_muted, fontSize: 14, marginTop: 12, lineHeight: 1.55 }}>
              Every food gets the same review. Ingredients, guaranteed analysis, sourcing transparency, and recall history roll up into a single number.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {SCORE_FACTORS.map(f => (
              <div key={f.label} style={{
                padding: '16px 0', borderTop: `2px solid ${db_ink}`,
              }}>
                <div style={{
                  fontSize: 28, fontFamily: '"Instrument Serif", serif',
                  lineHeight: 1, fontWeight: 400, fontVariantNumeric: 'tabular-nums',
                }}>{f.weight}<span style={{ fontSize: 14, color: db_muted }}>%</span></div>
                <div style={{ fontSize: 12, color: db_muted, marginTop: 8, lineHeight: 1.3 }}>{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Leaderboard({ rows, sort, setSort, filters, setFilters, onPick }) {
  return (
    <section style={{ padding: '40px 40px 72px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{
              fontFamily: '"Instrument Serif", serif', fontSize: 28,
              fontWeight: 400, margin: 0, letterSpacing: -0.5,
            }}>Top-scoring foods this week</h2>
            <div style={{ fontSize: 13, color: db_muted, marginTop: 4 }}>
              {rows.length} results &middot; ranked by {sort}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
            <FilterChip active={filters.grainFree} onClick={() => setFilters(f => ({...f, grainFree: !f.grainFree}))}>Grain-free</FilterChip>
            <FilterChip active={filters.noBy} onClick={() => setFilters(f => ({...f, noBy: !f.noBy}))}>No by-products</FilterChip>
            <FilterChip active={filters.minScore === 80} onClick={() => setFilters(f => ({...f, minScore: f.minScore === 80 ? 0 : 80}))}>80+</FilterChip>
            <div style={{ width: 1, height: 20, background: db_line, margin: '0 4px' }} />
            <select value={sort} onChange={e => setSort(e.target.value)} style={{
              background: '#fff', border: `1px solid ${db_line}`, borderRadius: 4,
              padding: '6px 10px', fontFamily: 'inherit', fontSize: 13, color: db_ink,
            }}>
              <option value="score">Sort: Score</option>
              <option value="price">Sort: Price</option>
              <option value="protein">Sort: Protein %</option>
              <option value="name">Sort: Brand</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{
          background: '#fff', border: `1px solid ${db_line}`, borderRadius: 8,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 110px 80px 80px 80px 100px',
            padding: '12px 20px', borderBottom: `1px solid ${db_line}`,
            fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
            color: db_muted, fontFamily: 'ui-monospace, monospace',
          }}>
            <div>Rank</div>
            <div>Product</div>
            <div>Score</div>
            <div style={{ textAlign: 'right' }}>Protein</div>
            <div style={{ textAlign: 'right' }}>Fat</div>
            <div style={{ textAlign: 'right' }}>$/lb</div>
            <div style={{ textAlign: 'right' }}>Details</div>
          </div>
          {rows.map((f, i) => (
            <button key={f.id} onClick={() => onPick(f)} style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 110px 80px 80px 80px 100px',
              padding: '16px 20px', borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${db_line}`,
              background: 'transparent', border: 'none', borderBottomStyle: i === rows.length - 1 ? 'none' : 'solid',
              borderBottomColor: db_line, borderBottomWidth: i === rows.length - 1 ? 0 : 1,
              width: '100%', cursor: 'pointer', textAlign: 'left',
              fontFamily: 'inherit', alignItems: 'center',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = db_accentSoft}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                fontFamily: 'ui-monospace, monospace', color: db_muted,
                fontSize: 13, fontVariantNumeric: 'tabular-nums',
              }}>#{String(i+1).padStart(2, '0')}</div>
              <div>
                <div style={{ fontWeight: 500, color: db_ink, fontSize: 14 }}>
                  {f.brand} <span style={{ color: db_muted, fontWeight: 400 }}>&middot;</span> {f.name}
                </div>
                <div style={{ fontSize: 12, color: db_muted, marginTop: 2 }}>
                  First ingredient: {f.firstIngredient}
                </div>
              </div>
              <div><ScorePill score={f.score} /></div>
              <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: db_ink }}>{f.protein}%</div>
              <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: db_ink }}>{f.fat}%</div>
              <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: db_ink }}>${(f.price / parseInt(f.size)).toFixed(2)}</div>
              <div style={{ textAlign: 'right', fontSize: 13, color: db_accent, fontWeight: 500 }}>View &rarr;</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: active ? db_ink : '#fff',
      color: active ? '#fff' : db_ink,
      border: `1px solid ${active ? db_ink : db_line}`,
      padding: '5px 12px', borderRadius: 100, fontSize: 12,
      cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
    }}>{children}</button>
  );
}

function FoodDetail({ food, onClose }) {
  return (
    <section style={{ padding: '40px 40px 72px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: db_muted,
          fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 0,
          marginBottom: 20,
        }}>&larr; Back to database</button>
        <div style={{
          background: '#fff', border: `1px solid ${db_line}`, borderRadius: 8,
          padding: 32,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 220px', gap: 32 }}>
            {/* Placeholder bag */}
            <div style={{
              aspectRatio: '3/4',
              background: `repeating-linear-gradient(45deg, ${db_accentSoft}, ${db_accentSoft} 6px, #fff 6px, #fff 12px)`,
              border: `1px solid ${db_line}`, borderRadius: 4,
              display: 'grid', placeItems: 'center',
              fontFamily: 'ui-monospace, monospace', fontSize: 10, color: db_muted,
              textAlign: 'center', padding: 8,
            }}>bag photo</div>
            <div>
              <div style={{ fontSize: 13, color: db_muted, fontFamily: 'ui-monospace, monospace' }}>{food.brand}</div>
              <h1 style={{
                fontFamily: '"Instrument Serif", serif', fontSize: 36,
                fontWeight: 400, margin: '4px 0 8px', letterSpacing: -0.5,
              }}>{food.name}</h1>
              <p style={{ color: db_muted, margin: '0 0 20px', fontSize: 14 }}>{food.tagline}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {food.flags.map(t => <span key={t} style={{
                  fontSize: 12, padding: '3px 10px', background: db_accentSoft,
                  color: db_accent, borderRadius: 100, fontWeight: 500,
                }}>{t}</span>)}
                {food.warnings.map(t => <span key={t} style={{
                  fontSize: 12, padding: '3px 10px', background: 'oklch(0.95 0.04 30)',
                  color: 'oklch(0.5 0.15 30)', borderRadius: 100, fontWeight: 500,
                }}>&#9888; {t}</span>)}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px 0', borderLeft: `1px solid ${db_line}`, paddingLeft: 32 }}>
              <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: db_muted, fontFamily: 'ui-monospace, monospace' }}>GoodKibble Score</div>
              <div style={{
                fontFamily: '"Instrument Serif", serif', fontSize: 80,
                lineHeight: 1, fontWeight: 400, color: db_accent,
                margin: '10px 0 4px', fontVariantNumeric: 'tabular-nums',
              }}>{food.score}</div>
              <div style={{ fontSize: 13, color: db_muted }}>Grade {food.grade}</div>
            </div>
          </div>

          {/* GA */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${db_line}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              ['Protein', food.protein],
              ['Fat', food.fat],
              ['Fiber', food.fiber],
              ['Moisture', food.moisture],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: db_muted, fontFamily: 'ui-monospace, monospace' }}>{k}</div>
                <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 32, marginTop: 4 }}>{v}<span style={{ fontSize: 14, color: db_muted }}>%</span></div>
              </div>
            ))}
          </div>

          {/* Ingredients */}
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${db_line}` }}>
            <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: db_muted, fontFamily: 'ui-monospace, monospace', marginBottom: 10 }}>Top ingredients (in order)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {food.ingredients.map((ing, i) => (
                <span key={ing} style={{
                  fontSize: 13, padding: '6px 12px', background: db_accentSoft,
                  borderRadius: 4, color: db_ink,
                }}>
                  <span style={{ color: db_muted, marginRight: 6, fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{String(i+1).padStart(2, '0')}</span>
                  {ing}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

window.DatabaseConcept = DatabaseConcept;
window.ScorePill = ScorePill;
