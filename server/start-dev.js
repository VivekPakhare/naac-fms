/**
 * Development startup script — boots an embedded PostgreSQL instance
 * so no external DB installation is needed.
 */
const EmbeddedPostgres = require('embedded-postgres').default;
const path = require('path');
const { execSync, spawn } = require('child_process');

const DB_NAME = 'naac_db';
const DB_PORT = 5432;
const DB_USER = 'postgres';
const DB_PASS = 'postgres';
const DATA_DIR = path.join(__dirname, '.pg-data');

async function main() {
  console.log('🐘 Starting embedded PostgreSQL...\n');

  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: DB_USER,
    password: DB_PASS,
    port: DB_PORT,
    persistent: true,
  });

  try {
    const fs = require('fs');
    if (!fs.existsSync(DATA_DIR)) {
      await pg.initialise();
    }
    await pg.start();
    console.log(`✅ PostgreSQL running on port ${DB_PORT}\n`);

    // Create database if it doesn't exist
    try {
      await pg.createDatabase(DB_NAME);
      console.log(`✅ Database "${DB_NAME}" created`);
    } catch {
      console.log(`ℹ️  Database "${DB_NAME}" already exists`);
    }

    // Set DATABASE_URL for Prisma
    process.env.DATABASE_URL = `postgresql://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}`;

    // Push schema
    console.log('\n📐 Pushing Prisma schema...');
    execSync('npx prisma db push --skip-generate', {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env },
    });

    // Generate Prisma client
    console.log('\n🔧 Generating Prisma client...');
    execSync('npx prisma generate', {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env },
    });

    // Seed
    console.log('\n🌱 Seeding database...');
    execSync('node prisma/seed.js', {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env },
    });

    // Start server
    console.log('\n🚀 Starting NAAC server...');
    const server = spawn('node', ['src/index.js'], {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env },
    });

    // Handle shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down...');
      server.kill();
      await pg.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    server.on('exit', async (code) => {
      await pg.stop();
      process.exit(code || 0);
    });
  } catch (err) {
    console.error('❌ Startup failed:', err.message);
    try { await pg.stop(); } catch {}
    process.exit(1);
  }
}

main();
