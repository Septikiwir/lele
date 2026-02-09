import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'

// GET /api/farms/[farmId]/kolam/[kolamId]/sortir
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string; kolamId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { farmId, kolamId } = await params;

        // Check access
        const member = await prisma.farmMember.findUnique({
            where: { userId_farmId: { userId: session.user.id, farmId } }
        });

        if (!member) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const sortir = await prisma.riwayatSortir.findMany({
            where: { kolamId },
            orderBy: { tanggal: 'desc' }
        });

        return NextResponse.json(sortir);
    } catch (error) {
        console.error('Get sortir error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/farms/[farmId]/kolam/[kolamId]/sortir
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string; kolamId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { farmId, kolamId } = await params;

        // Check access
        const member = await prisma.farmMember.findUnique({
            where: { userId_farmId: { userId: session.user.id, farmId } }
        });

        if (!member || member.role === 'VIEWER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { 
            tanggal, 
            periode, 
            jumlahIkanSebelum, 
            jumlahIkanSesudah, 
            mortalitas, 
            bobotRataRata, 
            catatan 
        } = body;

        // Validation
        if (!tanggal || !periode || jumlahIkanSebelum === undefined || jumlahIkanSesudah === undefined) {
            return NextResponse.json({ 
                error: 'Tanggal, periode, jumlah ikan sebelum, dan jumlah ikan sesudah wajib diisi' 
            }, { status: 400 });
        }

        if (![1, 2, 3, 4].includes(parseInt(periode))) {
            return NextResponse.json({ 
                error: 'Periode harus bernilai 1, 2, 3, atau 4' 
            }, { status: 400 });
        }

        if (parseInt(jumlahIkanSesudah) > parseInt(jumlahIkanSebelum)) {
            return NextResponse.json({ 
                error: 'Jumlah ikan sesudah tidak boleh lebih banyak dari jumlah sebelum' 
            }, { status: 400 });
        }

        // Check if periode already exists for this kolam
        const existing = await prisma.riwayatSortir.findFirst({
            where: { 
                kolamId, 
                periode: parseInt(periode) 
            }
        });

        if (existing) {
            return NextResponse.json({ 
                error: `Sortir periode ${periode} sudah pernah dilakukan untuk kolam ini` 
            }, { status: 400 });
        }

        const calculatedMortalitas = parseInt(jumlahIkanSebelum) - parseInt(jumlahIkanSesudah);

        const newSortir = await prisma.riwayatSortir.create({
            data: {
                kolamId,
                tanggal: new Date(tanggal),
                periode: parseInt(periode),
                jumlahIkanSebelum: parseInt(jumlahIkanSebelum),
                jumlahIkanSesudah: parseInt(jumlahIkanSesudah),
                mortalitas: calculatedMortalitas,
                bobotRataRata: bobotRataRata ? parseFloat(bobotRataRata) : null,
                catatan
            }
        });

        // Update kolam jumlahIkan to reflect post-sorting count
        await prisma.kolam.update({
            where: { id: kolamId },
            data: { jumlahIkan: parseInt(jumlahIkanSesudah) }
        });

        return NextResponse.json(newSortir, { status: 201 });
    } catch (error) {
        console.error('Create sortir error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
