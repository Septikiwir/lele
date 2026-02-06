import Dexie, { Table } from "dexie";

// Define types for our offline data
export interface CachedFarm {
  id: string;
  nama: string;
  lokasi: string;
  luas: number;
  jumlahKolam: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  timestamp: number; // Cache timestamp
}

export interface CachedKolam {
  id: string;
  nama: string;
  panjang: number;
  lebar: number;
  kedalaman: number;
  kapasitas: number;
  jumlahIkan: number;
  tanggalTebar: string;
  statusAktif: boolean;
  farmId: string;
  timestamp: number;
}

export interface CachedPakan {
  id: string;
  tanggal: string;
  waktu: string;
  jenisPakan: string;
  jumlah: number;
  kolamId: string;
  farmId: string;
  timestamp: number;
}

export interface CachedSampling {
  id: string;
  tanggal: string;
  beratRataRata: number;
  panjangRataRata: number;
  jumlahSample: number;
  biomassa: number;
  estimasiPakan: number;
  kolamId: string;
  farmId: string;
  timestamp: number;
}

export interface CachedKondisiAir {
  id: string;
  tanggal: string;
  waktu: string;
  suhu: number;
  ph: number;
  oksigen: number;
  amonia: number;
  kecerahan: number;
  kolamId: string;
  farmId: string;
  timestamp: number;
}

export interface CachedPengeluaran {
  id: string;
  tanggal: string;
  kategori: string;
  deskripsi: string;
  jumlah: number;
  farmId: string;
  timestamp: number;
}

export interface CachedPenjualan {
  id: string;
  tanggal: string;
  pembeli: string;
  beratTotal: number;
  hargaPerKg: number;
  totalHarga: number;
  farmId: string;
  timestamp: number;
}

export interface CachedStokPakan {
  id: string;
  jenisPakan: string;
  jumlahKg: number;
  hargaPerKg: number;
  tanggalBeli: string;
  farmId: string;
  timestamp: number;
}

export interface PendingSync {
  id?: number;
  url: string;
  method: "POST" | "PUT" | "DELETE" | "PATCH";
  body: string;
  headers: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

// Define the database
export class OfflineDatabase extends Dexie {
  farms!: Table<CachedFarm>;
  kolam!: Table<CachedKolam>;
  pakan!: Table<CachedPakan>;
  sampling!: Table<CachedSampling>;
  kondisiAir!: Table<CachedKondisiAir>;
  pengeluaran!: Table<CachedPengeluaran>;
  penjualan!: Table<CachedPenjualan>;
  stokPakan!: Table<CachedStokPakan>;
  pendingSync!: Table<PendingSync>;

  constructor() {
    super("LeleFarmOfflineDB");
    this.version(1).stores({
      farms: "id, userId, timestamp",
      kolam: "id, farmId, timestamp",
      pakan: "id, farmId, kolamId, timestamp",
      sampling: "id, farmId, kolamId, timestamp",
      kondisiAir: "id, farmId, kolamId, timestamp",
      pengeluaran: "id, farmId, timestamp",
      penjualan: "id, farmId, timestamp",
      stokPakan: "id, farmId, timestamp",
      pendingSync: "++id, timestamp",
    });
  }
}

// Create a singleton instance
export const db = new OfflineDatabase();

// Cache management utilities
export const cacheManager = {
  // Cache farm data
  async cacheFarms(farms: any[]) {
    const timestamp = Date.now();
    const cachedFarms = farms.map((farm) => ({
      ...farm,
      timestamp,
    }));
    await db.farms.bulkPut(cachedFarms);
  },

  async getFarms(userId: string): Promise<CachedFarm[]> {
    return await db.farms.where("userId").equals(userId).toArray();
  },

  // Cache kolam data
  async cacheKolam(farmId: string, kolam: any[]) {
    const timestamp = Date.now();
    // Delete old kolam for this farm
    await db.kolam.where("farmId").equals(farmId).delete();
    // Add new data
    const cachedKolam = kolam.map((k) => ({
      ...k,
      farmId,
      timestamp,
    }));
    await db.kolam.bulkPut(cachedKolam);
  },

  async getKolam(farmId: string): Promise<CachedKolam[]> {
    return await db.kolam.where("farmId").equals(farmId).toArray();
  },

  async getKolamById(kolamId: string): Promise<CachedKolam | undefined> {
    return await db.kolam.get(kolamId);
  },

  // Cache pakan data
  async cachePakan(farmId: string, pakan: any[]) {
    const timestamp = Date.now();
    const cachedPakan = pakan.map((p) => ({
      ...p,
      farmId,
      timestamp,
    }));
    await db.pakan.bulkPut(cachedPakan);
  },

  async getPakan(farmId: string): Promise<CachedPakan[]> {
    return await db.pakan.where("farmId").equals(farmId).toArray();
  },

  // Cache sampling data
  async cacheSampling(farmId: string, sampling: any[]) {
    const timestamp = Date.now();
    const cachedSampling = sampling.map((s) => ({
      ...s,
      farmId,
      timestamp,
    }));
    await db.sampling.bulkPut(cachedSampling);
  },

  async getSampling(farmId: string): Promise<CachedSampling[]> {
    return await db.sampling.where("farmId").equals(farmId).toArray();
  },

  // Cache kondisi air data
  async cacheKondisiAir(farmId: string, kondisiAir: any[]) {
    const timestamp = Date.now();
    const cachedKondisiAir = kondisiAir.map((k) => ({
      ...k,
      farmId,
      timestamp,
    }));
    await db.kondisiAir.bulkPut(cachedKondisiAir);
  },

  async getKondisiAir(farmId: string): Promise<CachedKondisiAir[]> {
    return await db.kondisiAir.where("farmId").equals(farmId).toArray();
  },

  // Cache pengeluaran data
  async cachePengeluaran(farmId: string, pengeluaran: any[]) {
    const timestamp = Date.now();
    const cachedPengeluaran = pengeluaran.map((p) => ({
      ...p,
      farmId,
      timestamp,
    }));
    await db.pengeluaran.bulkPut(cachedPengeluaran);
  },

  async getPengeluaran(farmId: string): Promise<CachedPengeluaran[]> {
    return await db.pengeluaran.where("farmId").equals(farmId).toArray();
  },

  // Cache penjualan data
  async cachePenjualan(farmId: string, penjualan: any[]) {
    const timestamp = Date.now();
    const cachedPenjualan = penjualan.map((p) => ({
      ...p,
      farmId,
      timestamp,
    }));
    await db.penjualan.bulkPut(cachedPenjualan);
  },

  async getPenjualan(farmId: string): Promise<CachedPenjualan[]> {
    return await db.penjualan.where("farmId").equals(farmId).toArray();
  },

  // Cache stok pakan data
  async cacheStokPakan(farmId: string, stokPakan: any[]) {
    const timestamp = Date.now();
    const cachedStokPakan = stokPakan.map((s) => ({
      ...s,
      farmId,
      timestamp,
    }));
    await db.stokPakan.bulkPut(cachedStokPakan);
  },

  async getStokPakan(farmId: string): Promise<CachedStokPakan[]> {
    return await db.stokPakan.where("farmId").equals(farmId).toArray();
  },

  // Check if data is stale (older than 24 hours by default)
  isDataStale(timestamp: number, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
    return Date.now() - timestamp > maxAgeMs;
  },

  // Clear all cached data
  async clearAllCache() {
    await Promise.all([
      db.farms.clear(),
      db.kolam.clear(),
      db.pakan.clear(),
      db.sampling.clear(),
      db.kondisiAir.clear(),
      db.pengeluaran.clear(),
      db.penjualan.clear(),
      db.stokPakan.clear(),
    ]);
  },

  // Clear cache for specific farm
  async clearFarmCache(farmId: string) {
    await Promise.all([
      db.farms.where("id").equals(farmId).delete(),
      db.kolam.where("farmId").equals(farmId).delete(),
      db.pakan.where("farmId").equals(farmId).delete(),
      db.sampling.where("farmId").equals(farmId).delete(),
      db.kondisiAir.where("farmId").equals(farmId).delete(),
      db.pengeluaran.where("farmId").equals(farmId).delete(),
      db.penjualan.where("farmId").equals(farmId).delete(),
      db.stokPakan.where("farmId").equals(farmId).delete(),
    ]);
  },
};

// Background sync utilities
export const syncManager = {
  // Add a pending write operation to sync queue
  async addPendingSync(
    url: string,
    method: "POST" | "PUT" | "DELETE" | "PATCH",
    body: any,
    headers: Record<string, string> = {}
  ) {
    await db.pendingSync.add({
      url,
      method,
      body: JSON.stringify(body),
      headers,
      timestamp: Date.now(),
      retryCount: 0,
    });
  },

  // Get all pending sync operations
  async getPendingSync(): Promise<PendingSync[]> {
    return await db.pendingSync.orderBy("timestamp").toArray();
  },

  // Sync pending operations when online
  async syncPendingOperations() {
    if (!navigator.onLine) return;

    const pending = await this.getPendingSync();

    for (const operation of pending) {
      try {
        const response = await fetch(operation.url, {
          method: operation.method,
          headers: {
            "Content-Type": "application/json",
            ...operation.headers,
          },
          body: operation.body,
        });

        if (response.ok) {
          // Remove from pending queue on success
          await db.pendingSync.delete(operation.id!);
        } else if (response.status >= 400 && response.status < 500) {
          // Client error - remove from queue (no point retrying)
          await db.pendingSync.delete(operation.id!);
        } else {
          // Server error - increment retry count
          await db.pendingSync.update(operation.id!, {
            retryCount: operation.retryCount + 1,
          });
        }
      } catch (error) {
        // Network error - increment retry count
        await db.pendingSync.update(operation.id!, {
          retryCount: operation.retryCount + 1,
        });
      }
    }
  },

  // Clear sync queue
  async clearSyncQueue() {
    await db.pendingSync.clear();
  },

  // Get pending sync count
  async getPendingSyncCount(): Promise<number> {
    return await db.pendingSync.count();
  },
};
