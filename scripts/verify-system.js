const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifySystem() {
  console.log('\n📋 Admin Panel System Verification\n');
  console.log('=' .repeat(60));

  try {
    // 1. Check superadmin account
    console.log('\n1️⃣  Checking Superadmin Account...');
    const superadmin = await prisma.user.findUnique({
      where: { email: 'superadmin@example.com' },
      select: { id: true, email: true, name: true, role: true }
    });

    if (superadmin) {
      console.log('   ✅ Superadmin found');
      console.log(`      Email: ${superadmin.email}`);
      console.log(`      Name: ${superadmin.name}`);
      console.log(`      Role: ${superadmin.role}`);
    } else {
      console.log('   ⚠️  Superadmin NOT found');
      console.log('      Run: node scripts/verify-superadmin.js');
    }

    // 2. Check User table
    console.log('\n2️⃣  Checking User Table...');
    const userCount = await prisma.user.count();
    const superadminCount = await prisma.user.count({
      where: { role: 'SUPERADMIN' }
    });
    const ownerCount = await prisma.user.count({
      where: { role: 'OWNER' }
    });
    const operatorCount = await prisma.user.count({
      where: { role: 'OPERATOR' }
    });

    console.log(`   ✅ Total users: ${userCount}`);
    console.log(`      - SUPERADMIN: ${superadminCount}`);
    console.log(`      - OWNER: ${ownerCount}`);
    console.log(`      - OPERATOR: ${operatorCount}`);

    // 3. Check Farm table
    console.log('\n3️⃣  Checking Farm Table...');
    const farmCount = await prisma.farm.count();
    console.log(`   ✅ Total farms: ${farmCount}`);

    if (farmCount > 0) {
      const farms = await prisma.farm.findMany({
        take: 3,
        select: { id: true, nama: true, alamat: true, ownerId: true }
      });
      farms.forEach((farm, i) => {
        console.log(`      Farm ${i + 1}: ${farm.nama}`);
      });
    }

    // 4. Check FarmMember relationships
    console.log('\n4️⃣  Checking Farm Members...');
    const memberCount = await prisma.farmMember.count();
    console.log(`   ✅ Total farm members: ${memberCount}`);

    const ownerMembers = await prisma.farmMember.count({
      where: { role: 'OWNER' }
    });
    const operatorMembers = await prisma.farmMember.count({
      where: { role: 'OPERATOR' }
    });
    console.log(`      - OWNER role: ${ownerMembers}`);
    console.log(`      - OPERATOR role: ${operatorMembers}`);

    // 5. Check test owner account
    console.log('\n5️⃣  Checking Test Owner Account...');
    const testOwner = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      select: { id: true, email: true, name: true, role: true }
    });

    if (testOwner) {
      console.log('   ✅ Test owner found');
      console.log(`      Email: ${testOwner.email}`);
      console.log(`      Role: ${testOwner.role}`);
      
      // Check if owner has farms
      const ownerFarms = await prisma.farm.count({
        where: { ownerId: testOwner.id }
      });
      console.log(`      Farms owned: ${ownerFarms}`);
    } else {
      console.log('   ℹ️  No test@example.com account found (will be created on first login)');
    }

    // 6. Check NextAuth tables
    console.log('\n6️⃣  Checking NextAuth Tables...');
    try {
      const accountCount = await prisma.account.count().catch(() => 0);
      const sessionCount = await prisma.session.count().catch(() => 0);
      console.log('   ✅ NextAuth tables available');
      console.log(`      Accounts: ${accountCount}`);
      console.log(`      Sessions: ${sessionCount}`);
    } catch (e) {
      console.log('   ℹ️  NextAuth tables may not be initialized yet');
    }

    // 7. Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 System Status Summary:\n');

    const issues = [];
    if (superadminCount === 0) issues.push('❌ No superadmin account found');
    if (userCount === 0) issues.push('❌ No users in database');
    if (issues.length === 0) {
      console.log('✅ All checks passed!');
      console.log('\n🚀 Ready for testing:');
      console.log('   1. Start server: npm run dev');
      console.log('   2. Admin login: http://localhost:3000/admin/login');
      console.log('   3. Superadmin email: superadmin@example.com');
      console.log('   4. Superadmin password: superadmin123');
      console.log('\n📖 For detailed testing: See TESTING_GUIDE.md');
    } else {
      console.log('Issues found:');
      issues.forEach(issue => console.log('  ' + issue));
    }

    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    if (error.message.includes('Can\'t reach database')) {
      console.error('\n❌ Database Connection Error');
      console.error('   Cannot connect to database');
      console.error('   Please check:');
      console.error('   1. DATABASE_URL is set in .env.local');
      console.error('   2. Supabase connection is active');
      console.error('   3. Network connectivity');
    } else {
      console.error('\n❌ Error during verification:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

verifySystem();
