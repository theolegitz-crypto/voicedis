'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Socket } from 'socket.io-client';
import { apiFetch } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { WebRtcMeshManager } from '@/lib/webrtc';
import { useAuthStore } from '@/stores/auth.store';
import { useServerStore } from '@/stores/server.store';
import { useVoiceStore, type VoiceParticipant } from '@/stores/voice.store';
import type { Channel } from '@/types/channel';
import type { Message, PaginatedMessages } from '@/types/message';
import { ChannelSidebar } from '@/components/channels/channel-sidebar';
import { MessageInput } from '@/components/chat/message-input';
import { MessageList } from '@/components/chat/message-list';
import { MemberSidebar } from './member-sidebar';
import { ServerSidebar } from '@/components/servers/server-sidebar';
import { UserPanel } from './user-panel';
import { VoicePanel } from '@/components/voice/voice-panel';
import { RemoteAudio } from '@/components/voice/remote-audio';
import { Skeleton } from '@/components/ui/skeleton';

interface AppShellProps {
  serverId: string;
  channelId: string;
}

interface VoiceJoinResponse {
  participants: Array<{
    muted: boolean;
    user: VoiceParticipant['user'];
  }>;
  iceServers: Array<{ urls: string[]; username?: string; credential?: string }>;
}

export function AppShell({ serverId, channelId }: AppShellProps) {
  const router = useRouter();
  const {
    user,
    token,
    initialized,
    bootstrap,
    logout,
  } = useAuthStore();
  const {
    servers,
    activeServer,
    loading: serverLoading,
    fetchServers,
    fetchServer,
    createServer,
    createChannel,
    patchMemberPresence,
  } = useServerStore();
  const {
    activeChannelId: activeVoiceChannelId,
    connected: voiceConnected,
    muted,
    participants,
    setActiveVoice,
    clear: clearVoice,
    setMuted,
    upsertParticipant,
    removeParticipant,
  } = useVoiceStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const socketRef = useRef<Socket | null>(null);
  const webRtcRef = useRef<WebRtcMeshManager | null>(null);
  const typingTimeouts = useRef<Map<string, number>>(new Map());
  const activeServerRef = useRef(activeServer);

  const activeChannel = useMemo(
    () => activeServer?.channels.find((channel) => channel.id === channelId),
    [activeServer, channelId],
  );
  const activeVoiceChannel = useMemo(
    () => activeServer?.channels.find((channel) => channel.id === activeVoiceChannelId) ?? undefined,
    [activeServer, activeVoiceChannelId],
  );

  const myMembership = useMemo(
    () => activeServer?.members.find((member) => member.userId === user?.id),
    [activeServer, user?.id],
  );
  const canManageChannels =
    myMembership?.role === 'OWNER' || myMembership?.role === 'ADMIN';

  useEffect(() => {
    activeServerRef.current = activeServer;
  }, [activeServer]);

  const mergeMessages = useCallback((incoming: Message) => {
    setMessages((current) => {
      if (incoming.channelId !== channelId) {
        return current;
      }

      const exists = current.some((message) => message.id === incoming.id);
      if (exists) {
        return current.map((message) => (message.id === incoming.id ? incoming : message));
      }

      return [...current, incoming];
    });
  }, [channelId]);

  const loadMessages = useCallback(
    async (cursor?: string | null) => {
      if (!token) {
        return;
      }

      setMessagesLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', '50');
        if (cursor) {
          params.set('before', cursor);
        }

        const response = await apiFetch<PaginatedMessages>(
          `/channels/${channelId}/messages?${params.toString()}`,
          { token },
        );

        setNextCursor(response.nextCursor);
        setMessages((current) => (cursor ? [...response.items, ...current] : response.items));
      } finally {
        setMessagesLoading(false);
      }
    },
    [channelId, token],
  );

  useEffect(() => {
    if (!initialized) {
      void bootstrap();
    }
  }, [bootstrap, initialized]);

  useEffect(() => {
    if (initialized && !token) {
      router.replace('/auth/login');
    }
  }, [initialized, token, router]);

  useEffect(() => {
    if (!token) {
      return;
    }

    void fetchServers(token);
    void fetchServer(token, serverId);
  }, [token, serverId, fetchServers, fetchServer]);

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadMessages(null);
  }, [loadMessages, token]);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    const socket = getSocket(token);
    socketRef.current = socket;
    webRtcRef.current ??= new WebRtcMeshManager(
      (remoteUserId, stream) => {
        setRemoteStreams((current) => ({
          ...current,
          [remoteUserId]: stream,
        }));
      },
      (targetUserId, candidate) => {
        socket.emit('voice:ice-candidate', {
          targetUserId,
          channelId: activeVoiceChannelId,
          candidate,
        });
      },
    );

    socket.emit('server:join', { serverId });
    socket.emit('channel:join', { channelId });

    const onMessageNew = (message: Message) => {
      mergeMessages(message);
    };

    const onMessageUpdate = (message: Message) => {
      mergeMessages(message);
    };

    const onMessageDelete = (message: Message) => {
      mergeMessages(message);
    };

    const onPresenceUpdate = (payload: { userId: string; status: 'ONLINE' | 'OFFLINE' | 'IDLE' | 'DND' }) => {
      patchMemberPresence(serverId, payload.userId, payload.status);
    };

    const onTypingStart = (payload: { channelId: string; userId: string; username: string }) => {
      if (payload.channelId !== channelId || payload.userId === user.id) {
        return;
      }

      setTypingUsers((current) =>
        current.includes(payload.username) ? current : [...current, payload.username],
      );

      const timeoutId = typingTimeouts.current.get(payload.userId);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      typingTimeouts.current.set(
        payload.userId,
        window.setTimeout(() => {
          setTypingUsers((current) => current.filter((username) => username !== payload.username));
        }, 2500),
      );
    };

    const onTypingStop = (payload: { channelId: string; userId: string }) => {
      if (payload.channelId !== channelId) {
        return;
      }

      const username = activeServerRef.current?.members.find(
        (member) => member.userId === payload.userId,
      )?.user.displayName;

      if (!username) {
        return;
      }

      setTypingUsers((current) => current.filter((value) => value !== username));
    };

    const onVoiceUserJoined = async (payload: { channelId: string; user: VoiceParticipant['user']; muted: boolean }) => {
      if (payload.channelId !== activeVoiceChannelId || payload.user.id === user.id || !socketRef.current || !webRtcRef.current) {
        return;
      }

      upsertParticipant({
        user: payload.user,
        muted: payload.muted,
      });

      const offer = await webRtcRef.current.createOffer(payload.user.id);
      socketRef.current.emit('voice:offer', {
        targetUserId: payload.user.id,
        channelId: payload.channelId,
        sdp: offer,
      });
    };

    const onVoiceUserLeft = (payload: { userId: string; channelId: string }) => {
      if (payload.channelId !== activeVoiceChannelId) {
        return;
      }

      removeParticipant(payload.userId);
      webRtcRef.current?.closePeer(payload.userId);
      setRemoteStreams((current) => {
        const next = { ...current };
        delete next[payload.userId];
        return next;
      });
    };

    const onVoiceOffer = async (payload: {
      fromUserId: string;
      channelId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      if (payload.channelId !== activeVoiceChannelId || !socketRef.current || !webRtcRef.current) {
        return;
      }

      const answer = await webRtcRef.current.handleOffer(payload.fromUserId, payload.sdp);
      socketRef.current.emit('voice:answer', {
        targetUserId: payload.fromUserId,
        channelId: payload.channelId,
        sdp: answer,
      });
    };

    const onVoiceAnswer = async (payload: {
      fromUserId: string;
      channelId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      if (payload.channelId !== activeVoiceChannelId || !webRtcRef.current) {
        return;
      }

      await webRtcRef.current.handleAnswer(payload.fromUserId, payload.sdp);
    };

    const onVoiceIceCandidate = async (payload: {
      fromUserId: string;
      channelId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      if (payload.channelId !== activeVoiceChannelId || !webRtcRef.current) {
        return;
      }

      await webRtcRef.current.addIceCandidate(payload.fromUserId, payload.candidate);
    };

    const onVoiceMute = (payload: { userId: string; channelId: string }) => {
      if (payload.channelId !== activeVoiceChannelId) {
        return;
      }

      const member = activeServerRef.current?.members.find((entry) => entry.userId === payload.userId);
      if (member) {
        upsertParticipant({ user: member.user, muted: true });
      }
    };

    const onVoiceUnmute = (payload: { userId: string; channelId: string }) => {
      if (payload.channelId !== activeVoiceChannelId) {
        return;
      }

      const member = activeServerRef.current?.members.find((entry) => entry.userId === payload.userId);
      if (member) {
        upsertParticipant({ user: member.user, muted: false });
      }
    };

    socket.on('message:new', onMessageNew);
    socket.on('message:update', onMessageUpdate);
    socket.on('message:delete', onMessageDelete);
    socket.on('presence:update', onPresenceUpdate);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('voice:user-joined', onVoiceUserJoined);
    socket.on('voice:user-left', onVoiceUserLeft);
    socket.on('voice:offer', onVoiceOffer);
    socket.on('voice:answer', onVoiceAnswer);
    socket.on('voice:ice-candidate', onVoiceIceCandidate);
    socket.on('voice:mute', onVoiceMute);
    socket.on('voice:unmute', onVoiceUnmute);

    return () => {
      socket.off('message:new', onMessageNew);
      socket.off('message:update', onMessageUpdate);
      socket.off('message:delete', onMessageDelete);
      socket.off('presence:update', onPresenceUpdate);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('voice:user-joined', onVoiceUserJoined);
      socket.off('voice:user-left', onVoiceUserLeft);
      socket.off('voice:offer', onVoiceOffer);
      socket.off('voice:answer', onVoiceAnswer);
      socket.off('voice:ice-candidate', onVoiceIceCandidate);
      socket.off('voice:mute', onVoiceMute);
      socket.off('voice:unmute', onVoiceUnmute);
    };
  }, [
    activeVoiceChannelId,
    channelId,
    mergeMessages,
    patchMemberPresence,
    removeParticipant,
    serverId,
    token,
    upsertParticipant,
    user,
  ]);

  const handleCreateServer = async (payload: { name: string; iconUrl?: string }) => {
    if (!token) {
      return;
    }

    const server = await createServer(token, payload);
    const textChannel = server.channels.find((channel) => channel.type === 'TEXT');
    if (textChannel) {
      router.push(`/servers/${server.id}/channels/${textChannel.id}`);
    }
  };

  const handleCreateChannel = async (payload: {
    name: string;
    type: 'TEXT' | 'VOICE';
    description?: string;
  }) => {
    if (!token) {
      return;
    }

    await createChannel(token, serverId, payload);
  };

  const handleSendMessage = async (content: string) => {
    socketRef.current?.emit('message:send', {
      channelId,
      content,
    });
  };

  const handleJoinVoice = async (voiceChannelId: string) => {
    if (!token || !socketRef.current || !user) {
      return;
    }

    if (activeVoiceChannelId && activeVoiceChannelId !== voiceChannelId) {
      await handleLeaveVoice();
    }

    const response = await apiFetch<VoiceJoinResponse>(`/voice/channels/${voiceChannelId}/join`, {
      method: 'POST',
      token,
    });

    await webRtcRef.current?.ensureLocalStream();
    const seedParticipants = response.participants.map((participant) => ({
      user: participant.user,
      muted: participant.muted,
    }));

    setActiveVoice(
      voiceChannelId,
      seedParticipants.some((participant) => participant.user.id === user.id)
        ? seedParticipants
        : [...seedParticipants, { user, muted: false }],
    );

    socketRef.current.emit('voice:join', { channelId: voiceChannelId });
  };

  const handleLeaveVoice = async () => {
    if (!token || !activeVoiceChannelId) {
      return;
    }

    await apiFetch(`/voice/channels/${activeVoiceChannelId}/leave`, {
      method: 'POST',
      token,
    });
    socketRef.current?.emit('voice:leave', { channelId: activeVoiceChannelId });
    webRtcRef.current?.cleanup();
    setRemoteStreams({});
    clearVoice();
  };

  const handleToggleMute = () => {
    if (!activeVoiceChannelId || !socketRef.current) {
      return;
    }

    const nextMuted = !muted;
    setMuted(nextMuted);
    webRtcRef.current?.setMuted(nextMuted);
    socketRef.current.emit(nextMuted ? 'voice:mute' : 'voice:unmute', {
      channelId: activeVoiceChannelId,
    });
  };

  const navigateToTextChannel = (targetChannelId: string) => {
    router.push(`/servers/${serverId}/channels/${targetChannelId}`);
  };

  const handleTypingStart = () => {
    socketRef.current?.emit('typing:start', { channelId });
  };

  const handleTypingStop = () => {
    socketRef.current?.emit('typing:stop', { channelId });
  };

  if (!initialized || serverLoading || !activeServer || !user) {
    return (
      <div className="flex h-screen">
        <Skeleton className="h-full w-[88px]" />
        <Skeleton className="h-full w-[280px]" />
        <div className="flex-1 p-8">
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="mt-6 h-[70vh] w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <ServerSidebar
        servers={servers}
        activeServerId={serverId}
        onCreateServer={handleCreateServer}
      />

      <div className="flex min-w-0 flex-1">
        <div className="flex h-full w-[280px] flex-col">
          <ChannelSidebar
            channels={activeServer.channels}
            activeChannelId={channelId}
            activeVoiceChannelId={activeVoiceChannelId}
            canManageChannels={canManageChannels}
            onSelectTextChannel={navigateToTextChannel}
            onJoinVoiceChannel={(voiceChannel) => void handleJoinVoice(voiceChannel)}
            onCreateChannel={handleCreateChannel}
          />
          <VoicePanel
            channel={activeVoiceChannel}
            connected={voiceConnected}
            muted={muted}
            participants={participants}
            onToggleMute={handleToggleMute}
            onLeave={handleLeaveVoice}
          />
          <UserPanel
            user={user}
            onLogout={() => {
              logout();
              router.replace('/auth/login');
            }}
          />
        </div>

        <main className="flex min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(10,15,28,1))]">
          <div className="border-b border-border/70 px-6 py-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              #{activeChannel?.name ?? 'channel'}
            </p>
            <h1 className="text-xl font-semibold text-foreground">{activeServer.name}</h1>
          </div>

          <MessageList
            channelName={activeChannel?.name}
            messages={messages}
            hasMore={Boolean(nextCursor)}
            loading={messagesLoading}
            onLoadMore={() => loadMessages(nextCursor)}
            typingUsers={typingUsers}
          />

          <MessageInput
            disabled={activeChannel?.type !== 'TEXT'}
            placeholder={
              activeChannel?.type === 'TEXT'
                ? `Message #${activeChannel.name}`
                : 'Select a text channel to chat'
            }
            onSend={handleSendMessage}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
          />
        </main>

        <MemberSidebar members={activeServer.members} />
      </div>

      {Object.entries(remoteStreams).map(([userId, stream]) => (
        <RemoteAudio key={userId} stream={stream} />
      ))}
    </div>
  );
}
