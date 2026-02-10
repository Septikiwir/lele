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
            catatan,
            distributions // Optional: array of { kolamId, jumlah } for multi-pond transfer
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
        const sesudah = parseInt(jumlahIkanSesudah);

        // Validate distributions if provided
        if (distributions && Array.isArray(distributions)) {
            if (distributions.length === 0) {
                return NextResponse.json({ 
                    error: 'Distributions array cannot be empty' 
                }, { status: 400 });
            }

            // Validate total does not exceed survivors
            const totalDistributed = distributions.reduce((sum: number, d: any) => sum + parseInt(d.jumlah), 0);
            if (totalDistributed > sesudah) {
                return NextResponse.json({ 
                    error: `Total distribusi (${totalDistributed}) tidak boleh melebihi survivors (${sesudah})` 
                }, { status: 400 });
            }

            // Validate each target kolam exists
            for (const dist of distributions) {
                if (!dist.kolamId || dist.kolamId === kolamId) {
                    return NextResponse.json({ 
                        error: 'Invalid target pond in distributions' 
                    }, { status: 400 });
                }

                const targetKolam = await prisma.kolam.findUnique({
                    where: { id: dist.kolamId }
                });

                if (!targetKolam) {
                    return NextResponse.json({ 
                        error: `Kolam tujuan ${dist.kolamId} tidak ditemukan` 
                    }, { status: 400 });
                }
            }
        }

        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create sortir record
            const newSortir = await tx.riwayatSortir.create({
                data: {
                    kolamId,
                    tanggal: new Date(tanggal),
                    periode: parseInt(periode),
                    jumlahIkanSebelum: parseInt(jumlahIkanSebelum),
                    jumlahIkanSesudah: sesudah,
                    mortalitas: calculatedMortalitas,
                    bobotRataRata: bobotRataRata ? parseFloat(bobotRataRata) : null,
                    catatan
                }
            });

            // 2. Create RiwayatIkan for mortality if > 0
            if (calculatedMortalitas > 0) {
                await tx.riwayatIkan.create({
                    data: {
                        kolamId,
                        tanggal: new Date(tanggal),
                        jumlahPerubahan: -calculatedMortalitas,
                        jumlahAkhir: sesudah,
                        keterangan: `Sortir Periode ${periode} - Mortalitas`
                    }
                });
            }

            // 3. Handle distributions if provided
            let finalCountSource = sesudah;
            
            if (distributions && Array.isArray(distributions) && distributions.length > 0) {
                const sourceKolam = await tx.kolam.findUnique({
                    where: { id: kolamId }
                });

                // Calculate total distributed
                const totalDistributed = distributions.reduce((sum, d) => sum + parseInt(d.jumlah), 0);
                // Remaining fish stay in source pond
                finalCountSource = sesudah - totalDistributed;

                // Track running count for source pond
                let runningSourceCount = sesudah;

                // Process each distribution
                for (const dist of distributions) {
                    const targetKolam = await tx.kolam.findUnique({
                        where: { id: dist.kolamId }
                    });

                    const jumlahDist = parseInt(dist.jumlah);
                    const targetCurrentCount = targetKolam?.jumlahIkan || 0;
                    const targetNewCount = targetCurrentCount + jumlahDist;

                    // Reduce running count
                    runningSourceCount -= jumlahDist;

                    // Create RiwayatIkan for source (transfer out)
                    await tx.riwayatIkan.create({
                        data: {
                            kolamId,
                            tanggal: new Date(tanggal),
                            jumlahPerubahan: -jumlahDist,
                            jumlahAkhir: runningSourceCount,
                            keterangan: `Distribusi ke ${targetKolam?.nama || 'Kolam Lain'} (setelah sortir)`
                        }
                    });

                    // Create RiwayatIkan for target (transfer in)
                    await tx.riwayatIkan.create({
                        data: {
                            kolamId: dist.kolamId,
                            tanggal: new Date(tanggal),
                            jumlahPerubahan: jumlahDist,
                            jumlahAkhir: targetNewCount,
                            keterangan: `Terima dari ${sourceKolam?.nama || 'Kolam Lain'} (setelah sortir)`
                        }
                    });

                    // Update target kolam
                    await tx.kolam.update({
                        where: { id: dist.kolamId },
                        data: { jumlahIkan: targetNewCount }
                    });
                }
            }

            // Update source kolam
            await tx.kolam.update({
                where: { id: kolamId },
                data: { jumlahIkan: finalCountSource }
            });

            return newSortir;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Create sortir error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
