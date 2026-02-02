# PWA Offline - Quick Reference

## Masalah yang Diperbaiki

❌ **Sebelum:** Refresh (F5) saat offline → Error "Page not available"  
✅ **Sekarang:** Refresh (F5) saat offline → Halaman tampil dari cache

---

## Solusi Teknis

### 1. Service Worker (next-pwa)
- **File:** `next.config.ts`
- **Strategy:** NetworkFirst dengan 3s timeout → fallback ke cache
- **Fallback:** Redirect ke `/offline` jika tidak ada cache

### 2. IndexedDB Cache (Dexie.js)
- **File:** `lib/offline-db.ts`
- **Tables:** farms, kolam, pakan, sampling, kondisiAir, pengeluaran, penjualan, stokPakan, pendingSync
- **Pattern:** Cache-first untuk instant UI, network-update di background

### 3. Online/Offline Detection
- **File:** `lib/use-online.ts`
- **Hook:** `useOnline()` → returns `{ isOnline, wasOffline }`
- **Auto-sync:** Trigger background sync saat kembali online

### 4. AppContext Integration
- **File:** `app/context/AppContext.tsx`
- **Changes:** Load dari cache → Fetch network → Update cache
- **Offline:** Fallback ke cached data dengan toast warning

### 5. UI Indicators
- **File:** `app/components/layout/DashboardLayout.tsx`
- **Offline Banner:** Fixed top, orange, with WifiOff icon
- **Reconnected Toast:** Green, top-right, auto-dismiss 3s

---

## Testing Checklist

```bash
# 1. Build production
npm run build

# 2. Start production server
npm start

# 3. Test in browser
# - Open http://localhost:3000
# - Navigate to dashboard, kolam, pakan
# - Chrome DevTools → Application → Service Workers (check registered)
# - Network tab → Throttling → Offline
# - Refresh page → Should work!
# - Navigate between pages → Should work!
# - Network → Online → Should show "Kembali online" toast
```

---

## File Changes Summary

### New Files Created
- ✅ `lib/offline-db.ts` - IndexedDB wrapper dengan Dexie
- ✅ `lib/use-online.ts` - Online/offline detection hook
- ✅ `app/offline/page.tsx` - Offline fallback page
- ✅ `PWA_OFFLINE_GUIDE.md` - Dokumentasi lengkap
- ✅ `PWA_OFFLINE_QUICK_REF.md` - Quick reference ini

### Files Modified
- ✅ `next.config.ts` - Added next-pwa configuration
- ✅ `app/context/AppContext.tsx` - Added offline caching
- ✅ `app/components/layout/DashboardLayout.tsx` - Added connection status UI
- ✅ `app/globals.css` - Added animation for toast
- ✅ `.gitignore` - Added PWA generated files

### Dependencies Installed
- ✅ `@ducanh2912/next-pwa` - PWA support for Next.js 15+
- ✅ `dexie` - IndexedDB wrapper

---

## Key Code Snippets

### Using Offline Cache in Components
```typescript
import { cacheManager } from '@/lib/offline-db';

// Cache data after fetch
const data = await fetch('/api/farms/123/kolam').then(r => r.json());
await cacheManager.cacheKolam('123', data);

// Load from cache
const cachedData = await cacheManager.getKolam('123');
```

### Using Online Status
```typescript
import { useOnline } from '@/lib/use-online';

function MyComponent() {
  const { isOnline, wasOffline } = useOnline();
  
  return (
    <div>
      {!isOnline && <div>Offline Mode</div>}
      {isOnline && wasOffline && <div>Back Online!</div>}
    </div>
  );
}
```

### Queue Failed Writes
```typescript
import { syncManager } from '@/lib/offline-db';

// When POST fails offline
try {
  await fetch('/api/farms/123/kolam', {
    method: 'POST',
    body: JSON.stringify(data)
  });
} catch (error) {
  // Queue for later
  await syncManager.addPendingSync(
    '/api/farms/123/kolam',
    'POST',
    data,
    { 'Content-Type': 'application/json' }
  );
}
```

---

## Debugging Commands

### Check Service Worker Registration
```javascript
// Browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registered:', regs);
});
```

### Check IndexedDB Contents
```javascript
// Browser console (with Dexie imported)
import { db } from './lib/offline-db';

// Check all kolam
db.kolam.toArray().then(console.log);

// Check pending sync queue
db.pendingSync.toArray().then(console.log);
```

### Clear All Cache
```javascript
// Clear service worker caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Clear IndexedDB
await cacheManager.clearAllCache();
```

### Force Service Worker Update
```javascript
// Browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.update());
});
```

---

## Production Deployment

### Vercel / Netlify
```bash
# Build automatically generates service worker
npm run build

# Output includes:
# - public/sw.js
# - public/workbox-*.js
# - All pages pre-cached
```

### Custom Server
```bash
# Ensure HTTPS (service workers require it)
# Or use localhost for development
npm run build
npm start
```

### Environment Variables
```env
# No special env vars needed for PWA
# next-pwa works out of the box
```

---

## Monitoring & Analytics

### Check Storage Usage
```javascript
navigator.storage.estimate().then(estimate => {
  const used = (estimate.usage / estimate.quota * 100).toFixed(2);
  console.log(`Storage: ${used}% used`);
});
```

### Monitor Cache Hit Rate
```javascript
// In service worker
self.addEventListener('fetch', (event) => {
  // Log cache hits vs network fetches
  console.log('Fetch:', event.request.url);
});
```

---

## Common Issues & Fixes

### Issue: "Service Worker not registering"
**Fix:** Must be HTTPS or localhost. Check browser console for errors.

### Issue: "Data not cached"
**Fix:** Verify `cacheManager` functions called after successful fetch.

### Issue: "Offline page not showing"
**Fix:** Check `app/offline/page.tsx` exists and `fallbacks.document` set in config.

### Issue: "Can't sync when back online"
**Fix:** Check `useOnline` hook triggering `syncManager.syncPendingOperations()`.

---

## Next Steps

1. ✅ Test offline functionality thoroughly
2. ✅ Monitor cache size (IndexedDB limits)
3. ✅ Implement conflict resolution (if needed)
4. ✅ Add analytics for offline usage
5. ✅ Consider Background Sync API for better reliability

---

**Dokumentasi lengkap:** `PWA_OFFLINE_GUIDE.md`
