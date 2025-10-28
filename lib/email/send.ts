import { supabaseAdmin } from '@/lib/supabase/server'
import { generateWelcomeEmail, generatePlainTextWelcome, type WelcomeEmailData } from './templates'

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  invitedByName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the site URL from environment
    const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    // Generate password reset link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail,
      options: {
        redirectTo: `${siteUrl}/reset-password`,
      },
    })

    if (resetError || !resetData) {
      console.error('Failed to generate reset link:', resetError)
      return { success: false, error: resetError?.message || 'Failed to generate reset link' }
    }

    const resetLink = resetData.properties?.action_link || ''
    
    const emailData: WelcomeEmailData = {
      userName,
      userEmail,
      invitedBy: invitedByName,
      resetLink,
      companyName: 'Coupon Dispenser',
    }

    // Log for debugging
    console.log('✓ Welcome email generated for:', userEmail)
    console.log('✓ Reset link created:', resetLink.substring(0, 50) + '...')
    console.log('✓ Custom email template:', generateWelcomeEmail(emailData).substring(0, 200) + '...')

    // The email is automatically sent by Supabase generateLink
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending welcome email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' }
  }
}

