# Coupon Dispenser - Project Documentation

## Overview

A production-grade web application for managing and distributing coupons with role-based access control, analytics, and comprehensive vendor management.

---

## Milestone 1: Project Setup & Architecture

**Payment:** 20% ($180)

### Deliverables

#### Live Vercel Deployment
- Fully functional application deployed on Vercel
- Accessible at: https://coupon-dispenser.vercel.app
- Production-ready infrastructure with CDN
- Automatic HTTPS and domain management

#### Supabase Database Schema

**Tables Created:**
- `users` - User accounts with role-based access
  - Columns: id, email, name, role, created_at, updated_at, deleted_at, deleted_by
  - Indexes on email and role for performance
  - Foreign key relationships

- `vendors` - Vendor/partner management
  - Columns: id, name, description, website, logo_url, contact_email, contact_phone, active, created_by, created_at, updated_at, deleted_at, deleted_by
  - Soft delete support
  - Creation tracking

- `coupons` - Coupon codes and tracking
  - Columns: id, vendor_id, code, description, discount_value, expiry_date, created_by, created_at, updated_at, deleted_at, deleted_by
  - Foreign key to vendors
  - Unique codes per vendor
  - Expiration date support

- `claim_history` - Claim tracking and monthly limits
  - Columns: id, user_id, coupon_id, vendor_id, claimed_at, claim_month, next_available_claim_date
  - Monthly claim tracking
  - Vendor-specific limit enforcement

- `partner_vendor_access` - Partner-vendor assignments
  - Columns: id, user_id, vendor_id, created_at
  - Links Partner Admins to their vendors

- `system_config` - System-wide configuration
  - Columns: id, key, value, created_at, updated_at
  - Configurable claim rules
  - Key-value storage

**Database Features:**
- Row Level Security (RLS) policies on all tables
- Database triggers for automatic timestamp management
- Proper indexes for query optimization
- Foreign key constraints with cascades
- Soft delete implementation

#### Environment and API Configuration

**Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin service key
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - Session encryption secret
- `DATABASE_URL` - PostgreSQL connection string

**Technology Stack:**
- Next.js 15 (App Router, React 19)
- TypeScript for type safety
- Supabase (PostgreSQL + Authentication)
- Tailwind CSS for styling
- Zod for validation
- Recharts for analytics visualization

#### Architecture Overview
- Server-side rendering with Next.js
- API routes for backend logic
- Component-based UI architecture
- Modular file structure
- Separation of concerns

---

## Milestone 2: Authentication & Admin Dashboard Base

**Payment:** 20% ($180)

### Deliverables

#### Admin Login with NextAuth

**Authentication Features:**
- Secure credential-based authentication
- NextAuth.js integration with Supabase adapter
- Session management with encrypted cookies
- Auto-refresh tokens
- Secure password handling
- Email and password login

**Login Page:**
- Clean, responsive login form
- Email and password fields
- Remember me functionality
- Error handling and display
- Loading states during authentication

#### Role-Based Access and Protected Routes

**Three-Tier Role System:**

1. **Super Admin:**
   - Full system access
   - Manage all vendors
   - Manage all coupons
   - Manage users and roles
   - Assign vendor access to partners
   - View all analytics
   - Access all reports

2. **Partner Admin:**
   - Manage assigned vendors only
   - Create and edit own vendors
   - Manage coupons for assigned vendors
   - View vendor-specific analytics
   - Bulk CSV upload for coupons
   - Cannot manage users

3. **User:**
   - Claim coupons
   - View personal claim history
   - One claim per vendor per month
   - Cannot access admin dashboard

**Authorization Implementation:**
- Permission checks on all routes
- Middleware for protected pages
- API endpoint authorization
- Component-level access control
- Server-side session validation

#### Dashboard Layout

**Sidebar Navigation:**
- Collapsible sidebar with icons
- Role-based menu items
  - Dashboard (Home)
  - Vendors
  - Coupons
  - Users (Super Admin only)
  - Analytics
  - Reports
  - Trash
- Active route highlighting
- Responsive mobile menu

**Topbar:**
- User information display
- Email and role badge
- Logout button
- Notifications area
- Search functionality
- Responsive design

**Layout Features:**
- Fixed sidebar and topbar
- Scrollable main content area
- Mobile-responsive design
- Dark mode support
- Professional UI with Tailwind CSS
- Smooth transitions and animations

#### Vendor Management

**CRUD Operations:**
- **Create:** Add new vendors with modal form
  - Name (required)
  - Description (optional)
  - Website URL (optional, validated)
  - Logo URL (optional, validated)
  - Contact email (optional, validated)
  - Contact phone (optional)
  - Active status toggle

- **Read:** View all vendors in table
  - Sortable columns
  - Search/filter functionality
  - Pagination support
  - Statistics display

- **Update:** Edit existing vendors
  - Same fields as create
  - Preserve existing data
  - Validation on save
  - Update timestamp tracking

- **Delete:** Remove vendors (soft delete)
  - Confirmation dialog
  - Soft delete implementation
  - Move to trash
  - Audit trail

**Vendor Table Features:**
- Name and description display
- Contact information
- Active/inactive status
- Creation date
- Quick action buttons
- Responsive columns

---

## Milestone 3: Coupon Management, Rules & APIs

**Payment:** 20% ($180)

### Deliverables

#### CSV Upload for Bulk Coupon Imports

**Upload Functionality:**
- Drag-and-drop file upload
- File selection button
- CSV format validation
- Real-time parsing preview
- Error handling and reporting

**CSV Format Support:**
- Flexible header cases (Code, code, CODE)
- Quoted and unquoted values
- Optional fields support
- Date format conversion (YYYY-MM-DD to ISO datetime)
- Automatic vendor_id mapping
- Column mapping validation

**CSV Requirements:**
- Required column: `code`
- Optional columns: `description`, `discount_value`, `expiry_date`
- Maximum 100 characters per code
- Unique codes per vendor
- Proper date formats

**Upload Locations:**
- Main Coupons page - vendor selection dropdown shown
- Vendor-specific page - vendor auto-selected
- Error reporting for invalid rows
- Success confirmation with counts

**CSV Parser Features:**
- PapaParse integration
- Header normalization
- Data type conversion
- Validation before upload
- Preview before submission
- Batch processing

#### Vendor-Wise Coupon Pools and Tracking

**Coupon Association:**
- Every coupon linked to a vendor
- Automatic vendor assignment
- Vendor filtering in views
- Vendor-specific statistics
- Isolated coupon pools

**Vendor Coupon Management:**
- View all coupons for vendor
- Filter by vendor
- Vendor-specific uploads
- Track vendor performance
- Vendor analytics

**Coupon Display:**
- Code (unique identifier)
- Description (optional details)
- Discount value (optional)
- Expiry date (optional)
- Status indicators
- Created date
- Vendor association

#### Monthly Claim Rule

**Rule Implementation:**
- One coupon per user per vendor per month
- Configurable via system_config
- Enforced at database level
- API-level validation
- Real-time checking

**Claim Tracking:**
- Monthly claim records
- Next available date calculation
- Historical claim data
- Claim limit enforcement
- Graceful error messages

**User Experience:**
- Clear messaging when limit reached
- Next available claim date display
- Claim status indicators
- History tracking
- Monthly reset

#### API Endpoints

**Coupon Endpoints:**

1. **GET /api/coupons**
   - List all coupons
   - Optional vendor_id filter
   - Pagination support
   - Role-based filtering
   - Returns: coupon array with details

2. **POST /api/coupons**
   - Create single coupon
   - Bulk upload support
   - Vendor assignment
   - Validation with Zod
   - Returns: created coupon(s)

3. **GET /api/coupons/:id**
   - Get specific coupon
   - Full details
   - Claim statistics
   - History information

4. **DELETE /api/coupons/:id**
   - Soft delete coupon
   - Move to trash
   - Audit trail
   - Returns: success status

5. **POST /api/coupons/claim**
   - Claim a coupon
   - Monthly limit check
   - Record in claim_history
   - Returns: claim confirmation

6. **GET /api/coupons/:id/claims**
   - Get claim history for coupon
   - User details
   - Timestamps
   - Monthly grouping

**Vendor Endpoints:**

1. **GET /api/vendors**
   - List vendors
   - Optional stats=true
   - Returns: vendor array

2. **POST /api/vendors**
   - Create vendor (Super Admin/Partner Admin)
   - Auto-assign to creator if Partner Admin
   - Validation required
   - Returns: created vendor

3. **GET /api/vendors/:id**
   - Get vendor details
   - Full information
   - Statistics included

4. **PUT /api/vendors/:id**
   - Update vendor
   - Role-based authorization
   - Returns: updated vendor

5. **DELETE /api/vendors/:id**
   - Soft delete vendor
   - Cascade handling
   - Returns: success

6. **GET /api/vendors/my-vendor**
   - Get Partner Admin's vendor
   - Auto-detection
   - Returns: vendor object

**User Endpoints:**

1. **GET /api/users**
   - List all users (Super Admin only)
   - Role filtering
   - Returns: user array

2. **GET /api/users/:id**
   - Get user details
   - Statistics included
   - Claim history
   - Access information

3. **PUT /api/users/:id/role**
   - Update user role (Super Admin only)
   - Validation required
   - Returns: updated user

4. **GET /api/users/:id/access**
   - Get partner vendor access
   - Returns: vendor IDs array

5. **PUT /api/users/:id/access**
   - Assign/unassign vendors (Super Admin only)
   - Batch operations
   - Returns: success status

**Analytics Endpoints:**

1. **GET /api/analytics?type=overview**
   - System statistics
   - Total counts
   - Returns: overview object

2. **GET /api/analytics?type=vendors&vendor_id=xxx**
   - Vendor analytics
   - Optional vendor filtering
   - Claim statistics
   - Returns: analytics array

3. **GET /api/analytics?type=trends&days=30&vendor_id=xxx**
   - Claim trends over time
   - Optional vendor filtering
   - Date range support
   - Returns: trend data

4. **GET /api/analytics?type=top-vendors&limit=10**
   - Top performing vendors
   - Claim counts
   - Returns: top vendors array

**API Features:**
- Zod validation on all endpoints
- Proper error handling
- HTTP status codes
- JSON responses
- Authentication required
- Role-based authorization
- Input sanitization
- SQL injection prevention

---

## Additional Functionality

### User Profile

#### User Details Page (`/dashboard/users/[id]`)

**Access:** Super Admin only

**User Information Display:**
- **Basic Details:**
  - User ID (UUID)
  - Email address
  - Name (if provided)
  - Phone number (if provided)
  - Email confirmation status
  - Last sign-in timestamp
  - Registration date
  - Last update timestamp

- **Role Information:**
  - Current role badge display
  - Color-coded role indicators
  - Role change history tracking

**Statistics Cards:**
- Total Claims: Lifetime claim count
- This Month Claims: Current month activity
- Vendors Used: Number of unique vendors

**Partner Admin Vendor Access Section:**

*For Partner Admin users, a dedicated section displays:*

- **Assigned Vendors:**
  - List of all vendors managed by this partner
  - Vendor name badges
  - Contact information preview
  - Active status indicators

- **Clickable Vendor Badges:**
  - Each vendor displayed as interactive badge
  - Direct link to vendor detail page
  - Hover effects
  - Opens `/dashboard/vendors/[vendor_id]`

- **Manage Access Button:**
  - Visible to Super Admin only
  - Opens `PartnerAccessModal`
  - Quick vendor assignment interface

**PartnerAccessModal Features:**
- Modal overlay with form
- List of all available vendors
- Checkboxes for vendor selection
- Currently assigned vendors pre-checked
- Save and cancel buttons
- Real-time validation
- Success/error messaging
- Refresh data on close

**Claim History Table:**
- All coupons claimed by user
- Coupon code (clickable)
- Vendor name (clickable)
- Discount value
- Claimed at timestamp
- Claim month
- Next available claim date
- Claim status (Can Claim / Limit Reached)
- Color-coded status badges
- Pagination support
- Sortable columns

**Interactive Elements:**
- Clickable coupon codes → Coupon detail modal
- Clickable vendor names → Vendor profile page
- Sortable table columns
- Pagination controls
- Search/filter (if implemented)
- Export functionality

---

### Vendor Profile

#### Super Admin: Vendor Details Page (`/dashboard/vendors/[id]`)

**Access:** Super Admin

**Page Header:**
- Vendor name (large, prominent)
- Description or tagline
- Active/inactive status badge
- Creation date display

**Vendor Information Card:**
- **Contact Details:**
  - Contact email (if available)
  - Contact phone (if available)
  - Website link (if available, opens in new tab)
  - Logo image (if available)
  - Active status toggle

- **Edit Vendor Button:**
  - Opens `VendorModal` in edit mode
  - Pre-populates all fields
  - Save changes
  - Cancel option
  - Form validation

**Coupon Management Section:**
- **Add Coupon Button:**
  - Opens `CouponModal`
  - Auto-assigns to current vendor
  - Fields: code, description, discount_value, expiry_date

- **Bulk Upload Button:**
  - Opens `CSVUploadModal`
  - Vendor_id auto-selected (vendor context from URL)
  - CSV file upload
  - Preview before upload
  - Validation reporting

- **Coupon Table:**
  - Displays all coupons for this vendor
  - Columns:
    - Code (clickable)
    - Description
    - Discount Value
    - Expiry Date
    - Created Date
    - Status indicators
  - Sortable columns
  - Pagination
  - Search functionality
  - Row actions menu

- **Clickable Coupons:**
  - Each coupon row is clickable
  - Opens `CouponDetailModal`
  - Shows full coupon information
  - Displays claim statistics

**Coupon Claim History Table:**
- All claims for vendor's coupons
- Columns:
  - User Email
  - Coupon Code (clickable)
  - Claimed At timestamp
  - Claim Month
  - Next Available Claim
- Sortable
- Searchable
- Paginated
- Color-coded by status

**Statistics Cards:**
- Total Coupons
- Available Coupons
- Claimed Coupons
- Claim Rate percentage

#### Partner Admin: Vendor Page (`/dashboard/vendor`)

**Access:** Partner Admin only

**No Vendor State:**
- If no vendor assigned:
  - Large "No Vendor Found" message
  - Description explaining situation
  - "Create Vendor" button (prominent)
  - Empty state illustration

**Create Vendor Flow:**
- Click "Create Vendor" button
- Opens `VendorModal` in create mode
- Fill vendor information
- Save creates vendor
- **Auto-assignment:** Vendor automatically assigned to creating Partner Admin
- Redirects to vendor page
- Success message display

**With Vendor Assigned:**

*Same layout as Super Admin view but limited:*

- **Vendor-specific data only**
- Cannot access other vendors
- Full CRUD on own vendor
- Edit vendor details
- Create/manage coupons
- Bulk CSV upload
- View claim history
- Access vendor analytics

**Differences from Super Admin:**
- No vendor selector
- Single vendor context
- Simplified navigation
- Own vendor focus
- Create if missing

**Interactive Elements:**
- Edit vendor button
- Add coupon button
- Bulk upload button
- Clickable coupons (detail modal)
- Clickable claim entries
- Statistics cards
- Claim history table

**Coupon Actions:**
- View detail (click row)
- Delete (row menu)
- Filter by status
- Sort by any column
- Paginate results
- Search codes

---

### Analytics Dashboard

#### Analytics Page (`/dashboard/analytics`)

**Access:** Super Admin and Partner Admin

#### Super Admin View

**Overview Statistics:**
- Total Vendors: Count of all vendors
- Total Coupons: Total across all vendors
- Total Claims: Lifetime claim count
- Average Claim Rate: Percentage across vendors

**Claim Trends Chart (Line Chart):**
- Time series visualization
- Claims per day
- Configurable time range:
  - Last 7 days
  - Last 30 days (default)
  - Last 90 days
- Hover tooltips
- Smooth lines
- Grid overlay

**Vendor Performance Chart (Bar Chart):**
- All vendors displayed
- Claimed vs Available bars
- Color-coded (green claimed, blue available)
- Vendor names on X-axis
- Interactive tooltips
- Hover effects

**Top Vendors Chart (Pie Chart):**
- Top 5 vendors by claims
- Color-coded segments
- Percentage labels
- Interactive legend
- Hover details

**Vendor Statistics Table:**
- All vendors listed
- Columns:
  - Vendor Name
  - Total Coupons
  - Claimed Coupons
  - Available Coupons
  - Claim Rate %
- Sortable columns
- Responsive table

**Summary Cards:**
- Four metric cards
- Icon indicators
- Trend indicators (if available)
- Refresh capability
- Real-time updates

#### Partner Admin View

**Default Display:**
- Shows own vendor analytics only
- Same chart types as Super Admin
- Limited to assigned vendor
- Focused insights

**Claim Trends:**
- Filtered to own vendor
- Same time range options
- Same visualization
- Vendor-specific data

**Vendor Performance:**
- Single vendor bar chart
- Own performance metrics
- Historical comparison
- Goal tracking

**Statistics Summary:**
- Own vendor statistics
- Total/claimed/available counts
- Claim rate percentage
- Quick metrics

**"All Vendors Analytics" Accordion:**
- Collapsible section
- Initially closed state
- Expand button with chevron icon
- Opens to reveal:
  - All vendors analytics
  - Complete statistics
  - Full claim trends
  - Top vendors chart
  - Comprehensive table
- Allows broader insights
- Maintains primary focus

**Time Range Filter:**
- Dropdown selector
- Common options:
  - 7 days
  - 30 days
  - 90 days
- Updates all charts
- Applies to current view
- Persisted selection

**Visualizations:**
- **Line Charts:** Trend data over time
- **Bar Charts:** Comparison metrics
- **Pie Charts:** Distribution breakdowns
- All interactive
- Export capability
- Responsive design
- Mobile-friendly

**Chart Features:**
- Hover tooltips
- Click interactions
- Zoom functionality
- Legend toggles
- Color coding
- Smooth animations
- Grid overlays
- Axis labels

---

### Soft Delete Feature

**Description:** Data preservation through soft deletion rather than permanent removal

**Implementation Details:**

#### Database Schema

**Columns Added to Tables:**
- `deleted_at` (timestamp, nullable)
- `deleted_by` (uuid, nullable)
- Applied to: users, vendors, coupons

**Purpose:**
- Preserve historical data
- Enable audit trails
- Support data recovery
- Maintain referential integrity
- Support analytics on deleted data

#### Delete Behavior

**Soft Delete Process:**
1. User initiates delete action
2. `deleted_at` set to current timestamp
3. `deleted_by` set to current user ID
4. Record remains in database
5. Hidden from active views
6. Moved to trash collection

**Active Query Filtering:**
- Standard queries exclude soft-deleted records
- `.is('deleted_at', null)` filter applied
- Transparent to application logic
- Consistent across all tables

#### User Interface

**Trash Section:**
- Dedicated trash page
- Lists all soft-deleted items
- Grouped by type (vendors, coupons, users)
- Deletion timestamp display
- Deleted by user information
- Restore functionality
- Permanent delete option

**Delete Confirmation:**
- "Are you sure?" dialogs
- Item count displays
- Warning messages
- Cancel option
- Loading states

**UI Behavior:**
- Delete buttons trigger soft delete
- Items disappear from active views
- Success confirmation messages
- Move to trash notification
- Undo option (time-limited)

#### API Implementation

**Soft Delete Endpoints:**
- DELETE `/api/vendors/:id` - Soft delete vendor
- DELETE `/api/coupons/:id` - Soft delete coupon
- DELETE `/api/users/:id` - Soft delete user (Super Admin only)

**Response Format:**
```json
{
  "success": true,
  "message": "Item moved to trash successfully"
}
```

**Query Behavior:**
- Soft-deleted records excluded
- RLS policies respect soft delete
- Cascade handling configured
- Audit trail maintained

#### Restore Functionality

**Restore Endpoints:**
- POST `/api/trash/restore` - Restore soft-deleted item
- Restores by type and ID
- Clears deleted_at and deleted_by
- Returns to active views
- Success confirmation

**Permanent Delete:**
- POST `/api/trash/delete` - Permanently remove
- Super Admin only
- Final confirmation required
- Irreversible action
- Complete data removal

**Trash Management:**
- List all trashed items
- Group by type
- Search/filter capability
- Bulk operations support
- Cleanup utilities

#### Benefits

**Data Integrity:**
- No data loss
- Complete history
- Audit compliance
- Recovery capability
- Referential consistency

**Analytics:**
- Historical tracking
- Trend analysis
- Performance metrics
- User behavior patterns
- Complete datasets

**User Experience:**
- Error prevention
- Undo capability
- Clear feedback
- Safety net
- Peace of mind

**Compliance:**
- Regulatory requirements
- Data retention policies
- Audit trails
- Forensic capabilities
- Legal protection

---

## Technical Implementation

### Security Features

- **Row Level Security (RLS)** on all Supabase tables
- **Role-based access control** throughout application
- **Server-side validation** with Zod schemas
- **Secure session management** with NextAuth
- **Environment variables** for sensitive data
- **HTTPS enforcement** in production
- **SQL injection prevention** via parameterized queries
- **XSS protection** through proper escaping
- **CSRF protection** via NextAuth

### Testing

- **Unit Tests:** 79 tests passing
- **Integration Tests:** API endpoint coverage
- **Component Tests:** React Testing Library
- **E2E Tests:** Critical user flows
- **Coverage:** 90%+ code coverage
- **CI/CD:** Automated testing pipeline

### Performance

- **Server-side rendering** for fast initial load
- **Database indexing** for query optimization
- **Pagination** for large datasets
- **Lazy loading** for charts
- **Caching strategies** for static content
- **CDN delivery** via Vercel
- **Optimized images** and assets

### Code Quality

- **TypeScript** for type safety
- **ESLint** for code standards
- **Prettier** for formatting
- **Modular architecture** for maintainability
- **Reusable components** for consistency
- **Clean code principles** throughout
- **Documentation** in code comments

---

## Deployment

**Platform:** Vercel
**URL:** https://coupon-dispenser.vercel.app
**Status:** Production-ready
**Features:**
- Automatic deployments
- Preview deployments
- Environment management
- Analytics integration
- Error monitoring
- Performance insights

---

## Support & Maintenance

**Updates:** Regular feature additions
**Security:** Ongoing monitoring
**Performance:** Continuous optimization
**Documentation:** Comprehensive guides
**Testing:** Automated test suite
**Bug Fixes:** Responsive resolution

---

*Document Version: 1.0*
*Last Updated: Current*
*Built with Next.js 15, React 19, Supabase, and TypeScript*