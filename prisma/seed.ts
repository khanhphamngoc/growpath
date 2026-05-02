import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const db = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });

async function main() {
  const parent = await db.user.upsert({
    where: { email: 'huong@test.growpath.vn' },
    update: {},
    create: {
      email: 'huong@test.growpath.vn',
      role: Role.PARENT,
      name: 'Nguyễn Thị Hương',
      city: 'Hồ Chí Minh',
    },
  });

  const child = await db.user.upsert({
    where: { email: 'anhminha@test.growpath.vn' },
    update: {},
    create: {
      email: 'anhminha@test.growpath.vn',
      role: Role.CHILD,
      name: 'Nguyễn Minh Anh',
      city: 'Hồ Chí Minh',
    },
  });

  await db.childProfile.upsert({
    where: { userId: child.id },
    update: {},
    create: {
      userId: child.id,
      dob: new Date('2015-08-15'), // 10 years old as of 2026
      grade: 5,
      school: 'Trường Tiểu học Nguyễn Bỉnh Khiêm',
      xp: 0,
    },
  });

  await db.familyLink.upsert({
    where: { parentId_childId: { parentId: parent.id, childId: child.id } },
    update: {},
    create: { parentId: parent.id, childId: child.id },
  });

  console.log(`✓ parent: ${parent.name} (${parent.email})`);
  console.log(`✓ child:  ${child.name} (${child.email})`);
  console.log(`✓ family link created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
