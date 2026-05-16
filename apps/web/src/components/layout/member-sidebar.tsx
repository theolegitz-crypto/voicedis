'use client';

import { Avatar } from '@/components/ui/avatar';
import type { ServerMember } from '@/types/server';

export function MemberSidebar({ members }: { members: ServerMember[] }) {
  return (
    <aside className="hidden h-full w-[280px] border-l border-border/70 bg-card/60 xl:block">
      <div className="border-b border-border/70 px-5 py-4">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Members</p>
        <h2 className="text-lg font-semibold text-foreground">{members.length} online space</h2>
      </div>
      <div className="space-y-3 overflow-y-auto px-4 py-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-accent/45">
            <div className="relative">
              <Avatar
                src={member.user.avatarUrl}
                alt={member.user.displayName}
                fallback={member.user.displayName}
              />
              <span
                className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card ${
                  member.user.status === 'ONLINE'
                    ? 'bg-emerald-400'
                    : member.user.status === 'IDLE'
                      ? 'bg-amber-400'
                      : member.user.status === 'DND'
                        ? 'bg-rose-400'
                        : 'bg-slate-500'
                }`}
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {member.user.displayName}
              </p>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {member.role}
              </p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

