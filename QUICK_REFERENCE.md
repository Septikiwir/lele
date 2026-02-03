# Quick Reference - Admin Panel

## 🚀 Start Here

### Development Server
```bash
npm run dev
# Server at: http://localhost:3000
```

### Login URLs
- **Superadmin:** `http://localhost:3000/admin/login`
- **Owner/User:** `http://localhost:3000/login`

---

## 🔐 Test Credentials

### Superadmin
```
Email:    superadmin@example.com
Password: superadmin123
Access:   Admin panel at /farms
```

### Test Owner
```
Email:    test@example.com
Password: password123
Access:   Dashboard at /dashboard
```

---

## 📋 What Each User Can Do

### 🛡️ SUPERADMIN
- Login at `/admin/login`
- Access admin panel at `/farms`
- Create owner accounts
- Create farms
- Edit/delete farms
- View all farms in system
- See "Panel Admin" link in sidebar (purple button)

### 👤 OWNER
- Login at `/login`
- Access dashboard at `/dashboard`
- Manage their own farm(s)
- View operations (Kolam, Pakan, Kualitas Air, etc.)
- Cannot access admin panel
- Cannot see "Panel Admin" link

### 🔧 OPERATOR
- Login at `/login`
- Limited access to farm data
- Read-only access to most features
- Cannot access finance section
- Cannot access admin panel

---

## 🧪 Testing Checklist

- [ ] Admin login page loads at `/admin/login`
- [ ] Can login with superadmin@example.com / superadmin123
- [ ] After login → redirects to `/farms`
- [ ] Admin panel shows farm list
- [ ] "Panel Admin" button visible in sidebar (purple)
- [ ] Can create new farm (click "Buat Peternakan")
- [ ] Farm creation works (2-step process)
- [ ] Regular user login still works at `/login`
- [ ] Regular user cannot see admin panel
- [ ] Regular user cannot access `/farms`

---

## 🔍 Quick Verification

```bash
# Check system health
node scripts/verify-system.js

# Check superadmin account
node scripts/verify-superadmin.js

# Database check (Superadmin exists)
# SELECT email, role FROM "User" WHERE email = 'superadmin@example.com';
# Should return: superadmin@example.com | SUPERADMIN
```

---

## 📍 Important Locations

| Path | Purpose | Access |
|------|---------|--------|
| `/admin/login` | Admin login page | Public |
| `/farms` | Admin panel (farm management) | SUPERADMIN only |
| `/login` | Regular user login | Public |
| `/dashboard` | User dashboard | All users |
| `/api/auth/me` | Get current user + role | Authenticated |
| `/api/admin/farms` | Farm API (list/create) | SUPERADMIN only |
| `/api/admin/owners` | Owner creation API | SUPERADMIN only |

---

## 🛠️ Common Tasks

### Create a New Owner Account

1. Login as superadmin at `/admin/login`
2. Navigate to `/farms`
3. Click "Buat Peternakan" button
4. **Step 1:** Enter owner details
   - Email (unique)
   - Name
   - Password (6+ chars)
5. **Step 2:** Enter farm details
   - Farm name
   - Address
6. Click "Simpan Peternakan"

### Edit a Farm

1. Login as superadmin at `/admin/login`
2. Go to `/farms`
3. Find farm card
4. Click pencil icon (edit)
5. Update farm name/address
6. Click "Simpan Perubahan"

### Delete a Farm

1. Login as superadmin
2. Go to `/farms`
3. Find farm card
4. Click trash icon (delete)
5. Confirm deletion

---

## ⚠️ Troubleshooting

**"Anda bukan superadmin"**
- Wrong account or role not SUPERADMIN
- Use: `superadmin@example.com`

**Admin link not showing in sidebar**
- Logged in as wrong user
- Refresh page (Ctrl+Shift+R)
- Check `/api/auth/me` endpoint

**Can't access /farms**
- Must be logged in as SUPERADMIN
- Regular users redirected to `/admin/login`

**Farm creation fails**
- Email already used → use new email
- Password < 6 chars → use longer password
- Check validation error messages

---

## 📚 Documentation

- **ADMIN_SETUP_COMPLETE.md** - Full setup summary
- **ADMIN_PANEL_SETUP.md** - Detailed architecture
- **TESTING_GUIDE.md** - Complete testing procedures
- **README.md** - Project overview

---

## 🎯 Key Files

```
Frontend:
  app/admin/login/page.tsx ............. Login page
  app/farms/page.tsx ................... Admin panel
  app/components/layout/Sidebar.tsx .... Admin link
  app/context/AuthContext.tsx .......... User role fetching

Backend:
  app/api/auth/me/route.ts ............ Get user + role
  app/api/admin/farms/route.ts ........ Farm operations
  app/api/admin/owners/route.ts ....... Owner creation

Scripts:
  scripts/verify-system.js ............ System check
  scripts/verify-superadmin.js ........ Account check
```

---

## 🔒 Security Notes

- ✅ Passwords hashed with bcryptjs
- ✅ Role-based access control
- ✅ Row-Level Security on database
- ✅ API authorization checks
- ✅ Session-based authentication
- ✅ Input validation on all forms

---

## 📞 Need Help?

1. **Run verification:** `node scripts/verify-system.js`
2. **Check logs:** Terminal running `npm run dev`
3. **Browser console:** F12 → Console tab
4. **Documentation:** See ADMIN_PANEL_SETUP.md or TESTING_GUIDE.md

---

**Status: ✅ Production Ready**

System is fully operational and ready for testing and deployment.
