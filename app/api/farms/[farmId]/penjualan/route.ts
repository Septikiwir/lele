import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function checkFarmAccess(farmId: string, userId: string) {
    const member = await prisma.farmMember.findUnique({
        where: { userId_farmId: { userId, farmId } }
    })
    return member
}

// GET /api/farms/[farmId]/penjualan - Get all sales
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
        const member = await checkFarmAccess(farmId, session.user.id)
        if (!member) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const kolamIds = await prisma.kolam.findMany({
            where: { farmId },
            select: { id: true }
        })

        const penjualan = await prisma.penjualan.findMany({
            where: { kolamId: { in: kolamIds.map(k => k.id) } },
            include: {
                kolam: { select: { id: true, nama: true } },
                pembeli: { select: { id: true, nama: true, tipe: true } }
            },
            orderBy: { tanggal: 'desc' }
        })

        return NextResponse.json(penjualan)
    } catch (error) {
        console.error('Get penjualan error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/farms/[farmId]/penjualan - Add sale
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
        const member = await checkFarmAccess(farmId, session.user.id)
        if (!member || member.role === 'VIEWER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { kolamId, pembeliId, tanggal, beratKg, hargaPerKg, jumlahIkan, keterangan } = await request.json()

        if (!kolamId || !pembeliId || !tanggal || !beratKg || !hargaPerKg) {
            return NextResponse.json({ error: 'Field wajib: kolamId, pembeliId, tanggal, beratKg, hargaPerKg' }, { status: 400 })
        }

        // Verify kolam and pembeli belong to this farm
        const [kolam, pembeli] = await Promise.all([
            prisma.kolam.findUnique({ where: { id: kolamId, farmId } }),
            prisma.pembeli.findUnique({ where: { id: pembeliId, farmId } })
        ])
        if (!kolam || !pembeli) {
            return NextResponse.json({ error: 'Kolam or Pembeli not found' }, { status: 404 })
        }

        const penjualan = await prisma.penjualan.create({
            data: {
                kolamId,
                pembeliId,
                tanggal: new Date(tanggal),
                beratKg: parseFloat(beratKg),
                hargaPerKg: parseFloat(hargaPerKg),
                jumlahIkan: jumlahIkan ? parseInt(jumlahIkan) : null,
                keterangan
            },
            include: {
                kolam: { select: { id: true, nama: true } },
                pembeli: { select: { id: true, nama: true, tipe: true } }
            }
        })

        return NextResponse.json(penjualan, { status: 201 })
    } catch (error) {
        console.error('Create penjualan error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
