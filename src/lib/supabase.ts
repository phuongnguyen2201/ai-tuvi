import { createClient, User, Session, AuthError } from '@supabase/supabase-js';

// Environment validation
const supabaseUrl = 'https://gapuktvldpbbsuscgbbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhcHVrdHZsZHBiYnN1c2NnYmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MzcyNjQsImV4cCI6MjA4NTMxMzI2NH0.u_km0ap7DOuX_MHXIEtDI_oIFR242VnNZc5qmfIG0x0';

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL configuration');
}

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase Anon Key configuration');
}

// =====================
// TypeScript Interfaces
// =====================

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  birth_date: string | null;
  birth_hour: string | null;
  gender: 'male' | 'female' | null;
  zodiac_chi: string | null;
  is_premium: boolean;
  readings_count: number;
  created_at: string;
  updated_at: string;
}

export interface TuViReading {
  id: string;
  user_id: string;
  birth_date: string;
  birth_hour: string;
  gender: 'male' | 'female';
  lunar_day: number;
  lunar_month: number;
  lunar_year: number;
  lunar_year_name: string;
  chart_data: Record<string, unknown>;
  interpretation: Record<string, unknown>;
  created_at: string;
}

export interface CompatibilityCheck {
  id: string;
  user_id: string | null;
  chi_1: string;
  chi_2: string;
  score: number;
  level: 'Đại Hợp' | 'Hợp' | 'Bình Thường' | 'Kỵ' | 'Đại Kỵ';
  result: Record<string, unknown>;
  created_at: string;
}

export interface DayAnalysis {
  id: string;
  user_id: string | null;
  solar_date: string;
  lunar_day: number;
  lunar_month: number;
  lunar_year: number;
  day_quality: 'hoang_dao' | 'hac_dao';
  analysis: Record<string, unknown>;
  created_at: string;
}

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      tu_vi_readings: {
        Row: TuViReading;
        Insert: Omit<TuViReading, 'id' | 'created_at'>;
        Update: Partial<Omit<TuViReading, 'id' | 'created_at'>>;
      };
      compatibility_checks: {
        Row: CompatibilityCheck;
        Insert: Omit<CompatibilityCheck, 'id' | 'created_at'>;
        Update: Partial<Omit<CompatibilityCheck, 'id' | 'created_at'>>;
      };
      day_analyses: {
        Row: DayAnalysis;
        Insert: Omit<DayAnalysis, 'id' | 'created_at'>;
        Update: Partial<Omit<DayAnalysis, 'id' | 'created_at'>>;
      };
    };
  };
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// =====================
// Auth Helper Functions
// =====================

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error.message);
    return null;
  }
  return user;
};

export const getCurrentSession = async (): Promise<Session | null> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error.message);
    return null;
  }
  return session;
};

export const signUp = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  return { user: data.user, error };
};

export const signIn = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { user: data.user, error };
};

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// =====================
// Profile Functions
// =====================

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error.message);
    return null;
  }
  return data;
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'email' | 'created_at' | 'updated_at'>>
): Promise<{ data: UserProfile | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() } as never)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as UserProfile, error: null };
};

// =====================
// Tử Vi Reading Functions
// =====================

export const saveTuViReading = async (
  reading: Omit<TuViReading, 'id' | 'created_at'>
): Promise<{ data: TuViReading | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('tu_vi_readings')
    .insert(reading as never)
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  // Increment readings_count for user (optional RPC function)
  try {
    await supabase.rpc('increment_readings_count' as never, { user_id: reading.user_id } as never);
  } catch {
    // RPC function may not exist yet
  }

  return { data: data as TuViReading, error: null };
};

export const getUserReadings = async (
  userId: string,
  limit = 10
): Promise<{ data: TuViReading[]; error: Error | null }> => {
  const { data, error } = await supabase
    .from('tu_vi_readings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { data: [], error: new Error(error.message) };
  }
  return { data: data || [], error: null };
};

export const getTuViReadingById = async (
  readingId: string
): Promise<{ data: TuViReading | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('tu_vi_readings')
    .select('*')
    .eq('id', readingId)
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
};

// =====================
// Compatibility Functions
// =====================

export const saveCompatibilityCheck = async (
  check: Omit<CompatibilityCheck, 'id' | 'created_at'>
): Promise<{ data: CompatibilityCheck | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('compatibility_checks')
    .insert(check as never)
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as CompatibilityCheck, error: null };
};

export const getUserCompatibilityChecks = async (
  userId: string,
  limit = 10
): Promise<{ data: CompatibilityCheck[]; error: Error | null }> => {
  const { data, error } = await supabase
    .from('compatibility_checks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { data: [], error: new Error(error.message) };
  }
  return { data: data || [], error: null };
};

// =====================
// Day Analysis Functions
// =====================

export const saveDayAnalysis = async (
  analysis: Omit<DayAnalysis, 'id' | 'created_at'>
): Promise<{ data: DayAnalysis | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('day_analyses')
    .insert(analysis as never)
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as DayAnalysis, error: null };
};

export const getUserDayAnalyses = async (
  userId: string,
  limit = 10
): Promise<{ data: DayAnalysis[]; error: Error | null }> => {
  const { data, error } = await supabase
    .from('day_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { data: [], error: new Error(error.message) };
  }
  return { data: data || [], error: null };
};

export const getDayAnalysisByDate = async (
  solarDate: string
): Promise<{ data: DayAnalysis | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('day_analyses')
    .select('*')
    .eq('solar_date', solarDate)
    .single();

  if (error && error.code !== 'PGRST116') {
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
};

// Re-export types
export type { User, Session, AuthError };
