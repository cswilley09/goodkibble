'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const AuthContext = createContext();

// Lazy client — only create on the client side
let _supabase = null;
function getSupabase() {
  if (!_supabase && typeof window !== 'undefined') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) _supabase = createClient(url, key);
  }
  return _supabase;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }

    // Get initial session
    sb.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) fetchProfile(s.user.id, s.user.email);
      else setLoading(false);
    }).catch(() => setLoading(false));

    // Listen for auth changes
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        fetchProfile(s.user.id, s.user.email);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId, userEmail) {
    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }
    try {
      // Try by auth user ID first
      const cols = 'id, first_name, email, is_pro, pro_since, notification_recalls, notification_score_changes, notification_methodology, notification_new_foods, notification_tips';
      const { data } = await sb
        .from('user_profiles')
        .select(cols)
        .eq('id', userId)
        .maybeSingle();
      if (data) { setUserProfile(data); setLoading(false); return; }

      // Fallback: try by email (for profiles created before auth)
      if (userEmail) {
        const { data: byEmail } = await sb
          .from('user_profiles')
          .select(cols)
          .eq('email', userEmail)
          .maybeSingle();
        if (byEmail) { setUserProfile(byEmail); setLoading(false); return; }
      }
    } catch {}
    setUserProfile(null);
    setLoading(false);
  }

  async function signOut() {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setSession(null);
    setUserProfile(null);
    try {
      localStorage.removeItem('gk_user_id');
      localStorage.removeItem('gk_dog_id');
      localStorage.removeItem('gk_user_name');
      localStorage.removeItem('gk_user_email');
    } catch {}
  }

  return (
  const isPro = !!userProfile?.is_pro;

    <AuthContext.Provider value={{ session, userProfile, loading, signOut, fetchProfile, isPro }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) return { session: null, userProfile: null, loading: true, signOut: async () => {}, fetchProfile: async () => {}, isPro: false };
  return ctx;
}
