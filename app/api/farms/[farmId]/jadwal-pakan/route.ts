import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function checkFarmAccess(farmId: string, userId: string) {
    const member = await prisma.farmMember.findUnique({
        where: { userId_farmId: { userId, farmId } }
    })
    return member
}

// GET /api/farms/[farmId]/jadwal-pakan - Get all feeding schedules
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

        const jadwalPakan = await prisma.jadwalPakan.findMany({
            where: { kolamId: { in: kolamIds.map(k => k.id) } },
            include: { kolam: { select: { id: true, nama: true } } },
            orderBy: { waktu: 'asc' }
        })

        return NextResponse.json(jadwalPakan)
    } catch (error) {
        console.error('Get jadwal pakan error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/farms/[farmId]/jadwal-pakan - Add feeding schedule
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

        const { kolamId, waktu, jenisPakan, jumlahKg, keterangan, aktif } = await request.json()

        if (!kolamId || !waktu || !jenisPakan || !jumlahKg) {
            return NextResponse.json({ error: 'Field wajib: kolamId, waktu, jenisPakan, jumlahKg' }, { status: 400 })
        }

        const kolam = await prisma.kolam.findUnique({ where: { id: kolamId, farmId } })
        if (!kolam) {
            return NextResponse.json({ error: 'Kolam not found' }, { status: 404 })
        }

        const jadwalPakan = await prisma.jadwalPakan.create({
            data: {
                kolamId,
                waktu,
                jenisPakan,
                jumlahKg: parseFloat(jumlahKg),
                keterangan,
                aktif: aktif ?? true
            },
            include: { kolam: { select: { id: true, nama: true } } }
        })

        return NextResponse.json(jadwalPakan, { status: 201 })
    } catch (error) {
        console.error('Create jadwal pakan error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
