'use client';

import { Mic, MicOff, PhoneOff, RadioTower } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { Channel } from '@/types/channel';
import type { VoiceParticipant } from '@/stores/voice.store';

interface VoicePanelProps {
  channel?: Channel;
  connected: boolean;
  muted: boolean;
  participants: VoiceParticipant[];
  error?: string | null;
  onToggleMute: () => void;
  onLeave: () => Promise<void>;
}

export function VoicePanel({
  channel,
  connected,
  muted,
  participants,
  error,
  onToggleMute,
  onLeave,
}: VoicePanelProps) {
  return (
    <div className="border-t border-border/70 bg-[#0f1728]/90 px-4 py-4">
      <div className="rounded-3xl border border-primary/20 bg-primary/8 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <RadioTower className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.24em]">
                {connected ? 'Voice connected' : 'Voice idle'}
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              {channel ? channel.name : 'No active voice room'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Mesh WebRTC is fine for small rooms. Production should move to an SFU.
            </p>
            {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
          </div>

          {connected ? (
            <div className="flex gap-2">
              <Button variant="secondary" className="h-10 w-10 rounded-2xl px-0" onClick={onToggleMute}>
                {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button variant="danger" className="h-10 w-10 rounded-2xl px-0" onClick={() => void onLeave()}>
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {participants.map((participant) => (
            <div key={participant.user.id} className="flex items-center gap-3 rounded-2xl bg-black/20 px-3 py-2">
              <Avatar
                src={participant.user.avatarUrl}
                alt={participant.user.displayName}
                fallback={participant.user.displayName}
                className="h-9 w-9"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{participant.user.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {participant.muted ? 'Muted' : 'Listening'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
