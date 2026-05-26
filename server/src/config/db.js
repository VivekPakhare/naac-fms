const { PrismaClient } = require('@prisma/client');

// ── Singleton Pattern for Serverless ─────────────────────────
// Prevents connection exhaustion on Vercel where each hot invocation
// would otherwise create a new PrismaClient instance.
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

/**
 * Connect to the PostgreSQL database via Prisma.
 * In production (Vercel), Prisma lazy-connects automatically.
 */
async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected via Prisma');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    // Only exit in local dev — let serverless environments retry on next invocation
    if (!process.env.VERCEL && !process.env.NETLIFY) {
      process.exit(1);
    }
  }
}

/**
 * Gracefully disconnect from the database.
 */
async function disconnectDB() {
  await prisma.$disconnect();
  console.log('🔌 Database disconnected');
}

// Graceful shutdown handlers (local dev only)
if (!process.env.VERCEL) {
  process.on('SIGINT', async () => {
    await disconnectDB();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await disconnectDB();
    process.exit(0);
  });
}

module.exports = { prisma, connectDB, disconnectDB };
