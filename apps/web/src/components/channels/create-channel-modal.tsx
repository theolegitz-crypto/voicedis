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

interface CreateChannelModalProps {
  onCreate: (payload: { name: string; type: 'TEXT' | 'VOICE'; description?: string }) => Promise<void>;
}

export function CreateChannelModal({ onCreate }: CreateChannelModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'TEXT' | 'VOICE'>('TEXT');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await onCreate({
        name,
        type,
        description: description || undefined,
      });
      setName('');
      setDescription('');
      setType('TEXT');
      setOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create channel');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 w-9 rounded-xl px-0" variant="secondary">
          +
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create channel</DialogTitle>
          <DialogDescription>
            Add a new text flow or spin up a lightweight voice room for the server.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('TEXT')}
              className={`rounded-xl border px-4 py-3 text-sm ${type === 'TEXT' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-accent/40 text-foreground'}`}
            >
              Text
            </button>
            <button
              type="button"
              onClick={() => setType('VOICE')}
              className={`rounded-xl border px-4 py-3 text-sm ${type === 'VOICE' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-accent/40 text-foreground'}`}
            >
              Voice
            </button>
          </div>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Channel name" />
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description (optional)"
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button className="w-full" type="submit">
            Create channel
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

