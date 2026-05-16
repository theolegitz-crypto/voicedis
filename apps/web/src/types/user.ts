export type UserStatus = 'ONLINE' | 'OFFLINE' | 'IDLE' | 'DND';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

