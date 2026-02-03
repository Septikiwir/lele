import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Check if user is superadmin
async function isSuperAdmin(userId?: string) {
  if (!userId) return false
  
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  
  return (user as any)?.role === 'SUPERADMIN'
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!await isSuperAdmin(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all farms
    const farms = await prisma.farm.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(farms)
  } catch (error) {
    console.error('Error fetching farms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch farms' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!await isSuperAdmin(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { nama, alamat, ownerEmail } = body

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { error: 'Nama peternakan harus diisi' },
        { status: 400 }
      )
    }

    if (!ownerEmail) {
      return NextResponse.json(
        { error: 'Owner email harus diisi' },
        { status: 400 }
      )
    }

    // Find or create owner
    let owner = await prisma.user.findUnique({
      where: { email: ownerEmail }
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner belum terdaftar. Buat akun owner terlebih dahulu.' },
        { status: 400 }
      )
    }

    const farm = await prisma.farm.create({
      data: {
        nama: nama.trim(),
        alamat: alamat?.trim() || null,
        ownerId: owner.id,
        members: {
          create: {
            userId: owner.id,
            role: 'OWNER'
          }
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(farm, { status: 201 })
  } catch (error) {
    console.error('Error creating farm:', error)
    return NextResponse.json(
      { error: 'Failed to create farm' },
      { status: 500 }
    )
  }
}
