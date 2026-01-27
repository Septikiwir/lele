import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function checkFarmAccess(farmId: string, userId: string) {
    const member = await prisma.farmMember.findUnique({
        where: { userId_farmId: { userId, farmId } }
    })
    return member
}

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
        const member = await checkFarmAccess(farmId, session.user.id)
        if (!member) {
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
        const member = await checkFarmAccess(farmId, session.user.id)
        if (!member || member.role === 'VIEWER') {
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
