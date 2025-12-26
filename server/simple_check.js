
require('dotenv').config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { PrismaClient } = require("@prisma/client");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    if (userCount > 0) {
      const admin = await prisma.user.findUnique({ where: { email: 'admin@aixilcoils.com' } });
      console.log('Admin user:', admin);
      if (admin) {
        // Verify password manually (optional, but good to know)
        // const bcrypt = require('bcryptjs');
        // console.log('Password valid:', await bcrypt.compare('Password123!', admin.password));
      }
    } else {
      console.log('No users found.');
    }
    
    const deptCount = await prisma.department.count();
    console.log('Department count:', deptCount);

  } catch (e) {
    console.error('Check failed:', e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
