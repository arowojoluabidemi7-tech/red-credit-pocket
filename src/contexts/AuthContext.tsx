import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, db } from '@/lib/db';
import type { Session } from '@supabase/supabase-js';
import { User } from '@/types';
import { storage } from '@/lib/store';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  status: string;
  referral_code: string;
  referred_by: string | null;
  balance: number;
  account_status: 'active' | 'suspended' | 'banned';
  email: string;
}

interface SignupData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  country: string;
  status: 'individual' | 'business';
  referredBy?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  signup: (data: SignupData) => Promise<{ error?: string; user?: User }>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const profileToUser = (p: Profile, extras?: Partial<User>): User => ({
  id: p.id,
  firstName: p.first_name || '',
  lastName: p.last_name || '',
  email: p.email || '',
  password: '',
  phone: p.phone || '',
  country: p.country || 'NG',
  status: (p.status as 'individual' | 'business') || 'individual',
  referralCode: p.referral_code || '',
  referredBy: p.referred_by || undefined,
  balance: Number(p.balance) || 0,
  rpcBalance: extras?.rpcBalance ?? 0,
  hasClaimedWelcome: extras?.hasClaimedWelcome ?? false,
  lastClaimTime: extras?.lastClaimTime,
  claimCount: extras?.claimCount ?? 0,
  createdAt: extras?.createdAt ?? Date.now(),
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const hydrate = async (uid: string) => {
    // profile
    const { data: p } = await db.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (p) {
      setProfile(p as Profile);
      const local = storage.getUser();
      const extras = local && local.id === uid ? local : undefined;
      const merged = profileToUser(p as Profile, extras);
      setUser(merged);
      storage.setUser(merged);
    }
    const { data: roles } = await db.from('user_roles').select('role').eq('user_id', uid);
    setIsAdmin(!!roles?.some((r: { role: string }) => r.role === 'admin'));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => hydrate(s.user.id), 0);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) hydrate(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const login: AuthContextType['login'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
    storage.clearUser();
  };

  const signup: AuthContextType['signup'] = async (data) => {
    const redirect = `${window.location.origin}/`;
    const { data: res, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirect,
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          country: data.country,
          status: data.status,
          referred_by: data.referredBy || null,
        },
      },
    });
    if (error) return { error: error.message };
    if (!res.user) return { error: 'Signup failed' };
    // Give trigger a moment
    await new Promise((r) => setTimeout(r, 400));
    await hydrate(res.user.id);
    const { data: p } = await db.from('profiles').select('*').eq('id', res.user.id).maybeSingle();
    const u = p ? profileToUser(p as Profile) : undefined;
    return { user: u };
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    storage.setUser(updated);
  };

  const refreshUser = async () => {
    if (session?.user) await hydrate(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isAuthenticated: !!session,
        isAdmin,
        loading,
        login,
        logout,
        signup,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
