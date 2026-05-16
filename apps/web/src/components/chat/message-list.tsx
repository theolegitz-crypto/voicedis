'use client';

import { useEffect, useRef } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Message } from '@/types/message';

interface MessageListProps {
  channelName?: string;
  messages: Message[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => Promise<void>;
  typingUsers: string[];
}

export function MessageList({
  channelName,
  messages,
  hasMore,
  loading,
  onLoadMore,
  typingUsers,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialScrollDone = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initialScrollDone.current) {
      return;
    }

    containerRef.current.scrollTop = containerRef.current.scrollHeight;
    initialScrollDone.current = true;
  }, [messages.length]);

  useEffect(() => {
    initialScrollDone.current = false;
  }, [channelName]);

  const handleScroll = async () => {
    const container = containerRef.current;
    if (!container || !hasMore || loading) {
      return;
    }

    if (container.scrollTop < 56) {
      const previousHeight = container.scrollHeight;
      await onLoadMore();
      requestAnimationFrame(() => {
        if (!containerRef.current) {
          return;
        }

        containerRef.current.scrollTop = containerRef.current.scrollHeight - previousHeight;
      });
    }
  };

  return (
    <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="rounded-3xl border border-border bg-accent/35 p-5">
          <Badge>#{channelName ?? 'channel'}</Badge>
          <h3 className="mt-3 text-2xl font-semibold text-foreground">
            Welcome to {channelName ?? 'this room'}
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Message history is paginated from PostgreSQL and live updates arrive through Socket.IO.
          </p>
        </div>

        {hasMore ? (
          <div className="flex justify-center">
            <button
              className="rounded-full bg-accent px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"
              onClick={() => void onLoadMore()}
            >
              Load older messages
            </button>
          </div>
        ) : null}

        {messages.map((message) => (
          <article key={message.id} className="flex gap-4 rounded-2xl px-2 py-2 transition hover:bg-accent/40">
            <Avatar
              src={message.author.avatarUrl}
              alt={message.author.displayName}
              fallback={message.author.displayName}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-3">
                <p className="font-medium text-foreground">{message.author.displayName}</p>
                <time className="text-xs text-muted-foreground">
                  {new Date(message.createdAt).toLocaleString()}
                </time>
              </div>
              {message.deletedAt ? (
                <p className="mt-1 text-sm italic text-muted-foreground">Message deleted</p>
              ) : (
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">
                  {message.content}
                </p>
              )}
            </div>
          </article>
        ))}

        {typingUsers.length ? (
          <div className="px-2 text-sm text-muted-foreground">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        ) : null}
      </div>
    </div>
  );
}
