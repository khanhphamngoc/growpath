import { db } from '@/lib/db';

// Delete in FK dependency order: dependents first, then roots.
// Prisma enforces IMMEDIATE FK constraints, so order within the transaction matters.
export async function cleanDb() {
  await db.$transaction([
    db.personaDelta.deleteMany(),   // FK → Persona
    db.careerCluster.deleteMany(),  // FK → Dream
    db.familyLink.deleteMany(),     // FK → User
    db.childProfile.deleteMany(),   // FK → User
    db.milestone.deleteMany(),
    db.weeklyCheckin.deleteMany(),
    db.skillRoadmap.deleteMany(),
    db.dream.deleteMany(),
    db.persona.deleteMany(),
    db.user.deleteMany(),
  ]);
}

export async function disconnectDb() {
  await db.$disconnect();
}
