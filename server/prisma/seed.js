require('dotenv').config();
/**
 * Database Seeder - Sample data for AIXILCOILS Management Suite
 * 
 * Team Structure:
 *   - 1 OWNER (James Asomugha - CEO)
 *   - 2 ADMIN (Sarah Chen, Aisha Bello)
 *   - 3 LEAD (Michael Okonkwo, Linda Adeyemi, Tunde Bakare)
 *   - 7 MEMBER (Dev team, Sales, Marketing)
 *   - 2 GUEST (Consultant, Client)
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database with AIXILCOILS team...');

  // Create departments
  const departments = await Promise.all([
    prisma.department.create({ data: { name: 'Engineering', code: 'ENG', description: 'Software Development Team' } }),
    prisma.department.create({ data: { name: 'Sales', code: 'SALES', description: 'Sales & Business Development' } }),
    prisma.department.create({ data: { name: 'Operations', code: 'OPS', description: 'Business Operations & Admin' } }),
    prisma.department.create({ data: { name: 'Marketing', code: 'MKT', description: 'Marketing & Communications' } }),
    prisma.department.create({ data: { name: 'Finance', code: 'FIN', description: 'Finance & Accounting' } }),
  ]);
  console.log('✅ Created 5 departments');

  // Create password (same for all demo users)
  const password = await bcrypt.hash('Password123!', 12);
  
  // === OWNER (CEO) ===
  const owner = await prisma.user.create({
    data: {
      email: 'goldenamadi@aixilcoils.com.ng',
      password,
      firstName: 'Golden',
      lastName: 'Amadi',
      role: 'OWNER',
      status: 'ACTIVE',
      position: 'CEO & Founder',
      onboardingCompleted: true,
    },
  });

  // === BOARD MEMBERS (Admins/Leads) ===
  const board = await Promise.all([
    prisma.user.create({
      data: {
        email: 'lawsonalasaki@aixilcoils.com.ng',
        password,
        firstName: 'Lawson',
        lastName: 'Alasaki',
        role: 'ADMIN', // Board members as Admins for now
        status: 'ACTIVE',
        position: 'Board Member',
        onboardingCompleted: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'idehanechilexemmanuel@aixilcoils.com.ng',
        password,
        firstName: 'Ideh',
        lastName: 'Anechilex Emmanuel',
        role: 'ADMIN',
        status: 'ACTIVE',
        position: 'Board Member',
        onboardingCompleted: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'dibitamunokuro@aixilcoils.com.ng',
        password,
        firstName: 'Tamunokuro',
        lastName: 'Dibi',
        role: 'ADMIN',
        status: 'ACTIVE',
        position: 'Board Member',
        onboardingCompleted: true,
      },
    }),
  ]);

  // === ADMINS (Staff) ===
  const admins = await Promise.all([
    prisma.user.create({
      data: {
        email: 'sarah@aixilcoils.com',
        password,
        firstName: 'Sarah',
        lastName: 'Chen',
        role: 'ADMIN',
        status: 'ACTIVE',
        position: 'Operations Manager',
        departmentId: departments[2].id,
        onboardingCompleted: true,
      },
    }),
  ]);

  // === LEADS ===
  const leads = await Promise.all([
    prisma.user.create({
      data: {
        email: 'michael@aixilcoils.com',
        password,
        firstName: 'Michael',
        lastName: 'Okonkwo',
        role: 'LEAD',
        status: 'ACTIVE',
        position: 'Engineering Lead',
        departmentId: departments[0].id,
        onboardingCompleted: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'linda@aixilcoils.com',
        password,
        firstName: 'Linda',
        lastName: 'Adeyemi',
        role: 'LEAD',
        status: 'ACTIVE',
        position: 'Sales Lead',
        departmentId: departments[1].id,
        onboardingCompleted: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'tunde@aixilcoils.com',
        password,
        firstName: 'Tunde',
        lastName: 'Bakare',
        role: 'LEAD',
        status: 'ACTIVE',
        position: 'Finance Lead',
        departmentId: departments[4].id,
        onboardingCompleted: true,
      },
    }),
  ]);

  // === MEMBERS ===
  const members = await Promise.all([
    prisma.user.create({
      data: {
        email: 'david@aixilcoils.com',
        password,
        firstName: 'David',
        lastName: 'Kim',
        role: 'MEMBER',
        status: 'ACTIVE',
        position: 'Senior Developer',
        departmentId: departments[0].id,
        managerId: leads[0].id,
        onboardingCompleted: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'grace@aixilcoils.com',
        password,
        firstName: 'Grace',
        lastName: 'Eze',
        role: 'MEMBER',
        status: 'ACTIVE',
        position: 'Full Stack Developer',
        departmentId: departments[0].id,
        managerId: leads[0].id,
        onboardingCompleted: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'ngozi@aixilcoils.com',
        password,
        firstName: 'Ngozi',
        lastName: 'Okoro',
        role: 'MEMBER',
        status: 'ACTIVE',
        position: 'UI/UX Designer',
        departmentId: departments[0].id,
        managerId: leads[0].id,
        onboardingCompleted: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'chioma@aixilcoils.com',
        password,
        firstName: 'Chioma',
        lastName: 'Nwachukwu',
        role: 'MEMBER',
        status: 'ACTIVE',
        position: 'Sales Representative',
        departmentId: departments[1].id,
        managerId: leads[1].id,
        onboardingCompleted: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'emeka@aixilcoils.com',
        password,
        firstName: 'Emeka',
        lastName: 'Obi',
        role: 'MEMBER',
        status: 'ACTIVE',
        position: 'Marketing Specialist',
        departmentId: departments[3].id,
        onboardingCompleted: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'peter@aixilcoils.com',
        password,
        firstName: 'Peter',
        lastName: 'Oladipo',
        role: 'MEMBER',
        status: 'ACTIVE',
        position: 'Customer Support',
        departmentId: departments[2].id,
        onboardingCompleted: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'fatima@aixilcoils.com',
        password,
        firstName: 'Fatima',
        lastName: 'Ibrahim',
        role: 'MEMBER',
        status: 'ACTIVE',
        position: 'Business Analyst',
        departmentId: departments[2].id,
        onboardingCompleted: true,
      },
    }),
  ]);

  // === GUESTS ===
  const guests = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.consultant@external.com',
        password,
        firstName: 'John',
        lastName: 'Mensah',
        role: 'GUEST',
        status: 'ACTIVE',
        position: 'External Consultant',
        onboardingCompleted: true,
      },
    }),
  ]);

  console.log('✅ Created team members');
  console.log('   - 1 Owner: goldenamadi@aixilcoils.com.ng');
  console.log('   - 3 Board Members');
  console.log('   - 1 Staff Admin');
  
  // Collect all created users
  const allUsers = [owner, ...board, ...admins, ...leads, ...members, ...guests];

  // Create channels
  const generalChannel = await prisma.channel.create({
    data: {
      name: 'General',
      description: 'Company-wide announcements',
      type: 'ANNOUNCEMENT',
      members: {
        create: [
          { userId: owner.id, role: 'OWNER' },
          ...admins.map(a => ({ userId: a.id, role: 'ADMIN' })),
          ...leads.map(l => ({ userId: l.id, role: 'MEMBER' })),
          ...members.slice(0, 5).map(m => ({ userId: m.id, role: 'MEMBER' })),
        ],
      },
    },
  });

  const engChannel = await prisma.channel.create({
    data: {
      name: 'Engineering',
      description: 'Engineering team discussions',
      type: 'DEPARTMENT',
      departmentId: departments[0].id,
      members: {
        create: [
          { userId: leads[0].id, role: 'OWNER' }, // Michael - Engineering Lead
          { userId: members[0].id, role: 'MEMBER' }, // David
          { userId: members[1].id, role: 'MEMBER' }, // Grace
          { userId: members[2].id, role: 'MEMBER' }, // Ngozi
        ],
      },
    },
  });
  console.log('✅ Created channels');

  // Create project
  const project = await prisma.project.create({
    data: {
      name: 'AMS Development',
      description: 'AIXILCOILS Management Suite Development',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      departmentId: departments[0].id,
      progress: 35,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      members: {
        create: [
          { userId: leads[0].id, role: 'OWNER' },
          { userId: members[0].id, role: 'MEMBER' },
          { userId: members[1].id, role: 'MEMBER' },
          { userId: members[2].id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Create tasks
  await Promise.all([
    prisma.task.create({
      data: {
        title: 'Setup authentication system',
        description: 'Implement JWT authentication with refresh tokens',
        status: 'COMPLETED',
        priority: 'HIGH',
        projectId: project.id,
        assigneeId: members[0].id, // David
        creatorId: leads[0].id,    // Michael
        order: 1,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Build chat module',
        description: 'Implement real-time chat with WebSocket',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: project.id,
        assigneeId: members[1].id, // Grace
        creatorId: leads[0].id,
        order: 2,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Create People dashboard',
        description: 'Build People management interface',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: project.id,
        assigneeId: members[2].id, // Ngozi
        creatorId: leads[0].id,
        order: 3,
      },
    }),
  ]);
  console.log('✅ Created project and tasks');

  // Create KPIs
  await Promise.all([
    prisma.kPI.create({
      data: {
        name: 'Code Quality Score',
        description: 'Maintain high code quality standards',
        userId: members[0].id,
        targetValue: 90,
        currentValue: 85,
        unit: '%',
        period: 'Q4 2024',
        status: 'ON_TRACK',
      },
    }),
    prisma.kPI.create({
      data: {
        name: 'Sprint Velocity',
        departmentId: departments[0].id,
        targetValue: 50,
        currentValue: 42,
        unit: 'points',
        period: 'Q4 2024',
        status: 'AT_RISK',
      },
    }),
  ]);
  console.log('✅ Created KPIs');

  console.log('\n🎉 Seeding completed!\n');
  console.log('Login credentials (Password: Password123!):');
  console.log('  Owner:  goldenamadi@aixilcoils.com.ng');
  console.log('  Board:  lawsonalasaki@aixilcoils.com.ng (Admin)');
  console.log('  Staff:  david@aixilcoils.com');
  console.log('  Guest:  john.consultant@external.com');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
