import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServerMemberRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getServerMembershipOrThrow(serverId: string, userId: string) {
    const membership = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId,
          userId,
        },
      },
      include: {
        customRole: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Server membership not found');
    }

    return membership;
  }

  ensureServerManager(role: ServerMemberRole) {
    if (role !== ServerMemberRole.OWNER && role !== ServerMemberRole.ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  ensureServerOwner(role: ServerMemberRole) {
    if (role !== ServerMemberRole.OWNER) {
      throw new ForbiddenException('Only server owner can perform this action');
    }
  }

  ensureMessageMutation(role: ServerMemberRole, authorId: string, requesterId: string) {
    if (
      authorId !== requesterId &&
      role !== ServerMemberRole.OWNER &&
      role !== ServerMemberRole.ADMIN
    ) {
      throw new ForbiddenException('You cannot modify this message');
    }
  }
}

