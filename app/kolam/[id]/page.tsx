import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import KolamDetailClient from './client';

export const dynamic = 'force-dynamic'; // Always fetch fresh data

interface Props {
    params: Promise<{ id: string }>;
}

export default async function KolamDetailPage({ params }: Props) {
    const { id } = await params;

    // Server-side data fetching from database
    const kolam = await prisma.kolam.findUnique({
        where: { id },
        include: {
            dataPakan: {
                orderBy: { tanggal: 'desc' }
            },
            kondisiAir: {
                orderBy: { tanggal: 'desc' }
            },
            riwayatIkan: {
                orderBy: { tanggal: 'desc' }
            },
            riwayatSampling: {
                orderBy: { tanggal: 'desc' }
            },
            penjualan: {
                orderBy: { tanggal: 'desc' }
            },
            riwayatPanen: {
                orderBy: { tanggal: 'desc' }
            },
            riwayatSortir: {
                orderBy: { tanggal: 'desc' }
            }
        }
    });

    // If kolam not found, show 404
    if (!kolam) {
        notFound();
    }

    // Format data for client component
    const initialData = {
        id: kolam.id,
        nama: kolam.nama,
        panjang: kolam.panjang,
        lebar: kolam.lebar,
        kedalaman: kolam.kedalaman,
        tanggalTebar: kolam.tanggalTebar?.toISOString() || null,
        jumlahIkan: kolam.jumlahIkan,
        status: (kolam.status || 'AMAN').toLowerCase() as 'aman' | 'waspada' | 'berisiko',
        pakan: kolam.dataPakan.map(p => ({
            id: p.id,
            kolamId: p.kolamId,
            tanggal: p.tanggal.toISOString(),
            jumlahKg: p.jumlahKg,
            jenisPakan: p.jenisPakan
        })),
        kondisiAir: kolam.kondisiAir.map(k => ({
            id: k.id,
            kolamId: k.kolamId,
            tanggal: k.tanggal.toISOString(),
            warna: k.warna,
            bau: k.bau,
            ketinggian: k.ketinggian,
            ph: k.ph,
            suhu: k.suhu
        })),
        riwayatIkan: kolam.riwayatIkan.map(r => ({
            id: r.id,
            kolamId: r.kolamId,
            tanggal: r.tanggal.toISOString(),
            jumlahPerubahan: r.jumlahPerubahan,
            jumlahAkhir: r.jumlahAkhir,
            keterangan: r.keterangan
        })),
        riwayatSampling: kolam.riwayatSampling.map(r => ({
            id: r.id,
            kolamId: r.kolamId,
            tanggal: r.tanggal.toISOString(),
            jumlahIkanPerKg: r.jumlahIkanPerKg,
            bobotGram: r.bobotGram || undefined,
            catatan: r.catatan || undefined
        })),
        penjualan: kolam.penjualan.map(p => ({
            id: p.id,
            kolamId: p.kolamId,
            pembeliId: p.pembeliId,
            tanggal: p.tanggal.toISOString(),
            beratKg: p.beratKg,
            hargaPerKg: p.hargaPerKg,
            jumlahIkan: p.jumlahIkan || undefined,
            keterangan: p.keterangan || undefined
        })),
        riwayatPanen: kolam.riwayatPanen.map(p => ({
            id: p.id,
            kolamId: p.kolamId,
            tanggal: p.tanggal.toISOString(),
            beratTotalKg: p.beratTotalKg,
            jumlahEkor: p.jumlahEkor,
            hargaPerKg: p.hargaPerKg,
            tipe: p.tipe.toLowerCase() as 'parsial' | 'total',
            catatan: p.catatan || undefined
        })),
        riwayatSortir: kolam.riwayatSortir.map(s => ({
            id: s.id,
            kolamId: s.kolamId,
            tanggal: s.tanggal.toISOString(),
            periode: s.periode,
            jumlahIkanSebelum: s.jumlahIkanSebelum,
            jumlahIkanSesudah: s.jumlahIkanSesudah,
            mortalitas: s.mortalitas,
            bobotRataRata: s.bobotRataRata || undefined,
            catatan: s.catatan || undefined
        }))
    };

    return <KolamDetailClient initialData={initialData} />;
}
