// Client-side exports
export { createClient, supabase } from './supabase/client'

// Types
export type { Database } from './supabase/types'

// Legacy exports for backward compatibility
export { createClient as createClientSupabaseClient } from './supabase/client'

// Note: Server-side functions should be imported directly from './supabase/server'
// to avoid bundling issues with client components