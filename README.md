# Coupon Dispenser

A production-grade web application for managing and distributing coupons with role-based access control, analytics, and embeddable widgets.

## ✨ Features

- **🔐 Role-Based Access Control**: Super Admin, Partner Admin, and User roles
- **🏪 Vendor Management**: Create, edit, and delete vendors with full CRUD operations
- **🎟️ Coupon Management**: Bulk CSV upload, manual creation, and comprehensive tracking
- **📅 Monthly Claim Rule**: Configurable limit - users can claim one coupon per vendor per month
- **📊 Analytics Dashboard**: Real-time insights with beautiful Recharts visualizations
- **🔗 Embeddable Widget**: Lightweight, responsive widget for partner websites
- **🔌 REST API**: Secure API with Zod validation and proper error handling
- **📈 Reporting**: CSV export and comprehensive analytics with date filtering
- **✅ Full Test Coverage**: Unit, integration, and UI tests (90%+ coverage)

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: NextAuth with Supabase adapter
- **Styling**: Tailwind CSS with custom design system
- **Validation**: Zod for runtime type checking
- **Charts**: Recharts for data visualization
- **Testing**: Jest, React Testing Library, Supertest
- **CSV Processing**: PapaParse

## 📋 Prerequisites

- Node.js 18 or higher
- Supabase account ([sign up free](https://supabase.com))
- npm or yarn package manager

## 🛠️ Installation

### 1. Clone and Install

```bash
git clone <repository-url>
cd "Coupon Dispenser"
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Fill in your environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
DATABASE_URL=your_postgres_connection_string
```

### 3. Database Setup

1. Create a Supabase project
2. Go to SQL Editor in Supabase dashboard
3. Copy and run the contents of `supabase/schema.sql`

This creates:
- All necessary tables with proper indexes
- Row Level Security (RLS) policies
- Database triggers for timestamps
- Default system configuration

### 4. Create Test Users

In Supabase Auth, create users then run:

```sql
-- Make a user super admin
UPDATE public.users 
SET role = 'super_admin' 
WHERE email = 'admin@example.com';

-- Make a user partner admin
UPDATE public.users 
SET role = 'partner_admin' 
WHERE email = 'partner@example.com';
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in!

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode (useful during development)
npm run test:watch

# Coverage report
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

See [TESTING.md](./TESTING.md) for detailed testing documentation.

## 📁 Project Structure

```
├── app/                        # Next.js 15 App Router
│   ├── api/                   # API route handlers
│   │   ├── auth/              # NextAuth endpoints
│   │   ├── vendors/           # Vendor CRUD
│   │   ├── coupons/           # Coupon management & claiming
│   │   ├── users/             # User management
│   │   └── analytics/         # Analytics endpoints
│   ├── dashboard/             # Admin dashboard pages
│   │   ├── vendors/           # Vendor management UI
│   │   ├── coupons/           # Coupon management UI
│   │   ├── users/             # User management UI
│   │   ├── analytics/         # Analytics dashboards
│   │   └── reports/           # Reporting interface
│   ├── widget/                # Embeddable widget
│   └── login/                 # Authentication page
├── components/                 # React components
│   ├── dashboard/             # Dashboard layout components
│   ├── vendors/               # Vendor management components
│   ├── coupons/               # Coupon management components
│   └── users/                 # User management components
├── lib/                       # Business logic
│   ├── auth/                  # Auth config & permissions
│   ├── db/                    # Database queries
│   │   ├── vendors.ts         # Vendor operations
│   │   ├── coupons.ts         # Coupon operations
│   │   ├── users.ts           # User operations
│   │   └── analytics.ts       # Analytics queries
│   ├── validators/            # Zod validation schemas
│   ├── utils/                 # Utility functions
│   └── supabase/              # Supabase clients
├── types/                     # TypeScript type definitions
│   ├── database.ts            # Database types
│   ├── api.ts                 # API types
│   └── next-auth.d.ts         # NextAuth extensions
├── __tests__/                 # Test files
├── supabase/                  # Database schema
└── public/                    # Static files
```

## 🔌 API Documentation

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out

### Vendors
- `GET /api/vendors` - List vendors (with optional `?stats=true`)
- `POST /api/vendors` - Create vendor (Super Admin only)
- `GET /api/vendors/:id` - Get vendor details
- `PUT /api/vendors/:id` - Update vendor (Super Admin only)
- `DELETE /api/vendors/:id` - Delete vendor (Super Admin only)

### Coupons
- `GET /api/coupons` - List coupons (filter with `?vendor_id=xxx`)
- `POST /api/coupons` - Create coupon(s) (single or bulk)
- `GET /api/coupons/:id` - Get coupon details
- `DELETE /api/coupons/:id` - Delete coupon
- `POST /api/coupons/claim` - Claim a coupon

### Users
- `GET /api/users` - List users (Super Admin only)
- `PUT /api/users/:id/role` - Update user role (Super Admin only)
- `GET /api/users/:id/access` - Get partner vendor access
- `PUT /api/users/:id/access` - Update partner vendor access

### Analytics
- `GET /api/analytics?type=overview` - Overview statistics
- `GET /api/analytics?type=vendors` - Vendor analytics
- `GET /api/analytics?type=trends&days=30` - Claim trends
- `GET /api/analytics?type=top-vendors&limit=10` - Top vendors

## 🔗 Widget Integration

### Basic Usage

Add to any HTML page:

```html
<script src="https://your-domain.vercel.app/widget.js"></script>
<div id="coupon-widget" data-vendor="YOUR_VENDOR_ID"></div>
```

See [WIDGET_INTEGRATION.md](./WIDGET_INTEGRATION.md) for advanced usage.

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

Quick deploy to Vercel:

```bash
vercel deploy
```

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Widget Integration](./WIDGET_INTEGRATION.md) - Embed widget on websites
- [Testing Guide](./TESTING.md) - Writing and running tests
- [Contributing](./CONTRIBUTING.md) - Contribution guidelines

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control throughout the application
- Server-side validation with Zod
- Secure session management with NextAuth
- Environment variables for sensitive data
- HTTPS enforced in production

## 🎯 Key Features Explained

### Monthly Claim Rule
Users can claim one coupon per vendor per month. This is:
- Configurable via the system_config table
- Enforced at the database and API level
- Tracked in the claim_history table

### Role-Based Access

**Super Admin**
- Full access to all features
- Manage vendors, coupons, users
- View all analytics and reports

**Partner Admin**
- Manage coupons for assigned vendors
- View vendor-specific analytics
- Cannot manage other users

**User**
- Claim coupons
- View personal claim history
- One claim per vendor per month

## 📝 License

MIT

## 🙋 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review the test suite for examples

---

Built with ❤️ using Next.js 15, React 19, Supabase, and TypeScript

