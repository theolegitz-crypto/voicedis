'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useServerStore } from '@/stores/server.store';

export default function ServerPage({ params }: { params: { serverId: string } }) {
  const router = useRouter();
  const { token, initialized } = useAuthStore();
  const { fetchServer, activeServer } = useServerStore();

  useEffect(() => {
    if (!token) {
      return;
    }

    void fetchServer(token, params.serverId);
  }, [fetchServer, params.serverId, token]);

  useEffect(() => {
    if (!activeServer || activeServer.id !== params.serverId) {
      return;
    }

    const textChannel =
      activeServer.channels.find((channel) => channel.type === 'TEXT') ?? activeServer.channels[0];

    if (textChannel?.type === 'TEXT') {
      router.replace(`/servers/${params.serverId}/channels/${textChannel.id}`);
    }
  }, [activeServer, params.serverId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      {initialized ? 'Opening server...' : 'Loading...'}
    </div>
  );
}

