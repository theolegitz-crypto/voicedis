import type { User } from './user';

export interface MessageAttachment {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  type: 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO';
}

export interface Message {
  id: string;
  content: string;
  authorId: string;
  channelId: string;
  serverId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  author: User;
  attachments: MessageAttachment[];
}

export interface PaginatedMessages {
  items: Message[];
  nextCursor: string | null;
}

