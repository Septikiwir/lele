import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { verifyFarmAccess } from '@/lib/farm-auth'

// GET /api/farms/[farmId]/stok-pakan - Get all feed stock
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

        const stok = await prisma.stokPakan.findMany({
            where: { farmId },
            orderBy: { tanggalTambah: 'desc' }
        })

        return NextResponse.json(stok)
    } catch (error) {
        console.error('Get stok pakan error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/farms/[farmId]/stok-pakan - Add feed stock
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

        const { jenisPakan, stokAwal, hargaPerKg, tanggalTambah, keterangan } = await request.json()

        if (!jenisPakan || !stokAwal || !hargaPerKg || !tanggalTambah) {
            return NextResponse.json({ error: 'Field wajib: jenisPakan, stokAwal, hargaPerKg, tanggalTambah' }, { status: 400 })
        }

        const stok = await prisma.stokPakan.create({
            data: {
                farmId,
                jenisPakan,
                stokAwal: parseFloat(stokAwal),
                hargaPerKg: parseFloat(hargaPerKg),
                tanggalTambah: new Date(tanggalTambah),
                keterangan
            }
        })

        return NextResponse.json(stok, { status: 201 })
    } catch (error) {
        console.error('Create stok pakan error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
