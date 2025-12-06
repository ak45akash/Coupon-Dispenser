import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Validate environment variables
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error('Missing Supabase environment variables')
            throw new Error('Missing Supabase configuration')
          }

          // Create a client with anon key for authentication
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          )

          // Authenticate with Supabase using anon key
          const { data: authData, error: authError } =
            await supabase.auth.signInWithPassword({
              email: credentials.email,
              password: credentials.password,
            })

          if (authError || !authData.user) {
            console.error('Auth error:', authError)
            return null
          }

          // Get user profile with role using admin client
          const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single()

          if (userError || !userData) {
            console.error('User fetch error:', userError)
            return null
          }

          return {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role as UserRole,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

