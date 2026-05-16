'use client';

import { useEffect, useRef, useState } from 'react';
import { SendHorizonal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MessageInputProps {
  disabled?: boolean;
  placeholder: string;
  onSend: (content: string) => Promise<void>;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export function MessageInput({
  disabled,
  placeholder,
  onSend,
  onTypingStart,
  onTypingStop,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const typingTimeout = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (typingTimeout.current) {
        window.clearTimeout(typingTimeout.current);
      }
    },
    [],
  );

  const handleTyping = (nextValue: string) => {
    setContent(nextValue);
    onTypingStart();

    if (typingTimeout.current) {
      window.clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = window.setTimeout(() => {
      onTypingStop();
    }, 1400);
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    await onSend(trimmed);
    setContent('');
    onTypingStop();
  };

  return (
    <div className="border-t border-border/70 bg-card/70 px-6 py-4">
      <div className="mx-auto flex max-w-4xl items-end gap-4 rounded-3xl border border-border bg-[#101828] p-4">
        <Textarea
          value={content}
          disabled={disabled}
          onChange={(event) => handleTyping(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder={placeholder}
          className="min-h-[72px] resize-none border-none bg-transparent px-0 py-0"
        />
        <Button onClick={() => void handleSubmit()} disabled={disabled || !content.trim()}>
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

