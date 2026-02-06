import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'konci@gmail.com'
    const password = 'password123'
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log(`Checking user: ${email}...`)

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword // Reset password if exists
        },
        create: {
            email,
            name: 'Konci User',
            password: hashedPassword,
        },
    })

    console.log('✅ User ready!')
    console.log(`   Email: ${user.email}`)
    console.log(`   Password: ${password}`)

    // Check if Farm exists for this user
    let farm = await prisma.farm.findFirst({
        where: { ownerId: user.id }
    })

    if (!farm) {
        console.log('Creating default Farm...')
        farm = await prisma.farm.create({
            data: {
                nama: 'Farm Konci',
                alamat: 'Default Location',
                ownerId: user.id
            }
        })
        console.log(`✅ Farm created: ${farm.nama}`)
    } else {
        console.log(`ℹ️ Farm exists: ${farm.nama}`)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
