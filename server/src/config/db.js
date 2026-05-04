const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

/**
 * Connect to the PostgreSQL database via Prisma.
 * Exits the process if connection fails.
 */
async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected via Prisma');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

/**
 * Gracefully disconnect from the database.
 */
async function disconnectDB() {
  await prisma.$disconnect();
  console.log('🔌 Database disconnected');
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = { prisma, connectDB, disconnectDB };
