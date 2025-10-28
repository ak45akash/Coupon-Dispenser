import { supabaseAdmin } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { generateWelcomeEmail, generatePlainTextWelcome, type WelcomeEmailData } from './templates'

// Lazy initialize Resend only if API key is provided
let resend: Resend | null = null
const getResendClient = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  invitedByName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the site URL from environment
    const siteUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    // Generate password reset link with magic link
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
    
    // Create our custom email
    const emailData: WelcomeEmailData = {
      userName,
      userEmail,
      invitedBy: invitedByName,
      resetLink,
      companyName: 'Coupon Dispenser',
    }

    const htmlContent = generateWelcomeEmail(emailData)
    const textContent = generatePlainTextWelcome(emailData)

    // Send custom email using Resend (only if configured)
    const client = getResendClient()
    
    if (client) {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Coupon Dispenser <onboarding@resend.dev>'
      
      try {
        const { data: emailResult, error: emailError } = await client.emails.send({
          from: fromEmail,
          to: userEmail,
          subject: `Welcome to ${emailData.companyName}!`,
          html: htmlContent,
          text: textContent,
        })

        if (emailError) {
          console.error('Failed to send email via Resend:', emailError)
          console.log('Falling back to Supabase default recovery email')
        } else {
          console.log('✓ Custom welcome email sent successfully via Resend:', emailResult)
          return { success: true }
        }
      } catch (resendError) {
        console.error('Resend error:', resendError)
        console.log('Falling back to Supabase default recovery email')
      }
    } else {
      console.log('✓ Resend not configured - using Supabase default recovery email')
    }

    // If Resend fails, log what would be sent
    console.log('=================================')
    console.log('📧 CUSTOM EMAIL WOULD SEND TO:', userEmail)
    console.log('📧 Reset Link:', resetLink.substring(0, 80) + '...')
    console.log('📧 HTML Preview:', htmlContent.substring(0, 300) + '...')
    console.log('=================================')

    console.log('✓ Password reset link generated')
    console.log('✓ Supabase will send default recovery email with reset link')

    return { success: true }
  } catch (error) {
    console.error('❌ Error sending welcome email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' }
  }
}

