// Load .env before anything else so DATABASE_URL is available when Prisma reads this config.
// Prisma 7 does not auto-load .env files when executing a TypeScript config file.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // Required by migrate/studio/push; omitted (not needed) for generate-only CI steps.
  ...(process.env.DATABASE_URL
    ? { datasource: { url: process.env.DATABASE_URL } }
    : {}),
});
