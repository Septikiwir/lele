import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('Testing DB connection...');

        // 1. Check DB Connection
        await prisma.$connect();

        // 2. Count Users
        const userCount = await prisma.user.count();

        // 3. List Users (Email only)
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                // Do NOT return password
            }
        });

        return NextResponse.json({
            status: 'success',
            message: 'Database connection successful',
            count: userCount,
            users: users,
            env: {
                // Check if DATABASE_URL is set (don't show full value)
                hasDatabaseUrl: !!process.env.DATABASE_URL,
                nodeEnv: process.env.NODE_ENV,
            }
        });
    } catch (error: any) {
        console.error('DB Connection Error:', error);
        return NextResponse.json({
            status: 'error',
            message: 'Failed to connect to database',
            error: error.message,
            stack: error.stack,
            env: {
                hasDatabaseUrl: !!process.env.DATABASE_URL,
            }
        }, { status: 500 });
    }
}
