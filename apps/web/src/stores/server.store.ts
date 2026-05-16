'use client';

import { create } from 'zustand';
import { apiFetch } from '@/lib/api';
import type { ChannelType } from '@/types/channel';
import type { Server } from '@/types/server';
import type { UserStatus } from '@/types/user';

interface ServerState {
  servers: Server[];
  activeServer: Server | null;
  loading: boolean;
  fetchServers: (token: string) => Promise<Server[]>;
  fetchServer: (token: string, serverId: string) => Promise<Server>;
  createServer: (
    token: string,
    payload: { name: string; iconUrl?: string },
  ) => Promise<Server>;
  createChannel: (
    token: string,
    serverId: string,
    payload: { name: string; type: ChannelType; description?: string },
  ) => Promise<void>;
  patchMemberPresence: (serverId: string, userId: string, status: UserStatus) => void;
}

export const useServerStore = create<ServerState>((set, get) => ({
  servers: [],
  activeServer: null,
  loading: false,
  fetchServers: async (token) => {
    set({ loading: true });
    try {
      const servers = await apiFetch<Server[]>('/servers', { token });
      set({ servers, loading: false });
      return servers;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  fetchServer: async (token, serverId) => {
    set({ loading: true });
    try {
      const server = await apiFetch<Server>(`/servers/${serverId}`, { token });
      set((state) => ({
        activeServer: server,
        loading: false,
        servers: state.servers.some((item) => item.id === server.id)
          ? state.servers.map((item) => (item.id === server.id ? server : item))
          : [...state.servers, server],
      }));
      return server;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  createServer: async (token, payload) => {
    const server = await apiFetch<Server>('/servers', {
      method: 'POST',
      token,
      body: payload,
    });

    set((state) => ({
      servers: [server, ...state.servers],
      activeServer: server,
    }));

    return server;
  },
  createChannel: async (token, serverId, payload) => {
    await apiFetch(`/servers/${serverId}/channels`, {
      method: 'POST',
      token,
      body: payload,
    });

    await get().fetchServer(token, serverId);
  },
  patchMemberPresence: (serverId, userId, status) => {
    set((state) => ({
      activeServer:
        state.activeServer?.id === serverId
          ? {
              ...state.activeServer,
              members: state.activeServer.members.map((member) =>
                member.userId === userId
                  ? {
                      ...member,
                      user: {
                        ...member.user,
                        status,
                      },
                    }
                  : member,
              ),
            }
          : state.activeServer,
      servers: state.servers.map((server) =>
        server.id === serverId
          ? {
              ...server,
              members: server.members.map((member) =>
                member.userId === userId
                  ? {
                      ...member,
                      user: {
                        ...member.user,
                        status,
                      },
                    }
                  : member,
              ),
            }
          : server,
      ),
    }));
  },
}));
