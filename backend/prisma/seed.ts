import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: 'admin@sirosa.com' },
  });

  if (!existing) {
    const hashed = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        name: 'Administrator',
        email: 'admin@sirosa.com',
        password: hashed,
        role: 'ADMIN',
      },
    });
    console.log('Admin default berhasil dibuat');
  } else {
    console.log('Admin sudah ada, skip seed');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
