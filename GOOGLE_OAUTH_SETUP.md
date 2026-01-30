# Setup Google OAuth untuk LeleFarm

## Langkah-langkah Setup

### 1. Buat Project di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik **Select a project** → **New Project**
3. Beri nama project (contoh: "LeleFarm")
4. Klik **Create**

### 2. Aktifkan Google+ API

1. Di sidebar kiri, pilih **APIs & Services** → **Library**
2. Cari "Google+ API"
3. Klik **Enable**

### 3. Konfigurasi OAuth Consent Screen

1. Di sidebar kiri, pilih **APIs & Services** → **OAuth consent screen**
2. Pilih **External** (untuk testing) atau **Internal** (untuk organisasi)
3. Klik **Create**
4. Isi informasi yang diperlukan:
   - **App name**: LeleFarm
   - **User support email**: email Anda
   - **Developer contact information**: email Anda
5. Klik **Save and Continue**
6. Di halaman **Scopes**, klik **Add or Remove Scopes**
7. Pilih scope berikut:
   - `userinfo.email`
   - `userinfo.profile`
8. Klik **Update** → **Save and Continue**
9. Di halaman **Test users**, tambahkan email untuk testing
10. Klik **Save and Continue**

### 4. Buat OAuth 2.0 Credentials

1. Di sidebar kiri, pilih **APIs & Services** → **Credentials**
2. Klik **Create Credentials** → **OAuth client ID**
3. Pilih **Application type**: **Web application**
4. Beri nama (contoh: "LeleFarm Web Client")
5. Di **Authorized JavaScript origins**, tambahkan:
   ```
   http://localhost:3000
   ```
6. Di **Authorized redirect URIs**, tambahkan:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Klik **Create**
8. Copy **Client ID** dan **Client Secret** yang muncul

### 5. Update File .env

1. Buka file `.env` di root project
2. Replace nilai berikut dengan credentials Anda:
   ```env
   GOOGLE_CLIENT_ID="paste-your-client-id-here"
   GOOGLE_CLIENT_SECRET="paste-your-client-secret-here"
   ```

### 6. Restart Development Server

```bash
npm run dev
```

## Testing

1. Buka browser dan akses `http://localhost:3000/login`
2. Klik tombol **Masuk dengan Google**
3. Login dengan akun Google yang sudah ditambahkan sebagai test user
4. Anda akan diarahkan ke halaman dashboard setelah berhasil login

## Production Setup

Untuk production, tambahkan URL production Anda di:
- **Authorized JavaScript origins**: `https://yourdomain.com`
- **Authorized redirect URIs**: `https://yourdomain.com/api/auth/callback/google`

Dan update `.env.production`:
```env
NEXTAUTH_URL="https://yourdomain.com"
```

## Troubleshooting

### Error: redirect_uri_mismatch
- Pastikan URL redirect di Google Console sama persis dengan yang di aplikasi
- URL harus termasuk protocol (http/https)

### Error: Access blocked
- Pastikan email Anda sudah ditambahkan sebagai test user di OAuth consent screen
- Atau publish app Anda (jika siap untuk production)

### User tidak tersimpan di database
- Pastikan Prisma schema sudah include Account dan Session model
- Jalankan `npx prisma generate` dan `npx prisma db push`
