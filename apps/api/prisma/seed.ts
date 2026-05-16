import { PrismaClient, ServerMemberRole, ChannelType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@example.com';
  const username = 'demo';
  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      username,
      displayName: 'Demo User',
      passwordHash,
      status: 'OFFLINE',
    },
  });

  const server = await prisma.server.upsert({
    where: { id: 'demo-server' },
    update: {},
    create: {
      id: 'demo-server',
      name: 'Demo Server',
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: ServerMemberRole.OWNER,
        },
      },
      channels: {
        create: [
          {
            name: 'general',
            type: ChannelType.TEXT,
            position: 0,
            createdById: user.id,
          },
          {
            name: 'lounge',
            type: ChannelType.VOICE,
            position: 1,
            createdById: user.id,
          },
        ],
      },
    },
  });

  console.log(`Seeded demo user ${user.email} and server ${server.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
