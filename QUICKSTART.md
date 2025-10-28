# Quick Start Guide

Get up and running with Coupon Dispenser in 10 minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works great)
- Basic knowledge of Next.js and React

## Step 1: Clone and Install (2 minutes)

```bash
# Clone the repository
git clone <repository-url>
cd "Coupon Dispenser"

# Install dependencies
npm install

# Make setup script executable (macOS/Linux)
chmod +x setup.sh

# Run setup (optional - sets up .env)
./setup.sh
```

## Step 2: Set Up Supabase (3 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Fill in project details and wait for database provisioning
4. Once ready, go to **Settings → API**
5. Copy these values:
   - Project URL
   - `anon` `public` key
   - `service_role` key (keep this secret!)

## Step 3: Configure Environment (1 minute)

Create `.env` file in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_this_below
DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

## Step 4: Set Up Database (2 minutes)

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy entire contents of `supabase/schema.sql`
4. Paste and click "Run"
5. Wait for success message

✅ Your database is now set up with all tables, indexes, and security policies!

## Step 5: Create Admin User (1 minute)

1. In Supabase dashboard, go to **Authentication → Users**
2. Click "Add User" → "Create User"
3. Enter email and password (e.g., admin@example.com)
4. Click "Create User"

Now make them an admin:

5. Go back to **SQL Editor**
6. Run this query (replace with your email):

```sql
UPDATE public.users 
SET role = 'super_admin' 
WHERE email = 'admin@example.com';
```

## Step 6: Start Development Server (1 minute)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 7: Log In and Explore!

1. Click "Sign In"
2. Enter your admin credentials
3. You'll see the dashboard with:
   - 📊 Overview statistics
   - 🏪 Vendor management
   - 🎟️ Coupon management
   - 👥 User management
   - 📈 Analytics
   - 📄 Reports

## Your First Vendor and Coupon

### Create a Vendor

1. Go to **Vendors** in sidebar
2. Click "Add Vendor"
3. Fill in:
   - Name: "Test Store"
   - Website: "https://teststore.com"
   - Contact Email: "contact@teststore.com"
4. Click "Create"

### Create Coupons

**Option A: Single Coupon**
1. Go to **Coupons** in sidebar
2. Click "Add Coupon"
3. Fill in:
   - Vendor: Select "Test Store"
   - Code: "SAVE20"
   - Description: "Get 20% off"
   - Discount Value: "20% off"
4. Click "Create Coupon"

**Option B: Bulk Upload**
1. Click "Bulk Upload"
2. Select vendor
3. Download CSV template
4. Add your coupons to CSV
5. Upload file

### Test the Widget

1. Copy your vendor ID from the vendors page
2. Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Widget Test</title>
</head>
<body>
    <h1>Claim Your Coupon</h1>
    
    <script src="http://localhost:3000/widget.js"></script>
    <div id="coupon-widget" data-vendor="YOUR_VENDOR_ID"></div>
</body>
</html>
```

3. Open in browser and test claiming!

## Common Issues

### "Cannot connect to database"
- Check your `.env` file has correct credentials
- Ensure Supabase project is active
- Verify DATABASE_URL is correct

### "Unauthorized" when logging in
- Check user exists in Supabase Auth
- Verify role is set in `users` table
- Clear browser cookies and try again

### Widget not loading
- Ensure dev server is running
- Check vendor ID is correct
- Open browser console for errors

## Next Steps

Now that you're set up:

1. **Explore Features**:
   - Create multiple vendors
   - Upload coupons via CSV
   - Invite users and assign roles
   - View analytics

2. **Read Documentation**:
   - [README.md](./README.md) - Full documentation
   - [API.md](./API.md) - API reference
   - [WIDGET_INTEGRATION.md](./WIDGET_INTEGRATION.md) - Widget guide

3. **Deploy to Production**:
   - [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
   - Use Vercel for hosting
   - Configure production environment variables

4. **Customize**:
   - Update branding in components
   - Modify color scheme in `tailwind.config.ts`
   - Add custom analytics

## Testing

Run tests to ensure everything works:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Development Tips

### Hot Reload
Changes auto-reload in development. No need to restart server.

### Database Changes
After modifying schema, restart the dev server to see changes.

### Clear Cache
If you see stale data:
```bash
rm -rf .next
npm run dev
```

### Type Checking
Check for TypeScript errors:
```bash
npm run type-check
```

### Linting
Fix code style issues:
```bash
npm run lint
```

## Getting Help

- 📚 Check [README.md](./README.md) for detailed docs
- 🐛 Found a bug? Open an issue on GitHub
- 💬 Questions? Check existing issues first
- 📖 Read the full documentation in this repo

## What's Next?

You're all set! Here are some ideas:

1. **Add More Vendors**: Build your vendor database
2. **Import Coupons**: Use CSV for bulk uploads
3. **Create Partner Admins**: Assign vendors to partners
4. **Embed Widget**: Add to your website
5. **View Analytics**: Track coupon performance
6. **Export Reports**: Generate CSV reports

---

**Congratulations! You're ready to manage coupons like a pro! 🎉**

Need help? Check the documentation or open an issue.

