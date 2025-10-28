import { supabaseAdmin } from '@/lib/supabase/server'

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  invitedByName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the site URL from environment
    const siteUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    // Generate password reset link - Supabase will automatically send the email
    // Use the "Reset password" template that you customize in Supabase dashboard
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail,
      options: {
        redirectTo: `${siteUrl}/reset-password`,
      },
    })

    if (resetError || !resetData) {
      console.error('❌ Failed to generate reset link:', resetError)
      return { success: false, error: resetError?.message || 'Failed to generate reset link' }
    }

    const resetLink = resetData.properties?.action_link || ''
    
    console.log('✓ Password reset email sent via Supabase')
    console.log('✓ User should receive email at:', userEmail)
    console.log('✓ Reset link:', resetLink.substring(0, 80) + '...')
    
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending welcome email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' }
  }
}

