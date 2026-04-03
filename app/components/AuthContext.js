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
      if (s?.user) fetchProfile(s.user.id);
      else setLoading(false);
    }).catch(() => setLoading(false));

    // Listen for auth changes
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }
    try {
      const { data, error } = await sb
        .from('user_profiles')
        .select('id, first_name, email')
        .eq('id', userId)
        .maybeSingle();
      // maybeSingle returns null instead of 406 error when no row found
      if (!error) setUserProfile(data || null);
    } catch {}
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
    <AuthContext.Provider value={{ session, userProfile, loading, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) return { session: null, userProfile: null, loading: true, signOut: async () => {}, fetchProfile: async () => {} };
  return ctx;
}
