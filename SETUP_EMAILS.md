# Setting Up Email in Supabase

This guide explains how to configure email sending in your Supabase project.

## Current Situation

Your application uses Supabase's `generateLink` function which automatically sends password recovery emails. However, for emails to actually be sent, you need to configure Supabase's email provider.

## How Email Works Now

The application uses Supabase's built-in email service with customizable templates. When you create a user, Supabase automatically sends a password reset email using the "Reset password" template.

### Quick Setup:

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select your project

2. **Navigate to Authentication → Email Templates**
   - Click on "Authentication" in the left sidebar
   - Click on "Email Templates"

3. **Customize the "Reset password" Template**
   - Click on the "Reset password" template
   - Edit the subject and HTML content
   - Use these variables in your template:
     - `{{ .ConfirmationURL }}` - The password reset link
     - `{{ .Email }}` - User's email address
     - `{{ .SiteURL }}` - Your site URL
     - `{{ .RedirectTo }}` - Redirect URL after reset
   
   Example template:
   ```html
   <h2>Welcome to Coupon Dispenser!</h2>
   <p>Click the button below to set your password:</p>
   <a href="{{ .ConfirmationURL }}">Set My Password</a>
   ```

4. **Save and Test**
   - Click "Save" in Supabase dashboard
   - Create a test user to verify email delivery

## Option 2: Configure Custom SMTP (For Production)

For production with better deliverability, configure your own SMTP server.

### Steps:

1. **Get SMTP Credentials**
   - Use services like:
     - **SendGrid** (https://sendgrid.com)
     - **Mailgun** (https://mailgun.com)
     - **Postmark** (https://postmarkapp.com)
     - **Amazon SES** (https://aws.amazon.com/ses)

2. **Configure SMTP in Supabase**
   - Go to "Settings" → "Auth"
   - Scroll to "SMTP Settings"
   - Enter your SMTP credentials:
     - SMTP host: e.g., `smtp.sendgrid.net`
     - SMTP port: e.g., `587`
     - SMTP user: Your SMTP username
     - SMTP password: Your SMTP password
     - Sender email: The email address to send from
     - Sender name: e.g., "Coupon Dispenser"

3. **Test the Configuration**
   - Create a test user
   - Verify email delivery

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

