const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Creating test user...');

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create user
    const user = await prisma.user.create({
        data: {
            email: 'test@example.com',
            name: 'Test User',
            password: hashedPassword,
            emailVerified: new Date(),
        }
    });

    console.log('✅ Test user created:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: password123`);

    // Create a farm for the user
    const farm = await prisma.farm.create({
        data: {
            nama: 'Farm Test',
            alamat: 'Jl. Test No. 1',
            ownerId: user.id,
            members: {
                create: {
                    userId: user.id,
                    role: 'OWNER'
                }
            }
        }
    });

    console.log(`✅ Farm created: ${farm.nama}`);

    // Create a kolam
    const kolam = await prisma.kolam.create({
        data: {
            farmId: farm.id,
            nama: 'Kolam A1',
            panjang: 10,
            lebar: 5,
            kedalaman: 1.2,
            tanggalTebar: new Date('2025-01-01'),
            jumlahIkan: 5000,
            status: 'AMAN',
            positionX: 5,
            positionY: 3,
            positionW: 3,
            positionH: 2,
            color: '#f59e0b'
        }
    });

    console.log(`✅ Kolam created: ${kolam.nama}`);

    // Create initial sampling
    const sampling = await prisma.riwayatSampling.create({
        data: {
            kolamId: kolam.id,
            tanggal: new Date('2025-01-01'),
            jumlahIkanPerKg: 20,
            bobotGram: 50,
            catatan: 'Bibit awal'
        }
    });

    console.log(`✅ Initial sampling created: ${sampling.bobotGram}g per fish`);

    console.log('\n🎉 All done! You can now login with:');
    console.log(`   Email: test@example.com`);
    console.log(`   Password: password123`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
