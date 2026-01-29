import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/farms - Get all farms for current user
export async function GET() {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const farms = await prisma.farm.findMany({
            where: {
                OR: [
                    { ownerId: session.user.id },
                    { members: { some: { userId: session.user.id } } }
                ]
            },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                members: {
                    include: { user: { select: { id: true, name: true, email: true } } }
                },
                _count: { select: { kolam: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(farms)
    } catch (error) {
        console.error('Get farms error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/farms - Create a new farm
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { nama, alamat } = await request.json()

        if (!nama) {
            return NextResponse.json({ error: 'Nama farm wajib diisi' }, { status: 400 })
        }

        const farm = await prisma.farm.create({
            data: {
                nama,
                alamat,
                ownerId: session.user.id,
                members: {
                    create: {
                        userId: session.user.id,
                        role: 'OWNER'
                    }
                }
            },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                members: { include: { user: { select: { id: true, name: true, email: true } } } }
            }
        })

        return NextResponse.json(farm, { status: 201 })
    } catch (error) {
        console.error('Create farm error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
