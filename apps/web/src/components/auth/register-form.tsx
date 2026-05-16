'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth.store';

export function RegisterForm() {
  const router = useRouter();
  const { register, loading } = useAuthStore();
  const [form, setForm] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    avatarUrl: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await register({
        ...form,
        avatarUrl: form.avatarUrl || undefined,
      });
      router.replace('/');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to register');
    }
  };

  return (
    <Card className="w-full max-w-md p-8">
      <div className="mb-6 space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary/80">
          New account
        </p>
        <h1 className="text-3xl font-semibold text-foreground">Create your chat identity</h1>
        <p className="text-sm text-muted-foreground">
          Registration returns a JWT immediately, so the app opens right after sign-up.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          placeholder="Email"
        />
        <Input
          value={form.username}
          onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
          placeholder="Username"
        />
        <Input
          value={form.displayName}
          onChange={(event) =>
            setForm((current) => ({ ...current, displayName: event.target.value }))
          }
          placeholder="Display name"
        />
        <Input
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          placeholder="Password"
        />
        <Input
          value={form.avatarUrl}
          onChange={(event) => setForm((current) => ({ ...current, avatarUrl: event.target.value }))}
          placeholder="Avatar URL (optional)"
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Already registered?{' '}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}

