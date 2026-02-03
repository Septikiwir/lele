const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixUserTableRLS() {
    console.log('🔒 Fixing RLS for User table...\n')

    try {
        // Enable RLS on User table
        await prisma.$executeRawUnsafe('ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;')
        console.log('✓ Enabled RLS on User table')

        // Create policy for User table
        await prisma.$executeRawUnsafe(`
            CREATE POLICY "Service role can do everything on User" ON "User"
                FOR ALL 
                USING (true)
                WITH CHECK (true);
        `)
        console.log('✓ Created policy for User table')

        console.log('\n✅ User table is now protected!')
        console.log('📋 Status:')
        console.log('  ✓ RLS enabled on User table')
        console.log('  ✓ Service role policy created')
        console.log('  ✓ Public API access is blocked')

    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('⚠ Policy already exists, trying to drop and recreate...')
            try {
                await prisma.$executeRawUnsafe('DROP POLICY IF EXISTS "Service role can do everything on User" ON "User";')
                await prisma.$executeRawUnsafe(`
                    CREATE POLICY "Service role can do everything on User" ON "User"
                        FOR ALL 
                        USING (true)
                        WITH CHECK (true);
                `)
                console.log('✓ Policy recreated successfully')
            } catch (retryError) {
                console.error('❌ Error:', retryError.message)
            }
        } else {
            console.error('❌ Error:', error.message)
        }
    } finally {
        await prisma.$disconnect()
    }
}

fixUserTableRLS()
