'use client';

import Link from 'next/link';
import { LogOut, Settings } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/user';

interface UserPanelProps {
  user: User;
  onLogout: () => void;
}

export function UserPanel({ user, onLogout }: UserPanelProps) {
  return (
    <div className="border-t border-border/70 bg-card/70 px-4 py-4">
      <div className="flex items-center gap-3 rounded-2xl bg-accent/45 px-3 py-3">
        <Avatar src={user.avatarUrl} alt={user.displayName} fallback={user.displayName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{user.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <Button variant="ghost" className="h-9 w-9 rounded-xl px-0" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
