
require('dotenv').config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { PrismaClient } = require("@prisma/client");

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Defined' : 'Undefined');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected!');
    const count = await prisma.user.count();
    console.log('Count:', count);
  } catch (e) {
    console.error('Error:', e);
    if (e.cause) console.error('Cause:', JSON.stringify(e.cause, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
