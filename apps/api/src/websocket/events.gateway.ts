import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { MessagesService } from '../messages/messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { VoiceService } from '../voice/voice.service';
import { SendMessageDto } from '../messages/dto/send-message.dto';
import { UpdateMessageDto } from '../messages/dto/update-message.dto';
import { AuthUser } from '../auth/auth.types';

type AuthenticatedSocket = Socket & {
  data: {
    user?: AuthUser;
  };
};

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
    credentials: true,
  },
})
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly messagesService: MessagesService,
    private readonly voiceService: VoiceService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const authorizationHeader = client.handshake.headers.authorization;
      const bearerToken =
        typeof authorizationHeader === 'string'
          ? authorizationHeader.replace('Bearer ', '').trim()
          : undefined;
      const token =
        (typeof client.handshake.auth?.token === 'string' ? client.handshake.auth.token : undefined) ||
        bearerToken;

      if (!token) {
        client.disconnect();
        return;
      }

      const user = await this.authService.getUserFromToken(token);
      client.data.user = user;
      client.join(`user:${user.sub}`);

      const memberships = await this.prisma.serverMember.findMany({
        where: { userId: user.sub },
        select: { serverId: true },
      });

      memberships.forEach(({ serverId }) => {
        client.join(`server:${serverId}`);
      });

      await this.redisService.incrementPresence(user.sub);
      this.server.emit('presence:online', { userId: user.sub, status: 'ONLINE' });
      memberships.forEach(({ serverId }) => {
        this.server.to(`server:${serverId}`).emit('presence:update', {
          userId: user.sub,
          status: 'ONLINE',
        });
      });
    } catch (error) {
      this.logger.warn(`Socket connection rejected: ${(error as Error).message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (!user) {
      return;
    }

    setTimeout(async () => {
      const remaining = await this.redisService.decrementPresence(user.sub);
      if (remaining === 0) {
        const memberships = await this.prisma.serverMember.findMany({
          where: { userId: user.sub },
          select: { serverId: true },
        });

        memberships.forEach(({ serverId }) => {
          this.server.to(`server:${serverId}`).emit('presence:update', {
            userId: user.sub,
            status: 'OFFLINE',
          });
        });
      }
    }, 3000);
  }

  @SubscribeMessage('server:join')
  async handleServerJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { serverId: string },
  ) {
    if (!client.data.user) {
      return;
    }

    const membership = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId: payload.serverId,
          userId: client.data.user.sub,
        },
      },
    });

    if (membership) {
      client.join(`server:${payload.serverId}`);
    }
  }

  @SubscribeMessage('channel:join')
  async handleChannelJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { channelId: string },
  ) {
    if (!client.data.user) {
      return;
    }

    const channel = await this.prisma.channel.findUnique({
      where: { id: payload.channelId },
    });

    if (!channel) {
      return;
    }

    const membership = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId: channel.serverId,
          userId: client.data.user.sub,
        },
      },
    });

    if (membership) {
      client.join(`channel:${payload.channelId}`);
    }
  }

  @SubscribeMessage('message:send')
  async handleMessageSend(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: SendMessageDto,
  ) {
    if (!client.data.user) {
      return;
    }

    const message = await this.messagesService.sendMessage(client.data.user.sub, dto);
    this.server.to(`server:${message.serverId}`).emit('message:new', message);
    this.server.to(`channel:${message.channelId}`).emit('message:new', message);
    return message;
  }

  @SubscribeMessage('message:update')
  async handleMessageUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: UpdateMessageDto,
  ) {
    if (!client.data.user) {
      return;
    }

    const message = await this.messagesService.updateMessage(client.data.user.sub, dto);
    this.server.to(`server:${message.serverId}`).emit('message:update', message);
    this.server.to(`channel:${message.channelId}`).emit('message:update', message);
    return message;
  }

  @SubscribeMessage('message:delete')
  async handleMessageDelete(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { messageId: string },
  ) {
    if (!client.data.user) {
      return;
    }

    const message = await this.messagesService.deleteMessage(client.data.user.sub, payload.messageId);
    this.server.to(`server:${message.serverId}`).emit('message:delete', message);
    this.server.to(`channel:${message.channelId}`).emit('message:delete', message);
    return message;
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { channelId: string },
  ) {
    if (!client.data.user) {
      return;
    }

    client.to(`channel:${payload.channelId}`).emit('typing:start', {
      channelId: payload.channelId,
      userId: client.data.user.sub,
      username: client.data.user.username,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { channelId: string },
  ) {
    if (!client.data.user) {
      return;
    }

    client.to(`channel:${payload.channelId}`).emit('typing:stop', {
      channelId: payload.channelId,
      userId: client.data.user.sub,
    });
  }

  @SubscribeMessage('voice:join')
  async handleVoiceJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { channelId: string },
  ) {
    if (!client.data.user) {
      return;
    }

    const response = await this.voiceService.joinChannel(
      client.data.user.sub,
      payload.channelId,
      client.id,
    );

    client.join(`voice:${payload.channelId}`);
    client.to(`voice:${payload.channelId}`).emit('voice:user-joined', {
      channelId: payload.channelId,
      user: response.session.user,
      muted: response.session.muted,
    });

    return response;
  }

  @SubscribeMessage('voice:leave')
  async handleVoiceLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { channelId: string },
  ) {
    if (!client.data.user) {
      return;
    }

    await this.voiceService.leaveChannel(client.data.user.sub, payload.channelId);
    client.leave(`voice:${payload.channelId}`);
    this.server.to(`voice:${payload.channelId}`).emit('voice:user-left', {
      channelId: payload.channelId,
      userId: client.data.user.sub,
    });

    return { success: true };
  }

  @SubscribeMessage('voice:offer')
  handleVoiceOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { targetUserId: string; channelId: string; sdp: Record<string, unknown> },
  ) {
    if (!client.data.user) {
      return;
    }

    this.server.to(`user:${payload.targetUserId}`).emit('voice:offer', {
      channelId: payload.channelId,
      fromUserId: client.data.user.sub,
      sdp: payload.sdp,
    });
  }

  @SubscribeMessage('voice:answer')
  handleVoiceAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { targetUserId: string; channelId: string; sdp: Record<string, unknown> },
  ) {
    if (!client.data.user) {
      return;
    }

    this.server.to(`user:${payload.targetUserId}`).emit('voice:answer', {
      channelId: payload.channelId,
      fromUserId: client.data.user.sub,
      sdp: payload.sdp,
    });
  }

  @SubscribeMessage('voice:ice-candidate')
  handleVoiceIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    payload: { targetUserId: string; channelId: string; candidate: Record<string, unknown> },
  ) {
    if (!client.data.user) {
      return;
    }

    this.server.to(`user:${payload.targetUserId}`).emit('voice:ice-candidate', {
      channelId: payload.channelId,
      fromUserId: client.data.user.sub,
      candidate: payload.candidate,
    });
  }

  @SubscribeMessage('voice:mute')
  async handleVoiceMute(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { channelId: string },
  ) {
    if (!client.data.user) {
      return;
    }

    await this.voiceService.setMuted(client.data.user.sub, payload.channelId, true);
    this.server.to(`voice:${payload.channelId}`).emit('voice:mute', {
      channelId: payload.channelId,
      userId: client.data.user.sub,
    });
  }

  @SubscribeMessage('voice:unmute')
  async handleVoiceUnmute(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { channelId: string },
  ) {
    if (!client.data.user) {
      return;
    }

    await this.voiceService.setMuted(client.data.user.sub, payload.channelId, false);
    this.server.to(`voice:${payload.channelId}`).emit('voice:unmute', {
      channelId: payload.channelId,
      userId: client.data.user.sub,
    });
  }
}
