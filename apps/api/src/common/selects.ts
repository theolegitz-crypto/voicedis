import { Prisma } from '@prisma/client';

export const safeUserSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const messageInclude = Prisma.validator<Prisma.MessageInclude>()({
  author: {
    select: safeUserSelect,
  },
  attachments: true,
});

export const channelInclude = Prisma.validator<Prisma.ChannelInclude>()({
  messages: false,
});

