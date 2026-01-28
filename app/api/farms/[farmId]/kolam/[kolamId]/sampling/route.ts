import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/farms/[farmId]/kolam/[kolamId]/sampling
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

        const sampling = await prisma.riwayatSampling.findMany({
            where: { kolamId },
            orderBy: { tanggal: 'desc' }
        });

        return NextResponse.json(sampling);
    } catch (error) {
        console.error('Get sampling error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/farms/[farmId]/kolam/[kolamId]/sampling
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
        const { tanggal, jumlahIkanPerKg, catatan } = body;

        if (!tanggal || !jumlahIkanPerKg) {
            return NextResponse.json({ error: 'Tanggal dan Jumlah Ikan per Kg wajib diisi' }, { status: 400 });
        }

        const newSampling = await prisma.riwayatSampling.create({
            data: {
                kolamId,
                tanggal: new Date(tanggal),
                jumlahIkanPerKg: parseFloat(jumlahIkanPerKg),
                catatan
            }
        });

        return NextResponse.json(newSampling, { status: 201 });
    } catch (error) {
        console.error('Create sampling error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
