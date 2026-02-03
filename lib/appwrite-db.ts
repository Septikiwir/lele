/**
 * Database Helper Functions for Appwrite
 * Uses REST API instead of SDK to avoid Next.js 16 + Turbopack instanceof issues
 * NOTE: This file is deprecated - using Prisma instead
 */

// import { appwriteConfig } from './appwrite.config'

// const dbId = appwriteConfig.databaseId
// const collections = appwriteConfig.collections

/* Deprecated code - using Prisma ORM instead
export const Query = {
  equal: (key: string, value: any) => `${key}:${JSON.stringify(value)}`,
  greaterThan: (key: string, value: number) => `${key}:>${value}`,
  lessThan: (key: string, value: number) => `${key}:<${value}`,
  orderBy: (key: string, order: 'ASC' | 'DESC') => `orderBy(${key},${order})`,
  limit: (limit: number) => `limit(${limit})`,
  offset: (offset: number) => `offset(${offset})`,
}

type QueryOption = string

async function request(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: any,
  query?: string,
): Promise<any> {
  // ... rest of file content would go here ...
}

// Generate unique ID (like SDK's ID.unique())
function generateUniqueId(): string {
  return `${Date.now()}${Math.random().toString(36).substr(2, 9)}`
}

// REST API helper for database operations
async function makeDbRequest(
  method: string,
  path: string,
  body?: Record<string, any>
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY!,
    'X-Appwrite-Project': appwriteConfig.projectId,
  }

  const response = await fetch(
    `${appwriteConfig.endpoint}${path}`,
    {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Database request failed: ${method} ${path}`)
  }

  return response.json()
}

// REST API wrappers for database operations
async function createDocument(collectionId: string, data: any, documentId?: string) {
  const id = documentId || generateUniqueId()
  return await makeDbRequest(
    'POST',
    `/databases/${dbId}/collections/${collectionId}/documents`,
    { documentId: id, data }
  )
}

async function getDocument(collectionId: string, documentId: string) {
  return await makeDbRequest(
    'GET',
    `/databases/${dbId}/collections/${collectionId}/documents/${documentId}`
  )
}

async function listDocuments(collectionId: string, queries: string[] = []) {
  // Appwrite REST API expects queries as URL parameters: queries[]=...&queries[]=...
  const queryParams = queries.map(q => `queries[]=${encodeURIComponent(q)}`).join('&')
  const queryString = queryParams ? `?${queryParams}` : ''
  return await makeDbRequest(
    'GET',
    `/databases/${dbId}/collections/${collectionId}/documents${queryString}`
  )
}

async function updateDocument(collectionId: string, documentId: string, data: any) {
  return await makeDbRequest(
    'PATCH',
    `/databases/${dbId}/collections/${collectionId}/documents/${documentId}`,
    { data }
  )
}

async function deleteDocument(collectionId: string, documentId: string) {
  return await makeDbRequest(
    'DELETE',
    `/databases/${dbId}/collections/${collectionId}/documents/${documentId}`
  )
}

// Query helper functions (mimics SDK Query class)
const Query = {
  equal: (attribute: string, value: any) => {
    // Format value without double-encoding strings
    const formattedValue = typeof value === 'string' ? `"${value}"` : JSON.stringify(value)
    // No space after comma - Appwrite REST API requirement
    return `equal("${attribute}",${formattedValue})`
  },
  orderDesc: (attribute: string) => `orderDesc("${attribute}")`,
  orderAsc: (attribute: string) => `orderAsc("${attribute}")`,
}

// ============================================
// USER OPERATIONS
// ============================================

export async function getUserByEmail(email: string) {
  try {
    const response = await listDocuments(collections.users, [Query.equal('email', email)])
    return response.documents[0] || null
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}

export async function createUser(data: {
  userId: string
  name?: string
  email: string
  image?: string
  role?: 'superadmin' | 'owner' | 'manager' | 'operator'
}) {
  try {
    return await createDocument(
      collections.users,
      {
        name: data.name || '',
        email: data.email,
        image: data.image || '',
        role: data.role || 'owner', // Default role is owner
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      data.userId
    )
  } catch (error) {
    console.error('Create user error:', error)
    throw error
  }
}

// ============================================
// FARM OPERATIONS
// ============================================

export async function getFarmsByUserId(userId: string) {
  try {
    return await listDocuments(collections.farms, [Query.equal('ownerId', userId)])
  } catch (error) {
    console.error('Get farms error:', error)
    throw error
  }
}

export async function createFarm(data: {
  nama: string
  alamat?: string
  ownerId: string
}) {
  return await createDocument(collections.farms, {
    nama: data.nama,
    alamat: data.alamat || '',
    ownerId: data.ownerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

export async function getFarmById(farmId: string) {
  return await getDocument(collections.farms, farmId)
}

export async function updateFarm(farmId: string, data: {
  nama?: string
  alamat?: string
}) {
  return await updateDocument(collections.farms, farmId, {
    ...data,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteFarm(farmId: string) {
  return await deleteDocument(collections.farms, farmId)
}

// ============================================
// KOLAM OPERATIONS
// ============================================

export async function getKolamByFarmId(farmId: string) {
  return await listDocuments(collections.kolam, [
    Query.equal('farmId', farmId),
  ])
}

export async function createKolam(data: {
  farmId: string
  nama: string
  panjang: number
  lebar: number
  kedalaman: number
  tanggalTebar?: string
  jumlahIkan?: number
  status?: string
  positionX?: number
  positionY?: number
  positionW?: number
  positionH?: number
  color?: string
}) {
  return await createDocument(collections.kolam, {
    farmId: data.farmId,
    nama: data.nama,
    panjang: data.panjang,
    lebar: data.lebar,
    kedalaman: data.kedalaman,
    tanggalTebar: data.tanggalTebar || null,
    jumlahIkan: data.jumlahIkan || 0,
    status: data.status || 'AMAN',
    positionX: data.positionX || 0,
    positionY: data.positionY || 0,
    positionW: data.positionW || 1,
    positionH: data.positionH || 1,
    color: data.color || '#3b82f6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

export async function getKolamById(kolamId: string) {
  return await getDocument(collections.kolam, kolamId)
}

export async function updateKolam(kolamId: string, data: any) {
  return await updateDocument(collections.kolam, kolamId, {
    ...data,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteKolam(kolamId: string) {
  return await deleteDocument(collections.kolam, kolamId)
}

// ============================================
// PAKAN OPERATIONS
// ============================================

export async function getStokPakanByFarmId(farmId: string) {
  return await listDocuments(collections.stokPakan, [
    Query.equal('farmId', farmId),
    Query.orderDesc('tanggalTambah'),
  ])
}

export async function createStokPakan(data: {
  farmId: string
  jenisPakan: string
  stokAwal: number
  hargaPerKg: number
  tanggalTambah: string
  keterangan?: string
}) {
  return await createDocument(
    collections.stokPakan,
    {
      ...data,
      createdAt: new Date().toISOString(),
    }
  )
}

export async function getDataPakanByKolamId(kolamId: string) {
  return await listDocuments(collections.dataPakan, [
    Query.equal('kolamId', kolamId),
    Query.orderDesc('tanggal'),
  ])
}

export async function createDataPakan(data: {
  kolamId: string
  tanggal: string
  jumlahKg: number
  jenisPakan: string
}) {
  return await createDocument(
    collections.dataPakan,
    {
      ...data,
      createdAt: new Date().toISOString(),
    }
  )
}

export async function getJadwalPakanByKolamId(kolamId: string) {
  return await listDocuments(collections.jadwalPakan, [
    Query.equal('kolamId', kolamId),
  ])
}

export async function createJadwalPakan(data: {
  kolamId: string
  waktu: string
  jenisPakan: string
  jumlahKg: number
  keterangan?: string
  aktif?: boolean
}) {
  return await createDocument(
    collections.jadwalPakan,
    {
      ...data,
      aktif: data.aktif !== undefined ? data.aktif : true,
    }
  )
}

// ============================================
// KONDISI AIR OPERATIONS
// ============================================

export async function getKondisiAirByKolamId(kolamId: string) {
  return await listDocuments(collections.kondisiAir, [
    Query.equal('kolamId', kolamId),
    Query.orderDesc('tanggal'),
  ])
}

export async function createKondisiAir(data: {
  kolamId: string
  tanggal: string
  warna: string
  bau: string
  ketinggian: number
  ph?: number
  suhu?: number
}) {
  return await createDocument(
    collections.kondisiAir,
    {
      ...data,
      createdAt: new Date().toISOString(),
    }
  )
}

// ============================================
// PENGELUARAN OPERATIONS
// ============================================

export async function getPengeluaranByFarmId(farmId: string) {
  return await listDocuments(collections.pengeluaran, [
    Query.equal('farmId', farmId),
    Query.orderDesc('tanggal'),
  ])
}

export async function createPengeluaran(data: {
  farmId: string
  kolamId?: string
  tanggal: string
  kategori: string
  keterangan: string
  jumlah: number
}) {
  return await createDocument(
    collections.pengeluaran,
    {
      ...data,
      kolamId: data.kolamId || null,
      createdAt: new Date().toISOString(),
    }
  )
}

// ============================================
// PEMBELI OPERATIONS
// ============================================

export async function getPembeliByFarmId(farmId: string) {
  return await listDocuments(collections.pembeli, [
    Query.equal('farmId', farmId),
  ])
}

export async function createPembeli(data: {
  farmId: string
  nama: string
  tipe: string
  kontak?: string
  alamat?: string
}) {
  return await createDocument(
    collections.pembeli,
    {
      ...data,
      createdAt: new Date().toISOString(),
    }
  )
}

// ============================================
// PENJUALAN OPERATIONS
// ============================================

export async function getPenjualanByKolamId(kolamId: string) {
  return await listDocuments(collections.penjualan, [
    Query.equal('kolamId', kolamId),
    Query.orderDesc('tanggal'),
  ])
}

export async function createPenjualan(data: {
  kolamId: string
  pembeliId: string
  tanggal: string
  beratKg: number
  hargaPerKg: number
  jumlahIkan?: number
  keterangan?: string
}) {
  return await createDocument(
    collections.penjualan,
    {
      ...data,
      createdAt: new Date().toISOString(),
    }
  )
}

// ============================================
// RIWAYAT PANEN OPERATIONS
// ============================================

export async function getRiwayatPanenByKolamId(kolamId: string) {
  return await listDocuments(collections.riwayatPanen, [
    Query.equal('kolamId', kolamId),
    Query.orderDesc('tanggal'),
  ])
}

export async function createRiwayatPanen(data: {
  kolamId: string
  tanggal: string
  beratTotalKg: number
  jumlahEkor: number
  hargaPerKg: number
  tipe: string
  catatan?: string
}) {
  return await createDocument(
    collections.riwayatPanen,
    {
      ...data,
      createdAt: new Date().toISOString(),
    }
  )
}

// ============================================
// RIWAYAT IKAN OPERATIONS
// ============================================

export async function getRiwayatIkanByKolamId(kolamId: string) {
  return await listDocuments(collections.riwayatIkan, [
    Query.equal('kolamId', kolamId),
    Query.orderDesc('tanggal'),
  ])
}

export async function createRiwayatIkan(data: {
  kolamId: string
  tanggal: string
  jumlahPerubahan: number
  jumlahAkhir: number
  keterangan: string
}) {
  return await createDocument(
    collections.riwayatIkan,
    {
      ...data,
      createdAt: new Date().toISOString(),
    }
  )
}

// ============================================
// SAMPLING OPERATIONS
// ============================================

export async function getRiwayatSamplingByKolamId(kolamId: string) {
  return await listDocuments(collections.riwayatSampling, [
    Query.equal('kolamId', kolamId),
    Query.orderDesc('tanggal'),
  ])
}

export async function createRiwayatSampling(data: {
  kolamId: string
  tanggal: string
  jumlahIkanPerKg: number
  bobotGram?: number
  catatan?: string
}) {
  return await createDocument(
    collections.riwayatSampling,
    {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  )
}*/

// Placeholder to avoid import errors
export const appwriteDb = {}