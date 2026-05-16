import { cn } from '@/lib/utils';

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground',
        className,
      )}
    >
      {children}
    </span>
  );
}

