import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Server-side client with service role key for admin operations
export const supabaseAdmin: SupabaseClient = (() => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase server environment variables:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceRoleKey,
    })
    // Return a mock client that will throw when used
    // This prevents module load errors but allows runtime errors
    throw new Error('Missing Supabase server environment variables. Please check your .env file.')
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
})()
