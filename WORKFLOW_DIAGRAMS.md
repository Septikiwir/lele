# Admin Workflow Diagram

## 🔄 Complete Login & Access Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER ACCESSES APPLICATION                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ├─ Superadmin?
                            │
                ┌───────────┴──────────┐
                │                      │
         YES ─►┌──────────────┐       │
         (SUPERADMIN)  │           NO
            Redirect   │           │
            ────────► │           │
                      ├─────────────────┐
                      │                 │
                   Login              Regular
                  /admin/             User
                  login         /login
                      │          │
                      │          │
                   Enter        Enter
                   email &      email &
                password     password
                      │          │
                      ├─ Verify ─┤
                      │ Creds.   │
                      │          │
                   ✓ Pass    ✓ Pass
                      │          │
                   Check      Check
                   Role        Role
                      │          │
              Is     │      │ Is
             SUPER  │      │OWNER/OPERATOR?
             ADMIN? │      │
                │    │      │
             YES │    │    YES │
                │    │      │
                │    NO      │
         ✓ Proceed │        ✓ Proceed
                │  │         │
                │  │    ✗ Blocked
                │  │      │
                │  └──►┌──────────────┐
                │  │   │ Redirect to  │
                │  │   │ /admin/login │
                │  │   │ Error: Not   │
                │  │   │ Superadmin   │
                │  │   └──────────────┘
                │  │
                │  └──► Redirect to
                │       /dashboard
                │
           Create
           Session
                │
                ├─► /farms
                │   (Admin Panel)
                │
                └─► Sidebar shows
                    "Panel Admin" link
                    (Purple button)
```

---

## 📋 Admin Panel - Farm Management Workflow

```
┌────────────────────────────────────────────────────────────┐
│          SUPERADMIN ACCESS: /farms (Admin Panel)           │
└────────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   View Farms        Create Farm       Edit Farm
        │                │                │
        │                ├─ Click       ├─ Click
        │                │ "Buat         │ Pencil
        │                │ Peternakan"   │ Icon
        │                │               │
        │            Two Step        Form with
        │            Wizard          Fields:
        │            Process         - Farm name
        │                │           - Address
        │            ┌───┴────┐      │
        │            │        │      │
        │        Step 1    Step 2    │
        │        │        │         │
   List all   Create   Create    Update
   farms      Owner    Farm      Fields
        │      │        │         │
        │    Form:      Form:     │
        │    - Email    - Owner   │
        │    - Name     - Farm    │
        │    - Pass     - Address │
        │                │         │
        │            ✓ Submit  ✓ Save
        │                │         │
   Display    │         │
   in Grid    ├──────────────────┤
        │    │ Redirect to /farms
        │    │ Show new farm in list
        │    │
        └────┴── Cards show:
             - Farm name
             - Address
             - Owner info
             - Date created
             - Edit button
             - Delete button
```

---

## 🔐 Authorization & Role Check Flow

```
┌──────────────────────────────────────────────────┐
│       USER REQUESTS PROTECTED RESOURCE            │
└──────────────────────────────────────────────────┘
                    │
        ┌───────────┴──────────┐
        │                      │
    API Request          Page Access
    /api/admin/*          /farms
        │                  │
        │              Check Session
        │                  │
    Authenticate       ├─ Exists?
    User               │
        │          YES │
        │              │
    Verify          Fetch User
    Token           Role from
        │           DB
    Valid?          │
        │       ✓ Role:
    YES │       SUPERADMIN?
        │           │
    YES │       ✓ YES │
        │           │
    Get User       Render
    Role           Page
        │           │
    From DB        OR
        │       ✗ NO │
        │           │
    Role:          Redirect
    SUPERADMIN?    to
        │      /admin/login
        │           │
    ✓ YES │      Show Error:
        │  │  "Anda bukan
        │  │   superadmin"
    ✓ YES │
        │       Continue
        │       Request
        │           │
    Process    Display
    Request    Content
        │           │
    Return      Page
    Data        Loads
```

---

## 👤 User Role Access Matrix

```
┌─────────────────┬─────────┬──────┬──────────┐
│ Feature         │ Admin   │ Owner│Operator  │
├─────────────────┼─────────┼──────┼──────────┤
│ /admin/login    │  ✅     │  ❌  │   ❌     │
│ /login          │  ❌     │  ✅  │   ✅     │
│ /farms          │  ✅     │  ❌  │   ❌     │
│ /dashboard      │  ❌     │  ✅  │   ✅     │
│ Create farms    │  ✅     │  ❌  │   ❌     │
│ Edit farms      │  ✅     │  ❌  │   ❌     │
│ Delete farms    │  ✅     │  ❌  │   ❌     │
│ Create owners   │  ✅     │  ❌  │   ❌     │
│ View all farms  │  ✅     │  ❌  │   ❌     │
│ View own farm   │  ❌     │  ✅  │   ✅     │
│ Manage kolam    │  ❌     │  ✅  │   ❌     │
│ View pakan      │  ❌     │  ✅  │   ✅     │
│ Finance/Budget  │  ❌     │  ✅  │   ❌     │
│ Panel Admin link│  ✅     │  ❌  │   ❌     │
└─────────────────┴─────────┴──────┴──────────┘

Legend:
✅ = Has access
❌ = No access
```

---

## 🔐 Data Access Control

```
┌─────────────────────────────────────────────────┐
│    ROW-LEVEL SECURITY (Database Level)          │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
    User Table  Farm Table  FarmMember
        │           │           Table
        │       ┌─────────┐     │
        │       │ User ID │     │
        │       │ cannot  │     │
        │       │ see     │     │
        │       │ other   │     │
        │       │ users'  │     │
    All   │       │ data    │     │
    users │       │         │     │
    can   │       └─────────┘     │
    see   │                       │
    own   │    ┌─────────────┐    │
    data  │    │ User can    │    │
        │       │ see farms  │    │
        │       │ they own   │    │
        │       │ only       │    │
        │       └─────────────┘    │
        │                         │
        │                    ┌──────────┐
        │                    │ Operator │
        │                    │ can see  │
        │                    │ assigned │
        │                    │ farms    │
        │                    │ only     │
        │                    └──────────┘

Service Role (Prisma):
✅ Full access to all data
   (Needed for server-side operations)
```

---

## 🔄 Data Flow: Create Farm

```
Superadmin Interface
        │
        ├─ Fill Owner Form
        │  - Email
        │  - Name
        │  - Password
        │
        └──► Submit
             │
        POST /api/admin/owners
             │
        ┌────┴────────┐
        │             │
    Validate       Hash
    Inputs        Password
        │             │
        └─────┬───────┘
              │
          CREATE User
              │
              ├─ Save to DB
              │ - email
              │ - name
              │ - hashed_password
              │ - role: 'OWNER'
              │ - emailVerified: now
              │
              └──► User Created ✅
                   │
                Step 2
                   │
        Fill Farm Form
        - Farm name
        - Address
        │
        └──► Submit
             │
        POST /api/admin/farms
             │
        ┌────┴────────┐
        │             │
    Validate       Create
    Inputs        Farm
        │             │
        └─────┬───────┘
              │
          CREATE Farm
              │
              ├─ Save to DB
              │ - nama
              │ - alamat
              │ - ownerId: (from step 1)
              │ - createdAt: now
              │
              ├──► Farm Created ✅
              │
          CREATE FarmMember
              │
              ├─ Save to DB
              │ - farmId
              │ - userId: owner.id
              │ - role: 'OWNER'
              │
              └──► Done ✅
                   │
            Redirect to /farms
                   │
        Display updated
        farm list with
        new farm
```

---

## 🛡️ Security Layers

```
Layer 1: Frontend
┌──────────────────────────┐
│ UI Components            │
├──────────────────────────┤
│ Role Check: user.role === 'SUPERADMIN'
│ Show/hide "Panel Admin" button
│ Redirect if unauthorized
└──────────────────────────┘
            ↓
Layer 2: API Endpoint
┌──────────────────────────┐
│ Route Handlers           │
├──────────────────────────┤
│ Check: session exists?
│ Verify: user authenticated?
│ Validate: user.role === 'SUPERADMIN'
│ Process request or return 403
└──────────────────────────┘
            ↓
Layer 3: Database
┌──────────────────────────┐
│ Row-Level Security       │
├──────────────────────────┤
│ RLS Policies enabled
│ User isolation at DB level
│ Service role for Prisma full access
└──────────────────────────┘
            ↓
Layer 4: Data Validation
┌──────────────────────────┐
│ Input Validation         │
├──────────────────────────┤
│ Email format check
│ Unique email constraint
│ Password length (min 6)
│ Required field validation
└──────────────────────────┘
```

---

## 📱 Mobile vs Desktop UX

```
┌─────────────────────┬──────────────────┐
│   DESKTOP (md+)     │   MOBILE (< md)  │
├─────────────────────┼──────────────────┤
│                     │                  │
│ Sidebar visible     │ Sidebar hidden   │
│ at all times        │ by default       │
│                     │                  │
│ Menu icon opens     │ Menu button at   │
│ drawer on click     │ bottom nav       │
│                     │                  │
│ Admin link always   │ Admin link in    │
│ visible in sidebar  │ drawer menu      │
│                     │                  │
│ Form layout:        │ Form layout:     │
│ Side-by-side        │ Full width       │
│                     │                  │
│ Admin link visible  │ Menu button      │
│ (Purple button)     │ opens drawer     │
│                     │ Shows admin link │
│                     │                  │
└─────────────────────┴──────────────────┘
```

---

## 🔄 Session & Authentication Flow

```
User Submits Login
        │
   SignIn() call
   (NextAuth)
        │
    Credentials
   Provider
        │
  ┌─────┴────────┐
  │              │
Find User   Verify
by Email    Password
  │              │
  ├─ Email        └─ Hash
  │   exists?        input
  │                  password
  YES              │
  │            ├─ Compare
  │            │   with DB
  │            │   hash
  │            │
  └──┬─────────┤
     │      ✓ Match
     │         │
  Create    Return
  Session   User Object
     │         │
     │         └──► Session Created
     │             │
     │             Call /api/auth/me
     │             │
     │         Fetch User
     │         from DB with
     │         role field
     │             │
     │         Return:
     │         {id, email, name, role}
     │             │
     │         AuthContext
     │         updates state
     │             │
     │         Role check:
     │         SUPERADMIN?
     │             │
     │         YES │
     │             │
     └─────────────┤
              │
         Redirect to
         /farms
              │
          Admin Panel
          Loaded ✅
```

---

**Diagrams Summary:**
1. Login flow shows authentication and role checking
2. Farm management workflow shows CRUD operations
3. Authorization matrix shows access control
4. Data flow demonstrates create farm process
5. Security layers ensure multi-level protection
6. Mobile/desktop UX shows responsive design
7. Session flow shows complete authentication

All systems working together to provide secure, role-based admin panel access.
