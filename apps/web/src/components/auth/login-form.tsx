'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';

export function LoginForm() {
  const router = useRouter();
  const { login, loading } = useAuthStore();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await login({ email, password });
      router.replace('/');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in');
    }
  };

  return (
    <Card className="w-full max-w-md p-8">
      <div className="mb-6 space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary/80">
          Authentication
        </p>
        <h1 className="text-3xl font-semibold text-foreground">Sign in to your workspace</h1>
        <p className="text-sm text-muted-foreground">
          Demo seed credentials are prefilled so you can get into the app quickly.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        No account yet?{' '}
        <Link href="/auth/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </Card>
  );
}

