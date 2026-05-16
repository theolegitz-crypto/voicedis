'use client';

import { Hash, Plus, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Channel } from '@/types/channel';
import { CreateChannelModal } from './create-channel-modal';

interface ChannelSidebarProps {
  channels: Channel[];
  activeChannelId?: string;
  activeVoiceChannelId?: string | null;
  canManageChannels: boolean;
  onSelectTextChannel: (channelId: string) => void;
  onJoinVoiceChannel: (channelId: string) => void;
  onCreateChannel: (payload: { name: string; type: 'TEXT' | 'VOICE'; description?: string }) => Promise<void>;
}

export function ChannelSidebar({
  channels,
  activeChannelId,
  activeVoiceChannelId,
  canManageChannels,
  onSelectTextChannel,
  onJoinVoiceChannel,
  onCreateChannel,
}: ChannelSidebarProps) {
  const textChannels = channels.filter((channel) => channel.type === 'TEXT');
  const voiceChannels = channels.filter((channel) => channel.type === 'VOICE');

  return (
    <aside className="flex h-full w-[280px] flex-col border-r border-border/70 bg-card/70">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Channels</p>
          <h2 className="text-lg font-semibold text-foreground">Workspace</h2>
        </div>
        {canManageChannels ? <CreateChannelModal onCreate={onCreateChannel} /> : null}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SectionTitle icon={<Hash className="h-4 w-4" />} label="Text channels" />
        <div className="mt-2 space-y-1">
          {textChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onSelectTextChannel(channel.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-accent/70',
                activeChannelId === channel.id && 'bg-primary/10 text-primary',
              )}
            >
              <Hash className="h-4 w-4" />
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
        </div>

        <SectionTitle className="mt-6" icon={<Volume2 className="h-4 w-4" />} label="Voice rooms" />
        <div className="mt-2 space-y-1">
          {voiceChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onJoinVoiceChannel(channel.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-accent/70',
                activeVoiceChannelId === channel.id && 'bg-primary/10 text-primary',
              )}
            >
              <Volume2 className="h-4 w-4" />
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function SectionTitle({
  icon,
  label,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between px-2 text-xs uppercase tracking-[0.2em] text-muted-foreground', className)}>
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
      <Plus className="h-3.5 w-3.5 opacity-0" />
    </div>
  );
}

