/**
 * Database Configuration
 * 
 * Prisma 7 client configuration with PostgreSQL driver adapter
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// Create Prisma client singleton with driver adapter
let prisma;

if (process.env.NODE_ENV === 'production') {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  prisma = new PrismaClient({
    adapter,
    log: ['error'],
  });
} else {
  // In development, prevent multiple instances during hot reloading
  if (!global.prisma) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    global.prisma = new PrismaClient({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.prisma;
}

module.exports = prisma;
