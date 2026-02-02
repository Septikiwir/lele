import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { verifyFarmAccess } from '@/lib/farm-auth'

export const dynamic = 'force-dynamic'

// GET /api/farms/[farmId]/pakan - Get all feeding records
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

        // Get all kolam in this farm first
        const kolamIds = await prisma.kolam.findMany({
            where: { farmId },
            select: { id: true }
        })

        const pakan = await prisma.dataPakan.findMany({
            where: { kolamId: { in: kolamIds.map(k => k.id) } },
            include: { kolam: { select: { id: true, nama: true } } },
            orderBy: { tanggal: 'desc' }
        })

        return NextResponse.json(pakan)
    } catch (error) {
        console.error('Get pakan error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/farms/[farmId]/pakan - Add feeding record
export async function POST(
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
        if (!access || access.role === 'VIEWER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { kolamId, tanggal, jumlahKg, jenisPakan } = await request.json()

        if (!kolamId || !tanggal || !jumlahKg || !jenisPakan) {
            return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
        }

        // Verify kolam belongs to this farm
        const kolam = await prisma.kolam.findUnique({
            where: { id: kolamId, farmId }
        })
        if (!kolam) {
            return NextResponse.json({ error: 'Kolam not found' }, { status: 404 })
        }

        // Validate stock availability
        const stokTersedia = await prisma.stokPakan.findMany({
            where: { farmId, jenisPakan }
        })
        const totalStokAwal = stokTersedia.reduce((sum, s) => sum + s.stokAwal, 0)
        const pakanTerpakai = await prisma.dataPakan.findMany({
            where: {
                jenisPakan,
                kolam: { farmId }
            }
        })
        const totalTerpakai = pakanTerpakai.reduce((sum, p) => sum + p.jumlahKg, 0)
        const stokSisa = totalStokAwal - totalTerpakai

        if (stokSisa < parseFloat(jumlahKg)) {
            return NextResponse.json({ 
                error: `Stok tidak cukup! Stok tersedia: ${stokSisa.toFixed(1)} kg, dibutuhkan: ${parseFloat(jumlahKg).toFixed(1)} kg` 
            }, { status: 400 })
        }

        const pakan = await prisma.dataPakan.create({
            data: {
                kolamId,
                tanggal: new Date(tanggal),
                jumlahKg: parseFloat(jumlahKg),
                jenisPakan
            },
            include: { kolam: { select: { id: true, nama: true } } }
        })

        return NextResponse.json(pakan, { status: 201 })
    } catch (error) {
        console.error('Create pakan error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
