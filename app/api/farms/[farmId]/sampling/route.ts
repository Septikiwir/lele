import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/farms/[farmId]/sampling
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { farmId } = await params;

        // Check access
        const member = await prisma.farmMember.findUnique({
            where: { userId_farmId: { userId: session.user.id, farmId } }
        });

        if (!member) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const sampling = await prisma.riwayatSampling.findMany({
            where: { kolam: { farmId } },
            orderBy: { tanggal: 'desc' }
        });

        return NextResponse.json(sampling);
    } catch (error) {
        console.error('Get all sampling error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
