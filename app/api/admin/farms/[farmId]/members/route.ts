import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params
    const session = await auth();

    // Check authorization
    const user = await prisma.user.findUnique({
      where: { email: session?.user?.email ?? '' },
    });

    if (!user || (user as any).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get farm members
    const members = await prisma.farmMember.findMany({
      where: { farmId: farmId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params
    const session = await auth();

    // Check authorization
    const user = await prisma.user.findUnique({
      where: { email: session?.user?.email || '' },
    });

    if (!user || (user as any).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already a member
    const existing = await prisma.farmMember.findUnique({
      where: {
        userId_farmId: {
          userId,
          farmId: farmId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a member of this farm' },
        { status: 400 }
      );
    }

    // Add farm member
    const member = await prisma.farmMember.create({
      data: {
        farmId: farmId,
        userId,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    );
  }
}
