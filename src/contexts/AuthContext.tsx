import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isGuestUser, signOutAll } from '@/lib/auth/socialAuth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initializing: boolean;
  displayName: string;
  isGuest: boolean;
  profile: { display_name: string | null; is_premium: boolean | null } | null;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ display_name: string | null; is_premium: boolean | null } | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [initializing, setInitializing] = useState(true);

  const fetchProfile = async (u: User | null) => {
    if (!u) {
      setProfile(null);
      setDisplayName("");
      return;
    }
    let profileData: any = null;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, is_premium")
        .eq("id", u.id)
        .single();
      profileData = data;
      setProfile(data);
    } catch {
      setProfile(null);
    }
    const name = profileData?.display_name
      || u.user_metadata?.full_name
      || u.email?.split("@")[0]
      || "User";
    setDisplayName(name);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      fetchProfile(session?.user ?? null);
      setLoading(false);
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        fetchProfile(session?.user ?? null);
        setLoading(false);
        setInitializing(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await signOutAll();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, initializing, displayName, isGuest: isGuestUser(user), profile, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
