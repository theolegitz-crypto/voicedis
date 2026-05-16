import { Injectable, NotFoundException } from '@nestjs/common';
import { ChannelType, VoiceSessionStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PermissionsService } from '../permissions/permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { safeUserSelect } from '../common/selects';

@Injectable()
export class VoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
    private readonly configService: ConfigService,
  ) {}

  async joinChannel(userId: string, channelId: string, socketId?: string) {
    const channel = await this.validateVoiceChannelAccess(userId, channelId);

    await this.prisma.voiceSession.updateMany({
      where: {
        userId,
        status: VoiceSessionStatus.ACTIVE,
      },
      data: {
        status: VoiceSessionStatus.LEFT,
        leftAt: new Date(),
      },
    });

    const session = await this.prisma.voiceSession.create({
      data: {
        userId,
        channelId,
        serverId: channel.serverId,
        socketId,
      },
      include: {
        user: {
          select: safeUserSelect,
        },
      },
    });

    return {
      session,
      iceServers: this.getIceServers(),
      participants: await this.getActiveParticipants(channelId),
    };
  }

  async getJoinContext(userId: string, channelId: string) {
    await this.validateVoiceChannelAccess(userId, channelId);

    return {
      iceServers: this.getIceServers(),
      participants: await this.getActiveParticipants(channelId),
    };
  }

  async leaveChannel(userId: string, channelId: string) {
    await this.prisma.voiceSession.updateMany({
      where: {
        userId,
        channelId,
        status: VoiceSessionStatus.ACTIVE,
      },
      data: {
        status: VoiceSessionStatus.LEFT,
        leftAt: new Date(),
      },
    });

    return { success: true };
  }

  async setMuted(userId: string, channelId: string, muted: boolean) {
    await this.prisma.voiceSession.updateMany({
      where: {
        userId,
        channelId,
        status: VoiceSessionStatus.ACTIVE,
      },
      data: { muted },
    });

    return { success: true, muted };
  }

  async getActiveParticipants(channelId: string) {
    return this.prisma.voiceSession.findMany({
      where: {
        channelId,
        status: VoiceSessionStatus.ACTIVE,
      },
      include: {
        user: {
          select: safeUserSelect,
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  getIceServers() {
    const stunUrl = this.configService.get<string>('NEXT_PUBLIC_STUN_URL');
    const turnUrl = this.configService.get<string>('NEXT_PUBLIC_TURN_URL');
    const username = this.configService.get<string>('NEXT_PUBLIC_TURN_USERNAME');
    const credential = this.configService.get<string>('NEXT_PUBLIC_TURN_CREDENTIAL');

    return [
      ...(stunUrl ? [{ urls: [stunUrl] }] : []),
      ...(turnUrl
        ? [
            {
              urls: [turnUrl],
              username,
              credential,
            },
          ]
        : []),
    ];
  }

  private async validateVoiceChannelAccess(userId: string, channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.type !== ChannelType.VOICE) {
      throw new NotFoundException('Voice sessions are only available in voice channels');
    }

    await this.permissionsService.getServerMembershipOrThrow(channel.serverId, userId);
    return channel;
  }
}
