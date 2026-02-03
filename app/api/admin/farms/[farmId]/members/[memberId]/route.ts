import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ farmId: string; memberId: string }> }
) {
  try {
    const { farmId, memberId } = await params
    const session = await auth();

    // Check authorization
    const user = await prisma.user.findUnique({
      where: { email: session?.user?.email || '' }
    });

    if (!user || (user as any).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if member exists and belongs to this farm
    const member = await prisma.farmMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.farmId !== farmId) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Cannot delete owner
    if (member.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove the owner of the farm' },
        { status: 400 }
      );
    }

    // Delete member
    await prisma.farmMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    );
  }
}
