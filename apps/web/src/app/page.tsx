'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreateServerModal } from '@/components/servers/create-server-modal';
import { useAuthStore } from '@/stores/auth.store';
import { useServerStore } from '@/stores/server.store';

export default function HomePage() {
  const router = useRouter();
  const { initialized, token, user, logout } = useAuthStore();
  const { servers, fetchServers, createServer } = useServerStore();

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    void fetchServers(token);
  }, [fetchServers, initialized, router, token]);

  useEffect(() => {
    if (!servers.length) {
      return;
    }

    const firstServer = servers[0];
    const firstTextChannel =
      firstServer.channels.find((channel) => channel.type === 'TEXT') ?? firstServer.channels[0];

    if (firstTextChannel) {
      router.replace(`/servers/${firstServer.id}/channels/${firstTextChannel.id}`);
    }
  }, [router, servers]);

  if (!initialized || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading workspace...</div>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-10">
        <p className="text-sm uppercase tracking-[0.28em] text-primary/80">MVP launchpad</p>
        <h1 className="mt-3 text-4xl font-semibold text-foreground">
          {user.displayName}, your workspace is empty for now.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Create the first server and the app will open its default text and voice channels
          automatically.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <CreateServerModal
            onCreate={async (payload) => {
              if (!token) {
                return;
              }

              const server = await createServer(token, payload);
              const textChannel = server.channels.find((channel) => channel.type === 'TEXT');
              if (textChannel) {
                router.push(`/servers/${server.id}/channels/${textChannel.id}`);
              }
            }}
          />
          <Button variant="ghost" onClick={() => logout()}>
            Sign out
          </Button>
        </div>
      </Card>
    </main>
  );
}

