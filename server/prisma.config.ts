// Prisma Configuration File for Prisma ORM v7+
// This file configures Prisma CLI commands (migrate, db push, studio, etc.)

import 'dotenv/config';
import { defineConfig, env } from "prisma/config";

// Type-safe environment variables
type Env = {
  DATABASE_URL: string;
};

export default defineConfig({
  // Path to your Prisma schema file
  schema: 'prisma/schema.prisma',
  
  // Migration configuration
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  
  // Database connection configuration
  datasource: {
    url: env<Env>('DATABASE_URL'),
  },
});
