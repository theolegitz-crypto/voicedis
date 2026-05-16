'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
import type { Invite, Server } from '@/types/server';

export default function InvitePage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { token, initialized } = useAuthStore();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    void (async () => {
      try {
        const payload = await apiFetch<Invite>(`/invites/${params.code}`, { token });
        setInvite(payload);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Invite not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [initialized, params.code, router, token]);

  const acceptInvite = async () => {
    if (!token) {
      return;
    }

    const server = await apiFetch<Server>(`/invites/${params.code}/accept`, {
      method: 'POST',
      token,
    });
    const textChannel = server.channels.find((channel) => channel.type === 'TEXT');
    if (textChannel) {
      router.replace(`/servers/${server.id}/channels/${textChannel.id}`);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-xl p-8">
        {loading ? (
          <p className="text-muted-foreground">Loading invite...</p>
        ) : error ? (
          <p className="text-danger">{error}</p>
        ) : invite ? (
          <>
            <p className="text-sm uppercase tracking-[0.24em] text-primary/80">Invite</p>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">
              Join {invite.server.name}
            </h1>
            <p className="mt-3 text-muted-foreground">
              Code: <span className="font-medium text-foreground">{invite.code}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {invite.isExpired
                ? 'This invite has expired.'
                : invite.isOverused
                  ? 'This invite reached its maximum uses.'
                  : 'This invite is ready to be accepted.'}
            </p>
            <Button
              className="mt-6"
              onClick={() => void acceptInvite()}
              disabled={invite.isExpired || invite.isOverused}
            >
              Accept invite
            </Button>
          </>
        ) : null}
      </Card>
    </main>
  );
}
