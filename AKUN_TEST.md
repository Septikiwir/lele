# Akun Test untuk LeleFarm

## Cara Melihat Akun yang Terdaftar

Saat ini **belum ada akun default** yang dibuat otomatis. Anda perlu membuat akun baru dengan salah satu cara berikut:

## Cara 1: Registrasi Manual

1. Buka `http://localhost:3000/register`
2. Isi form dengan data Anda:
   - Nama Lengkap
   - Email
   - Password (minimal 6 karakter)
   - Konfirmasi Password
3. Klik **Daftar**
4. Setelah berhasil, login di `http://localhost:3000/login`

## Cara 2: Login dengan Google

1. Setup Google OAuth terlebih dahulu (lihat `GOOGLE_OAUTH_SETUP.md`)
2. Buka `http://localhost:3000/login`
3. Klik **Masuk dengan Google**
4. Pilih akun Google Anda
5. Akun akan otomatis dibuat di database

## Cara 3: Membuat User Test via Prisma Studio

Saya sudah membuka **Prisma Studio** untuk Anda. Anda bisa:

1. Buka browser di `http://localhost:5555`
2. Klik model **User**
3. Klik **Add record** untuk membuat user baru
4. Isi data yang diperlukan

**CATATAN**: Password harus di-hash menggunakan bcrypt. Lebih mudah menggunakan form registrasi.

## Cara 4: Seed Database dengan User Test

Jika ingin membuat user test otomatis, jalankan script berikut di terminal:

```bash
# Buat file seed-user.ts di folder prisma
# Kemudian jalankan:
npx tsx prisma/seed-user.ts
```

## Membuat Script Seed User (Opsional)

Buat file `prisma/seed-user.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            name: 'Test User',
            password: hashedPassword,
        },
    })
    
    console.log('✅ User created:', user.email)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
```

Kemudian jalankan:
```bash
npm install tsx --save-dev
npx tsx prisma/seed-user.ts
```

**Login credentials:**
- Email: `test@example.com`
- Password: `password123`

## Melihat User yang Sudah Terdaftar

Gunakan Prisma Studio yang sudah dibuka di `http://localhost:5555` atau jalankan query:

```bash
npx prisma studio
```

Atau via terminal:
```bash
npx prisma db execute --stdin < query.sql
```

Dengan file `query.sql`:
```sql
SELECT id, email, name, createdAt FROM User;
```
