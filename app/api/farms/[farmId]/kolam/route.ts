import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { verifyFarmAccess } from '@/lib/farm-auth'

export const dynamic = 'force-dynamic'

// GET /api/farms/[farmId]/kolam - Get all kolam in a farm
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

        const kolam = await prisma.kolam.findMany({
            where: { farmId },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(kolam)
    } catch (error) {
        console.error('Get kolam error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/farms/[farmId]/kolam - Create a new kolam
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

        const body = await request.json()
        const { nama, panjang, lebar, kedalaman, tanggalTebar, jumlahIkan } = body

        if (!nama || !panjang || !lebar || !kedalaman) {
            return NextResponse.json({ error: 'Nama dan dimensi kolam wajib diisi' }, { status: 400 })
        }

        // Calculate status based on density
        const volume = panjang * lebar * kedalaman

        let jumlahIkanInt = 0
        if (jumlahIkan) jumlahIkanInt = parseInt(jumlahIkan)

        const kepadatan = volume > 0 ? jumlahIkanInt / volume : 0
        let status: 'AMAN' | 'WASPADA' | 'BERISIKO' = 'AMAN'
        if (kepadatan > 100) status = 'BERISIKO'
        else if (kepadatan > 50) status = 'WASPADA'

        const kolam = await prisma.kolam.create({
            data: {
                farmId,
                nama,
                panjang: parseFloat(panjang),
                lebar: parseFloat(lebar),
                kedalaman: parseFloat(kedalaman),
                tanggalTebar: tanggalTebar ? new Date(tanggalTebar) : null,
                jumlahIkan: jumlahIkanInt,
                status
            }
        })

        return NextResponse.json(kolam, { status: 201 })
    } catch (error) {
        console.error('Create kolam error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
