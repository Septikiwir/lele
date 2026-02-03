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
      where: { id: farmId },
      include: {
        members: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    // Check access
    const hasAccess = farm.ownerId === session.user.id || farm.members.length > 0
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(farm)
  } catch (error) {
    console.error('Error fetching farm:', error)
    return NextResponse.json(
      { error: 'Failed to fetch farm' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    // Only owner can edit
    if (farm.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { nama, alamat } = body

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { error: 'Nama peternakan harus diisi' },
        { status: 400 }
      )
    }

    const updated = await prisma.farm.update({
      where: { id: farmId },
      data: {
        nama: nama.trim(),
        alamat: alamat?.trim() || null
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating farm:', error)
    return NextResponse.json(
      { error: 'Failed to update farm' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Only owner can delete
    if (farm.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.farm.delete({
      where: { id: farmId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting farm:', error)
    return NextResponse.json(
      { error: 'Failed to delete farm' },
      { status: 500 }
    )
  }
}
