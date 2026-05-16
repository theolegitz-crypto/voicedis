import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsService } from '../permissions/permissions.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(userId: string, serverId: string, dto: CreateChannelDto) {
    const membership = await this.permissionsService.getServerMembershipOrThrow(serverId, userId);
    this.permissionsService.ensureServerManager(membership.role);

    const position = await this.prisma.channel.count({
      where: { serverId, type: dto.type },
    });

    return this.prisma.channel.create({
      data: {
        serverId,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        position,
        createdById: userId,
      },
    });
  }

  async update(userId: string, channelId: string, dto: UpdateChannelDto) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const membership = await this.permissionsService.getServerMembershipOrThrow(channel.serverId, userId);
    this.permissionsService.ensureServerManager(membership.role);

    return this.prisma.channel.update({
      where: { id: channelId },
      data: dto,
    });
  }

  async remove(userId: string, channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const membership = await this.permissionsService.getServerMembershipOrThrow(channel.serverId, userId);
    this.permissionsService.ensureServerManager(membership.role);

    await this.prisma.channel.delete({
      where: { id: channelId },
    });

    return { success: true };
  }

  async getChannelForUser(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    await this.permissionsService.getServerMembershipOrThrow(channel.serverId, userId);
    return channel;
  }
}

