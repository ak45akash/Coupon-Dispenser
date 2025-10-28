# Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. A Vercel account
2. A Supabase project set up
3. All environment variables configured

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned

### 2. Run Database Schema

1. In your Supabase project, go to the SQL Editor
2. Copy the contents of `supabase/schema.sql`
3. Execute the SQL to create all tables, indexes, and RLS policies

### 3. Create Test Users

Run the following SQL to create test users:

```sql
-- Insert test users (you'll need to create these via Supabase Auth first)
-- Then update their roles:

-- Super Admin
UPDATE public.users 
SET role = 'super_admin' 
WHERE email = 'admin@example.com';

-- Partner Admin
UPDATE public.users 
SET role = 'partner_admin' 
WHERE email = 'partner@example.com';

-- Regular User (default, no update needed)
```

### 4. Get Supabase Credentials

From your Supabase project settings:
- Project URL: `Settings > API > Project URL`
- Anon/Public Key: `Settings > API > Project API keys > anon public`
- Service Role Key: `Settings > API > Project API keys > service_role` (keep secret!)

## Vercel Deployment

### 1. Connect Repository

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository

### 2. Configure Environment Variables

Add these environment variables in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=generate_random_secret_here
DATABASE_URL=your_postgres_connection_string
```

To generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 3. Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your application will be live at `https://your-project.vercel.app`

## Post-Deployment

### 1. Create Admin User

1. Visit your deployed application
2. Sign up with your admin email
3. In Supabase SQL Editor, update the user role:
   ```sql
   UPDATE public.users 
   SET role = 'super_admin' 
   WHERE email = 'your-admin@example.com';
   ```

### 2. Configure Domain (Optional)

1. In Vercel dashboard, go to Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` to your custom domain

### 3. Test Widget Integration

1. Get a vendor ID from your dashboard
2. Add this code to a test HTML file:
   ```html
   <script src="https://your-domain.vercel.app/widget.js"></script>
   <div id="coupon-widget" data-vendor="VENDOR_ID"></div>
   ```

## Monitoring

### Vercel Analytics

Enable Vercel Analytics in your project settings for:
- Page views
- Performance metrics
- Web Vitals

### Supabase Monitoring

Monitor in Supabase dashboard:
- Database performance
- API usage
- Auth activity

## Troubleshooting

### Build Errors

If build fails:
1. Check all environment variables are set
2. Verify no TypeScript errors locally: `npm run type-check`
3. Check Vercel build logs for specific errors

### Database Connection Issues

If database won't connect:
1. Verify `DATABASE_URL` is correct
2. Check Supabase project is active
3. Ensure RLS policies are set up correctly

### Authentication Issues

If login doesn't work:
1. Verify `NEXTAUTH_SECRET` is set
2. Check `NEXTAUTH_URL` matches your domain
3. Ensure Supabase auth is enabled

## Security Checklist

- [ ] All environment variables are set in Vercel
- [ ] Service role key is never exposed to client
- [ ] RLS policies are enabled on all tables
- [ ] NEXTAUTH_SECRET is a strong random string
- [ ] Custom domain has HTTPS enabled
- [ ] Rate limiting is configured (optional)

## Backup

Regular backups are handled by Supabase. To manually backup:

1. Go to Supabase dashboard
2. Database > Backups
3. Download backup or configure automatic backups

## Scaling

For high traffic:

1. **Database**: Upgrade Supabase plan for more connections
2. **Vercel**: Pro plan for unlimited bandwidth
3. **CDN**: Use Vercel Edge Network (automatic)
4. **Caching**: Implement Redis for session storage (optional)

