import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function checkFarmAccess(farmId: string, userId: string) {
    const member = await prisma.farmMember.findUnique({
        where: { userId_farmId: { userId, farmId } }
    })
    return member
}

// GET /api/farms/[farmId]/pembeli - Get all buyers
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

        const pembeli = await prisma.pembeli.findMany({
            where: { farmId },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(pembeli)
    } catch (error) {
        console.error('Get pembeli error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/farms/[farmId]/pembeli - Add buyer
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

        const { nama, tipe, kontak, alamat } = await request.json()

        if (!nama || !tipe) {
            return NextResponse.json({ error: 'Nama dan tipe wajib diisi' }, { status: 400 })
        }

        const pembeli = await prisma.pembeli.create({
            data: {
                farmId,
                nama,
                tipe: tipe.toUpperCase(),
                kontak,
                alamat
            }
        })

        return NextResponse.json(pembeli, { status: 201 })
    } catch (error) {
        console.error('Create pembeli error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
