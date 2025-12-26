
require('dotenv').config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { PrismaClient } = require("@prisma/client");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  try {
    const count = await prisma.user.count();
    console.log(`User count: ${count}`);
    if (count > 0) {
      const user = await prisma.user.findUnique({ where: { email: 'admin@aixilcoils.com' } });
      console.log('Admin user:', user ? 'Found' : 'Not Found');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
