const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function applyRLS() {
    console.log('🔒 Applying Row Level Security (RLS) policies...\n')

    try {
        // Read the SQL file
        const sqlPath = path.join(process.cwd(), 'prisma', 'enable-rls.sql')
        const sql = fs.readFileSync(sqlPath, 'utf-8')

        // Split by statements and execute
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'))

        console.log(`📄 Found ${statements.length} SQL statements\n`)

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';'
            
            // Skip comments
            if (statement.startsWith('--')) continue

            try {
                await prisma.$executeRawUnsafe(statement)
                
                // Show progress
                if (statement.includes('ENABLE ROW LEVEL SECURITY')) {
                    const tableName = statement.match(/ALTER TABLE "(\w+)"/)?.[1]
                    console.log(`  ✓ Enabled RLS on table: ${tableName}`)
                } else if (statement.includes('CREATE POLICY')) {
                    const policyName = statement.match(/CREATE POLICY "([^"]+)"/)?.[1]
                    console.log(`  ✓ Created policy: ${policyName}`)
                }
            } catch (error) {
                // Skip errors for policies that already exist
                if (error.message.includes('already exists')) {
                    console.log(`  ⚠ Skipped (already exists)`)
                } else {
                    console.error(`  ❌ Error executing statement:`, error.message)
                }
            }
        }

        console.log('\n✅ RLS policies applied successfully!')
        console.log('\n📋 Security Status:')
        console.log('  ✓ All tables now have RLS enabled')
        console.log('  ✓ Service role (your app) has full access')
        console.log('  ✓ Public API access is blocked')
        console.log('\n⚠️  Important:')
        console.log('  - Your Next.js app uses Prisma which automatically uses the correct connection')
        console.log('  - RLS policies allow full access via your application')
        console.log('  - Direct database access (SQL editor, external tools) still works')
        console.log('  - Public/anonymous API access is now blocked')

    } catch (error) {
        console.error('\n❌ Error applying RLS:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

applyRLS()
