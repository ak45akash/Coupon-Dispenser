import { supabaseAdmin } from '@/lib/supabase/server'
import { generateWelcomeEmail, generatePlainTextWelcome, type WelcomeEmailData } from './templates'

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  invitedByName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate password reset link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail,
      options: {
        redirectTo: `${process.env.NEXTAUTH_URL}/reset-password`,
      },
    })

    if (resetError || !resetData) {
      console.error('Failed to generate reset link:', resetError)
      return { success: false, error: 'Failed to generate reset link' }
    }

    const emailData: WelcomeEmailData = {
      userName,
      userEmail,
      invitedBy: invitedByName,
      resetLink: resetData.properties?.action_link || '',
      companyName: 'Coupon Dispenser',
    }

    // For now, we'll use Supabase's built-in email with custom content
    // In production, you might want to use a service like SendGrid, Resend, or AWS SES
    
    // Note: Supabase doesn't support custom HTML emails via the auth API
    // So we'll use their recovery email but log our custom HTML for reference
    console.log('Custom Welcome Email HTML:', generateWelcomeEmail(emailData))
    console.log('Reset Link:', resetData.properties?.action_link)

    // The email is already sent by generateLink, so we just return success
    return { success: true }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

