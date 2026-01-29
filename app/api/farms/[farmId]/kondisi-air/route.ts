import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function checkFarmAccess(farmId: string, userId: string) {
    const member = await prisma.farmMember.findUnique({
        where: { userId_farmId: { userId, farmId } }
    })
    return member
}

// GET /api/farms/[farmId]/kondisi-air - Get all water conditions
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

        const kondisiAir = await prisma.kondisiAir.findMany({
            where: { kolamId: { in: kolamIds.map(k => k.id) } },
            include: { kolam: { select: { id: true, nama: true } } },
            orderBy: { tanggal: 'desc' }
        })

        return NextResponse.json(kondisiAir)
    } catch (error) {
        console.error('Get kondisi air error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/farms/[farmId]/kondisi-air - Add water condition
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

        const { kolamId, tanggal, warna, bau, ketinggian, ph, suhu } = await request.json()

        if (!kolamId || !tanggal || !warna || !bau || !ketinggian) {
            return NextResponse.json({ error: 'Field wajib: kolamId, tanggal, warna, bau, ketinggian' }, { status: 400 })
        }

        const kolam = await prisma.kolam.findUnique({ where: { id: kolamId, farmId } })
        if (!kolam) {
            return NextResponse.json({ error: 'Kolam not found' }, { status: 404 })
        }

        const kondisiAir = await prisma.kondisiAir.create({
            data: {
                kolamId,
                tanggal: new Date(tanggal),
                warna,
                bau,
                ketinggian: parseFloat(ketinggian),
                ph: ph ? parseFloat(ph) : null,
                suhu: suhu ? parseFloat(suhu) : null
            },
            include: { kolam: { select: { id: true, nama: true } } }
        })

        return NextResponse.json(kondisiAir, { status: 201 })
    } catch (error) {
        console.error('Create kondisi air error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
