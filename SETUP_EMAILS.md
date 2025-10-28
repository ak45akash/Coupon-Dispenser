# Setting Up Email in Supabase

This guide explains how to configure email sending in your Supabase project.

## Current Situation

Your application uses Supabase's `generateLink` function which automatically sends password recovery emails. However, for emails to actually be sent, you need to configure Supabase's email provider.

## Option 1: Use Supabase's Built-in Email Service (Recommended for Development)

Supabase provides a free email service for development with some limitations.

### Steps:

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select your project

2. **Navigate to Authentication → Email Templates**
   - Click on "Authentication" in the left sidebar
   - Click on "Email Templates"

3. **Enable the Email Templates**
   - Make sure the following templates are enabled:
     - ✓ **Confirm signup**
     - ✓ **Invite user**
     - ✓ **Reset Password** (This is what we use!)
     - ✓ **Magic Link**

4. **Configure Email Settings**
   - Go to "Authentication" → "Configuration"
   - Scroll down to "Email Auth"
   - Make sure "Enable Email Signup" is ON
   - Set "Confirm email" to OFF (for admin-created users)
   - Set "Double confirm email" to OFF

5. **Test Email Configuration**
   - The emails should now be sent automatically when you create a new user
   - Check your spam folder if you don't receive the email

## Option 2: Configure Custom SMTP (Recommended for Production)

For production, you'll want to use your own SMTP server.

### Steps:

1. **Get SMTP Credentials**
   - You can use services like:
     - **SendGrid** (https://sendgrid.com)
     - **Mailgun** (https://mailgun.com)
     - **Postmark** (https://postmarkapp.com)
     - **Amazon SES** (https://aws.amazon.com/ses)

2. **Configure SMTP in Supabase**
   - Go to "Settings" → "Auth"
   - Scroll to "SMTP Settings"
   - Enter your SMTP credentials:
     - **SMTP host**: e.g., `smtp.sendgrid.net`
     - **SMTP port**: e.g., `587`
     - **SMTP user**: Your SMTP username
     - **SMTP password**: Your SMTP password
     - **Sender email**: The email address to send from
     - **Sender name**: e.g., "Coupon Dispenser"

3. **Test the Configuration**
   - Try creating a new user
   - Check if the email is received

## Option 3: Use Resend (Already Integrated!)

The application already has Resend integration! Just add your API key.

### Steps:

1. **Get Resend API Key**
   - Sign up at https://resend.com
   - Get your API key from the dashboard

2. **Configure Environment Variable**
   - Open your `.env` file
   - Add:
     ```
     RESEND_API_KEY=re_your_api_key_here
     RESEND_FROM_EMAIL="Coupon Dispenser <noreply@yourdomain.com>"
     ```
   - Replace `re_your_api_key_here` with your actual Resend API key

3. **Verify Your Domain (Production)**
   - In Resend dashboard, add your domain
   - Add the DNS records they provide
   - Wait for verification

4. **Test**
   - Create a new user
   - You should receive a beautiful custom HTML email!

## Verification

To verify email is working:

1. **Check Server Logs**
   - Look for these messages in your terminal:
     ```
     ✓ Recovery email generated and sent via Supabase
     ✓ User should receive email at: user@example.com
     ```

2. **Check Supabase Logs**
   - Go to "Logs" → "Postgres Logs"
   - Look for email-related entries

3. **Test Email Delivery**
   - Create a test user with your own email
   - Check your inbox (and spam folder)
   - You should receive a password reset email

## Troubleshooting

### Emails Not Being Sent?

1. **Check Supabase Email Templates**
   - Make sure "Reset Password" template is enabled
   - Go to "Authentication" → "Email Templates"

2. **Check Environment Variables**
   ```bash
   echo $NEXTAUTH_URL
   # Should show: http://localhost:3000
   ```

3. **Check Email Configuration**
   - Make sure "Enable Email Signup" is ON in Supabase
   - Verify SMTP settings if using custom SMTP

4. **Check Rate Limits**
   - Supabase free tier has email rate limits
   - Upgrade if you need more emails

### Custom Email Template Not Working?

1. **Make sure Resend is configured**
   - Check `.env` file for `RESEND_API_KEY`
   - Verify the key is valid in Resend dashboard

2. **Check Domain Verification**
   - For production, your domain must be verified
   - For development, Resend provides a test domain

## Quick Test

To quickly test if email is working:

```bash
# The application will log email attempts
# Look for these messages in your terminal when creating a user:
```

You should see:
```
✓ Recovery email generated and sent via Supabase
✓ User should receive email at: [email]
✓ Reset link: [link]
```

If you see these messages, Supabase is generating the email. If you don't receive it, check your spam folder or Supabase email configuration.

## Next Steps

1. Set up Resend for custom beautiful emails (recommended)
2. Or configure custom SMTP in Supabase for production
3. Customize email templates in Supabase dashboard (optional)

---

**Note**: The application is already set up to send emails automatically when a user is created. You just need to configure the email provider (Supabase default, custom SMTP, or Resend).

