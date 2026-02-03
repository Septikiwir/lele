const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function verifySuperadmin() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'superadmin@example.com' }
    });
    
    if (user) {
      console.log('✅ Superadmin account found:');
      console.log('  Email:', user.email);
      console.log('  Name:', user.name);
      console.log('  Role:', user.role);
      console.log('\n📝 Test Login Credentials:');
      console.log('  Email: superadmin@example.com');
      console.log('  Password: superadmin123');
    } else {
      console.log('⚠️ Superadmin account not found. Creating now...');
      // Create superadmin using bcrypt
      const hashedPassword = await bcrypt.hash('superadmin123', 10);
      
      const created = await prisma.user.create({
        data: {
          email: 'superadmin@example.com',
          name: 'Super Admin',
          password: hashedPassword,
          role: 'SUPERADMIN',
          emailVerified: new Date()
        }
      });
      
      console.log('✅ Superadmin account created:');
      console.log('  Email:', created.email);
      console.log('  Name:', created.name);
      console.log('  Role:', created.role);
      console.log('\n📝 Test Login Credentials:');
      console.log('  Email: superadmin@example.com');
      console.log('  Password: superadmin123');
    }
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('✅ Superadmin account already exists');
      console.log('\n📝 Test Login Credentials:');
      console.log('  Email: superadmin@example.com');
      console.log('  Password: superadmin123');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

verifySuperadmin();
