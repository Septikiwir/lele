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

// GET /api/farms/[farmId]/pengeluaran - Get all expenses
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string }> }
) {
    try {
        /*
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { farmId } = await params
        const member = await checkFarmAccess(farmId, session.user.id)
        if (!member) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        */
        const { farmId } = await params

        const pengeluaran = await prisma.pengeluaran.findMany({
            where: { farmId },
            include: { kolam: { select: { id: true, nama: true } } },
            orderBy: { tanggal: 'desc' }
        })

        return NextResponse.json(pengeluaran)
    } catch (error) {
        console.error('Get pengeluaran error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/farms/[farmId]/pengeluaran - Add expense
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string }> }
) {
    try {
        /*
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { farmId } = await params
        const member = await checkFarmAccess(farmId, session.user.id)
        if (!member || member.role === 'VIEWER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        */
        const { farmId } = await params
        // const member = await checkFarmAccess(farmId, session.user.id)

        const { kolamId, tanggal, kategori, keterangan, jumlah } = await request.json()

        if (!tanggal || !kategori || !keterangan || !jumlah) {
            return NextResponse.json({ error: 'Field wajib diisi' }, { status: 400 })
        }

        const pengeluaran = await prisma.pengeluaran.create({
            data: {
                farmId,
                kolamId: kolamId || null,
                tanggal: new Date(tanggal),
                kategori: kategori.toUpperCase(),
                keterangan,
                jumlah: parseFloat(jumlah)
            },
            include: { kolam: { select: { id: true, nama: true } } }
        })

        return NextResponse.json(pengeluaran, { status: 201 })
    } catch (error) {
        console.error('Create pengeluaran error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
