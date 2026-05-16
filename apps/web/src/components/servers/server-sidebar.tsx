'use client';

import { useRouter } from 'next/navigation';
import { Hash, Volume2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Server } from '@/types/server';
import { CreateServerModal } from './create-server-modal';

interface ServerSidebarProps {
  servers: Server[];
  activeServerId?: string;
  onCreateServer: (payload: { name: string; iconUrl?: string }) => Promise<void>;
}

export function ServerSidebar({
  servers,
  activeServerId,
  onCreateServer,
}: ServerSidebarProps) {
  const router = useRouter();

  const navigateToServer = (server: Server) => {
    const defaultChannel =
      server.channels.find((channel) => channel.type === 'TEXT') ?? server.channels[0];

    if (defaultChannel?.type === 'TEXT') {
      router.push(`/servers/${server.id}/channels/${defaultChannel.id}`);
      return;
    }

    router.push(`/servers/${server.id}`);
  };

  return (
    <aside className="flex h-full w-[88px] flex-col items-center gap-4 border-r border-border/70 bg-[#0b1220]/90 px-4 py-6">
      <div className="mb-2 rounded-[1.7rem] bg-primary/15 p-3 text-primary shadow-soft">
        <Hash className="h-6 w-6" />
      </div>

      <div className="flex flex-1 flex-col items-center gap-3 overflow-y-auto">
        {servers.map((server) => (
          <button
            key={server.id}
            onClick={() => navigateToServer(server)}
            className={cn(
              'group relative flex h-14 w-14 items-center justify-center rounded-[1.5rem] border border-transparent transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent',
              activeServerId === server.id && 'border-primary/60 bg-accent',
            )}
            title={server.name}
          >
            {server.iconUrl ? (
              <Avatar src={server.iconUrl} alt={server.name} fallback={server.name} className="h-14 w-14 rounded-[1.5rem]" />
            ) : (
              <span className="text-lg font-semibold text-foreground">
                {server.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <CreateServerModal onCreate={onCreateServer} />
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-accent/60 text-muted-foreground">
          <Volume2 className="h-5 w-5" />
        </div>
      </div>
    </aside>
  );
}

