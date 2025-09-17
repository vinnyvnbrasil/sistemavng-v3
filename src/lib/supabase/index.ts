// Client-side exports
export { createClient, supabase } from './client'

// Types
export type { Database } from './types'

// Server-side exports (only import when needed)
// Note: These should only be imported in server components or API routes
// export {
//   createServerSupabaseClient,
//   createRouteHandlerClient,
//   createMiddlewareClient
// } from './server'