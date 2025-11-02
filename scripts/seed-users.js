/**
 * Helper script to create users for seeding
 * Run this after setting up your Supabase project
 * 
 * Usage: node scripts/seed-users.js
 * 
 * Prerequisites:
 * - Set SUPABASE_SERVICE_ROLE_KEY in environment or .env
 * - Users will be created in Supabase Auth
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  console.error('Add them to your .env file or export as environment variables')
  process.exit(1)
}

const users = [
  { email: 'admin@example.com', password: 'admin123', name: 'Admin User', role: 'super_admin' },
  { email: 'user1@example.com', password: 'user123', name: 'Test User 1', role: 'user' },
  { email: 'user2@example.com', password: 'user123', name: 'Test User 2', role: 'user' },
  { email: 'user3@example.com', password: 'user123', name: 'Test User 3', role: 'user' },
  { email: 'partner1@example.com', password: 'partner123', name: 'Partner Admin 1', role: 'partner_admin' },
  { email: 'partner2@example.com', password: 'partner123', name: 'Partner Admin 2', role: 'partner_admin' },
]

async function createUser(userData) {
  try {
    // Create user in Supabase Auth
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm
        user_metadata: {
          name: userData.name,
        },
      }),
    })

    if (!authResponse.ok) {
      const error = await authResponse.json()
      if (error.error?.message?.includes('already registered')) {
        console.log(`⚠️  User ${userData.email} already exists in Auth`)
        return await getUserAuthId(userData.email)
      }
      throw new Error(error.error?.message || 'Failed to create auth user')
    }

    const authData = await authResponse.json()
    const userId = authData.id

    // Create user record in public.users
    const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        id: userId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      }),
    })

    if (!userResponse.ok) {
      const error = await userResponse.json()
      if (error.message?.includes('duplicate') || error.code === '23505') {
        // User already exists, update role
        await updateUserRole(userId, userData.role)
        console.log(`✓ Updated user ${userData.email} role to ${userData.role}`)
      } else {
        throw new Error(error.message || 'Failed to create user record')
      }
    } else {
      console.log(`✓ Created user ${userData.email} with role ${userData.role}`)
    }

    return userId
  } catch (error) {
    console.error(`✗ Error creating user ${userData.email}:`, error.message)
    return null
  }
}

async function getUserAuthId(email) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  })

  if (response.ok) {
    const data = await response.json()
    if (data.users && data.users.length > 0) {
      return data.users[0].id
    }
  }
  return null
}

async function updateUserRole(userId, role) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ role }),
  })
  return response.ok
}

async function main() {
  console.log('🌱 Starting user seed process...\n')

  for (const user of users) {
    await createUser(user)
  }

  console.log('\n✅ User seeding complete!')
  console.log('\nNext steps:')
  console.log('1. Run the seed-complete.sql script in Supabase SQL Editor')
  console.log('2. Verify data using the summary query at the end of the seed script')
}

main().catch(console.error)

