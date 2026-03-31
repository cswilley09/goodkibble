'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const userId = localStorage.getItem('gk_user_id');
      const dogId = localStorage.getItem('gk_dog_id');
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/profile?user_id=${userId}&dog_id=${dogId || ''}`);
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setUser(data.user);
        setDog(data.dog);
      } catch (err) {
        setError('Could not load your profile.');
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf8f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#8a7e72' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
        <Nav />
        <div style={{ maxWidth: 500, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>{'\u{1F436}'}</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: 800, color: '#1a1612',
            marginBottom: 12,
          }}>No profile yet</h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16, color: '#8a7e72', marginBottom: 32,
          }}>
            Sign up to create a profile for your dog and get personalized food recommendations.
          </p>
          <button onClick={() => router.push('/signup')} style={{
            padding: '14px 48px', borderRadius: 100,
            background: '#1a1612', color: '#faf8f4',
            fontSize: 16, fontWeight: 700, border: 'none',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            Get Started &rarr;
          </button>
        </div>
      </div>
    );
  }

  const displayName = dog?.dog_name || 'Your dog';
  const genderLabel = dog?.gender === 'male' ? 'Male' : dog?.gender === 'female' ? 'Female' : '';
  const neuteredLabel = dog?.is_neutered ? 'Yes' : 'No';

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
      <Nav />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 80px' }}>
        {error && (
          <p style={{ color: '#b5483a', fontSize: 14, textAlign: 'center', marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#f7efd8', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 36, margin: '0 auto 16px',
          }}>{'\u{1F415}'}</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(28px, 5vw, 40px)',
            fontWeight: 800, color: '#1a1612',
            margin: '0 0 6px', letterSpacing: -1,
          }}>{displayName}&rsquo;s Profile</h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15, color: '#8a7e72',
          }}>Welcome back, {user.first_name}!</p>
        </div>

        {/* Dog Profile Card */}
        {dog && (
          <div style={{
            background: '#fff', borderRadius: 20,
            border: '1px solid #ede8df', padding: 28,
            marginBottom: 24,
          }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11, fontWeight: 700, color: '#C9A84C',
              textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20,
            }}>Dog Profile</div>
            {[
              { label: 'Name', value: dog.dog_name },
              { label: 'Breed', value: dog.breed },
              { label: 'Age', value: `${dog.age_value} ${dog.age_unit}` },
              { label: 'Weight', value: `${dog.weight_lbs} lbs` },
              { label: 'Gender', value: genderLabel },
              { label: 'Neutered', value: neuteredLabel },
              { label: 'Current Food', value: dog.current_food || 'Not specified' },
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #f5f2ec' : 'none',
              }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8a7e72' }}>{row.label}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#1a1612', textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
              </div>
            ))}

            {/* Current food link */}
            {dog.current_food_slug && (
              <div style={{ marginTop: 16 }}>
                <a href={`/dog-food/${dog.current_food_slug}`} style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13, fontWeight: 600, color: '#C9A84C',
                  textDecoration: 'none',
                }}>
                  View {displayName}&rsquo;s current food score &rarr;
                </a>
              </div>
            )}
          </div>
        )}

        {/* Priorities */}
        {dog?.priorities && dog.priorities.length > 0 && (
          <div style={{
            background: '#fff', borderRadius: 20,
            border: '1px solid #ede8df', padding: 28,
            marginBottom: 24,
          }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11, fontWeight: 700, color: '#C9A84C',
              textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16,
            }}>Your Priorities</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {dog.priorities.map(p => (
                <span key={p} style={{
                  padding: '8px 16px', borderRadius: 100,
                  background: '#f7efd8', border: '1.5px solid #C9A84C',
                  fontSize: 13, fontWeight: 600, color: '#1a1612',
                  fontFamily: "'DM Sans', sans-serif",
                }}>{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* Account Info */}
        <div style={{
          background: '#fff', borderRadius: 20,
          border: '1px solid #ede8df', padding: 28,
          marginBottom: 32,
        }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11, fontWeight: 700, color: '#C9A84C',
            textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20,
          }}>Account</div>
          {[
            { label: 'Name', value: user.first_name },
            { label: 'Email', value: user.email },
            { label: 'Zip Code', value: user.zip_code },
            ...(user.heard_from ? [{ label: 'Heard From', value: user.heard_from }] : []),
          ].map((row, i, arr) => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0',
              borderBottom: i < arr.length - 1 ? '1px solid #f5f2ec' : 'none',
            }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8a7e72' }}>{row.label}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#1a1612' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => router.push('/discover')} style={{
            padding: '14px 48px', borderRadius: 100,
            background: '#1a1612', color: '#faf8f4',
            fontSize: 16, fontWeight: 700, border: 'none',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            See {displayName}&rsquo;s Recommendations &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

function Nav() {
  return (
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
      <a href="/signup" style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13, fontWeight: 600, color: '#8a7e72',
        textDecoration: 'none',
      }}>Sign Up</a>
    </nav>
  );
}
