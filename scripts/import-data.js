const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function importData() {
    console.log('🚀 Starting data import to Supabase PostgreSQL...\n')

    try {
        // Find the most recent backup file
        const backupDir = path.join(process.cwd(), 'backups')
        const files = fs.readdirSync(backupDir).filter(f => f.startsWith('railway-backup-'))
        
        if (files.length === 0) {
            throw new Error('No backup files found!')
        }

        const latestBackup = files.sort().reverse()[0]
        const backupPath = path.join(backupDir, latestBackup)
        
        console.log(`📁 Reading backup: ${latestBackup}\n`)
        
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'))
        const { users, verificationTokens } = backupData

        console.log('📊 Starting import...\n')

        // Import users and related data
        for (const user of users) {
            console.log(`Importing user: ${user.email}`)
            
            // Create user
            const newUser = await prisma.user.create({
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
                    password: user.password,
                    image: user.image,
                    createdAt: new Date(user.createdAt),
                    updatedAt: new Date(user.updatedAt),
                }
            })

            // Import accounts
            if (user.accounts && user.accounts.length > 0) {
                for (const account of user.accounts) {
                    await prisma.account.create({
                        data: {
                            id: account.id,
                            userId: newUser.id,
                            type: account.type,
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                            refresh_token: account.refresh_token,
                            access_token: account.access_token,
                            expires_at: account.expires_at,
                            token_type: account.token_type,
                            scope: account.scope,
                            id_token: account.id_token,
                            session_state: account.session_state,
                        }
                    })
                }
                console.log(`  ✓ Imported ${user.accounts.length} accounts`)
            }

            // Import sessions
            if (user.sessions && user.sessions.length > 0) {
                for (const session of user.sessions) {
                    await prisma.session.create({
                        data: {
                            id: session.id,
                            sessionToken: session.sessionToken,
                            userId: newUser.id,
                            expires: new Date(session.expires),
                        }
                    })
                }
                console.log(`  ✓ Imported ${user.sessions.length} sessions`)
            }

            // Import farms
            if (user.ownedFarms && user.ownedFarms.length > 0) {
                for (const farm of user.ownedFarms) {
                    const newFarm = await prisma.farm.create({
                        data: {
                            id: farm.id,
                            nama: farm.nama,
                            alamat: farm.alamat,
                            ownerId: newUser.id,
                            createdAt: new Date(farm.createdAt),
                            updatedAt: new Date(farm.updatedAt),
                        }
                    })

                    // Import farm members
                    if (farm.members && farm.members.length > 0) {
                        for (const member of farm.members) {
                            await prisma.farmMember.create({
                                data: {
                                    id: member.id,
                                    role: member.role,
                                    userId: member.userId,
                                    farmId: newFarm.id,
                                    joinedAt: new Date(member.joinedAt),
                                }
                            })
                        }
                        console.log(`  ✓ Imported ${farm.members.length} farm members`)
                    }

                    // Import stok pakan
                    if (farm.stokPakan && farm.stokPakan.length > 0) {
                        for (const stok of farm.stokPakan) {
                            await prisma.stokPakan.create({
                                data: {
                                    id: stok.id,
                                    jenisPakan: stok.jenisPakan,
                                    stokAwal: stok.stokAwal,
                                    hargaPerKg: stok.hargaPerKg,
                                    tanggalTambah: new Date(stok.tanggalTambah),
                                    keterangan: stok.keterangan,
                                    farmId: newFarm.id,
                                    createdAt: new Date(stok.createdAt),
                                }
                            })
                        }
                        console.log(`  ✓ Imported ${farm.stokPakan.length} stok pakan`)
                    }

                    // Import pembeli
                    if (farm.pembeli && farm.pembeli.length > 0) {
                        for (const pembeli of farm.pembeli) {
                            await prisma.pembeli.create({
                                data: {
                                    id: pembeli.id,
                                    nama: pembeli.nama,
                                    tipe: pembeli.tipe,
                                    kontak: pembeli.kontak,
                                    alamat: pembeli.alamat,
                                    farmId: newFarm.id,
                                    createdAt: new Date(pembeli.createdAt),
                                }
                            })
                        }
                        console.log(`  ✓ Imported ${farm.pembeli.length} pembeli`)
                    }

                    // Import kolam and related data
                    if (farm.kolam && farm.kolam.length > 0) {
                        for (const kolam of farm.kolam) {
                            const newKolam = await prisma.kolam.create({
                                data: {
                                    id: kolam.id,
                                    nama: kolam.nama,
                                    panjang: kolam.panjang,
                                    lebar: kolam.lebar,
                                    kedalaman: kolam.kedalaman,
                                    tanggalTebar: kolam.tanggalTebar ? new Date(kolam.tanggalTebar) : null,
                                    jumlahIkan: kolam.jumlahIkan,
                                    status: kolam.status,
                                    positionX: kolam.positionX,
                                    positionY: kolam.positionY,
                                    positionW: kolam.positionW,
                                    positionH: kolam.positionH,
                                    color: kolam.color,
                                    farmId: newFarm.id,
                                    createdAt: new Date(kolam.createdAt),
                                    updatedAt: new Date(kolam.updatedAt),
                                }
                            })

                            // Import data pakan
                            if (kolam.dataPakan && kolam.dataPakan.length > 0) {
                                for (const pakan of kolam.dataPakan) {
                                    await prisma.dataPakan.create({
                                        data: {
                                            id: pakan.id,
                                            tanggal: new Date(pakan.tanggal),
                                            jumlahKg: pakan.jumlahKg,
                                            jenisPakan: pakan.jenisPakan,
                                            kolamId: newKolam.id,
                                            createdAt: new Date(pakan.createdAt),
                                        }
                                    })
                                }
                            }

                            // Import kondisi air
                            if (kolam.kondisiAir && kolam.kondisiAir.length > 0) {
                                for (const kondisi of kolam.kondisiAir) {
                                    await prisma.kondisiAir.create({
                                        data: {
                                            id: kondisi.id,
                                            tanggal: new Date(kondisi.tanggal),
                                            warna: kondisi.warna,
                                            bau: kondisi.bau,
                                            ketinggian: kondisi.ketinggian,
                                            ph: kondisi.ph,
                                            suhu: kondisi.suhu,
                                            kolamId: newKolam.id,
                                            createdAt: new Date(kondisi.createdAt),
                                        }
                                    })
                                }
                            }

                            // Import jadwal pakan
                            if (kolam.jadwalPakan && kolam.jadwalPakan.length > 0) {
                                for (const jadwal of kolam.jadwalPakan) {
                                    await prisma.jadwalPakan.create({
                                        data: {
                                            id: jadwal.id,
                                            waktu: jadwal.waktu,
                                            jenisPakan: jadwal.jenisPakan,
                                            jumlahKg: jadwal.jumlahKg,
                                            keterangan: jadwal.keterangan,
                                            aktif: jadwal.aktif,
                                            kolamId: newKolam.id,
                                        }
                                    })
                                }
                            }

                            // Import riwayat panen
                            if (kolam.riwayatPanen && kolam.riwayatPanen.length > 0) {
                                for (const panen of kolam.riwayatPanen) {
                                    await prisma.riwayatPanen.create({
                                        data: {
                                            id: panen.id,
                                            tanggal: new Date(panen.tanggal),
                                            beratTotalKg: panen.beratTotalKg,
                                            jumlahEkor: panen.jumlahEkor,
                                            hargaPerKg: panen.hargaPerKg,
                                            tipe: panen.tipe,
                                            catatan: panen.catatan,
                                            kolamId: newKolam.id,
                                            createdAt: new Date(panen.createdAt),
                                        }
                                    })
                                }
                            }

                            // Import riwayat ikan
                            if (kolam.riwayatIkan && kolam.riwayatIkan.length > 0) {
                                for (const riwayat of kolam.riwayatIkan) {
                                    await prisma.riwayatIkan.create({
                                        data: {
                                            id: riwayat.id,
                                            tanggal: new Date(riwayat.tanggal),
                                            jumlahPerubahan: riwayat.jumlahPerubahan,
                                            jumlahAkhir: riwayat.jumlahAkhir,
                                            keterangan: riwayat.keterangan,
                                            kolamId: newKolam.id,
                                            createdAt: new Date(riwayat.createdAt),
                                        }
                                    })
                                }
                            }

                            // Import riwayat sampling
                            if (kolam.riwayatSampling && kolam.riwayatSampling.length > 0) {
                                for (const sampling of kolam.riwayatSampling) {
                                    await prisma.riwayatSampling.create({
                                        data: {
                                            id: sampling.id,
                                            tanggal: new Date(sampling.tanggal),
                                            jumlahIkanPerKg: sampling.jumlahIkanPerKg,
                                            bobotGram: sampling.bobotGram,
                                            catatan: sampling.catatan,
                                            kolamId: newKolam.id,
                                            createdAt: new Date(sampling.createdAt),
                                            updatedAt: new Date(sampling.updatedAt),
                                        }
                                    })
                                }
                            }

                            // Import penjualan
                            if (kolam.penjualan && kolam.penjualan.length > 0) {
                                for (const jual of kolam.penjualan) {
                                    await prisma.penjualan.create({
                                        data: {
                                            id: jual.id,
                                            tanggal: new Date(jual.tanggal),
                                            beratKg: jual.beratKg,
                                            hargaPerKg: jual.hargaPerKg,
                                            jumlahIkan: jual.jumlahIkan,
                                            keterangan: jual.keterangan,
                                            kolamId: newKolam.id,
                                            pembeliId: jual.pembeliId,
                                            createdAt: new Date(jual.createdAt),
                                        }
                                    })
                                }
                            }

                            // Import pengeluaran kolam
                            if (kolam.pengeluaran && kolam.pengeluaran.length > 0) {
                                for (const pengeluaran of kolam.pengeluaran) {
                                    await prisma.pengeluaran.create({
                                        data: {
                                            id: pengeluaran.id,
                                            tanggal: new Date(pengeluaran.tanggal),
                                            kategori: pengeluaran.kategori,
                                            keterangan: pengeluaran.keterangan,
                                            jumlah: pengeluaran.jumlah,
                                            kolamId: newKolam.id,
                                            farmId: newFarm.id,
                                            createdAt: new Date(pengeluaran.createdAt),
                                        }
                                    })
                                }
                            }

                            console.log(`  ✓ Imported kolam: ${kolam.nama}`)
                        }
                    }

                    // Import farm-level pengeluaran
                    if (farm.pengeluaran && farm.pengeluaran.length > 0) {
                        for (const pengeluaran of farm.pengeluaran) {
                            // Skip if already imported with kolam
                            const exists = await prisma.pengeluaran.findUnique({
                                where: { id: pengeluaran.id }
                            })
                            if (!exists) {
                                await prisma.pengeluaran.create({
                                    data: {
                                        id: pengeluaran.id,
                                        tanggal: new Date(pengeluaran.tanggal),
                                        kategori: pengeluaran.kategori,
                                        keterangan: pengeluaran.keterangan,
                                        jumlah: pengeluaran.jumlah,
                                        kolamId: pengeluaran.kolamId,
                                        farmId: newFarm.id,
                                        createdAt: new Date(pengeluaran.createdAt),
                                    }
                                })
                            }
                        }
                    }

                    console.log(`✓ Imported farm: ${farm.nama}`)
                }
            }

            console.log(`✅ User ${user.email} imported successfully\n`)
        }

        // Import verification tokens
        if (verificationTokens && verificationTokens.length > 0) {
            for (const token of verificationTokens) {
                await prisma.verificationToken.create({
                    data: {
                        identifier: token.identifier,
                        token: token.token,
                        expires: new Date(token.expires),
                    }
                })
            }
            console.log(`✓ Imported ${verificationTokens.length} verification tokens\n`)
        }

        console.log('\n✅ Data import completed successfully!')
        console.log(`\nSummary:`)
        console.log(`  - Users: ${users.length}`)
        console.log(`  - Farms: ${users.reduce((acc, u) => acc + (u.ownedFarms?.length || 0), 0)}`)
        console.log(`  - Verification Tokens: ${verificationTokens?.length || 0}`)

    } catch (error) {
        console.error('\n❌ Error importing data:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

importData()
