import prisma from '@/lib/prisma';

export type FarmAccessResult = {
    role: 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER';
    isOwner: boolean;
} | null;

/**
 * Checks if a user has access to a farm.
 * Returns the access details if allowed, or null if denied.
 * Prioritizes direct checking of Farm.ownerId to ensure owners always have access
 * even if FarmMember record is missing.
 */
export async function verifyFarmAccess(farmId: string, userId: string): Promise<FarmAccessResult> {
    try {
        // 1. Check if user is the direct Owner of the farm
        const farm = await prisma.farm.findUnique({
            where: { id: farmId },
            select: { ownerId: true }
        });

        if (farm && farm.ownerId === userId) {
            return { role: 'OWNER', isOwner: true };
        }

        // 2. Check FarmMember table
        const member = await prisma.farmMember.findUnique({
            where: {
                userId_farmId: {
                    userId,
                    farmId
                }
            },
            select: { role: true }
        });

        if (member) {
            return { role: member.role, isOwner: false };
        }

        return null;
    } catch (error) {
        console.error("Error verifying farm access:", error);
        return null;
    }
}
