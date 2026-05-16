'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth.store';
import type { User } from '@/types/user';

export default function SettingsPage() {
  const router = useRouter();
  const { user, token, setUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [status, setStatus] = useState<User['status']>(user?.status ?? 'ONLINE');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user || !token) {
    return null;
  }

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const updated = await apiFetch<User>('/users/me', {
        method: 'PATCH',
        token,
        body: {
          displayName,
          avatarUrl: avatarUrl || undefined,
          status,
        },
      });

      setUser(updated);
      setMessage('Profile updated');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-primary/80">Profile settings</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Update your account</h1>
        <form className="mt-8 space-y-4" onSubmit={handleSave}>
          <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" />
          <Input value={avatarUrl ?? ''} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="Avatar URL" />
          <div className="grid grid-cols-4 gap-3">
            {(['ONLINE', 'IDLE', 'DND', 'OFFLINE'] as User['status'][]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStatus(option)}
                className={`rounded-xl border px-4 py-3 text-sm ${status === option ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-accent/40 text-foreground'}`}
              >
                {option}
              </button>
            ))}
          </div>
          {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
