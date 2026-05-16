export type ChannelType = 'TEXT' | 'VOICE';

export interface Channel {
  id: string;
  serverId: string;
  name: string;
  description?: string | null;
  type: ChannelType;
  position: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

