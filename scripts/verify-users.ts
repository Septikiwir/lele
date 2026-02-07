
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking users in database...')
    const users = await prisma.user.findMany()
    console.log('Found users:', users.length)
    users.forEach(u => {
        console.log(`User: ${u.email}, Role: ${u.role}, HasPassword: ${!!u.password}`)
    })
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
