import { Injectable, NotFoundException } from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import { messageInclude } from '../common/selects';
import { PermissionsService } from '../permissions/permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { GetMessagesDto } from './dto/get-messages.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async getMessages(userId: string, channelId: string, query: GetMessagesDto) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.type !== ChannelType.TEXT) {
      throw new NotFoundException('Messages are only available in text channels');
    }

    await this.permissionsService.getServerMembershipOrThrow(channel.serverId, userId);

    const limit = query.limit ?? 50;
    const messages = await this.prisma.message.findMany({
      where: {
        channelId,
      },
      include: messageInclude,
      orderBy: [{ createdAt: 'desc' }],
      take: limit + 1,
      ...(query.before
        ? {
            skip: 1,
            cursor: { id: query.before },
          }
        : {}),
    });

    const hasMore = messages.length > limit;
    const slice = hasMore ? messages.slice(0, limit) : messages;
    const ordered = slice.reverse();

    return {
      items: ordered,
      nextCursor: hasMore ? slice[slice.length - 1]?.id : null,
    };
  }

  async sendMessage(userId: string, dto: SendMessageDto) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: dto.channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.type !== ChannelType.TEXT) {
      throw new NotFoundException('Messages can only be sent to text channels');
    }

    await this.permissionsService.getServerMembershipOrThrow(channel.serverId, userId);

    return this.prisma.message.create({
      data: {
        content: dto.content,
        authorId: userId,
        channelId: channel.id,
        serverId: channel.serverId,
      },
      include: messageInclude,
    });
  }

  async updateMessage(userId: string, dto: UpdateMessageDto) {
    const message = await this.prisma.message.findUnique({
      where: { id: dto.messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const membership = await this.permissionsService.getServerMembershipOrThrow(
      message.serverId,
      userId,
    );

    this.permissionsService.ensureMessageMutation(membership.role, message.authorId, userId);

    return this.prisma.message.update({
      where: { id: dto.messageId },
      data: {
        content: dto.content,
      },
      include: messageInclude,
    });
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const membership = await this.permissionsService.getServerMembershipOrThrow(
      message.serverId,
      userId,
    );

    this.permissionsService.ensureMessageMutation(membership.role, message.authorId, userId);

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: '',
        deletedAt: new Date(),
      },
      include: messageInclude,
    });
  }
}
