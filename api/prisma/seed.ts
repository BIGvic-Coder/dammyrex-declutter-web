import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const categories = [
  { name: 'Fridges', slug: 'fridges', icon: '🧊' },
  { name: 'Freezers', slug: 'freezers', icon: '❄️' },
  { name: 'Gas Cookers', slug: 'gas-cookers', icon: '🔥' },
  { name: 'Fans', slug: 'fans', icon: '🌀' },
  { name: 'Air Conditioners', slug: 'air-conditioners', icon: '🌬️' },
  { name: 'Beds', slug: 'beds', icon: '🛏️' },
  { name: 'Bed Frames', slug: 'bed-frames', icon: '🪵' },
  { name: 'Chairs', slug: 'chairs', icon: '🪑' },
  { name: 'Tables', slug: 'tables', icon: '🍽️' },
  { name: 'Others', slug: 'others', icon: '📦' },
];

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon },
      create: c,
    });
  }
  console.log(`Seeded ${categories.length} categories`);

  const name = process.env.ADMIN_NAME?.trim() || 'Admin';
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in api/.env');
  }
  if (password.length < 10) {
    throw new Error('ADMIN_PASSWORD must be at least 10 characters');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.admin.upsert({
    where: { email },
    // Re-running the seed resets the password to the one in .env
    update: { name, passwordHash },
    create: { name, email, passwordHash, role: 'OWNER' },
  });
  console.log(`Seeded admin ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
