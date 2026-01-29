import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { verifyFarmAccess } from '@/lib/farm-auth'

export const dynamic = 'force-dynamic'

// GET /api/farms/[farmId]/kolam/[kolamId] - Get single kolam
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string; kolamId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { farmId, kolamId } = await params
        const access = await verifyFarmAccess(farmId, session.user.id)
        if (!access) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const kolam = await prisma.kolam.findUnique({
            where: { id: kolamId, farmId }
        })

        if (!kolam) {
            return NextResponse.json({ error: 'Kolam not found' }, { status: 404 })
        }

        return NextResponse.json(kolam)
    } catch (error) {
        console.error('Get kolam error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/farms/[farmId]/kolam/[kolamId] - Update kolam
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string; kolamId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { farmId, kolamId } = await params
        const access = await verifyFarmAccess(farmId, session.user.id)
        if (!access || access.role === 'VIEWER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { nama, panjang, lebar, kedalaman, tanggalTebar, jumlahIkan, positionX, positionY, positionW, positionH, color, status: bodyStatus } = body

        // Calculate status based on density
        let status: 'AMAN' | 'WASPADA' | 'BERISIKO' | undefined
        if (panjang && lebar && kedalaman && jumlahIkan) {
            const volume = panjang * lebar * kedalaman
            const kepadatan = volume > 0 ? jumlahIkan / volume : 0
            status = 'AMAN'
            if (kepadatan > 100) status = 'BERISIKO'
            else if (kepadatan > 50) status = 'WASPADA'
        }

        // Allow manual status override
        if (bodyStatus) {
            status = bodyStatus as 'AMAN' | 'WASPADA' | 'BERISIKO'
        }

        const kolam = await prisma.kolam.update({
            where: { id: kolamId, farmId },
            data: {
                ...(nama && { nama }),
                ...(panjang && { panjang: parseFloat(panjang) }),
                ...(lebar && { lebar: parseFloat(lebar) }),
                ...(kedalaman && { kedalaman: parseFloat(kedalaman) }),
                ...(tanggalTebar && { tanggalTebar: new Date(tanggalTebar) }),
                ...(jumlahIkan !== undefined && { jumlahIkan: parseInt(jumlahIkan) }),
                ...(status && { status }),
                ...(positionX !== undefined && { positionX }),
                ...(positionY !== undefined && { positionY }),
                ...(positionW !== undefined && { positionW }),
                ...(positionH !== undefined && { positionH }),
                ...(color !== undefined && { color })
            }
        })

        return NextResponse.json(kolam)
    } catch (error) {
        console.error('Update kolam error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/farms/[farmId]/kolam/[kolamId] - Delete kolam
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string; kolamId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { farmId, kolamId } = await params
        const access = await verifyFarmAccess(farmId, session.user.id)
        if (!access || !['OWNER', 'ADMIN'].includes(access.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await prisma.kolam.delete({
            where: { id: kolamId, farmId }
        })

        return NextResponse.json({ message: 'Kolam deleted' })
    } catch (error) {
        console.error('Delete kolam error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
