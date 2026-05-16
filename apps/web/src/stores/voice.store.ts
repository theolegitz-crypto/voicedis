'use client';

import { create } from 'zustand';
import type { User } from '@/types/user';

export interface VoiceParticipant {
  user: User;
  muted: boolean;
}

interface VoiceState {
  activeChannelId: string | null;
  connected: boolean;
  muted: boolean;
  participants: VoiceParticipant[];
  setActiveVoice: (channelId: string, participants: VoiceParticipant[]) => void;
  clear: () => void;
  setMuted: (muted: boolean) => void;
  upsertParticipant: (participant: VoiceParticipant) => void;
  removeParticipant: (userId: string) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  activeChannelId: null,
  connected: false,
  muted: false,
  participants: [],
  setActiveVoice: (channelId, participants) =>
    set({
      activeChannelId: channelId,
      connected: true,
      participants,
    }),
  clear: () =>
    set({
      activeChannelId: null,
      connected: false,
      muted: false,
      participants: [],
    }),
  setMuted: (muted) => set({ muted }),
  upsertParticipant: (participant) =>
    set((state) => ({
      participants: state.participants.some((entry) => entry.user.id === participant.user.id)
        ? state.participants.map((entry) =>
            entry.user.id === participant.user.id ? participant : entry,
          )
        : [...state.participants, participant],
    })),
  removeParticipant: (userId) =>
    set((state) => ({
      participants: state.participants.filter((entry) => entry.user.id !== userId),
    })),
}));

