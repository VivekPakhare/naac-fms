require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const result = await prisma.user.updateMany({
    data: { emailVerified: true },
  });
  console.log('Updated', result.count, 'users to emailVerified=true');
  await prisma.$disconnect();
}

fix().catch(e => { console.error(e); process.exit(1); });
