import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

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
    const { name, email, password, role } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Nama, Email, Password, dan Role harus diisi' },
        { status: 400 }
      )
    }

    // Validate role
    if (role !== 'OPERATOR') {
      return NextResponse.json(
        { error: 'Hanya role OPERATOR yang dapat ditambahkan' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar di sistem. Gunakan email lain.' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Transaction: Create User + Add to FarmMember
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'OPERATOR', // Global role
        }
      })

      // 2. Add to FarmMember
      const newMember = await tx.farmMember.create({
        data: {
          userId: newUser.id,
          farmId: farmId,
          role: 'OPERATOR' // Farm role
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

      return newMember
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating operator:', error)
    return NextResponse.json(
      { error: 'Failed to create operator account' },
      { status: 500 }
    )
  }
}
