// Re-export the single supabase client to maintain backward compatibility
// ALL imports should use '@/integrations/supabase/client' directly
export { supabase } from '@/integrations/supabase/client';

// Re-export auth types for convenience
export type { User, Session, AuthError } from '@supabase/supabase-js';
