import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Get the first user
    const user = await prisma.user.findFirst()
    if (!user) {
        console.error('❌ No user found! Please register first.')
        return
    }
    console.log(`👤 Found user: ${user.email}`)

    // Get farm for this user
    const farm = await prisma.farm.findFirst({
        where: { ownerId: user.id }
    })

    if (!farm) {
        console.error('❌ No farm found!')
        return
    }
    console.log(`🏠 Found farm: ${farm.nama}`)

    // Get or create Kolam
    let kolam = await prisma.kolam.findFirst({
        where: { farmId: farm.id }
    })

    if (!kolam) {
        kolam = await prisma.kolam.create({
            data: {
                farmId: farm.id,
                nama: 'Kolam A1',
                panjang: 10,
                lebar: 5,
                kedalaman: 1.2,
                tanggalTebar: new Date('2025-01-01'),
                jumlahIkan: 5000,
                status: 'AMAN',
                positionX: 5,
                positionY: 3,
                positionW: 3,
                positionH: 2,
                color: '#f59e0b'
            }
        })
        console.log(`🐟 Created kolam: ${kolam.nama}`)
    } else {
        console.log(`🐟 Found kolam: ${kolam.nama}`)
    }

    // Check and create StokPakan
    const existingStok = await prisma.stokPakan.findFirst({ where: { farmId: farm.id } })
    if (!existingStok) {
        await prisma.stokPakan.create({
            data: {
                farmId: farm.id,
                jenisPakan: 'Pelet Hi-Pro',
                stokAwal: 100,
                hargaPerKg: 12000,
                tanggalTambah: new Date('2025-01-01'),
                keterangan: 'Stok awal bulan Januari'
            }
        })
        console.log(`📦 Created stok pakan`)
    } else {
        console.log(`📦 Stok pakan exists`)
    }

    // Check and create DataPakan
    const existingPakan = await prisma.dataPakan.findFirst({ where: { kolamId: kolam.id } })
    if (!existingPakan) {
        await prisma.dataPakan.create({
            data: {
                kolamId: kolam.id,
                tanggal: new Date('2025-01-27'),
                jumlahKg: 15,
                jenisPakan: 'Pelet Hi-Pro'
            }
        })
        console.log(`🍖 Created data pakan`)
    } else {
        console.log(`🍖 Data pakan exists`)
    }

    // Check and create KondisiAir
    const existingAir = await prisma.kondisiAir.findFirst({ where: { kolamId: kolam.id } })
    if (!existingAir) {
        await prisma.kondisiAir.create({
            data: {
                kolamId: kolam.id,
                tanggal: new Date('2025-01-27'),
                warna: 'Hijau cerah',
                bau: 'Normal',
                ketinggian: 1.1,
                ph: 7.2,
                suhu: 28
            }
        })
        console.log(`💧 Created kondisi air`)
    } else {
        console.log(`💧 Kondisi air exists`)
    }

    // Check and create Pengeluaran
    const existingPengeluaran = await prisma.pengeluaran.findFirst({ where: { kolamId: kolam.id } })
    if (!existingPengeluaran) {
        await prisma.pengeluaran.create({
            data: {
                kolamId: kolam.id,
                farmId: farm.id,
                tanggal: new Date('2025-01-01'),
                kategori: 'BIBIT',
                keterangan: 'Bibit lele 5000 ekor @Rp100',
                jumlah: 500000
            }
        })
        console.log(`💰 Created pengeluaran`)
    } else {
        console.log(`💰 Pengeluaran exists`)
    }

    // Check and create Pembeli
    let pembeli = await prisma.pembeli.findFirst({ where: { farmId: farm.id } })
    if (!pembeli) {
        pembeli = await prisma.pembeli.create({
            data: {
                farmId: farm.id,
                nama: 'Pak Joko',
                tipe: 'TENGKULAK',
                kontak: '081234567890',
                alamat: 'Pasar Induk'
            }
        })
        console.log(`👨 Created pembeli`)
    } else {
        console.log(`👨 Pembeli exists`)
    }

    // Check and create Penjualan
    const existingPenjualan = await prisma.penjualan.findFirst({ where: { kolamId: kolam.id } })
    if (!existingPenjualan) {
        await prisma.penjualan.create({
            data: {
                kolamId: kolam.id,
                pembeliId: pembeli.id,
                tanggal: new Date('2025-01-25'),
                beratKg: 100,
                hargaPerKg: 25000,
                jumlahIkan: 500,
                keterangan: 'Penjualan ke tengkulak'
            }
        })
        console.log(`📈 Created penjualan`)
    } else {
        console.log(`📈 Penjualan exists`)
    }

    // Check and create JadwalPakan
    const existingJadwal = await prisma.jadwalPakan.findFirst({ where: { kolamId: kolam.id } })
    if (!existingJadwal) {
        await prisma.jadwalPakan.create({
            data: {
                kolamId: kolam.id,
                waktu: '07:00',
                jenisPakan: 'Pelet Hi-Pro',
                jumlahKg: 5,
                keterangan: 'Pakan pagi',
                aktif: true
            }
        })
        console.log(`⏰ Created jadwal pakan`)
    } else {
        console.log(`⏰ Jadwal pakan exists`)
    }

    // Check and create RiwayatPanen
    const existingPanen = await prisma.riwayatPanen.findFirst({ where: { kolamId: kolam.id } })
    if (!existingPanen) {
        await prisma.riwayatPanen.create({
            data: {
                kolamId: kolam.id,
                tanggal: new Date('2025-01-20'),
                beratTotalKg: 50,
                jumlahEkor: 500,
                hargaPerKg: 25000,
                tipe: 'PARSIAL',
                catatan: 'Panen sortir ukuran konsumsi'
            }
        })
        console.log(`🎣 Created riwayat panen`)
    } else {
        console.log(`🎣 Riwayat panen exists`)
    }

    console.log('')
    console.log('✅ Seeding completed!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
