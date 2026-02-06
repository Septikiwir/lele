# PWA Offline Implementation Guide

## Ringkasan Masalah

**Masalah Awal:**
- Aplikasi bisa navigasi antar halaman saat WiFi dimatikan (karena sudah di-cache oleh browser)
- Ketika halaman di-refresh (F5) dalam kondisi offline → muncul error/warning offline
- Halaman tidak bisa dimuat sama sekali

**Penyebab Teknis:**
1. **Tidak ada Service Worker** - Next.js tidak otomatis meng-cache HTML untuk mode navigate
2. **Tidak ada Cache Strategy** - Request navigation tidak di-intercept dan di-serve dari cache
3. **Tidak ada Fallback** - Tidak ada mekanisme fallback ke halaman offline atau cache lama

---

## Solusi yang Diimplementasikan

### 1. **Service Worker dengan Workbox (via next-pwa)**

#### File: `next.config.ts`

```typescript
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/, // Semua request same-origin
      handler: "NetworkFirst",
      options: {
        cacheName: "offlineCache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 jam
        },
        networkTimeoutSeconds: 3, // Fallback ke cache setelah 3 detik
      },
    },
    {
      urlPattern: /\/api\/.*/, // API routes
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60, // 1 jam
        },
        networkTimeoutSeconds: 3,
      },
    },
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
        },
      },
    },
  ],
  fallbacks: {
    document: "/offline", // Fallback untuk navigasi yang gagal
  },
});

export default withPWA(nextConfig);
```

**Strategi Caching:**
- **NetworkFirst**: Coba fetch dari network dulu, timeout 3 detik → fallback ke cache
- **CacheFirst**: Untuk static assets (gambar) → load dari cache dulu
- **Fallback**: Jika semua gagal → redirect ke `/offline`

---

### 2. **Halaman Offline Fallback**

#### File: `app/offline/page.tsx`

Halaman khusus yang ditampilkan ketika:
- User refresh halaman saat offline
- Network request gagal dan tidak ada cache
- Service worker tidak bisa serve halaman dari cache

**Fitur:**
- Deteksi online/offline real-time
- Auto-reload ketika koneksi kembali
- Informasi data tersimpan lokal
- Saran troubleshooting
- Link kembali ke homepage

---

### 3. **IndexedDB untuk Data Persistence**

#### File: `lib/offline-db.ts`

Menggunakan **Dexie.js** untuk mengelola IndexedDB dengan mudah.

**Database Schema:**
- `farms` - Data farm/tambak
- `kolam` - Data kolam
- `pakan` - Riwayat pemberian pakan
- `sampling` - Data sampling biomassa
- `kondisiAir` - Monitoring kualitas air
- `pengeluaran` - Pengeluaran operasional
- `penjualan` - Data penjualan
- `stokPakan` - Stok pakan tersedia
- `pendingSync` - Queue untuk write operations yang gagal

**Cache Manager Functions:**
```typescript
// Simpan data ke IndexedDB
await cacheManager.cacheFarms(farms);
await cacheManager.cacheKolam(farmId, kolam);
await cacheManager.cachePakan(farmId, pakan);

// Ambil data dari IndexedDB
const cachedFarms = await cacheManager.getFarms(userId);
const cachedKolam = await cacheManager.getKolam(farmId);
```

**Sync Manager Functions:**
```typescript
// Tambahkan operasi write yang gagal ke queue
await syncManager.addPendingSync(url, method, body, headers);

// Sync semua pending operations ketika online
await syncManager.syncPendingOperations();
```

---

### 4. **Online/Offline Detection Hook**

#### File: `lib/use-online.ts`

Custom React hook untuk mendeteksi status koneksi:

```typescript
const { isOnline, wasOffline } = useOnline();
```

**Fitur:**
- Listen ke event `online` dan `offline`
- Periodic check setiap 5 detik (backup untuk browser yang tidak reliable)
- Auto-trigger background sync ketika kembali online
- Tracking apakah user pernah offline (untuk menampilkan notifikasi reconnect)

---

### 5. **Integrasi dengan AppContext**

#### File: `app/context/AppContext.tsx`

**Perubahan:**

1. **Import offline utilities:**
```typescript
import { cacheManager } from '@/lib/offline-db';
```

2. **Cache-First, Network-Update Pattern:**
```typescript
// 1. Load dari cache dulu (instant UI)
const cachedKolam = await cacheManager.getKolam(farmId);
if (cachedKolam.length > 0) {
  setKolam(cachedKolam);
  setIsLoading(false);
}

// 2. Fetch dari network untuk update
try {
  const response = await fetch(`/api/farms/${farmId}/kolam`);
  const freshData = await response.json();
  setKolam(freshData);
  // 3. Cache data fresh
  await cacheManager.cacheKolam(farmId, freshData);
} catch (error) {
  // Network gagal tapi sudah ada cache = OK
  if (kolam.length === 0) {
    showToast('Offline: Menampilkan data tersimpan', 'warning');
  }
}
```

**Keuntungan:**
- UI langsung tampil dari cache (tidak ada loading)
- Data tetap fresh dari network di background
- Offline tetap bisa akses data terakhir

---

### 6. **Connection Status Banner**

#### File: `app/components/layout/DashboardLayout.tsx`

**Fitur UI:**

1. **Offline Banner** (sticky top):
```tsx
{!isOnline && (
  <div className="fixed top-0 bg-orange-600 text-white">
    <WifiOff /> Anda sedang offline - Menampilkan data tersimpan
  </div>
)}
```

2. **Reconnected Toast**:
```tsx
{showReconnectedToast && (
  <div className="fixed top-4 right-4 bg-green-600 text-white">
    <Wifi /> Kembali online - Data disinkronkan
  </div>
)}
```

---

## Flow Diagram

### **Scenario 1: Refresh Online**
```
User refresh → Service Worker intercept → Fetch from network
→ Response OK → Cache updated → Show page
```

### **Scenario 2: Refresh Offline (First Time)**
```
User refresh → Service Worker intercept → Network timeout (3s)
→ Check cache → Cache found → Show cached page
→ AppContext load data from IndexedDB → Display UI
```

### **Scenario 3: Refresh Offline (No Cache)**
```
User refresh → Service Worker intercept → Network timeout
→ No cache → Fallback to /offline page
→ Show offline UI with instructions
```

### **Scenario 4: Coming Back Online**
```
Browser detects online → useOnline hook triggered
→ syncManager.syncPendingOperations() → POST/PUT queued requests
→ refreshData() → Fetch fresh data → Update cache
→ Show "Reconnected" toast
```

---

## Konfigurasi Build

### Development Mode
```bash
npm run dev
```
- PWA disabled (untuk development speed)
- Hot reload works normally
- No service worker registration

### Production Build
```bash
npm run build
npm start
```
- PWA enabled
- Service worker generated di `/public/sw.js`
- Workbox runtime caching active

### Files Generated
```
public/
├── sw.js                 # Service worker utama
├── workbox-*.js          # Workbox runtime
└── worker-*.js           # Background sync worker
```

⚠️ **File-file ini di-gitignore** karena auto-generated setiap build.

---

## Testing PWA Offline

### 1. **Test di Browser**

#### Chrome DevTools:
1. Open DevTools → Application tab
2. Service Workers → Check if registered
3. Cache Storage → Lihat cache entries
4. Network tab → Throttling → Offline
5. Refresh page → Should load from cache

#### Test Steps:
```
✅ Buka app dalam mode online
✅ Navigate ke beberapa halaman (dashboard, kolam, pakan)
✅ Chrome DevTools → Network → Offline
✅ Refresh halaman → Halaman masih muncul
✅ Navigate ke halaman lain → Masih bisa
✅ Coba refresh lagi → Tetap berfungsi
✅ Online kembali → Muncul toast "Kembali online"
```

### 2. **Test IndexedDB Cache**

Chrome DevTools → Application → IndexedDB → `LeleFarmOfflineDB`

Check tables:
- `farms` → Farm data cached
- `kolam` → Pond data cached
- `pakan` → Feed records cached
- `pendingSync` → Write operations queued

### 3. **Test Background Sync**

Scenario:
1. Go offline
2. Try to add data (POST request) → Will fail
3. Check `pendingSync` table → Request queued
4. Go online → Auto-synced
5. Check `pendingSync` → Empty (synced successfully)

---

## Best Practices

### ✅ DO

1. **Always cache GET requests** untuk read-only data
2. **Use NetworkFirst** untuk data yang sering berubah
3. **Use CacheFirst** untuk static assets
4. **Set expiration** untuk cache (jangan unlimited)
5. **Queue failed writes** ke IndexedDB untuk sync nanti
6. **Show offline indicator** ke user
7. **Test offline scenario** sebelum production

### ❌ DON'T

1. **Jangan cache POST/PUT/DELETE** secara default
2. **Jangan cache data sensitif** (password, tokens) di IndexedDB
3. **Jangan cache unlimited** (set maxEntries & maxAgeSeconds)
4. **Jangan assume network selalu available**
5. **Jangan force reload** saat offline (akan error)

---

## Troubleshooting

### Problem: Service Worker tidak terdaftar

**Solution:**
1. Check browser console untuk error
2. Service worker hanya jalan di HTTPS atau localhost
3. Clear browser cache & hard reload (Ctrl+Shift+R)
4. Check `next.config.ts` - pastikan `disable: false` di production

### Problem: Data tidak ter-cache

**Solution:**
1. Check Network tab - pastikan request hit service worker
2. Check Cache Storage - pastikan ada entries
3. Check IndexedDB - pastikan data tersimpan
4. Verify `cacheManager` functions dipanggil setelah fetch

### Problem: Offline page tidak muncul

**Solution:**
1. Check `fallbacks.document` di next-pwa config
2. Pastikan `/offline` route exists di `app/offline/page.tsx`
3. Clear service worker registration & re-register

### Problem: Background sync tidak jalan

**Solution:**
1. Check `pendingSync` table di IndexedDB
2. Verify `syncManager.syncPendingOperations()` dipanggil saat online
3. Check browser console untuk network errors
4. Pastikan request headers valid (especially auth tokens)

---

## Security Considerations

### 1. **Authentication Tokens**
- NextAuth session di-handle by HTTP-only cookies (aman)
- Jangan simpan JWT/token di IndexedDB plain text
- Service worker tidak cache `/api/auth` endpoints

### 2. **Data Privacy**
- IndexedDB ada di client-side (bisa diakses user)
- Jangan cache data sangat sensitif
- Clear cache saat logout:
```typescript
await cacheManager.clearAllCache();
```

### 3. **HTTPS Only**
- Service worker hanya jalan di HTTPS
- Development: localhost OK
- Production: Must use HTTPS

---

## Performance Tips

### 1. **Lazy Load Cache**
- Load critical data first (kolam)
- Secondary data di-background fetch
- Tidak semua data perlu di-cache

### 2. **Cache Expiration**
- Static assets: 30 hari
- API data: 1-24 jam
- User-specific data: Session-based

### 3. **IndexedDB Limits**
- Chrome: ~60% disk space available
- Safari: 50MB default, bisa request lebih
- Monitor storage usage:
```typescript
navigator.storage.estimate().then(estimate => {
  console.log('Usage:', estimate.usage, 'Quota:', estimate.quota);
});
```

---

## Future Enhancements

### 1. **Background Sync API**
- Use native Background Sync API (bila support)
- Auto-retry failed requests in background
- Even when app closed

### 2. **Periodic Sync**
- Auto-refresh data setiap X menit (jika online)
- Keep cache fresh tanpa user interaction

### 3. **Conflict Resolution**
- Handle data conflicts ketika offline edit + online edit
- Last-write-wins atau merge strategies

### 4. **Offline Analytics**
- Track offline usage patterns
- Queue analytics events untuk sync later

---

## Kesimpulan

Dengan implementasi ini, aplikasi PWA LeleFarm sekarang:

✅ **Bisa refresh offline** tanpa error
✅ **Cache data otomatis** di IndexedDB
✅ **Show offline indicator** ke user
✅ **Auto-sync** ketika kembali online
✅ **Fallback** ke offline page bila perlu
✅ **Performance** tetap cepat dengan cache-first strategy

**Key Success Factors:**
1. Service Worker dengan Workbox (NetworkFirst + fallback)
2. IndexedDB untuk persistent storage
3. Online/Offline detection
4. Background sync queue
5. User feedback (banners, toasts)

User experience sekarang **konsisten** baik online maupun offline! 🎉
