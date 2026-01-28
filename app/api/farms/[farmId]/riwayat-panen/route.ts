import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function checkFarmAccess(farmId: string, userId: string) {
    const member = await prisma.farmMember.findUnique({
        where: { userId_farmId: { userId, farmId } }
    })
    return member
}

// GET /api/farms/[farmId]/riwayat-panen - Get all harvest records
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

        const riwayatPanen = await prisma.riwayatPanen.findMany({
            where: { kolamId: { in: kolamIds.map(k => k.id) } },
            include: { kolam: { select: { id: true, nama: true } } },
            orderBy: { tanggal: 'desc' }
        })

        return NextResponse.json(riwayatPanen)
    } catch (error) {
        console.error('Get riwayat panen error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/farms/[farmId]/riwayat-panen - Add harvest record
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

        const { kolamId, tanggal, beratTotalKg, jumlahEkor, hargaPerKg, tipe, catatan } = await request.json()

        if (!kolamId || !tanggal || !beratTotalKg || !hargaPerKg || !tipe) {
            return NextResponse.json({ error: 'Field wajib: kolamId, tanggal, beratTotalKg, hargaPerKg, tipe' }, { status: 400 })
        }

        const kolam = await prisma.kolam.findUnique({ where: { id: kolamId, farmId } })
        if (!kolam) {
            return NextResponse.json({ error: 'Kolam not found' }, { status: 404 })
        }

        const jumlahEkorValue = jumlahEkor ? parseInt(jumlahEkor) : 0;
        const harvestType = tipe.toUpperCase();

        // Prepare updates
        const transactionOps: any[] = [
            prisma.riwayatPanen.create({
                data: {
                    kolamId,
                    tanggal: new Date(tanggal),
                    beratTotalKg: parseFloat(beratTotalKg),
                    jumlahEkor: jumlahEkorValue,
                    hargaPerKg: parseFloat(hargaPerKg),
                    tipe: harvestType,
                    catatan
                },
                include: { kolam: { select: { id: true, nama: true } } }
            })
        ];

        // Update kolam fish count based on harvest type
        if (harvestType === 'TOTAL') {
            // Panen Raya: Reset count to 0 and clear stocking date to mark as empty/inactive
            // Or just reset count to 0 and let user "start new cycle" manually?
            // "Siap Ditebar" implies empty, so count 0 is enough.
            // keeping tanggalTebar might be useful for history, but for "Active" logic usually it checks count > 0.
            transactionOps.push(
                prisma.kolam.update({
                    where: { id: kolamId },
                    data: {
                        jumlahIkan: 0,
                        status: 'AMAN' // Reset status
                    }
                })
            );
        } else {
            // Parsial: Reduce count if provided
            if (jumlahEkorValue > 0) {
                transactionOps.push(
                    prisma.kolam.update({
                        where: { id: kolamId },
                        data: {
                            jumlahIkan: { decrement: jumlahEkorValue }
                        }
                    })
                );
            }
        }

        const results = await prisma.$transaction(transactionOps);
        const riwayatPanen = results[0];

        return NextResponse.json(riwayatPanen, { status: 201 })
    } catch (error) {
        console.error('Create riwayat panen error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
