# Admin Panel Login Setup

## Overview

The LeleFarm application now includes a dedicated admin panel for superadmin users to manage farms and owner accounts. This document outlines the authentication flow, accessing the admin panel, and managing the system.

## Architecture

### User Roles

The system implements three user roles:

1. **SUPERADMIN** - System administrator who can:
   - Create owner accounts
   - Create farms for owners
   - Edit/delete farm information
   - Access the admin panel at `/farms`

2. **OWNER** - Farm owner who can:
   - View their assigned farm(s)
   - Manage farm operations (kolam, pakan, kualitas air, etc.)
   - Access dashboard at `/dashboard`
   - Cannot access admin panel

3. **OPERATOR** - Farm staff member who can:
   - View farm data (read-only for most sections)
   - Limited access based on farm assignments
   - Cannot access keuangan (finance) section

### Login Flow

#### For Regular Users (Owners/Operators)
1. Visit: `http://localhost:3000/login`
2. Enter email and password
3. On successful login → Redirected to `/dashboard`
4. Sidebar shows navigation for farm operations

#### For Superadmin Users
1. Visit: `http://localhost:3000/admin/login`
2. Enter superadmin email and password
3. System verifies role is SUPERADMIN
4. On success → Redirected to `/farms` (admin panel)
5. Sidebar shows "Panel Admin" link (purple gradient button)
6. Admin panel allows:
   - View all farms in system
   - Create new farms with owner accounts
   - Edit/delete existing farms

## Test Credentials

### Superadmin Account
- **Email:** superadmin@example.com
- **Password:** superadmin123
- **Role:** SUPERADMIN
- **Access:** http://localhost:3000/admin/login

### Test Owner Account
- **Email:** test@example.com  
- **Password:** password123
- **Role:** OWNER
- **Access:** http://localhost:3000/login

## Implementation Details

### Files Modified/Created

#### 1. Admin Login Page
**File:** `app/admin/login/page.tsx`
- Dedicated login page for superadmin users
- Shows demo credentials in the form
- Validates user role after login
- Redirects to `/farms` (admin panel) on success
- Shows error if non-superadmin tries to access

#### 2. Superadmin Panel
**File:** `app/farms/page.tsx`
- Main admin dashboard showing all farms
- Features:
  - List all farms with owner information
  - Create new farms (two-step process)
  - Edit farm details
  - Delete farms
- Authorization: Only accessible to SUPERADMIN role
- Non-superadmin users are redirected to `/admin/login`

#### 3. Admin Navigation Link
**File:** `app/components/layout/Sidebar.tsx`
- Added purple "Panel Admin" button in sidebar
- Only visible to SUPERADMIN users
- Links to `/farms` (admin panel)
- Uses Shield icon for admin indication
- Responsive design (visible on desktop and mobile)

#### 4. Authentication Context
**File:** `app/context/AuthContext.tsx`
- Updated to fetch actual user role from database
- Uses `/api/auth/me` endpoint to get user data
- Role automatically updated after login
- Persists across page refreshes

#### 5. Auth API Endpoint
**File:** `app/api/auth/me/route.ts`
- Returns current authenticated user with role
- Used by AuthContext to verify superadmin status
- Returns: `{ id, email, name, role }`

#### 6. Admin APIs
**Files:**
- `app/api/admin/farms/route.ts` - List/create farms
- `app/api/admin/farms/[farmId]/route.ts` - Get/edit/delete farm
- `app/api/admin/owners/route.ts` - Create owner accounts
- All require SUPERADMIN role
- Proper authorization checks on each endpoint

#### 7. Database Schema
**File:** `prisma/schema.prisma`
- Added `UserRole` enum: `SUPERADMIN | OWNER | OPERATOR`
- Added `role` field to User model
- All farm-related tables include RLS policies

### Key Components

#### Admin Login Form
```tsx
// Endpoint: /admin/login
// Method: POST /api/auth/callback/credentials
// Features:
// - Email/password input fields
// - Loading state during authentication
// - Error messages for failed login
// - Demo credentials displayed
// - Role validation (SUPERADMIN check)
```

#### Admin Panel Link (Sidebar)
```tsx
// Only shown when: user.role === 'SUPERADMIN'
// Design: Purple gradient button with Shield icon
// Text: "Panel Admin"
// Link: /farms
// Responsive: Works on desktop and mobile
```

## Usage Guide

### 1. Logging in as Superadmin

1. **Navigate to Admin Login:**
   ```
   http://localhost:3000/admin/login
   ```

2. **Enter Credentials:**
   - Email: `superadmin@example.com`
   - Password: `superadmin123`

3. **Click "Masuk Panel Admin"**
   - System verifies SUPERADMIN role
   - If successful → Redirected to `/farms`
   - If not superadmin → Shows error message

4. **Verify Sidebar**
   - Look for purple "Panel Admin" button
   - Only visible to SUPERADMIN users

### 2. Accessing the Admin Panel

**From Sidebar:**
- Click the purple "Panel Admin" button (only visible if SUPERADMIN)
- Or manually navigate to: `http://localhost:3000/farms`

**Admin Panel Features:**
- View all farms in the system
- See owner information for each farm
- Create new farms (auto-creates owner accounts)
- Edit farm details (name, address)
- Delete farms from system

### 3. Creating New Farms

**Step 1: Create Owner Account**
1. Click "Buat Peternakan" button
2. Fill in owner details:
   - Email (must be unique)
   - Name
   - Password (minimum 6 characters)
3. Click "Lanjut Langkah 2"

**Step 2: Create Farm**
1. Owner details pre-filled
2. Enter farm details:
   - Farm name
   - Address
3. Click "Simpan Peternakan"
4. Automatically creates FarmMember relationship with OWNER role

### 4. Regular User Login

**For non-superadmin users (Owners/Operators):**
1. Navigate to: `http://localhost:3000/login`
2. Enter credentials
3. On success → Redirected to `/dashboard`
4. No access to admin panel (`/farms` redirects to `/admin/login`)

## Authorization Checks

### Frontend Authorization
- **AuthContext** fetches user role on mount
- Sidebar conditionally shows "Panel Admin" for SUPERADMIN
- Page components check user role before rendering

### Backend Authorization
- **All admin API routes** verify SUPERADMIN role
- **NextAuth** middleware checks authentication status
- **Row-Level Security (RLS)** on database tables
  - All policies allow service role (Prisma) full access
  - Users can only see own data (enforced at database level)

## Security Features

1. **Password Hashing**
   - Uses bcryptjs for secure password hashing
   - Salt rounds: 10

2. **Role-Based Access Control**
   - Three distinct roles with different permissions
   - Role verified after login via API
   - API endpoints check role before processing

3. **Row-Level Security (RLS)**
   - Enabled on all database tables
   - Service role policies allow Prisma full access
   - User-scoped queries for data isolation

4. **NextAuth.js**
   - Session-based authentication
   - Credentials provider for email/password
   - Secure session tokens

## Troubleshooting

### Admin Panel Link Not Showing
**Problem:** Purple "Panel Admin" button not visible in sidebar
**Solution:** 
1. Verify user role in database: `SELECT role FROM "User" WHERE email = 'your@email.com'`
2. Check that AuthContext is fetching latest role from `/api/auth/me`
3. Refresh page (Ctrl+Shift+R on Windows)

### Login Fails at Superadmin Check
**Problem:** "Anda bukan superadmin. Akses ditolak."
**Solution:**
1. Verify using correct superadmin account: `superadmin@example.com`
2. Check database: `SELECT email, role FROM "User" WHERE email = 'superadmin@example.com'`
3. Run verification script: `node scripts/verify-superadmin.js`

### Cannot Access /farms
**Problem:** Redirected to `/admin/login` when trying to access `/farms`
**Solution:**
1. Verify you're logged in as SUPERADMIN user
2. Check `/api/auth/me` endpoint returns correct role
3. Look in browser console for any fetch errors

### Farm Creation Fails
**Problem:** Error when creating owner account or farm
**Solution:**
1. Verify email is not already in database
2. Check password meets minimum 6 character requirement
3. Look for validation errors in response
4. Check browser console for detailed error messages

## Creating Additional Superadmin Accounts

```bash
# Run the verification script with interactive mode
node scripts/verify-superadmin.js

# Or create manually via SQL (with hashed password)
# First, hash a password using bcryptjs in Node.js:
# bcryptjs.hash('yourpassword', 10)
# Then insert:
INSERT INTO "User" (email, name, password, role, "emailVerified", "createdAt", "updatedAt")
VALUES ('admin@example.com', 'Admin Name', 'hashed_password_here', 'SUPERADMIN', NOW(), NOW(), NOW());
```

## Database Schema Highlights

### User Table
```sql
CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password TEXT NOT NULL,
  role "UserRole" NOT NULL DEFAULT 'OWNER',  -- SUPERADMIN, OWNER, OPERATOR
  emailVerified TIMESTAMP,
  image TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
```

### UserRole Enum
```sql
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'OWNER', 'OPERATOR');
```

## Next Steps

1. **User Management Interface** - Create pages to manage existing owners/operators
2. **Audit Logging** - Log all admin actions for compliance
3. **Email Notifications** - Send owner credentials via email
4. **Multi-Farm Support** - Allow owners to manage multiple farms
5. **Advanced Reporting** - Dashboard analytics for all farms

## Support

For issues or questions about the admin panel:
1. Check the Troubleshooting section above
2. Review logs in browser console (F12)
3. Check server logs in terminal running `npm run dev`
4. Verify database connection and user roles
