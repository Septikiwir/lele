import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { verifyFarmAccess } from '@/lib/farm-auth'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { farmId } = await params
        const access = await verifyFarmAccess(farmId, session.user.id)
        if (!access) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Get all kolam in this farm first to filter child records
        const kolamIds = (await prisma.kolam.findMany({
            where: { farmId },
            select: { id: true }
        })).map(k => k.id)

        // Parse 'days' limit (default 180 days ~ 6 months)
        const daysParam = request.nextUrl.searchParams.get('days')
        const days = daysParam ? parseInt(daysParam) : 180
        const dateLimit = new Date()
        dateLimit.setDate(dateLimit.getDate() - days)

        // Fetch all data in parallel
        const [
            pakan,
            stokPakan,
            kondisiAir,
            pengeluaran,
            pembeli,
            penjualan,
            jadwalPakan,
            riwayatPanen,
            riwayatIkan,
            riwayatSampling
        ] = await Promise.all([
            prisma.dataPakan.findMany({
                where: {
                    kolamId: { in: kolamIds },
                    tanggal: { gte: dateLimit }
                },
                orderBy: { tanggal: 'desc' }
            }),
            prisma.stokPakan.findMany({
                where: { farmId },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.kondisiAir.findMany({
                where: {
                    kolamId: { in: kolamIds },
                    tanggal: { gte: dateLimit }
                },
                orderBy: { tanggal: 'desc' }
            }),
            prisma.pengeluaran.findMany({
                where: { farmId },
                orderBy: { tanggal: 'desc' }
            }),
            prisma.pembeli.findMany({
                where: { farmId },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.penjualan.findMany({
                where: { kolamId: { in: kolamIds } },
                orderBy: { tanggal: 'desc' },
                include: { pembeli: { select: { nama: true } } }
            }),
            prisma.jadwalPakan.findMany({
                where: { kolamId: { in: kolamIds } },
                orderBy: { waktu: 'asc' }
            }),
            prisma.riwayatPanen.findMany({
                where: { kolamId: { in: kolamIds } },
                orderBy: { tanggal: 'desc' }
            }),
            prisma.riwayatIkan.findMany({
                where: { kolamId: { in: kolamIds } },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.riwayatSampling.findMany({
                where: {
                    kolamId: { in: kolamIds },
                    tanggal: { gte: dateLimit }
                },
                orderBy: { tanggal: 'desc' }
            })
        ])

        // Aggregate historical feed usage (DataPakan before dateLimit) to ensure stock calculations remain accurate
        // while we only return detailed records for the recent window.
        const historicalFeedUsage = await prisma.dataPakan.groupBy({
            by: ['jenisPakan'],
            where: {
                kolamId: { in: kolamIds },
                tanggal: { lt: dateLimit }
            },
            _sum: {
                jumlahKg: true
            }
        })

        return NextResponse.json({
            pakan,
            stokPakan,
            kondisiAir,
            pengeluaran,
            pembeli,
            penjualan,
            jadwalPakan,
            riwayatPanen,
            riwayatIkan,
            riwayatSampling,
            historicalFeedUsage: historicalFeedUsage.map(h => ({
                jenisPakan: h.jenisPakan,
                jumlahKg: h._sum.jumlahKg || 0
            }))
        })
    } catch (error) {
        console.error('Bulk fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
