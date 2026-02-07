
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const email = 'debug-user@example.com'
    const password = 'password123'

    console.log(`Creating/Updating debug user: ${email} with password: ${password}`)

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword },
        create: {
            email,
            password: hashedPassword,
            name: 'Debug User',
            role: 'OWNER'
        }
    })

    console.log('User saved. Verifying password...')

    const fetchedUser = await prisma.user.findUnique({ where: { email } })

    const isValid = await bcrypt.compare(password, fetchedUser.password)

    console.log(`Password valid? ${isValid}`)

    if (isValid) {
        console.log('Auth logic appears correct.')
    } else {
        console.error('Auth logic FAILED.')
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
