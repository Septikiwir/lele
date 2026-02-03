const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    console.log('Creating superadmin account...')

    try {
        // Check if superadmin exists
        const existing = await prisma.user.findUnique({
            where: { email: 'superadmin@example.com' }
        })

        if (existing) {
            console.log('✓ Superadmin already exists')
            return
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('superadmin123', 10)

        // Create superadmin
        const superadmin = await prisma.user.create({
            data: {
                email: 'superadmin@example.com',
                name: 'Super Admin',
                password: hashedPassword,
                role: 'SUPERADMIN',
                emailVerified: new Date(),
            }
        })

        console.log('✅ Superadmin created successfully!')
        console.log(`   Email: ${superadmin.email}`)
        console.log(`   Password: superadmin123`)
        console.log(`   Role: ${superadmin.role}`)

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
