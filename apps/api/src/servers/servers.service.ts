import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChannelType, ServerMemberRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { safeUserSelect } from '../common/selects';
import { DefaultRolePermissions } from '../permissions/permissions.constants';
import { PermissionsService } from '../permissions/permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';

@Injectable()
export class ServersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async listForUser(userId: string) {
    return this.prisma.server.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        channels: {
          orderBy: { position: 'asc' },
        },
        members: {
          include: {
            user: {
              select: safeUserSelect,
            },
            customRole: true,
          },
        },
      },
    });
  }

  async create(userId: string, dto: CreateServerDto) {
    return this.prisma.server.create({
      data: {
        name: dto.name,
        iconUrl: dto.iconUrl,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: ServerMemberRole.OWNER,
          },
        },
        roles: {
          create: [
            {
              name: 'OWNER',
              position: 100,
              permissions: DefaultRolePermissions.OWNER,
            },
            {
              name: 'ADMIN',
              position: 50,
              permissions: DefaultRolePermissions.ADMIN,
            },
            {
              name: 'MEMBER',
              position: 0,
              permissions: DefaultRolePermissions.MEMBER,
            },
          ],
        },
        channels: {
          create: [
            {
              name: 'general',
              type: ChannelType.TEXT,
              position: 0,
              createdById: userId,
            },
            {
              name: 'voice-lounge',
              type: ChannelType.VOICE,
              position: 1,
              createdById: userId,
            },
          ],
        },
      },
      include: {
        channels: {
          orderBy: { position: 'asc' },
        },
        members: {
          include: {
            user: {
              select: safeUserSelect,
            },
          },
        },
      },
    });
  }

  async getById(userId: string, serverId: string) {
    await this.permissionsService.getServerMembershipOrThrow(serverId, userId);

    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      include: {
        owner: {
          select: safeUserSelect,
        },
        channels: {
          orderBy: [{ type: 'asc' }, { position: 'asc' }],
        },
        roles: {
          orderBy: { position: 'desc' },
        },
        members: {
          orderBy: { joinedAt: 'asc' },
          include: {
            user: {
              select: safeUserSelect,
            },
            customRole: true,
          },
        },
      },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    return server;
  }

  async update(userId: string, serverId: string, dto: UpdateServerDto) {
    const membership = await this.permissionsService.getServerMembershipOrThrow(serverId, userId);
    this.permissionsService.ensureServerManager(membership.role);

    return this.prisma.server.update({
      where: { id: serverId },
      data: dto,
      include: {
        channels: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async remove(userId: string, serverId: string) {
    const membership = await this.permissionsService.getServerMembershipOrThrow(serverId, userId);
    this.permissionsService.ensureServerOwner(membership.role);

    await this.prisma.server.delete({
      where: { id: serverId },
    });

    return { success: true };
  }

  async createInvite(userId: string, serverId: string, dto: CreateInviteDto) {
    const membership = await this.permissionsService.getServerMembershipOrThrow(serverId, userId);
    this.permissionsService.ensureServerManager(membership.role);

    const code = randomBytes(4).toString('hex');
    const expiresAt = dto.expiresInMinutes
      ? new Date(Date.now() + dto.expiresInMinutes * 60 * 1000)
      : null;

    return this.prisma.invite.create({
      data: {
        code,
        serverId,
        createdById: userId,
        expiresAt,
        maxUses: dto.maxUses,
      },
    });
  }

  async getInviteByCode(code: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { code },
      include: {
        server: true,
        createdBy: {
          select: safeUserSelect,
        },
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    const isExpired = invite.expiresAt ? invite.expiresAt.getTime() < Date.now() : false;
    const isOverused = invite.maxUses ? invite.uses >= invite.maxUses : false;

    return {
      ...invite,
      isExpired,
      isOverused,
    };
  }

  async acceptInvite(userId: string, code: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { code },
      include: {
        server: true,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invite has expired');
    }

    if (invite.maxUses && invite.uses >= invite.maxUses) {
      throw new BadRequestException('Invite has reached maximum uses');
    }

    const existingMembership = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId: invite.serverId,
          userId,
        },
      },
    });

    if (existingMembership) {
      throw new ForbiddenException('You are already a member of this server');
    }

    await this.prisma.$transaction([
      this.prisma.serverMember.create({
        data: {
          serverId: invite.serverId,
          userId,
          role: ServerMemberRole.MEMBER,
        },
      }),
      this.prisma.invite.update({
        where: { id: invite.id },
        data: { uses: { increment: 1 } },
      }),
    ]);

    return this.getById(userId, invite.serverId);
  }
}

