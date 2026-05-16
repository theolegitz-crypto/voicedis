'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface CreateServerModalProps {
  onCreate: (payload: { name: string; iconUrl?: string }) => Promise<void>;
}

export function CreateServerModal({ onCreate }: CreateServerModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await onCreate({
        name,
        iconUrl: iconUrl || undefined,
      });
      setName('');
      setIconUrl('');
      setOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create server');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-14 w-14 rounded-[1.5rem] text-xl" variant="secondary">
          +
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create server</DialogTitle>
          <DialogDescription>
            Start with a text channel and a voice lounge, then invite the rest of the team.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Server name" />
          <Input
            value={iconUrl}
            onChange={(event) => setIconUrl(event.target.value)}
            placeholder="Icon URL (optional)"
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button className="w-full" type="submit">
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

