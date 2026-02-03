import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const farm = await prisma.farm.findUnique({
      where: { id: farmId }
    })

    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    // Check access
    const member = await prisma.farmMember.findFirst({
      where: {
        farmId: farmId,
        userId: session.user.id
      }
    })

    const hasAccess = farm.ownerId === session.user.id || !!member
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all members
    const members = await prisma.farmMember.findMany({
      where: { farmId: farmId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const farm = await prisma.farm.findUnique({
      where: { id: farmId }
    })

    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    // Only owner can add members
    if (farm.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email dan role harus diisi' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER'].includes(role)) {
      return NextResponse.json(
        { error: 'Role tidak valid' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User dengan email ini tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if already member
    const existing = await prisma.farmMember.findUnique({
      where: {
        userId_farmId: {
          userId: user.id,
          farmId: farmId
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'User sudah menjadi anggota farm ini' },
        { status: 400 }
      )
    }

    // Add member
    const member = await prisma.farmMember.create({
      data: {
        userId: user.id,
        farmId: farmId,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error adding member:', error)
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    )
  }
}
