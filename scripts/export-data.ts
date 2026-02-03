// Use import instead of require to avoid redeclaration issues
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prismaExport = new PrismaClient()

async function exportAllData() {
    console.log('🚀 Starting data export from Railway MySQL...\n')

    try {
        // Export all data
        const users = await prismaExport.user.findMany({
            include: {
                accounts: true,
                sessions: true,
                ownedFarms: {
                    include: {
                        members: true,
                        kolam: {
                            include: {
                                dataPakan: true,
                                kondisiAir: true,
                                pengeluaran: true,
                                jadwalPakan: true,
                                riwayatPanen: true,
                                penjualan: {
                                    include: {
                                        pembeli: true
                                    }
                                },
                                riwayatIkan: true,
                                riwayatSampling: true
                            }
                        },
                        stokPakan: true,
                        pembeli: true,
                        pengeluaran: true
                    }
                },
                farmMembers: true
            }
        })

        const verificationTokens = await prismaExport.verificationToken.findMany()

        const exportData = {
            users,
            verificationTokens,
            exportedAt: new Date().toISOString(),
            note: 'Full database export from Railway MySQL for migration to Supabase PostgreSQL'
        }

        // Create backup directory if not exists
        const backupDir = path.join(process.cwd(), 'backups')
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir)
        }

        // Save to file
        const filename = `railway-backup-${Date.now()}.json`
        const filepath = path.join(backupDir, filename)
        fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2))

        console.log('✅ Data exported successfully!')
        console.log(`📁 File: ${filepath}`)
        console.log(`\nSummary:`)
        console.log(`  - Users: ${users.length}`)
        console.log(`  - Farms: ${users.reduce((acc: number, u: any) => acc + u.ownedFarms.length, 0)}`)
        console.log(`  - Kolam: ${users.reduce((acc: number, u: any) => acc + u.ownedFarms.reduce((a: number, f: any) => a + f.kolam.length, 0), 0)}`)
        console.log(`  - Verification Tokens: ${verificationTokens.length}`)

    } catch (error) {
        console.error('❌ Error exporting data:', error)
        throw error
    } finally {
        await prismaExport.$disconnect()
    }
}

exportAllData()
