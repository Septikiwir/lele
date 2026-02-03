import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

async function isSuperAdmin(userId?: string) {
  if (!userId) return false
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  return (user as any)?.role === 'SUPERADMIN'
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params
    const session = await auth()
    if (!session?.user?.id || !await isSuperAdmin(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        owner: true
      }
    })

    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    return NextResponse.json(farm)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed' },
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
    if (!session?.user?.id || !await isSuperAdmin(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { nama, alamat } = body

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { error: 'Nama harus diisi' },
        { status: 400 }
      )
    }

    const farm = await prisma.farm.update({
      where: { id: farmId },
      data: {
        nama: nama.trim(),
        alamat: alamat?.trim() || null
      },
      include: {
        owner: true
      }
    })

    return NextResponse.json(farm)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to update' },
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
    if (!session?.user?.id || !await isSuperAdmin(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get farm with owner info
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      select: { ownerId: true }
    })

    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    const ownerId = farm.ownerId

    // Delete farm (this will cascade delete FarmMembers)
    await prisma.farm.delete({
      where: { id: farmId }
    })

    // Check if owner has any other farms
    const ownerOtherFarms = await prisma.farm.findFirst({
      where: { ownerId }
    })

    // If owner has no other farms, delete the owner user
    if (!ownerOtherFarms) {
      await prisma.user.delete({
        where: { id: ownerId }
      })
      console.log('✅ Farm and owner user deleted:', { farmId, ownerId })
    } else {
      console.log('✅ Farm deleted, owner kept (has other farms):', { farmId, ownerId })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting farm:', error)
    return NextResponse.json(
      { error: 'Failed to delete farm' },
      { status: 500 }
    )
  }
}
