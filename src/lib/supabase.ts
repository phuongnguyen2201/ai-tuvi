import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gapuktvldpbbsuscgbbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhcHVrdHZsZHBiYnN1c2NnYmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MzcyNjQsImV4cCI6MjA4NTMxMzI2NH0.u_km0ap7DOuX_MHXIEtDI_oIFR242VnNZc5qmfIG0x0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
