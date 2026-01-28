import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: Fetch all history for a farm (optional, or just fetch by kolam on client side filtering)
// But usually we fetch all data for the farm in AppContext.
export async function GET(
    request: Request,
    { params }: { params: Promise<{ farmId: string }> }
) {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const resolvedParams = await params;

    try {
        const history = await prisma.riwayatIkan.findMany({
            where: {
                kolam: {
                    farmId: resolvedParams.farmId
                }
            },
            orderBy: {
                tanggal: 'desc'
            }
        });
        return NextResponse.json(history);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST: Create a new history record AND update the Kolam fish count
export async function POST(
    request: Request,
    { params }: { params: Promise<{ farmId: string }> }
) {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const resolvedParams = await params;

    try {
        const body = await request.json();
        const { kolamId, jumlahPerubahan, keterangan, tanggal } = body;

        // Check if model exists (Prisma Client sync check)
        // @ts-ignore
        if (!prisma.riwayatIkan) {
            console.error("Prisma Client out of sync: riwayatIkan model not found");
            return new NextResponse("Server Error: Database schema update required via 'npx prisma generate'", { status: 500 });
        }

        // Transaction to ensure consistency
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get current count
            const kolam = await tx.kolam.findUnique({
                where: { id: kolamId }
            });

            if (!kolam) throw new Error("Kolam not found");

            const newTotal = kolam.jumlahIkan + jumlahPerubahan;

            if (newTotal < 0) throw new Error("Jumlah ikan cannot be negative");

            // 2. Update Kolam
            await tx.kolam.update({
                where: { id: kolamId },
                data: { jumlahIkan: newTotal }
            });

            // 3. Create History
            const history = await tx.riwayatIkan.create({
                data: {
                    kolamId,
                    jumlahPerubahan,
                    jumlahAkhir: newTotal,
                    keterangan,
                    tanggal: new Date(tanggal),
                }
            });

            return history;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Failed to create riwayat ikan:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
