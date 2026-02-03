# 🎬 Visual Guide - Button Actions & Features

## Farm Card Layout

```
┌─────────────────────────────────────────┐
│  Farm Test                              │
│  Jl. Test No. 1                         │
│                                         │
│  Pemilik                                │
│  Test User                              │
│  test@example.com                       │
│                                         │
│  Dibuat: 2/2/2026                       │
│                                         │
│  [Detail] [Edit] [Delete] [Members]    │
│   ← Full width  ← Smaller buttons       │
└─────────────────────────────────────────┘
```

### Button Functions:

| Button | Color | Icon | Action |
|--------|-------|------|--------|
| Detail | Teal | → | View farm details page |
| Edit | Blue | ✏️ | Edit farm name/address |
| Delete | Red | 🗑️ | Delete farm (with confirmation) |
| Members | Purple | 👥 | Manage farm members |

---

## Detail Page - Full View

```
┌──────────────────────────────────────────────────────────────┐
│ ← Kembali ke Daftar                                          │
│                                                              │
│ Farm Test                                                    │
│ Jl. Test No. 1                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ INFORMASI PETERNAKAN                                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Nama Peternakan      │ Alamat                               │
│ Farm Test            │ Jl. Test No. 1                       │
│                                                              │
│ Tanggal Dibuat       │ ID Peternakan                        │
│ 2/2/2026             │ abc123def456...                      │
│                                                              │
│ [✏️ Edit Peternakan] [👥 Kelola Pemilik]                    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ PEMILIK PETERNAKAN                                           │
├──────────────────────────────────────────────────────────────┤
│ Test User                        [PEMILIK] ← Role Badge     │
│ test@example.com                                             │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ ANGGOTA PETERNAKAN                        [👥 Kelola]       │
├──────────────────────────────────────────────────────────────┤
│ Test User                                [PEMILIK]          │
│ test@example.com                                             │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ STATISTIK                                                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [1]              [1]             [0]                       │
│  Total Anggota    Pemilik         Operator                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Member Management Page - Full View

```
┌──────────────────────────────────────────────────────────────┐
│ ← Kembali ke Detail                                          │
│                                                              │
│ Kelola Anggota Peternakan                                    │
│ Farm Test                                                    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ ANGGOTA SAAT INI                      [+ Tambah Anggota]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Test User                            [PEMILIK]              │
│ test@example.com                                             │
│                           (No delete - can't remove owner)   │
│                                                              │
│ John Operator                        [OPERATOR] [🗑️]        │
│ john@example.com                                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ TAMBAH ANGGOTA BARU                                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Cari Pengguna                                                │
│ [🔍 Cari berdasarkan nama atau email...        ]            │
│                                                              │
│ Pilih Pengguna                                               │
│ [▼ -- Pilih pengguna --                       ]             │
│    ├─ Jane User (jane@example.com)                          │
│    ├─ Mike Admin (mike@example.com)                         │
│    └─ ...                                                    │
│                                                              │
│ Peran                                                        │
│ [▼ OPERATOR ▼]  (or OWNER)                                  │
│  Operator memiliki akses terbatas...                        │
│                                                              │
│ [Tambah Anggota] [Batal]                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Delete Confirmation Modal

```
┌────────────────────────────────┐
│                                │
│  Hapus Peternakan?             │
│                                │
│  Tindakan ini tidak dapat      │
│  dibatalkan. Semua data akan   │
│  dihapus.                      │
│                                │
│  [Batal]  [Hapus - Red]        │
│                                │
└────────────────────────────────┘
```

---

## User Workflows

### Workflow 1: View Farm Details
```
1. Admin Panel (/farms)
   ↓ Click "Detail" button
2. Farm Detail Page (/admin/farms/[id])
   ├─ View farm info
   ├─ View owner info
   ├─ View members list
   ├─ See statistics
   │
   ├─ Click "Edit Farm" → Edit Page
   ├─ Click "Manage Owner" → Member Management
   └─ Click "← Back" → Return to farm list
```

### Workflow 2: Add Farm Member
```
1. Farm Detail Page (/admin/farms/[id])
   ↓ Click "Manage Owner" button
2. Member Management Page (/admin/farms/[id]/owner)
   ↓ Click "Tambah Anggota" button
3. Add Member Form appears
   ├─ Search for user
   │  ↓ Type name/email
   │  ↓ See filtered results
   │  ↓ Click to select
   ├─ Choose role
   │  ↓ Select OPERATOR or OWNER
   └─ Click "Tambah Anggota"
   
4. Member appears in list
   ✓ Success!
```

### Workflow 3: Remove Farm Member
```
1. Member Management Page (/admin/farms/[id]/owner)
   ↓ Find member to remove
   ↓ (Cannot delete owner - no button shown)
2. Click red trash icon
   ↓ Confirmation modal appears
3. Confirm deletion
   ↓ Click "Hapus" button
   
4. Member removed from list
   ✓ Success!
```

### Workflow 4: Edit Farm
```
1. Farm Detail Page (/admin/farms/[id])
   OR Farm Card
   ↓ Click "Edit" button
2. Edit Farm Page (/admin/farms/[id]/edit)
   ├─ Change farm name
   ├─ Change address
   └─ Save changes
   
3. Return to farm detail
   ✓ Changes saved!
```

---

## Color Scheme

```
Teal (#14b8a6)      - Primary actions (Detail, Add, Save)
Blue (#3b82f6)      - Edit/Update actions
Red (#ef4444)       - Delete/Danger actions
Purple (#a855f7)    - Members/Users management
Green (#16a34a)     - Success/Role badges
Slate (#64748b)     - Text/Secondary content
```

---

## Response States

### Loading State
```
┌─────────────────┐
│      ⟳         │ (Spinning)
│   Loading...    │
└─────────────────┘
```

### Success Message
```
✓ Member added successfully!
✓ Farm updated!
✓ Member removed!
```

### Error Message
```
┌─────────────────────────────────┐
│ ✗ User already a member         │
│ ✗ Missing required fields       │
│ ✗ Failed to load data           │
│ ✗ Unauthorized access           │
└─────────────────────────────────┘
```

---

## Mobile Responsive Behavior

```
DESKTOP (≥768px)          MOBILE (<768px)
────────────────          ───────────────

[Detail][Edit][Del][Mem]  [Detail]
                          [Edit] [Del]
                          [Members]

Farm Info Side-by-Side    Full Width Stacked
Sidebar Visible           Sidebar Hidden

Form 2 Columns            Form Full Width
Tables Horizontal         Tables Scrollable
```

---

## Button Tooltip

Hover over buttons to see tooltips:
- Edit: "Edit" 
- Delete: "Delete"
- Members: "Assign Owner" / "Manage Members"

---

## Access Control

```
Action          Who Can Do It?
─────────────────────────────────
View Details    SUPERADMIN
Edit Farm       SUPERADMIN
Delete Farm     SUPERADMIN
Add Member      SUPERADMIN
Remove Member   SUPERADMIN
View Members    SUPERADMIN

All others      DENIED ❌
```

---

## Summary

**4 Main Actions:**

1. 📋 **Detail** - View complete farm info & members
2. ✏️ **Edit** - Modify farm name and address
3. 🗑️ **Delete** - Remove farm from system
4. 👥 **Members** - Manage farm members (add/remove)

**Each action has:**
- ✅ Clean, intuitive UI
- ✅ Form validation
- ✅ Error handling
- ✅ Confirmation dialogs
- ✅ Success feedback
- ✅ Security checks

**Everything is:**
- 📱 Responsive
- 🎨 Well-designed
- 🔒 Secure
- ⚡ Fast
- 🌍 User-friendly
