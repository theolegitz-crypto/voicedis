import type { Channel } from './channel';
import type { User } from './user';

export type ServerRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Role {
  id: string;
  name: string;
  color?: string | null;
  permissions: number;
  position: number;
}

export interface ServerMember {
  id: string;
  userId: string;
  serverId: string;
  role: ServerRole;
  joinedAt: string;
  user: User;
  customRole?: Role | null;
}

export interface Server {
  id: string;
  name: string;
  iconUrl?: string | null;
  ownerId: string;
  channels: Channel[];
  members: ServerMember[];
  roles?: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface Invite {
  id: string;
  code: string;
  expiresAt?: string | null;
  maxUses?: number | null;
  uses: number;
  isExpired?: boolean;
  isOverused?: boolean;
  server: Pick<Server, 'id' | 'name' | 'iconUrl'>;
}

